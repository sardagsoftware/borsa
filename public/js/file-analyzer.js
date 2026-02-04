/* global window, document, fetch, FileReader, alert */
/**
 * AILYDIAN File Analyzer Client
 * Upload and analyze files (PDF, PNG, JPEG, Word)
 *
 * @version 1.0.0
 */

(function () {
  'use strict';

  const CONFIG = {
    apiEndpoint: '/api/files/analyze',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedTypes: [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'text/csv',
    ],
  };

  let fileUploadBtn = null;
  let fileInput = null;
  let uploadOverlay = null;
  let currentFile = null;

  /**
   * Initialize file analyzer
   */
  function init() {
    createFileInput();
    createUploadOverlay();
    setupEventListeners();
    console.log('[FileAnalyzer] Initialized');
  }

  /**
   * Create hidden file input
   */
  function createFileInput() {
    if (document.getElementById('fileAnalyzeInput')) return;

    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'fileAnalyzeInput';
    fileInput.accept = CONFIG.supportedTypes.join(',');
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }

  /**
   * Create upload overlay UI
   */
  function createUploadOverlay() {
    if (document.getElementById('fileUploadOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'fileUploadOverlay';
    overlay.className = 'file-upload-overlay';
    overlay.innerHTML = `
      <div class="file-upload-modal">
        <button class="file-close-btn" id="fileCloseBtn">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>

        <div class="file-upload-icon">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          </svg>
        </div>

        <h2 class="file-upload-title">Dosya Yukle ve Analiz Et</h2>
        <p class="file-upload-subtitle">PDF, PNG, JPEG, Word dosyalari desteklenir</p>

        <div class="file-drop-zone" id="fileDropZone">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
          <p>Dosyayi buraya suruklein veya tiklayin</p>
          <span class="file-size-hint">Maksimum 10MB</span>
        </div>

        <div class="file-preview" id="filePreview" style="display: none;">
          <div class="file-preview-info">
            <svg class="file-preview-icon" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            <span class="file-preview-name" id="filePreviewName"></span>
            <span class="file-preview-size" id="filePreviewSize"></span>
          </div>
          <button class="file-remove-btn" id="fileRemoveBtn">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="file-question-input">
          <input type="text" id="fileQuestion" placeholder="Soru sormak isterseniz yazin (opsiyonel)..." />
        </div>

        <button class="file-analyze-btn" id="fileAnalyzeBtn" disabled>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
          </svg>
          Analiz Et
        </button>

        <div class="file-processing" id="fileProcessing" style="display: none;">
          <div class="file-spinner"></div>
          <p>Dosya analiz ediliyor...</p>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.id = 'file-analyzer-styles';
    style.textContent = `
      .file-upload-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.95);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 100000;
        padding: 1rem;
        backdrop-filter: blur(10px);
      }
      .file-upload-overlay.active {
        display: flex;
      }
      .file-upload-modal {
        background: linear-gradient(135deg, #0a0b0d 0%, #1a1a2e 100%);
        border: 1px solid rgba(16, 163, 127, 0.3);
        border-radius: 24px;
        padding: 2rem;
        max-width: 480px;
        width: 100%;
        text-align: center;
        position: relative;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(16, 163, 127, 0.1);
      }
      .file-close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        transition: all 0.2s;
      }
      .file-close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
      .file-upload-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 1rem;
        background: linear-gradient(135deg, #10a37f 0%, #00d4aa 100%);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }
      .file-upload-icon svg {
        width: 48px;
        height: 48px;
      }
      .file-upload-title {
        color: #fff;
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
      }
      .file-upload-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
        margin: 0 0 1.5rem;
      }
      .file-drop-zone {
        border: 2px dashed rgba(16, 163, 127, 0.4);
        border-radius: 16px;
        padding: 2rem;
        cursor: pointer;
        transition: all 0.3s;
        margin-bottom: 1rem;
      }
      .file-drop-zone:hover,
      .file-drop-zone.dragover {
        border-color: #10a37f;
        background: rgba(16, 163, 127, 0.1);
      }
      .file-drop-zone svg {
        color: rgba(16, 163, 127, 0.7);
        margin-bottom: 0.5rem;
      }
      .file-drop-zone p {
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 0.25rem;
      }
      .file-size-hint {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
      }
      .file-preview {
        background: rgba(16, 163, 127, 0.1);
        border: 1px solid rgba(16, 163, 127, 0.3);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .file-preview-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        overflow: hidden;
      }
      .file-preview-icon {
        color: #10a37f;
        flex-shrink: 0;
      }
      .file-preview-name {
        color: #fff;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }
      .file-preview-size {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
        flex-shrink: 0;
      }
      .file-remove-btn {
        background: rgba(239, 68, 68, 0.2);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #ef4444;
        transition: all 0.2s;
      }
      .file-remove-btn:hover {
        background: rgba(239, 68, 68, 0.4);
      }
      .file-question-input {
        margin-bottom: 1rem;
      }
      .file-question-input input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 1rem;
        color: #fff;
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.2s;
      }
      .file-question-input input:focus {
        border-color: rgba(16, 163, 127, 0.5);
      }
      .file-question-input input::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
      .file-analyze-btn {
        width: 100%;
        background: linear-gradient(135deg, #10a37f 0%, #00d4aa 100%);
        border: none;
        border-radius: 12px;
        padding: 1rem 2rem;
        color: #fff;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.3s;
        box-shadow: 0 4px 15px rgba(16, 163, 127, 0.4);
      }
      .file-analyze-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(16, 163, 127, 0.5);
      }
      .file-analyze-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .file-processing {
        text-align: center;
        padding: 2rem 0;
      }
      .file-spinner {
        width: 48px;
        height: 48px;
        border: 3px solid rgba(16, 163, 127, 0.2);
        border-top-color: #10a37f;
        border-radius: 50%;
        animation: fileSpin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes fileSpin {
        to { transform: rotate(360deg); }
      }
      .file-processing p {
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .file-upload-modal {
          padding: 1.5rem;
          border-radius: 20px;
        }
        .file-upload-icon {
          width: 64px;
          height: 64px;
        }
        .file-upload-icon svg {
          width: 36px;
          height: 36px;
        }
        .file-upload-title {
          font-size: 1.25rem;
        }
        .file-drop-zone {
          padding: 1.5rem;
        }
        .file-preview-name {
          max-width: 120px;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);

    uploadOverlay = overlay;
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Mobile plus button - hook into existing upload button if available
    fileUploadBtn = document.getElementById('mobilePlusBtn');
    if (fileUploadBtn) {
      // Create a dedicated file upload option
      addFileUploadOption();
    }

    // File input change
    fileInput?.addEventListener('change', handleFileSelect);

    // Close button
    document.getElementById('fileCloseBtn')?.addEventListener('click', closeUploadModal);

    // Drop zone
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) {
      dropZone.addEventListener('click', () => fileInput?.click());
      dropZone.addEventListener('dragover', handleDragOver);
      dropZone.addEventListener('dragleave', handleDragLeave);
      dropZone.addEventListener('drop', handleDrop);
    }

    // Remove file button
    document.getElementById('fileRemoveBtn')?.addEventListener('click', removeFile);

    // Analyze button
    document.getElementById('fileAnalyzeBtn')?.addEventListener('click', analyzeFile);

    // Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && uploadOverlay?.classList.contains('active')) {
        closeUploadModal();
      }
    });
  }

  /**
   * Add file upload option to plus menu
   */
  function addFileUploadOption() {
    // Check if plus dropdown exists
    const plusDropdown = document.querySelector('.plus-dropdown');
    if (!plusDropdown) return;

    // Check if file option already exists
    if (plusDropdown.querySelector('[data-action="file-upload"]')) return;

    const fileOption = document.createElement('button');
    fileOption.className = 'plus-dropdown-item';
    fileOption.dataset.action = 'file-upload';
    fileOption.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
      </svg>
      <span>Dosya Yukle</span>
    `;
    fileOption.addEventListener('click', openUploadModal);

    plusDropdown.insertBefore(fileOption, plusDropdown.firstChild);
  }

  /**
   * Open upload modal
   */
  function openUploadModal() {
    if (!uploadOverlay) return;
    uploadOverlay.classList.add('active');
    resetUploadState();
  }

  /**
   * Close upload modal
   */
  function closeUploadModal() {
    uploadOverlay?.classList.remove('active');
    resetUploadState();
  }

  /**
   * Reset upload state
   */
  function resetUploadState() {
    currentFile = null;
    if (fileInput) fileInput.value = '';

    const dropZone = document.getElementById('fileDropZone');
    const preview = document.getElementById('filePreview');
    const analyzeBtn = document.getElementById('fileAnalyzeBtn');
    const processing = document.getElementById('fileProcessing');
    const questionInput = document.getElementById('fileQuestion');

    if (dropZone) dropZone.style.display = 'block';
    if (preview) preview.style.display = 'none';
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (processing) processing.style.display = 'none';
    if (questionInput) questionInput.value = '';
  }

  /**
   * Handle file select from input
   */
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  }

  /**
   * Handle drag over
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
  }

  /**
   * Handle drag leave
   */
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
  }

  /**
   * Handle file drop
   */
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  }

  /**
   * Process selected file
   */
  function processSelectedFile(file) {
    // Validate file type
    if (!CONFIG.supportedTypes.includes(file.type)) {
      showError('Desteklenmeyen dosya türü. Desteklenen: PDF, PNG, JPEG, Word, TXT');
      return;
    }

    // Validate file size
    if (file.size > CONFIG.maxFileSize) {
      showError('Dosya boyutu 10MB\'dan büyük olamaz');
      return;
    }

    currentFile = file;
    showFilePreview(file);
  }

  /**
   * Show file preview
   */
  function showFilePreview(file) {
    const dropZone = document.getElementById('fileDropZone');
    const preview = document.getElementById('filePreview');
    const nameEl = document.getElementById('filePreviewName');
    const sizeEl = document.getElementById('filePreviewSize');
    const analyzeBtn = document.getElementById('fileAnalyzeBtn');

    if (dropZone) dropZone.style.display = 'none';
    if (preview) preview.style.display = 'flex';
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatFileSize(file.size);
    if (analyzeBtn) analyzeBtn.disabled = false;
  }

  /**
   * Remove selected file
   */
  function removeFile() {
    resetUploadState();
    const dropZone = document.getElementById('fileDropZone');
    if (dropZone) dropZone.style.display = 'block';
  }

  /**
   * Analyze file
   */
  async function analyzeFile() {
    if (!currentFile) return;

    const analyzeBtn = document.getElementById('fileAnalyzeBtn');
    const processing = document.getElementById('fileProcessing');
    const preview = document.getElementById('filePreview');
    const questionInput = document.getElementById('fileQuestion');

    // Show processing state
    if (analyzeBtn) analyzeBtn.style.display = 'none';
    if (preview) preview.style.display = 'none';
    if (processing) processing.style.display = 'block';

    try {
      // Read file as base64
      const base64Data = await fileToBase64(currentFile);

      // Send to API
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64Data,
          mimeType: currentFile.type,
          fileName: currentFile.name,
          question: questionInput?.value || null,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Close modal and show result in chat
      closeUploadModal();
      showAnalysisInChat(result);
    } catch (error) {
      console.error('[FileAnalyzer] Error:', error);
      showError(error.message || 'Dosya analizi başarısız oldu');

      // Reset state
      if (analyzeBtn) analyzeBtn.style.display = 'flex';
      if (preview) preview.style.display = 'flex';
      if (processing) processing.style.display = 'none';
    }
  }

  /**
   * Convert file to base64
   */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Show analysis result in chat
   */
  function showAnalysisInChat(result) {
    // Find the chat messages container
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) {
      console.warn('[FileAnalyzer] Messages container not found');
      return;
    }

    // Create user message showing file
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `
      <div class="message-content">
        <div class="message-text">
          <strong>📎 Dosya Yüklendi:</strong> ${result.fileName}
        </div>
      </div>
    `;
    messagesContainer.appendChild(userMessage);

    // Create AI response with analysis
    const aiMessage = document.createElement('div');
    aiMessage.className = 'message ai-message';
    aiMessage.innerHTML = `
      <div class="message-avatar">
        <img src="/images/lydian-logo.png" alt="LyDian AI" />
      </div>
      <div class="message-content">
        <div class="message-text">${formatAnalysis(result.analysis)}</div>
      </div>
    `;
    messagesContainer.appendChild(aiMessage);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Hide welcome/empty state if visible
    const welcomeSection = document.querySelector('.welcome-section');
    if (welcomeSection) welcomeSection.style.display = 'none';
  }

  /**
   * Format analysis text for display
   */
  function formatAnalysis(text) {
    // Convert markdown-style formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /**
   * Format file size
   */
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Show error message
   */
  function showError(message) {
    // Use existing toast if available
    if (typeof window.showToast === 'function') {
      window.showToast(message, 'error');
    } else {
      alert(message);
    }
  }

  // Export to global
  window.FileAnalyzer = {
    init,
    open: openUploadModal,
    close: closeUploadModal,
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
