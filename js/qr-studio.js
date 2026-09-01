/**
 * OptiPixel Studio - QR Code Studio Engine
 * Generates high-res QR Codes for URLs, WiFi, Text, WhatsApp, and vCards
 * Features custom colors, background fill, margin, and logo embedding
 */

class QRCodeEngine {
  /**
   * Generates a QR Code on a canvas
   * @param {Object} options - { text, size, colorDark, colorLight, logoUrl }
   * @returns {Promise<HTMLCanvasElement>}
   */
  static generateQRCode(options = {}) {
    const {
      text = 'https://optipixel.app',
      size = 400,
      colorDark = '#000000',
      colorLight = '#ffffff',
      logoImage = null
    } = options;

    return new Promise((resolve, reject) => {
      // Create temporary container for QRCode.js
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);

      try {
        if (!window.QRCode) {
          throw new Error('QRCode library not loaded');
        }

        const qrcode = new QRCode(tempDiv, {
          text: text,
          width: size,
          height: size,
          colorDark: colorDark,
          colorLight: colorLight,
          correctLevel: QRCode.CorrectLevel.H // High error correction for logo embedding
        });

        // Wait for QRCode.js to render canvas
        setTimeout(() => {
          const qrCanvas = tempDiv.querySelector('canvas');
          if (!qrCanvas) {
            tempDiv.remove();
            return reject('Failed to generate QR canvas');
          }

          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = size;
          finalCanvas.height = size;
          const ctx = finalCanvas.getContext('2d');

          // Draw the base QR code
          ctx.drawImage(qrCanvas, 0, 0, size, size);

          // If a center logo is provided, draw it with a clean badge background
          if (logoImage) {
            const logoSize = Math.round(size * 0.22);
            const logoX = Math.round((size - logoSize) / 2);
            const logoY = Math.round((size - logoSize) / 2);
            const badgePadding = 6;

            // White badge background
            ctx.fillStyle = colorLight;
            ctx.beginPath();
            ctx.roundRect(
              logoX - badgePadding,
              logoY - badgePadding,
              logoSize + badgePadding * 2,
              logoSize + badgePadding * 2,
              8
            );
            ctx.fill();

            // Draw logo image
            ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
          }

          tempDiv.remove();
          resolve(finalCanvas);
        }, 80);
      } catch (err) {
        tempDiv.remove();
        reject(err);
      }
    });
  }
}

window.QRCodeEngine = QRCodeEngine;
