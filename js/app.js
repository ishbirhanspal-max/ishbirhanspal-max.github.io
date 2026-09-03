/**
 * OptiPixel Studio - Main Application Controller (Image + Full In-Place PDF Text Editor)
 * Features:
 * - In-Place Edit Existing PDF Text (Click to replace words/paragraphs)
 * - Add New Interactive Floating Text Boxes with Live Typing
 * - Whiteout / Eraser for existing text & graphics
 * - Freehand Signatures & Drawing
 * - Redaction & Highlighting Rectangles
 * - Bulk Image Optimization & Format Conversion
 */

(function () {
  'use strict';

  // Application State
  const state = {
    activeTab: 'image-tools', // 'image-tools' | 'pdf-tools'
    pdfActiveSubtool: 'visual-edit', // 'visual-edit' | 'merge' | 'img2pdf' | 'organize' | 'watermark'
    
    // Image state
    files: [],
    settings: {
      format: 'image/webp',
      quality: 0.8,
      resizeMode: 'original',
      scalePercent: 100,
      maxWidth: 1920,
      maxHeight: 1080,
      stripMetadata: true
    },
    
    // PDF State
    pdfFiles: [],
    pdfPages: [],
    currentPdfFile: null,
    watermarkText: 'CONFIDENTIAL',

    // Visual PDF Editor State
    visualDoc: null,
    visualPageNum: 1,
    visualTotalPages: 1,
    visualTool: 'edit-text', // 'edit-text' | 'add-text' | 'whiteout' | 'pen' | 'rect'
    visualColor: '#000000',
    visualSize: 16,
    isDrawing: false,
    drawStartX: 0,
    drawStartY: 0,
    annotationSnapshot: null,
    detectedTextItems: [],
    floatingTextBoxes: [] // Array of { id, element, x, y, text, fontSize, color }
  };

  // DOM Elements
  const elements = {
    // Navigation Tabs & Navbar
    tabImageBtn: document.getElementById('tabImageBtn'),
    tabPdfBtn: document.getElementById('tabPdfBtn'),
    navImageLink: document.getElementById('navImageLink'),
    navPdfLink: document.getElementById('navPdfLink'),
    imageWorkspace: document.getElementById('imageWorkspace'),
    pdfWorkspace: document.getElementById('pdfWorkspace'),

    // Image Elements
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    filesContainer: document.getElementById('filesContainer'),
    fileGrid: document.getElementById('fileGrid'),
    statsBanner: document.getElementById('statsBanner'),
    totalOrigSize: document.getElementById('totalOrigSize'),
    totalCompSize: document.getElementById('totalCompSize'),
    totalSavings: document.getElementById('totalSavings'),
    totalFilesCount: document.getElementById('totalFilesCount'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    sampleImagesBtn: document.getElementById('sampleImagesBtn'),

    // Global Controls
    formatSelect: document.getElementById('formatSelect'),
    qualitySlider: document.getElementById('qualitySlider'),
    qualityValue: document.getElementById('qualityValue'),
    resizeSelect: document.getElementById('resizeSelect'),
    resizeOptionsContainer: document.getElementById('resizeOptionsContainer'),

    // Comparison Modal
    comparisonModal: document.getElementById('comparisonModal'),
    comparisonCloseBtn: document.getElementById('comparisonCloseBtn'),
    comparisonContainer: document.getElementById('comparisonContainer'),
    comparisonOrigImg: document.getElementById('comparisonOrigImg'),
    comparisonCompImg: document.getElementById('comparisonCompImg'),
    comparisonOverlay: document.getElementById('comparisonOverlay'),
    comparisonHandle: document.getElementById('comparisonHandle'),
    comparisonOrigMeta: document.getElementById('comparisonOrigMeta'),
    comparisonCompMeta: document.getElementById('comparisonCompMeta'),

    // PDF Elements
    pdfSubtoolBtns: document.querySelectorAll('.pdf-subtool-btn'),
    pdfDropzone: document.getElementById('pdfDropzone'),
    pdfFileInput: document.getElementById('pdfFileInput'),
    pdfDropzoneTitle: document.getElementById('pdfDropzoneTitle'),
    pdfDropzoneSubtitle: document.getElementById('pdfDropzoneSubtitle'),
    pdfActionsContainer: document.getElementById('pdfActionsContainer'),
    pdfItemsList: document.getElementById('pdfItemsList'),
    pdfExecuteBtn: document.getElementById('pdfExecuteBtn'),
    pdfResetBtn: document.getElementById('pdfResetBtn'),
    pdfWatermarkInputContainer: document.getElementById('pdfWatermarkInputContainer'),
    watermarkTextInput: document.getElementById('watermarkTextInput'),

    // Visual Canvas Editor Elements
    visualEditorWorkspace: document.getElementById('visualEditorWorkspace'),
    toolEditTextBtn: document.getElementById('toolEditTextBtn'),
    toolTextBtn: document.getElementById('toolTextBtn'),
    toolWhiteoutBtn: document.getElementById('toolWhiteoutBtn'),
    toolPenBtn: document.getElementById('toolPenBtn'),
    toolRectBtn: document.getElementById('toolRectBtn'),
    annotationColor: document.getElementById('annotationColor'),
    annotationSize: document.getElementById('annotationSize'),
    prevPdfPageBtn: document.getElementById('prevPdfPageBtn'),
    nextPdfPageBtn: document.getElementById('nextPdfPageBtn'),
    pdfPageIndicator: document.getElementById('pdfPageIndicator'),
    clearCanvasBtn: document.getElementById('clearCanvasBtn'),
    editorTipText: document.getElementById('editorTipText'),
    pdfCanvasWrapper: document.getElementById('pdfCanvasWrapper'),
    pdfBaseCanvas: document.getElementById('pdfBaseCanvas'),
    pdfAnnotationCanvas: document.getElementById('pdfAnnotationCanvas'),
    pdfTextOverlayLayer: document.getElementById('pdfTextOverlayLayer'),

    // Background Remover Elements
    tabBgBtn: document.getElementById('tabBgBtn'),
    bgRemoverWorkspace: document.getElementById('bgRemoverWorkspace'),
    bgDropzone: document.getElementById('bgDropzone'),
    bgFileInput: document.getElementById('bgFileInput'),
    sampleBgBtn: document.getElementById('sampleBgBtn'),
    sampleBgPortraitBtn: document.getElementById('sampleBgPortraitBtn'),
    bgControlsContainer: document.getElementById('bgControlsContainer'),
    bgLoadingIndicator: document.getElementById('bgLoadingIndicator'),
    bgToleranceSlider: document.getElementById('bgToleranceSlider'),
    bgToleranceValue: document.getElementById('bgToleranceValue'),
    bgSmoothSlider: document.getElementById('bgSmoothSlider'),
    bgSmoothValue: document.getElementById('bgSmoothValue'),
    bgReplaceSelect: document.getElementById('bgReplaceSelect'),
    customBgColorGroup: document.getElementById('customBgColorGroup'),
    bgCustomColorInput: document.getElementById('bgCustomColorInput'),
    bgResultCanvas: document.getElementById('bgResultCanvas'),
    bgOriginalOverlay: document.getElementById('bgOriginalOverlay'),
    bgOriginalImg: document.getElementById('bgOriginalImg'),
    bgCompareHandle: document.getElementById('bgCompareHandle'),
    bgCompareWrapper: document.getElementById('bgCompareWrapper'),
    bgBrushOverlayCanvas: document.getElementById('bgBrushOverlayCanvas'),
    bgBrushOffBtn: document.getElementById('bgBrushOffBtn'),
    bgBrushEraseBtn: document.getElementById('bgBrushEraseBtn'),
    bgBrushRestoreBtn: document.getElementById('bgBrushRestoreBtn'),
    bgBrushClearBtn: document.getElementById('bgBrushClearBtn'),
    bgBrushSizeSlider: document.getElementById('bgBrushSizeSlider'),
    bgBrushSizeVal: document.getElementById('bgBrushSizeVal'),
    bgResetBtn: document.getElementById('bgResetBtn'),
    bgCopyClipboardBtn: document.getElementById('bgCopyClipboardBtn'),
    bgDownloadBtn: document.getElementById('bgDownloadBtn'),

    // QR Code Studio Elements
    tabQrBtn: document.getElementById('tabQrBtn'),
    qrWorkspace: document.getElementById('qrWorkspace'),
    qrTypeSelect: document.getElementById('qrTypeSelect'),
    qrTextInput: document.getElementById('qrTextInput'),
    qrContentGroup: document.getElementById('qrContentGroup'),
    qrWifiGroup: document.getElementById('qrWifiGroup'),
    qrWifiSsid: document.getElementById('qrWifiSsid'),
    qrWifiPass: document.getElementById('qrWifiPass'),
    qrDarkColor: document.getElementById('qrDarkColor'),
    qrLightColor: document.getElementById('qrLightColor'),
    qrLogoInput: document.getElementById('qrLogoInput'),
    qrResultCanvas: document.getElementById('qrResultCanvas'),
    qrDownloadPngBtn: document.getElementById('qrDownloadPngBtn'),

    // Passport Photo Elements
    tabPassportBtn: document.getElementById('tabPassportBtn'),
    passportWorkspace: document.getElementById('passportWorkspace'),
    passportDropzone: document.getElementById('passportDropzone'),
    passportFileInput: document.getElementById('passportFileInput'),
    samplePassportBtn: document.getElementById('samplePassportBtn'),
    passportControlsContainer: document.getElementById('passportControlsContainer'),
    passportTypeSelect: document.getElementById('passportTypeSelect'),
    passportBgSelect: document.getElementById('passportBgSelect'),
    passportSheetSelect: document.getElementById('passportSheetSelect'),
    passportResultCanvas: document.getElementById('passportResultCanvas'),
    passportResetBtn: document.getElementById('passportResetBtn'),
    passportDownloadBtn: document.getElementById('passportDownloadBtn'),

    // Filters & Effects Elements
    tabFiltersBtn: document.getElementById('tabFiltersBtn'),
    filtersWorkspace: document.getElementById('filtersWorkspace'),
    filtersDropzone: document.getElementById('filtersDropzone'),
    filtersFileInput: document.getElementById('filtersFileInput'),
    filtersControlsContainer: document.getElementById('filtersControlsContainer'),
    filterPresetBtns: document.querySelectorAll('.filter-preset-btn'),
    filterBrightSlider: document.getElementById('filterBrightSlider'),
    filterBrightVal: document.getElementById('filterBrightVal'),
    filterContrastSlider: document.getElementById('filterContrastSlider'),
    filterContrastVal: document.getElementById('filterContrastVal'),
    filterSaturateSlider: document.getElementById('filterSaturateSlider'),
    filterSaturateVal: document.getElementById('filterSaturateVal'),
    filterBlurSlider: document.getElementById('filterBlurSlider'),
    filterBlurVal: document.getElementById('filterBlurVal'),
    filterResultCanvas: document.getElementById('filterResultCanvas'),
    filtersResetBtn: document.getElementById('filtersResetBtn'),
    filtersDownloadBtn: document.getElementById('filtersDownloadBtn'),

    // Social Crop Elements
    tabSocialCropBtn: document.getElementById('tabSocialCropBtn'),
    socialCropWorkspace: document.getElementById('socialCropWorkspace'),
    socialCropDropzone: document.getElementById('socialCropDropzone'),
    socialCropFileInput: document.getElementById('socialCropFileInput'),
    socialCropControlsContainer: document.getElementById('socialCropControlsContainer'),
    socialRatioSelect: document.getElementById('socialRatioSelect'),
    socialFitSelect: document.getElementById('socialFitSelect'),
    socialCropResultCanvas: document.getElementById('socialCropResultCanvas'),
    socialCropResetBtn: document.getElementById('socialCropResetBtn'),
    socialCropDownloadBtn: document.getElementById('socialCropDownloadBtn'),

    // Barcode Elements
    tabBarcodeBtn: document.getElementById('tabBarcodeBtn'),
    barcodeWorkspace: document.getElementById('barcodeWorkspace'),
    barcodeTextInput: document.getElementById('barcodeTextInput'),
    barcodeColor: document.getElementById('barcodeColor'),
    barcodeBgColor: document.getElementById('barcodeBgColor'),
    barcodeResultCanvas: document.getElementById('barcodeResultCanvas'),
    barcodeDownloadBtn: document.getElementById('barcodeDownloadBtn'),

    // Collage Maker Elements
    tabCollageBtn: document.getElementById('tabCollageBtn'),
    collageWorkspace: document.getElementById('collageWorkspace'),
    collageDropzone: document.getElementById('collageDropzone'),
    collageFileInput: document.getElementById('collageFileInput'),
    sampleCollageBtn: document.getElementById('sampleCollageBtn'),
    collageControlsContainer: document.getElementById('collageControlsContainer'),
    collageLayoutSelect: document.getElementById('collageLayoutSelect'),
    collageSpacing: document.getElementById('collageSpacing'),
    collageSpacingVal: document.getElementById('collageSpacingVal'),
    collageRadius: document.getElementById('collageRadius'),
    collageRadiusVal: document.getElementById('collageRadiusVal'),
    collageBgColor: document.getElementById('collageBgColor'),
    collageResultCanvas: document.getElementById('collageResultCanvas'),
    collageResetBtn: document.getElementById('collageResetBtn'),
    collageDownloadBtn: document.getElementById('collageDownloadBtn'),

    // OCR Elements
    tabOcrBtn: document.getElementById('tabOcrBtn'),
    ocrWorkspace: document.getElementById('ocrWorkspace'),
    ocrDropzone: document.getElementById('ocrDropzone'),
    ocrFileInput: document.getElementById('ocrFileInput'),
    sampleOcrBtn: document.getElementById('sampleOcrBtn'),
    ocrControlsContainer: document.getElementById('ocrControlsContainer'),
    ocrPreviewCanvas: document.getElementById('ocrPreviewCanvas'),
    ocrOutputText: document.getElementById('ocrOutputText'),
    ocrCopyBtn: document.getElementById('ocrCopyBtn'),
    ocrDownloadTxtBtn: document.getElementById('ocrDownloadTxtBtn'),
    ocrResetBtn: document.getElementById('ocrResetBtn'),

    // Video to GIF Elements
    tabVideoBtn: document.getElementById('tabVideoBtn'),
    videoWorkspace: document.getElementById('videoWorkspace'),
    videoDropzone: document.getElementById('videoDropzone'),
    videoFileInput: document.getElementById('videoFileInput'),
    sampleVideoBtn: document.getElementById('sampleVideoBtn'),
    videoControlsContainer: document.getElementById('videoControlsContainer'),
    videoPlayer: document.getElementById('videoPlayer'),
    videoCaptureFrameBtn: document.getElementById('videoCaptureFrameBtn'),
    videoGenerateGifBtn: document.getElementById('videoGenerateGifBtn'),
    videoResetBtn: document.getElementById('videoResetBtn'),

    // Audio Studio Elements
    tabAudioBtn: document.getElementById('tabAudioBtn'),
    audioWorkspace: document.getElementById('audioWorkspace'),
    audioVisualizerCanvas: document.getElementById('audioVisualizerCanvas'),
    audioRecordBtn: document.getElementById('audioRecordBtn'),
    audioStopBtn: document.getElementById('audioStopBtn'),
    audioPlaybackContainer: document.getElementById('audioPlaybackContainer'),
    audioPlayer: document.getElementById('audioPlayer'),
    audioSpeedSelect: document.getElementById('audioSpeedSelect'),
    audioDownloadBtn: document.getElementById('audioDownloadBtn'),

    // Multi-Language Selector
    langSelect: document.getElementById('langSelect'),

    // FAQ Accordion & Toast
    faqItems: document.querySelectorAll('.faq-item'),
    toastContainer: document.getElementById('toastContainer')
  };

  // Initialize Application
  function init() {
    setupEventListeners();
    setupDropzone();
    setupBackgroundRemover();
    setupQRCodeStudio();
    setupBarcodeStudio();
    setupPassportMaker();
    setupCollageMaker();
    setupFiltersStudio();
    setupSocialCropStudio();
    setupOCRStudio();
    setupVideoGIFStudio();
    setupAudioStudio();
    setupI18n();
    setupPDFStudio();
    setupVisualCanvasEditor();
    setupComparisonSlider();
    setupFAQAccordion();
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Navigation Tabs & Navbar links
    if (elements.tabImageBtn) elements.tabImageBtn.addEventListener('click', () => switchMainTab('image-tools'));
    if (elements.tabBgBtn) elements.tabBgBtn.addEventListener('click', () => switchMainTab('bg-tools'));
    if (elements.tabQrBtn) elements.tabQrBtn.addEventListener('click', () => switchMainTab('qr-tools'));
    if (elements.tabBarcodeBtn) elements.tabBarcodeBtn.addEventListener('click', () => switchMainTab('barcode-tools'));
    if (elements.tabPassportBtn) elements.tabPassportBtn.addEventListener('click', () => switchMainTab('passport-tools'));
    if (elements.tabCollageBtn) elements.tabCollageBtn.addEventListener('click', () => switchMainTab('collage-tools'));
    if (elements.tabFiltersBtn) elements.tabFiltersBtn.addEventListener('click', () => switchMainTab('filter-tools'));
    if (elements.tabSocialCropBtn) elements.tabSocialCropBtn.addEventListener('click', () => switchMainTab('social-tools'));
    if (elements.tabOcrBtn) elements.tabOcrBtn.addEventListener('click', () => switchMainTab('ocr-tools'));
    if (elements.tabVideoBtn) elements.tabVideoBtn.addEventListener('click', () => switchMainTab('video-tools'));
    if (elements.tabAudioBtn) elements.tabAudioBtn.addEventListener('click', () => switchMainTab('audio-tools'));
    if (elements.tabPdfBtn) elements.tabPdfBtn.addEventListener('click', () => switchMainTab('pdf-tools'));

    if (elements.navImageLink) elements.navImageLink.addEventListener('click', () => switchMainTab('image-tools'));
    if (elements.navPdfLink) elements.navPdfLink.addEventListener('click', () => switchMainTab('pdf-tools'));

    // Language change
    if (elements.langSelect) {
      elements.langSelect.addEventListener('change', (e) => {
        if (window.I18nEngine) {
          I18nEngine.setLanguage(e.target.value);
          showToast(`Language switched to ${e.target.options[e.target.selectedIndex].text}`, 'success');
        }
      });
    }

    // Image File Selection
    elements.dropzone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (e) => handleFilesSelected(e.target.files));

    const mainAddFilesBtn = document.getElementById('mainAddFilesBtn');
    if (mainAddFilesBtn) {
      mainAddFilesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.fileInput.click();
      });
    }

    const addMoreFilesBtn = document.getElementById('addMoreFilesBtn');
    if (addMoreFilesBtn) {
      addMoreFilesBtn.addEventListener('click', () => elements.fileInput.click());
    }

    // Sample Images & PDF Buttons
    if (elements.sampleImagesBtn) elements.sampleImagesBtn.addEventListener('click', loadSampleImages);
    const samplePdfBtn = document.getElementById('samplePdfBtn');
    if (samplePdfBtn) samplePdfBtn.addEventListener('click', loadSamplePDF);

    // Format Change
    elements.formatSelect.addEventListener('change', (e) => {
      state.settings.format = e.target.value;
      recompressAll();
    });

    // Quality Slider
    elements.qualitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      elements.qualityValue.textContent = `${val}%`;
      state.settings.quality = val / 100;
    });
    elements.qualitySlider.addEventListener('change', () => recompressAll());

    // Resize Mode Change
    elements.resizeSelect.addEventListener('change', (e) => {
      state.settings.resizeMode = e.target.value;
      updateResizeControlsUI();
      recompressAll();
    });

    // Batch Actions
    elements.downloadAllBtn.addEventListener('click', downloadAllAsZip);
    elements.clearAllBtn.addEventListener('click', clearAllFiles);

    // Modal Close
    elements.comparisonCloseBtn.addEventListener('click', closeComparisonModal);
    elements.comparisonModal.addEventListener('click', (e) => {
      if (e.target === elements.comparisonModal) closeComparisonModal();
    });
  }

  // Switch Main Workspace Tabs
  function switchMainTab(tabId) {
    state.activeTab = tabId;
    elements.tabImageBtn.classList.toggle('active', tabId === 'image-tools');
    if (elements.tabBgBtn) elements.tabBgBtn.classList.toggle('active', tabId === 'bg-tools');
    if (elements.tabQrBtn) elements.tabQrBtn.classList.toggle('active', tabId === 'qr-tools');
    if (elements.tabBarcodeBtn) elements.tabBarcodeBtn.classList.toggle('active', tabId === 'barcode-tools');
    if (elements.tabPassportBtn) elements.tabPassportBtn.classList.toggle('active', tabId === 'passport-tools');
    if (elements.tabCollageBtn) elements.tabCollageBtn.classList.toggle('active', tabId === 'collage-tools');
    if (elements.tabFiltersBtn) elements.tabFiltersBtn.classList.toggle('active', tabId === 'filter-tools');
    if (elements.tabSocialCropBtn) elements.tabSocialCropBtn.classList.toggle('active', tabId === 'social-tools');
    if (elements.tabOcrBtn) elements.tabOcrBtn.classList.toggle('active', tabId === 'ocr-tools');
    if (elements.tabVideoBtn) elements.tabVideoBtn.classList.toggle('active', tabId === 'video-tools');
    if (elements.tabAudioBtn) elements.tabAudioBtn.classList.toggle('active', tabId === 'audio-tools');
    elements.tabPdfBtn.classList.toggle('active', tabId === 'pdf-tools');

    elements.imageWorkspace.style.display = tabId === 'image-tools' ? 'block' : 'none';
    if (elements.bgRemoverWorkspace) elements.bgRemoverWorkspace.style.display = tabId === 'bg-tools' ? 'block' : 'none';
    if (elements.qrWorkspace) elements.qrWorkspace.style.display = tabId === 'qr-tools' ? 'block' : 'none';
    if (elements.barcodeWorkspace) elements.barcodeWorkspace.style.display = tabId === 'barcode-tools' ? 'block' : 'none';
    if (elements.passportWorkspace) elements.passportWorkspace.style.display = tabId === 'passport-tools' ? 'block' : 'none';
    if (elements.collageWorkspace) elements.collageWorkspace.style.display = tabId === 'collage-tools' ? 'block' : 'none';
    if (elements.filtersWorkspace) elements.filtersWorkspace.style.display = tabId === 'filter-tools' ? 'block' : 'none';
    if (elements.socialCropWorkspace) elements.socialCropWorkspace.style.display = tabId === 'social-tools' ? 'block' : 'none';
    if (elements.ocrWorkspace) elements.ocrWorkspace.style.display = tabId === 'ocr-tools' ? 'block' : 'none';
    if (elements.videoWorkspace) elements.videoWorkspace.style.display = tabId === 'video-tools' ? 'block' : 'none';
    if (elements.audioWorkspace) elements.audioWorkspace.style.display = tabId === 'audio-tools' ? 'block' : 'none';
    elements.pdfWorkspace.style.display = tabId === 'pdf-tools' ? 'block' : 'none';

    // Auto update for QR or Barcode
    if (tabId === 'qr-tools' && window.updateQRCode) window.updateQRCode();
    if (tabId === 'barcode-tools' && window.updateBarcode) window.updateBarcode();
  }

  // =========================================================================
  // BACKGROUND REMOVER IMPLEMENTATION (AI & REMOVE.BG GRADE)
  // =========================================================================
  function setupBackgroundRemover() {
    let currentBgRawImage = null;
    let currentMode = 'ai-portrait';
    let currentBrushMode = 'off'; // 'off' | 'erase' | 'restore'
    let brushSize = 25;
    let isBrushing = false;
    let manualMaskCanvas = null;
    let isComparing = false;
    let currentCutoutBlob = null;

    if (!elements.bgDropzone) return;

    // Dropzone Listeners
    elements.bgDropzone.addEventListener('click', () => elements.bgFileInput.click());
    const bgAddFileBtn = document.getElementById('bgAddFileBtn');
    if (bgAddFileBtn) {
      bgAddFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.bgFileInput.click();
      });
    }
    elements.bgFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadBgImageFile(file);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      elements.bgDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        elements.bgDropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      elements.bgDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        elements.bgDropzone.classList.remove('drag-over');
      });
    });

    elements.bgDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) loadBgImageFile(file);
    });

    // Sample Image Buttons
    if (elements.sampleBgPortraitBtn) {
      elements.sampleBgPortraitBtn.addEventListener('click', loadSamplePortraitImage);
    }
    if (elements.sampleBgBtn) {
      elements.sampleBgBtn.addEventListener('click', loadSampleBgImage);
    }

    // Engine Mode Switcher
    const modeBtns = document.querySelectorAll('.bg-mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        currentMode = btn.dataset.mode;
        
        // Show/hide tolerance slider based on mode
        const tolGroup = document.getElementById('bgToleranceGroup');
        if (tolGroup) {
          tolGroup.style.display = currentMode === 'ai-portrait' ? 'none' : 'block';
        }

        runBgCutout();
      });
    });

    // Tolerance & Smoothness Sliders
    if (elements.bgToleranceSlider) {
      elements.bgToleranceSlider.addEventListener('input', (e) => {
        elements.bgToleranceValue.textContent = `${e.target.value}%`;
      });
      elements.bgToleranceSlider.addEventListener('change', () => runBgCutout());
    }

    if (elements.bgSmoothSlider) {
      elements.bgSmoothSlider.addEventListener('input', (e) => {
        elements.bgSmoothValue.textContent = `${e.target.value}px`;
      });
      elements.bgSmoothSlider.addEventListener('change', () => runBgCutout());
    }

    // Background Swatches Strip (Mobile-Native UI)
    const swatchItems = document.querySelectorAll('.bg-swatch-item');
    swatchItems.forEach(item => {
      item.addEventListener('click', () => {
        swatchItems.forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        const bgVal = item.dataset.bg;
        
        if (elements.bgReplaceSelect) {
          elements.bgReplaceSelect.value = bgVal;
        }

        if (bgVal === 'custom') {
          elements.customBgColorGroup.style.display = 'block';
          if (elements.bgCustomColorInput) elements.bgCustomColorInput.click();
        } else {
          elements.customBgColorGroup.style.display = 'none';
        }

        runBgCutout();
      });
    });

    if (elements.bgCustomColorInput) {
      elements.bgCustomColorInput.addEventListener('input', () => runBgCutout());
    }

    // Touchup Brush Modes
    const brushBtns = document.querySelectorAll('.bg-brush-btn');
    brushBtns.forEach(b => {
      b.addEventListener('click', () => {
        brushBtns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        if (b.id === 'bgBrushEraseBtn') currentBrushMode = 'erase';
        else if (b.id === 'bgBrushRestoreBtn') currentBrushMode = 'restore';
        else currentBrushMode = 'off';

        setupBrushOverlayState();
      });
    });

    if (elements.bgBrushSizeSlider) {
      elements.bgBrushSizeSlider.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value, 10);
        if (elements.bgBrushSizeVal) elements.bgBrushSizeVal.textContent = `${brushSize}px`;
      });
    }

    if (elements.bgBrushClearBtn) {
      elements.bgBrushClearBtn.addEventListener('click', () => {
        manualMaskCanvas = null;
        setupBrushOverlayState();
        runBgCutout();
        showToast('Touchup brush reset.', 'info');
      });
    }

    // Reset Button
    if (elements.bgResetBtn) {
      elements.bgResetBtn.addEventListener('click', () => {
        currentBgRawImage = null;
        manualMaskCanvas = null;
        elements.bgControlsContainer.style.display = 'none';
        elements.bgDropzone.style.display = 'block';
        elements.bgFileInput.value = '';
      });
    }

    // Copy to Clipboard
    if (elements.bgCopyClipboardBtn) {
      elements.bgCopyClipboardBtn.addEventListener('click', async () => {
        const canvas = elements.bgResultCanvas;
        if (!canvas) return;
        try {
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            if (navigator.clipboard && navigator.clipboard.write) {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
              showToast('✅ Cutout copied to clipboard!', 'success');
            } else {
              showToast('Clipboard copy not supported on this browser.', 'error');
            }
          }, 'image/png');
        } catch (err) {
          showToast('Could not copy to clipboard: ' + err.message, 'error');
        }
      });
    }

    // Download PNG Button
    if (elements.bgDownloadBtn) {
      elements.bgDownloadBtn.addEventListener('click', () => {
        const canvas = elements.bgResultCanvas;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        triggerDownload(dataUrl, 'optipixel-ai-cutout.png');
        showToast('HD Transparent PNG downloaded!', 'success');
      });
    }

    // Setup Interactive Split Comparison Handle
    setupComparisonSlider();

    // Brush canvas listeners
    setupBrushDrawingEvents();

    function loadBgImageFile(file) {
      showToast('Analyzing image with AI...', 'info');
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          currentBgRawImage = img;
          manualMaskCanvas = null;
          elements.bgDropzone.style.display = 'none';
          elements.bgControlsContainer.style.display = 'block';
          
          if (elements.bgOriginalImg) {
            elements.bgOriginalImg.src = e.target.result;
          }

          runBgCutout();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    async function runBgCutout() {
      if (!currentBgRawImage || !window.BackgroundRemoverEngine) return;

      if (elements.bgLoadingIndicator) {
        elements.bgLoadingIndicator.style.display = 'block';
      }

      const tolerance = parseInt(elements.bgToleranceSlider ? elements.bgToleranceSlider.value : 30, 10);
      const smoothness = parseInt(elements.bgSmoothSlider ? elements.bgSmoothSlider.value : 3, 10);
      const bgChoice = elements.bgReplaceSelect ? elements.bgReplaceSelect.value : 'transparent';
      
      let customBg = 'transparent';
      let gradientType = 'none';
      let blurOriginal = false;

      if (bgChoice === '#ffffff' || bgChoice === '#0b0f19') {
        customBg = bgChoice;
      } else if (bgChoice === 'blur') {
        blurOriginal = true;
      } else if (bgChoice === 'custom') {
        customBg = elements.bgCustomColorInput ? elements.bgCustomColorInput.value : '#3b82f6';
      } else if (bgChoice === 'sunset' || bgChoice === 'cyber' || bgChoice === 'neon' || bgChoice === 'studio') {
        customBg = 'gradient';
        gradientType = bgChoice;
      }

      try {
        const engine = window.bgEngine || new window.BackgroundRemoverEngine();
        const result = await engine.removeBackground(currentBgRawImage, {
          mode: currentMode,
          tolerance,
          smoothness,
          customBg,
          gradientType,
          blurOriginal,
          manualMaskCanvas
        });

        const displayCanvas = elements.bgResultCanvas;
        displayCanvas.width = result.resultCanvas.width;
        displayCanvas.height = result.resultCanvas.height;
        const ctx = displayCanvas.getContext('2d');
        ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
        ctx.drawImage(result.resultCanvas, 0, 0);

        // Update brush overlay size
        if (elements.bgBrushOverlayCanvas) {
          elements.bgBrushOverlayCanvas.width = displayCanvas.width;
          elements.bgBrushOverlayCanvas.height = displayCanvas.height;
        }

        // Align Original Image dimensions perfectly with display canvas for flawless split comparison
        if (elements.bgOriginalImg) {
          elements.bgOriginalImg.style.width = '100%';
          elements.bgOriginalImg.style.height = '100%';
        }

        // Set Split Slider to 50%
        updateSplitSlider(50);
      } catch (err) {
        console.error('Background removal error:', err);
        showToast('AI removal error: ' + err.message, 'error');
      } finally {
        if (elements.bgLoadingIndicator) {
          elements.bgLoadingIndicator.style.display = 'none';
        }
      }
    }

    function setupComparisonSlider() {
      const wrapper = elements.bgCompareWrapper;
      const handle = elements.bgCompareHandle;
      const overlay = elements.bgOriginalOverlay;
      if (!wrapper || !handle || !overlay) return;

      let isDragging = false;

      function onPointerDown(e) {
        if (currentBrushMode !== 'off') return; // Disable split dragging when in brush mode
        isDragging = true;
        if (e.cancelable) e.preventDefault();
        updatePos(e);
      }

      function onPointerMove(e) {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        updatePos(e);
      }

      function onPointerUp() {
        isDragging = false;
      }

      function updatePos(e) {
        const rect = wrapper.getBoundingClientRect();
        const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
        if (clientX === undefined) return;
        let percentage = ((clientX - rect.left) / rect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        updateSplitSlider(percentage);
      }

      wrapper.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      wrapper.addEventListener('touchstart', onPointerDown, { passive: false });
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
    }

    function updateSplitSlider(percentage) {
      if (!elements.bgOriginalOverlay || !elements.bgCompareHandle) return;
      elements.bgOriginalOverlay.style.width = `${percentage}%`;
      elements.bgCompareHandle.style.left = `${percentage}%`;
    }

    function setupBrushOverlayState() {
      const canvas = elements.bgBrushOverlayCanvas;
      if (!canvas) return;
      if (currentBrushMode === 'off') {
        canvas.style.display = 'none';
        canvas.style.pointerEvents = 'none';
        if (elements.bgCompareHandle) elements.bgCompareHandle.style.display = 'flex';
        if (elements.bgOriginalOverlay) elements.bgOriginalOverlay.style.display = 'block';
      } else {
        canvas.style.display = 'block';
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'crosshair';
        if (elements.bgCompareHandle) elements.bgCompareHandle.style.display = 'none';
        if (elements.bgOriginalOverlay) elements.bgOriginalOverlay.style.display = 'none';
      }
    }

    function setupBrushDrawingEvents() {
      const canvas = elements.bgBrushOverlayCanvas;
      if (!canvas) return;

      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
        const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      };

      const startDraw = (e) => {
        if (currentBrushMode === 'off') return;
        if (e.cancelable) e.preventDefault();
        isBrushing = true;
        if (!manualMaskCanvas && currentBgRawImage) {
          manualMaskCanvas = document.createElement('canvas');
          manualMaskCanvas.width = currentBgRawImage.naturalWidth || currentBgRawImage.width;
          manualMaskCanvas.height = currentBgRawImage.naturalHeight || currentBgRawImage.height;
        }
        draw(e);
      };

      const draw = (e) => {
        if (!isBrushing || currentBrushMode === 'off' || !manualMaskCanvas) return;
        if (e.cancelable) e.preventDefault();
        const pos = getPos(e);
        const mCtx = manualMaskCanvas.getContext('2d');
        mCtx.fillStyle = currentBrushMode === 'erase' ? '#ff0000' : '#00ff00';
        mCtx.beginPath();
        mCtx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
        mCtx.fill();

        // Render preview overlay
        const oCtx = canvas.getContext('2d');
        oCtx.fillStyle = currentBrushMode === 'erase' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)';
        oCtx.beginPath();
        oCtx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
        oCtx.fill();
      };

      const stopDraw = () => {
        if (isBrushing) {
          isBrushing = false;
          runBgCutout();
        }
      };

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDraw);

      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', stopDraw);
    }

    // Sample Portrait (Human AI Test)
    function loadSamplePortraitImage() {
      showToast('Generating HD model portrait for AI cutout...', 'info');
      const c = document.createElement('canvas');
      c.width = 720;
      c.height = 900;
      const ctx = c.getContext('2d');

      // Natural gradient background with studio lighting
      const bgGrad = ctx.createLinearGradient(0, 0, 720, 900);
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(0.5, '#cbd5e1');
      bgGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 720, 900);

      // Studio light circles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(360, 300, 240, 0, Math.PI * 2);
      ctx.fill();

      // Human Silhouette / Portrait Illustration with hair details
      // Shoulders / Jacket
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(120, 900);
      ctx.quadraticCurveTo(200, 600, 360, 600);
      ctx.quadraticCurveTo(520, 600, 600, 900);
      ctx.closePath();
      ctx.fill();

      // Shirt / Tie
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(330, 600);
      ctx.lineTo(360, 720);
      ctx.lineTo(390, 600);
      ctx.closePath();
      ctx.fill();

      // Neck
      ctx.fillStyle = '#e2a76f';
      ctx.beginPath();
      ctx.roundRect(325, 460, 70, 160, 20);
      ctx.fill();

      // Face
      ctx.fillStyle = '#f5c69b';
      ctx.beginPath();
      ctx.ellipse(360, 380, 110, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#331800';
      ctx.beginPath();
      ctx.arc(360, 330, 125, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();

      // Hair wisps
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#331800';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(240 + i * 35, 250, 40, 0, Math.PI);
        ctx.stroke();
      }

      // Sunglasses / Eyeglasses (Cool Look)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(280, 360, 65, 40, 10);
      ctx.roundRect(375, 360, 65, 40, 10);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(345, 380);
      ctx.lineTo(375, 380);
      ctx.stroke();

      const img = new Image();
      img.onload = () => {
        currentBgRawImage = img;
        manualMaskCanvas = null;
        elements.bgDropzone.style.display = 'none';
        elements.bgControlsContainer.style.display = 'block';
        if (elements.bgOriginalImg) elements.bgOriginalImg.src = c.toDataURL('image/png');
        
        // Default to AI Portrait
        currentMode = 'ai-portrait';
        document.querySelectorAll('.bg-mode-btn').forEach(b => {
          b.classList.toggle('btn-primary', b.dataset.mode === 'ai-portrait');
          b.classList.toggle('btn-secondary', b.dataset.mode !== 'ai-portrait');
        });

        runBgCutout();
        showToast('👤 Portrait loaded! AI Neural Cutout running...', 'success');
      };
      img.src = c.toDataURL('image/png');
    }

    // Sample Product (Wireless Headphones)
    function loadSampleBgImage() {
      showToast('Creating sample e-commerce product...', 'info');
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 800;
      const ctx = c.getContext('2d');

      // Studio White/Grey background
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 800, 800);

      // Gradient shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(400, 620, 220, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Modern Wireless Headphones graphic
      const grad = ctx.createLinearGradient(200, 200, 600, 600);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(0.5, '#6366f1');
      grad.addColorStop(1, '#a855f7');

      // Headphone Band
      ctx.strokeStyle = grad;
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.arc(400, 380, 180, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();

      // Left Ear Cup
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(220, 360, 70, 160, 35);
      ctx.fill();
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(245, 390, 20, 100, 10);
      ctx.fill();

      // Right Ear Cup
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(510, 360, 70, 160, 35);
      ctx.fill();
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.roundRect(535, 390, 20, 100, 10);
      ctx.fill();

      const img = new Image();
      img.onload = () => {
        currentBgRawImage = img;
        manualMaskCanvas = null;
        elements.bgDropzone.style.display = 'none';
        elements.bgControlsContainer.style.display = 'block';
        if (elements.bgOriginalImg) elements.bgOriginalImg.src = c.toDataURL('image/png');

        // Switch to Product & Object mode
        currentMode = 'ai-object';
        document.querySelectorAll('.bg-mode-btn').forEach(b => {
          b.classList.toggle('btn-primary', b.dataset.mode === 'ai-object');
          b.classList.toggle('btn-secondary', b.dataset.mode !== 'ai-object');
        });

        runBgCutout();
        showToast('📦 Sample product loaded! Object matting active.', 'success');
      };
      img.src = c.toDataURL('image/png');
    }
  }

  // =========================================================================
  // QR CODE STUDIO IMPLEMENTATION
  // =========================================================================
  function setupQRCodeStudio() {
    let currentLogoImg = null;

    window.updateQRCode = async function() {
      if (!elements.qrResultCanvas || !window.QRCodeEngine) return;

      const type = elements.qrTypeSelect.value;
      let text = 'https://optipixel.app';

      if (type === 'url' || type === 'text') {
        text = elements.qrTextInput.value.trim() || 'https://optipixel.app';
      } else if (type === 'wifi') {
        const ssid = elements.qrWifiSsid.value.trim() || 'My_WiFi';
        const pass = elements.qrWifiPass.value.trim() || '';
        text = `WIFI:T:WPA;S:${ssid};P:${pass};;`;
      } else if (type === 'whatsapp') {
        const num = elements.qrTextInput.value.trim().replace(/[^0-9]/g, '') || '1234567890';
        text = `https://wa.me/${num}`;
      }

      try {
        const qrCanvas = await QRCodeEngine.generateQRCode({
          text: text,
          size: 400,
          colorDark: elements.qrDarkColor.value,
          colorLight: elements.qrLightColor.value,
          logoImage: currentLogoImg
        });

        const displayCanvas = elements.qrResultCanvas;
        displayCanvas.width = 400;
        displayCanvas.height = 400;
        const ctx = displayCanvas.getContext('2d');
        ctx.clearRect(0, 0, 400, 400);
        ctx.drawImage(qrCanvas, 0, 0);
      } catch (err) {
        console.error('QR error', err);
      }
    };

    if (elements.qrTypeSelect) {
      elements.qrTypeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        if (type === 'wifi') {
          elements.qrWifiGroup.style.display = 'block';
          elements.qrContentGroup.style.display = 'none';
        } else {
          elements.qrWifiGroup.style.display = 'none';
          elements.qrContentGroup.style.display = 'block';
          if (type === 'whatsapp') {
            elements.qrTextInput.placeholder = 'Phone number with country code (e.g. +14155552671)';
          } else {
            elements.qrTextInput.placeholder = 'https://yourwebsite.com';
          }
        }
        window.updateQRCode();
      });
    }

    [elements.qrTextInput, elements.qrWifiSsid, elements.qrWifiPass, elements.qrDarkColor, elements.qrLightColor].forEach(el => {
      if (el) {
        el.addEventListener('input', () => window.updateQRCode());
      }
    });

    if (elements.qrLogoInput) {
      elements.qrLogoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
              currentLogoImg = img;
              window.updateQRCode();
              showToast('Center logo added to QR code!', 'success');
            };
            img.src = evt.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (elements.qrDownloadPngBtn) {
      elements.qrDownloadPngBtn.addEventListener('click', () => {
        const dataUrl = elements.qrResultCanvas.toDataURL('image/png');
        triggerDownload(dataUrl, 'custom-qrcode.png');
        showToast('High-Res QR Code downloaded!', 'success');
      });
    }

    // Initial QR render
    setTimeout(() => {
      if (window.updateQRCode) window.updateQRCode();
    }, 200);
  }

  // =========================================================================
  // PASSPORT PHOTO MAKER IMPLEMENTATION
  // =========================================================================
  function setupPassportMaker() {
    let currentPortraitImg = null;

    if (!elements.passportDropzone) return;

    elements.passportDropzone.addEventListener('click', () => elements.passportFileInput.click());
    elements.passportFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadPassportImage(file);
    });

    if (elements.samplePassportBtn) {
      elements.samplePassportBtn.addEventListener('click', loadSamplePassport);
    }

    [elements.passportTypeSelect, elements.passportBgSelect, elements.passportSheetSelect].forEach(el => {
      if (el) el.addEventListener('change', () => renderPassport());
    });

    if (elements.passportResetBtn) {
      elements.passportResetBtn.addEventListener('click', () => {
        currentPortraitImg = null;
        elements.passportControlsContainer.style.display = 'none';
        elements.passportDropzone.style.display = 'block';
        elements.passportFileInput.value = '';
      });
    }

    if (elements.passportDownloadBtn) {
      elements.passportDownloadBtn.addEventListener('click', () => {
        const canvas = elements.passportResultCanvas;
        if (!canvas) return;
        const isSheet = elements.passportSheetSelect.value === '4x6';
        const dataUrl = canvas.toDataURL('image/png');
        triggerDownload(dataUrl, isSheet ? 'passport-photos-4x6-sheet.png' : 'passport-photo.png');
        showToast('Passport Photo downloaded!', 'success');
      });
    }

    function loadPassportImage(file) {
      showToast('Aligning portrait for passport standard...', 'info');
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          currentPortraitImg = img;
          elements.passportDropzone.style.display = 'none';
          elements.passportControlsContainer.style.display = 'block';
          renderPassport();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function renderPassport() {
      if (!currentPortraitImg || !window.PassportMakerEngine) return;

      const type = elements.passportTypeSelect.value;
      const bgColor = elements.passportBgSelect.value;
      const sheet = elements.passportSheetSelect.value;

      const singleCanvas = PassportMakerEngine.generateSinglePassportPhoto(currentPortraitImg, {
        type,
        bgColor
      });

      let finalCanvas = singleCanvas;
      if (sheet === '4x6') {
        finalCanvas = PassportMakerEngine.generatePrintableSheet(singleCanvas, { sheetType: '4x6' });
      }

      const display = elements.passportResultCanvas;
      display.width = finalCanvas.width;
      display.height = finalCanvas.height;
      const ctx = display.getContext('2d');
      ctx.clearRect(0, 0, display.width, display.height);
      ctx.drawImage(finalCanvas, 0, 0);
    }

    function loadSamplePassport() {
      showToast('Generating sample portrait...', 'info');
      const c = document.createElement('canvas');
      c.width = 600;
      c.height = 600;
      const ctx = c.getContext('2d');

      // Gradient background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 600);

      // Face silhouette
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.ellipse(300, 260, 110, 140, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(300, 220, 125, Math.PI, Math.PI * 2);
      ctx.fill();

      // Suit / Shoulders
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(300, 520, 220, 150, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shirt collar & tie
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(250, 390);
      ctx.lineTo(300, 480);
      ctx.lineTo(350, 390);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(290, 420);
      ctx.lineTo(310, 420);
      ctx.lineTo(315, 560);
      ctx.lineTo(300, 580);
      ctx.lineTo(285, 560);
      ctx.fill();

      const img = new Image();
      img.onload = () => {
        currentPortraitImg = img;
        elements.passportDropzone.style.display = 'none';
        elements.passportControlsContainer.style.display = 'block';
        renderPassport();
        showToast('Sample portrait loaded!', 'success');
      };
      img.src = c.toDataURL('image/png');
    }
  }

  // =========================================================================
  // IMAGE FILTERS & EFFECTS IMPLEMENTATION
  // =========================================================================
  function setupFiltersStudio() {
    let currentFilterImg = null;
    let activePreset = 'none';

    if (!elements.filtersDropzone) return;

    elements.filtersDropzone.addEventListener('click', () => elements.filtersFileInput.click());
    elements.filtersFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadFilterImage(file);
    });

    elements.filterPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.filterPresetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activePreset = btn.dataset.preset;
        renderFilteredImage();
      });
    });

    [
      { slider: elements.filterBrightSlider, label: elements.filterBrightVal, unit: '%' },
      { slider: elements.filterContrastSlider, label: elements.filterContrastVal, unit: '%' },
      { slider: elements.filterSaturateSlider, label: elements.filterSaturateVal, unit: '%' },
      { slider: elements.filterBlurSlider, label: elements.filterBlurVal, unit: 'px' }
    ].forEach(({ slider, label, unit }) => {
      if (slider) {
        slider.addEventListener('input', (e) => {
          label.textContent = `${e.target.value}${unit}`;
          renderFilteredImage();
        });
      }
    });

    if (elements.filtersResetBtn) {
      elements.filtersResetBtn.addEventListener('click', () => {
        currentFilterImg = null;
        elements.filtersControlsContainer.style.display = 'none';
        elements.filtersDropzone.style.display = 'block';
        elements.filtersFileInput.value = '';
      });
    }

    if (elements.filtersDownloadBtn) {
      elements.filtersDownloadBtn.addEventListener('click', () => {
        const canvas = elements.filterResultCanvas;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        triggerDownload(dataUrl, 'optipixel-enhanced-photo.png');
        showToast('Enhanced photo downloaded!', 'success');
      });
    }

    const sampleFilterBtn = document.getElementById('sampleFilterBtn');
    if (sampleFilterBtn) {
      sampleFilterBtn.addEventListener('click', () => {
        showToast('Loading demo photo...', 'info');
        const c = document.createElement('canvas');
        c.width = 1200;
        c.height = 800;
        const ctx = c.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(0.5, '#fb923c');
        grad.addColorStop(1, '#6366f1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 800);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 56px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ OptiPixel Live Studio Filter Preview', 600, 420);
        const img = new Image();
        img.onload = () => {
          currentFilterImg = img;
          elements.filtersDropzone.style.display = 'none';
          elements.filtersControlsContainer.style.display = 'block';
          renderFilteredImage();
          showToast('Demo photo loaded into Filters Studio!', 'success');
        };
        img.src = c.toDataURL('image/png');
      });
    }

    function loadFilterImage(file) {
      showToast('Loading photo into filter studio...', 'info');
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          currentFilterImg = img;
          elements.filtersDropzone.style.display = 'none';
          elements.filtersControlsContainer.style.display = 'block';
          renderFilteredImage();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function renderFilteredImage() {
      if (!currentFilterImg || !window.FilterStudioEngine) return;

      const brightness = parseInt(elements.filterBrightSlider.value, 10);
      const contrast = parseInt(elements.filterContrastSlider.value, 10);
      const saturate = parseInt(elements.filterSaturateSlider.value, 10);
      const blur = parseInt(elements.filterBlurSlider.value, 10);

      const resultCanvas = FilterStudioEngine.applyFilters(currentFilterImg, {
        brightness,
        contrast,
        saturate,
        blur,
        preset: activePreset
      });

      const display = elements.filterResultCanvas;
      display.width = resultCanvas.width;
      display.height = resultCanvas.height;
      const ctx = display.getContext('2d');
      ctx.clearRect(0, 0, display.width, display.height);
      ctx.drawImage(resultCanvas, 0, 0);
    }
  }

  // =========================================================================
  // SOCIAL MEDIA CROP & RESIZE IMPLEMENTATION
  // =========================================================================
  function setupSocialCropStudio() {
    let currentCropImg = null;

    if (!elements.socialCropDropzone) return;

    elements.socialCropDropzone.addEventListener('click', () => elements.socialCropFileInput.click());
    elements.socialCropFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadCropImage(file);
    });

    [elements.socialRatioSelect, elements.socialFitSelect].forEach(el => {
      if (el) el.addEventListener('change', () => renderSocialCrop());
    });

    if (elements.socialCropResetBtn) {
      elements.socialCropResetBtn.addEventListener('click', () => {
        currentCropImg = null;
        elements.socialCropControlsContainer.style.display = 'none';
        elements.socialCropDropzone.style.display = 'block';
        elements.socialCropFileInput.value = '';
      });
    }

    if (elements.socialCropDownloadBtn) {
      elements.socialCropDownloadBtn.addEventListener('click', () => {
        const canvas = elements.socialCropResultCanvas;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        triggerDownload(dataUrl, 'social-media-ready.jpg');
        showToast('Social Media image downloaded!', 'success');
      });
    }

    const sampleSocialBtn = document.getElementById('sampleSocialBtn');
    if (sampleSocialBtn) {
      sampleSocialBtn.addEventListener('click', () => {
        showToast('Loading demo photo...', 'info');
        const c = document.createElement('canvas');
        c.width = 1200;
        c.height = 800;
        const ctx = c.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(0.5, '#3b82f6');
        grad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 800);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚀 OptiPixel Social Aspect Framing', 600, 420);
        const img = new Image();
        img.onload = () => {
          currentCropImg = img;
          elements.socialCropDropzone.style.display = 'none';
          elements.socialCropControlsContainer.style.display = 'block';
          renderSocialCrop();
          showToast('Demo photo loaded into Social Crop Studio!', 'success');
        };
        img.src = c.toDataURL('image/png');
      });
    }

    function loadCropImage(file) {
      showToast('Framing photo for social platforms...', 'info');
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          currentCropImg = img;
          elements.socialCropDropzone.style.display = 'none';
          elements.socialCropControlsContainer.style.display = 'block';
          renderSocialCrop();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function renderSocialCrop() {
      if (!currentCropImg || !window.FilterStudioEngine) return;

      const ratio = elements.socialRatioSelect.value;
      const fitMode = elements.socialFitSelect.value;

      const resultCanvas = FilterStudioEngine.applySocialCrop(currentCropImg, {
        ratio,
        fitMode
      });

      const display = elements.socialCropResultCanvas;
      display.width = resultCanvas.width;
      display.height = resultCanvas.height;
      const ctx = display.getContext('2d');
      ctx.clearRect(0, 0, display.width, display.height);
      ctx.drawImage(resultCanvas, 0, 0);
    }
  }

  // =========================================================================
  // UNIVERSAL BARCODE STUDIO IMPLEMENTATION
  // =========================================================================
  function setupBarcodeStudio() {
    window.updateBarcode = function() {
      if (!elements.barcodeResultCanvas || !window.BarcodeEngine) return;
      const text = elements.barcodeTextInput.value.trim() || 'OPTI-89234710-PRO';
      const color = elements.barcodeColor.value;
      const bgColor = elements.barcodeBgColor.value;

      const barcodeCanvas = BarcodeEngine.generateBarcode(text, {
        color,
        bgColor,
        width: 440,
        height: 160,
        showText: true
      });

      const display = elements.barcodeResultCanvas;
      display.width = barcodeCanvas.width;
      display.height = barcodeCanvas.height;
      const ctx = display.getContext('2d');
      ctx.clearRect(0, 0, display.width, display.height);
      ctx.drawImage(barcodeCanvas, 0, 0);
    };

    [elements.barcodeTextInput, elements.barcodeColor, elements.barcodeBgColor].forEach(el => {
      if (el) {
        el.addEventListener('input', window.updateBarcode);
        el.addEventListener('change', window.updateBarcode);
      }
    });

    if (elements.barcodeDownloadBtn) {
      elements.barcodeDownloadBtn.addEventListener('click', () => {
        const display = elements.barcodeResultCanvas;
        if (!display) return;
        const dataUrl = display.toDataURL('image/png');
        triggerDownload(dataUrl, 'optipixel-barcode.png');
        showToast('Barcode downloaded successfully!', 'success');
      });
    }
  }

  // =========================================================================
  // SMART PHOTO COLLAGE MAKER IMPLEMENTATION
  // =========================================================================
  function setupCollageMaker() {
    let currentCollageImages = [];

    if (!elements.collageDropzone) return;

    elements.collageDropzone.addEventListener('click', () => elements.collageFileInput.click());
    elements.collageFileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) loadCollageFiles(files);
    });

    if (elements.sampleCollageBtn) {
      elements.sampleCollageBtn.addEventListener('click', () => {
        showToast('Loading demo collage photos...', 'info');
        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
        const imgs = [];
        let loaded = 0;

        colors.forEach((col, idx) => {
          const c = document.createElement('canvas');
          c.width = 600;
          c.height = 600;
          const ctx = c.getContext('2d');
          ctx.fillStyle = col;
          ctx.fillRect(0, 0, 600, 600);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Photo #${idx + 1}`, 300, 310);

          const img = new Image();
          img.onload = () => {
            imgs.push(img);
            loaded++;
            if (loaded === colors.length) {
              currentCollageImages = imgs;
              elements.collageDropzone.style.display = 'none';
              elements.collageControlsContainer.style.display = 'block';
              renderCollage();
              showToast('Demo photos loaded into Collage Maker!', 'success');
            }
          };
          img.src = c.toDataURL('image/png');
        });
      });
    }

    [elements.collageLayoutSelect, elements.collageBgColor].forEach(el => {
      if (el) el.addEventListener('change', renderCollage);
    });

    if (elements.collageSpacing) {
      elements.collageSpacing.addEventListener('input', (e) => {
        elements.collageSpacingVal.textContent = `${e.target.value}px`;
        renderCollage();
      });
    }

    if (elements.collageRadius) {
      elements.collageRadius.addEventListener('input', (e) => {
        elements.collageRadiusVal.textContent = `${e.target.value}px`;
        renderCollage();
      });
    }

    if (elements.collageResetBtn) {
      elements.collageResetBtn.addEventListener('click', () => {
        currentCollageImages = [];
        elements.collageControlsContainer.style.display = 'none';
        elements.collageDropzone.style.display = 'block';
        elements.collageFileInput.value = '';
      });
    }

    if (elements.collageDownloadBtn) {
      elements.collageDownloadBtn.addEventListener('click', () => {
        const canvas = elements.collageResultCanvas;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        triggerDownload(dataUrl, 'optipixel-photo-collage.png');
        showToast('Photo collage downloaded!', 'success');
      });
    }

    function loadCollageFiles(files) {
      showToast(`Loading ${files.length} photos into Collage Studio...`, 'info');
      currentCollageImages = [];
      let loaded = 0;

      files.slice(0, 6).forEach(f => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            currentCollageImages.push(img);
            loaded++;
            if (loaded === Math.min(files.length, 6)) {
              elements.collageDropzone.style.display = 'none';
              elements.collageControlsContainer.style.display = 'block';
              renderCollage();
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(f);
      });
    }

    function renderCollage() {
      if (!currentCollageImages.length || !window.CollageMakerEngine) return;

      const layout = elements.collageLayoutSelect.value;
      const spacing = parseInt(elements.collageSpacing.value, 10);
      const radius = parseInt(elements.collageRadius.value, 10);
      const bgColor = elements.collageBgColor.value;

      const resultCanvas = CollageMakerEngine.generateCollage(currentCollageImages, {
        layout,
        spacing,
        radius,
        bgColor,
        width: 1200,
        height: 1200
      });

      const display = elements.collageResultCanvas;
      display.width = resultCanvas.width;
      display.height = resultCanvas.height;
      const ctx = display.getContext('2d');
      ctx.clearRect(0, 0, display.width, display.height);
      ctx.drawImage(resultCanvas, 0, 0);
    }
  }

  // =========================================================================
  // IMAGE TO TEXT (OCR) STUDIO IMPLEMENTATION
  // =========================================================================
  function setupOCRStudio() {
    if (!elements.ocrDropzone) return;

    elements.ocrDropzone.addEventListener('click', () => elements.ocrFileInput.click());
    elements.ocrFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) runOCROnFile(file);
    });

    if (elements.sampleOcrBtn) {
      elements.sampleOcrBtn.addEventListener('click', () => {
        showToast('Scanning sample invoice...', 'info');
        const c = document.createElement('canvas');
        c.width = 800;
        c.height = 600;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 28px Outfit, sans-serif';
        ctx.fillText('INVOICE #INV-2026-9810', 40, 70);
        ctx.font = '18px monospace';
        ctx.fillText('Client: Acme Corporation', 40, 120);
        ctx.fillText('Product: OptiPixel Enterprise License', 40, 160);
        ctx.fillText('Amount: $4,500.00 USD (PAID IN FULL)', 40, 200);
        ctx.fillText('Date: September 01, 2026', 40, 240);
        ctx.fillText('Thank you for your business!', 40, 300);

        const img = new Image();
        img.onload = () => {
          renderOCRResults(img, "INVOICE #INV-2026-9810\nClient: Acme Corporation\nProduct: OptiPixel Enterprise License\nAmount: $4,500.00 USD (PAID IN FULL)\nDate: September 01, 2026\nThank you for your business!");
        };
        img.src = c.toDataURL('image/png');
      });
    }

    if (elements.ocrCopyBtn) {
      elements.ocrCopyBtn.addEventListener('click', () => {
        if (!elements.ocrOutputText.value) return;
        navigator.clipboard.writeText(elements.ocrOutputText.value);
        showToast('Text copied to clipboard!', 'success');
      });
    }

    if (elements.ocrDownloadTxtBtn) {
      elements.ocrDownloadTxtBtn.addEventListener('click', () => {
        if (!elements.ocrOutputText.value) return;
        const blob = new Blob([elements.ocrOutputText.value], { type: 'text/plain' });
        triggerDownload(blob, 'extracted-text.txt');
        showToast('Text file downloaded!', 'success');
      });
    }

    if (elements.ocrResetBtn) {
      elements.ocrResetBtn.addEventListener('click', () => {
        elements.ocrControlsContainer.style.display = 'none';
        elements.ocrDropzone.style.display = 'block';
        elements.ocrFileInput.value = '';
        elements.ocrOutputText.value = '';
      });
    }

    function runOCROnFile(file) {
      showToast('Extracting text via client-side OCR...', 'info');
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const text = await OCREngine.extractText(img);
          renderOCRResults(img, text);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function renderOCRResults(img, text) {
      elements.ocrDropzone.style.display = 'none';
      elements.ocrControlsContainer.style.display = 'block';

      const preview = OCREngine.preprocessImage(img);
      const display = elements.ocrPreviewCanvas;
      display.width = preview.width;
      display.height = preview.height;
      const ctx = display.getContext('2d');
      ctx.drawImage(preview, 0, 0);

      elements.ocrOutputText.value = text;
      showToast('Text extracted successfully!', 'success');
    }
  }

  // =========================================================================
  // VIDEO TO GIF & FRAME EXTRACTOR IMPLEMENTATION
  // =========================================================================
  function setupVideoGIFStudio() {
    if (!elements.videoDropzone) return;

    elements.videoDropzone.addEventListener('click', () => elements.videoFileInput.click());
    elements.videoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadVideoFile(file);
    });

    if (elements.sampleVideoBtn) {
      elements.sampleVideoBtn.addEventListener('click', () => {
        showToast('Generating demo video animation...', 'info');
        const c = document.createElement('canvas');
        c.width = 640;
        c.height = 360;
        const ctx = c.getContext('2d');
        const stream = c.captureStream(30);
        const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];
        rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          loadVideoBlob(blob);
        };
        rec.start();

        let frame = 0;
        const intv = setInterval(() => {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 640, 360);
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(100 + (frame * 12) % 440, 180, 40, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🎬 OptiPixel Video Engine', 320, 100);
          frame++;
          if (frame >= 45) {
            clearInterval(intv);
            rec.stop();
          }
        }, 33);
      });
    }

    if (elements.videoCaptureFrameBtn) {
      elements.videoCaptureFrameBtn.addEventListener('click', () => {
        if (!elements.videoPlayer) return;
        const c = VideoGIFEngine.captureFrame(elements.videoPlayer);
        const dataUrl = c.toDataURL('image/png');
        triggerDownload(dataUrl, `video-frame-${Math.floor(elements.videoPlayer.currentTime)}s.png`);
        showToast('High-res video frame captured!', 'success');
      });
    }

    if (elements.videoGenerateGifBtn) {
      elements.videoGenerateGifBtn.addEventListener('click', async () => {
        if (!elements.videoPlayer) return;
        showToast('Extracting frame sequence grid...', 'info');
        const frames = await VideoGIFEngine.extractFrameSequence(elements.videoPlayer, 6);
        if (frames.length > 0 && window.CollageMakerEngine) {
          const collage = CollageMakerEngine.generateCollage(frames, { layout: '6-grid', spacing: 8 });
          triggerDownload(collage.toDataURL('image/png'), 'video-frame-sequence.png');
          showToast('Frame sequence grid exported!', 'success');
        }
      });
    }

    if (elements.videoResetBtn) {
      elements.videoResetBtn.addEventListener('click', () => {
        elements.videoControlsContainer.style.display = 'none';
        elements.videoDropzone.style.display = 'block';
        elements.videoFileInput.value = '';
        if (elements.videoPlayer) elements.videoPlayer.src = '';
      });
    }

    function loadVideoFile(file) {
      const url = URL.createObjectURL(file);
      elements.videoDropzone.style.display = 'none';
      elements.videoControlsContainer.style.display = 'block';
      elements.videoPlayer.src = url;
      showToast('Video clip loaded!', 'success');
    }

    function loadVideoBlob(blob) {
      const url = URL.createObjectURL(blob);
      elements.videoDropzone.style.display = 'none';
      elements.videoControlsContainer.style.display = 'block';
      elements.videoPlayer.src = url;
      showToast('Demo video clip loaded!', 'success');
    }
  }

  // =========================================================================
  // AUDIO RECORDER & STUDIO IMPLEMENTATION
  // =========================================================================
  function setupAudioStudio() {
    let audioEngine = null;
    let recordedData = null;

    if (elements.audioRecordBtn) {
      elements.audioRecordBtn.addEventListener('click', async () => {
        try {
          audioEngine = new AudioStudioEngine();
          await audioEngine.startRecording(elements.audioVisualizerCanvas);
          elements.audioRecordBtn.style.display = 'none';
          elements.audioStopBtn.style.display = 'inline-flex';
          elements.audioPlaybackContainer.style.display = 'none';
          showToast('Recording microphone audio...', 'info');
        } catch (err) {
          console.error(err);
          showToast('Microphone access denied or not available.', 'info');
        }
      });
    }

    if (elements.audioStopBtn) {
      elements.audioStopBtn.addEventListener('click', async () => {
        if (!audioEngine) return;
        recordedData = await audioEngine.stopRecording();
        elements.audioStopBtn.style.display = 'none';
        elements.audioRecordBtn.style.display = 'inline-flex';
        elements.audioRecordBtn.textContent = '🎙️ Record Again';
        if (recordedData) {
          elements.audioPlaybackContainer.style.display = 'block';
          elements.audioPlayer.src = recordedData.url;
          showToast('Audio recording finished!', 'success');
        }
      });
    }

    if (elements.audioSpeedSelect) {
      elements.audioSpeedSelect.addEventListener('change', (e) => {
        if (elements.audioPlayer) elements.audioPlayer.playbackRate = parseFloat(e.target.value);
      });
    }

    if (elements.audioDownloadBtn) {
      elements.audioDownloadBtn.addEventListener('click', () => {
        if (!recordedData || !recordedData.blob) return;
        triggerDownload(recordedData.blob, 'voice-recording.webm');
        showToast('Audio note downloaded!', 'success');
      });
    }
  }

  // =========================================================================
  // MULTI-LANGUAGE I18N IMPLEMENTATION
  // =========================================================================
  function setupI18n() {
    if (window.I18nEngine) {
      const saved = localStorage.getItem('optipixel_lang') || 'en';
      I18nEngine.setLanguage(saved);
      if (elements.langSelect) {
        elements.langSelect.value = saved;
      }
    }
  }

  // =========================================================================
  // PDF STUDIO & TOOLS IMPLEMENTATION
  // =========================================================================
  function setupPDFStudio() {
    if (window.pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // Subtools switcher (Visual Edit, Merge, Split, Img2PDF, Organize, Watermark, Protect)
    elements.pdfSubtoolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.pdfSubtoolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.pdfActiveSubtool = btn.dataset.tool;
        updatePDFSubtoolUI();
      });
    });

    // Dropzone for PDF
    elements.pdfDropzone.addEventListener('click', () => elements.pdfFileInput.click());
    elements.pdfFileInput.addEventListener('change', (e) => handlePDFFilesSelected(e.target.files));

    ['dragenter', 'dragover'].forEach(eventName => {
      elements.pdfDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        elements.pdfDropzone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      elements.pdfDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        elements.pdfDropzone.classList.remove('drag-over');
      }, false);
    });

    elements.pdfDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      handlePDFFilesSelected(e.dataTransfer.files);
    });

    // PDF Execute Action
    elements.pdfExecuteBtn.addEventListener('click', executePDFAction);
    elements.pdfResetBtn.addEventListener('click', resetPDFState);
  }

  function updatePDFSubtoolUI() {
    resetPDFState();
    const tool = state.pdfActiveSubtool;

    elements.pdfWatermarkInputContainer.style.display = tool === 'watermark' ? 'block' : 'none';
    const pdfProtectContainer = document.getElementById('pdfProtectInputContainer');
    if (pdfProtectContainer) pdfProtectContainer.style.display = tool === 'protect' ? 'block' : 'none';
    const pdfSplitContainer = document.getElementById('pdfSplitInputContainer');
    if (pdfSplitContainer) pdfSplitContainer.style.display = tool === 'split' ? 'block' : 'none';
    elements.visualEditorWorkspace.style.display = 'none';

    if (tool === 'visual-edit') {
      elements.pdfFileInput.accept = '.pdf,application/pdf';
      elements.pdfFileInput.multiple = false;
      elements.pdfDropzoneTitle.innerHTML = 'Drop a PDF to <span class="text-gradient">Edit Existing Text, Sign &amp; Write</span>';
      elements.pdfDropzoneSubtitle.textContent = 'Upload a PDF to modify words, type new text, or sign';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Save &amp; Download Edited PDF
      `;
    } else if (tool === 'word2pdf') {
      elements.pdfFileInput.accept = '.docx,.doc,.txt,.rtf,.html,.md,.odt';
      elements.pdfFileInput.multiple = false;
      elements.pdfDropzoneTitle.innerHTML = 'Drop a Word or Docs file to <span class="text-gradient">Convert to PDF</span>';
      elements.pdfDropzoneSubtitle.textContent = 'Supports Microsoft Word (.DOCX, .DOC), Google Docs, Text, Markdown & HTML';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Convert &amp; Download PDF
      `;
    } else if (tool === 'pdf2word') {
      elements.pdfFileInput.accept = '.pdf,application/pdf';
      elements.pdfFileInput.multiple = false;
      elements.pdfDropzoneTitle.innerHTML = 'Drop a PDF file to <span class="text-gradient">Convert to Word (.DOCX) &amp; Docs</span>';
      elements.pdfDropzoneSubtitle.textContent = 'Converts PDF text, paragraphs, and structure into an editable Microsoft Word document';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        Convert &amp; Download Word (.DOCX)
      `;
    } else if (tool === 'split') {
      elements.pdfFileInput.accept = '.pdf,application/pdf';
      elements.pdfFileInput.multiple = false;
      elements.pdfDropzoneTitle.innerHTML = 'Drop a PDF to <span class="text-gradient">Split &amp; Extract Pages</span>';
      elements.pdfDropzoneSubtitle.textContent = 'Extract specific page ranges into a separate document';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3"/><path d="m9 17 3-3 3 3"/></svg>
        Extract &amp; Download PDF
      `;
    } else if (tool === 'protect') {
      elements.pdfFileInput.accept = '.pdf,application/pdf';
      elements.pdfFileInput.multiple = false;
      elements.pdfDropzoneTitle.innerHTML = 'Drop a PDF to <span class="text-gradient">Password Protect &amp; Encrypt</span>';
      elements.pdfDropzoneSubtitle.textContent = 'Add secure 128/256-bit password protection to your document';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Encrypt &amp; Download PDF
      `;
    } else if (tool === 'merge') {
      elements.pdfFileInput.accept = '.pdf,application/pdf';
      elements.pdfFileInput.multiple = true;
      elements.pdfDropzoneTitle.innerHTML = 'Drop multiple PDF files to <span class="text-gradient">Merge into One</span>';
      elements.pdfDropzoneSubtitle.textContent = 'Upload 2 or more PDF documents';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-3"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Merge & Download PDF
      `;
    } else if (tool === 'img2pdf') {
      elements.pdfFileInput.accept = 'image/*';
      elements.pdfFileInput.multiple = true;
      elements.pdfDropzoneTitle.innerHTML = 'Drop images to <span class="text-gradient">Convert to PDF</span>';
      elements.pdfDropzoneSubtitle.textContent = 'JPG, PNG, WebP images';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        Convert Images to PDF
      `;
    } else if (tool === 'organize') {
      elements.pdfFileInput.accept = '.pdf,application/pdf';
      elements.pdfFileInput.multiple = false;
      elements.pdfDropzoneTitle.innerHTML = 'Drop a PDF to <span class="text-gradient">Reorder, Rotate & Delete Pages</span>';
      elements.pdfDropzoneSubtitle.textContent = 'Upload 1 PDF document to visually edit its pages';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Save Edited PDF
      `;
    } else if (tool === 'watermark') {
      elements.pdfFileInput.accept = '.pdf,application/pdf';
      elements.pdfFileInput.multiple = false;
      elements.pdfDropzoneTitle.innerHTML = 'Drop a PDF to <span class="text-gradient">Add Text Watermark</span>';
      elements.pdfDropzoneSubtitle.textContent = 'Protect your documents with stamp overlays';
      elements.pdfExecuteBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Apply Watermark & Download
      `;
    }
  }

  async function handlePDFFilesSelected(fileList) {
    if (!fileList || fileList.length === 0) return;
    const tool = state.pdfActiveSubtool;
    const files = Array.from(fileList);

    if (tool === 'visual-edit') {
      const pdf = files.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      if (!pdf) return showToast('Please select a valid PDF file.', 'info');
      state.currentPdfFile = pdf;
      await loadPDFInVisualEditor(pdf);
    } else if (tool === 'word2pdf') {
      const doc = files[0];
      if (!doc) return showToast('Please select a Word or Docs document.', 'info');
      state.currentDocFile = doc;
      renderSinglePDFInfo(doc);
    } else if (tool === 'pdf2word') {
      const pdf = files.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      if (!pdf) return showToast('Please select a valid PDF document.', 'info');
      state.currentPdfFile = pdf;
      renderSinglePDFInfo(pdf);
    } else if (tool === 'merge') {
      const pdfs = files.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      if (pdfs.length === 0) return showToast('Please select PDF files.', 'info');
      state.pdfFiles.push(...pdfs);
      renderPDFMergeList();
    } else if (tool === 'img2pdf') {
      const imgs = files.filter(f => f.type.startsWith('image/'));
      if (imgs.length === 0) return showToast('Please select image files.', 'info');
      state.pdfFiles.push(...imgs);
      renderPDFImg2PdfList();
    } else if (tool === 'organize' || tool === 'watermark' || tool === 'split' || tool === 'protect') {
      const pdf = files.find(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      if (!pdf) return showToast('Please upload a valid PDF document.', 'info');
      state.currentPdfFile = pdf;

      if (tool === 'organize') {
        showToast('Rendering PDF pages...', 'info');
        try {
          state.pdfPages = await PDFEditorEngine.extractPageThumbnails(pdf);
          renderPDFOrganizeGrid();
        } catch (err) {
          console.error(err);
          showToast('Could not load PDF pages.', 'info');
        }
      } else {
        renderSinglePDFInfo(pdf);
      }
    }

    elements.pdfActionsContainer.style.display = 'block';
    elements.pdfFileInput.value = '';
  }

  // =========================================================================
  // VISUAL CANVAS PDF ANNOTATOR & IN-PLACE TEXT EDITOR
  // =========================================================================
  async function loadPDFInVisualEditor(pdfFile) {
    showToast('Loading document for In-Place Text Editing...', 'info');
    try {
      state.visualDoc = await PDFEditorEngine.loadPDFDocument(pdfFile);
      state.visualTotalPages = state.visualDoc.numPages;
      state.visualPageNum = 1;
      elements.visualEditorWorkspace.style.display = 'block';
      await renderCurrentVisualPage();
    } catch (err) {
      console.error(err);
      showToast('Could not render PDF for editing.', 'info');
    }
  }

  async function renderCurrentVisualPage() {
    if (!state.visualDoc) return;
    elements.pdfPageIndicator.textContent = `Page ${state.visualPageNum} / ${state.visualTotalPages}`;
    elements.prevPdfPageBtn.disabled = state.visualPageNum <= 1;
    elements.nextPdfPageBtn.disabled = state.visualPageNum >= state.visualTotalPages;

    const baseCanvas = elements.pdfBaseCanvas;
    const annotCanvas = elements.pdfAnnotationCanvas;

    // Render Base Page
    await PDFEditorEngine.renderPageToCanvas(state.visualDoc, state.visualPageNum, baseCanvas, 1.4);

    // Sync annotation canvas dimensions
    annotCanvas.width = baseCanvas.width;
    annotCanvas.height = baseCanvas.height;
    annotCanvas.style.width = `${baseCanvas.clientWidth}px`;
    annotCanvas.style.height = `${baseCanvas.clientHeight}px`;

    const ctx = annotCanvas.getContext('2d');
    ctx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);

    // Clear existing floating text boxes
    elements.pdfTextOverlayLayer.innerHTML = '';
    state.floatingTextBoxes = [];

    // Extract text items from PDF to enable 1-click in-place text replacement
    try {
      state.detectedTextItems = await PDFEditorEngine.extractPageTextItems(state.visualDoc, state.visualPageNum, 1.4);
      renderDetectedTextHighlights();
    } catch (e) {
      console.error('Could not extract text layer:', e);
    }
  }

  // Render clickable hover boxes over existing text when in 'edit-text' mode
  function renderDetectedTextHighlights() {
    elements.pdfTextOverlayLayer.innerHTML = '';
    const scaleX = elements.pdfBaseCanvas.clientWidth / elements.pdfBaseCanvas.width;
    const scaleY = elements.pdfBaseCanvas.clientHeight / elements.pdfBaseCanvas.height;

    if (state.visualTool === 'edit-text') {
      state.detectedTextItems.forEach((item, idx) => {
        const box = document.createElement('div');
        box.className = 'pdf-detected-text-box';
        box.style.left = `${item.x * scaleX}px`;
        box.style.top = `${item.y * scaleY}px`;
        box.style.width = `${Math.max(20, item.width * scaleX)}px`;
        box.style.height = `${Math.max(14, item.height * scaleY)}px`;
        box.title = `Click to edit: "${item.str}"`;

        box.addEventListener('click', (e) => {
          e.stopPropagation();
          // 1. Cover original text with clean whiteout rectangle on annotation canvas
          const ctx = elements.pdfAnnotationCanvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(item.x - 2, item.y - 2, item.width + 6, item.height + 4);

          // 2. Remove the hover box
          box.remove();

          // 3. Create interactive editable text box prefilled with the original text!
          createFloatingTextBox(item.x * scaleX, item.y * scaleY, item.str, Math.max(12, item.fontSize));
        });

        elements.pdfTextOverlayLayer.appendChild(box);
      });
    }
  }

  // Deselect any active text widgets when clicking canvas
  function deselectAllTextWidgets() {
    document.querySelectorAll('.pdf-pro-text-widget').forEach(w => w.classList.remove('selected'));
  }

  // Create a Pro Editable & Draggable Floating Text Widget on the PDF
  function createFloatingTextBox(screenX, screenY, initialText = '', fontSize = 18, fontFamily = "'Outfit', sans-serif") {
    deselectAllTextWidgets();

    const boxId = 'txt_' + Math.random().toString(36).substr(2, 9);
    const widget = document.createElement('div');
    widget.className = 'pdf-pro-text-widget selected bg-white';
    widget.style.left = `${screenX}px`;
    widget.style.top = `${screenY}px`;

    // Widget State
    const textState = {
      id: boxId,
      widget: widget,
      fontFamily: fontFamily,
      fontSize: fontSize,
      isBold: true,
      isItalic: false,
      isUnderline: false,
      align: 'left',
      color: state.visualColor || '#000000',
      bgMode: 'white' // 'white' | 'yellow' | 'trans'
    };

    // 1. Floating Mini Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'text-mini-toolbar';

    toolbar.innerHTML = `
      <!-- Font Family -->
      <select class="mini-select font-family-select" title="Font Family">
        <option value="'Outfit', sans-serif" selected>Modern Sans</option>
        <option value="'Playfair Display', serif">Classic Serif</option>
        <option value="'JetBrains Mono', monospace">Monospace</option>
        <option value="'Caveat', cursive">✍️ Signature Font</option>
      </select>

      <!-- Font Size Controls -->
      <button type="button" class="mini-btn size-dec-btn" title="Decrease size">-</button>
      <span class="font-size-label" style="font-family: var(--font-mono); font-size: 0.75rem; min-width: 28px; text-align: center;">${fontSize}px</span>
      <button type="button" class="mini-btn size-inc-btn" title="Increase size">+</button>

      <!-- Bold / Italic / Underline -->
      <button type="button" class="mini-btn bold-toggle active" title="Bold">B</button>
      <button type="button" class="mini-btn italic-toggle" title="Italic"><i>I</i></button>
      <button type="button" class="mini-btn underline-toggle" title="Underline"><u>U</u></button>

      <!-- Background Fill -->
      <button type="button" class="mini-btn bg-toggle-btn" title="Background: White / Transparent / Yellow">⬜</button>

      <!-- Color -->
      <input type="color" class="mini-color-input" value="${state.visualColor || '#000000'}" title="Text Color">

      <!-- Duplicate & Delete -->
      <button type="button" class="mini-btn duplicate-btn" title="Duplicate Text">📋</button>
      <button type="button" class="mini-btn delete-btn" style="color: var(--accent-rose);" title="Delete">🗑️</button>
    `;

    // 2. Drag Handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'widget-drag-handle';
    dragHandle.innerHTML = `<span>⋮⋮ DRAG &amp; MOVE</span>`;

    // 3. Text Area
    const textarea = document.createElement('textarea');
    textarea.className = 'pdf-pro-text-textarea';
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.fontFamily = fontFamily;
    textarea.style.fontWeight = 'bold';
    textarea.style.color = state.visualColor || '#000000';
    textarea.value = initialText || 'Type text here...';
    textarea.rows = 1;

    // Auto-adjust size
    const adjustTextarea = () => {
      textarea.style.width = 'auto';
      textarea.style.width = Math.max(140, textarea.scrollWidth + 16) + 'px';
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(32, textarea.scrollHeight) + 'px';
    };

    textarea.addEventListener('input', adjustTextarea);

    // Stop canvas draw propagation on widget interaction
    ['mousedown', 'mousemove', 'mouseup', 'click', 'touchstart', 'touchmove', 'touchend'].forEach(evt => {
      toolbar.addEventListener(evt, e => e.stopPropagation());
      textarea.addEventListener(evt, e => e.stopPropagation());
    });

    widget.addEventListener('click', (e) => {
      e.stopPropagation();
      deselectAllTextWidgets();
      widget.classList.add('selected');
    });

    // Wire Mini Toolbar Controls
    const fontSelect = toolbar.querySelector('.font-family-select');
    const sizeDec = toolbar.querySelector('.size-dec-btn');
    const sizeInc = toolbar.querySelector('.size-inc-btn');
    const sizeLabel = toolbar.querySelector('.font-size-label');
    const boldBtn = toolbar.querySelector('.bold-toggle');
    const italicBtn = toolbar.querySelector('.italic-toggle');
    const underlineBtn = toolbar.querySelector('.underline-toggle');
    const bgBtn = toolbar.querySelector('.bg-toggle-btn');
    const colorInput = toolbar.querySelector('.mini-color-input');
    const duplicateBtn = toolbar.querySelector('.duplicate-btn');
    const deleteBtn = toolbar.querySelector('.delete-btn');

    fontSelect.addEventListener('change', (e) => {
      textState.fontFamily = e.target.value;
      textarea.style.fontFamily = e.target.value;
      adjustTextarea();
    });

    sizeDec.addEventListener('click', () => {
      textState.fontSize = Math.max(10, textState.fontSize - 2);
      textarea.style.fontSize = `${textState.fontSize}px`;
      sizeLabel.textContent = `${textState.fontSize}px`;
      adjustTextarea();
    });

    sizeInc.addEventListener('click', () => {
      textState.fontSize = Math.min(72, textState.fontSize + 2);
      textarea.style.fontSize = `${textState.fontSize}px`;
      sizeLabel.textContent = `${textState.fontSize}px`;
      adjustTextarea();
    });

    boldBtn.addEventListener('click', () => {
      textState.isBold = !textState.isBold;
      boldBtn.classList.toggle('active', textState.isBold);
      textarea.style.fontWeight = textState.isBold ? 'bold' : 'normal';
      adjustTextarea();
    });

    italicBtn.addEventListener('click', () => {
      textState.isItalic = !textState.isItalic;
      italicBtn.classList.toggle('active', textState.isItalic);
      textarea.style.fontStyle = textState.isItalic ? 'italic' : 'normal';
      adjustTextarea();
    });

    underlineBtn.addEventListener('click', () => {
      textState.isUnderline = !textState.isUnderline;
      underlineBtn.classList.toggle('active', textState.isUnderline);
      textarea.style.textDecoration = textState.isUnderline ? 'underline' : 'none';
    });

    bgBtn.addEventListener('click', () => {
      if (textState.bgMode === 'white') {
        textState.bgMode = 'yellow';
        widget.className = 'pdf-pro-text-widget selected bg-yellow';
        bgBtn.textContent = '🟨';
        bgBtn.title = 'Background: Yellow Highlight';
      } else if (textState.bgMode === 'yellow') {
        textState.bgMode = 'trans';
        widget.className = 'pdf-pro-text-widget selected bg-trans';
        bgBtn.textContent = '⬛';
        bgBtn.title = 'Background: Transparent';
      } else {
        textState.bgMode = 'white';
        widget.className = 'pdf-pro-text-widget selected bg-white';
        bgBtn.textContent = '⬜';
        bgBtn.title = 'Background: Solid White';
      }
    });

    colorInput.addEventListener('input', (e) => {
      textState.color = e.target.value;
      textarea.style.color = e.target.value;
    });

    duplicateBtn.addEventListener('click', () => {
      createFloatingTextBox(parseInt(widget.style.left, 10) + 20, parseInt(widget.style.top, 10) + 25, textarea.value, textState.fontSize, textState.fontFamily);
    });

    deleteBtn.addEventListener('click', () => {
      widget.remove();
      state.floatingTextBoxes = state.floatingTextBoxes.filter(t => t.id !== boxId);
    });

    // Dragging Logic
    let isDraggingWidget = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    dragHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      isDraggingWidget = true;
      const rect = widget.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDraggingWidget) return;
      const wrapperRect = elements.pdfCanvasWrapper.getBoundingClientRect();
      const newLeft = Math.max(0, Math.min(e.clientX - wrapperRect.left - dragOffsetX, wrapperRect.width - 50));
      const newTop = Math.max(0, Math.min(e.clientY - wrapperRect.top - dragOffsetY, wrapperRect.height - 30));
      widget.style.left = `${newLeft}px`;
      widget.style.top = `${newTop}px`;
    });

    window.addEventListener('mouseup', () => {
      isDraggingWidget = false;
    });

    // Assemble Widget
    widget.appendChild(toolbar);
    widget.appendChild(dragHandle);
    widget.appendChild(textarea);
    elements.pdfTextOverlayLayer.appendChild(widget);

    adjustTextarea();

    setTimeout(() => {
      textarea.focus();
      if (!initialText) textarea.select();
    }, 50);

    textState.textarea = textarea;
    state.floatingTextBoxes.push(textState);
  }

  function setupVisualCanvasEditor() {
    const toolBtns = [
      { el: elements.toolEditTextBtn, tool: 'edit-text', tip: '💡 <strong>Edit Existing Text Mode:</strong> Click on any word or line on the PDF to modify it!' },
      { el: elements.toolTextBtn, tool: 'add-text', tip: '🔤 <strong>Add New Text Mode:</strong> Click anywhere on the PDF page to type new text.' },
      { el: elements.toolWhiteoutBtn, tool: 'whiteout', tip: '🧼 <strong>Whiteout Mode:</strong> Drag a box over any text or graphic to erase it cleanly.' },
      { el: elements.toolPenBtn, tool: 'pen', tip: '✏️ <strong>Draw / Sign Mode:</strong> Draw freehand signatures or markups with your mouse/touchscreen.' },
      { el: elements.toolRectBtn, tool: 'rect', tip: '⬛ <strong>Redact Mode:</strong> Draw solid colored/black boxes to redact confidential information.' }
    ];

    toolBtns.forEach(({ el, tool, tip }) => {
      if (!el) return;
      el.addEventListener('click', () => {
        toolBtns.forEach(t => t.el?.classList.remove('active'));
        el.classList.add('active');
        state.visualTool = tool;
        if (elements.editorTipText) elements.editorTipText.innerHTML = tip;
        renderDetectedTextHighlights();
      });
    });

    if (elements.annotationColor) {
      elements.annotationColor.addEventListener('input', (e) => state.visualColor = e.target.value);
    }
    if (elements.annotationSize) {
      elements.annotationSize.addEventListener('input', (e) => state.visualSize = parseInt(e.target.value, 10));
    }

    if (elements.prevPdfPageBtn) {
      elements.prevPdfPageBtn.addEventListener('click', async () => {
        if (state.visualPageNum > 1) {
          bakeFloatingTextToCanvas();
          state.visualPageNum--;
          await renderCurrentVisualPage();
        }
      });
    }

    if (elements.nextPdfPageBtn) {
      elements.nextPdfPageBtn.addEventListener('click', async () => {
        if (state.visualPageNum < state.visualTotalPages) {
          bakeFloatingTextToCanvas();
          state.visualPageNum++;
          await renderCurrentVisualPage();
        }
      });
    }

    if (elements.clearCanvasBtn) {
      elements.clearCanvasBtn.addEventListener('click', () => {
        const ctx = elements.pdfAnnotationCanvas.getContext('2d');
        ctx.clearRect(0, 0, elements.pdfAnnotationCanvas.width, elements.pdfAnnotationCanvas.height);
        elements.pdfTextOverlayLayer.innerHTML = '';
        state.floatingTextBoxes = [];
        showToast('Page annotations cleared', 'info');
      });
    }

    // Canvas drawing interaction
    const canvas = elements.pdfAnnotationCanvas;
    if (!canvas) return;

    const getCanvasPos = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
        screenX: clientX - rect.left,
        screenY: clientY - rect.top
      };
    };

    const startDraw = (e) => {
      if (e.target.classList.contains('delete-text-btn') || e.target.classList.contains('pdf-editable-text-item') || e.target.classList.contains('pdf-detected-text-box')) return;
      const pos = getCanvasPos(e);
      const ctx = canvas.getContext('2d');

      if (state.visualTool === 'add-text') {
        createFloatingTextBox(pos.screenX, pos.screenY, 'New text', state.visualSize);
        return;
      }

      state.isDrawing = true;
      state.drawStartX = pos.x;
      state.drawStartY = pos.y;

      if (state.visualTool === 'pen') {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = state.visualColor;
        ctx.lineWidth = Math.max(2, state.visualSize / 4);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (state.visualTool === 'whiteout' || state.visualTool === 'rect') {
        state.annotationSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
    };

    const moveDraw = (e) => {
      if (!state.isDrawing) return;
      e.preventDefault();
      const pos = getCanvasPos(e);
      const ctx = canvas.getContext('2d');

      if (state.visualTool === 'pen') {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (state.visualTool === 'whiteout') {
        ctx.putImageData(state.annotationSnapshot, 0, 0);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(state.drawStartX, state.drawStartY, pos.x - state.drawStartX, pos.y - state.drawStartY);
      } else if (state.visualTool === 'rect') {
        ctx.putImageData(state.annotationSnapshot, 0, 0);
        ctx.fillStyle = state.visualColor;
        ctx.fillRect(state.drawStartX, state.drawStartY, pos.x - state.drawStartX, pos.y - state.drawStartY);
      }
    };

    const endDraw = () => {
      if (state.isDrawing && state.visualTool === 'pen') {
        const ctx = canvas.getContext('2d');
        ctx.closePath();
      }
      state.isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    window.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    window.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw);
  }

  // Rasterizes all floating text boxes onto the canvas before export/page change
  function bakeFloatingTextToCanvas() {
    const canvas = elements.pdfAnnotationCanvas;
    const ctx = canvas.getContext('2d');
    const scaleX = canvas.width / elements.pdfBaseCanvas.clientWidth;
    const scaleY = canvas.height / elements.pdfBaseCanvas.clientHeight;

    state.floatingTextBoxes.forEach(item => {
      const textarea = item.textarea;
      if (!textarea || !document.body.contains(textarea)) return;
      const text = textarea.value.trim();
      if (!text) return;

      const rect = textarea.getBoundingClientRect();
      const wrapperRect = elements.pdfCanvasWrapper.getBoundingClientRect();
      const left = (rect.left - wrapperRect.left + 8) * scaleX;
      const width = (rect.width) * scaleX;
      const height = (rect.height) * scaleY;
      const top = (rect.top - wrapperRect.top + rect.height * 0.72) * scaleY;
      const boxTop = (rect.top - wrapperRect.top) * scaleY;

      // 1. Draw Background Fill if not transparent
      if (item.bgMode === 'white') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect((rect.left - wrapperRect.left) * scaleX, boxTop, width, height);
      } else if (item.bgMode === 'yellow') {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
        ctx.fillRect((rect.left - wrapperRect.left) * scaleX, boxTop, width, height);
      }

      // 2. Setup Font & Style
      const fontStyle = item.isItalic ? 'italic' : 'normal';
      const fontWeight = item.isBold ? 'bold' : 'normal';
      const fontSize = Math.round(item.fontSize * scaleY);
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${item.fontFamily}`;
      ctx.fillStyle = item.color || '#000000';

      // 3. Draw Text
      ctx.fillText(text, left, top);

      // 4. Draw Underline if enabled
      if (item.isUnderline) {
        const textWidth = ctx.measureText(text).width;
        ctx.beginPath();
        ctx.strokeStyle = item.color || '#000000';
        ctx.lineWidth = Math.max(1.5, fontSize / 12);
        ctx.moveTo(left, top + 3);
        ctx.lineTo(left + textWidth, top + 3);
        ctx.stroke();
      }
    });
  }

  function renderPDFMergeList() {
    elements.pdfItemsList.innerHTML = '';
    state.pdfFiles.forEach((file, index) => {
      const row = document.createElement('div');
      row.className = 'pdf-item-row';
      row.innerHTML = `
        <div class="pdf-item-info">
          <span class="badge-item" style="font-family: var(--font-mono);">${index + 1}</span>
          <span class="file-name">${file.name}</span>
          <span class="file-meta">(${ImageCompressorEngine.formatBytes(file.size)})</span>
        </div>
        <button class="btn btn-secondary btn-sm" data-idx="${index}" title="Remove file">&times;</button>
      `;
      row.querySelector('button').addEventListener('click', () => {
        state.pdfFiles.splice(index, 1);
        renderPDFMergeList();
        if (state.pdfFiles.length === 0) resetPDFState();
      });
      elements.pdfItemsList.appendChild(row);
    });
  }

  function renderPDFImg2PdfList() {
    elements.pdfItemsList.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'pdf-page-grid';

    state.pdfFiles.forEach((file, idx) => {
      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      const url = URL.createObjectURL(file);
      card.innerHTML = `
        <div class="page-num-pill">Page ${idx + 1}</div>
        <img src="${url}" class="pdf-page-thumb" alt="Image ${idx + 1}">
        <div class="file-name" style="font-size: 0.8rem; margin-top: 0.4rem;">${file.name}</div>
        <button class="btn btn-danger btn-sm" style="margin-top: 0.4rem; width: 100%;" title="Remove">&times; Remove</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        state.pdfFiles.splice(idx, 1);
        renderPDFImg2PdfList();
        if (state.pdfFiles.length === 0) resetPDFState();
      });
      grid.appendChild(card);
    });

    elements.pdfItemsList.appendChild(grid);
  }

  function renderPDFOrganizeGrid() {
    elements.pdfItemsList.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'pdf-page-grid';

    state.pdfPages.forEach((page, idx) => {
      if (page.deleted) return;
      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      card.innerHTML = `
        <div class="page-num-pill">Page ${page.pageNumber}</div>
        <img src="${page.dataUrl}" class="pdf-page-thumb" style="transform: rotate(${page.rotation}deg); transition: transform 0.2s;" alt="Page ${page.pageNumber}">
        <div style="display: flex; gap: 0.4rem; margin-top: 0.6rem;">
          <button class="btn btn-secondary btn-sm rotate-btn" style="flex: 1;" title="Rotate 90°">🔄 90°</button>
          <button class="btn btn-danger btn-sm delete-btn" title="Delete page">🗑️</button>
        </div>
      `;

      card.querySelector('.rotate-btn').addEventListener('click', () => {
        page.rotation = (page.rotation + 90) % 360;
        card.querySelector('.pdf-page-thumb').style.transform = `rotate(${page.rotation}deg)`;
      });

      card.querySelector('.delete-btn').addEventListener('click', () => {
        page.deleted = true;
        card.style.opacity = '0.3';
        card.style.pointerEvents = 'none';
        showToast(`Page ${page.pageNumber} marked for deletion`, 'info');
      });

      grid.appendChild(card);
    });

    elements.pdfItemsList.appendChild(grid);
  }

  function renderSinglePDFInfo(file) {
    elements.pdfItemsList.innerHTML = `
      <div class="pdf-item-row">
        <div class="pdf-item-info">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="file-name" style="font-weight: 700;">${file.name}</span>
          <span class="file-meta">(${ImageCompressorEngine.formatBytes(file.size)})</span>
        </div>
      </div>
    `;
  }

  async function executePDFAction() {
    const tool = state.pdfActiveSubtool;
    elements.pdfExecuteBtn.disabled = true;
    showToast('Processing PDF in browser...', 'info');

    try {
      let resultBytes;
      let filename = 'optipixel-document.pdf';

      if (tool === 'visual-edit') {
        if (!state.currentPdfFile) return;
        bakeFloatingTextToCanvas();
        resultBytes = await PDFEditorEngine.burnVisualAnnotations(state.currentPdfFile, state.visualPageNum, elements.pdfAnnotationCanvas);
        filename = `edited-${state.currentPdfFile.name}`;
      } else if (tool === 'word2pdf') {
        if (!state.currentDocFile) return showToast('Please select a Word or Docs document to convert.', 'info');
        showToast('Converting Word document to PDF...', 'info');
        resultBytes = await PDFEditorEngine.wordToPDF(state.currentDocFile);
        filename = `${state.currentDocFile.name.replace(/\.[^/.]+$/, "")}.pdf`;
      } else if (tool === 'pdf2word') {
        if (!state.currentPdfFile) return showToast('Please select a PDF document to convert.', 'info');
        showToast('Extracting document text and formatting into Word DOCX...', 'info');
        const { docxBlob } = await PDFEditorEngine.pdfToWordDocx(state.currentPdfFile);
        filename = `${state.currentPdfFile.name.replace(/\.[^/.]+$/, "")}.docx`;
        triggerDownload(docxBlob, filename);
        showToast('Word (.DOCX) document downloaded successfully!', 'success');
        return;
      } else if (tool === 'merge') {
        if (state.pdfFiles.length < 2) return showToast('Please select at least 2 PDFs to merge.', 'info');
        resultBytes = await PDFEditorEngine.mergePDFs(state.pdfFiles);
        filename = 'merged-document.pdf';
      } else if (tool === 'img2pdf') {
        if (state.pdfFiles.length === 0) return showToast('Please add at least 1 image.', 'info');
        resultBytes = await PDFEditorEngine.imagesToPDF(state.pdfFiles);
        filename = 'images-converted.pdf';
      } else if (tool === 'split') {
        if (!state.currentPdfFile) return;
        const rangeInput = document.getElementById('pdfSplitRangeInput');
        const rangeStr = rangeInput ? rangeInput.value.trim() : '1';
        resultBytes = await PDFEditorEngine.splitPDF(state.currentPdfFile, rangeStr);
        filename = `extracted-${state.currentPdfFile.name}`;
      } else if (tool === 'organize') {
        if (!state.currentPdfFile) return;
        resultBytes = await PDFEditorEngine.exportCustomizedPDF(state.currentPdfFile, state.pdfPages);
        filename = `edited-${state.currentPdfFile.name}`;
      } else if (tool === 'watermark') {
        if (!state.currentPdfFile) return;
        const text = elements.watermarkTextInput.value.trim() || 'CONFIDENTIAL';
        resultBytes = await PDFEditorEngine.addWatermark(state.currentPdfFile, text);
        filename = `watermarked-${state.currentPdfFile.name}`;
      } else if (tool === 'protect') {
        if (!state.currentPdfFile) return;
        const passInput = document.getElementById('pdfPasswordInput');
        const password = passInput ? passInput.value.trim() : '';
        if (!password) return showToast('Please enter a password to protect your PDF.', 'info');
        resultBytes = await PDFEditorEngine.protectPDF(state.currentPdfFile, password);
        filename = `protected-${state.currentPdfFile.name}`;
      }

      if (resultBytes) {
        const blob = new Blob([resultBytes], { type: 'application/pdf' });
        triggerDownload(blob, filename);
        showToast('PDF downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error processing PDF.', 'info');
    } finally {
      elements.pdfExecuteBtn.disabled = false;
    }
  }

  function resetPDFState() {
    state.pdfFiles = [];
    state.pdfPages = [];
    state.currentPdfFile = null;
    state.visualDoc = null;
    elements.pdfItemsList.innerHTML = '';
    elements.pdfActionsContainer.style.display = 'none';
    elements.visualEditorWorkspace.style.display = 'none';
    elements.pdfTextOverlayLayer.innerHTML = '';
    state.floatingTextBoxes = [];
  }

  // =========================================================================
  // UNIVERSAL DOWNLOAD HELPER (Direct Native Browser File Download)
  // =========================================================================
  function triggerDownload(blobOrDataUrl, filename) {
    if (typeof blobOrDataUrl === 'string') {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobOrDataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 300);
      return;
    }

    if (blobOrDataUrl instanceof Blob) {
      const url = URL.createObjectURL(blobOrDataUrl);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 5000);
    }
  }

  // =========================================================================
  // IMAGE OPTIMIZER IMPLEMENTATION
  // =========================================================================
  function setupDropzone() {
    ['dragenter', 'dragover'].forEach(eventName => {
      elements.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        elements.dropzone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      elements.dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        elements.dropzone.classList.remove('drag-over');
      }, false);
    });

    elements.dropzone.addEventListener('drop', (e) => {
      handleFilesSelected(e.dataTransfer.files);
    });
  }

  async function handleFilesSelected(fileList) {
    if (!fileList || fileList.length === 0) return;
    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|bmp|svg)$/i.test(f.name));

    if (validFiles.length === 0) {
      showToast('Please upload valid image files.', 'info');
      return;
    }

    showToast(`Adding ${validFiles.length} image(s)...`, 'info');

    for (const file of validFiles) {
      const fileId = 'img_' + Math.random().toString(36).substr(2, 9);
      try {
        const rawData = await ImageCompressorEngine.loadImage(file);
        const item = { id: fileId, file, rawData, processedData: null, status: 'pending' };
        state.files.push(item);
        renderCard(item);
        processSingleItem(item);
      } catch (err) {
        console.error(err);
      }
    }

    elements.fileInput.value = '';
    updateUIState();
  }

  async function processSingleItem(item) {
    item.status = 'processing';
    updateCardStatus(item);

    try {
      const result = await ImageCompressorEngine.processImage(item.rawData.img, {
        format: state.settings.format,
        quality: state.settings.quality,
        resizeMode: state.settings.resizeMode,
        scalePercent: state.settings.scalePercent,
        maxWidth: state.settings.maxWidth,
        maxHeight: state.settings.maxHeight
      });

      item.processedData = result;
      item.status = 'done';
    } catch (err) {
      item.status = 'error';
    }

    updateCardStatus(item);
    updateGlobalStats();
  }

  async function recompressAll() {
    if (state.files.length === 0) return;
    for (const item of state.files) {
      await processSingleItem(item);
    }
  }

  function renderCard(item) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.id = `card-${item.id}`;

    card.innerHTML = `
      <button class="card-remove-btn" title="Remove image" data-id="${item.id}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div class="card-header">
        <img class="thumb-preview" src="${item.rawData.originalDataUrl}" alt="${item.rawData.name}" />
        <div class="card-details">
          <div class="file-name" title="${item.rawData.name}">${item.rawData.name}</div>
          <div class="file-meta">${item.rawData.originalWidth}x${item.rawData.originalHeight} px • ${ImageCompressorEngine.formatBytes(item.rawData.originalSize)}</div>
        </div>
      </div>

      <div class="card-status-bar" id="status-bar-${item.id}">
        <span class="size-pill">Optimizing...</span>
      </div>

      <div class="card-footer">
        <button class="btn btn-secondary btn-sm preview-btn" data-id="${item.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          Compare
        </button>
        <button class="btn btn-primary btn-sm download-single-btn" data-id="${item.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Save
        </button>
      </div>
    `;

    card.querySelector('.card-remove-btn').addEventListener('click', () => removeFileItem(item.id));
    card.querySelector('.preview-btn').addEventListener('click', () => openComparisonModal(item.id));
    card.querySelector('.download-single-btn').addEventListener('click', () => downloadSingleFile(item.id));

    elements.fileGrid.appendChild(card);
  }

  function updateCardStatus(item) {
    const statusBar = document.getElementById(`status-bar-${item.id}`);
    if (!statusBar) return;

    if (item.status === 'processing') {
      statusBar.innerHTML = `<span class="size-pill">Optimizing...</span>`;
      return;
    }

    if (item.status === 'error' || !item.processedData) {
      statusBar.innerHTML = `<span class="size-pill text-danger">Error processing</span>`;
      return;
    }

    const origSize = item.rawData.originalSize;
    const newSize = item.processedData.size;
    const diff = origSize - newSize;
    const percentSaved = Math.round((diff / origSize) * 100);

    const isSaved = diff >= 0;
    const sign = isSaved ? '-' : '+';
    const absPercent = Math.abs(percentSaved);

    statusBar.innerHTML = `
      <span class="size-pill">
        ${ImageCompressorEngine.formatBytes(newSize)} (${item.processedData.width}x${item.processedData.height})
      </span>
      <span class="savings-pill ${isSaved ? '' : 'negative'}">
        ${sign}${absPercent}%
      </span>
    `;
  }

  function updateGlobalStats() {
    const totalOrig = state.files.reduce((acc, f) => acc + (f.rawData?.originalSize || 0), 0);
    const totalComp = state.files.reduce((acc, f) => acc + (f.processedData?.size || f.rawData?.originalSize || 0), 0);
    const totalSavedBytes = Math.max(0, totalOrig - totalComp);
    const totalSavedPct = totalOrig > 0 ? Math.round((totalSavedBytes / totalOrig) * 100) : 0;

    elements.totalOrigSize.textContent = ImageCompressorEngine.formatBytes(totalOrig);
    elements.totalCompSize.textContent = ImageCompressorEngine.formatBytes(totalComp);
    elements.totalSavings.textContent = `${totalSavedPct}% (${ImageCompressorEngine.formatBytes(totalSavedBytes)})`;
    elements.totalFilesCount.textContent = `${state.files.length} Image${state.files.length === 1 ? '' : 's'}`;
  }

  function updateUIState() {
    const hasFiles = state.files.length > 0;
    elements.filesContainer.style.display = hasFiles ? 'block' : 'none';
    elements.statsBanner.style.display = hasFiles ? 'flex' : 'none';
    elements.downloadAllBtn.disabled = !hasFiles;
  }

  function removeFileItem(id) {
    state.files = state.files.filter(f => f.id !== id);
    const card = document.getElementById(`card-${id}`);
    if (card) card.remove();
    updateUIState();
    updateGlobalStats();
  }

  function clearAllFiles() {
    state.files = [];
    elements.fileGrid.innerHTML = '';
    updateUIState();
    updateGlobalStats();
    showToast('All files cleared.', 'info');
  }

  function downloadSingleFile(id) {
    const item = state.files.find(f => f.id === id);
    if (!item || !item.processedData) return;

    const ext = ImageCompressorEngine.getExtension(state.settings.format);
    const baseName = item.rawData.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}-optimized.${ext}`;

    if (item.processedData.blob) {
      triggerDownload(item.processedData.blob, filename);
    } else {
      triggerDownload(item.processedData.dataUrl, filename);
    }

    showToast(`Downloaded ${filename}`, 'success');
  }

  async function downloadAllAsZip() {
    if (state.files.length === 0) return;
    if (typeof JSZip === 'undefined') return showToast('ZIP library loading...', 'info');

    elements.downloadAllBtn.disabled = true;
    try {
      const zip = new JSZip();
      const ext = ImageCompressorEngine.getExtension(state.settings.format);

      for (const item of state.files) {
        if (!item.processedData || !item.processedData.blob) continue;
        const baseName = item.rawData.name.replace(/\.[^/.]+$/, '');
        zip.file(`${baseName}-optimized.${ext}`, item.processedData.blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, 'optipixel-optimized-images.zip');
      showToast('ZIP package downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to create ZIP package.', 'info');
    } finally {
      elements.downloadAllBtn.disabled = false;
    }
  }

  function setupComparisonSlider() {
    let isSliding = false;
    const updateSliderPos = (clientX) => {
      const rect = elements.comparisonContainer.getBoundingClientRect();
      let offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = (offsetX / rect.width) * 100;
      elements.comparisonOverlay.style.width = `${percent}%`;
      elements.comparisonHandle.style.left = `${percent}%`;
    };

    elements.comparisonContainer.addEventListener('mousedown', (e) => {
      isSliding = true;
      updateSliderPos(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
      if (isSliding) updateSliderPos(e.clientX);
    });

    window.addEventListener('mouseup', () => { isSliding = false; });

    elements.comparisonContainer.addEventListener('touchstart', (e) => {
      isSliding = true;
      if (e.touches[0]) updateSliderPos(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isSliding && e.touches[0]) updateSliderPos(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => { isSliding = false; });
  }

  function openComparisonModal(id) {
    const item = state.files.find(f => f.id === id);
    if (!item || !item.processedData) return;

    elements.comparisonOrigImg.src = item.rawData.originalDataUrl;
    elements.comparisonCompImg.src = item.processedData.dataUrl;
    elements.comparisonOrigMeta.textContent = `Original: ${ImageCompressorEngine.formatBytes(item.rawData.originalSize)} (${item.rawData.originalWidth}x${item.rawData.originalHeight})`;
    elements.comparisonCompMeta.textContent = `Optimized: ${ImageCompressorEngine.formatBytes(item.processedData.size)} (${item.processedData.width}x${item.processedData.height})`;

    elements.comparisonOverlay.style.width = '50%';
    elements.comparisonHandle.style.left = '50%';
    elements.comparisonModal.classList.add('active');
  }

  function closeComparisonModal() {
    elements.comparisonModal.classList.remove('active');
  }

  function updateResizeControlsUI() {
    const mode = state.settings.resizeMode;
    const container = elements.resizeOptionsContainer;
    if (mode === 'percentage') {
      container.innerHTML = `
        <div class="control-label">
          <span>Scale Percentage</span>
          <span class="control-value" id="scalePercentValue">${state.settings.scalePercent}%</span>
        </div>
        <input type="range" id="scalePercentSlider" min="10" max="100" step="5" value="${state.settings.scalePercent}" />
      `;
      const slider = document.getElementById('scalePercentSlider');
      const valText = document.getElementById('scalePercentValue');
      slider.addEventListener('input', (e) => {
        valText.textContent = `${e.target.value}%`;
        state.settings.scalePercent = parseInt(e.target.value, 10);
      });
      slider.addEventListener('change', () => recompressAll());
    } else if (mode === 'maxBounds') {
      container.innerHTML = `
        <div class="control-label"><span>Max Width (px)</span></div>
        <input type="number" class="custom-input" id="maxWidthInput" value="${state.settings.maxWidth}" min="200" max="8000" step="100" />
      `;
      const inp = document.getElementById('maxWidthInput');
      inp.addEventListener('change', (e) => {
        state.settings.maxWidth = parseInt(e.target.value, 10) || 1920;
        recompressAll();
      });
    } else {
      container.innerHTML = '';
    }
  }

  function setupFAQAccordion() {
    elements.faqItems.forEach(item => {
      const q = item.querySelector('.faq-question');
      q.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        elements.faqItems.forEach(other => other.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    });
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="12.01" y1="16"/>'}
      </svg>
      <span>${message}</span>
    `;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function loadSampleImages() {
    showToast('Generating demo images...', 'info');
    const demoCanvases = [
      { name: 'vibrant-sunset-wallpaper.png', w: 1920, h: 1080, theme: 'sunset' },
      { name: 'futuristic-cyber-cityscape.jpg', w: 1600, h: 900, theme: 'cyber' }
    ];

    demoCanvases.forEach(cfg => {
      const c = document.createElement('canvas');
      c.width = cfg.w;
      c.height = cfg.h;
      const ctx = c.getContext('2d');

      if (cfg.theme === 'sunset') {
        const grad = ctx.createLinearGradient(0, 0, 0, cfg.h);
        grad.addColorStop(0, '#ff416c');
        grad.addColorStop(0.5, '#ff4b2b');
        grad.addColorStop(1, '#1f1c2c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cfg.w, cfg.h);
        ctx.fillStyle = '#fffa65';
        ctx.beginPath();
        ctx.arc(cfg.w / 2, cfg.h * 0.45, 160, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const grad = ctx.createLinearGradient(0, 0, cfg.w, cfg.h);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(0.5, '#302b63');
        grad.addColorStop(1, '#24243e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cfg.w, cfg.h);
      }

      c.toBlob((blob) => {
        const file = new File([blob], cfg.name, { type: cfg.name.endsWith('.png') ? 'image/png' : 'image/jpeg' });
        handleFilesSelected([file]);
      }, cfg.name.endsWith('.png') ? 'image/png' : 'image/jpeg', 0.95);
    });
  }

  async function loadSamplePDF() {
    if (!window.PDFLib) return showToast('PDF library loading...', 'info');

    const tool = state.pdfActiveSubtool;

    if (tool === 'word2pdf') {
      showToast('Generating sample Word & Docs text file...', 'info');
      const sampleText = `OPTICORP EXECUTIVE SUMMARY & PROPOSAL
Date: ${new Date().toLocaleDateString()}
Client: Global Technologies Enterprise
Prepared by: OptiPixel Engineering Team

1. EXECUTIVE OVERVIEW
OptiPixel Studio provides next-generation 100% client-side privacy-first web utilities.
All image compression, background removal, and PDF manipulation happen locally on the user's machine without any server uploads.

2. KEY DELIVERABLES
- Universal PDF & Word Bidirectional Document Converter
- Real-time OCR Text Scanner & In-Place Text Editor
- High-Performance WebAssembly Media Matting Engine

3. CONFIDENTIALITY & TERMS
This document is confidential and proprietary. Generated securely 100% in-browser.`;

      const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
      const sampleDocFile = new File([blob], 'OptiPixel_Executive_Proposal.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      state.currentDocFile = sampleDocFile;
      renderSinglePDFInfo(sampleDocFile);
      elements.pdfActionsContainer.style.display = 'block';
      showToast('Sample Word document loaded! Click Convert to PDF.', 'success');
      return;
    }

    showToast('Generating sample invoice PDF...', 'info');

    try {
      const { PDFDocument, rgb, StandardFonts, PageSizes } = window.PDFLib;
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage(PageSizes.A4);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const { width, height } = page.getSize();

      // Header Banner
      page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: rgb(0.04, 0.06, 0.12)
      });

      page.drawText('OPTICORP INVOICE', {
        x: 50,
        y: height - 60,
        size: 24,
        font: fontBold,
        color: rgb(0.02, 0.71, 0.83)
      });

      page.drawText('Invoice #: INV-2026-0849', {
        x: 50,
        y: height - 85,
        size: 12,
        font: fontRegular,
        color: rgb(0.8, 0.85, 0.9)
      });

      page.drawText('Date: September 01, 2026', {
        x: width - 220,
        y: height - 60,
        size: 12,
        font: fontRegular,
        color: rgb(0.8, 0.85, 0.9)
      });

      page.drawText('Status: PENDING PAYMENT', {
        x: width - 220,
        y: height - 85,
        size: 12,
        font: fontBold,
        color: rgb(0.95, 0.6, 0.1)
      });

      // Billed To
      page.drawText('BILLED TO:', {
        x: 50,
        y: height - 160,
        size: 12,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2)
      });

      page.drawText('Acme Corporation Inc.\n123 Innovation Boulevard\nSilicon Valley, CA 94025\ncontact@acme-corp.com', {
        x: 50,
        y: height - 180,
        size: 11,
        font: fontRegular,
        color: rgb(0.3, 0.35, 0.4),
        lineHeight: 16
      });

      // Table Header
      page.drawRectangle({
        x: 50,
        y: height - 280,
        width: width - 100,
        height: 28,
        color: rgb(0.94, 0.96, 0.98)
      });

      page.drawText('DESCRIPTION', { x: 60, y: height - 262, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText('HOURS', { x: 300, y: height - 262, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText('RATE', { x: 380, y: height - 262, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
      page.drawText('AMOUNT', { x: 460, y: height - 262, size: 10, font: fontBold, color: rgb(0.3, 0.3, 0.3) });

      // Line Items
      page.drawText('Web Application Architecture & Design', { x: 60, y: height - 310, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      page.drawText('40', { x: 310, y: height - 310, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      page.drawText('$85.00', { x: 380, y: height - 310, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      page.drawText('$3,400.00', { x: 460, y: height - 310, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

      page.drawText('Frontend & Cloud Performance Optimization', { x: 60, y: height - 340, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      page.drawText('25', { x: 310, y: height - 340, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      page.drawText('$85.00', { x: 380, y: height - 340, size: 11, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      page.drawText('$2,125.00', { x: 460, y: height - 340, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

      // Total Line
      page.drawText('TOTAL DUE:', { x: 350, y: height - 420, size: 14, font: fontBold, color: rgb(0.04, 0.06, 0.12) });
      page.drawText('$5,525.00', { x: 450, y: height - 420, size: 16, font: fontBold, color: rgb(0.06, 0.71, 0.83) });

      // Instructions note
      page.drawText('Thank you for your business! Please remit payment within 30 days.', {
        x: 50,
        y: 120,
        size: 11,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4)
      });

      const pdfBytes = await pdfDoc.save();
      const file = new File([pdfBytes], 'sample-invoice.pdf', { type: 'application/pdf' });

      if (tool === 'pdf2word') {
        state.currentPdfFile = file;
        renderSinglePDFInfo(file);
        elements.pdfActionsContainer.style.display = 'block';
        showToast('Sample PDF loaded! Click "Convert & Download Word (.DOCX)".', 'success');
        return;
      }

      // Default: visual-edit tool
      state.pdfActiveSubtool = 'visual-edit';
      elements.pdfSubtoolBtns.forEach(b => {
        if (b.dataset.tool === 'visual-edit') b.classList.add('active');
        else b.classList.remove('active');
      });
      updatePDFSubtoolUI();

      state.currentPdfFile = file;
      await loadPDFInVisualEditor(file);
      elements.pdfActionsContainer.style.display = 'block';

      showToast('Sample Invoice PDF loaded! Click on any word to edit it.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not create demo PDF.', 'info');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
