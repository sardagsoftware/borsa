/**
 * AI Ops Center API Client
 * Gerçek verilerle çalışan API entegrasyonu
 */

class OpsCenter API {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 dakika
  }

  /**
   * Generic fetch with caching and error handling
   */
  async fetchWithCache(endpoint, options = {}) {
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      console.log(`✓ Cache hit: ${endpoint}`);
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`✓ API success: ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`✗ API error: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Benchmark verileri
   */
  async getBenchmarks() {
    return this.fetchWithCache('/api/ops-center/benchmarks');
  }

  /**
   * Maliyet verileri
   */
  async getCosts() {
    return this.fetchWithCache('/api/ops-center/costs');
  }

  /**
   * Eğitim verileri
   */
  async getTrainer() {
    return this.fetchWithCache('/api/ops-center/trainer');
  }

  /**
   * Sahiplik verileri
   */
  async getOwnership() {
    return this.fetchWithCache('/api/ops-center/ownership');
  }

  /**
   * Uyumluluk verileri
   */
  async getCompliance() {
    return this.fetchWithCache('/api/ops-center/compliance');
  }

  /**
   * Cache temizle
   */
  clearCache() {
    this.cache.clear();
    console.log('✓ Cache cleared');
  }
}

// Global instance
window.OpsCenter API = new OpsCenter API();
