/**
 * Advanced CoinMarketCap Rate Limiter with Circuit Breaker
 * Implements intelligent throttling to stay under 30k calls/month
 */

import fs from 'fs';

class AdvancedRateLimiter {
  constructor(config = {}) {
    this.limits = {
      monthly: config.monthlyLimit || 30000,
      daily: config.dailyLimit || 1000,
      hourly: config.hourlyLimit || 41,
      minute: config.minuteLimit || 1,
      burst: config.burstLimit || 3
    };

    this.counters = {
      monthly: 0,
      daily: 0,
      hourly: 0,
      minute: 0,
      burst: 0
    };

    this.resetTimes = {
      monthly: Date.now() + (30 * 24 * 60 * 60 * 1000),
      daily: Date.now() + (24 * 60 * 60 * 1000),
      hourly: Date.now() + (60 * 60 * 1000),
      minute: Date.now() + (60 * 1000),
      burst: Date.now() + (10 * 1000) // 10 second burst window
    };

    this.circuitBreaker = {
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failures: 0,
      successCount: 0,
      lastFailureTime: 0,
      openDuration: 300000, // 5 minutes
      thresholds: {
        warning: 0.7,
        throttle: 0.85,
        emergency: 0.95
      }
    };

    this.cache = new Map();
    this.lastCall = 0;
    this.callHistory = [];
    this.adaptiveDelays = {
      base: 1000,
      current: 1000,
      max: 30000,
      multiplier: 1.5
    };
  }

  checkLimits() {
    const now = Date.now();
    
    // Reset counters if time windows have passed
    Object.keys(this.resetTimes).forEach(period => {
      if (now >= this.resetTimes[period]) {
        this.counters[period] = 0;
        this.resetTimes[period] = this.getNextResetTime(period, now);
      }
    });

    // Check each limit
    const utilization = {
      monthly: this.counters.monthly / this.limits.monthly,
      daily: this.counters.daily / this.limits.daily,
      hourly: this.counters.hourly / this.limits.hourly,
      minute: this.counters.minute / this.limits.minute,
      burst: this.counters.burst / this.limits.burst
    };

    return {
      allowed: Object.values(utilization).every(u => u < 1),
      utilization,
      nextResetIn: Math.min(...Object.values(this.resetTimes).map(t => t - now)),
      criticalLevel: Math.max(...Object.values(utilization))
    };
  }

  getNextResetTime(period, now) {
    switch(period) {
      case 'monthly': return now + (30 * 24 * 60 * 60 * 1000);
      case 'daily': return now + (24 * 60 * 60 * 1000);
      case 'hourly': return now + (60 * 60 * 1000);
      case 'minute': return now + (60 * 1000);
      case 'burst': return now + (10 * 1000);
      default: return now + (60 * 1000);
    }
  }

