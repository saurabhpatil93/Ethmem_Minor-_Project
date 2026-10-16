// config.js - Secure configuration management
// Stores API keys in chrome.storage.local (encrypted by Chrome)

const CONFIG_KEYS = {
  GEMINI_API_KEY: 'gemini_api_key',
  GEMINI_MODEL: 'gemini_model'
};

/**
 * Load configuration from secure storage
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get([CONFIG_KEYS.GEMINI_API_KEY, CONFIG_KEYS.GEMINI_MODEL], (result) => {
      resolve({
        apiKey: result[CONFIG_KEYS.GEMINI_API_KEY] || null,
        model: result[CONFIG_KEYS.GEMINI_MODEL] || 'gemini-2.5-flash'
      });
    });
  });
}

/**
 * Save Gemini API key securely
 * @param {string} apiKey - The Gemini API key
 * @returns {Promise<boolean>} Success status
 */
async function saveApiKey(apiKey) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [CONFIG_KEYS.GEMINI_API_KEY]: apiKey }, () => {
      console.log('[Config] API key saved securely');
      resolve(true);
    });
  });
}

/**
 * Save Gemini model preference
 * @param {string} model - The model name (e.g., 'gemini-2.5-flash')
 * @returns {Promise<boolean>} Success status
 */
async function saveModel(model) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [CONFIG_KEYS.GEMINI_MODEL]: model }, () => {
      console.log('[Config] Model preference saved:', model);
      resolve(true);
    });
  });
}

/**
 * Check if API key is configured
 * @returns {Promise<boolean>} True if API key exists
 */
async function isApiKeyConfigured() {
  const config = await loadConfig();
  return config.apiKey && config.apiKey.length > 0;
}

/**
 * Clear all configuration
 * @returns {Promise<boolean>} Success status
 */
async function clearConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([CONFIG_KEYS.GEMINI_API_KEY, CONFIG_KEYS.GEMINI_MODEL], () => {
      console.log('[Config] Configuration cleared');
      resolve(true);
    });
  });
}
