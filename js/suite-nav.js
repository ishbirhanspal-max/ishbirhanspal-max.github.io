/**
 * OptiPixel Studio Universal Suite Navigation Injector
 * - Desktop mega-menu
 * - Mobile bottom drawer
 * - Global Ctrl+K / Cmd+K Spotlight Command Palette Search
 * - 1-Click PWA "Install App" prompt & Offline mode indicators
 */

(function() {
  const TOOLS = [
    { cat: 'Creative & Photo', items: [
      { name: 'Photo Collage', url: 'photo-collage.html', icon: '🖼️', keywords: 'grid layout split combine instagram story framing pan zoom' },
      { name: 'Photo Filters', url: 'photo-filters.html', icon: '🪄', keywords: 'color grading brightness contrast saturation cyberpunk film noir' },
      { name: 'Watermark Images', url: 'image-watermark.html', icon: '💧', keywords: 'watermark photo batch copyright stamp logo text tile protection' },
      { name: 'Photo Resizer', url: 'photo-resizer.html', icon: '📐', keywords: 'crop dimension aspect ratio pixels scale social' },
      { name: 'Passport Photo', url: 'passport-photo.html', icon: '👤', keywords: 'visa id 2x2 inch 35x45mm print sheet biometrics' },
      { name: 'Background Remover', url: 'background-remover.html', icon: '✂️', keywords: 'transparent png ai cut cutout erase' },
      { name: 'Image Compressor', url: 'image-compressor.html', icon: '🗜️', keywords: 'reduce size webp optimize compress jpg png' }
    ]},
    { cat: 'PDF & Documents', items: [
      { name: 'Visual PDF Editor', url: 'pdf-editor.html', icon: '📄', keywords: 'edit annotate draw sign merge rotate' },
      { name: 'PDF Compressor', url: 'pdf-compressor.html', icon: '📉', keywords: 'reduce pdf size mb kb shrink email' },
      { name: 'Images to PDF', url: 'image-to-pdf.html', icon: '📁', keywords: 'convert photos multiple jpg png to document' },
      { name: 'PDF to Images', url: 'pdf-to-image.html', icon: '🖼️', keywords: 'extract pages jpg png high resolution' },
      { name: 'OCR Text Scan', url: 'ocr-text-scan.html', icon: '🔍', keywords: 'extract text from photo scan document tesseract' }
    ]},
    { cat: 'Media & Security', items: [
      { name: 'Video to GIF', url: 'video-to-gif.html', icon: '🎞️', keywords: 'convert mp4 webm mov animated clip trim fps' },
      { name: 'Voice Recorder', url: 'voice-recorder.html', icon: '🎙️', keywords: 'record microphone audio waveform wav webm voice memo' },
      { name: 'QR Code Generator', url: 'qr-code-generator.html', icon: '📱', keywords: 'wifi url vcard whatsapp contact scan' },
      { name: 'Barcode Generator', url: 'barcode-generator.html', icon: '📊', keywords: 'code 128 ean 13 upc a code 39 retail packaging' },
      { name: 'Password Generator', url: 'password-generator.html', icon: '🔐', keywords: 'crypto secure strong random password generator' }
    ]}
  ];

  let flatTools = [];
  TOOLS.forEach(g => {
    g.items.forEach(t => {
      flatTools.push({ ...t, cat: g.cat });
    });
  });

  let selectedIndex = 0;
  let filteredTools = [...flatTools];
  let deferredPrompt = null;

  function initSuiteNav() {
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    const header = document.querySelector('header .navbar') || document.querySelector('header');
    if (!header) return;

    // 1. Search Trigger in Header
    if (!document.getElementById('suiteSearchBtn')) {
      const searchBtn = document.createElement('button');
      searchBtn.type = 'button';
      searchBtn.className = 'suite-search-trigger';
      searchBtn.id = 'suiteSearchBtn';
      searchBtn.title = 'Search studio tools (Ctrl+K)';
      searchBtn.innerHTML = `
        <span>🔍</span>
        <span class="suite-search-label">Search tools...</span>
        <span class="suite-kbd-badge">Ctrl K</span>
      `;
      searchBtn.onclick = openSpotlight;

      const navContainer = header.querySelector('.nav-actions') || header.querySelector('.nav-links');
      if (navContainer) {
        header.insertBefore(searchBtn, navContainer);
      } else {
        header.appendChild(searchBtn);
      }
    }

    // 2. Desktop Dropdown Menu (only on standalone subpages)
    if (!isIndexPage && !document.getElementById('suiteDropdownWrap')) {
      const dropdownWrap = document.createElement('div');
      dropdownWrap.className = 'suite-dropdown';
      dropdownWrap.id = 'suiteDropdownWrap';

      let menuHtml = '<div class="suite-dropdown-menu" id="suiteDropdownMenu">';
      TOOLS.forEach(group => {
        menuHtml += `<div class="suite-menu-section"><h5>${group.cat}</h5>`;
        group.items.forEach(t => {
          menuHtml += `<a href="${t.url}"><span class="suite-tool-icon">${t.icon}</span><span>${t.name}</span></a>`;
        });
        menuHtml += '</div>';
      });
      menuHtml += '</div>';

      dropdownWrap.innerHTML = `
        <button type="button" class="suite-dropdown-btn" id="suiteDropdownBtn" aria-haspopup="true">
          <span>Explore All</span>
          <span style="font-size: 0.75rem;">▾</span>
        </button>
        ${menuHtml}
      `;

      const lastBtn = header.querySelector('.nav-btn') || header.querySelector('a:last-child');
      if (lastBtn) {
        header.insertBefore(dropdownWrap, lastBtn);
      } else {
        header.appendChild(dropdownWrap);
      }

      // Add mobile tools menu button
      const mobBtn = document.createElement('button');
      mobBtn.type = 'button';
      mobBtn.className = 'suite-mobile-menu-btn';
      mobBtn.innerHTML = '⚡ Tools';
      mobBtn.onclick = openSuiteDrawer;
      header.appendChild(mobBtn);

      const btn = document.getElementById('suiteDropdownBtn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownWrap.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (!dropdownWrap.contains(e.target)) {
          dropdownWrap.classList.remove('open');
        }
      });
    }

    // 3. Mobile Drawer (only on standalone subpages that don't already have one)
    if (!isIndexPage && !document.getElementById('suiteMobileDrawer')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'suite-drawer-backdrop';
      backdrop.id = 'suiteDrawerBackdrop';
      backdrop.onclick = closeSuiteDrawer;
      document.body.appendChild(backdrop);

      const drawer = document.createElement('div');
      drawer.className = 'suite-drawer';
      drawer.id = 'suiteMobileDrawer';

      let drawerItems = '';
      flatTools.forEach(t => {
        drawerItems += `<a href="${t.url}" class="suite-drawer-item"><span>${t.icon}</span><span>${t.name}</span></a>`;
      });

      drawer.innerHTML = `
        <div class="suite-drawer-header">
          <div style="display:flex;align-items:center;gap:.5rem">
            <span style="font-size:1.3rem">⚡</span>
            <h3>All OptiPixel Tools</h3>
          </div>
          <button type="button" class="suite-drawer-close" onclick="closeSuiteDrawer()">✕</button>
        </div>
        <div class="suite-drawer-grid">
          ${drawerItems}
        </div>
      `;
      document.body.appendChild(drawer);
    }

    // 4. Spotlight Command Palette Modal (Available globally across all pages!)
    if (!document.getElementById('suiteSpotlightBackdrop')) {
      const spotBackdrop = document.createElement('div');
      spotBackdrop.className = 'suite-spotlight-backdrop';
      spotBackdrop.id = 'suiteSpotlightBackdrop';

      spotBackdrop.innerHTML = `
        <div class="suite-spotlight-modal" onclick="event.stopPropagation()">
          <div class="suite-spotlight-input-wrap">
            <span class="suite-spotlight-icon">🔍</span>
            <input type="text" class="suite-spotlight-input" id="suiteSpotlightInput" placeholder="Search any tool, e.g. 'collage', 'compress', 'watermark'..." autocomplete="off">
            <span class="suite-kbd-badge">ESC</span>
          </div>
          <div class="suite-spotlight-results" id="suiteSpotlightResults"></div>
          <div class="suite-spotlight-footer">
            <span>Navigation: ↑ ↓ to select &bull; Enter to open</span>
            <div style="display:flex;align-items:center;gap:.75rem">
              <button type="button" class="suite-install-trigger-btn" onclick="installStudioApp()" id="spotlightInstallBtn" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#38bdf8;padding:.2rem .6rem;border-radius:6px;font-size:.78rem;font-weight:600;cursor:pointer">📲 Install App</button>
              <span>100% Free &amp; Private</span>
            </div>
          </div>
        </div>
      `;

      spotBackdrop.onclick = closeSpotlight;
      document.body.appendChild(spotBackdrop);

      const input = document.getElementById('suiteSpotlightInput');
      input.addEventListener('input', (e) => {
        filterSpotlight(e.target.value);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex = (selectedIndex + 1) % Math.max(1, filteredTools.length);
          renderSpotlightResults();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = (selectedIndex - 1 + filteredTools.length) % Math.max(1, filteredTools.length);
          renderSpotlightResults();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredTools[selectedIndex]) {
            window.location.href = filteredTools[selectedIndex].url;
          }
        } else if (e.key === 'Escape') {
          closeSpotlight();
        }
      });
    }

    // Global Shortcut: Ctrl+K / Cmd+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSpotlight();
      } else if (e.key === 'Escape') {
        closeSpotlight();
        closeSuiteDrawer();
      }
    });

    // PWA Install Prompt handling
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    // Offline / Online status telemetry
    window.addEventListener('offline', () => {
      if (typeof OptiPixelSuite !== 'undefined') {
        OptiPixelSuite.showToast('📶 Offline Mode: All 16+ studio tools continue working 100% locally!', '#38bdf8');
      }
    });

    window.addEventListener('online', () => {
      if (typeof OptiPixelSuite !== 'undefined') {
        OptiPixelSuite.showToast('🌐 Connection restored!', '#10b981');
      }
    });
  }

  window.installStudioApp = async function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        if (typeof OptiPixelSuite !== 'undefined') {
          OptiPixelSuite.showToast('OptiPixel Studio installed to your device! 🚀');
        }
      }
      deferredPrompt = null;
    } else {
      if (typeof OptiPixelSuite !== 'undefined') {
        OptiPixelSuite.showToast('To install, tap browser menu (⋮ or Share) and select "Install" or "Add to Home Screen" 📲');
      }
    }
  };

  function filterSpotlight(q) {
    const term = q.toLowerCase().trim();
    if (!term) {
      filteredTools = [...flatTools];
    } else {
      filteredTools = flatTools.filter(t => 
        t.name.toLowerCase().includes(term) ||
        t.cat.toLowerCase().includes(term) ||
        (t.keywords && t.keywords.toLowerCase().includes(term))
      );
    }
    selectedIndex = 0;
    renderSpotlightResults();
  }

  function renderSpotlightResults() {
    const resultsContainer = document.getElementById('suiteSpotlightResults');
    if (!resultsContainer) return;

    if (filteredTools.length === 0) {
      resultsContainer.innerHTML = `<div style="padding:2rem;text-align:center;color:#64748b;font-size:.9rem">No matching tools found. Try "photo", "pdf", or "audio".</div>`;
      return;
    }

    let html = '';
    filteredTools.forEach((t, i) => {
      const isSel = i === selectedIndex ? 'selected' : '';
      html += `
        <a href="${t.url}" class="suite-spotlight-item ${isSel}">
          <div class="suite-spotlight-item-left">
            <span style="font-size:1.35rem">${t.icon}</span>
            <div>
              <div class="suite-spotlight-item-name">${t.name}</div>
              <div class="suite-spotlight-item-desc">${t.cat}</div>
            </div>
          </div>
          <span class="suite-spotlight-cat">Open ↵</span>
        </a>
      `;
    });
    resultsContainer.innerHTML = html;
  }

  window.openSpotlight = function() {
    const backdrop = document.getElementById('suiteSpotlightBackdrop');
    const input = document.getElementById('suiteSpotlightInput');
    if (backdrop && input) {
      backdrop.classList.add('open');
      filterSpotlight('');
      setTimeout(() => input.focus(), 50);
    }
  };

  window.closeSpotlight = function() {
    document.getElementById('suiteSpotlightBackdrop')?.classList.remove('open');
  };

  window.openSuiteDrawer = function() {
    document.getElementById('suiteDrawerBackdrop')?.classList.add('open');
    document.getElementById('suiteMobileDrawer')?.classList.add('open');
  };

  window.closeSuiteDrawer = function() {
    document.getElementById('suiteDrawerBackdrop')?.classList.remove('open');
    document.getElementById('suiteMobileDrawer')?.classList.remove('open');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuiteNav);
  } else {
    initSuiteNav();
  }
})();