  async requestPermission(requestId, priority = 'normal') {
    const status = this.checkLimits();
    
    // Circuit breaker check
    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceOpen = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceOpen < this.circuitBreaker.openDuration) {
        return {
          allowed: false,
          reason: 'circuit_breaker_open',
          retryAfter: this.circuitBreaker.openDuration - timeSinceOpen
        };
      }
      this.circuitBreaker.state = 'HALF_OPEN';
    }

    // Critical threshold protection
    if (status.criticalLevel >= this.circuitBreaker.thresholds.emergency) {
      this.openCircuitBreaker('emergency_threshold');
      return {
        allowed: false,
        reason: 'emergency_limit',
        retryAfter: status.nextResetIn
      };
    }

    // Adaptive throttling based on utilization
    if (status.criticalLevel >= this.circuitBreaker.thresholds.throttle) {
      const delay = this.calculateAdaptiveDelay(status.criticalLevel);
      const timeSinceLastCall = Date.now() - this.lastCall;
      
      if (timeSinceLastCall < delay) {
        return {
          allowed: false,
          reason: 'adaptive_throttling',
          retryAfter: delay - timeSinceLastCall,
          suggestedDelay: delay
        };
      }
    }

    // Check if request is allowed
    if (!status.allowed) {
      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        retryAfter: status.nextResetIn,
        utilization: status.utilization
      };
    }

    // Allow request and increment counters
    this.incrementCounters();
    this.lastCall = Date.now();
    this.recordCall(requestId, priority);

    return {
      allowed: true,
      utilization: status.utilization,
      adaptiveDelay: this.adaptiveDelays.current
    };
  }

  incrementCounters() {
    Object.keys(this.counters).forEach(period => {
      this.counters[period]++;
    });
  }

  calculateAdaptiveDelay(utilization) {
    if (utilization < this.circuitBreaker.thresholds.warning) {
      this.adaptiveDelays.current = this.adaptiveDelays.base;
    } else {
      const multiplier = 1 + (utilization - this.circuitBreaker.thresholds.warning) * 3;
      this.adaptiveDelays.current = Math.min(
        this.adaptiveDelays.base * multiplier,
        this.adaptiveDelays.max
      );
    }
    return this.adaptiveDelays.current;
  }

  openCircuitBreaker(reason) {
    this.circuitBreaker.state = 'OPEN';
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    console.log(`🚨 Circuit breaker opened: ${reason}`);
  }

  recordCall(requestId, priority) {
    const call = {
      id: requestId,
      timestamp: Date.now(),
      priority,
      utilization: { ...this.counters }
    };
    
    this.callHistory.push(call);
    if (this.callHistory.length > 1000) {
      this.callHistory.shift();
    }
  }

  getStatistics() {
    const now = Date.now();
    const recentCalls = this.callHistory.filter(call => now - call.timestamp < 3600000); // Last hour
    
    return {
      currentCounters: { ...this.counters },
      limits: { ...this.limits },
      utilization: {
        monthly: (this.counters.monthly / this.limits.monthly * 100).toFixed(1) + '%',
        daily: (this.counters.daily / this.limits.daily * 100).toFixed(1) + '%',
        hourly: (this.counters.hourly / this.limits.hourly * 100).toFixed(1) + '%'
      },
      circuitBreaker: { ...this.circuitBreaker },
      adaptiveDelay: this.adaptiveDelays.current,
      recentCallsCount: recentCalls.length,
      timeToNextReset: {
        daily: Math.max(0, this.resetTimes.daily - now),
        hourly: Math.max(0, this.resetTimes.hourly - now),
        minute: Math.max(0, this.resetTimes.minute - now)
      }
    };
  }
}

class SmartCacheManager {
  constructor() {
    this.cache = new Map();
    this.volatilityData = new Map();
    this.tierConfig = {
      tier1: { ttl: 60000, symbols: ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'] },
      tier2: { ttl: 120000, symbols: ['USDC', 'ADA', 'AVAX', 'DOGE', 'TRX', 'TON', 'LINK', 'MATIC', 'SHIB', 'LTC'] },
      tier3: { ttl: 300000, symbols: [] } // All others
    };
  }

  getTierForSymbol(symbol) {
    if (this.tierConfig.tier1.symbols.includes(symbol)) return 'tier1';
    if (this.tierConfig.tier2.symbols.includes(symbol)) return 'tier2';
    return 'tier3';
  }

  calculateDynamicTTL(symbol, volatility = 0) {
    const tier = this.getTierForSymbol(symbol);
    const baseTTL = this.tierConfig[tier].ttl;
    
    // Reduce TTL for high volatility
    const volatilityMultiplier = Math.max(0.3, 1 - (volatility * 2));
    const dynamicTTL = baseTTL * volatilityMultiplier;
    
    return Math.max(30000, Math.min(600000, dynamicTTL)); // 30s min, 10m max
  }

  set(symbol, data, volatility = 0) {
    const ttl = this.calculateDynamicTTL(symbol, volatility);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      volatility,
      tier: this.getTierForSymbol(symbol)
    };
    
    this.cache.set(symbol, cacheEntry);
    return cacheEntry;
  }

  get(symbol) {
    const entry = this.cache.get(symbol);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(symbol);
      return null;
    }
    
    return entry.data;
  }

  getStats() {
    const stats = {
      totalEntries: this.cache.size,
      byTier: { tier1: 0, tier2: 0, tier3: 0 },
      avgAge: 0,
      hitRate: 0
    };

    let totalAge = 0;
    for (const [symbol, entry] of this.cache.entries()) {
      stats.byTier[entry.tier]++;
      totalAge += Date.now() - entry.timestamp;
    }

    stats.avgAge = this.cache.size > 0 ? totalAge / this.cache.size : 0;
    return stats;
  }
}

// Export for testing
export { AdvancedRateLimiter, SmartCacheManager };