// Frontend Bridge - Content script for communicating with the frontend
console.log('[EthMem] Frontend bridge loaded');

// Helper function to safely check if extension runtime is available
function isExtensionRuntimeAvailable() {
  try {
    // Check if chrome object exists
    if (typeof chrome === 'undefined' || !chrome) {
      return false;
    }
    
    // Check if runtime exists
    if (!chrome.runtime) {
      return false;
    }
    
    // Try to access runtime.id to test if context is valid
    if (chrome.runtime.id) {
      return !!(chrome.runtime.sendMessage);
    }
    
    return false;
  } catch (error) {
    console.warn('[EthMem] Extension runtime check failed:', error);
    return false;
  }
}

// Listen for messages from the frontend
window.addEventListener('message', async (event) => {
  // Only accept messages from the same origin
  if (event.origin !== window.location.origin) {
    return;
  }

  // Check if it's a message for the EthMem extension
  if (event.data && event.data.type === 'ETHMEM_REQUEST') {
    console.log('[EthMem] Frontend request received:', event.data.action);
    
    try {
      let response = null;
      
      switch (event.data.action) {
        case 'GET_MEMORIES':
          response = await sendMessageToBackground({ type: 'GET_MEMORIES' });
          break;
          
        case 'GET_STATS':
          response = await sendMessageToBackground({ type: 'GET_MEMORY_STATS' });
          break;
          
        case 'DELETE_MEMORY':
          response = await sendMessageToBackground({ 
            type: 'DELETE_MEMORY', 
            payload: { id: event.data.memoryId } 
          });
          break;
          
        case 'CLEAR_ALL_MEMORIES':
          response = await sendMessageToBackground({ type: 'CLEAR_ALL_MEMORIES' });
          break;

        case 'ADD_MEMORIES':
          response = await sendMessageToBackground({ 
            type: 'ADD_MEMORIES', 
            payload: { memories: event.data.memories || [] }
          });
          break;
          
        default:
          response = { success: false, error: 'Unknown action' };
      }
      
      // Send response back to frontend
      window.postMessage({
        type: 'ETHMEM_RESPONSE',
        action: event.data.action,
        requestId: event.data.requestId,
        data: response
      }, window.location.origin);
      
    } catch (error) {
      console.error('[EthMem] Error handling frontend request:', error);
      
      // Check if it's a context invalidated error
      if (error.message && (error.message.includes('Extension context invalidated') || 
                           error.message.includes('Receiving end does not exist'))) {
        console.warn('[EthMem] Extension context invalidated, marking as unavailable');
        
        // Send special error response for context invalidation
        window.postMessage({
          type: 'ETHMEM_RESPONSE',
          action: event.data.action,
          requestId: event.data.requestId,
          data: { 
            success: false, 
            error: 'Extension context invalidated. Please refresh the page.',
            contextInvalidated: true
          }
        }, window.location.origin);
      } else {
        // Send regular error response
        window.postMessage({
          type: 'ETHMEM_RESPONSE',
          action: event.data.action,
          requestId: event.data.requestId,
          data: { success: false, error: error.message }
        }, window.location.origin);
      }
    }
  }
});

// Helper function to send messages to background script
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    // Check if extension runtime is available
    if (!isExtensionRuntimeAvailable()) {
      reject(new Error('Extension context invalidated'));
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Notify frontend that the extension is available (only if runtime is available)
if (isExtensionRuntimeAvailable()) {
  window.postMessage({
    type: 'ETHMEM_EXTENSION_READY',
    data: { available: true }
  }, window.location.origin);
  console.log('[EthMem] Frontend bridge initialized');
} else {
  console.warn('[EthMem] Extension runtime not available, bridge not initialized');
}
