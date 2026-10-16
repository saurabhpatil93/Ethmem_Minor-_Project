// smartInjector.js - Smart Memory Injection
(function () {
  // Prevent double initialization
  if (window.__ETHMEM_INJECTOR_LOADED__) {
    console.log('[SmartInjector] Already loaded, skipping');
    return;
  }
  window.__ETHMEM_INJECTOR_LOADED__ = true;

  console.log('[SmartInjector] Loaded');

  let enabled = true;
  let processing = false;

  function init() {
    console.log('[SmartInjector] Init');
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);

    // For Claude: Use a different approach - observe contenteditable changes
    // and prepare injection before the API call
    if (window.location.hostname.includes('claude.ai')) {
      console.log('[SmartInjector] Setting up Claude-specific handlers');
      setupClaudeHandler();
    }

    // Debug: log all button clicks to see what's happening
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn && btn.type === 'submit') {
        console.log('[SmartInjector] Submit button clicked (debug):', {
          type: btn.type,
          className: btn.className,
          disabled: btn.disabled,
          form: !!btn.closest('form')
        });
      }
    }, true);
  }

  // Claude-specific handler that monitors the input and prepares injection
  function setupClaudeHandler() {
    let lastMessage = '';
    let preparingInjection = false;

    // Monitor for Enter key on contenteditable
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const el = document.querySelector('[contenteditable="true"]');
        if (el && el.innerText && el.innerText.trim()) {
          const msg = el.innerText.trim();
          console.log('[SmartInjector] Claude Enter detected, message:', msg.substring(0, 50));

          if (!preparingInjection && msg !== lastMessage) {
            preparingInjection = true;
            lastMessage = msg;

            // Don't prevent default - let Claude send the request
            // Instead, prepare the injection data IMMEDIATELY
            console.log('[SmartInjector] Preparing injection for Claude...');
            const res = await ask(msg);

            if (res.success && res.injectionText) {
              window.__ETHMEM_INJECTION__ = {
                originalMessage: msg,
                injectionText: res.injectionText,
                timestamp: Date.now()
              };
              console.log('[SmartInjector] ✅ Claude injection prepared:', res.relevant.length, 'memories');
              notify(res.relevant.length);
            }

            setTimeout(() => {
              preparingInjection = false;
            }, 2000);
          }
        }
      }
    }, true);

    // Also monitor button clicks
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[type="submit"]');
      if (btn) {
        const el = document.querySelector('[contenteditable="true"]');
        if (el && el.innerText && el.innerText.trim()) {
          const msg = el.innerText.trim();
          console.log('[SmartInjector] Claude submit button clicked, message:', msg.substring(0, 50));

          if (!preparingInjection && msg !== lastMessage) {
            preparingInjection = true;
            lastMessage = msg;

            console.log('[SmartInjector] Preparing injection for Claude...');
            const res = await ask(msg);

            if (res.success && res.injectionText) {
              window.__ETHMEM_INJECTION__ = {
                originalMessage: msg,
                injectionText: res.injectionText,
                timestamp: Date.now()
              };
              console.log('[SmartInjector] ✅ Claude injection prepared:', res.relevant.length, 'memories');
              notify(res.relevant.length);
            }

            setTimeout(() => {
              preparingInjection = false;
            }, 2000);
          }
        }
      }
    }, true);
  }

  async function onKey(e) {
    if (!enabled || processing || e.key !== 'Enter' || e.shiftKey) return;

    const el = e.target;
    if (el.getAttribute('contenteditable') !== 'true' && el.tagName !== 'TEXTAREA') return;

    const msg = el.tagName === 'TEXTAREA' ? el.value : el.innerText;
    if (!msg || !msg.trim()) return;

    // Platform detection for logging
    const isClaude = window.location.hostname.includes('claude.ai');
    const isASI = window.location.hostname.includes('asi1.ai');
    const platform = isClaude ? 'Claude' : isASI ? 'ASI' : window.location.hostname.includes('gemini.google.com') ? 'Gemini' : 'ChatGPT';

    console.log(`[SmartInjector] Intercept Enter key on ${platform}`);
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    await process(el, msg, () => {
      const evt = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
      el.dispatchEvent(evt);
    });
  }

  async function onSubmit(e) {
    if (!enabled || processing) return;

    const form = e.target;
    if (!form || form.tagName !== 'FORM') return;

    console.log('[SmartInjector] Form submit detected');

    const el = form.querySelector('[contenteditable="true"], textarea');
    if (!el) {
      console.log('[SmartInjector] No input element found in form');
      return;
    }

    const msg = el.tagName === 'TEXTAREA' ? el.value : el.innerText;
    if (!msg || !msg.trim()) {
      console.log('[SmartInjector] No message text in form');
      return;
    }

    const isClaude = window.location.hostname.includes('claude.ai');
    const isASI = window.location.hostname.includes('asi1.ai');
    const platform = isClaude ? 'Claude' : isASI ? 'ASI' : window.location.hostname.includes('gemini.google.com') ? 'Gemini' : 'ChatGPT';

    console.log(`[SmartInjector] Intercept form submit on ${platform}`);
    console.log('[SmartInjector] Message:', msg.substring(0, 50));

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    await process(el, msg, () => {
      // Re-submit the form
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
      } else {
        form.submit();
      }
    });
  }

  async function onClick(e) {
    if (!enabled || processing) return;

    const btn = e.target.closest('button');
    if (!btn) return;

    // Platform-specific detection
    const isClaude = window.location.hostname.includes('claude.ai');
    const isGemini = window.location.hostname.includes('gemini.google.com');
    const isChatGPT = window.location.hostname.includes('openai.com') || window.location.hostname.includes('chatgpt.com');
    const isASI = window.location.hostname.includes('asi1.ai');

    // Check for send button - different platforms use different attributes
    let isSend = false;

    if (isClaude) {
      // Claude: Look for send button characteristics
      // Check aria-label, button type, or if it's near the contenteditable
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      const hasSubmitType = btn.type === 'submit';
      const hasSvg = btn.querySelector('svg');
      const isEnabled = !btn.disabled;

      // Debug: log button details
      if (hasSvg || hasSubmitType) {
        console.log('[SmartInjector] Claude button clicked:', {
          ariaLabel,
          type: btn.type,
          disabled: btn.disabled,
          hasSvg,
          className: btn.className
        });
      }

      isSend = ariaLabel.includes('send') ||
        hasSubmitType ||
        (hasSvg && isEnabled && btn.closest('form'));
    } else if (isGemini) {
      // Gemini: typically has data-testid or specific button styling
      isSend = btn.getAttribute('data-testid')?.includes('send') ||
        btn.type === 'submit';
    } else if (isChatGPT) {
      // ChatGPT: data-testid with 'send' or 'submit'
      isSend = btn.getAttribute('data-testid')?.includes('send') ||
        btn.type === 'submit';
    } else if (isASI) {
      // ASI: The send button is typically a rounded button with specific classes
      // It has 'bg-base-primary' class and is in the right section
      const hasPrimaryBg = btn.classList.contains('bg-base-primary');
      const isRounded = btn.classList.contains('rounded-full');
      const hasTransition = btn.classList.contains('transition-all');

      // Debug: log button details for ASI
      if (hasPrimaryBg || isRounded || btn.type === 'submit') {
        console.log('[SmartInjector] ASI button clicked:', {
          hasPrimaryBg,
          isRounded,
          hasTransition,
          type: btn.type,
          className: btn.className
        });
      }

      isSend = (hasPrimaryBg && isRounded) || btn.type === 'submit';
    } else {
      // Fallback for any platform
      isSend = btn.getAttribute('data-testid')?.includes('send') ||
        btn.type === 'submit' ||
        btn.getAttribute('aria-label')?.toLowerCase().includes('send');
    }

    if (!isSend) {
      console.log('[SmartInjector] Button not recognized as send button');
      return;
    }

    // Don't intercept our own EthMem button
    if (btn.classList.contains('ext-logo-button') || btn.classList.contains('ext-logo-button-textbar')) {
      console.log('[SmartInjector] Skipping EthMem button');
      return;
    }

    const el = document.querySelector('[contenteditable="true"], textarea');
    if (!el) {
      console.log('[SmartInjector] Could not find contenteditable or textarea element');
      return;
    }

    const msg = el.tagName === 'TEXTAREA' ? el.value : el.innerText;
    if (!msg || !msg.trim()) {
      console.log('[SmartInjector] No message text found');
      return;
    }

    console.log('[SmartInjector] Intercept btn click for', isClaude ? 'Claude' : isGemini ? 'Gemini' : isChatGPT ? 'ChatGPT' : isASI ? 'ASI' : 'unknown platform');
    console.log('[SmartInjector] Message:', msg.substring(0, 50));
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    await process(el, msg, () => btn.click());
  }

  async function process(el, msg, send) {
    processing = true;
    console.log('[SmartInjector] Process called with message:', msg.substring(0, 50));

    try {
      console.log('[SmartInjector] Asking for relevant memories...');
      const res = await ask(msg);
      console.log('[SmartInjector] Got response:', res);

      // Platform detection
      const isGemini = window.location.hostname.includes('gemini.google.com');
      const isClaude = window.location.hostname.includes('claude.ai');
      const isChatGPT = window.location.hostname.includes('openai.com') || window.location.hostname.includes('chatgpt.com');
      const isASI = window.location.hostname.includes('asi1.ai');

      // Use API-level injection for all platforms (invisible, more robust)
      if (isChatGPT || isClaude || isASI || isGemini) {
        if (res.success && res.injectionText) {
          console.log('[SmartInjector] Preparing invisible injection for', res.relevant.length, 'memories');

          // Store injection context globally so pageScript can access it
          window.__ETHMEM_INJECTION__ = {
            originalMessage: msg,
            injectionText: res.injectionText,
            timestamp: Date.now()
          };

          console.log('[SmartInjector] Injection stored, original message preserved');
          notify(res.relevant.length);
        } else {
          console.log('[SmartInjector] No memories to inject');
        }

        // IMPORTANT: Make sure the text field has ONLY the original message
        if (el.tagName === 'TEXTAREA') {
          el.value = msg;
        } else {
          el.innerText = msg;
        }

        // Wait a tiny bit to ensure UI is updated
        await sleep(50);

        // Now send - the original message will be visible but API will get context
        send();
        return;
      }

    } catch (err) {
      console.error('[SmartInjector] Error:', err);
      send();
    } finally {
      processing = false;
    }
  }

  function ask(msg) {
    return new Promise((ok) => {
      window.postMessage({ type: 'ETHMEM_SMART', payload: { userMessage: msg } }, '*');

      const h = (e) => {
        if (e.data.type === 'ETHMEM_SMART_RES') {
          window.removeEventListener('message', h);
          ok(e.data.payload);
        }
      };
      window.addEventListener('message', h);

      setTimeout(() => {
        window.removeEventListener('message', h);
        ok({ success: false });
      }, 5000);
    });
  }

  function notify(n) {
    const d = document.createElement('div');

    // Create elements safely without innerHTML (Gemini CSP compliance)
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;';

    const icon = document.createElement('span');
    icon.style.fontSize = '16px';
    icon.textContent = '🧠';

    const text = document.createElement('span');
    text.textContent = `${n} ${n === 1 ? 'memory' : 'memories'} injected`;

    wrapper.appendChild(icon);
    wrapper.appendChild(text);
    d.appendChild(wrapper);

    d.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;background:#111714;border:1px solid #38e078;color:#38e078;padding:12px 20px;border-radius:8px;font:600 14px system-ui,-apple-system,sans-serif;box-shadow:0 4px 12px rgba(56,224,120,0.3);animation:slideIn 0.3s ease-out';

    // Add keyframes if not exists
    if (!document.getElementById('ethmem-notify-style')) {
      const style = document.createElement('style');
      style.id = 'ethmem-notify-style';
      style.textContent = '@keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(400px);opacity:0}}';
      document.head.appendChild(style);
    }

    document.body.appendChild(d);

    setTimeout(() => {
      d.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => d.remove(), 300);
    }, 2500);
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(); // End of IIFE
