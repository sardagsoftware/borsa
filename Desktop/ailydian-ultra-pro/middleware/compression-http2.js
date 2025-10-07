/**
 * 🚀 BROTLI COMPRESSION + HTTP/2 SERVER PUSH MIDDLEWARE
 * High-performance compression and modern HTTP/2 features
 *
 * Features:
 * - Brotli compression (20-30% better than Gzip)
 * - Gzip fallback for older browsers
 * - HTTP/2 Server Push for critical assets
 * - Adaptive compression based on content type
 * - Compression caching
 * - Azure Application Insights integration
 */

const zlib = require('zlib');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const brotliCompress = promisify(zlib.brotliCompress);
const gzipCompress = promisify(zlib.gzip);

// Azure Application Insights integration
let appInsights;
try {
    appInsights = require('applicationinsights');
} catch (error) {
    console.warn('⚠️ Application Insights not installed - compression metrics will not be tracked');
}

/**
 * Track compression events
 */
function trackCompressionEvent(eventName, properties = {}) {
    if (appInsights && appInsights.defaultClient) {
        appInsights.defaultClient.trackEvent({
            name: eventName,
            properties
        });
    }
}

/**
 * Track compression metrics
 */
function trackCompressionMetric(metricName, value, properties = {}) {
    if (appInsights && appInsights.defaultClient) {
        appInsights.defaultClient.trackMetric({
            name: metricName,
            value,
            properties
        });
    }
}

/**
 * Content types that benefit from compression
 */
const COMPRESSIBLE_TYPES = [
    'text/html',
    'text/css',
    'text/javascript',
    'text/plain',
    'text/xml',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/xhtml+xml',
    'image/svg+xml',
    'font/woff',
    'font/woff2',
    'application/font-woff',
    'application/font-woff2'
];

/**
 * Minimum size threshold for compression (bytes)
 * Don't compress responses smaller than 1KB
 */
const MIN_COMPRESSION_SIZE = 1024;

/**
 * Brotli compression quality (0-11)
 * Higher = better compression, slower
 */
const BROTLI_QUALITY = {
    high: 11,      // Best compression (for static assets)
    medium: 6,     // Balanced (for dynamic content)
    low: 4         // Fast compression (for API responses)
};

/**
 * Check if content type is compressible
 */
function isCompressible(contentType) {
    if (!contentType) return false;

    return COMPRESSIBLE_TYPES.some(type =>
        contentType.toLowerCase().includes(type)
    );
}

/**
 * Determine Brotli quality based on content type
 */
function getBrotliQuality(contentType) {
    if (!contentType) return BROTLI_QUALITY.medium;

    const type = contentType.toLowerCase();

    // Static assets: High compression
    if (type.includes('javascript') || type.includes('css')) {
        return BROTLI_QUALITY.high;
    }

    // API responses: Low compression (fast)
    if (type.includes('json')) {
        return BROTLI_QUALITY.low;
    }

    // Everything else: Medium compression
    return BROTLI_QUALITY.medium;
}

/**
 * Generate ETag for content
 */
function generateETag(content) {
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return `"${hash}"`;
}

/**
 * BROTLI COMPRESSION MIDDLEWARE
 * Compress responses with Brotli (with Gzip fallback)
 */
