// ============================================
// 📁 AZURE BLOB FILE STORE
// Multimodal File Storage with Azure Blob
// Metadata in Redis, files in Azure
// ============================================

const { BlobServiceClient } = require('@azure/storage-blob');
const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

// Initialize Azure Blob Storage
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'ailydian-files';

let blobServiceClient;
let containerClient;

// Initialize clients
function initializeAzureBlob() {
    if (!connectionString) {
        console.warn('⚠️ AZURE_STORAGE_CONNECTION_STRING not configured, file storage disabled');
        return false;
    }

    try {
        blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        containerClient = blobServiceClient.getContainerClient(containerName);
        console.log('✅ Azure Blob Storage initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Azure Blob:', error);
        return false;
    }
}

// Initialize Upstash Redis for metadata
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || 'https://sincere-tahr-6713.upstash.io',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARo5AAImcDIxZTRhZTdhNzVjODQ0YmU0YmNiODU0MTU5MTA2NzRkMXAyNjcxMw'
});

// ============================================
// 📤 FILE UPLOAD
// ============================================

/**
 * Upload file to Azure Blob Storage
 * @param {Buffer} fileBuffer - File content
 * @param {Object} metadata - File metadata { userId, fileName, mimeType, conversationId }
 * @returns {Object} File metadata with URL
 */
