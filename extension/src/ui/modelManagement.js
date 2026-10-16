// modelManagement.js - Model Management Logic

// Transformers.js loader using sandboxed iframe
let transformersIframe = null;
let transformersReady = false;
let messageId = 0;
let pendingMessages = new Map();

/**
 * Initialize the sandboxed iframe for Transformers.js
 */
function initTransformersIframe() {
  if (transformersIframe) {
    return transformersIframe;
  }
  
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('src/ui/transformersLoader.html');
    iframe.style.display = 'none';
    iframe.sandbox = 'allow-scripts allow-same-origin';
    
    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
      if (event.source !== iframe.contentWindow) return;
      
      const { type, messageId: msgId, success, error, result, progress, model } = event.data;
      
      if (type === 'TRANSFORMERS_READY') {
        console.log('Transformers.js ready in sandbox');
        transformersReady = true;
        resolve(iframe);
      } else if (type === 'TRANSFORMERS_ERROR') {
        console.error('Transformers.js error:', error);
        reject(new Error(error));
      } else if (type === 'MODEL_LOADED' || type === 'INFERENCE_RESULT' || type === 'MODEL_PROGRESS') {
        const handler = pendingMessages.get(msgId);
        if (handler) {
          if (type === 'MODEL_PROGRESS') {
            handler.onProgress && handler.onProgress(progress);
          } else {
            if (success) {
              handler.resolve(result || { success: true, model });
            } else {
              handler.reject(new Error(error));
            }
            if (type !== 'MODEL_PROGRESS') {
              pendingMessages.delete(msgId);
            }
          }
        }
      }
    });
    
    document.body.appendChild(iframe);
    transformersIframe = iframe;
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!transformersReady) {
        reject(new Error('Transformers.js load timeout'));
      }
    }, 30000);
  });
}

/**
 * Send message to sandboxed iframe
 */
function sendToTransformers(type, data, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!transformersIframe) {
        await initTransformersIframe();
      }
      
      const msgId = messageId++;
      pendingMessages.set(msgId, { resolve, reject, onProgress });
      
      transformersIframe.contentWindow.postMessage({
        type,
        messageId: msgId,
        ...data
      }, '*');
      
      // Timeout after 5 minutes for model downloads
      setTimeout(() => {
        if (pendingMessages.has(msgId)) {
          pendingMessages.delete(msgId);
          reject(new Error('Operation timeout'));
        }
      }, 300000);
      
    } catch (error) {
      reject(error);
    }
  });
}

// Available models configuration
const MODELS = [
  {
    id: 'lamini-flan-t5',
    name: 'LaMini-Flan-T5-783M',
    fullName: 'Xenova/LaMini-Flan-T5-783M',
    task: 'text2text-generation',
    description: 'Efficient text-to-text model optimized for fact extraction and summarization. Runs smoothly with WebGPU acceleration.',
    size: '~783MB',
    requiredMemory: '2GB',
    supportsWebGPU: true,
    recommended: true
  },
  {
    id: 'flan-t5-small',
    name: 'FLAN-T5-Small',
    fullName: 'Xenova/flan-t5-small',
    task: 'text2text-generation',
    description: 'Lightweight text-to-text model from Google. Very fast inference, good for quick memory extraction on low-end devices.',
    size: '~242MB',
    requiredMemory: '1GB',
    supportsWebGPU: true,
    recommended: false
  },
  {
    id: 'flan-t5-base',
    name: 'FLAN-T5-Base',
    fullName: 'Xenova/flan-t5-base',
    task: 'text2text-generation',
    description: 'Medium-sized instruction-tuned model. Balanced performance and accuracy for structured extraction tasks.',
    size: '~990MB',
    requiredMemory: '2.5GB',
    supportsWebGPU: true,
    recommended: false
  },
];

// Model status tracking
let modelStates = {};
let activeModel = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Model Management: Initializing...');
  
  // Load saved states from chrome.storage
  await loadModelStates();
  
  // Render models
  renderModels();
  
  // Setup back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.close();
  });
  
  // Check WebGPU support
  checkWebGPUSupport();
});

