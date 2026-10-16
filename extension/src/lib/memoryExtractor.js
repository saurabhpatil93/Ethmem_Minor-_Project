// Memory Extraction Module
// Uses Laflan mini model to extract structured memories from text

console.log('[EthMem] Memory Extractor loaded');

// Categories we can extract
const CATEGORIES = [
  'location', 'name', 'age', 'occupation',
  'food', 'hobby', 'music', 'movie',
  'family', 'friend', 'colleague',
  'skill', 'language', 'education',
  'allergy', 'medication', 'condition',
  'visited', 'planning', 'preference',
  'relationship', 'goal', 'interest', 'fact'
];

/**
 * Extract memory from text using simple offline patterns
 * @param {string} text - User's message text
 * @returns {Promise<Object|null>} - Extracted memory or null
 */
async function extractMemory(text) {
  console.log('[MemoryExtractor] extractMemory (offline fallback) called with text:', text);

  try {

    // Fallback to pattern-based extraction
    const result = patternBasedExtraction(text);

    console.log('[MemoryExtractor] Model inference result:', result);

    if (!result || Object.keys(result).length === 0) {
      console.log('[MemoryExtractor] No memory extracted from model');
      return null;
    }

    // Validate and normalize result
    console.log('[MemoryExtractor] Validating and normalizing result...');
    const memory = validateAndNormalizeMemory(result, text);

    if (memory) {
      console.log('[EthMem] Memory extracted via patterns:', memory);
    }

    return memory;

  } catch (error) {
    console.error('[MemoryExtractor] Error extracting memory:', error);
    console.error('[MemoryExtractor] Error stack:', error.stack);
    return null;
  }
}

/**
 * Build extraction prompt for the model
 * Optimized for T5 models which need simple, direct prompts
 */
function buildExtractionPrompt(text) {
  // T5 models work best with task prefixes and simple instructions
  return `extract personal fact: ${text}`;
}

/**
 * Run model inference
 * This function is called from background script context via importScripts
 * It needs to communicate with the ChatGPT tab to run inference
 */
async function runModelInference(prompt) {
  // Check if active model is set
  const { activeModel, modelStates } = await chrome.storage.local.get(['activeModel', 'modelStates']);

  if (!activeModel) {
    console.log('[MemoryExtractor] No active model set, using pattern-based extraction');
    return patternBasedExtraction(prompt);
  }

  // TODO: Send to actual model
  // For now, use pattern-based fallback
  return patternBasedExtraction(prompt);
}

/**
 * Check if model is loaded
 */
async function checkModelStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['modelLoaded'], (result) => {
      resolve(result.modelLoaded || false);
    });
  });
}

/**
 * Pattern-based extraction (fallback when cloud AI is not available)
 * This is a simple rule-based system
 */
