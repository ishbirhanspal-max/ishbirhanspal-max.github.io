/**
 * OptiPixel Studio - Image Enhancer, Filter Studio & Social Crop Engine
 * Features real-time Canvas 2D filters, aesthetic presets, and social media aspect ratio framing
 */

class FilterStudioEngine {
  /**
   * Applies image adjustments and color filters
   */
  static applyFilters(sourceImage, filters = {}) {
    const {
      brightness = 100, // %
      contrast = 100,   // %
      saturate = 100,   // %
      blur = 0,         // px
      sepia = 0,        // %
      grayscale = 0,    // %
      hueRotate = 0,    // deg
      preset = 'none'
    } = filters;

    const width = sourceImage.naturalWidth || sourceImage.width;
    const height = sourceImage.naturalHeight || sourceImage.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) sepia(${sepia}%) grayscale(${grayscale}%) hue-rotate(${hueRotate}deg)`;

    if (preset === 'cyberpunk') {
      filterStr += ` hue-rotate(180deg) saturate(180%) contrast(120%)`;
    } else if (preset === 'vintage') {
      filterStr += ` sepia(50%) contrast(110%) brightness(95%)`;
    } else if (preset === 'noir') {
      filterStr += ` grayscale(100%) contrast(140%) brightness(90%)`;
    } else if (preset === 'warm') {
      filterStr += ` sepia(20%) saturate(130%) brightness(105%)`;
    } else if (preset === 'vibrant') {
      filterStr += ` saturate(160%) contrast(115%)`;
    }

    ctx.filter = filterStr;
    ctx.drawImage(sourceImage, 0, 0, width, height);

    return canvas;
  }

  /**
   * Crops and formats image for Social Media Presets with blurred background padding or solid fit
   */
  static applySocialCrop(sourceImage, options = {}) {
    const {
      ratio = '16:9', // '16:9' | '1:1' | '9:16' | '4:5' | '3:2' | '2:1'
      fitMode = 'blur-fill', // 'blur-fill' | 'cover' | 'contain-white' | 'contain-black'
      resolution = 1080 // Base target resolution
    } = options;

    let targetW = resolution;
    let targetH = resolution;

    if (ratio === '16:9') {
      targetW = 1920;
      targetH = 1080;
    } else if (ratio === '1:1') {
      targetW = 1080;
      targetH = 1080;
    } else if (ratio === '9:16') {
      targetW = 1080;
      targetH = 1920;
    } else if (ratio === '4:5') {
      targetW = 1080;
      targetH = 1350;
    } else if (ratio === '3:2') {
      targetW = 1200;
      targetH = 800;
    } else if (ratio === '2:1') {
      targetW = 1200;
      targetH = 600;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    const srcW = sourceImage.naturalWidth || sourceImage.width;
    const srcH = sourceImage.naturalHeight || sourceImage.height;

    if (fitMode === 'blur-fill') {
      // Draw zoomed blurred background
      ctx.save();
      ctx.filter = 'blur(20px) brightness(0.7)';
      ctx.drawImage(sourceImage, -20, -20, targetW + 40, targetH + 40);
      ctx.restore();

      // Draw crisp foreground image contained
      const scale = Math.min(targetW / srcW, targetH / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const drawX = (targetW - drawW) / 2;
      const drawY = (targetH - drawH) / 2;

      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 25;
      ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
    } else if (fitMode === 'cover') {
      // Zoom & crop to fill entire area
      const scale = Math.max(targetW / srcW, targetH / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const drawX = (targetW - drawW) / 2;
      const drawY = (targetH - drawH) / 2;
      ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
    } else {
      // Solid background contain
      ctx.fillStyle = fitMode === 'contain-white' ? '#ffffff' : '#0b0f19';
      ctx.fillRect(0, 0, targetW, targetH);
      const scale = Math.min(targetW / srcW, targetH / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const drawX = (targetW - drawW) / 2;
      const drawY = (targetH - drawH) / 2;
      ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
    }

    return canvas;
  }
}

window.FilterStudioEngine = FilterStudioEngine;
