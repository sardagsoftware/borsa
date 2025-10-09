/**
 * API Response Caching Middleware
 * HTTP yanıtlarını otomatik önbellekler
 * ETag, Cache-Control, If-None-Match desteği
 */

const CacheManager = require('../lib/cache/cache-manager');
const crypto = require('crypto');

class CacheMiddleware {
  constructor(options = {}) {
    this.cacheManager = options.cacheManager || new CacheManager({
      l1Enabled: true,
      l2Enabled: process.env.UPSTASH_REDIS_URL ? true : false
    });

    this.defaultTTL = options.defaultTTL || 300; // 5 dakika
    this.cacheableStatusCodes = options.cacheableStatusCodes || [200];
    this.cacheableMethods = options.cacheableMethods || ['GET', 'HEAD'];
  }

  /**
   * Önbellekleme kurallarını yapılandır
   */
  static getCacheConfig() {
    return {
      // API endpoint'lere göre önbellekleme kuralları
      '/api/models': { ttl: 3600, enabled: true }, // 1 saat
      '/api/status': { ttl: 60, enabled: true }, // 1 dakika
      '/api/health': { ttl: 30, enabled: true }, // 30 saniye
      '/api/csrf-token': { ttl: 0, enabled: false }, // Asla önbellekleme
      '/api/auth/*': { ttl: 0, enabled: false }, // Kimlik doğrulama önbelleğe alınmaz
      '/api/security/analytics': { ttl: 60, enabled: true }, // 1 dakika
      '/api/cache/stats': { ttl: 10, enabled: true }, // 10 saniye
      '/api/user/*': { ttl: 300, enabled: true }, // 5 dakika
      '/api/lydian-iq/solve': { ttl: 0, enabled: false } // AI yanıtları önbelleğe alınmaz
    };
  }

  /**
   * Önbellekleme middleware'i
   */
  middleware() {
    return async (req, res, next) => {
      // Sadece önbelleklenebilir metodlar
      if (!this.cacheableMethods.includes(req.method)) {
        return next();
      }

      const config = this.getConfigForPath(req.path);
      
      // Önbellekleme devre dışı
      if (!config.enabled) {
        return next();
      }

      const cacheKey = this.generateCacheKey(req);

      try {
        // Önbellekte kontrol et
        const cachedResponse = await this.cacheManager.get(cacheKey);

        if (cachedResponse) {
          // ETag kontrolü
          const etag = this.generateETag(cachedResponse);
          const clientETag = req.headers['if-none-match'];

          if (clientETag === etag) {
            // 304 Not Modified
            return res.status(304).end();
          }

          // Önbellekten yanıt ver
          res.set('X-Cache', 'HIT');
          res.set('ETag', etag);
          res.set('Cache-Control', `public, max-age=${config.ttl}`);
          
          return res.status(cachedResponse.statusCode)
            .set(cachedResponse.headers)
            .send(cachedResponse.body);
        }

        // Önbellekte yok, yanıtı yakala
        res.set('X-Cache', 'MISS');

        const originalSend = res.send;
        const originalJson = res.json;

        // res.send() override
        res.send = async function(body) {
          await this.cacheResponse(req, res, body, config.ttl);
          return originalSend.call(res, body);
        }.bind(this);

        // res.json() override
        res.json = async function(body) {
          await this.cacheResponse(req, res, body, config.ttl);
          return originalJson.call(res, body);
        }.bind(this);

        next();

      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  /**
   * Yanıtı önbelleğe al
   */
  async cacheResponse(req, res, body, ttl) {
    // Sadece başarılı yanıtları önbelleğe al
    if (!this.cacheableStatusCodes.includes(res.statusCode)) {
      return;
    }

    const cacheKey = this.generateCacheKey(req);
    const etag = this.generateETag(body);

    const cacheEntry = {
      statusCode: res.statusCode,
      headers: this.getFilteredHeaders(res.getHeaders()),
      body: body,
      timestamp: Date.now()
    };

    res.set('ETag', etag);
    res.set('Cache-Control', `public, max-age=${ttl}`);

    await this.cacheManager.set(cacheKey, cacheEntry, ttl);
  }

  /**
   * Önbellek anahtarı oluştur
   */
  generateCacheKey(req) {
    const url = req.originalUrl || req.url;
    const query = JSON.stringify(req.query);
    const userId = req.user?.id || 'anonymous';

    return crypto
      .createHash('md5')
      .update(`${req.method}:${url}:${query}:${userId}`)
      .digest('hex');
  }

  /**
   * ETag oluştur
   */
  generateETag(content) {
    const data = typeof content === 'string' ? content : JSON.stringify(content);
    return `"${crypto.createHash('md5').update(data).digest('hex')}"`;
  }

  /**
   * Path için önbellekleme yapılandırmasını al
   */
  getConfigForPath(path) {
    const config = CacheMiddleware.getCacheConfig();

    // Tam eşleşme
    if (config[path]) {
      return config[path];
    }

    // Wildcard eşleşmesi
    for (const [pattern, conf] of Object.entries(config)) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(path)) {
          return conf;
        }
      }
    }

    // Varsayılan: önbellekleme etkin, 5 dakika
    return { ttl: this.defaultTTL, enabled: true };
  }

  /**
   * Header'ları filtrele (hassas bilgileri kaldır)
   */
  getFilteredHeaders(headers) {
    const filtered = { ...headers };
    
    // Hassas header'ları kaldır
    delete filtered['set-cookie'];
    delete filtered['authorization'];
    delete filtered['x-csrf-token'];

    return filtered;
  }

  /**
   * Önbellek invalidation
   */
  async invalidate(pattern) {
    if (pattern === '*') {
      return await this.cacheManager.flush();
    }

    // Belirli pattern'i temizle (Redis'te desteklenir)
    if (this.cacheManager.l2) {
      return await this.cacheManager.l2.deletePattern(pattern);
    }

    return false;
  }
}

module.exports = CacheMiddleware;
