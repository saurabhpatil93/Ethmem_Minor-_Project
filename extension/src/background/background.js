// background.js - Service worker for EthMem extension
console.log('[EthMem] Background script loaded');

// Import memory extraction and storage modules
// Note: Service workers require absolute paths from extension root
try {
  importScripts(
    '/src/lib/config.js',
    '/src/lib/smartMemoryService.js',
    '/src/lib/memoryExtractor.js',
    '/src/lib/memoryStorage.js'
  );
  console.log('[EthMem] All scripts imported successfully');
} catch (error) {
  console.error('[EthMem] Failed to import scripts:', error);
  console.error('[EthMem] Error details:', error.message, error.stack);
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('[EthMem] Extension installed');

  // Initialize IndexedDB
  if (typeof initDB !== 'undefined') {
    initDB().catch(err => {
      console.error('[EthMem] Failed to initialize DB:', err);
    });
  } else {
    console.error('[EthMem] initDB is not defined - scripts may not have loaded');
  }


});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[EthMem] Message received:', message.type);

  if (message.type === 'EXTRACT_MEMORY') {
    handleExtractMemory(message.payload, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_MEMORIES') {
    handleGetMemories(sendResponse);
    return true;
  }

  if (message.type === 'GET_ALL_MEMORIES') {
    handleGetMemories(sendResponse); // Same as GET_MEMORIES
    return true;
  }

  if (message.type === 'GET_MEMORY_STATS') {
    handleGetStats(sendResponse);
    return true;
  }

  if (message.type === 'DELETE_MEMORY') {
    handleDeleteMemory(message.payload.id, sendResponse);
    return true;
  }

  if (message.type === 'CLEAR_ALL_MEMORIES') {
    handleClearAll(sendResponse);
    return true;
  }

  if (message.type === 'ADD_MEMORIES') {
    handleAddMemories(message.payload?.memories || [], sendResponse);
    return true;
  }

  // API Key management
  if (message.type === 'SAVE_API_KEY') {
    handleSaveApiKey(message.payload, sendResponse);
    return true;
  }

  if (message.type === 'GET_API_STATUS') {
    handleGetApiStatus(sendResponse);
    return true;
  }

  if (message.type === 'TEST_API_KEY') {
    handleTestApiKey(message.payload, sendResponse);
    return true;
  }

  // Smart memory processing
  if (message.type === 'PROCESS_MESSAGE_SMART') {
    handleProcessMessageSmart(message.payload, sendResponse);
    return true;
  }
});

/**
 * Handle memory extraction request
 */
