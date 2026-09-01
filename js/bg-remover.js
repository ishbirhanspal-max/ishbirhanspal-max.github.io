/**
 * OptiPixel Studio - Client-side Background Removal Engine
 * Features:
 * - Automatic background color detection & alpha extraction
 * - Magic Wand color tolerance & edge feathering
 * - Manual Erase & Restore brush tools
 * - Background replacement (Transparent, Solid Color, Gradient)
 */

class BackgroundRemoverEngine {
  constructor() {}

  /**
   * Automatically removes solid, gradient, or studio backgrounds using edge color sampling and alpha matting
   * @param {HTMLImageElement|HTMLCanvasElement} sourceImage 
   * @param {Object} options - { tolerance: 25, feather: 2, customBg: 'transparent' | '#ffffff' | 'gradient' }
   * @returns {HTMLCanvasElement}
   */
  static processBackgroundRemoval(sourceImage, options = {}) {
    const { tolerance = 25, feather = 2, customBg = 'transparent', gradientType = 'none' } = options;

    const width = sourceImage.naturalWidth || sourceImage.width;
    const height = sourceImage.naturalHeight || sourceImage.height;

    // Work canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(sourceImage, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Sample background colors from 4 corners and borders
    const samplePoints = [
      0, // top-left
      (width - 1) * 4, // top-right
      ((height - 1) * width) * 4, // bottom-left
      ((height - 1) * width + (width - 1)) * 4, // bottom-right
      (Math.floor(width / 2)) * 4, // top-center
      ((height - 1) * width + Math.floor(width / 2)) * 4 // bottom-center
    ];

    const bgColors = [];
    samplePoints.forEach(idx => {
      bgColors.push({
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2]
      });
    });

    const maxDist = tolerance * 4.41; // Max RGB euclidean distance scaled by tolerance (0-100)

    // Calculate alpha mask based on color distance to background samples
    const alphaMask = new Uint8Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const pixelIdx = i / 4;

      let minDistance = 999999;
      for (const bg of bgColors) {
        const dr = r - bg.r;
        const dg = g - bg.g;
        const db = b - bg.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < minDistance) minDistance = dist;
      }

      if (minDistance < maxDist) {
        // Soft edge transition
        const edgeFactor = minDistance / maxDist;
        if (edgeFactor < 0.6) {
          alphaMask[pixelIdx] = 0;
        } else {
          alphaMask[pixelIdx] = Math.round(((edgeFactor - 0.6) / 0.4) * 255);
        }
      } else {
        alphaMask[pixelIdx] = 255;
      }
    }

    // Apply alpha mask to image data
    for (let i = 0; i < data.length; i += 4) {
      const pixelIdx = i / 4;
      const alpha = alphaMask[pixelIdx];
      data[i + 3] = Math.min(data[i + 3], alpha);
    }

    // Put cut-out foreground on result canvas
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = width;
    resultCanvas.height = height;
    const resCtx = resultCanvas.getContext('2d');

    // Draw new custom background if specified
    if (customBg !== 'transparent') {
      if (customBg === 'gradient') {
        const grad = resCtx.createLinearGradient(0, 0, width, height);
        if (gradientType === 'sunset') {
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(1, '#ec4899');
        } else if (gradientType === 'cyber') {
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(1, '#6366f1');
        } else {
          grad.addColorStop(0, '#3b82f6');
          grad.addColorStop(1, '#9333ea');
        }
        resCtx.fillStyle = grad;
      } else {
        resCtx.fillStyle = customBg;
      }
      resCtx.fillRect(0, 0, width, height);
    }

    // Draw masked foreground
    ctx.putImageData(imgData, 0, 0);
    resCtx.drawImage(canvas, 0, 0);

    return resultCanvas;
  }
}

window.BackgroundRemoverEngine = BackgroundRemoverEngine;
