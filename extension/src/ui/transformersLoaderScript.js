// transformersLoaderScript.js - Script for sandboxed transformer loader
import { pipeline, env } from './transformers.min.js';

(async () => {
  try {
    // Configure environment
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.backends.onnx.wasm.numThreads = 1;
    
    // Suppress ONNX Runtime warnings about unused initializers
    // Set log level to 'error' to only show errors, not warnings
    env.backends.onnx.logLevel = 'error';
    
    console.log('Transformers.js loaded in sandbox');
    
    // Listen for messages from parent
    window.addEventListener('message', async (event) => {
      if (event.data.type === 'LOAD_MODEL') {
        try {
          const { task, model, messageId } = event.data;
          console.log(`Loading model: ${model} for task: ${task}`);
          
          const generator = await pipeline(task, model, {
            progress_callback: (progress) => {
              // Send progress updates
              window.parent.postMessage({
                type: 'MODEL_PROGRESS',
                messageId,
                progress
              }, '*');
            }
          });
          
          // Model loaded successfully
          window.parent.postMessage({
            type: 'MODEL_LOADED',
            messageId,
            success: true,
            model
          }, '*');
          
          // Store generator for future use
          window.currentGenerator = generator;
          
        } catch (error) {
          console.error('Error loading model:', error);
          const { messageId } = event.data;
          window.parent.postMessage({
            type: 'MODEL_LOADED',
            messageId,
            success: false,
            error: error.message
          }, '*');
        }
      } else if (event.data.type === 'RUN_INFERENCE') {
        try {
          const { input, messageId } = event.data;
          
          if (!window.currentGenerator) {
            throw new Error('No model loaded');
          }
          
          const result = await window.currentGenerator(input);
          
          window.parent.postMessage({
            type: 'INFERENCE_RESULT',
            messageId,
            success: true,
            result
          }, '*');
          
        } catch (error) {
          console.error('Error running inference:', error);
          window.parent.postMessage({
            type: 'INFERENCE_RESULT',
            messageId,
            success: false,
            error: error.message
          }, '*');
        }
      }
    });
    
    // Signal ready
    window.parent.postMessage({ type: 'TRANSFORMERS_READY' }, '*');
    
  } catch (error) {
    console.error('Failed to load Transformers.js:', error);
    window.parent.postMessage({ 
      type: 'TRANSFORMERS_ERROR', 
      error: error.message 
    }, '*');
  }
})();
