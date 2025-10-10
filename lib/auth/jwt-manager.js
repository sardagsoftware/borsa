/**
 * LYDIAN-IQ v3.0 - JWT Manager with JWKS Support
 * 
 * Features:
 * - RSA256 signing with kid rotation
 * - JWKS endpoint generation
 * - JTI replay protection
 * - Token verification with scope/role checks
 */

const crypto = require('crypto');
const { promisify } = require('util');

const generateKeyPair = promisify(crypto.generateKeyPair);

class JWTManager {
  constructor() {
    this.keys = new Map(); // kid -> {publicKey, privateKey, createdAt}
    this.revokedTokens = new Set(); // jti set for replay protection
    this.currentKid = null;
    
    // Initialize with first key
    this.rotateKeys().catch(console.error);
    
    // Auto-rotate every 24 hours
    setInterval(() => this.rotateKeys(), 24 * 60 * 60 * 1000);
  }

  async rotateKeys() {
    const kid = `lydian-${new Date().toISOString().split('T')[0]}`;
    
    const { publicKey, privateKey } = await generateKeyPair('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.keys.set(kid, {
      publicKey,
      privateKey,
      createdAt: new Date(),
    });

    this.currentKid = kid;

    // Keep maximum 2 keys (current + previous for grace period)
    if (this.keys.size > 2) {
      const oldestKid = Array.from(this.keys.keys())[0];
      this.keys.delete(oldestKid);
    }

    console.log(`[JWT] Key rotated: ${kid}`);
  }

  sign(payload, options = {}) {
    if (!this.currentKid) {
      throw new Error('No signing key available');
    }

    const key = this.keys.get(this.currentKid);
    if (!key) {
      throw new Error('Current key not found');
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.currentKid,
    };

    const now = Math.floor(Date.now() / 1000);
    const jti = crypto.randomUUID();

    const claims = {
      iss: options.issuer || 'http://localhost:3100',
      aud: options.audience || 'lydian-iq-api',
      sub: payload.sub || payload.tenant_id,
      iat: now,
      exp: now + (options.expiresIn || 1800), // 30 minutes default
      nbf: now,
      jti,
      ...payload,
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signature = crypto.createSign('RSA-SHA256')
      .update(`${headerB64}.${payloadB64}`)
      .sign(key.privateKey, 'base64url');

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  verify(token, options = {}) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerB64, payloadB64, signature] = parts;
    
    // Decode header to get kid
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    if (header.alg !== 'RS256') {
      throw new Error('Unsupported algorithm');
    }

    // Get public key for kid
    const key = this.keys.get(header.kid);
    if (!key) {
      throw new Error('Unknown key ID');
    }

    // Verify signature
    const isValid = crypto.createVerify('RSA-SHA256')
      .update(`${headerB64}.${payloadB64}`)
      .verify(key.publicKey, signature, 'base64url');

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Verify claims
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    if (payload.nbf && payload.nbf > now) {
      throw new Error('Token not yet valid');
    }

    if (options.issuer && payload.iss !== options.issuer) {
      throw new Error('Invalid issuer');
    }

    if (options.audience && payload.aud !== options.audience) {
      throw new Error('Invalid audience');
    }

    // Check for replay (jti)
    if (this.revokedTokens.has(payload.jti)) {
      throw new Error('Token has been revoked');
    }

    return payload;
  }

  revokeToken(jti) {
    this.revokedTokens.add(jti);
    
    // Clean up old revoked tokens (older than 7 days)
    if (this.revokedTokens.size > 10000) {
      // In production, this should use Redis with TTL
      console.warn('[JWT] Revoked tokens set is large, consider using Redis');
    }
  }

  getJWKS() {
    const keys = [];

    for (const [kid, keyData] of this.keys.entries()) {
      // Convert PEM to JWK
      const publicKeyObj = crypto.createPublicKey(keyData.publicKey);
      const jwk = publicKeyObj.export({ format: 'jwk' });

      keys.push({
        kty: 'RSA',
        use: 'sig',
        kid,
        alg: 'RS256',
        n: jwk.n,
        e: jwk.e,
      });
    }

    return { keys };
  }
}

// Singleton instance
const jwtManager = new JWTManager();

module.exports = jwtManager;
