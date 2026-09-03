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

  /**
   * Converts Word (.docx, .doc), Docs, Text, and HTML files into a clean formatted PDF
   * @param {File} docFile 
   * @returns {Promise<Uint8Array>}
   */
  static async wordToPDF(docFile) {
    if (!window.PDFLib) throw new Error('PDFLib library not loaded');
    const { PDFDocument, StandardFonts, rgb, PageSizes } = window.PDFLib;

    let extractedText = '';

    // 1. If DOCX file and mammoth is available, extract text
    if (docFile.name.endsWith('.docx') && window.mammoth) {
      try {
        const arrayBuffer = await docFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value || '';
      } catch (err) {
        console.warn('Mammoth extraction fallback:', err);
      }
    }

    // 2. If text was not extracted (e.g. .txt, .md, .html, .rtf or mammoth fallback)
    if (!extractedText) {
      try {
        extractedText = await docFile.text();
      } catch (e) {
        extractedText = `Converted Document: ${docFile.name}\n\nProcessed securely in browser.`;
      }
    }

    // 3. Create PDF with text wrapped across pages
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const [pageWidth, pageHeight] = PageSizes.A4;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    const fontSize = 11;
    const lineHeight = 16;

    const rawLines = extractedText.split(/\r?\n/);
    const wrappedLines = [];

    rawLines.forEach(line => {
      if (!line.trim()) {
        wrappedLines.push('');
        return;
      }

      const words = line.split(' ');
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = fontRegular.widthOfTextAtSize(testLine, fontSize);

        if (textWidth < contentWidth) {
          currentLine = testLine;
        } else {
          wrappedLines.push(currentLine);
          currentLine = word;
        }
      });

      if (currentLine) wrappedLines.push(currentLine);
    });

    const linesPerPage = Math.floor((pageHeight - margin * 2 - 40) / lineHeight);
    let currentPage = null;
    let currentY = 0;
    let pageNum = 1;

    const addNewPage = () => {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Document Header
      currentPage.drawText(docFile.name.replace(/\.[^/.]+$/, ""), {
        x: margin,
        y: pageHeight - 35,
        size: 9,
        font: fontBold,
        color: rgb(0.4, 0.4, 0.45)
      });

      // Page Number Footer
      const footerText = `Page ${pageNum}`;
      const footerWidth = fontRegular.widthOfTextAtSize(footerText, 9);
      currentPage.drawText(footerText, {
        x: (pageWidth - footerWidth) / 2,
        y: 25,
        size: 9,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5)
      });

      pageNum++;
      currentY = pageHeight - margin - 20;
    };

    addNewPage();

    wrappedLines.forEach(line => {
      if (currentY < margin + 30) {
        addNewPage();
      }

      if (line) {
        currentPage.drawText(line, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: fontRegular,
          color: rgb(0.12, 0.12, 0.15)
        });
      }

      currentY -= lineHeight;
    });

    return await pdfDoc.save();
  }

  /**
   * Converts any PDF document into an editable Microsoft Word (.DOCX) and Docs file
   * @param {File} pdfFile 
   * @returns {Promise<{docxBlob: Blob, textContent: string}>}
   */
  static async pdfToWordDocx(pdfFile) {
    if (!window.pdfjsLib) throw new Error('PDF.js not loaded');
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${pdfFile.name}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1f2937; margin: 1in; }
          h1 { font-size: 18pt; font-weight: bold; color: #111827; margin-bottom: 12pt; }
          p { margin-bottom: 8pt; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
    `;

    let rawTextLines = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      let lastY = null;

      for (const item of textContent.items) {
        if (!item.str || !item.str.trim()) continue;
        const currentY = Math.round(item.transform[5]);

        if (lastY !== null && Math.abs(currentY - lastY) > 8) {
          pageText += '\n';
        } else if (pageText && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }

        pageText += item.str;
        lastY = currentY;
      }

      if (pageText.trim()) {
        const paragraphs = pageText.split('\n');
        paragraphs.forEach(p => {
          if (p.trim()) {
            fullHtml += `<p>${p.trim()}</p>`;
            rawTextLines.push(p.trim());
          }
        });
      }

      if (i < pdfDoc.numPages) {
        fullHtml += `<div class="page-break"></div>`;
        rawTextLines.push('\n--- PAGE BREAK ---\n');
      }
    }

    fullHtml += `</body></html>`;

    // 1. If JSZip is available, build an authentic .docx package
    if (window.JSZip) {
      try {
        const zip = new JSZip();
        
        // [Content_Types].xml
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

        // _rels/.rels
        zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

        // word/document.xml
        let docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>`;

        rawTextLines.forEach(line => {
          if (line.includes('--- PAGE BREAK ---')) {
            docXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
          } else {
            const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            docXml += `<w:p><w:r><w:t>${escaped}</w:t></w:r></w:p>`;
          }
        });

        docXml += `  <w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr>
  </w:body>
</w:document>`;

        zip.folder('word').file('document.xml', docXml);

        const docxBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        return {
          docxBlob,
          textContent: rawTextLines.join('\n')
        };
      } catch (err) {
        console.warn('JSZip DOCX packaging fallback:', err);
      }
    }

    // MIME HTML Word fallback
    const docBlob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword;charset=utf-8' });
    return {
      docxBlob: docBlob,
      textContent: rawTextLines.join('\n')
    };
  }
}

window.PDFEditorEngine = PDFEditorEngine;
