/**
 * OptiPixel Studio - Universal Barcode Studio Engine
 * Generates Code-128, EAN-13, UPC-A, and Code-39 barcodes
 * Features pixel-crisp rendering, custom colors, auto-check-digits, and human-readable text
 */

class BarcodeEngine {
  /**
   * Encodes standard Code 128 (Subset B)
   */
  static encodeCode128(text) {
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
      const validCode = (code >= 0 && code <= 95) ? code : 0;
      checksum += validCode * (i + 1);
      patternStr += patterns[validCode] || patterns[0];
    }

    const checkDigit = checksum % 103;
    patternStr += patterns[checkDigit];
    patternStr += patterns[STOP];

    return { type: 'widths', pattern: patternStr, text };
  }

  /**
   * Encodes EAN-13 (International Article Number)
   */
  static encodeEAN13(rawText) {
    let digits = rawText.replace(/\D/g, '');
    if (digits.length < 12) {
      digits = digits.padEnd(12, '0');
    } else if (digits.length > 13) {
      digits = digits.slice(0, 13);
    }

    // Calculate check digit if 12 digits provided
    if (digits.length === 12) {
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3);
      }
      const check = (10 - (sum % 10)) % 10;
      digits += check;
    }

    // EAN-13 Tables
    const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
    const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
    const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
    const parities = [
      'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG',
      'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'
    ];

    const first = parseInt(digits[0], 10);
    const parity = parities[first];

    let bits = '101'; // Left Guard

    for (let i = 1; i <= 6; i++) {
      const d = parseInt(digits[i], 10);
      bits += (parity[i - 1] === 'L') ? L[d] : G[d];
    }

    bits += '01010'; // Center Guard

    for (let i = 7; i <= 12; i++) {
      const d = parseInt(digits[i], 10);
      bits += R[d];
    }

    bits += '101'; // Right Guard

    return { type: 'bits', pattern: bits, text: digits };
  }

  /**
   * Encodes UPC-A (Universal Product Code)
   */
  static encodeUPCA(rawText) {
    let digits = rawText.replace(/\D/g, '');
    if (digits.length < 11) {
      digits = digits.padEnd(11, '0');
    } else if (digits.length > 12) {
      digits = digits.slice(0, 12);
    }

    if (digits.length === 11) {
      let sum = 0;
      for (let i = 0; i < 11; i++) {
        sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 3 : 1);
      }
      const check = (10 - (sum % 10)) % 10;
      digits += check;
    }

    // UPC-A uses L-code for left 6 digits, R-code for right 6 digits
    const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
    const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];

    let bits = '101'; // Guard
    for (let i = 0; i < 6; i++) {
      bits += L[parseInt(digits[i], 10)];
    }
    bits += '01010'; // Center
    for (let i = 6; i < 12; i++) {
      bits += R[parseInt(digits[i], 10)];
    }
    bits += '101'; // Guard

    return { type: 'bits', pattern: bits, text: digits };
  }

  /**
   * Encodes Code 39
   */
  static encodeCode39(rawText) {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';
    const patterns = {
      '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
      '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
      '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
      'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
      'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
      'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
      'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
      'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
      'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
      '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
      '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
    };

    const clean = rawText.toUpperCase().split('').filter(c => alphabet.includes(c)).join('') || 'OPTI39';
    const full = `*${clean}*`;

    // Narrow bar/space = 1, Wide bar/space = 3
    let widths = '';
    for (let i = 0; i < full.length; i++) {
      const code = patterns[full[i]] || patterns['*'];
      for (let b = 0; b < 9; b++) {
        widths += (code[b] === '1') ? '3' : '1';
      }
      if (i < full.length - 1) {
        widths += '1'; // Inter-character gap
      }
    }

    return { type: 'widths', pattern: widths, text: clean };
  }

  /**
   * Renders Barcode onto Canvas
   */
  static generateBarcode(text, options = {}) {
    const {
      format = 'code128',
      width = 460,
      height = 160,
      color = '#000000',
      bgColor = '#FFFFFF',
      showText = true
    } = options;

    let encoded;
    if (format === 'ean13') {
      encoded = this.encodeEAN13(text);
    } else if (format === 'upca') {
      encoded = this.encodeUPCA(text);
    } else if (format === 'code39') {
      encoded = this.encodeCode39(text);
    } else {
      encoded = this.encodeCode128(text);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const margin = 24;
    const barAreaWidth = width - margin * 2;
    const barHeight = showText ? height - 48 : height - 28;

    ctx.fillStyle = color;

    if (encoded.type === 'bits') {
      // Direct 1 / 0 bit sequence
      const bitCount = encoded.pattern.length;
      const moduleWidth = barAreaWidth / bitCount;
      let currentX = margin;

      for (let i = 0; i < bitCount; i++) {
        if (encoded.pattern[i] === '1') {
          ctx.fillRect(currentX, 16, Math.max(1, moduleWidth + 0.3), barHeight);
        }
        currentX += moduleWidth;
      }
    } else {
      // Variable widths pattern
      let totalModules = 0;
      for (let i = 0; i < encoded.pattern.length; i++) {
        totalModules += parseInt(encoded.pattern[i], 10);
      }

      const moduleWidth = barAreaWidth / totalModules;
      let currentX = margin;
      let isBar = true;

      for (let i = 0; i < encoded.pattern.length; i++) {
        const barModules = parseInt(encoded.pattern[i], 10);
        const w = barModules * moduleWidth;

        if (isBar) {
          ctx.fillRect(currentX, 16, Math.max(1, w + 0.3), barHeight);
        }
        currentX += w;
        isBar = !isBar;
      }
    }

    // Human readable text
    if (showText) {
      ctx.fillStyle = color;
      ctx.font = 'bold 15px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(encoded.text, width / 2, height - 12);
    }

    return canvas;
  }
}

window.BarcodeEngine = BarcodeEngine;
