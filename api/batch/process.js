/**
 * Batch Processing API
 * POST /api/batch/process
 */

const BatchProcessor = require('../../lib/batch/batch-processor');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { operation, tableName, items, columns, whereColumn } = req.body;

    if (!operation || !tableName || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'operation, tableName ve items (array) gerekli',
      });
    }

    const processor = new BatchProcessor({
      batchSize: req.body.batchSize || 100,
      parallelBatches: req.body.parallelBatches || 3,
    });

    let result;

    switch (operation) {
      case 'insert':
        if (!columns || !Array.isArray(columns)) {
          return res.status(400).json({
            success: false,
            error: 'columns (array) gerekli',
          });
        }
        result = await processor.batchInsert(tableName, items, columns);
        break;

      case 'update':
        if (!columns || !Array.isArray(columns)) {
          return res.status(400).json({
            success: false,
            error: 'columns (array) gerekli',
          });
        }
        result = await processor.batchUpdate(tableName, items, columns, whereColumn || 'id');
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Geçersiz operation. insert, update destekleniyor.',
        });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'İşlem başarısız. Lütfen tekrar deneyin.',
    });
  }
};
