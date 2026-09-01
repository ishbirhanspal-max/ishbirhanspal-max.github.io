/**
 * OptiPixel Studio - Client-side PDF Engine & Visual Editor
 * Uses PDF-Lib and PDF.js to perform 100% private, client-side PDF actions:
 * - Visual Page Annotation (Text, Signature, Freehand Draw, Redaction)
 * - Merge PDFs
 * - Images to PDF
 * - PDF to Images (Extract pages)
 * - Page Reordering / Rotation / Deletion
 * - Watermarking & Text Overlays
 */

class PDFEditorEngine {
  constructor() {}

  /**
   * Merges multiple PDF ArrayBuffers/Blobs into a single PDF
   * @param {Array<File|Blob>} pdfFiles 
   * @returns {Promise<Uint8Array>}
   */
  static async mergePDFs(pdfFiles) {
    if (!window.PDFLib) throw new Error('PDFLib library not loaded');
    const { PDFDocument } = window.PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  /**
   * Converts multiple images (PNG/JPG/WebP) into a clean single PDF
   * @param {Array<File>} imageFiles 
   * @param {Object} options - { pageSize: 'A4' | 'fit', margin: 20 }
   * @returns {Promise<Uint8Array>}
   */
  static async imagesToPDF(imageFiles, options = {}) {
    if (!window.PDFLib) throw new Error('PDFLib library not loaded');
    const { PDFDocument, PageSizes } = window.PDFLib;
    const pdfDoc = await PDFDocument.create();

    const { pageSize = 'A4', margin = 20 } = options;

    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer();
      let image;
      if (file.type === 'image/png') {
        image = await pdfDoc.embedPng(arrayBuffer);
      } else {
        try {
          image = await pdfDoc.embedJpg(arrayBuffer);
        } catch (e) {
          const dataUrl = await this.imageFileToJpegDataUrl(file);
          const response = await fetch(dataUrl);
          const jpgBuf = await response.arrayBuffer();
          image = await pdfDoc.embedJpg(jpgBuf);
        }
      }

      const imgDims = image.scale(1);

      if (pageSize === 'fit') {
        const page = pdfDoc.addPage([imgDims.width + margin * 2, imgDims.height + margin * 2]);
        page.drawImage(image, {
          x: margin,
          y: margin,
          width: imgDims.width,
          height: imgDims.height
        });
      } else {
        const a4Width = PageSizes.A4[0];
        const a4Height = PageSizes.A4[1];
        const page = pdfDoc.addPage([a4Width, a4Height]);

        const availWidth = a4Width - margin * 2;
        const availHeight = a4Height - margin * 2;
        const scale = Math.min(availWidth / imgDims.width, availHeight / imgDims.height);
        const scaledWidth = imgDims.width * scale;
        const scaledHeight = imgDims.height * scale;

        const xPos = margin + (availWidth - scaledWidth) / 2;
        const yPos = margin + (availHeight - scaledHeight) / 2;

        page.drawImage(image, {
          x: xPos,
          y: yPos,
          width: scaledWidth,
          height: scaledHeight
        });
      }
    }

    return await pdfDoc.save();
  }

  static imageFileToJpegDataUrl(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Loads a PDF file and returns the total page count & PDF document proxy
   */
  static async loadPDFDocument(pdfFile) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
    const arrayBuffer = await pdfFile.arrayBuffer();
    return await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  }

