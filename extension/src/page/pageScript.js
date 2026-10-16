 // pageScript.js
// Runs in page context. Monkeypatch fetch and XHR to capture outgoing messages
(function() {
  // Helper to post to content script
  function forward(payload) {
    window.postMessage({ type: 'CHATGPT_LOG', payload }, '*');
  }

  // Intercept XMLHttpRequest (Gemini uses this for chat!)
  const OriginalXHR = window.XMLHttpRequest;
  function WrappedXHR() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    let requestURL = '';
    let requestMethod = '';
    
    xhr.open = function(method, url, ...args) {
      requestMethod = method;
      requestURL = url;
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    xhr.send = function(body) {
      let modifiedBody = body;
      
      // Detect Gemini chat endpoint
      const isGeminiChat = requestMethod === 'POST' && 
                          requestURL.includes('BardFrontendService/StreamGenerate');
      
      // Check if we have pending memory injection
      if (isGeminiChat && window.__ETHMEM_INJECTION__ && body) {
        const injection = window.__ETHMEM_INJECTION__;
        const age = Date.now() - injection.timestamp;
        
        if (age < 3000) {
          console.log('[EthMem PageScript] 🧠 Gemini chat detected! Attempting injection...');
          
          try {
            // Gemini uses URL-encoded form data: f.req=%5Bnull%2C%22%5B%5B%5C%22message%5C%22...
            const bodyStr = body.toString();
            
            // Extract the f.req parameter value (it's URL-encoded)
            const match = bodyStr.match(/f\.req=([^&]*)/);
            if (match) {
              const encodedValue = match[1];
              const decodedValue = decodeURIComponent(encodedValue);
              
              console.log('[EthMem PageScript] Decoded message preview:', decodedValue.substring(0, 200));
              
              // Parse the JSON array structure
              try {
                // The decoded value is a JSON array like: [null,"[[\"message\",0,null...
                const parsedData = JSON.parse(decodedValue);
                
                // The actual message array is in parsedData[1], which is a JSON string
                if (parsedData && parsedData[1]) {
                  const innerData = JSON.parse(parsedData[1]);
                  
                  // innerData[0][0] contains the actual message
                  if (innerData && innerData[0] && innerData[0][0] === injection.originalMessage) {
                    // Inject the context
                    const newMessage = injection.originalMessage + injection.injectionText;
                    innerData[0][0] = newMessage;
                    
                    // Rebuild the structure
                    parsedData[1] = JSON.stringify(innerData);
                    const newDecodedValue = JSON.stringify(parsedData);
                    
                    // Re-encode for URL
                    const modifiedEncoded = encodeURIComponent(newDecodedValue);
                    
                    // Replace in the original body string
                    modifiedBody = bodyStr.replace(/f\.req=[^&]*/, 'f.req=' + modifiedEncoded);
                    
                    console.log('[EthMem PageScript] ✅ Gemini injection successful!');
                    console.log('[EthMem PageScript] Original message:', injection.originalMessage);
                    console.log('[EthMem PageScript] New message length:', newMessage.length);
                  } else {
                    console.warn('[EthMem PageScript] ⚠️  Message structure unexpected');
                    console.log('[EthMem PageScript] Expected:', injection.originalMessage);
                    console.log('[EthMem PageScript] Found:', innerData?.[0]?.[0]);
                  }
                }
              } catch (parseError) {
                console.error('[EthMem PageScript] Failed to parse Gemini message structure:', parseError);
                console.log('[EthMem PageScript] Decoded value:', decodedValue.substring(0, 300));
              }
            } else {
              console.warn('[EthMem PageScript] ⚠️  Could not find f.req parameter in body');
            }
          } catch (e) {
            console.error('[EthMem PageScript] Error during Gemini injection:', e);
          }
          
          // Clear injection
          delete window.__ETHMEM_INJECTION__;
        }
      }
      
      // Debug logging (commented out for production)
      if (window.location.hostname.includes('gemini.google.com') && requestMethod === 'POST') {
        if (!requestURL.includes('play.google.com') && !requestURL.includes('googleadservices') && !requestURL.includes('jserror')) {
          console.log('[EthMem PageScript] 🔍 XHR POST:', requestURL.substring(0, 150));
        }
      }
      
      return originalSend.call(this, modifiedBody);
    };
    
    return xhr;
  }
  WrappedXHR.prototype = OriginalXHR.prototype;
  window.XMLHttpRequest = WrappedXHR;

  // Try to detect GraphQL/REST calls used by ChatGPT/Gemini. We monkeypatch fetch.
  const originalFetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      // Capture request details
      const url = (typeof input === 'string') ? input : input.url;
      const method = (init && init.method) || 'GET';
      let body = init && init.body;

      // If GraphQL JSON, try parse

      let parsedBody = null;
      if (body) {
        try {
          parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (e) {
          parsedBody = null;
        }
      }
      
      // Detect platform-specific endpoints
      const isChatGPTEndpoint = /conversation|backend-api/i.test(url);
      const isGeminiEndpoint = /streamGenerate|generateContent|_\/BardChatUi|BardFrontendService/i.test(url);
      // Claude: Detect any Claude endpoint but only inject into completion
      // Note: URL can be relative (/api/organizations) or absolute (https://claude.ai/api/organizations)
      const isAnyClaudeEndpoint = /\/api\/organizations.*\/chat_conversations|\/messages/i.test(url);
      const isClaudeCompletionEndpoint = /\/api\/organizations.*\/completion/i.test(url);
      const isChatEndpoint = isChatGPTEndpoint || isGeminiEndpoint || isClaudeCompletionEndpoint;
      
      // Debug: Log all POST requests to help find the actual endpoint
      if (method === 'POST' && parsedBody) {
        // Log all POST requests on Gemini to find the chat endpoint
        if (window.location.hostname.includes('gemini.google.com')) {
          // Filter out analytics/logging endpoints
          if (!url.includes('play.google.com') && !url.includes('googleadservices')) {
            console.log('[EthMem PageScript] 🔍 POST request:', url);
            console.log('[EthMem PageScript] Body preview:', JSON.stringify(parsedBody).substring(0, 200));
            
            if (isGeminiEndpoint) {
              console.log('[EthMem PageScript] ✅ Matched as Gemini endpoint!');
              console.log('[EthMem PageScript] Payload type:', typeof parsedBody, Array.isArray(parsedBody) ? 'array' : 'object');
              console.log('[EthMem PageScript] Payload keys/length:', Array.isArray(parsedBody) ? parsedBody.length : Object.keys(parsedBody));
            }
          }
        }
        
        // Log all POST requests on Claude to help debug
        if (window.location.hostname.includes('claude.ai')) {
          // Filter out analytics/telemetry
          if (!url.includes('analytics') && !url.includes('telemetry') && !url.includes('tracking') && !url.includes('statsig')) {
            console.log('[EthMem PageScript] 🔍 Claude POST request:', url);
            console.log('[EthMem PageScript] Body preview:', JSON.stringify(parsedBody).substring(0, 200));
            
            if (isAnyClaudeEndpoint) {
              if (isClaudeCompletionEndpoint) {
                console.log('[EthMem PageScript] ✅ Matched as Claude COMPLETION endpoint (will inject here)!');
              } else {
                console.log('[EthMem PageScript] ℹ️ Claude endpoint (non-completion, skipping injection)');
              }
              console.log('[EthMem PageScript] Payload type:', typeof parsedBody);
              console.log('[EthMem PageScript] Payload keys:', Object.keys(parsedBody));
            }
          }
        }
      }
      
      // Check if we have pending memory injection for chat endpoints
      if (isChatEndpoint && parsedBody) {
        // Debug: Check if injection data exists
        console.log('[EthMem PageScript] Chat endpoint detected, checking for injection data...');
        console.log('[EthMem PageScript] Injection data exists?', !!window.__ETHMEM_INJECTION__);
        
        if (window.__ETHMEM_INJECTION__) {
          const injection = window.__ETHMEM_INJECTION__;
          const age = Date.now() - injection.timestamp;
          
          console.log('[EthMem PageScript] Injection data found!');
          console.log('[EthMem PageScript] Age:', age, 'ms');
          console.log('[EthMem PageScript] Original message:', injection.originalMessage);
          console.log('[EthMem PageScript] Injection text length:', injection.injectionText.length);
          
          // Only inject if less than 5 seconds old (increased from 3)
          if (age < 5000) {
            const platformName = isClaudeCompletionEndpoint ? 'Claude' : isGeminiEndpoint ? 'Gemini' : 'ChatGPT';
            console.log('[EthMem PageScript] 🧠 Injecting memories into API request...');
            console.log('[EthMem PageScript] Platform:', platformName);
            console.log('[EthMem PageScript] Original message:', injection.originalMessage.substring(0, 50));
          } else {
            console.log('[EthMem PageScript] ⚠️ Injection data expired (age:', age, 'ms)');
            delete window.__ETHMEM_INJECTION__;
            return originalFetch.call(this, input, init);
          }
        } else {
          // No injection data - message sent without smart injector
          if (isClaudeCompletionEndpoint) {
            console.log('[EthMem PageScript] ⚠️ Claude completion endpoint but no injection data');
            console.log('[EthMem PageScript] This might mean injection was consumed by earlier call or not prepared yet');
          }
          return originalFetch.call(this, input, init);
        }
        
        const injection = window.__ETHMEM_INJECTION__;
        if (injection) {
          
          let injected = false;
          
          // Claude payload structure
          if (isClaudeCompletionEndpoint) {
            console.log('[EthMem PageScript] Attempting Claude injection...');
            console.log('[EthMem PageScript] Payload keys:', Object.keys(parsedBody));
            console.log('[EthMem PageScript] Looking for message:', injection.originalMessage.substring(0, 30));
            
            // Claude uses 'prompt' field in the /completion endpoint
            if (parsedBody.prompt) {
              console.log('[EthMem PageScript] Found prompt field:', parsedBody.prompt.substring(0, 50));
              
              if (typeof parsedBody.prompt === 'string') {
                // Check if messages match (trim and compare)
                const promptTrimmed = parsedBody.prompt.trim();
                const messageTrimmed = injection.originalMessage.trim();
                
                if (promptTrimmed === messageTrimmed) {
                  parsedBody.prompt = parsedBody.prompt + injection.injectionText;
                  injected = true;
                  console.log('[EthMem PageScript] ✅ Injected into Claude prompt string');
                  console.log('[EthMem PageScript] New prompt length:', parsedBody.prompt.length);
                } else {
                  console.log('[EthMem PageScript] Prompt mismatch:');
                  console.log('[EthMem PageScript]   Expected:', messageTrimmed);
                  console.log('[EthMem PageScript]   Got:', promptTrimmed);
                }
              } else if (Array.isArray(parsedBody.prompt)) {
                // Claude may use array of content blocks
                for (let i = 0; i < parsedBody.prompt.length; i++) {
                  const block = parsedBody.prompt[i];
                  if (block && block.text && block.text.trim() === injection.originalMessage.trim()) {
                    block.text = block.text + injection.injectionText;
                    injected = true;
                    console.log('[EthMem PageScript] ✅ Injected into Claude prompt array[' + i + ']');
                    break;
                  }
                }
              }
            }
            
            // Try alternative structures (text, message, content fields)
            if (!injected) {
              const possibleFields = ['text', 'message', 'content', 'message_text', 'message_content'];
              for (const field of possibleFields) {
                if (parsedBody[field] && typeof parsedBody[field] === 'string' && 
                    parsedBody[field].trim() === injection.originalMessage.trim()) {
                  parsedBody[field] = parsedBody[field] + injection.injectionText;
                  injected = true;
                  console.log('[EthMem PageScript] ✅ Injected into Claude.' + field);
                  break;
                }
              }
            }
          }
          
          // ChatGPT payload structure
          if (isChatGPTEndpoint && !injected) {
            // Modify the message content to include context
            if (Array.isArray(parsedBody.messages)) {
              const last = parsedBody.messages[parsedBody.messages.length - 1];
              if (last && last.content) {
                // Append context to the actual message
                if (Array.isArray(last.content.parts)) {
                  // Find and modify the matching part
                  for (let i = 0; i < last.content.parts.length; i++) {
                    if (last.content.parts[i] && last.content.parts[i].trim() === injection.originalMessage.trim()) {
                      last.content.parts[i] = last.content.parts[i] + injection.injectionText;
                      injected = true;
                      console.log('[EthMem PageScript] ✅ Injected into ChatGPT parts[' + i + ']');
                      break;
                    }
                  }
                } else if (typeof last.content === 'string') {
                  if (last.content.trim() === injection.originalMessage.trim()) {
                    last.content = last.content + injection.injectionText;
                    injected = true;
                    console.log('[EthMem PageScript] ✅ Injected into ChatGPT content string');
                  }
                }
              }
            } else if (parsedBody.prompt && parsedBody.prompt.trim() === injection.originalMessage.trim()) {
              parsedBody.prompt = parsedBody.prompt + injection.injectionText;
              injected = true;
              console.log('[EthMem PageScript] ✅ Injected into ChatGPT prompt');
            }
          }
          
          // Gemini payload structure
          if (isGeminiEndpoint && !injected) {
            console.log('[EthMem PageScript] Attempting Gemini injection...');
            console.log('[EthMem PageScript] Payload structure:', JSON.stringify(parsedBody).substring(0, 200));
            
            // Gemini uses different structures - try common patterns
            // Pattern 1: at=<encoded_data> format (Gemini's AJAX format)
            if (typeof parsedBody === 'string') {
              // Gemini sends URL-encoded data in some cases
              console.log('[EthMem PageScript] Body is string (URL-encoded?)');
            }
            
            // Pattern 2: Array format like [[null, JSON string]]
            if (Array.isArray(parsedBody)) {
              console.log('[EthMem PageScript] Body is array, length:', parsedBody.length);
              // Gemini often wraps data in arrays
              for (let i = 0; i < parsedBody.length; i++) {
                if (Array.isArray(parsedBody[i])) {
                  // Check nested arrays
                  for (let j = 0; j < parsedBody[i].length; j++) {
                    const item = parsedBody[i][j];
                    if (typeof item === 'string' && item.includes(injection.originalMessage)) {
                      parsedBody[i][j] = item.replace(injection.originalMessage, injection.originalMessage + injection.injectionText);
                      injected = true;
                      console.log('[EthMem PageScript] ✅ Injected into Gemini nested array[' + i + '][' + j + ']');
                      break;
                    }
                  }
                } else if (typeof parsedBody[i] === 'string' && parsedBody[i].includes(injection.originalMessage)) {
                  parsedBody[i] = parsedBody[i].replace(injection.originalMessage, injection.originalMessage + injection.injectionText);
                  injected = true;
                  console.log('[EthMem PageScript] ✅ Injected into Gemini array[' + i + ']');
                  break;
                }
              }
            }
            
            // Pattern 3: Regular object with text/prompt field
            if (!injected && typeof parsedBody === 'object' && parsedBody !== null) {
              const possibleKeys = ['text', 'prompt', 'message', 'input', 'query', 'content'];
              for (const key of possibleKeys) {
                if (parsedBody[key] && typeof parsedBody[key] === 'string' && parsedBody[key].includes(injection.originalMessage)) {
                  parsedBody[key] = parsedBody[key].replace(injection.originalMessage, injection.originalMessage + injection.injectionText);
                  injected = true;
                  console.log('[EthMem PageScript] ✅ Injected into Gemini.' + key);
                  break;
                }
              }
            }
          }
          
          if (injected) {
            // Re-stringify the body
            body = JSON.stringify(parsedBody);
            init.body = body;
            
            console.log('[EthMem PageScript] 🎉 Memory context injected invisibly!');
          } else {
            console.warn('[EthMem PageScript] ⚠️  Could not find matching message to inject');
            console.log('[EthMem PageScript] Payload structure:', Object.keys(parsedBody));
          }
          
          // Clear the injection after use
          delete window.__ETHMEM_INJECTION__;
        }
      }
      if (isChatEndpoint) {
        // Attempt to extract user message text from parsedBody
        let userMessage = null;
        if (parsedBody) {
          // Many ChatGPT payloads include messages in "messages" array or in "input"
          if (Array.isArray(parsedBody.messages)) {
            const last = parsedBody.messages[parsedBody.messages.length - 1];
            if (last && last.content) {
              // content may be an object with "parts"
              if (Array.isArray(last.content.parts)) {
                userMessage = last.content.parts.join('\n');
              } else if (typeof last.content === 'string') {
                userMessage = last.content;
              }
            }
          } else if (parsedBody.input && typeof parsedBody.input === 'string') {
            userMessage = parsedBody.input;
          } else if (parsedBody.prompt) {
            userMessage = parsedBody.prompt;
          }
        }

        if(userMessage) {
          // Send with type flag for memory extraction
          forward({ 
            type: 'USER_MESSAGE',
            direction: 'outgoing', 
            url, 
            method, 
            userMessage, 
            timestamp: Date.now(),
            raw: parsedBody 
          });
          console.log('[EthMem PageScript] User message captured:', userMessage.substring(0, 100));
        } else {
          forward({ direction: 'outgoing', url, method, raw: parsedBody });
        }
      }
      const response = await originalFetch.apply(this, arguments);
      // Clone the response to read body
      try {
        const clone = response.clone();
        const contentType = clone.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await clone.json();
          // Heuristic: responses may contain an "message" or "content" with assistant text
          let assistantText = null;

          if (json.message && json.message.content) {
            if (Array.isArray(json.message.content.parts)) assistantText = json.message.content.parts.join('\n');
            else assistantText = json.message.content;
          } else if (json.choices && json.choices.length) {
            // for some APIs, choices[0].delta or text
            const c = json.choices[0];
            if (c.delta && c.delta.content) assistantText = c.delta.content;
            else if (c.text) assistantText = c.text;
          }

          if (assistantText) {
            forward({ direction: 'incoming', url, assistantText, raw: json });
          } else {
            forward({ direction: 'incoming', url, raw: json });
          }
        } else {
          // Not JSON
        }
      } catch (e) {
        // ignore body parse errors
      }
      return response;
    } catch (err) {
      return originalFetch.apply(this, arguments);
    }
  };

  // Also attempt to hook WebSocket send if Chat uses WS (optional)
  try {

    const OrigWebSocket = window.WebSocket;
    function WrappedWebSocket(url, protocols) {
      const ws = protocols ? new OrigWebSocket(url, protocols) : new OrigWebSocket(url);
      const origSend = ws.send;
      ws.send = function(data) {
        try {
          let parsed = null;
          try { parsed = JSON.parse(data); } catch (e) { parsed = null; }
          if (parsed) {
            forward({ direction: 'ws-outgoing', url, data: parsed });
          } else {
            forward({ direction: 'ws-outgoing', url, data: data });
          }
        } catch (e) {}
        return origSend.apply(this, arguments);
      };

      ws.addEventListener('message', function(ev) {
        try {
          let payload = ev.data;
          try { payload = JSON.parse(ev.data); } catch (e) {}
          forward({ direction: 'ws-incoming', url, data: payload });
        } catch (e) {}
      });
      return ws;

    }

    WrappedWebSocket.prototype = OrigWebSocket.prototype;
    window.WebSocket = WrappedWebSocket;
  } catch (e) {
    // ignore
  }

  // Listen for wallet connection requests from content script

  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'EXT_CONNECT_WALLET') {
      console.log('pageScript: received wallet connection request');
      // Wait for ethAdapter to be available
      let retries = 0;
      const maxRetries = 50; // 5 seconds max
      while (!window.ethAdapter && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (!window.ethAdapter) {
        console.error('pageScript: ethAdapter not available');
        window.postMessage({ 

          type: 'WALLET_ERROR', 
          payload: { error: 'ethAdapter not loaded' } 

        }, '*');


        return;


      }
      try {
        // Connect to MetaMask
        const result = await window.ethAdapter.connect();
        if (result.success) {


          console.log('pageScript: wallet connected successfully');


          window.postMessage({ 


            type: 'WALLET_CONNECTED', 


            payload: {
              address: result.address,
              chainId: result.chainId,
             networkName: window.ethAdapter.getNetworkName(result.chainId)
            } 


          }, '*');


        } else {
          console.error('pageScript: wallet connection failed:', result.error);

          window.postMessage({ 
            type: 'WALLET_ERROR', 
            payload: { error: result.error } 
          }, '*');


        }


      } catch (error) {
        console.error('pageScript: wallet connection exception:', error);
        window.postMessage({ 
          type: 'WALLET_ERROR', 
          payload: { error: error.message } 
        }, '*');
      }
    }
  });
  console.log('pageScript: wallet connection listener initialized');
})();