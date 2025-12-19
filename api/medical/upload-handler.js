/**
 * MEDICAL LYDIAN - UNIFIED FILE UPLOAD HANDLER
 * Central file upload endpoint with automatic database tracking
 *
 * Features:
 * - Automatic file metadata extraction
 * - Database tracking for all uploads
 * - User-specific file management
 * - Medical file type detection
 * - Parallel AI analysis triggering
 * - Activity feed generation
 * - Upload statistics tracking
 *
 * @version 1.0.0
 */

const formidable = require('formidable');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { fileManager } = require('./file-manager');

// File type detection
function detectFileType(filename, mimetype) {
    const ext = path.extname(filename).toLowerCase();

    // Medical file types
    if (ext === '.dcm' || ext === '.dicom' || mimetype === 'application/dicom') {
        return { type: 'dicom', isMedical: true, medicalType: 'DICOM' };
    }

    // Image types
    if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'].includes(ext)) {
        const isMedical = filename.toLowerCase().includes('xray') ||
                         filename.toLowerCase().includes('mri') ||
                         filename.toLowerCase().includes('ct') ||
                         filename.toLowerCase().includes('scan');
        return {
            type: ext.substring(1),
            isMedical,
            medicalType: isMedical ? 'Medical Image' : null
        };
    }

    // PDF types
    if (ext === '.pdf') {
        const isMedical = filename.toLowerCase().includes('lab') ||
                         filename.toLowerCase().includes('result') ||
                         filename.toLowerCase().includes('medical') ||
                         filename.toLowerCase().includes('report');
        return {
            type: 'pdf',
            isMedical,
            medicalType: isMedical ? 'Medical Record' : null
        };
    }

    return { type: ext.substring(1) || 'unknown', isMedical: false, medicalType: null };
}

// Get user ID from token (simplified - should use proper JWT verification)
function getUserIdFromToken(authHeader) {
    // TODO: Implement proper JWT token verification
    // For now, returning a mock user ID or extracting from query
    return 'default-user-id';
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    const startTime = Date.now();

    try {
        // Get user ID from auth or query
        const token = req.headers.authorization?.replace('Bearer ', '');
        let userId = getUserIdFromToken(token);

        // Allow userId from query for testing
        if (req.query.userId) {
            userId = req.query.userId;
        }

        // Parse multipart form
        const uploadDir = process.env.UPLOAD_DIR || '/tmp/medical-uploads';

        // Ensure upload directory exists
        try {
            await fs.mkdir(uploadDir, { recursive: true });
        } catch (err) {
            // Directory might already exist
        }

        const form = formidable({
            uploadDir,
            keepExtensions: true,
            maxFileSize: 100 * 1024 * 1024, // 100MB
            multiples: false,
            filename: (name, ext, part) => {
                // Generate unique filename
                return `${uuidv4()}${ext}`;
            }
        });

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });
        });

        if (!files.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

        // Extract file information
        const fileInfo = detectFileType(uploadedFile.originalFilename, uploadedFile.mimetype);
        const fileId = uuidv4();

        // Prepare file data for database
        const fileData = {
            id: fileId,
            filename: path.basename(uploadedFile.filepath),
            originalFilename: uploadedFile.originalFilename,
            filepath: uploadedFile.filepath,
            size: uploadedFile.size,
            fileType: fileInfo.type,
            mimetype: uploadedFile.mimetype,
            isMedical: fileInfo.isMedical,
            medicalType: fileInfo.medicalType,
            uploadIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            metadata: {
                userAgent: req.headers['user-agent'],
                uploadedAt: new Date().toISOString()
            }
        };

        // Save to database
        const savedFile = await fileManager.saveFileToDatabase(fileData, userId);

        const processingTime = Date.now() - startTime;

        // Return file info with ID for subsequent analysis calls
        return res.status(200).json({
            success: true,
            file: {
                id: savedFile.id,
                filename: savedFile.filename,
                originalFilename: savedFile.original_filename,
                size: savedFile.file_size,
                type: savedFile.file_type,
                isMedical: savedFile.is_medical,
                medicalType: savedFile.medical_type,
                uploadedAt: savedFile.created_at
            },
            message: 'File uploaded successfully',
            processing: {
                timeMs: processingTime,
                timestamp: new Date().toISOString()
            },
            nextSteps: {
                // Provide URLs for analysis
                deviceDetection: savedFile.is_medical ? `/api/medical/device-detection?fileId=${savedFile.id}&userId=${userId}` : null,
                aiAnalysis: `/api/medical/fireworks-analysis?fileId=${savedFile.id}&userId=${userId}`,
                ragAnalysis: `/api/medical/groq-rag?fileId=${savedFile.id}&userId=${userId}`
            }
        });

    } catch (error) {
        console.error('Upload handler error:', error);
        return res.status(500).json({
            success: false,
            error: 'File upload failed',
            details: error.message
        });
    }
}