/**
 * Load model states from chrome storage
 */
async function loadModelStates() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['modelStates', 'activeModel'], (result) => {
      modelStates = result.modelStates || {};
      activeModel = result.activeModel || null;
      
      // Initialize default states for models that don't have one
      MODELS.forEach(model => {
        if (!modelStates[model.id]) {
          modelStates[model.id] = {
            status: 'not-downloaded', // not-downloaded, downloading, downloaded, loaded, error
            progress: 0,
            downloadedAt: null,
            lastUsed: null,
            error: null
          };
        }
      });
      
      resolve();
    });
  });
}

/**
 * Save model states to chrome storage
 */
async function saveModelStates() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ 
      modelStates: modelStates,
      activeModel: activeModel 
    }, resolve);
  });
}

/**
 * Check if WebGPU is supported
 */
async function checkWebGPUSupport() {
  if (!navigator.gpu) {
    console.warn('WebGPU is not supported in this browser');
    // Show warning banner
    const infoBox = document.querySelector('.info-box');
    infoBox.style.backgroundColor = '#4d2a2a';
    infoBox.style.borderColor = '#5f3535';
    infoBox.querySelector('.info-icon').textContent = '⚠️';
    infoBox.querySelector('.info-text').textContent = 
      'WebGPU is not supported in your browser. Models may run slower. Please use Chrome/Edge 113+ or enable WebGPU flags.';
  } else {
    console.log('WebGPU is supported!');
  }
}

/**
 * Render all models
 */
function renderModels() {
  const container = document.getElementById('modelsList');
  container.innerHTML = '';
  
  MODELS.forEach(model => {
    const modelCard = createModelCard(model);
    container.appendChild(modelCard);
  });
}

/**
 * Create a model card element
 */
function createModelCard(model) {
  const state = modelStates[model.id];
  const card = document.createElement('div');
  card.className = 'model-card';
  card.id = `model-${model.id}`;
  
  card.innerHTML = `
    <div class="model-header">
      <div class="model-info">
        <div class="model-name">${model.name}</div>
        <span class="model-task">${model.task}</span>
      </div>
      <span class="status-badge ${state.status}">
        <span class="status-indicator ${getStatusColor(state.status)}"></span>
        ${getStatusText(state.status)}
      </span>
    </div>
    
    <div class="model-description">${model.description}</div>
    
    ${state.status === 'downloading' ? `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${state.progress}%"></div>
      </div>
      <div class="progress-text">Downloading... ${state.progress}%</div>
    ` : ''}
    
    ${state.error ? `
      <div style="margin-top: 12px; padding: 8px 12px; background-color: #4d2a2a; border-radius: 6px; font-size: 12px; color: #ff6b6b;">
        <strong>Error:</strong> ${state.error}
      </div>
    ` : ''}
    
    <div class="model-stats">
      <div class="stat-item">
        <span class="stat-label">Size</span>
        <span class="stat-value">${model.size}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Memory</span>
        <span class="stat-value">${model.requiredMemory}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">WebGPU</span>
        <span class="stat-value">${model.supportsWebGPU ? '✓ Yes' : '✗ No'}</span>
      </div>
    </div>
    
    <div class="model-actions">
      ${getActionButtons(model, state)}
    </div>
  `;
  
  // Attach event listeners
  attachEventListeners(card, model, state);
  
  return card;
}

/**
 * Get action buttons based on model state
 */
