/**
 * OptiPixel Studio - Image Compression & Conversion Engine
 * High-performance client-side image optimization using Canvas API
 */

class ImageCompressorEngine {
  constructor() {}

  /**
   * Reads a File object and returns an Image element and its metadata
   * @param {File} file 
   * @returns {Promise<{img: HTMLImageElement, name: string, type: string, size: number}>}
   */
  static loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            img,
            name: file.name,
            originalType: file.type || 'image/jpeg',
            originalSize: file.size,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            originalDataUrl: e.target.result
          });
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Computes target dimensions based on settings
   * @param {number} srcWidth 
   * @param {number} srcHeight 
   * @param {Object} options 
   * @returns {{width: number, height: number}}
   */
  static calculateDimensions(srcWidth, srcHeight, options = {}) {
    let { resizeMode = 'original', scalePercent = 100, maxWidth = 0, maxHeight = 0, customWidth = 0, customHeight = 0 } = options;

    if (resizeMode === 'percentage') {
      const factor = Math.max(0.01, scalePercent / 100);
      return {
        width: Math.round(srcWidth * factor),
        height: Math.round(srcHeight * factor)
      };
    }

    if (resizeMode === 'maxBounds') {
      let width = srcWidth;
      let height = srcHeight;

      if (maxWidth > 0 && width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      if (maxHeight > 0 && height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      return { width, height };
    }

    if (resizeMode === 'custom' && customWidth > 0 && customHeight > 0) {
      return { width: customWidth, height: customHeight };
    }

    // Default original
    return { width: srcWidth, height: srcHeight };
  }

  /**
   * Compresses and converts an image using HTML5 Canvas
   * @param {HTMLImageElement} img 
   * @param {Object} options - { format: 'image/webp', quality: 0.8, resizeMode, scalePercent, ... }
   * @returns {Promise<{blob: Blob, dataUrl: string, width: number, height: number, size: number}>}
   */
  static async processImage(img, options = {}) {
    const {
      format = 'image/webp',
      quality = 0.8,
      resizeMode = 'original',
      scalePercent = 100,
      maxWidth = 0,
      maxHeight = 0,
      customWidth = 0,
      customHeight = 0
    } = options;

    const { width, height } = this.calculateDimensions(img.naturalWidth, img.naturalHeight, {
      resizeMode,
      scalePercent,
      maxWidth,
      maxHeight,
      customWidth,
      customHeight
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d', { alpha: true });

    // Enable high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If converting to JPEG or no transparency, fill white background for cleaner look
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      // For PNG, quality parameter is ignored by browser canvas, but formats like WebP / JPEG use it
      const targetQuality = format === 'image/png' ? undefined : quality;

      canvas.toBlob((blob) => {
        if (!blob) {
          // Fallback if toBlob fails
          const dataUrl = canvas.toDataURL(format, targetQuality);
          resolve({
            blob: null,
            dataUrl,
            width: canvas.width,
            height: canvas.height,
            size: Math.round((dataUrl.length * 3) / 4)
          });
          return;
        }

        const dataUrl = URL.createObjectURL(blob);
        resolve({
          blob,
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          size: blob.size
        });
      }, format, targetQuality);
    });
  }

  /**
   * Helper to format bytes into human-readable string (KB, MB)
   * @param {number} bytes 
   * @returns {string}
   */
  static formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Gets appropriate file extension for a mime type
   * @param {string} mimeType 
   * @returns {string}
   */
  static getExtension(mimeType) {
    switch (mimeType) {
      case 'image/webp': return 'webp';
      case 'image/jpeg': return 'jpg';
      case 'image/png': return 'png';
      case 'image/avif': return 'avif';
      default: return 'jpg';
    }
  }
}

window.ImageCompressorEngine = ImageCompressorEngine;