function compressionMiddleware(options = {}) {
    const {
        threshold = MIN_COMPRESSION_SIZE,
        enableCache = true,
        cacheDir = path.join(process.cwd(), '.cache', 'compression')
    } = options;

    // Create cache directory if it doesn't exist
    if (enableCache && !fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    return function (req, res, next) {
        // Save original methods
        const originalWrite = res.write;
        const originalEnd = res.end;
        const originalWriteHead = res.writeHead;

        let chunks = [];
        let encoding = null;

        // Override writeHead to capture status code and headers
        res.writeHead = function (statusCode, headers) {
            res.statusCode = statusCode;
            if (headers) {
                Object.keys(headers).forEach(key => {
                    res.setHeader(key, headers[key]);
                });
            }
            return this;
        };

        // Override write to buffer data
        res.write = function (chunk, enc) {
            if (chunk) {
                chunks.push(Buffer.from(chunk, enc));
                encoding = enc;
            }
            return true;
        };

        // Override end to compress and send
        res.end = async function (chunk, enc) {
            if (chunk) {
                chunks.push(Buffer.from(chunk, enc));
            }

            // Combine all chunks
            const content = Buffer.concat(chunks);
            const contentLength = content.length;

            // Get content type
            const contentType = res.getHeader('Content-Type');

            // Check if compression should be applied
            const shouldCompress =
                contentLength >= threshold &&
                isCompressible(contentType) &&
                !res.getHeader('Content-Encoding') &&
                req.headers['accept-encoding'];

            if (!shouldCompress) {
                // No compression needed
                res.setHeader('Content-Length', contentLength);
                originalWriteHead.call(res, res.statusCode);
                originalEnd.call(res, content, encoding);
                return;
            }

            try {
                const acceptEncoding = req.headers['accept-encoding'];
                let compressedContent;
                let compressionType;
                let compressionRatio;

                // Generate cache key
                const cacheKey = enableCache ? generateETag(content) : null;
                const cachePath = enableCache ? path.join(cacheDir, `${cacheKey}.br`) : null;

                // Check if Brotli is supported
                if (acceptEncoding.includes('br')) {
                    // Try to load from cache
                    if (enableCache && fs.existsSync(cachePath)) {
                        compressedContent = fs.readFileSync(cachePath);
                        compressionType = 'br';
                        compressionRatio = ((1 - compressedContent.length / contentLength) * 100).toFixed(2);

                        trackCompressionEvent('CompressionCacheHit', {
                            contentType,
                            originalSize: contentLength,
                            compressedSize: compressedContent.length,
                            ratio: compressionRatio
                        });
                    } else {
                        // Compress with Brotli
                        const quality = getBrotliQuality(contentType);
                        const startTime = Date.now();

                        compressedContent = await brotliCompress(content, {
                            params: {
                                [zlib.constants.BROTLI_PARAM_QUALITY]: quality,
                                [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT
                            }
                        });

                        const compressionTime = Date.now() - startTime;
                        compressionType = 'br';
                        compressionRatio = ((1 - compressedContent.length / contentLength) * 100).toFixed(2);

                        // Save to cache
                        if (enableCache) {
                            fs.writeFileSync(cachePath, compressedContent);
                        }

                        trackCompressionEvent('BrotliCompression', {
                            contentType,
                            quality,
                            originalSize: contentLength,
                            compressedSize: compressedContent.length,
                            ratio: compressionRatio,
                            compressionTime
                        });

                        trackCompressionMetric('CompressionRatio', parseFloat(compressionRatio), {
                            type: 'brotli'
                        });
                        trackCompressionMetric('CompressionTime', compressionTime, {
                            type: 'brotli'
                        });
                    }
                } else if (acceptEncoding.includes('gzip')) {
                    // Fallback to Gzip
                    const startTime = Date.now();
                    compressedContent = await gzipCompress(content);
                    const compressionTime = Date.now() - startTime;
                    compressionType = 'gzip';
                    compressionRatio = ((1 - compressedContent.length / contentLength) * 100).toFixed(2);

                    trackCompressionEvent('GzipCompression', {
                        contentType,
                        originalSize: contentLength,
                        compressedSize: compressedContent.length,
                        ratio: compressionRatio,
                        compressionTime
                    });

                    trackCompressionMetric('CompressionRatio', parseFloat(compressionRatio), {
                        type: 'gzip'
                    });
                } else {
                    // No compression support
                    compressedContent = content;
                    compressionType = 'identity';
                }

                // Set response headers
                if (compressionType !== 'identity') {
                    res.setHeader('Content-Encoding', compressionType);
                    res.setHeader('Vary', 'Accept-Encoding');
                }

                res.setHeader('Content-Length', compressedContent.length);

                // Set ETag
                if (cacheKey) {
                    res.setHeader('ETag', cacheKey);
                }

                // Send compressed response
                originalWriteHead.call(res, res.statusCode);
                originalEnd.call(res, compressedContent);

            } catch (error) {
                console.error('❌ Compression error:', error.message);
                trackCompressionEvent('CompressionError', {
                    error: error.message,
                    contentType
                });

                // Send original content on error
                res.setHeader('Content-Length', contentLength);
                originalWriteHead.call(res, res.statusCode);
                originalEnd.call(res, content, encoding);
            }
        };

        next();
    };
}

/**
 * HTTP/2 SERVER PUSH MIDDLEWARE
 * Push critical assets to the client before they're requested
 */
function http2ServerPushMiddleware(options = {}) {
    const {
        enabled = true,
        pushAssets = []
    } = options;

    // Default critical assets to push
    const defaultPushAssets = [
        { path: '/static/css/main.css', as: 'style' },
        { path: '/static/js/app.js', as: 'script' },
        { path: '/static/fonts/inter.woff2', as: 'font', crossOrigin: 'anonymous' }
    ];

    const assets = pushAssets.length > 0 ? pushAssets : defaultPushAssets;

    return function (req, res, next) {
        if (!enabled) {
            next();
            return;
        }

        // Check if HTTP/2 is supported
        if (req.httpVersion !== '2.0' || !res.stream || !res.stream.pushStream) {
            next();
            return;
        }

        // Only push on HTML requests
        const acceptHeader = req.headers['accept'] || '';
        if (!acceptHeader.includes('text/html')) {
            next();
            return;
        }

        // Push critical assets
        assets.forEach(asset => {
            try {
                const headers = {
                    ':path': asset.path,
                    ':method': 'GET',
                    ':scheme': 'https'
                };

                res.stream.pushStream(headers, (err, pushStream) => {
                    if (err) {
                        console.error('❌ Server push error:', err.message);
                        return;
                    }

                    // Read and send the asset
                    const assetPath = path.join(process.cwd(), 'public', asset.path);

                    if (fs.existsSync(assetPath)) {
                        const content = fs.readFileSync(assetPath);

                        pushStream.respond({
                            ':status': 200,
                            'content-type': getContentType(asset.path),
                            'content-length': content.length,
                            'cache-control': 'public, max-age=31536000'
                        });

                        pushStream.end(content);

                        trackCompressionEvent('HTTP2ServerPush', {
                            path: asset.path,
                            size: content.length,
                            as: asset.as
                        });
                    }
                });

                // Add Link header for HTTP/1.1 preload fallback
                const linkHeader = `<${asset.path}>; rel=preload; as=${asset.as}${
                    asset.crossOrigin ? `; crossorigin=${asset.crossOrigin}` : ''
                }`;

                const existingLink = res.getHeader('Link');
                res.setHeader('Link', existingLink ? `${existingLink}, ${linkHeader}` : linkHeader);

            } catch (error) {
                console.error('❌ Server push error:', error.message);
            }
        });

        next();
    };
}

/**
 * Get content type based on file extension
 */
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
    };

    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Pre-compress static assets on server startup
 * This improves first request performance
 */
async function preCompressStaticAssets(publicDir = path.join(process.cwd(), 'public')) {
    console.log('🔄 Pre-compressing static assets...');

    const cacheDir = path.join(process.cwd(), '.cache', 'compression');

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const staticFiles = [
        'static/css/main.css',
        'static/js/app.js',
        'static/js/vendor.js'
    ];

    let compressedCount = 0;

    for (const file of staticFiles) {
        const filePath = path.join(publicDir, file);

        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath);
                const cacheKey = generateETag(content);
                const cachePath = path.join(cacheDir, `${cacheKey}.br`);

                if (!fs.existsSync(cachePath)) {
                    const compressed = await brotliCompress(content, {
                        params: {
                            [zlib.constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY.high
                        }
                    });

                    fs.writeFileSync(cachePath, compressed);
                    compressedCount++;

                    const ratio = ((1 - compressed.length / content.length) * 100).toFixed(2);
                    console.log(`✅ Compressed: ${file} (${ratio}% reduction)`);
                }
            } catch (error) {
                console.error(`❌ Failed to compress ${file}:`, error.message);
            }
        }
    }

    console.log(`✅ Pre-compression complete: ${compressedCount} files compressed`);
}

/**
 * Express middleware configuration
 */
function configureCompression(app) {
    // Apply Brotli/Gzip compression
    app.use(compressionMiddleware({
        threshold: 1024,
        enableCache: true
    }));

    // Apply HTTP/2 Server Push (if supported)
    app.use(http2ServerPushMiddleware({
        enabled: true,
        pushAssets: [
            { path: '/static/css/main.css', as: 'style' },
            { path: '/static/js/app.js', as: 'script' },
            { path: '/static/fonts/inter.woff2', as: 'font', crossOrigin: 'anonymous' }
        ]
    }));
}

module.exports = {
    compressionMiddleware,
    http2ServerPushMiddleware,
    preCompressStaticAssets,
    configureCompression,
    BROTLI_QUALITY,
    COMPRESSIBLE_TYPES
};
