/**
 * API Payload Compression Middleware
 * gzip/brotli ile otomatik sıkıştırma
 * 
 * Hedef: %60 payload size azalma
 */

const compression = require('compression');

class CompressionMiddleware {
  constructor(options = {}) {
    this.threshold = options.threshold || 1024; // 1KB'dan büyükler
    this.level = options.level || 6; // 0-9 arası (6 = optimal)
  }

  /**
   * Compression middleware
   */
  middleware() {
    return compression({
      // Sıkıştırma seviyesi (6 = optimal)
      level: this.level,

      // Minimum boyut (1KB)
      threshold: this.threshold,

      // Hangi response'ları sıkıştıralım
      filter: (req, res) => {
        // Zaten sıkıştırılmışsa atla
        if (req.headers['x-no-compression']) {
          return false;
        }

        // Default compression filter kullan
        return compression.filter(req, res);
      },

      // Brotli tercih et (daha iyi sıkıştırma)
      brotli: {
        enabled: true,
        zlib: {
          params: {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: 4 // 0-11 (4 = fast & good)
          }
        }
      },

      // gzip fallback
      gzip: {
        level: this.level
      }
    });
  }

  /**
   * JSON minification middleware
   * JSON yanıtlarından gereksiz boşlukları kaldır
   */
  static jsonMinify() {
    return (req, res, next) => {
      const originalJson = res.json.bind(res);

      res.json = function(data) {
        // Sadece production'da minify
        if (process.env.NODE_ENV === 'production') {
          // Boşluksuz JSON
          res.set('Content-Type', 'application/json');
          return res.send(JSON.stringify(data));
        } else {
          // Development'ta okunabilir
          return originalJson(data);
        }
      };

      next();
    };
  }

  /**
   * Response size tracking
   */
  static trackResponseSize() {
    return (req, res, next) => {
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);

      res.send = function(data) {
        const size = Buffer.byteLength(data);
        res.set('X-Response-Size', size);
        return originalSend(data);
      };

      res.json = function(data) {
        const json = JSON.stringify(data);
        const size = Buffer.byteLength(json);
        res.set('X-Response-Size', size);
        return originalSend(json);
      };

      next();
    };
  }
}

module.exports = CompressionMiddleware;
