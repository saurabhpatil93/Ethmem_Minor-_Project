/**
 * Unified Model Inference Service
 * Manages single active model for all inference tasks (extraction, ranking, etc.)
 * Ensures proper VRAM management - only one model loaded at a time
 */

class ModelInferenceService {
  constructor() {
    this.activeModel = null;
    this.modelInstance = null;
    this.isLoading = false;
    this.transformersIframe = null;
    this.transformersReady = false;
    this.pendingMessages = new Map();
    this.messageId = 0;
    this.iframeReadyResolve = null;
    this.iframeReadyReject = null;
    
    // Set up global message listener for transformers iframe
    this.setupGlobalListener();
  }

  /**
   * Setup global listener for transformers iframe messages
   */
  setupGlobalListener() {
    window.addEventListener('message', (event) => {
      // Check if this is a message from the transformers iframe
      // Use ID check since iframe reference might not be set yet
      const iframe = document.getElementById('ethmem-transformers-iframe');
      if (!iframe || event.source !== iframe.contentWindow) {
        return;
      }
      
      // Store iframe reference if not already set
      if (!this.transformersIframe) {
        this.transformersIframe = iframe;
      }
      
      const { type, messageId: msgId, success, error, result, progress, model } = event.data;
      
      if (type === 'TRANSFORMERS_READY') {
        console.log('[ModelInferenceService] Transformers.js ready');
        this.transformersReady = true;
        if (this.iframeReadyResolve) {
          this.iframeReadyResolve(this.transformersIframe);
          this.iframeReadyResolve = null;
          this.iframeReadyReject = null;
        }
      } else if (type === 'TRANSFORMERS_ERROR') {
        console.error('[ModelInferenceService] Transformers error:', error);
        if (this.iframeReadyReject) {
          this.iframeReadyReject(new Error(error));
          this.iframeReadyResolve = null;
          this.iframeReadyReject = null;
        }
      } else if (type === 'MODEL_LOADED' || type === 'INFERENCE_RESULT' || type === 'MODEL_PROGRESS' || type === 'MODEL_UNLOADED') {
        const handler = this.pendingMessages.get(msgId);
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
              this.pendingMessages.delete(msgId);
            }
          }
        }
      }
    });
  }

  /**
   * Initialize the service
   * Note: This runs in page context, cannot access chrome.storage
   */
  async initialize() {
    console.log('[ModelInferenceService] Initializing...');
    
    // Active model will be set when inference is requested
    console.log('[ModelInferenceService] Ready for inference requests');
    
    return true;
  }

  /**
   * Initialize sandboxed iframe for Transformers.js
   * Note: This runs in page context, so we need to request the iframe from content script
   */
  async initTransformersIframe() {
    if (this.transformersIframe && this.transformersReady) {
      return this.transformersIframe;
    }
    
    return new Promise((resolve, reject) => {
      // Store resolve/reject for when TRANSFORMERS_READY arrives
      this.iframeReadyResolve = resolve;
      this.iframeReadyReject = reject;
      
      // Check if iframe already exists (created by content script)
      let iframe = document.getElementById('ethmem-transformers-iframe');
      
      if (!iframe) {
        // Request content script to create the iframe
        console.log('[ModelInferenceService] Requesting transformers iframe from content script');
        window.postMessage({
          type: 'REQUEST_TRANSFORMERS_IFRAME',
          source: 'ethmem-page-script'
        }, '*');
        
        // Wait for iframe to be created
        const checkIframe = setInterval(() => {
          iframe = document.getElementById('ethmem-transformers-iframe');
          if (iframe) {
            clearInterval(checkIframe);
            this.transformersIframe = iframe;
            console.log('[ModelInferenceService] Transformers iframe found, waiting for ready signal');
          }
        }, 100);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkIframe);
          if (!this.transformersReady && this.iframeReadyReject) {
            this.iframeReadyReject(new Error('Transformers iframe creation timeout'));
            this.iframeReadyResolve = null;
            this.iframeReadyReject = null;
          }
        }, 30000);
      } else {
        // Iframe exists, store reference
        this.transformersIframe = iframe;
        console.log('[ModelInferenceService] Transformers iframe already exists, waiting for ready signal');
        
        // If already ready, resolve immediately
        if (this.transformersReady) {
          resolve(iframe);
          this.iframeReadyResolve = null;
          this.iframeReadyReject = null;
        } else {
          // Otherwise wait for ready signal with timeout
          setTimeout(() => {
            if (!this.transformersReady && this.iframeReadyReject) {
              this.iframeReadyReject(new Error('Transformers.js load timeout'));
              this.iframeReadyResolve = null;
              this.iframeReadyReject = null;
            }
          }, 30000);
        }
      }
    });
  }

  /**
   * Send message to transformers iframe
   */
  async sendToTransformers(type, data, onProgress) {
    if (!this.transformersIframe) {
      await this.initTransformersIframe();
    }
    
    return new Promise((resolve, reject) => {
      const msgId = this.messageId++;
      this.pendingMessages.set(msgId, { resolve, reject, onProgress });
      
      this.transformersIframe.contentWindow.postMessage({
        type,
        messageId: msgId,
        ...data
      }, '*');
      
      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.pendingMessages.has(msgId)) {
          this.pendingMessages.delete(msgId);
          reject(new Error('Operation timeout'));
        }
      }, 300000);
    });
  }

  /**
   * Load the active model
   * Automatically unloads previous model to free VRAM
   */
  async loadActiveModel(onProgress) {
    if (this.isLoading) {
      console.warn('[ModelInferenceService] Model already loading');
      return false;
    }

    if (!this.activeModel) {
      console.warn('[ModelInferenceService] No active model set');
      return false;
    }

    try {
      this.isLoading = true;
      console.log(`[ModelInferenceService] Loading model: ${this.activeModel}`);

      // Unload previous model first to free VRAM
      if (this.modelInstance) {
        await this.unloadModel();
      }

      // Map model ID to full model name and task
      const modelConfig = this.getModelConfig(this.activeModel);
      
      console.log(`[ModelInferenceService] Loading ${modelConfig.fullName} for task ${modelConfig.task}`);

      // Load new model
      const result = await this.sendToTransformers('LOAD_MODEL', {
        model: modelConfig.fullName,
        task: modelConfig.task,
        modelId: this.activeModel
      }, onProgress);

      this.modelInstance = result.model;
      console.log('[ModelInferenceService] Model loaded successfully');
      
      return true;

    } catch (error) {
      console.error('[ModelInferenceService] Failed to load model:', error);
      this.modelInstance = null;
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Unload current model to free VRAM
   */
  async unloadModel() {
    if (!this.modelInstance) {
      return;
    }

    try {
      console.log('[ModelInferenceService] Unloading model to free VRAM');
      
      await this.sendToTransformers('UNLOAD_MODEL', {
        modelId: this.activeModel
      });

      this.modelInstance = null;
      
      console.log('[ModelInferenceService] Model unloaded, VRAM freed');

    } catch (error) {
      console.error('[ModelInferenceService] Failed to unload model:', error);
    }
  }

  /**
   * Set active model (user selection from UI)
   * @param {string} modelId - Model ID to activate
   * Note: This runs in page context, cannot save to chrome.storage
   */
  async setActiveModel(modelId) {
    console.log(`[ModelInferenceService] Setting active model: ${modelId}`);
    
    // Unload current model
    if (this.modelInstance) {
      await this.unloadModel();
    }

    this.activeModel = modelId;
    
    console.log('[ModelInferenceService] Active model updated');
  }

  /**
   * Get model configuration by ID
   */
  getModelConfig(modelId) {
    const configs = {
      'lamini-flan-t5': {
        fullName: 'Xenova/LaMini-Flan-T5-783M',
        task: 'text2text-generation'
      },
      'flan-t5-base': {
        fullName: 'Xenova/flan-t5-base',
        task: 'text2text-generation'
      },
      'phi-3-mini': {
        fullName: 'Xenova/Phi-3-mini-4k-instruct',
        task: 'text-generation'
      }
    };
    
    return configs[modelId] || configs['flan-t5-base'];
  }

  /**
   * Check if model is ready for inference
   */
  isReady() {
    return this.modelInstance !== null && this.transformersReady;
  }

  /**
   * Run inference for memory extraction
   * @param {string} text - User's message
   * @returns {Promise<Object>} Extracted memory or null
   */
  async extractMemory(text) {
    if (!this.isReady()) {
      console.log('[ModelInferenceService] Model not ready, using fallback extraction');
      return this.fallbackExtraction(text);
    }

    try {
      const prompt = this.buildExtractionPrompt(text);
      
      const result = await this.sendToTransformers('RUN_INFERENCE', {
        modelId: this.activeModel,
        input: prompt,
        task: 'extraction'
      });

      return this.parseExtractionResult(result.output, text);

    } catch (error) {
      console.error('[ModelInferenceService] Extraction failed:', error);
      return this.fallbackExtraction(text);
    }
  }

  /**
   * Run inference for memory ranking
   * @param {string} userMessage - User's current message
   * @param {Array} memories - All available memories
   * @param {number} topN - Number of memories to return
   * @returns {Promise<Array>} Top N relevant memories
   */
  async rankMemories(userMessage, memories, topN = 5) {
    if (!memories || memories.length === 0) {
      return [];
    }

    if (!this.isReady()) {
      console.log('[ModelInferenceService] Model not ready, using fallback ranking');
      return this.fallbackRanking(userMessage, memories, topN);
    }

    try {
      const prompt = this.buildRankingPrompt(userMessage, memories);
      
      const result = await this.sendToTransformers('RUN_INFERENCE', {
        modelId: this.activeModel,
        input: prompt,
        task: 'ranking'
      });

      const indices = this.parseRankingResult(result.output);
      
      const topMemories = indices
        .slice(0, topN)
        .map(idx => memories[idx])
        .filter(Boolean);

      console.log(`[ModelInferenceService] Ranked ${topMemories.length} memories`);
      return topMemories;

    } catch (error) {
      console.error('[ModelInferenceService] Ranking failed:', error);
      return this.fallbackRanking(userMessage, memories, topN);
    }
  }

  /**
   * Build prompt for memory extraction
   */
  buildExtractionPrompt(text) {
    return `Extract structured information from this text. Return JSON only.

Categories: location, name, age, occupation, food, hobby, music, movie, family, friend, colleague, skill, language, education, allergy, medication, condition, visited, planning

Rules:
- Only extract clear, factual information
- Assign confidence score (0.0 to 1.0)
- If unsure, return empty JSON {}
- Extract only ONE main piece of information

Text: "${text}"

Response format:
{
  "category": "location",
  "entity": "delhi",
  "confidence": 0.95
}

JSON:`;
  }

  /**
   * Build prompt for memory ranking
   */
  buildRankingPrompt(userMessage, memories) {
    let prompt = `User's message: "${userMessage}"\n\nAvailable memories:\n`;
    
    memories.forEach((mem, idx) => {
      prompt += `${idx}. ${mem.category}: ${mem.entity}`;
      if (mem.context) {
        prompt += ` (${mem.context})`;
      }
      prompt += `\n`;
    });

    prompt += `\nTask: Which memories are most relevant to this message? `;
    prompt += `Return ONLY the indices (numbers) of the top 5 most relevant memories, separated by commas.\n`;
    prompt += `Example output: 0,3,7,12,15\n\nRelevant indices: `;

    return prompt;
  }

  /**
   * Parse extraction result from model
   */
  parseExtractionResult(output, sourceText) {
    try {
      // Try to extract JSON from output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const result = JSON.parse(jsonMatch[0]);
      
      if (!result.category || !result.entity) {
        return null;
      }

      const confidence = parseFloat(result.confidence) || 0.5;
      if (confidence < 0.7) {
        return null;
      }

      // Build memory object
      return {
        id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        source: sourceText,
        category: result.category,
        entity: String(result.entity).trim(),
        context: result.context || null,
        metadata: {
          confidence: confidence,
          modelUsed: this.activeModel,
          extractionVersion: '2.0'
        },
        status: 'local'
      };

    } catch (error) {
      console.error('[ModelInferenceService] Failed to parse extraction:', error);
      return null;
    }
  }

  /**
   * Parse ranking result from model
   */
  parseRankingResult(output) {
    try {
      // Parse indices: "0,3,7,12,15" → [0,3,7,12,15]
      const indices = output
        .trim()
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      return indices;
    } catch (error) {
      console.error('[ModelInferenceService] Failed to parse ranking:', error);
      return [];
    }
  }

  /**
   * Fallback extraction using patterns (when model not available)
   */
  fallbackExtraction(text) {
    const textLower = text.toLowerCase();
    
    // Location patterns
    if (textLower.match(/\b(live in|from|in)\s+([a-z]+)/i)) {
      const match = textLower.match(/\b(live in|from|in)\s+([a-z]+)/i);
      return {
        id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        source: text,
        category: 'location',
        entity: match[2],
        metadata: { confidence: 0.85, modelUsed: 'pattern-based' },
        status: 'local'
      };
    }
    
    // Name patterns
    if (textLower.match(/\b(my name is|i am|i'm|call me)\s+([a-z]+)/i)) {
      const match = textLower.match(/\b(my name is|i am|i'm|call me)\s+([a-z]+)/i);
      return {
        id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        source: text,
        category: 'name',
        entity: match[2],
        metadata: { confidence: 0.90, modelUsed: 'pattern-based' },
        status: 'local'
      };
    }

    // Add more patterns as needed...
    
    return null;
  }

  /**
   * Fallback ranking using keyword matching
   */
  fallbackRanking(userMessage, memories, topN) {
    const messageLower = userMessage.toLowerCase();
    const keywords = messageLower.split(/\s+/);

    const scored = memories.map(mem => {
      const memText = `${mem.category} ${mem.entity} ${mem.context || ''}`.toLowerCase();
      
      let score = 0;
      keywords.forEach(kw => {
        if (memText.includes(kw)) score++;
      });

      // Boost recent memories
      const age = Date.now() - new Date(mem.timestamp).getTime();
      const recencyBoost = Math.max(0, 1 - (age / (1000 * 60 * 60 * 24 * 30)));
      score += recencyBoost * 0.5;

      // Boost high confidence
      if (mem.metadata?.confidence) {
        score += mem.metadata.confidence * 0.3;
      }

      return { memory: mem, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(s => s.memory);
  }

  /**
   * Build context string from memories
   */
  buildContext(memories) {
    if (!memories || memories.length === 0) {
      return null;
    }

    let context = "Personal context about the user:\n\n";
    
    memories.forEach(mem => {
      context += `• ${mem.category}: ${mem.entity}`;
      if (mem.context) {
        context += ` (${mem.context})`;
      }
      context += `\n`;
    });

    context += `\nUse this information to personalize your responses naturally.`;
    return context;
  }
}

// Create singleton instance
const modelInferenceService = new ModelInferenceService();

// Listen for inference requests from content script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  
  if (event.data?.type === 'RUN_MODEL_INFERENCE' && event.data?.source === 'ethmem-content-script') {
    console.log('[ModelInferenceService] Received inference request from content script');
    
    const { messageId, payload } = event.data;
    const { prompt, modelId, task } = payload;
    
    try {
      // Ensure model is loaded
      if (!modelInferenceService.activeModel || modelInferenceService.activeModel !== modelId) {
        console.log('[ModelInferenceService] Setting active model to:', modelId);
        await modelInferenceService.setActiveModel(modelId);
      }
      
      if (!modelInferenceService.isReady()) {
        console.log('[ModelInferenceService] Model not ready, loading...');
        const loaded = await modelInferenceService.loadActiveModel((progress) => {
          console.log('[ModelInferenceService] Loading progress:', progress);
        });
        
        if (!loaded) {
          throw new Error('Failed to load model');
        }
      }
      
      console.log('[ModelInferenceService] Running inference for task:', task);
      
      // Run inference
      const result = await modelInferenceService.sendToTransformers('RUN_INFERENCE', {
        modelId: modelId,
        input: prompt,
        task: task
      });
      
      console.log('[ModelInferenceService] Inference complete:', result);
      
      // Extract text from result (handle different model output formats)
      let outputText = result;
      if (Array.isArray(result) && result.length > 0) {
        // Text2text-generation returns array of objects
        outputText = result[0].generated_text || result[0].text || JSON.stringify(result[0]);
      } else if (result.generated_text) {
        outputText = result.generated_text;
      } else if (result.text) {
        outputText = result.text;
      }
      
      console.log('[ModelInferenceService] Extracted output text:', outputText);
      
      // Send response back to content script
      window.postMessage({
        type: 'MODEL_INFERENCE_RESPONSE',
        messageId: messageId,
        response: {
          success: true,
          result: outputText
        }
      }, '*');
      
    } catch (error) {
      console.error('[ModelInferenceService] Inference error:', error);
      
      // Send error response
      window.postMessage({
        type: 'MODEL_INFERENCE_RESPONSE',
        messageId: messageId,
        response: {
          success: false,
          error: error.message
        }
      }, '*');
    }
  }
});

console.log('[ModelInferenceService] Loaded and listening for inference requests');

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModelInferenceService, modelInferenceService };
}