  /**
   * Renders a specific page of a PDF onto a canvas at high resolution
   */
  static async renderPageToCanvas(pdfDoc, pageNumber, canvas, scale = 1.5) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    return viewport;
  }

  /**
   * Extracts text items and bounding boxes from a PDF page using PDF.js
   * @param {Object} pdfDoc 
   * @param {number} pageNumber 
   * @param {number} scale 
   * @returns {Promise<Array<{str: string, x: number, y: number, width: number, height: number, fontSize: number}>>}
   */
  static async extractPageTextItems(pdfDoc, pageNumber, scale = 1.4) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const textContent = await page.getTextContent();
    const items = [];

    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
      
      // Calculate screen coordinate box
      const x = tx[4];
      const y = tx[5] - fontSize; // baseline adjustment
      const width = item.width * scale;
      const height = fontSize * 1.1;

      items.push({
        str: item.str,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.max(width, fontSize * item.str.length * 0.5),
        height: height,
        fontSize: Math.round(fontSize)
      });
    }

    return items;
  }

  /**
   * Loads a PDF file and extracts individual page thumbnails
   */
  static async extractPageThumbnails(pdfFile) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;

      pages.push({
        pageNumber: i,
        dataUrl: canvas.toDataURL('image/jpeg', 0.8),
        width: viewport.width,
        height: viewport.height,
        rotation: 0,
        deleted: false
      });
    }

    return pages;
  }

  /**
   * Exports modified pages (rotations/deletions) into a new PDF
   */
  static async exportCustomizedPDF(originalPdfFile, pageConfigList) {
    if (!window.PDFLib) throw new Error('PDFLib library not loaded');
    const { PDFDocument, degrees } = window.PDFLib;

    const arrayBuffer = await originalPdfFile.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);
    const newDoc = await PDFDocument.create();

    for (const item of pageConfigList) {
      if (item.deleted) continue;
      const [copiedPage] = await newDoc.copyPages(srcDoc, [item.pageNumber - 1]);
      if (item.rotation) {
        copiedPage.setRotation(degrees((copiedPage.getRotation().angle + item.rotation) % 360));
      }
      newDoc.addPage(copiedPage);
    }

    return await newDoc.save();
  }

  /**
   * Adds custom text watermark to all pages in a PDF
   */
  static async addWatermark(pdfFile, watermarkText, options = {}) {
    if (!window.PDFLib) throw new Error('PDFLib library not loaded');
    const { PDFDocument, rgb, degrees, StandardFonts } = window.PDFLib;

    const { opacity = 0.25, size = 48 } = options;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, size);
      const textHeight = font.heightAtSize(size);

      page.drawText(watermarkText, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: size,
        font: font,
        color: rgb(0.4, 0.4, 0.45),
        opacity: opacity,
        rotate: degrees(45)
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Burns visual canvas annotations (drawn signatures, text, boxes) onto a target PDF page
   * @param {File} originalPdfFile 
   * @param {number} targetPageNum (1-indexed)
   * @param {HTMLCanvasElement} annotationCanvas 
   * @returns {Promise<Uint8Array>}
   */
  static async burnVisualAnnotations(originalPdfFile, targetPageNum, annotationCanvas) {
    if (!window.PDFLib) throw new Error('PDFLib library not loaded');
    const { PDFDocument } = window.PDFLib;

    const arrayBuffer = await originalPdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const page = pdfDoc.getPage(targetPageNum - 1);
    const { width, height } = page.getSize();

    // Export transparent annotation canvas as PNG
    const pngDataUrl = annotationCanvas.toDataURL('image/png');
    const response = await fetch(pngDataUrl);
    const pngBuffer = await response.arrayBuffer();
    const embeddedPng = await pdfDoc.embedPng(pngBuffer);

    page.drawImage(embeddedPng, {
      x: 0,
      y: 0,
      width: width,
      height: height
    });

    return await pdfDoc.save();
  }

  /**
   * Encrypts and password-protects a PDF document
   * @param {File} pdfFile 
   * @param {string} userPassword 
   * @returns {Promise<Uint8Array>}
   */
  static async protectPDF(pdfFile, userPassword) {
    if (!window.PDFLib) throw new Error('PDFLib library not loaded');
    const { PDFDocument } = window.PDFLib;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    // Save with password protection
    return await pdfDoc.save({
      userPassword: userPassword,
      ownerPassword: userPassword + '_admin'
    });
  }

  /**
   * Splits or extracts specific page ranges from a PDF document
   * @param {File} pdfFile 
   * @param {string} rangeStr e.g. "1-3, 5, 8"
   * @returns {Promise<Uint8Array>}
   */
  static async splitPDF(pdfFile, rangeStr) {
    if (!window.PDFLib) throw new Error('PDFLib library not loaded');
    const { PDFDocument } = window.PDFLib;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuffer);
    const newDoc = await PDFDocument.create();

    const totalPages = srcDoc.getPageCount();
    const targetIndices = new Set();

    if (!rangeStr || !rangeStr.trim()) {
      // Default to all pages
      for (let i = 0; i < totalPages; i++) targetIndices.add(i);
    } else {
      const parts = rangeStr.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = Math.max(1, parseInt(startStr, 10));
          const end = Math.min(totalPages, parseInt(endStr, 10));
          for (let i = start; i <= end; i++) targetIndices.add(i - 1);
        } else {
          const pageNum = parseInt(trimmed, 10);
          if (pageNum >= 1 && pageNum <= totalPages) {
            targetIndices.add(pageNum - 1);
          }
        }
      }
    }

    const indicesToCopy = Array.from(targetIndices).sort((a, b) => a - b);
    if (indicesToCopy.length === 0) throw new Error('No valid pages in specified range');

    const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy);
    copiedPages.forEach(p => newDoc.addPage(p));

    return await newDoc.save();
  }
}

window.PDFEditorEngine = PDFEditorEngine;