function getActionButtons(model, state) {
  switch (state.status) {
    case 'not-downloaded':
      return `
        <button class="btn btn-primary" data-action="download" data-model="${model.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Download Model
        </button>
      `;
    
    case 'downloading':
      return `
        <button class="btn btn-secondary" disabled>
          <div class="spinner"></div>
          Downloading...
        </button>
        <button class="btn btn-danger" data-action="cancel" data-model="${model.id}">
          Cancel
        </button>
      `;
    
    case 'downloaded':
      const isActive = activeModel === model.id;
      return `
        ${!isActive ? `
          <button class="btn btn-primary" data-action="set-active" data-model="${model.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            Set as Active
          </button>
        ` : `
          <button class="btn btn-primary" disabled style="opacity: 1; background: #1f3d2e; color: #38e078;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            ✓ Active Model
          </button>
        `}
        <button class="btn btn-danger" data-action="delete" data-model="${model.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      `;
    
    case 'loaded':
      const isActiveLoaded = activeModel === model.id;
      return `
        <button class="btn btn-secondary" data-action="unload" data-model="${model.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="6" width="12" height="12"/>
          </svg>
          Unload Model
        </button>
        ${!isActiveLoaded ? `
          <button class="btn btn-primary" data-action="set-active" data-model="${model.id}">
            Set as Active
          </button>
        ` : `
          <button class="btn btn-primary" disabled style="opacity: 1; background: #1f3d2e; color: #38e078;">
            ✓ Active
          </button>
        `}
      `;
    
    case 'error':
      return `
        <button class="btn btn-primary" data-action="retry" data-model="${model.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Retry Download
        </button>
        <button class="btn btn-danger" data-action="clear-error" data-model="${model.id}">
          Clear
        </button>
      `;
    
    default:
      return '';
  }
}

/**
 * Attach event listeners to action buttons
 */
function attachEventListeners(card, model, state) {
  const buttons = card.querySelectorAll('[data-action]');
  buttons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      const modelId = e.currentTarget.getAttribute('data-model');
      
      console.log(`Action: ${action} for model: ${modelId}`);
      
      switch (action) {
        case 'download':
        case 'retry':
          await downloadModel(modelId);
          break;
        case 'cancel':
          await cancelDownload(modelId);
          break;
        case 'load':
          await loadModel(modelId);
          break;
        case 'unload':
          await unloadModel(modelId);
          break;
        case 'set-active':
          await setActiveModel(modelId);
          break;
        case 'delete':
          await deleteModel(modelId);
          break;
        case 'clear-error':
          await clearError(modelId);
          break;
      }
    });
  });
}

/**
 * Download a model
 */
async function downloadModel(modelId) {
  console.log(`Downloading model: ${modelId}`);
  
  // Update state
  modelStates[modelId].status = 'downloading';
  modelStates[modelId].progress = 0;
  modelStates[modelId].error = null;
  await saveModelStates();
  renderModels();
  
  try {
    const model = MODELS.find(m => m.id === modelId);
    
    console.log(`Loading pipeline: ${model.task} with model: ${model.fullName}`);
    
    // Load model in sandboxed iframe with progress callback
    await sendToTransformers('LOAD_MODEL', {
      task: model.task,
      model: model.fullName
    }, (progress) => {
      // Update progress from actual download
      if (progress && progress.progress !== undefined) {
        const percent = Math.round(progress.progress);
        modelStates[modelId].progress = percent;
        updateProgressBar(modelId, percent);
      }
    });
    
    // Update state to downloaded and loaded
    modelStates[modelId].status = 'loaded';
    modelStates[modelId].progress = 100;
    modelStates[modelId].downloadedAt = Date.now();
    modelStates[modelId].lastUsed = Date.now();
    activeModel = modelId;
    await saveModelStates();
    
    console.log(`Model ${modelId} downloaded and loaded successfully!`);
    renderModels();
    
    // Send message to background/content scripts
    chrome.runtime.sendMessage({
      type: 'MODEL_LOADED',
      modelId: modelId,
      modelName: model.fullName
    });
    
  } catch (error) {
    console.error(`Error downloading model ${modelId}:`, error);
    modelStates[modelId].status = 'error';
    modelStates[modelId].error = error.message || 'Download failed';
    modelStates[modelId].progress = 0;
    await saveModelStates();
    renderModels();
  }
}

/**
 * Load a model into memory
 */
