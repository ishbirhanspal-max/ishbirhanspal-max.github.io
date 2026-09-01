/**
 * OptiPixel Studio - Smart Photo Collage & Grid Maker
 * Arranges 2 to 6 images into aesthetic grids with custom spacing, radius, and background
 */

class CollageMakerEngine {
  /**
   * Generates a photo collage canvas
   */
  static generateCollage(images, options = {}) {
    const {
      layout = '2x2', // '2-side', '2-vert', '3-grid', '2x2', '6-grid'
      spacing = 12,
      radius = 8,
      bgColor = '#FFFFFF',
      width = 1200,
      height = 1200
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    if (!images || images.length === 0) return canvas;

    let cells = [];

    if (layout === '2-side') {
      const cellW = (width - spacing * 3) / 2;
      const cellH = height - spacing * 2;
      cells = [
        { x: spacing, y: spacing, w: cellW, h: cellH },
        { x: spacing * 2 + cellW, y: spacing, w: cellW, h: cellH }
      ];
    } else if (layout === '2-vert') {
      const cellW = width - spacing * 2;
      const cellH = (height - spacing * 3) / 2;
      cells = [
        { x: spacing, y: spacing, w: cellW, h: cellH },
        { x: spacing, y: spacing * 2 + cellH, w: cellW, h: cellH }
      ];
    } else if (layout === '3-grid') {
      const topH = (height - spacing * 3) * 0.55;
      const botH = (height - spacing * 3) * 0.45;
      const botW = (width - spacing * 3) / 2;
      cells = [
        { x: spacing, y: spacing, w: width - spacing * 2, h: topH },
        { x: spacing, y: spacing * 2 + topH, w: botW, h: botH },
        { x: spacing * 2 + botW, y: spacing * 2 + topH, w: botW, h: botH }
      ];
    } else if (layout === '6-grid') {
      const cols = 3;
      const rows = 2;
      const cellW = (width - spacing * (cols + 1)) / cols;
      const cellH = (height - spacing * (rows + 1)) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({
            x: spacing + c * (cellW + spacing),
            y: spacing + r * (cellH + spacing),
            w: cellW,
            h: cellH
          });
        }
      }
    } else {
      // 2x2 Quad Grid (Default)
      const cellW = (width - spacing * 3) / 2;
      const cellH = (height - spacing * 3) / 2;
      cells = [
        { x: spacing, y: spacing, w: cellW, h: cellH },
        { x: spacing * 2 + cellW, y: spacing, w: cellW, h: cellH },
        { x: spacing, y: spacing * 2 + cellH, w: cellW, h: cellH },
        { x: spacing * 2 + cellW, y: spacing * 2 + cellH, w: cellW, h: cellH }
      ];
    }

    // Draw each image clipped with border radius
    cells.forEach((cell, idx) => {
      const img = images[idx % images.length];
      if (!img) return;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cell.x, cell.y, cell.w, cell.h, radius);
      ctx.clip();

      // Cover crop image
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      const scale = Math.max(cell.w / srcW, cell.h / srcH);
      const drawW = srcW * scale;
      const drawH = srcH * scale;
      const drawX = cell.x + (cell.w - drawW) / 2;
      const drawY = cell.y + (cell.h - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    });

    return canvas;
  }
}

window.CollageMakerEngine = CollageMakerEngine;
