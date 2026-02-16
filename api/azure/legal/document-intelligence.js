/**
 * 📄 Azure Document Intelligence API - Legal Document Processing
 * POST /api/azure/legal/document-intelligence
 * Vercel Serverless Function
 */

const multiparty = require('multiparty');
const { handleCORS } = require('../../_lib/cors-simple');
const { applySanitization } = require('../../_middleware/sanitize');

module.exports = async (req, res) => {
  applySanitization(req, res);
  // Enable CORS
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Parse multipart form data
    const form = new multiparty.Form();

    const parseForm = () =>
      new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

    const { fields, files } = await parseForm();

    if (!files.file || !files.file[0]) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const documentFile = files.file[0];
    const documentType = fields.documentType ? fields.documentType[0] : 'legal';

    // TODO: When Azure Document Intelligence is configured, use real service
    // const azureDocService = require('../../../services/azure-document-intelligence-service');
    const { handleCORS } = require('../../../middleware/cors-handler');
    // const result = await azureDocService.analyzeDocument(documentFile.path, documentType);

    // For now, return mock response
    return res.status(200).json({
      success: true,
      document: {
        type: documentType,
        fileName: documentFile.originalFilename,
        fileSize: documentFile.size,
        pageCount: 3,
        language: 'tr-TR',
        extractedText: `
HUKUKİ SÖZLEŞME

Madde 1: Taraflar
Bu sözleşme aşağıdaki taraflar arasında düzenlenmiştir:
- Taraf 1: XYZ Şirketi
- Taraf 2: ABC Limited

Madde 2: Sözleşme Konusu
Taraflar arasında hizmet alım-satımı konusunda anlaşmaya varılmıştır.

Madde 3: Süre
Sözleşme süresi 12 ay olarak belirlenmiştir.

İmza ve Onay:
Tarih: 15.10.2024
        `.trim(),
        keyValuePairs: [
          { key: 'Sözleşme Türü', value: 'Hizmet Alımı', confidence: 0.92 },
          { key: 'Tarih', value: '15.10.2024', confidence: 0.95 },
          { key: 'Süre', value: '12 ay', confidence: 0.9 },
          { key: 'Taraf 1', value: 'XYZ Şirketi', confidence: 0.88 },
          { key: 'Taraf 2', value: 'ABC Limited', confidence: 0.89 },
        ],
        tables: [
          {
            rowCount: 3,
            columnCount: 2,
            cells: [
              ['Madde No', 'İçerik'],
              ['1', 'Taraflar'],
              ['2', 'Sözleşme Konusu'],
            ],
          },
        ],
        signatures: [
          {
            type: 'handwritten',
            location: 'bottom-right',
            confidence: 0.85,
          },
        ],
        stamps: [
          {
            type: 'company-stamp',
            location: 'bottom-left',
            confidence: 0.8,
          },
        ],
      },
      mockMode: true,
      note: 'Using mock data. Azure Document Intelligence integration pending.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Azure Document Intelligence API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Belge işleme hatası',
    });
  }
};
