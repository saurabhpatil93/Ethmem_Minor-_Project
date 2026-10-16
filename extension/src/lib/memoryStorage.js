// Memory Storage Module
// Manages IndexedDB for storing memories locally

console.log('[EthMem] Memory Storage loaded');

const DB_NAME = 'EthMemDB';
const DB_VERSION = 1;
const STORE_NAME = 'memories';

let dbInstance = null;

/**
 * Initialize IndexedDB
 */
async function initDB() {
  if (dbInstance) return dbInstance;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('[EthMem] IndexedDB error:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[EthMem] IndexedDB initialized');
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for efficient querying
        objectStore.createIndex('category', 'category', { unique: false });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
        
        console.log('[EthMem] Object store created');
      }
    };
  });
}

/**
 * Save memory to IndexedDB
 */
async function saveMemory(memory) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const request = objectStore.add(memory);
      
      request.onsuccess = () => {
        console.log('[EthMem] Memory saved:', memory.id);
        resolve(memory);
      };
      
      request.onerror = () => {
        console.error('[EthMem] Error saving memory:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[EthMem] Error in saveMemory:', error);
    throw error;
  }
}

/**
 * Get all memories
 */
async function getAllMemories() {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const request = objectStore.getAll();
      
      request.onsuccess = () => {
        const memories = request.result || [];
        console.log('[EthMem] Retrieved memories:', memories.length);
        resolve(memories);
      };
      
      request.onerror = () => {
        console.error('[EthMem] Error getting memories:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[EthMem] Error in getAllMemories:', error);
    return [];
  }
}

/**
 * Get memories by category
 */
async function getMemoriesByCategory(category) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('category');
      
      const request = index.getAll(category);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[EthMem] Error in getMemoriesByCategory:', error);
    return [];
  }
}

/**
 * Get memory by ID
 */
async function getMemoryById(id) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const request = objectStore.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[EthMem] Error in getMemoryById:', error);
    return null;
  }
}

/**
 * Update memory
 */
async function updateMemory(memory) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const request = objectStore.put(memory);
      
      request.onsuccess = () => {
        console.log('[EthMem] Memory updated:', memory.id);
        resolve(memory);
      };
      
      request.onerror = () => {
        console.error('[EthMem] Error updating memory:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[EthMem] Error in updateMemory:', error);
    throw error;
  }
}

/**
 * Delete memory by ID
 */
async function deleteMemory(id) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const request = objectStore.delete(id);
      
      request.onsuccess = () => {
        console.log('[EthMem] Memory deleted:', id);
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('[EthMem] Error deleting memory:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[EthMem] Error in deleteMemory:', error);
    throw error;
  }
}

/**
 * Clear all memories
 */
async function clearAllMemories() {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      const request = objectStore.clear();
      
      request.onsuccess = () => {
        console.log('[EthMem] All memories cleared');
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('[EthMem] Error clearing memories:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('[EthMem] Error in clearAllMemories:', error);
    throw error;
  }
}

/**
 * Check for duplicate memories
 */
async function isDuplicate(memory) {
  try {
    const memories = await getMemoriesByCategory(memory.category);
    
    return memories.some(existing => 
      existing.entity.toLowerCase() === memory.entity.toLowerCase() &&
      existing.category === memory.category
    );
  } catch (error) {
    console.error('[EthMem] Error checking duplicate:', error);
    return false;
  }
}

/**
 * Get memory statistics
 */
async function getStats() {
  try {
    const memories = await getAllMemories();
    
    const stats = {
      total: memories.length,
      byCategory: {},
      byStatus: {
        local: 0,
        synced: 0,
        'on-chain': 0
      },
      recent: memories.slice(-5).reverse()
    };
    
    memories.forEach(memory => {
      // Count by category
      stats.byCategory[memory.category] = (stats.byCategory[memory.category] || 0) + 1;
      
      // Count by status
      stats.byStatus[memory.status] = (stats.byStatus[memory.status] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('[EthMem] Error getting stats:', error);
    return {
      total: 0,
      byCategory: {},
      byStatus: { local: 0, synced: 0, 'on-chain': 0 },
      recent: []
    };
  }
}

// Export functions for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initDB,
    saveMemory,
    getAllMemories,
    getMemoriesByCategory,
    getMemoryById,
    updateMemory,
    deleteMemory,
    clearAllMemories,
    isDuplicate,
    getStats
  };
}
