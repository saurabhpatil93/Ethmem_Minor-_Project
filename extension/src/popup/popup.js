// Helper: try to send a message to the content script, and if there's no receiver
// inject the content script into the tab and retry once (Manifest V3 via scripting.executeScript).
async function sendMessageWithInject(tabId, message) {
  // Validate tabId: must be a valid number (including 0)
  if (typeof tabId !== 'number' || tabId < 0) {
    const err = new Error(`sendMessageWithInject: invalid tabId (received: ${tabId}, type: ${typeof tabId})`);
    console.error(err);
    throw err;
  }

  // Use callback form and check chrome.runtime.lastError for robustness
  const trySend = () => new Promise((resolve, reject) => {
    try {
      chrome.tabs.sendMessage(tabId, message, (resp) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message || 'Unknown runtime error'));
        }
        resolve(resp);
      });
    } catch (sendErr) {
      // chrome.tabs.sendMessage may throw synchronously in some environments
      reject(sendErr);
    }
  });

  // First attempt: try to send directly
  try {
    console.log(`popup: attempting to send message to tab ${tabId}`, message);
    return await trySend();
  } catch (err) {
    // Log the error properly
    console.warn('popup: initial message send failed, attempting content script injection', err);

    if (!chrome.scripting || !chrome.scripting.executeScript) {
      const apiError = new Error('chrome.scripting.executeScript is not available; cannot inject content script. Ensure manifest.json has "scripting" permission.');
      console.error('popup:', apiError.message);
      throw apiError;
    }

    try {
      // Inject the content script (ensure correct path based on manifest.json)
      await chrome.scripting.executeScript({ 
        target: { tabId }, 
        files: ['src/content/contentScript.js'] 
      });
      
      console.log(`popup: content script injected into tab ${tabId}, waiting for initialization...`);
      
      // Allow the injected script to initialize and register its message listener
      // Use a longer timeout for reliability
      await new Promise(res => setTimeout(res, 500));
      
      return await trySend();
    } catch (err2) {
      // Combine both errors for easier debugging
      const detailedError = new Error(`Failed to inject content script or send message. Initial error: ${err.message}. Injection error: ${err2.message}`);
      console.error('popup: injection and retry failed', { 
        tabId, 
        message, 
        firstError: err, 
        injectError: err2 
      });
      throw detailedError;
    }
  }
}

// Guard DOM lookups in case popup.html doesn't include these elements

const connectBtn = document.getElementById('connectBtn');
if (connectBtn) {
  // Check if wallet is already connected
  chrome.storage.local.get(['walletConnected', 'walletAddress'], (result) => {
    if (result.walletConnected && result.walletAddress) {
      connectBtn.textContent = `Connected: ${result.walletAddress.substring(0, 6)}...${result.walletAddress.substring(result.walletAddress.length - 4)}`;
      connectBtn.style.backgroundColor = '#2ec566';
    }
  });

  connectBtn.addEventListener('click', async () => {
    try {
      const originalText = connectBtn.textContent;
      connectBtn.textContent = 'Connecting...';
      connectBtn.disabled = true;
      
      // Check if MetaMask is installed
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = Array.isArray(tabs) ? tabs[0] : tabs;
      if (!tab || !tab.id) {
        console.warn('popup: no active tab found');
        connectBtn.textContent = originalText;
        connectBtn.disabled = false;
        return;
      }
      
      // Send message to content script to connect wallet
      await sendMessageWithInject(tab.id, { action: 'connectWallet' });
      console.log('popup: connectWallet message sent');
      
      // Wait for connection status
      setTimeout(() => {
        chrome.storage.local.get(['walletConnected', 'walletAddress'], (result) => {
          if (result.walletConnected && result.walletAddress) {
            connectBtn.textContent = `Connected: ${result.walletAddress.substring(0, 6)}...${result.walletAddress.substring(result.walletAddress.length - 4)}`;
            connectBtn.style.backgroundColor = '#2ec566';
          } else {
            connectBtn.textContent = originalText;
          }
          connectBtn.disabled = false;
        });
      }, 2000);
      
    } catch (e) {
      console.error('popup: connectWallet failed', e);
      connectBtn.textContent = 'Connection Failed';
      connectBtn.disabled = false;
      setTimeout(() => {
        connectBtn.textContent = 'Connect Wallet';
      }, 2000);
    }
  });
} else {
  console.warn('popup: #connectBtn element not found in popup.html');
}

const modelManagementBtn = document.getElementById('modelManagementBtn');
if (modelManagementBtn) {
  modelManagementBtn.addEventListener('click', () => {
    console.log('popup: model management button clicked');
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/ui/modelManagement.html')
    });
  });
}

const settingsBtn = document.getElementById('settingsBtn');
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    console.log('popup: settings button clicked');
    window.location.href = 'settings.html';
  });
}
