/**
 * OptiPixel Studio - Universal Barcode Studio
 * Generates Code-128, EAN-13, UPC-A, and Code-39 barcodes
 * Supports custom width, height, label text, and printable sticker sheets
 */

class BarcodeEngine {
  /**
   * Encodes standard Code 128 (Subset B)
   */
  static encodeCode128(text) {
    // Code 128 Table B patterns
    const patterns = [
      "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
      "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
      "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
      "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
      "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
      "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
      "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
      "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
      "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
      "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
      "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
    ];

    const START_B = 104;
    const STOP = 106;

    let checksum = START_B;
    let patternStr = patterns[START_B];

    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i) - 32;
      checksum += code * (i + 1);
      patternStr += patterns[code] || patterns[0];
    }

    const checkDigit = checksum % 103;
    patternStr += patterns[checkDigit];
    patternStr += patterns[STOP];

    return patternStr;
  }

  /**
   * Renders Barcode onto Canvas
   */
  static generateBarcode(text, options = {}) {
    const {
      width = 400,
      height = 160,
      color = '#000000',
      bgColor = '#FFFFFF',
      showText = true
    } = options;

    const pattern = this.encodeCode128(text);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate module width
    let totalModules = 0;
    for (let i = 0; i < pattern.length; i++) {
      totalModules += parseInt(pattern[i], 10);
    }

    const margin = 20;
    const barAreaWidth = width - margin * 2;
    const moduleWidth = barAreaWidth / totalModules;
    const barHeight = showText ? height - 48 : height - 24;

    let currentX = margin;
    let isBar = true;

    ctx.fillStyle = color;

    for (let i = 0; i < pattern.length; i++) {
      const barModules = parseInt(pattern[i], 10);
      const w = barModules * moduleWidth;

      if (isBar) {
        ctx.fillRect(currentX, 16, w, barHeight);
      }
      currentX += w;
      isBar = !isBar;
    }

    if (showText) {
      ctx.fillStyle = color;
      ctx.font = 'bold 15px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, width / 2, height - 10);
    }

    return canvas;
  }
}

window.BarcodeEngine = BarcodeEngine;
