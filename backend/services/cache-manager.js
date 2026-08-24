// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const crypto = require('crypto');

class CacheManager {
  constructor() {
    this.caches = {
      chat:     { store: new Map(), ttl: 5  * 60 * 1000, maxSize: 500 },
      image:    { store: new Map(), ttl: 30 * 60 * 1000, maxSize: 200 },
      search:   { store: new Map(), ttl: 10 * 60 * 1000, maxSize: 300 },
      document: { store: new Map(), ttl: 15 * 60 * 1000, maxSize: 100 },
      student:  { store: new Map(), ttl: 20 * 60 * 1000, maxSize: 150 },
    };
    this.stats = { hits: 0, misses: 0, tokensSaved: 0 };
    // Auto-clean every 5 minutes
    setInterval(() => this.clearExpired(), 5 * 60 * 1000);
  }

  generateKey(feature, input) {
    const normalized = JSON.stringify(input).toLowerCase().trim();
    return crypto.createHash('md5').update(`${feature}::${normalized}`).digest('hex');
  }

  get(feature, input) {
    const key = this.generateKey(feature, input);
    const cache = this.caches[feature];
    if (!cache) return null;
    const entry = cache.store.get(key);
    if (!entry) { this.stats.misses++; return null; }
    if (Date.now() - entry.timestamp > cache.ttl) {
      cache.store.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    this.stats.tokensSaved += entry.tokenCount || 0;
    console.log(`⚡ CACHE HIT [${feature}]`);
    return { ...entry.data, fromCache: true };
  }

  set(feature, input, data, tokenCount = 0) {
    const key = this.generateKey(feature, input);
    const cache = this.caches[feature];
    if (!cache) return;
    if (cache.store.size >= cache.maxSize) {
      const oldestKey = cache.store.keys().next().value;
      cache.store.delete(oldestKey);
    }
    cache.store.set(key, { data, timestamp: Date.now(), tokenCount });
    console.log(`💾 CACHE SET [${feature}]`);
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00';
    return { ...this.stats, hitRate: hitRate + '%', total };
  }

  clearExpired() {
    for (const [feature, cache] of Object.entries(this.caches)) {
      let cleared = 0;
      for (const [key, entry] of cache.store.entries()) {
        if (Date.now() - entry.timestamp > cache.ttl) {
          cache.store.delete(key);
          cleared++;
        }
      }
      if (cleared > 0) console.log(`🧹 Cleared ${cleared} expired [${feature}] cache entries`);
    }
  }
}

module.exports = new CacheManager();