async function uploadFile(fileBuffer, metadata) {
    try {
        // Ensure Azure is initialized
        if (!initializeAzureBlob()) {
            throw new Error('Azure Blob Storage not configured');
        }

        // Create container if not exists
        await containerClient.createIfNotExists({
            access: 'blob' // Public read access
        });

        // Generate unique file ID and blob name
        const fileId = `file_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        const fileExtension = metadata.fileName.split('.').pop();
        const blobName = `${metadata.userId}/${fileId}.${fileExtension}`;

        // Upload to Azure Blob
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
            blobHTTPHeaders: {
                blobContentType: metadata.mimeType
            }
        });

        // Get blob URL
        const blobUrl = blockBlobClient.url;

        // Calculate file size and hash
        const fileSize = fileBuffer.length;
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Create file metadata
        const fileMetadata = {
            id: fileId,
            userId: metadata.userId,
            conversationId: metadata.conversationId || null,
            fileName: metadata.fileName,
            mimeType: metadata.mimeType,
            fileSize: fileSize,
            fileHash: fileHash,
            storageProvider: 'azure-blob',
            storagePath: blobName,
            url: blobUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save metadata to Redis
        await redis.setex(`file:${fileId}`, 90 * 24 * 60 * 60, JSON.stringify(fileMetadata)); // 90 days

        // Add to user's file list
        await redis.zadd(`user:${metadata.userId}:files`, {
            score: Date.now(),
            member: fileId
        });

        // If conversation specified, add to conversation's file list
        if (metadata.conversationId) {
            await redis.sadd(`conversation:${metadata.conversationId}:files`, fileId);
        }

        console.log(`✅ File uploaded: ${fileId} (${fileSize} bytes)`);

        return fileMetadata;
    } catch (error) {
        console.error('❌ Error uploading file:', error);
        throw error;
    }
}

// ============================================
// 📥 FILE RETRIEVAL
// ============================================

/**
 * Get file metadata by ID
 */
async function getFileMetadata(fileId) {
    try {
        const data = await redis.get(`file:${fileId}`);

        if (!data) {
            return null;
        }

        return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
        console.error('❌ Error getting file metadata:', error);
        return null;
    }
}

/**
 * Download file from Azure Blob
 */
async function downloadFile(fileId) {
    try {
        // Get file metadata
        const fileMetadata = await getFileMetadata(fileId);

        if (!fileMetadata) {
            throw new Error('File not found');
        }

        // Ensure Azure is initialized
        if (!initializeAzureBlob()) {
            throw new Error('Azure Blob Storage not configured');
        }

        // Download from Azure Blob
        const blockBlobClient = containerClient.getBlockBlobClient(fileMetadata.storagePath);
        const downloadResponse = await blockBlobClient.download();

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of downloadResponse.readableStreamBody) {
            chunks.push(chunk);
        }
        const fileBuffer = Buffer.concat(chunks);

        return {
            buffer: fileBuffer,
            metadata: fileMetadata
        };
    } catch (error) {
        console.error('❌ Error downloading file:', error);
        throw error;
    }
}

/**
 * List user's files (paginated)
 */
async function listUserFiles(userId, options = {}) {
    try {
        const { limit = 20, offset = 0 } = options;

        // Get file IDs (sorted by upload time, newest first)
        const fileIds = await redis.zrevrange(
            `user:${userId}:files`,
            offset,
            offset + limit - 1
        );

        if (!fileIds || fileIds.length === 0) {
            return {
                files: [],
                total: 0,
                hasMore: false
            };
        }

        // Get file metadata
        const files = await Promise.all(
            fileIds.map(id => getFileMetadata(id))
        );

        // Filter out null values (deleted files)
        const validFiles = files.filter(f => f !== null);

        // Get total count
        const total = await redis.zcard(`user:${userId}:files`);

        return {
            files: validFiles,
            total: total,
            hasMore: offset + limit < total
        };
    } catch (error) {
        console.error('❌ Error listing files:', error);
        return {
            files: [],
            total: 0,
            hasMore: false
        };
    }
}

/**
 * List conversation's files
 */
async function listConversationFiles(conversationId) {
    try {
        // Get file IDs
        const fileIds = await redis.smembers(`conversation:${conversationId}:files`);

        if (!fileIds || fileIds.length === 0) {
            return [];
        }

        // Get file metadata
        const files = await Promise.all(
            fileIds.map(id => getFileMetadata(id))
        );

        // Filter out null values and sort by createdAt
        const validFiles = files
            .filter(f => f !== null)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return validFiles;
    } catch (error) {
        console.error('❌ Error listing conversation files:', error);
        return [];
    }
}

// ============================================
// 🗑️ FILE DELETION
// ============================================

/**
 * Delete file from Azure Blob and Redis
 */
async function deleteFile(fileId, userId) {
    try {
        // Get file metadata
        const fileMetadata = await getFileMetadata(fileId);

        if (!fileMetadata) {
            return false;
        }

        // Verify ownership
        if (fileMetadata.userId !== userId) {
            throw new Error('Access denied');
        }

        // Ensure Azure is initialized
        if (initializeAzureBlob()) {
            // Delete from Azure Blob
            const blockBlobClient = containerClient.getBlockBlobClient(fileMetadata.storagePath);
            await blockBlobClient.deleteIfExists();
        }

        // Delete metadata from Redis
        await redis.del(`file:${fileId}`);

        // Remove from user's file list
        await redis.zrem(`user:${userId}:files`, fileId);

        // Remove from conversation's file list if applicable
        if (fileMetadata.conversationId) {
            await redis.srem(`conversation:${fileMetadata.conversationId}:files`, fileId);
        }

        console.log(`✅ File deleted: ${fileId}`);

        return true;
    } catch (error) {
        console.error('❌ Error deleting file:', error);
        return false;
    }
}

// ============================================
// 🔍 FILE VALIDATION
// ============================================

/**
 * Validate file upload
 */
function validateFile(fileName, fileSize, mimeType) {
    const errors = [];

    // Max file size: 50MB
    const MAX_SIZE = 50 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
        errors.push(`File too large. Max size: 50MB`);
    }

    // Allowed MIME types
    const ALLOWED_TYPES = [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Audio
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
        // Video
        'video/mp4', 'video/webm', 'video/ogg',
        // Text
        'text/plain', 'text/csv', 'text/html', 'text/markdown',
        // JSON
        'application/json'
    ];

    if (!ALLOWED_TYPES.includes(mimeType)) {
        errors.push(`File type not supported: ${mimeType}`);
    }

    // File name validation
    if (!fileName || fileName.length === 0) {
        errors.push('File name required');
    }

    if (fileName.length > 255) {
        errors.push('File name too long (max 255 characters)');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ============================================
// 📤 EXPORT
// ============================================

module.exports = {
    redis,
    uploadFile,
    downloadFile,
    getFileMetadata,
    listUserFiles,
    listConversationFiles,
    deleteFile,
    validateFile,
    initializeAzureBlob
};
