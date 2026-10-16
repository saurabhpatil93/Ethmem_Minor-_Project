// settings.js - Settings page logic

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const apiStatus = document.getElementById('apiStatus');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const backBtn = document.getElementById('backBtn');
  const messageDiv = document.getElementById('message');
  
  // Load current status
  await loadApiStatus();
  
  // Enable test button when API key is entered
  apiKeyInput.addEventListener('input', () => {
    const hasValue = apiKeyInput.value.trim().length > 0;
    testBtn.disabled = !hasValue;
  });
  
  // Back button
  backBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });
  
  // Test API key
  testBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }
    
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_API_KEY',
        payload: { apiKey }
      });
      
      if (response.success && response.valid) {
        showMessage('✓ API key is valid!', 'success');
      } else {
        showMessage('✗ Invalid API key: ' + (response.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      showMessage('✗ Error testing API key: ' + error.message, 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
    }
  });
  
  // Save API key
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_API_KEY',
        payload: { apiKey }
      });
      
      if (response.success) {
        showMessage('✓ API key saved securely!', 'success');
        apiKeyInput.value = ''; // Clear input for security
        await loadApiStatus(); // Refresh status
      } else {
        showMessage('✗ Error: ' + (response.error || 'Failed to save'), 'error');
      }
    } catch (error) {
      showMessage('✗ Error saving API key: ' + error.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save API Key';
    }
  });
});

/**
 * Load and display API status
 */
async function loadApiStatus() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_API_STATUS'
    });
    
    if (response.success && response.configured) {
      document.getElementById('apiStatus').innerHTML = 
        '<span class="status-badge status-success">✓ Configured</span>';
    } else {
      document.getElementById('apiStatus').innerHTML = 
        '<span class="status-badge status-warning">⚠ Not Configured</span>';
    }
  } catch (error) {
    console.error('Error loading API status:', error);
  }
}

/**
 * Show message to user
 */
function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = 'message message-' + type;
  messageDiv.style.display = 'block';
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }
}
