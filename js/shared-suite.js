/**
 * OptiPixel Studio Shared Suite Utilities
 * - Universal Cross-Tool Image Pipeline
 * - 1-Click Clipboard Image Copy
 * - Instant Offline Procedural Sample Photo Generators
 * - Universal Header Mega-Menu & Mobile Drawer
 */

const OptiPixelSuite = {
  // 1. Copy Canvas Image Directly to System Clipboard
  async copyCanvas(canvas, successToastMsg = 'Copied image to clipboard! 📋') {
    try {
      if (!canvas) throw new Error('Canvas element not provided');
      canvas.toBlob(async (blob) => {
        if (!blob) {
          OptiPixelSuite.showToast('Failed to create image blob', '#ef4444');
          return;
        }
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            OptiPixelSuite.showToast(successToastMsg);
          } else {
            throw new Error('Clipboard API not supported in this browser');
          }
        } catch (err) {
          console.warn('Clipboard write error:', err);
          OptiPixelSuite.showToast('Please right-click image to copy', '#f59e0b');
        }
      }, 'image/png');
    } catch (e) {
      console.error(e);
      OptiPixelSuite.showToast('Could not copy image: ' + e.message, '#ef4444');
    }
  },

  // 2. Inter-Tool Pipeline: Send current image to another tool
  sendTo(canvas, targetPage, toolName = 'target tool') {
    if (!canvas) {
      OptiPixelSuite.showToast('Please generate or upload an image first', '#ef4444');
      return;
    }
    try {
      const dataUrl = canvas.toDataURL('image/png');
      sessionStorage.setItem('optipixel_pipeline_image', dataUrl);
      sessionStorage.setItem('optipixel_pipeline_timestamp', Date.now().toString());
      OptiPixelSuite.showToast(`Opening in ${toolName}... ⚡`);
      setTimeout(() => {
        window.location.href = targetPage;
      }, 300);
    } catch (e) {
      console.error('Storage quota or error:', e);
      OptiPixelSuite.showToast('Could not transfer image: ' + e.message, '#ef4444');
    }
  },

  // 3. Inter-Tool Pipeline: Check if an incoming image exists
  receiveImage(callback) {
    try {
      const dataUrl = sessionStorage.getItem('optipixel_pipeline_image');
      if (dataUrl) {
        sessionStorage.removeItem('optipixel_pipeline_image');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          OptiPixelSuite.showToast('✨ Loaded image from previous tool!');
          if (typeof callback === 'function') callback(img, dataUrl);
        };
        img.src = dataUrl;
        return true;
      }
    } catch (e) {
      console.warn('Error reading pipeline image:', e);
    }
    return false;
  },

  // 4. Instant Offline Procedural Sample Photo Generator
  // Creates high-res, visually stunning landscape, portrait, neon, and sunset photos
  getSampleImage(theme = 'sunset', w = 1200, h = 900) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    if (theme === 'sunset') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.35, '#ec4899');
      grad.addColorStop(0.7, '#8b5cf6');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Glowing Sun
      const sunGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, 180);
      sunGrad.addColorStop(0, '#fffbeb');
      sunGrad.addColorStop(0.4, '#fde047');
      sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, 180, 0, Math.PI * 2);
      ctx.fill();

      // Mountain silhouette 1
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.7);
      ctx.lineTo(w * 0.25, h * 0.52);
      ctx.lineTo(w * 0.55, h * 0.65);
      ctx.lineTo(w * 0.8, h * 0.48);
      ctx.lineTo(w, h * 0.68);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Mountain silhouette 2 (Foreground)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.85);
      ctx.lineTo(w * 0.35, h * 0.68);
      ctx.lineTo(w * 0.7, h * 0.82);
      ctx.lineTo(w, h * 0.72);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
    } else if (theme === 'cyberpunk') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Neon Grids
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      for (let y = h * 0.6; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let x = 0; x < w; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, h * 0.6); ctx.lineTo(x * 1.3 - w * 0.15, h); ctx.stroke();
      }

      // Neon Orb
      const orb = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.35, 160);
      orb.addColorStop(0, '#f43f5e');
      orb.addColorStop(0.7, '#8b5cf6');
      orb.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = orb;
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.35, 160, 0, Math.PI * 2); ctx.fill();
    } else if (theme === 'portrait') {
      // Clean studio portrait backdrop with stylized avatar
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Head
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.38, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders / Torso
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.82, Math.min(w, h) * 0.42, Math.min(w, h) * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ocean wave abstract
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.6, '#0d9488');
      grad.addColorStop(1, '#065f46');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(w * (0.2 + i * 0.18), h * (0.3 + (i % 2) * 0.3), 120, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const img = new Image();
    img.src = c.toDataURL('image/jpeg', 0.92);
    return img;
  },

  // 5. Shared Toast Utility
  showToast(msg, color = '#10b981') {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:#10b981;color:#fff;padding:.75rem 1.5rem;border-radius:10px;font-weight:600;font-size:.9rem;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.4);transform:translateY(120%);transition:transform .3s;max-width:90vw;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = color;
    t.style.transform = 'translateY(0)';
    setTimeout(() => {
      t.style.transform = 'translateY(120%)';
    }, 3200);
  }
};

// Auto-register service worker across all subpages for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(e => console.debug('SW:', e));
  });
}
