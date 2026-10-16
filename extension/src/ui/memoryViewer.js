// memoryViewer.js
// Memory Viewer UI Component

console.log('[EthMem] Memory Viewer UI loaded');

/**
 * Open memory viewer modal
 */
function openMemoryViewer() {
  console.log('[EthMem] Opening memory viewer');
  
  // Check if viewer already exists
  if (document.getElementById('ethmem-viewer')) {
    console.log('[EthMem] Viewer already open');
    return;
  }
  
  // Request memories from background script
  chrome.runtime.sendMessage({ type: 'GET_MEMORIES' }).then(response => {
    const memories = response.memories || [];
    console.log('[EthMem] Fetched memories:', memories.length);
    renderMemoryViewer(memories);
  }).catch(error => {
    console.error('[EthMem] Error fetching memories:', error);
    renderMemoryViewer([]);
  });
}

/**
 * Render memory viewer modal
 */
function renderMemoryViewer(memories) {
  const viewer = document.createElement('div');
  viewer.id = 'ethmem-viewer';
  viewer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10001;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
  `;
  
  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  const title = document.createElement('h2');
  title.textContent = '🧠 Your Memories';
  title.style.cssText = 'margin: 0; font-size: 24px;';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
  `;
  closeBtn.addEventListener('click', () => viewer.remove());
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Content
  const content = document.createElement('div');
  content.style.cssText = `
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  `;
  
  if (memories.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <p style="font-size: 18px; margin: 0;">No memories yet</p>
        <p style="font-size: 14px; color: #999; margin-top: 8px;">Start chatting to extract memories!</p>
      </div>
    `;
  } else {
    memories.forEach(memory => {
      const memoryCard = createMemoryCard(memory);
      content.appendChild(memoryCard);
    });
  }
  
  modal.appendChild(header);
  modal.appendChild(content);
  viewer.appendChild(modal);
  document.body.appendChild(viewer);
  
  // Close on outside click
  viewer.addEventListener('click', (e) => {
    if (e.target === viewer) {
      viewer.remove();
    }
  });
}

/**
 * Create memory card element
 */
function createMemoryCard(memory) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #f8f9fa;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    border-left: 4px solid ${getCategoryColor(memory.category)};
  `;
  
  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
      <span style="
        background: ${getCategoryColor(memory.category)};
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      ">${memory.category}</span>
      <span style="color: #999; font-size: 12px;">${formatTimestamp(memory.timestamp)}</span>
    </div>
    <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px;">${escapeHtml(memory.entity)}</div>
    <div style="font-size: 14px; color: #666; line-height: 1.5;">${escapeHtml(memory.source)}</div>
    <div style="margin-top: 8px; font-size: 12px; color: #999;">
      Confidence: ${(memory.metadata.confidence * 100).toFixed(0)}% • 
      Status: <span style="color: ${memory.status === 'on-chain' ? '#10b981' : '#6b7280'}">${memory.status}</span>
    </div>
  `;
  
  return card;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get color for category
 */
function getCategoryColor(category) {
  const colors = {
    location: '#3b82f6',
    name: '#8b5cf6',
    age: '#ec4899',
    occupation: '#f59e0b',
    food: '#10b981',
    hobby: '#06b6d4',
    music: '#a855f7',
    movie: '#f97316',
    family: '#ef4444',
    friend: '#14b8a6',
    skill: '#6366f1',
    language: '#84cc16',
    education: '#0ea5e9',
    allergy: '#dc2626',
    medication: '#fb923c',
    health: '#f43f5e',
    visited: '#22c55e',
    planning: '#3b82f6'
  };
  
  return colors[category] || '#6b7280';
}

/**
 * Format timestamp
 */
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

// Export for use in content script
if (typeof window !== 'undefined') {
  window.EthMemViewer = {
    open: openMemoryViewer
  };
}