async function loadModel(modelId) {
  console.log(`Loading model: ${modelId}`);
  
  // Unload current model if any
  if (activeModel && activeModel !== modelId) {
    await unloadModel(activeModel);
  }
  
  try {
    const model = MODELS.find(m => m.id === modelId);
    
    // Load model in sandboxed iframe
    await sendToTransformers('LOAD_MODEL', {
      task: model.task,
      model: model.fullName
    }, (progress) => {
      console.log('Loading progress:', progress);
    });
    
    // Update state
    modelStates[modelId].status = 'loaded';
    modelStates[modelId].lastUsed = Date.now();
    activeModel = modelId;
    
    await saveModelStates();
    
    // Send message to background/content scripts
    chrome.runtime.sendMessage({
      type: 'MODEL_LOADED',
      modelId: modelId,
      modelName: model.fullName
    });
    
    console.log(`Model ${modelId} loaded successfully!`);
    renderModels();
    
  } catch (error) {
    console.error(`Error loading model ${modelId}:`, error);
    modelStates[modelId].status = 'error';
    modelStates[modelId].error = 'Failed to load model: ' + error.message;
    await saveModelStates();
    renderModels();
  }
}

/**
 * Unload a model from memory
 */
async function unloadModel(modelId) {
  console.log(`Unloading model: ${modelId}`);
  
  modelStates[modelId].status = 'downloaded';
  if (activeModel === modelId) {
    activeModel = null;
  }
  
  await saveModelStates();
  
  // Send message to background/content scripts
  chrome.runtime.sendMessage({
    type: 'MODEL_UNLOADED',
    modelId: modelId
  });
  
  renderModels();
}

/**
 * Delete a downloaded model
 */
async function deleteModel(modelId) {
  if (!confirm('Are you sure you want to delete this model? You will need to download it again.')) {
    return;
  }
  
  console.log(`Deleting model: ${modelId}`);
  
  // Unload if currently loaded
  if (activeModel === modelId) {
    await unloadModel(modelId);
  }
  
  // Reset state
  modelStates[modelId] = {
    status: 'not-downloaded',
    progress: 0,
    downloadedAt: null,
    lastUsed: null,
    error: null
  };
  
  await saveModelStates();
  
  // Note: Transformers.js caches models in browser cache
  // To fully delete, we'd need to clear the cache programmatically
  // For now, we just reset the state
  
  console.log(`Model ${modelId} deleted!`);
  renderModels();
}

/**
 * Cancel an ongoing download
 */
async function cancelDownload(modelId) {
  console.log(`Canceling download: ${modelId}`);
  
  modelStates[modelId].status = 'not-downloaded';
  modelStates[modelId].progress = 0;
  modelStates[modelId].error = null;
  
  await saveModelStates();
  renderModels();
}

/**
 * Clear error state
 */
async function clearError(modelId) {
  modelStates[modelId].status = 'not-downloaded';
  modelStates[modelId].error = null;
  await saveModelStates();
  renderModels();
}

/**
 * Set active model (for inference)
 */
async function setActiveModel(modelId) {
  console.log(`Setting active model: ${modelId}`);
  
  const previousActive = activeModel;
  
  // Update active model
  activeModel = modelId;
  await saveModelStates();
  
  // Notify background script that active model changed
  chrome.runtime.sendMessage({
    type: 'ACTIVE_MODEL_CHANGED',
    modelId: modelId,
    previousModel: previousActive
  });
  
  console.log(`Active model set to: ${modelId}`);
  renderModels();
}

/**
 * Update progress bar in real-time
 */
function updateProgressBar(modelId, progress) {
  const card = document.getElementById(`model-${modelId}`);
  if (!card) return;
  
  const progressFill = card.querySelector('.progress-fill');
  const progressText = card.querySelector('.progress-text');
  
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
  
  if (progressText) {
    progressText.textContent = `Downloading... ${progress}%`;
  }
}

/**
 * Get status color for indicator
 */
function getStatusColor(status) {
  switch (status) {
    case 'not-downloaded': return 'orange';
    case 'downloading': return 'blue';
    case 'downloaded': return 'green';
    case 'loaded': return 'green';
    case 'error': return 'red';
    default: return 'orange';
  }
}

/**
 * Get status text
 */
function getStatusText(status) {
  switch (status) {
    case 'not-downloaded': return 'Not Downloaded';
    case 'downloading': return 'Downloading';
    case 'downloaded': return 'Downloaded';
    case 'loaded': return 'Loaded & Ready';
    case 'error': return 'Error';
    default: return 'Unknown';
  }
}
