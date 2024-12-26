const Redis = require('ioredis');
const crypto = require('crypto');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.defaultTTL = 60 * 60 * 24; // 24 hours
  }

  generateKey(ingredients, dietary) {
    const sortedIngredients = [...ingredients].sort().join(',');
    const dietaryString = dietary ? JSON.stringify(dietary) : '';
    return crypto
      .createHash('md5')
      .update(`${sortedIngredients}-${dietaryString}`)
      .digest('hex');
  }

  async get(key) {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

module.exports = new CacheService();
