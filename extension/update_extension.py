import re
import os

filepath = '/home/naman/Desktop/CODE/EthMem-main/extension/src/content/contentScript.js'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Remove injectEthAdapter definition
content = re.sub(r'  // Inject ethAdapter\.js into the page context for wallet connection.*?}\n  }\n', '', content, flags=re.DOTALL)

# 2. Remove injectEthAdapter call
content = content.replace('  injectEthAdapter();\n', '')

# 3. Replace createLogoButton, insertLogoInTextbar, insertLogoInHeader with insertFloatingButton
floating_button_code = """
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
"""

content = re.sub(r'  function createLogoButton\((.*?)\} // catch\n  }', floating_button_code, content, flags=re.DOTALL)

# Let's fix the regex to capture from createLogoButton to the end of insertLogoInHeader
# Since regex can be tricky with DOTALL across huge chunks, let's use string split/replacement
start_marker = "  function createLogoButton(isTextbar = false) {"
end_marker = "      console.warn('[EthMem] insertLogoInHeader error', e);\n      return false;\n    }\n  }"

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker) + len(end_marker)
    content = content[:start_idx] + floating_button_code.strip('\n') + "\n" + content[end_idx:]


# 4. Modify memory card to add delete button
old_card_append = """    card.appendChild(categoryBadge);
    card.appendChild(value);"""

new_card_append = """    const headerRow = document.createElement('div');
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
    card.appendChild(value);"""

content = content.replace(old_card_append, new_card_append)

# 5. Replace references to insertLogoInHeader, etc
content = re.sub(r'const success = insertLogoInHeader\(\);', 'const success = insertFloatingButton();', content)
content = re.sub(r'const success = insertLogoInTextbar\(\);', 'const success = insertFloatingButton();', content)
content = re.sub(r'insertLogoInTextbar\(\);', 'insertFloatingButton();', content)
content = content.replace("document.querySelector('.ext-logo-button-textbar')", "document.getElementById('ethmem-floating-btn')")

# Remove redundant ASI code setup if we are using the floating button?
# We can just leave the intervals and they will call insertFloatingButton()

with open(filepath, 'w') as f:
    f.write(content)

print("Updated contentScript.js")
