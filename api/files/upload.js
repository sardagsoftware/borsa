// ============================================
// 📤 UPLOAD FILE
// Upload multimodal files to Azure Blob Storage
// ============================================

const { getSession } = require('../../lib/auth/redis-session-store');
const { uploadFile, validateFile } = require('../../lib/storage/azure-blob-file-store');
const busboy = require('busboy');

module.exports = async (req, res) => {
    // CORS Headers
    const allowedOrigins = [
        'https://www.ailydian.com',
        'https://ailydian.com',
        'https://ailydian-ultra-pro.vercel.app',
        'http://localhost:3000',
        'http://localhost:3100'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        // Get session ID from cookie
        const cookies = req.headers.cookie || '';
        const sessionIdMatch = cookies.match(/sessionId=([^;]+)/);

        if (!sessionIdMatch) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        const sessionId = sessionIdMatch[1];

        // Get session
        const session = await getSession(sessionId);

        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Session expired'
            });
        }

        // Parse multipart form data
        const bb = busboy({ headers: req.headers });

        let fileBuffer = null;
        let fileName = null;
        let mimeType = null;
        let conversationId = null;

        bb.on('file', (fieldname, file, info) => {
            fileName = info.filename;
            mimeType = info.mimeType;

            const chunks = [];
            file.on('data', (data) => {
                chunks.push(data);
            });

            file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
            });
        });

        bb.on('field', (fieldname, value) => {
            if (fieldname === 'conversationId') {
                conversationId = value;
            }
        });

        bb.on('finish', async () => {
            try {
                if (!fileBuffer || !fileName || !mimeType) {
                    return res.status(400).json({
                        success: false,
                        error: 'No file uploaded'
                    });
                }

                // Validate file
                const validation = validateFile(fileName, fileBuffer.length, mimeType);

                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        error: 'File validation failed',
                        details: validation.errors
                    });
                }

                // Upload file
                const fileMetadata = await uploadFile(fileBuffer, {
                    userId: session.userId,
                    fileName: fileName,
                    mimeType: mimeType,
                    conversationId: conversationId
                });

                return res.status(201).json({
                    success: true,
                    file: fileMetadata
                });

            } catch (uploadError) {
                console.error('[File Upload] Upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload file'
                });
            }
        });

        req.pipe(bb);

    } catch (error) {
        console.error('[File Upload] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to process file upload'
        });
    }
};
