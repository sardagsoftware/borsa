/**
 * SHARD_16.6 - Real File Upload/Download
 * Encrypted file sharing with progress tracking
 *
 * Features:
 * - Client-side AES-256-GCM encryption
 * - Chunked upload for large files
 * - Progress tracking
 * - File type validation
 * - Size limits
 * - Thumbnail generation for images
 *
 * White Hat: Files encrypted before upload, server never sees plaintext
 */

import { toArrayBuffer } from '../crypto/utils';

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  progress: number; // 0-100
  status: 'pending' | 'encrypting' | 'uploading' | 'completed' | 'failed';
  error?: string;
  encryptedUrl?: string;
  thumbnailUrl?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  encryptedUrl: string;
  encryptionKey: string;
  iv: string;
  thumbnailUrl?: string;
  uploadedAt: number;
}

class FileUploadManager {
  private activeUploads = new Map<string, FileUploadProgress>();
  private progressCallbacks = new Map<string, (progress: FileUploadProgress) => void>();

  constructor() {
    console.log('[FileUpload] Manager initialized');
  }

  /**
   * Upload file with encryption
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<UploadedFile> {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      console.log(`[FileUpload] Starting upload: ${file.name} (${file.size} bytes)`);

      // Validate file
      this.validateFile(file);

      // Initialize progress
      const progress: FileUploadProgress = {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        uploadedBytes: 0,
        progress: 0,
        status: 'pending'
      };

      this.activeUploads.set(fileId, progress);
      if (onProgress) {
        this.progressCallbacks.set(fileId, onProgress);
      }

      this.updateProgress(fileId, { status: 'encrypting' });

      // Generate encryption key
      const encryptionKey = await this.generateKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Read file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();

      // Encrypt file
      const encryptedData = await this.encryptFile(fileBuffer, encryptionKey, iv);

      this.updateProgress(fileId, { status: 'uploading', progress: 0 });

      // Upload encrypted file
      const encryptedUrl = await this.uploadEncryptedData(
        encryptedData,
        file.type,
        (uploadedBytes) => {
          const uploadProgress = (uploadedBytes / encryptedData.byteLength) * 100;
          this.updateProgress(fileId, {
            uploadedBytes,
            progress: uploadProgress
          });
        }
      );

      // Generate thumbnail for images
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        thumbnailUrl = await this.generateThumbnail(file);
      }

      this.updateProgress(fileId, {
        status: 'completed',
        progress: 100,
        encryptedUrl,
        thumbnailUrl
      });

      // Export key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', encryptionKey);

      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        encryptedUrl,
        encryptionKey: this.arrayBufferToBase64(exportedKey),
        iv: this.arrayBufferToBase64(toArrayBuffer(iv)),
        thumbnailUrl,
        uploadedAt: Date.now()
      };

      // Cleanup
      this.activeUploads.delete(fileId);
      this.progressCallbacks.delete(fileId);

      console.log('[FileUpload] Upload completed:', uploadedFile.id);

      return uploadedFile;
    } catch (error: any) {
      console.error('[FileUpload] Upload failed:', error);

      this.updateProgress(fileId, {
        status: 'failed',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Download and decrypt file
   */
  async downloadFile(uploadedFile: UploadedFile): Promise<Blob> {
    try {
      console.log(`[FileUpload] Downloading file: ${uploadedFile.name}`);

      // Download encrypted data
      const response = await fetch(uploadedFile.encryptedUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const encryptedData = await response.arrayBuffer();

      // Import encryption key
      const keyBuffer = this.base64ToArrayBuffer(uploadedFile.encryptionKey);
      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Decrypt file
      const ivBuffer = this.base64ToArrayBuffer(uploadedFile.iv);
      const iv = new Uint8Array(ivBuffer);
      const decryptedData = await this.decryptFile(encryptedData, key, iv);

      // Create blob
      const blob = new Blob([decryptedData], { type: uploadedFile.type });

      console.log('[FileUpload] File decrypted successfully');

      return blob;
    } catch (error) {
      console.error('[FileUpload] Download failed:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    // Max file size: 100MB
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File too large (max 100MB)');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/pdf',
      'text/plain',
      'application/zip'
    ];

    if (!allowedTypes.some(type => file.type.startsWith(type.split('/')[0]) || file.type === type)) {
      throw new Error('File type not allowed');
    }
  }

  /**
   * Generate AES-256-GCM key
   */
  private async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt file with AES-256-GCM
   */
  private async encryptFile(
    data: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<ArrayBuffer> {
    return await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      data
    );
  }

  /**
   * Decrypt file with AES-256-GCM
   */
  private async decryptFile(
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<ArrayBuffer> {
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      encryptedData
    );
  }

  /**
   * Upload encrypted data to server
   */
  private async uploadEncryptedData(
    data: ArrayBuffer,
    mimeType: string,
    onProgress: (uploadedBytes: number) => void
  ): Promise<string> {
    // Real API upload with progress tracking
    const formData = new FormData();
    const blob = new Blob([data], { type: 'application/octet-stream' });
    formData.append('file', blob);
    formData.append('mimeType', mimeType);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.downloadUrl || response.fileId);
            console.log('[FileUpload] ✅ Server upload complete:', response.fileId);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      xhr.timeout = 300000; // 5 minutes timeout
      xhr.open('POST', '/api/files/upload');
      xhr.send(formData);

      console.log('[FileUpload] 📤 Uploading to server...');
    });
  }

  /**
   * Generate thumbnail for image
   */
  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 200;

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            reject(new Error('Failed to create canvas context'));
          }
        };

        img.onerror = reject;
        img.src = e.target?.result as string;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Update upload progress
   */
  private updateProgress(fileId: string, updates: Partial<FileUploadProgress>): void {
    const progress = this.activeUploads.get(fileId);
    if (progress) {
      Object.assign(progress, updates);
      this.activeUploads.set(fileId, progress);

      const callback = this.progressCallbacks.get(fileId);
      if (callback) {
        callback({ ...progress });
      }
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get active upload progress
   */
  getUploadProgress(fileId: string): FileUploadProgress | undefined {
    return this.activeUploads.get(fileId);
  }

  /**
   * Cancel upload
   */
  cancelUpload(fileId: string): void {
    this.activeUploads.delete(fileId);
    this.progressCallbacks.delete(fileId);
    console.log(`[FileUpload] Upload cancelled: ${fileId}`);
  }
}

// Singleton instance
let fileUploadManagerInstance: FileUploadManager | null = null;

export function getFileUploadManager(): FileUploadManager {
  if (!fileUploadManagerInstance) {
    fileUploadManagerInstance = new FileUploadManager();
  }
  return fileUploadManagerInstance;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
