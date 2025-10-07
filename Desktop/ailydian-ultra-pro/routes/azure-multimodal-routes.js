/**
 * 🏛️ Azure Multimodal Legal AI Routes
 * Real Azure SDK Integration
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const azureMultimodalAI = require('../services/azure-multimodal-legal-ai');

// Multer configuration for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * COMPUTER VISION - Image Analysis
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
router.post('/computer-vision', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Görüntü dosyası yüklenmedi',
                errorCode: 'NO_IMAGE_UPLOADED'
            });
        }

        // File validation
        if (req.file.size > 100 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'Dosya çok büyük. Maksimum 100MB yükleyebilirsiniz.',
                errorCode: 'FILE_TOO_LARGE'
            });
        }

        console.log(`📸 Analyzing image: ${req.file.originalname} (${req.file.size} bytes)`);

        const result = await azureMultimodalAI.analyzeImage(
            req.file.buffer,
            req.file.originalname
        );

        res.json(result);
    } catch (error) {
        console.error('❌ Computer Vision route error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            errorCode: 'COMPUTER_VISION_ERROR'
        });
    }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * DOCUMENT INTELLIGENCE - OCR & Document Analysis
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
router.post('/document-intelligence', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Belge dosyası yüklenmedi',
                errorCode: 'NO_DOCUMENT_UPLOADED'
            });
        }

        // File validation
        if (req.file.size > 100 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'Dosya çok büyük. Maksimum 100MB yükleyebilirsiniz.',
                errorCode: 'FILE_TOO_LARGE'
            });
        }

        console.log(`📄 Analyzing document: ${req.file.originalname} (${req.file.size} bytes)`);

        const result = await azureMultimodalAI.analyzeDocument(
            req.file.buffer,
            req.body.documentType || 'general'
        );

        res.json(result);
    } catch (error) {
        console.error('❌ Document Intelligence route error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            errorCode: 'DOCUMENT_INTELLIGENCE_ERROR'
        });
    }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VIDEO INDEXER - Video Analysis
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
router.post('/video-indexer', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Video dosyası yüklenmedi',
                errorCode: 'NO_VIDEO_UPLOADED'
            });
        }

        // File validation
        if (req.file.size > 100 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                error: 'Dosya çok büyük. Maksimum 100MB yükleyebilirsiniz.',
                errorCode: 'FILE_TOO_LARGE'
            });
        }

        console.log(`🎥 Analyzing video: ${req.file.originalname} (${req.file.size} bytes)`);

        const result = await azureMultimodalAI.analyzeVideo(
            req.file.buffer,
            req.file.originalname
        );

        res.json(result);
    } catch (error) {
        console.error('❌ Video Indexer route error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            errorCode: 'VIDEO_INDEXER_ERROR'
        });
    }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PRECEDENT SEARCH - Legal Case Database
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
router.post('/search-precedents', async (req, res) => {
    try {
        const { caseDescription } = req.body;

        if (!caseDescription) {
            return res.status(400).json({
                success: false,
                error: 'Case description is required'
            });
        }

        console.log(`⚖️ Searching precedents for case`);

        const result = await azureMultimodalAI.searchPrecedents(caseDescription);

        res.json(result);
    } catch (error) {
        console.error('❌ Precedent search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * VOICE ANALYSIS - Voice to Case File
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
router.post('/voice-analysis', async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript || transcript.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Transkript metni gereklidir',
                errorCode: 'MISSING_TRANSCRIPT'
            });
        }

        if (transcript.length > 50000) {
            return res.status(400).json({
                success: false,
                error: 'Transkript çok uzun. Maksimum 50,000 karakter',
                errorCode: 'TRANSCRIPT_TOO_LONG'
            });
        }

        console.log(`🎤 Analyzing voice transcript (${transcript.length} chars)`);

        const result = await azureMultimodalAI.analyzeVoiceTranscript(transcript);

        res.json(result);
    } catch (error) {
        console.error('❌ Voice analysis route error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            errorCode: 'VOICE_ANALYSIS_ERROR'
        });
    }
});

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SERVICE STATUS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
router.get('/status', async (req, res) => {
    try {
        const status = azureMultimodalAI.getServiceStatus();

        res.json({
            success: true,
            ...status,
            timestamp: new Date().toISOString(),
            whiteHat: 'active',
            encryption: 'enabled'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
