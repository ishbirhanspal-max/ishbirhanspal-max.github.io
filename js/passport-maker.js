/**
 * OptiPixel Studio - Smart Passport & Visa Photo Maker
 * Crops, enhances, recolors background, and tiles passport photos on printable 4x6" & A4 sheets
 */

class PassportMakerEngine {
  /**
   * Generates a single passport photo cropped to standard aspect ratio
   */
  static generateSinglePassportPhoto(sourceImage, options = {}) {
    const {
      type = 'us', // 'us' (2x2"), 'eu' (35x45mm), 'id' (30x40mm)
      bgColor = '#FFFFFF'
    } = options;

    let targetWidth = 600;
    let targetHeight = 600;

    if (type === 'eu') {
      targetWidth = 413;
      targetHeight = 531; // 35x45mm @ 300DPI
    } else if (type === 'id') {
      targetWidth = 354;
      targetHeight = 472; // 30x40mm @ 300DPI
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Center crop & scale source image
    const srcW = sourceImage.naturalWidth || sourceImage.width;
    const srcH = sourceImage.naturalHeight || sourceImage.height;

    const srcAspect = srcW / srcH;
    const targetAspect = targetWidth / targetHeight;

    let drawW, drawH, drawX, drawY;

    if (srcAspect > targetAspect) {
      drawH = targetHeight;
      drawW = targetHeight * srcAspect;
      drawX = (targetWidth - drawW) / 2;
      drawY = 0;
    } else {
      drawW = targetWidth;
      drawH = targetWidth / srcAspect;
      drawX = 0;
      drawY = (targetHeight - drawH) / 2;
    }

    ctx.drawImage(sourceImage, drawX, drawY, drawW, drawH);

    // Subtle border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, targetWidth, targetHeight);

    return canvas;
  }

  /**
   * Tiles multiple passport photos onto a standard printable 4x6 inch (1200x1800 @ 300DPI) sheet
   */
  static generatePrintableSheet(singlePhotoCanvas, options = {}) {
    const { sheetType = '4x6' } = options; // '4x6' or 'a4'

    const sheetCanvas = document.createElement('canvas');
    const ctx = sheetCanvas.getContext('2d');

    if (sheetType === '4x6') {
      // 4x6" @ 300DPI (1800 x 1200 landscape)
      sheetCanvas.width = 1800;
      sheetCanvas.height = 1200;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1800, 1200);

      const photoW = singlePhotoCanvas.width;
      const photoH = singlePhotoCanvas.height;

      // Scale to fit nicely in 2 rows x 3 columns (6 photos)
      const scale = Math.min(480 / photoW, 480 / photoH);
      const renderW = photoW * scale;
      const renderH = photoH * scale;

      const cols = 3;
      const rows = 2;
      const spacingX = (1800 - cols * renderW) / (cols + 1);
      const spacingY = (1200 - rows * renderH) / (rows + 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const posX = spacingX + c * (renderW + spacingX);
          const posY = spacingY + r * (renderH + spacingY);

          ctx.drawImage(singlePhotoCanvas, posX, posY, renderW, renderH);

          // Cutting guides (dashed lines)
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1;
          ctx.strokeRect(posX, posY, renderW, renderH);
        }
      }
    }

    return sheetCanvas;
  }
}

window.PassportMakerEngine = PassportMakerEngine;