async function handleExtractMemory(payload, sendResponse) {
  console.log('[EthMem Background] handleExtractMemory called with payload:', payload);

  try {
    const { text, messageId, platform, url, timestamp } = payload;

    console.log('[EthMem Background] Extracting memory from:', text);

    // Extract memory using the extractor module
    const memory = await extractMemory(text);

    console.log('[EthMem Background] Extraction result:', memory);

    if (!memory) {
      console.log('[EthMem Background] No memory extracted');
      sendResponse({ success: false, message: 'No memory extracted' });
      return;
    }

    // Check for duplicates
    const duplicate = await isDuplicate(memory);

    if (duplicate) {
      console.log('[EthMem Background] Duplicate memory, skipping');
      sendResponse({ success: false, message: 'Duplicate memory' });
      return;
    }

    // Save to IndexedDB
    await saveMemory(memory);

    console.log('[EthMem] ✅ Memory saved successfully!');
    console.log('[EthMem] ID:', memory.id);
    console.log('[EthMem] Category:', memory.category);
    console.log('[EthMem] Entity:', memory.entity);
    console.log('[EthMem] Description:', memory.description);

    // Send success response
    sendResponse({
      success: true,
      memory: memory
    });

  } catch (error) {
    console.error('[EthMem Background] Error in handleExtractMemory:', error);
    console.error('[EthMem Background] Error stack:', error.stack);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle get memories request
 */
async function handleGetMemories(sendResponse) {
  try {
    const memories = await getAllMemories();

    // Sort by timestamp (newest first)
    memories.sort((a, b) => b.timestamp - a.timestamp);

    sendResponse({
      success: true,
      memories: memories
    });

  } catch (error) {
    console.error('[EthMem] Error in handleGetMemories:', error);
    sendResponse({
      success: false,
      memories: [],
      error: error.message
    });
  }
}

/**
 * Handle get stats request
 */
async function handleGetStats(sendResponse) {
  try {
    const stats = await getStats();

    sendResponse({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('[EthMem] Error in handleGetStats:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle ranked memories request
 */
async function handleGetRankedMemories(userMessage, maxMemories, sendResponse) {
  try {
    // Get all memories first
    const memories = await getAllMemories();

    if (!memories || memories.length === 0) {
      sendResponse({
        success: true,
        memories: []
      });
      return;
    }

    console.log(`[EthMem] Ranking ${memories.length} memories for: "${userMessage}"`);

    // Try cloud AI ranking
    if (typeof rankMemoriesWithAI !== 'undefined') {
      const rankedMemories = await rankMemoriesWithAI(userMessage, memories, maxMemories);

      sendResponse({
        success: true,
        memories: rankedMemories
      });
      return;
    }

    // Fallback: return most recent
    const recentMemories = memories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxMemories);

    sendResponse({
      success: true,
      memories: recentMemories
    });

  } catch (error) {
    console.error('[EthMem] Error in handleGetRankedMemories:', error);
    sendResponse({
      success: false,
      memories: [],
      error: error.message
    });
  }
}

/**
 * Handle delete memory request
 */
async function handleDeleteMemory(id, sendResponse) {
  try {
    await deleteMemory(id);

    sendResponse({
      success: true,
      message: 'Memory deleted'
    });

  } catch (error) {
    console.error('[EthMem] Error in handleDeleteMemory:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle clear all memories request
 */
async function handleClearAll(sendResponse) {
  try {
    await clearAllMemories();

    sendResponse({
      success: true,
      message: 'All memories cleared'
    });

  } catch (error) {
    console.error('[EthMem] Error in handleClearAll:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle add multiple memories (for sync from contract)
 */
async function handleAddMemories(memories, sendResponse) {
  try {
    if (!Array.isArray(memories) || memories.length === 0) {
      sendResponse({ success: false, error: 'No memories provided' });
      return;
    }

    let saved = 0;
    for (const m of memories) {
      // Ensure an id
      const memory = {
        id: m.id || ('mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
        timestamp: m.timestamp || Date.now(),
        category: m.category || 'general',
        entity: m.entity || 'Memory',
        description: m.description || '',
        source: m.source || 'Smart Contract',
        metadata: m.metadata || {},
        status: m.status || 'synced'
      };

      const duplicate = await isDuplicate({
        category: memory.category,
        entity: memory.entity
      });
      if (!duplicate) {
        await saveMemory(memory);
        saved += 1;
      }
    }

    sendResponse({ success: true, saved });
  } catch (error) {
    console.error('[EthMem] Error in handleAddMemories:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle save API key request
 */
async function handleSaveApiKey(payload, sendResponse) {
  try {
    const { apiKey } = payload;

    if (!apiKey || apiKey.trim().length === 0) {
      sendResponse({
        success: false,
        error: 'API key cannot be empty'
      });
      return;
    }

    await saveApiKey(apiKey);

    sendResponse({
      success: true,
      message: 'API key saved securely'
    });

  } catch (error) {
    console.error('[EthMem] Error saving API key:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle get API status request
 */
async function handleGetApiStatus(sendResponse) {
  try {
    const configured = await isApiKeyConfigured();
    const config = await loadConfig();

    sendResponse({
      success: true,
      configured: configured,
      model: config.model || 'gemini-2.5-flash'
    });

  } catch (error) {
    console.error('[EthMem] Error getting API status:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle test API key request
 */
async function handleTestApiKey(payload, sendResponse) {
  try {
    const { apiKey } = payload;

    const result = await testApiKey(apiKey);

    sendResponse({
      success: true,
      valid: result.valid,
      error: result.error
    });

  } catch (error) {
    console.error('[EthMem] Error testing API key:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Validates a Gemini API key by making a minimal models request
 */
async function testApiKey(apiKey) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET'
    });

    if (response.ok) {
      return { valid: true };
    } else {
      const data = await response.json();
      return { valid: false, error: data.error?.message || 'Invalid API key' };
    }
  } catch (error) {
    return { valid: false, error: 'Network error or unable to reach Gemini API' };
  }
}

/**
 * Handle smart message processing (extract + rank in one call)
 */
async function handleProcessMessageSmart(payload, sendResponse) {
  try {
    const { userMessage } = payload;

    console.log('[EthMem] Smart processing message:', userMessage.substring(0, 50));

    // Get API config
    const config = await loadConfig();
    let result = { relevant: [], newMemories: [] };

    // Get all existing memories
    const allMemories = await getAllMemories();
    console.log('[EthMem] Processing with', allMemories.length, 'existing memories');

    if (!config.apiKey) {
      console.warn('[EthMem] No API key configured for smart processing. Falling back to simple pattern extraction.');

      // Fallback: Pattern-based extraction
      const extractedMemory = await extractMemory(userMessage); // Uses patternBasedExtraction internally if no API key
      if (extractedMemory) {
        result.newMemories.push(extractedMemory);
      }

      // Fallback: Simple keyword matching for relevant memories
      if (allMemories.length > 0) {
        const lowerMessage = userMessage.toLowerCase();

        // Define some category synonyms for better matching
        const categoryKeywords = {
          'food': ['recipe', 'cook', 'eat', 'meal', 'dinner', 'lunch', 'breakfast', 'juice', 'drink', 'beverage', 'snack', 'restaurant', 'cafe'],
          'location': ['travel', 'trip', 'visit', 'go to', 'flight', 'hotel', 'city', 'country'],
          'visited': ['travel', 'trip', 'visit', 'go to', 'flight', 'hotel', 'city', 'country'],
          'hobby': ['play', 'do', 'activity', 'fun', 'game', 'sport', 'instrument'],
          'music': ['song', 'band', 'artist', 'album', 'listen', 'concert'],
          'movie': ['film', 'watch', 'actor', 'director', 'cinema', 'theater'],
          'skill': ['learn', 'know', 'how to', 'good at', 'expert', 'proficient'],
          'language': ['speak', 'understand', 'translate', 'fluent', 'know']
        };

        result.relevant = allMemories.filter(m => {
          if (!m.category || !m.entity) return false;

          const cat = m.category.toLowerCase();
          const ent = m.entity.toLowerCase();

          // Direct matches
          if (lowerMessage.includes(ent)) return true;
          if (lowerMessage.includes(cat)) return true;

          // Sub-string entity matching for plurals/variations (e.g. mangoes -> mango)
          // We check if at least 4 chars of the entity match, to avoid short false positives
          if (ent.length > 3 && lowerMessage.includes(ent.substring(0, ent.length - 1))) return true;
          if (ent.length > 4 && lowerMessage.includes(ent.substring(0, ent.length - 2))) return true;

          // Synonym checking based on category
          if (categoryKeywords[cat]) {
            for (const keyword of categoryKeywords[cat]) {
              if (lowerMessage.includes(keyword)) return true;
            }
          }

          return false;
        }).slice(0, 3); // Return top 3 matches
      }
    } else {
      // Process with GPT
      try {
        result = await processMessageSmart(
          userMessage,
          allMemories, // Can be empty array
          config.apiKey,
          config.model
        );
      } catch (err) {
        console.warn(`[EthMem] Smart processing failed (${err.message}). Falling back to simple pattern extraction.`);

        // Fallback: Pattern-based extraction
        const extractedMemory = await extractMemory(userMessage);
        if (extractedMemory) {
          result.newMemories.push(extractedMemory);
        }

        // Fallback: Simple keyword matching for relevant memories
        if (allMemories.length > 0) {
          const lowerMessage = userMessage.toLowerCase();

          const categoryKeywords = {
            'food': ['recipe', 'cook', 'eat', 'meal', 'dinner', 'lunch', 'breakfast', 'juice', 'drink', 'beverage', 'snack', 'restaurant', 'cafe'],
            'location': ['travel', 'trip', 'visit', 'go to', 'flight', 'hotel', 'city', 'country'],
            'visited': ['travel', 'trip', 'visit', 'go to', 'flight', 'hotel', 'city', 'country'],
            'hobby': ['play', 'do', 'activity', 'fun', 'game', 'sport', 'instrument'],
            'music': ['song', 'band', 'artist', 'album', 'listen', 'concert'],
            'movie': ['film', 'watch', 'actor', 'director', 'cinema', 'theater'],
            'skill': ['learn', 'know', 'how to', 'good at', 'expert', 'proficient'],
            'language': ['speak', 'understand', 'translate', 'fluent', 'know']
          };

          result.relevant = allMemories.filter(m => {
            if (!m.category || !m.entity) return false;

            const cat = m.category.toLowerCase();
            const ent = m.entity.toLowerCase();

            if (lowerMessage.includes(ent)) return true;
            if (lowerMessage.includes(cat)) return true;

            if (ent.length > 3 && lowerMessage.includes(ent.substring(0, ent.length - 1))) return true;
            if (ent.length > 4 && lowerMessage.includes(ent.substring(0, ent.length - 2))) return true;

            if (categoryKeywords[cat]) {
              for (const keyword of categoryKeywords[cat]) {
                if (lowerMessage.includes(keyword)) return true;
              }
            }
            return false;
          }).slice(0, 3);
        }
      }
    }

    console.log('[EthMem] Smart processing result:', {
      relevantCount: result.relevant?.length || 0,
      newMemoriesCount: result.newMemories?.length || 0
    });

    // If there are new memories, save them (after checking for duplicates)
    if (result.newMemories && result.newMemories.length > 0) {
      for (const newMem of result.newMemories) {
        const memory = {
          id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          source: userMessage,
          category: newMem.category,
          entity: newMem.entity,
          description: newMem.description,
          context: {
            conversationId: 'chatgpt-' + Date.now(),
            platform: 'chatgpt'
          },
          metadata: {
            confidence: newMem.confidence || 0.8,
            modelUsed: config.model || 'gemini-2.5-flash',
            extractionVersion: '3.0-smart'
          },
          status: 'local'
        };

        // Check for duplicates before saving
        const duplicate = await isDuplicate(memory);

        if (duplicate) {
          console.log('[EthMem] ⚠️  Duplicate memory detected, skipping save');
        } else {
          await saveMemory(memory);
          console.log('[EthMem] ✅ New memory saved:', memory.description);
        }
      }
    }

    // Format relevant memories for injection
    const injectionText = formatMemoriesForInjection(result.relevant);

    console.log('[EthMem] Smart processing complete:');
    console.log('[EthMem]   Relevant memories:', result.relevant.length);
    console.log('[EthMem]   New memories extracted:', result.newMemories?.length || 0);

    sendResponse({
      success: true,
      relevant: result.relevant,
      injectionText: injectionText,
      newMemories: result.newMemories
    });

  } catch (error) {
    console.error('[EthMem] Error in smart processing:', error);
    sendResponse({
      success: false,
      error: error.message,
      relevant: [],
      newMemories: []
    });
  }
}
