// contentScript.js
// Main content script - Handles UI injection and message forwarding
(function() {
  console.log('[EthMem] contentScript running');

  // Detect which platform we're on
  const isChatGPT = window.location.hostname.includes('openai.com') || window.location.hostname.includes('chatgpt.com');
  const isClaude = window.location.hostname.includes('claude.ai');
  const isGemini = window.location.hostname.includes('gemini.google.com');
  const isASI = window.location.hostname.includes('asi1.ai');
  
  console.log('[EthMem] platform detection -', { isChatGPT, isClaude, isGemini, isASI });

  // Track processed messages to avoid duplicates
  const processedMessages = new Set();

  // Global error handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && 
        (event.reason.message.includes('Extension context invalidated') ||
         event.reason.message.includes('Receiving end does not exist'))) {
      console.warn('[EthMem] Caught unhandled extension context invalidation:', event.reason.message);
      event.preventDefault(); // Prevent the error from being logged to console
    }
  });

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

  // Helper function to safely send messages to background script
  function safeRuntimeSendMessage(message, callback) {
    if (!isExtensionRuntimeAvailable()) {
      console.warn('[EthMem] Extension runtime not available');
      if (callback) {
        callback(null, new Error('Extension context invalidated'));
      }
      return false;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          const error = new Error(chrome.runtime.lastError.message);
          console.error('[EthMem] Runtime error:', chrome.runtime.lastError);
          if (callback) callback(null, error);
        } else {
          if (callback) callback(response, null);
        }
      });
      return true;
    } catch (error) {
      console.error('[EthMem] Error sending message:', error);
      if (callback) callback(null, error);
      return false;
    }
  }

  // Helper function to safely access chrome.storage.local
  function safeStorageGet(keys, callback) {
    if (!chrome.storage || !chrome.storage.local) {
      console.warn('[EthMem] Chrome storage not available');
      if (callback) {
        callback(null, new Error('Extension context invalidated'));
      }
      return false;
    }

    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          const error = new Error(chrome.runtime.lastError.message);
          console.error('[EthMem] Storage error:', chrome.runtime.lastError);
          if (callback) callback(null, error);
        } else {
          if (callback) callback(result, null);
        }
      });
      return true;
    } catch (error) {
      console.error('[EthMem] Error accessing storage:', error);
      if (callback) callback(null, error);
      return false;
    }
  }

  // Helper function to safely set chrome.storage.local
  function safeStorageSet(items, callback) {
    if (!chrome.storage || !chrome.storage.local) {
      console.warn('[EthMem] Chrome storage not available');
      if (callback) {
        callback(new Error('Extension context invalidated'));
      }
      return false;
    }

    try {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          const error = new Error(chrome.runtime.lastError.message);
          console.error('[EthMem] Storage set error:', chrome.runtime.lastError);
          if (callback) callback(error);
        } else {
          if (callback) callback(null);
        }
      });
      return true;
    } catch (error) {
      console.error('[EthMem] Error setting storage:', error);
      if (callback) callback(error);
      return false;
    }
  }

  // Inject pageScript.js into the page context so it can intercept fetch calls
  function injectPageScript() {
    try {
      if (!isExtensionRuntimeAvailable()) {
        console.warn('[EthMem] Extension runtime not available, skipping pageScript injection');
        return;
      }
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('src/page/pageScript.js');
      script.onload = function() {
        this.remove();
      };
      (document.head || document.documentElement).appendChild(script);
      console.log('[EthMem] pageScript.js injected into page context');
    } catch (e) {
      console.error('[EthMem] failed to inject pageScript.js', e);
    }
  }


  // Inject smartInjector.js for AI-powered memory injection
  function injectSmartInjector() {
    try {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('src/page/smartInjector.js');
      script.onload = function() {
        console.log('[EthMem] smartInjector.js loaded successfully');
        this.remove();
      };
      (document.head || document.documentElement).appendChild(script);
      console.log('[EthMem] smartInjector.js injected into page context');
    } catch (e) {
      console.error('[EthMem] failed to inject smartInjector.js', e);
    }
  }

  // Inject memory viewer UI script
  function injectMemoryViewer() {
    // Note: We don't inject this as a script anymore - it will be inline in content script
    console.log('[EthMem] Memory viewer functions ready (inline)');
  }

  // Show badge when memories are injected
  function showInjectionBadge(memories) {
    // Remove existing badge if any
    const existing = document.getElementById('ethmem-injection-badge');
    if (existing) existing.remove();

    const badge = document.createElement('div');
    badge.id = 'ethmem-injection-badge';
    badge.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: linear-gradient(135deg, #38e078, #2ec566);
      color: #111714;
      padding: 12px 18px;
      border-radius: 24px;
      font-weight: 600;
      font-size: 14px;
      font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 9999;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(56, 224, 120, 0.4);
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    `;
    badge.innerHTML = `
      <span style="font-size: 18px;">🧠</span>
      <span>${memories.length} memories active</span>
      <span style="font-size: 12px; opacity: 0.8; margin-left: 4px;">✨</span>
    `;

    badge.onmouseenter = () => {
      badge.style.transform = 'scale(1.05)';
      badge.style.boxShadow = '0 6px 20px rgba(56, 224, 120, 0.5)';
    };
    
    badge.onmouseleave = () => {
      badge.style.transform = 'scale(1)';
      badge.style.boxShadow = '0 4px 16px rgba(56, 224, 120, 0.4)';
    };

    badge.onclick = () => {
      // Show tooltip with injected memories
      const tooltip = document.createElement('div');
      tooltip.style.cssText = `
        position: fixed;
        bottom: 150px;
        right: 20px;
        background: #0f2419;
        border: 1px solid #29382f;
        border-radius: 12px;
        padding: 16px;
        max-width: 300px;
        z-index: 10000;
        color: #e8e8e8;
        font-size: 13px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      `;
      
      let content = '<div style="font-weight: 600; margin-bottom: 10px; color: #38e078;">Injected Memories:</div>';
      memories.forEach(m => {
        content += `<div style="margin: 6px 0; padding: 6px; background: rgba(56, 224, 120, 0.1); border-radius: 6px;">
          <span style="color: #38e078; font-size: 11px; text-transform: uppercase;">${m.category}</span><br>
          <span style="color: #e8e8e8;">${m.entity}</span>
        </div>`;
      });
      content += '<div style="margin-top: 12px; font-size: 11px; opacity: 0.6; text-align: center;">ChatGPT knows this context</div>';
      
      tooltip.innerHTML = content;
      document.body.appendChild(tooltip);

      // Remove tooltip on click outside
      const removeTooltip = (e) => {
        if (!tooltip.contains(e.target) && e.target !== badge) {
          tooltip.remove();
          document.removeEventListener('click', removeTooltip);
        }
      };
      setTimeout(() => document.addEventListener('click', removeTooltip), 100);
    };

    document.body.appendChild(badge);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (badge.parentNode) {
        badge.style.opacity = '0.6';
        badge.style.transform = 'scale(0.9)';
      }
    }, 10000);

    console.log('[EthMem] Injection badge displayed');
  }

  // Memory viewer functions (inline in content script for chrome.runtime access)
  function openMemoryViewer() {
    console.log('[EthMem] Opening memory viewer');
    
    // Check if viewer already exists
    if (document.getElementById('ethmem-viewer')) {
      console.log('[EthMem] Viewer already open');
      return;
    }
    
  // Request memories from background script with safe error handling
  safeRuntimeSendMessage({ type: 'GET_MEMORIES' }, (response, error) => {
    if (error) {
      console.error('[EthMem] Error fetching memories:', error);
      
      // Check if it's a context invalidated error
      if (error.message.includes('Extension context invalidated') || 
          error.message.includes('Receiving end does not exist')) {
        console.warn('[EthMem] Extension context invalidated, showing reconnection message');
        renderMemoryViewer([], true); // Show reconnection message
      } else {
        renderMemoryViewer([]);
      }
    } else {
      const memories = response?.memories || [];
      console.log('[EthMem] Fetched memories:', memories.length);
      renderMemoryViewer(memories);
    }
  });
  }

  function renderMemoryViewer(memories, showReconnectionMessage = false) {
    try {
      const viewer = document.createElement('div');
    viewer.id = 'ethmem-viewer';
    viewer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(4px);
      z-index: 10001;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: fadeIn 0.2s ease;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #0f2419 0%, #111714 100%);
      border: 1px solid #29382f;
      border-radius: 16px;
      width: 90%;
      max-width: 900px;
      max-height: 85vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      animation: slideUp 0.3s ease;
    `;
    
    // Header with logo
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px 24px;
      border-bottom: 1px solid #29382f;
      background: linear-gradient(135deg, #0f2419 0%, #111714 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    const titleSection = document.createElement('div');
    titleSection.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;
    
    // Add logo
    const logo = document.createElement('img');
    if (isExtensionRuntimeAvailable()) {
      logo.src = chrome.runtime.getURL('assets/logo.png');
    } else {
      // Fallback: use a data URL or skip logo
      logo.style.display = 'none';
    }
    logo.style.cssText = `
      width: 32px;
      height: 32px;
    `;
    
    const titleText = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = 'Your Memories';
    title.style.cssText = `
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.015em;
    `;
    
    const subtitle = document.createElement('div');
    subtitle.textContent = memories.length + ' memories stored';
    subtitle.style.cssText = `
      font-size: 12px;
      color: #38e078;
      margin-top: 2px;
      font-weight: 500;
    `;
    
    titleText.appendChild(title);
    titleText.appendChild(subtitle);
    titleSection.appendChild(logo);
    titleSection.appendChild(titleText);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: #29382f;
      border: none;
      color: #b8c5be;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s;
    `;
    closeBtn.onmouseover = () => { 
      closeBtn.style.background = '#354a3f'; 
      closeBtn.style.color = '#fff'; 
    };
    closeBtn.onmouseout = () => { 
      closeBtn.style.background = '#29382f'; 
      closeBtn.style.color = '#b8c5be'; 
    };
    closeBtn.onclick = () => {
      viewer.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => viewer.remove(), 200);
    };
    
    header.appendChild(titleSection);
    header.appendChild(closeBtn);
    
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 24px;
      overflow-y: auto;
      max-height: calc(85vh - 100px);
      background: #111714;
    `;
    
    // Add scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px); 
        }
        to { 
          opacity: 1;
          transform: translateY(0); 
        }
      }
      #ethmem-viewer ::-webkit-scrollbar {
        width: 8px;
      }
      #ethmem-viewer ::-webkit-scrollbar-track {
        background: #1a2a23;
        border-radius: 4px;
      }
      #ethmem-viewer ::-webkit-scrollbar-thumb {
        background: #29382f;
        border-radius: 4px;
      }
      #ethmem-viewer ::-webkit-scrollbar-thumb:hover {
        background: #354a3f;
      }
    `;
    document.head.appendChild(style);
    
    if (showReconnectionMessage) {
      const reconnectionMessage = document.createElement('div');
      reconnectionMessage.style.cssText = `
        text-align: center;
        padding: 60px 20px;
        color: #b8c5be;
      `;
      reconnectionMessage.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">⚠️</div>
        <div style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #fff;">Extension Disconnected</div>
        <div style="font-size: 14px; color: #b8c5be; max-width: 400px; margin: 0 auto; line-height: 1.5; margin-bottom: 20px;">
          The EthMem extension context has been invalidated. Please refresh the page or restart the extension to reconnect.
        </div>
        <button onclick="location.reload()" style="
          background: #38e078;
          color: #111714;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Refresh Page</button>
      `;
      content.appendChild(reconnectionMessage);
    } else if (memories.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = `
        text-align: center;
        padding: 60px 20px;
        color: #b8c5be;
      `;
      empty.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 16px; opacity: 0.3;">🧠</div>
        <div style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #fff;">No memories yet</div>
        <div style="font-size: 14px; color: #b8c5be; max-width: 400px; margin: 0 auto; line-height: 1.5;">
          Start chatting and EthMem will automatically capture and store your memories locally and on-chain.
        </div>
      `;
      content.appendChild(empty);
    } else {
      const grid = document.createElement('div');
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      `;
      
      memories.forEach(memory => {
        const card = createMemoryCard(memory);
        grid.appendChild(card);
      });
      
      content.appendChild(grid);
    }
    
    modal.appendChild(header);
    modal.appendChild(content);
    viewer.appendChild(modal);
    document.body.appendChild(viewer);
    
    viewer.onclick = (e) => {
      if (e.target === viewer) {
        viewer.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => viewer.remove(), 200);
      }
    };
    } catch (error) {
      console.error('[EthMem] Error in renderMemoryViewer:', error);
      
      // If it's an extension context error, show a simple error message
      if (error.message && (error.message.includes('Extension context invalidated') ||
                           error.message.includes('Receiving end does not exist'))) {
        console.warn('[EthMem] Extension context invalidated in renderMemoryViewer');
        
        // Create a simple error viewer
        const errorViewer = document.createElement('div');
        errorViewer.id = 'ethmem-viewer';
        errorViewer.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          z-index: 10001;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        errorViewer.innerHTML = `
          <div style="
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            color: white;
            max-width: 400px;
          ">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h2 style="margin: 0 0 16px 0; font-size: 18px;">Extension Disconnected</h2>
            <p style="margin: 0 0 20px 0; color: #ccc; font-size: 14px;">
              Please refresh the page to reconnect the EthMem extension.
            </p>
            <button onclick="location.reload()" style="
              background: #38e078;
              color: #111714;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
            ">Refresh Page</button>
          </div>
        `;
        
        errorViewer.onclick = (e) => {
          if (e.target === errorViewer) {
            errorViewer.remove();
          }
        };
        
        document.body.appendChild(errorViewer);
      }
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function createMemoryCard(memory) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: linear-gradient(135deg, #1a2a23 0%, #15201a 100%);
      border: 1px solid #29382f;
      border-radius: 12px;
      padding: 18px;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    `;

    // Hover effect
    card.onmouseover = () => {
      card.style.borderColor = '#38e078';
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 8px 16px rgba(56, 224, 120, 0.08)';
    };
    card.onmouseout = () => {
      card.style.borderColor = '#29382f';
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    };

    // Safely pick displayed values from different memory shapes
    const displayValue = (memory.entity !== undefined && memory.entity !== null)
      ? String(memory.entity)
      : (memory.value !== undefined && memory.value !== null)
        ? String(memory.value)
        : (memory.source !== undefined && memory.source !== null)
          ? String(memory.source)
          : JSON.stringify(memory);

    // Prefer a readable context: metadata context string, or source snippet
    let displayContext = '';
    if (memory.context) {
      if (typeof memory.context === 'string') displayContext = memory.context;
      else if (memory.context.conversationId) displayContext = memory.context.conversationId;
      else displayContext = JSON.stringify(memory.context);
    } else if (memory.source && typeof memory.source === 'string') {
      displayContext = memory.source;
    }

    // Confidence handling (metadata.confidence preferred)
    const confRaw = (memory.metadata && typeof memory.metadata.confidence === 'number')
      ? memory.metadata.confidence
      : (typeof memory.confidence === 'number' ? memory.confidence : 0);
    const conf = Math.max(0, Math.min(1, Number(confRaw) || 0));
    const confPct = Math.round(conf * 100);

    // Category badge
    const categoryBadge = document.createElement('div');
    categoryBadge.textContent = String(memory.category || 'unknown').toUpperCase();
    categoryBadge.style.cssText = `
      display: inline-block;
      padding: 6px 10px;
      background: ${getCategoryColor(memory.category)}22;
      color: ${getCategoryColor(memory.category)};
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      border: 1px solid ${getCategoryColor(memory.category)}33;
    `;

    // Value
    const value = document.createElement('div');
    value.innerHTML = escapeHtml(displayValue);
    value.style.cssText = `
      font-size: 17px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 10px;
      line-height: 1.3;
      letter-spacing: -0.015em;
      word-break: break-word;
    `;

    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.alignItems = 'flex-start';
    
    // Add trash button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Delete Memory';
    deleteBtn.style.cssText = `
      background: transparent;
      border: none;
      cursor: pointer;
      opacity: 0.6;
      font-size: 14px;
      padding: 4px;
      transition: opacity 0.2s;
    `;
    deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
    deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.6';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Delete this memory?')) {
        chrome.runtime.sendMessage({ type: 'DELETE_MEMORY', payload: { id: memory.id } }, (res) => {
          if (res && res.success) {
            card.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => card.remove(), 200);
          } else {
            console.error('Failed to delete memory', res);
          }
        });
      }
    };
    
    headerRow.appendChild(categoryBadge);
    headerRow.appendChild(deleteBtn);
    
    card.appendChild(headerRow);
    card.appendChild(value);

    if (displayContext) {
      const contextEl = document.createElement('div');
      contextEl.innerHTML = escapeHtml(displayContext.length > 200 ? displayContext.slice(0, 200) + '...' : displayContext);
      contextEl.style.cssText = `
        font-size: 13px;
        color: #b8c5be;
        font-style: italic;
        margin-bottom: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.4;
      `;
      card.appendChild(contextEl);
    }

    // Footer with timestamp and confidence
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid #29382f;
    `;

    const timestamp = document.createElement('span');
    timestamp.textContent = formatTimestamp(memory.timestamp || Date.now());
    timestamp.style.cssText = `
      font-size: 11px;
      color: #b8c5be;
      font-weight: 500;
    `;

    const confidence = document.createElement('div');
    confidence.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    `;

    const confidenceBar = document.createElement('div');
    confidenceBar.style.cssText = `
      width: 56px;
      height: 6px;
      background: #29382f;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #213028;
    `;

    const confidenceFill = document.createElement('div');
    confidenceFill.style.cssText = `
      width: ${confPct}%;
      height: 100%;
      background: ${getCategoryColor(memory.category)};
      border-radius: 4px;
      transition: width 0.3s ease;
    `;
    confidenceBar.appendChild(confidenceFill);

    const confidenceText = document.createElement('span');
    confidenceText.textContent = `${confPct}%`;
    confidenceText.style.cssText = `
      color: ${getCategoryColor(memory.category)};
      font-weight: 600;
      min-width: 36px;
      text-align: right;
    `;

    confidence.appendChild(confidenceBar);
    confidence.appendChild(confidenceText);

    footer.appendChild(timestamp);
    footer.appendChild(confidence);
    card.appendChild(footer);

    return card;
  }

  function getCategoryColor(category) {
    const colors = {
      name: '#10b981',
      location: '#3b82f6',
      age: '#8b5cf6',
      occupation: '#f59e0b',
      food: '#ef4444',
      hobby: '#ec4899',
      skill: '#06b6d4',
      language: '#14b8a6',
      education: '#6366f1',
      relationship: '#f97316',
      preference: '#a855f7',
      health: '#84cc16',
      contact: '#22c55e',
      event: '#f43f5e',
      goal: '#eab308',
      opinion: '#64748b',
      experience: '#0ea5e9',
      planning: '#3b82f6'
    };
    return colors[category] || '#6b7280';
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  // Listen for messages from pageScript (via window.postMessage)
  window.addEventListener('message', async (event) => {
    // Only accept messages from same origin
    if (event.source !== window) return;
    
    // Handle smart injection requests
    if (event.data && event.data.type === 'ETHMEM_SMART') {
      console.log('[EthMem ContentScript] Smart injection request received');
      
      chrome.runtime.sendMessage({
        type: 'PROCESS_MESSAGE_SMART',
        payload: event.data.payload
      }, (response) => {
        window.postMessage({
          type: 'ETHMEM_SMART_RES',
          payload: response
        }, '*');
      });
      return;
    }
    
    if (event.data && event.data.type === 'CHATGPT_LOG') {
      const payload = event.data.payload;
      
      // If it's a user message, send for memory extraction
      if (payload.type === 'USER_MESSAGE' && payload.userMessage) {
        const messageKey = payload.userMessage + payload.timestamp;
        
        // Avoid duplicate processing
        if (processedMessages.has(messageKey)) {
          return;
        }
        processedMessages.add(messageKey);
        
        // Clean up old entries (keep last 100)
        if (processedMessages.size > 100) {
          const entries = Array.from(processedMessages);
          processedMessages.clear();
          entries.slice(-50).forEach(e => processedMessages.add(e));
        }
        
        console.log('[EthMem] User message detected:', payload.userMessage.substring(0, 100));
        
        // NOTE: Memory extraction is now handled by the smart injection system
        // The smartInjector.js intercepts messages BEFORE sending and handles both:
        // 1. Extracting new memories
        // 2. Injecting relevant memories
        // This avoids duplicate extraction and ensures seamless UX
        
        // Old automatic extraction disabled to prevent duplicates
        // Memory extraction now happens in smartInjector when user sends message
      }
    }

    // Handle ranked memory request from smart injector (page script)
    if (event.data?.type === 'GET_RANKED_MEMORIES' && event.data?.source === 'ethmem-page-script') {
      console.log('[EthMem] Smart injector requesting ranked memories');
      safeRuntimeSendMessage({ 
        type: 'GET_RANKED_MEMORIES',
        userMessage: event.data.userMessage,
        maxMemories: event.data.maxMemories || 5
      }, (response, error) => {
        if (error) {
          console.error('[EthMem] Failed to fetch ranked memories:', error);
          
          // Check if it's a context invalidated error
          if (error.message.includes('Extension context invalidated') || 
              error.message.includes('Receiving end does not exist')) {
            console.warn('[EthMem] Extension context invalidated during ranked memories fetch');
          }
          
          window.postMessage({
            messageId: event.data.messageId,
            memories: [],
            error: error.message,
            source: 'ethmem-content-script'
          }, '*');
        } else {
          // Send ranked memories back to page script
          window.postMessage({
            messageId: event.data.messageId,
            memories: response?.memories || [],
            source: 'ethmem-content-script'
          }, '*');
          
          console.log(`[EthMem] Sent ${response?.memories?.length || 0} ranked memories to smart injector`);
        }
      });
    }

    // Handle memory request from smart injector (page script) - fallback
    if (event.data?.type === 'GET_ALL_MEMORIES' && event.data?.source === 'ethmem-page-script') {
      console.log('[EthMem] Smart injector requesting all memories');
      safeRuntimeSendMessage({ type: 'GET_ALL_MEMORIES' }, (response, error) => {
        if (error) {
          console.error('[EthMem] Failed to fetch memories for smart injector:', error);
          window.postMessage({
            messageId: event.data.messageId,
            memories: [],
            error: error.message,
            source: 'ethmem-content-script'
          }, '*');
        } else {
          // Send memories back to page script
          window.postMessage({
            messageId: event.data.messageId,
            memories: response?.memories || [],
            source: 'ethmem-content-script'
          }, '*');
          
          console.log(`[EthMem] Sent ${response?.memories?.length || 0} memories to smart injector`);
        }
      });
    }

    // Handle active model request from smart injector (page script)
    if (event.data?.type === 'GET_ACTIVE_MODEL' && event.data?.source === 'ethmem-page-script') {
      console.log('[EthMem] Smart injector requesting active model');
      safeStorageGet(['activeModel'], (result, error) => {
        if (error) {
          console.error('[EthMem] Failed to fetch active model:', error);
          window.postMessage({
            messageId: event.data.messageId,
            activeModel: null,
            error: error.message,
            source: 'ethmem-content-script'
          }, '*');
        } else {
          // Send active model back to page script
          window.postMessage({
            messageId: event.data.messageId,
            activeModel: result?.activeModel || null,
            source: 'ethmem-content-script'
          }, '*');
          
          console.log(`[EthMem] Sent active model: ${result?.activeModel || 'none'}`);
        }
      });
    }

    // Handle injection notification (show badge)
    if (event.data?.type === 'MEMORIES_INJECTED' && event.data?.source === 'ethmem-page-script') {
      console.log('[EthMem] Memories injected:', event.data.memories);
      showInjectionBadge(event.data.memories);
    }

    // Handle transformers iframe request from page script
    if (event.data?.type === 'REQUEST_TRANSFORMERS_IFRAME' && event.data?.source === 'ethmem-page-script') {
      console.log('[EthMem] Page script requesting transformers iframe');
      
      // Check if iframe already exists
      if (!document.getElementById('ethmem-transformers-iframe')) {
        if (isExtensionRuntimeAvailable()) {
          const iframe = document.createElement('iframe');
          iframe.id = 'ethmem-transformers-iframe';
          iframe.src = chrome.runtime.getURL('src/ui/transformersLoader.html');
          iframe.style.display = 'none';
          iframe.sandbox = 'allow-scripts allow-same-origin';
          document.body.appendChild(iframe);
          console.log('[EthMem] Transformers iframe created');
        } else {
          console.warn('[EthMem] Extension runtime not available, cannot create transformers iframe');
        }
      } else {
        console.log('[EthMem] Transformers iframe already exists');
      }
    }

    if (event.data && event.data.type === 'EXT_LOGO_CLICK') {
      console.log('[EthMem] logo button clicked');
      // Open memory viewer (now inline)
      openMemoryViewer();
    }
  });

  function insertFloatingButton() {
    if (!isExtensionRuntimeAvailable()) return false;
    
    // Check if already injected
    if (document.getElementById('ethmem-floating-btn')) return true;
    
    const btn = document.createElement('button');
    btn.id = 'ethmem-floating-btn';
    btn.setAttribute('aria-label', 'EthMem Memories');
    btn.title = 'EthMem - View Your Memories';
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 48px;
      height: 48px;
      border-radius: 24px;
      background: #111714;
      border: 1px solid #38e078;
      box-shadow: 0 4px 16px rgba(56, 224, 120, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      transition: all 0.2s ease;
    `;
    
    btn.onmouseenter = () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 6px 20px rgba(56, 224, 120, 0.3)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 16px rgba(56, 224, 120, 0.2)';
    };
    
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('assets/logo.png');
    img.style.width = '24px';
    img.style.height = '24px';
    btn.appendChild(img);
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMemoryViewer();
    });
    
    document.body.appendChild(btn);
    console.log('[EthMem] Floating button injected');
    return true;
  }


  // Listen for messages from popup or background (with safe check)
  if (isExtensionRuntimeAvailable()) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.action && !msg.type) return;
    
    if (msg.action === 'connectWallet') {
      window.postMessage({ type: 'EXT_CONNECT_WALLET' }, '*');
      sendResponse({ ok: true });
    }
    
    // Handle model inference request from background script
    if (msg.type === 'RUN_MODEL_INFERENCE') {
      console.log('[EthMem Content] Received model inference request, forwarding to page context');
      
      // Forward to page context and wait for response
      const messageId = Date.now() + Math.random();
      
      const responseHandler = (event) => {
        if (event.source !== window) return;
        if (event.data?.type === 'MODEL_INFERENCE_RESPONSE' && event.data?.messageId === messageId) {
          console.log('[EthMem Content] Received inference response from page context');
          window.removeEventListener('message', responseHandler);
          sendResponse(event.data.response);
        }
      };
      
      window.addEventListener('message', responseHandler);
      
      // Forward to page context
      window.postMessage({
        type: 'RUN_MODEL_INFERENCE',
        source: 'ethmem-content-script',
        messageId: messageId,
        payload: msg.payload
      }, '*');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('message', responseHandler);
      }, 30000);
      
      return true; // Keep channel open for async response
    }
    
    return true;
  });
  } else {
    console.warn('[EthMem] Extension runtime not available, skipping message listener setup');
  }

  // Listen for wallet connection responses from page context
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    if (event.data && event.data.type === 'WALLET_CONNECTED') {
      console.log('[EthMem] wallet connected:', event.data.payload);
      safeStorageSet({
        walletConnected: true,
        walletAddress: event.data.payload.address,
        chainId: event.data.payload.chainId
      }, (error) => {
        if (error) {
          console.error('[EthMem] Error saving wallet connection:', error);
        } else {
          console.log('[EthMem] Wallet connection saved to storage');
        }
      });
    }
    
    if (event.data && event.data.type === 'WALLET_ERROR') {
      console.error('[EthMem] wallet connection error:', event.data.payload);
    }
  });

  // Inject scripts
  injectPageScript();
  injectSmartInjector();
  injectMemoryViewer();

  // Auto-inject header button with retry logic (Gemini only, NOT ChatGPT, Claude or ASI)
  let retryCount = 0;
  const maxRetries = 20;
  
  function tryInjectHeader() {
    // Skip header button for ChatGPT, Claude, and ASI (we use textbar button instead)
    if (isChatGPT || isClaude || isASI) {
      console.log(`[EthMem] Skipping header button for ${isChatGPT ? 'ChatGPT' : isClaude ? 'Claude' : 'ASI'} (using textbar button)`);
      setupObserver();
      return;
    }
    
    const success = insertFloatingButton();
    if (!success && retryCount < maxRetries) {
      retryCount++;
      setTimeout(tryInjectHeader, 300);
    } else if (success) {
      console.log('[EthMem] header button successfully injected');
      setupObserver();
    }
  }

  // Auto-inject textbar button with retry logic (ChatGPT, Claude, Gemini, and ASI)
  let textbarRetryCount = 0;
  const textbarMaxRetries = 5; // Limited retries to avoid hanging
  
  function tryInjectTextbar() {
    if (!isChatGPT && !isClaude && !isGemini && !isASI) return;
    
    const success = insertFloatingButton();
    if (!success && textbarRetryCount < textbarMaxRetries) {
      textbarRetryCount++;
      const platform = isChatGPT ? 'ChatGPT' : (isClaude ? 'Claude' : isGemini ? 'Gemini' : 'ASI');
      console.log(`[EthMem] ${platform} textbar injection attempt ${textbarRetryCount}/${textbarMaxRetries}`);
      // Longer delays: ASI gets 2s, others get 1s
      const retryDelay = isASI ? 2000 : (isClaude || isGemini ? 1000 : 800);
      setTimeout(tryInjectTextbar, retryDelay);
    } else if (success) {
      const platform = isChatGPT ? 'ChatGPT' : (isClaude ? 'Claude' : isGemini ? 'Gemini' : 'ASI');
      console.log(`[EthMem] ${platform} textbar button successfully injected`);
    } else {
      const platform = isChatGPT ? 'ChatGPT' : (isClaude ? 'Claude' : isGemini ? 'Gemini' : 'ASI');
      console.warn(`[EthMem] Failed to inject ${platform} textbar button after`, textbarMaxRetries, 'attempts');
    }
  }

  // Set up MutationObserver to re-inject if buttons are removed/changed
  function setupObserver() {
    let reinjectionTimeout = null;
    let isReinjecting = false;
    
    const observer = new MutationObserver((mutations) => {
      // Debounce re-injection to prevent infinite loops
      if (isReinjecting) return;
      
      // Clear any pending reinjection
      if (reinjectionTimeout) {
        clearTimeout(reinjectionTimeout);
      }
      
      // Shorter debounce for ASI (faster DOM changes)
      const debounceDelay = isASI ? 100 : 250;
      
      reinjectionTimeout = setTimeout(() => {
        // For all platforms: watch textbar button
        if (!document.getElementById('ethmem-floating-btn')) {
          const platform = isChatGPT ? 'ChatGPT' : (isClaude ? 'Claude' : isGemini ? 'Gemini' : isASI ? 'ASI' : 'Unknown');
          console.log(`[EthMem] ${platform} textbar button removed, re-injecting...`);
          
          isReinjecting = true;
          const success = insertFloatingButton();
          
          // Reset flag after a delay (shorter for ASI)
          const resetDelay = isASI ? 500 : 1000;
          setTimeout(() => {
            isReinjecting = false;
          }, resetDelay);
          
          if (!success) {
            console.log(`[EthMem] ${platform} textbar re-injection failed, will retry on next mutation`);
          }
        }
      }, debounceDelay);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const platformName = isChatGPT ? 'ChatGPT' : isClaude ? 'Claude' : isGemini ? 'Gemini' : isASI ? 'ASI' : 'Unknown';
    console.log(`[EthMem] MutationObserver set up for ${platformName} auto-injection`);
  }

  // ASI-specific: Continuous monitoring with interval check (more aggressive)
  function setupASIContinuousMonitoring() {
    console.log('[EthMem] ASI: Setting up continuous monitoring...');
    
    // Check every 1 second if button is present, if not, re-inject
    setInterval(() => {
      if (!document.getElementById('ethmem-floating-btn')) {
        console.log('[EthMem] ASI: Button missing, attempting re-injection...');
        insertFloatingButton();
      }
      else{
        console.log('[EthMem] ASI: Button present, no action needed');
      }
    }, 1000); // Check every 1 second (faster response)
  }

  // Start auto-injection
  // For all platforms: use textbar injection
  const textbarDelay = isClaude ? 1500 : (isGemini ? 1200 : isASI ? 2000 : 500); // ASI needs the most time
  setTimeout(tryInjectTextbar, textbarDelay);
  
  // For ASI: Also set up continuous monitoring after initial injection
  if (isASI) {
    setTimeout(() => {
      setupASIContinuousMonitoring();
    }, 3000); // Start continuous monitoring after 3 seconds (earlier start)
  }

})();