function patternBasedExtraction(inputText) {
  const text = inputText.toLowerCase();

  // Location patterns
  if (text.match(/\b(live in|from|in)\s+([a-z]+)/i)) {
    const match = text.match(/\b(live in|from|in)\s+([a-z]+)/i);
    return {
      category: 'location',
      entity: match[2],
      confidence: 0.85
    };
  }

  // Name patterns
  if (text.match(/\b(my name is|i am|i'm|call me)\s+([a-z]+)/i)) {
    const match = text.match(/\b(my name is|i am|i'm|call me)\s+([a-z]+)/i);
    return {
      category: 'name',
      entity: match[2],
      confidence: 0.90
    };
  }

  // Age patterns
  if (text.match(/\b(i am|i'm|age)\s+(\d+)\s*(years?|yrs?|old)?/i)) {
    const match = text.match(/\b(i am|i'm|age)\s+(\d+)/i);
    return {
      category: 'age',
      entity: match[2],
      confidence: 0.88
    };
  }

  // Occupation patterns
  if (text.match(/\b(i am a|i'm a|i work as|my job is)\s+([a-z\s]+)/i)) {
    const match = text.match(/\b(i am a|i'm a|i work as|my job is)\s+([a-z\s]+)/i);
    return {
      category: 'occupation',
      entity: match[2].trim(),
      confidence: 0.82
    };
  }

  // Food preferences - improved to capture context
  if (text.match(/\b(i like|i love|i enjoy|i hate|i dislike|favorite food|favourite food)\s+([a-z\s]+)/i)) {
    const match = text.match(/\b(i like|i love|i enjoy|i hate|i dislike|favorite food|favourite food)\s+([a-z\s]+)/i);
    const sentiment = match[1].toLowerCase();
    const food = match[2].trim();

    // Build contextual description
    let description = '';
    if (sentiment.includes('love') || sentiment.includes('favorite') || sentiment.includes('favourite')) {
      description = `User loves ${food}`;
    } else if (sentiment.includes('like') || sentiment.includes('enjoy')) {
      description = `User likes ${food}`;
    } else if (sentiment.includes('hate') || sentiment.includes('dislike')) {
      description = `User dislikes ${food}`;
    }

    return {
      category: 'food',
      entity: food,
      description: description,
      confidence: 0.85
    };
  }

  // Hobbies
  if (text.match(/\b(hobby|hobbies|i enjoy|i like to|i love to)\s+([a-z\s]+)/i)) {
    const match = text.match(/\b(hobby|hobbies|i enjoy|i like to|i love to)\s+([a-z\s]+)/i);
    return {
      category: 'hobby',
      entity: match[2].trim(),
      confidence: 0.78
    };
  }

  // Skills
  if (text.match(/\b(i know|i can|skilled in|expert in)\s+([a-z\s]+)/i)) {
    const match = text.match(/\b(i know|i can|skilled in|expert in)\s+([a-z\s]+)/i);
    return {
      category: 'skill',
      entity: match[2].trim(),
      confidence: 0.80
    };
  }

  // Languages
  if (text.match(/\b(i speak|i know|fluent in|language)\s+([a-z]+)/i)) {
    const match = text.match(/\b(i speak|i know|fluent in|language)\s+([a-z]+)/i);
    return {
      category: 'language',
      entity: match[2],
      confidence: 0.85
    };
  }

  // Travel
  if (text.match(/\b(visited|been to|traveled to|went to)\s+([a-z\s]+)/i)) {
    const match = text.match(/\b(visited|been to|traveled to|went to)\s+([a-z\s]+)/i);
    return {
      category: 'visited',
      entity: match[2].trim(),
      confidence: 0.83
    };
  }

  // No pattern matched
  return {};
}

/**
 * Validate and normalize extracted memory
 */
function validateAndNormalizeMemory(result, sourceText) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const { category, entity, confidence, description } = result;

  // Validate required fields
  if (!category || !entity) {
    return null;
  }

  // Validate category - allow custom categories from AI but log a warning
  if (!CATEGORIES.includes(category)) {
    console.warn('[EthMem] Unknown category (accepting anyway):', category);
  }

  // Validate confidence
  const conf = parseFloat(confidence) || 0.5;
  if (conf < 0.6) {
    console.log('[EthMem] Confidence too low:', conf);
    return null;
  }

  // Generate unique ID
  const id = generateId();

  // Determine model used
  const modelUsed = result.source === 'cloud-ai' ? result.model || 'gpt-3.5-turbo' : 'pattern-based';

  // Build final memory object
  return {
    id,
    timestamp: Date.now(),
    source: sourceText,
    category,
    entity: String(entity).trim(),
    description: description,
    context: {
      conversationId: 'chatgpt-' + Date.now(),
      platform: 'chatgpt'
    },
    metadata: {
      confidence: conf,
      modelUsed: modelUsed,
      extractionVersion: '2.0'
    },
    status: 'local' // Will be 'synced' or 'on-chain' later
  };
}

/**
 * Generate unique ID
 */
function generateId() {
  return 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate human-readable description from category and entity
 */
function generateDescription(category, entity) {
  const templates = {
    food: `User likes ${entity}`,
    location: `User is from ${entity}`,
    name: `User's name is ${entity}`,
    age: `User is ${entity} years old`,
    occupation: `User works as ${entity}`,
    hobby: `User enjoys ${entity}`,
    skill: `User knows ${entity}`,
    language: `User speaks ${entity}`,
    visited: `User has visited ${entity}`,
    music: `User likes ${entity} music`,
    movie: `User likes ${entity} movies`,
    preference: `User prefers ${entity}`,
    relationship: `User has ${entity}`,
    goal: `User wants to ${entity}`,
    interest: `User is interested in ${entity}`,
    family: `User's family: ${entity}`,
    friend: `User's friend: ${entity}`,
    colleague: `User's colleague: ${entity}`,
    education: `User studied ${entity}`,
    fact: `User: ${entity}`
  };

  return templates[category] || `User: ${entity}`;
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractMemory };
}
