// smartMemoryService.js - Intelligent memory extraction and ranking
// Uses gemini-2.5-flash to both extract new memories AND rank relevant ones

/**
 * Process a user message: extract new memories and rank relevant existing ones
 * @param {string} userMessage - The user's message
 * @param {Array} existingMemories - Array of existing memories
 * @param {string} apiKey - Gemini API key
 * @param {string} model - Model to use (default: gemini-2.5-flash)
 * @returns {Promise<Object>} {relevant: Array, newMemories: Array}
 */
async function processMessageSmart(userMessage, existingMemories, apiKey, model = 'gemini-2.5-flash') {
  if (!apiKey) {
    console.warn('[SmartMemory] No API key provided');
    return { relevant: [], newMemories: [] };
  }

  // Format memories for the prompt
  const memoryList = existingMemories.map((mem, idx) =>
    `${idx + 1}. [${mem.category}] ${mem.description || mem.entity}`
  ).join('\n');

  const prompt = `You are a memory assistant. You have some OLD MEMORIES about the user, and the user is now asking a NEW QUESTION.

OLD MEMORIES ABOUT THE USER:
${memoryList || 'No memories yet.'}

NEW QUESTION FROM USER:
"${userMessage}"

YOUR JOB:
1. Find which OLD MEMORIES would help answer this question better
2. Decide if this message reveals NEW FACTS about the user to remember

CRITICAL RULES FOR NEW MEMORIES:
DON'T save: Requests, questions, commands, one-time actions
   Examples of what NOT to save:
   - "i want to make shakes" → NO (temporary request)
   - "suggest me something" → NO (question)
   - "tell me about italy" → NO (request for info)
   - "what's the weather" → NO (question)

DO save: Personal facts, preferences, permanent information
   Examples of what TO save:
   - "i love bananas" → YES (preference)
   - "i'm allergic to peanuts" → YES (important fact)
   - "i live in delhi" → YES (permanent info)
   - "my name is rishi" → YES (identity)

MATCHING RELEVANT MEMORIES:
- For food/drink questions → Return ALL food preferences
- For location questions → Return location memories
- Be GENEROUS with matches - better to include too many than too few

EXAMPLES:

Example 1 - CORRECT MATCHING:
Memories: [1. User loves banana, 2. User is from Delhi]
Question: "i want to make shakes, suggest something"
Analysis: Banana is HIGHLY relevant (it's a food preference for drink question), Delhi is irrelevant
New memories: NO - "want to make shakes" is a REQUEST, not a fact about the user
Response: {"relevant": [1], "newMemories": []}

Example 2 - MULTIPLE FOOD MATCHES:
Memories: [1. User loves banana, 2. User loves apple, 3. User loves pav bhaji]
Question: "i want to make a juice"
Analysis: Banana and apple are BOTH relevant (all food preferences help), pav bhaji is food but less relevant to juice
New memories: NO - "want to make juice" is a REQUEST, not a preference
Response: {"relevant": [1, 2], "newMemories": []}

Example 3 - NO MATCH:
Memories: [1. User loves coding, 2. User speaks Hindi]
Question: "what's the weather?"
Analysis: No memories help with weather
New memories: NO - weather question doesn't reveal facts about user
Response: {"relevant": [], "newMemories": []}

Example 4 - EXTRACT NEW PREFERENCE:
Memories: [1. User loves banana]
Question: "i love mangoes"
Analysis: Banana not relevant to this statement
New memories: YES - "loves mangoes" is a PREFERENCE (permanent fact)
Response: {"relevant": [], "newMemories": [{"category": "food", "entity": "mangoes", "description": "User loves mangoes", "confidence": 0.95}]}

Example 5 - MULTIPLE NEW FACTS:
Question: "I am Naman Singh. I study CSE in NIT Jalandhar"
Analysis: Multiple permanent facts found
Response: {"relevant": [], "newMemories": [{"category": "personal_info", "entity": "Naman Singh", "description": "User is Naman Singh", "confidence": 0.99}, {"category": "education", "entity": "NIT Jalandhar", "description": "User studies CSE in NIT Jalandhar", "confidence": 0.95}]}

NOW ANALYZE:
Return ONLY valid JSON with this structure:
{
  "relevant": [array of memory numbers like 1, 2, 3 or empty []],
  "newMemories": [array of objects {category, entity, description, confidence} or empty []]
}

JSON:`;

  try {
    console.log('[SmartMemory] Processing message with', existingMemories.length, 'existing memories');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are a memory relevance analyzer. Your job is to identify which memories are truly relevant to a question, and detect new information. Be honest - if nothing is relevant, say so. Do not force connections. Respond only with valid JSON. CRITICAL: DO NOT use apostrophes or single quotes anywhere in the description or entity fields. Write "User is" instead of "User\'s" to prevent JSON parsing errors.' }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              relevant: {
                type: "array",
                items: { type: "integer" }
              },
              newMemories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    entity: { type: "string" },
                    description: { type: "string" },
                    confidence: { type: "number" }
                  }
                }
              }
            },
            required: ["relevant", "newMemories"]
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      console.error('[SmartMemory] API error:', response.status, errorData);
      throw new Error(`API error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!content) {
      console.warn('[SmartMemory] Empty response from API');
      throw new Error('Empty response from API');
    }

    console.log('[SmartMemory] Raw response:', content);

    // Parse JSON response
    const result = JSON.parse(content);

    // Convert indices to actual memories
    const relevantMemories = (result.relevant || [])
      .map(idx => existingMemories[idx - 1])
      .filter(mem => mem); // Filter out undefined

    console.log('[SmartMemory] Found', relevantMemories.length, 'relevant memories');

    if (result.newMemories && result.newMemories.length > 0) {
      console.log('[SmartMemory] New memories to extract:', result.newMemories);
    }

    return {
      relevant: relevantMemories,
      newMemories: result.newMemories || []
    };

  } catch (error) {
    console.error('[SmartMemory] Error processing message:', error);
    throw error;
  }
}

/**
 * Format memories for injection into chat
 * @param {Array} memories - Array of memory objects
 * @returns {string} Formatted context string
 */
function formatMemoriesForInjection(memories) {
  if (!memories || memories.length === 0) {
    return '';
  }

  const formatted = memories
    .map(mem => mem.description || `${mem.category}: ${mem.entity}`)
    .join('. ');

  return `\n\n[Personal Context: ${formatted}]`;
}
