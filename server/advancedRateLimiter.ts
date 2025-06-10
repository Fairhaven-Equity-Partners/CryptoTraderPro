/**
 * Advanced Rate Limiter with Circuit Breaker for CoinMarketCap API
 * Keeps usage under 30,000 calls/month during development
 */

interface RateLimitConfig {
  monthlyLimit: number;
  dailyLimit: number;
  hourlyLimit: number;
  minuteLimit: number;
  burstLimit: number;
}

interface RateLimitCounters {
  monthly: number;
  daily: number;
  hourly: number;
  minute: number;
  burst: number;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successCount: number;
  lastFailureTime: number;
  openDuration: number;
  thresholds: {
    warning: number;
    throttle: number;
    emergency: number;
  };
}

interface RequestPermission {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  utilization?: Record<string, number>;
  adaptiveDelay?: number;
  suggestedDelay?: number;
}

export class AdvancedRateLimiter {
  private limits: RateLimitConfig;
  private counters: RateLimitCounters;
  private resetTimes: Record<string, number>;
  private circuitBreaker: CircuitBreakerState;
  private lastCall: number = 0;
  private callHistory: Array<{ id: string; timestamp: number; priority: string }> = [];
  private adaptiveDelays = {
    base: 1000,
    current: 1000,
    max: 30000,
    multiplier: 1.5
  };

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.limits = {
      monthlyLimit: config.monthlyLimit || 30000,
      dailyLimit: config.dailyLimit || 1000,
      hourlyLimit: config.hourlyLimit || 41,
      minuteLimit: config.minuteLimit || 1,
      burstLimit: config.burstLimit || 3
    };

    this.counters = {
      monthly: 0,
      daily: 0,
      hourly: 0,
      minute: 0,
      burst: 0
    };

    const now = Date.now();
    this.resetTimes = {
      monthly: now + (30 * 24 * 60 * 60 * 1000),
      daily: now + (24 * 60 * 60 * 1000),
      hourly: now + (60 * 60 * 1000),
      minute: now + (60 * 1000),
      burst: now + (10 * 1000)
    };

    this.circuitBreaker = {
      state: 'CLOSED',
      failures: 0,
      successCount: 0,
      lastFailureTime: 0,
      openDuration: 5000, // Faster recovery - 5 seconds
      thresholds: {
        warning: 0.90, // Much more lenient thresholds
        throttle: 0.95,
        emergency: 0.98 // Only at near-absolute limit
      }
    };

    console.log(`[RateLimiter] Initialized with limits: ${this.limits.dailyLimit}/day, ${this.limits.hourlyLimit}/hour`);
  }

  private checkLimits(): { allowed: boolean; utilization: Record<string, number>; nextResetIn: number; criticalLevel: number } {
    const now = Date.now();
    
    // Reset counters if time windows have passed
    Object.keys(this.resetTimes).forEach(period => {
      if (now >= this.resetTimes[period]) {
        this.counters[period as keyof RateLimitCounters] = 0;
        this.resetTimes[period] = this.getNextResetTime(period, now);
      }
    });

    // Calculate utilization
    const utilization = {
      monthly: this.counters.monthly / this.limits.monthlyLimit,
      daily: this.counters.daily / this.limits.dailyLimit,
      hourly: this.counters.hourly / this.limits.hourlyLimit,
      minute: this.counters.minute / this.limits.minuteLimit,
      burst: this.counters.burst / this.limits.burstLimit
    };

    return {
      allowed: Object.values(utilization).every(u => u < 1),
      utilization,
      nextResetIn: Math.min(...Object.values(this.resetTimes).map(t => t - now)),
      criticalLevel: Math.max(...Object.values(utilization))
    };
  }

  private getNextResetTime(period: string, now: number): number {
    switch(period) {
      case 'monthly': return now + (30 * 24 * 60 * 60 * 1000);
      case 'daily': return now + (24 * 60 * 60 * 1000);
      case 'hourly': return now + (60 * 60 * 1000);
      case 'minute': return now + (60 * 1000);
      case 'burst': return now + (10 * 1000);
      default: return now + (60 * 1000);
    }
  }

  private calculateAdaptiveDelay(utilization: number): number {
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

  private openCircuitBreaker(reason: string): void {
    this.circuitBreaker.state = 'OPEN';
    this.circuitBreaker.lastFailureTime = Date.now();
    
    // Reset failure count to prevent accumulation
    this.circuitBreaker.failures = 0;
    
    // Adjust open duration based on reason
    const duration = reason === 'emergency_threshold' ? 3000 : this.circuitBreaker.openDuration;
    
    console.log(`[RateLimiter] Circuit breaker opened: ${reason} - will retry in ${duration/1000}s`);
  }

  private incrementCounters(): void {
    Object.keys(this.counters).forEach(period => {
      this.counters[period as keyof RateLimitCounters]++;
    });
  }

  private recordCall(requestId: string, priority: string): void {
    const call = {
      id: requestId,
      timestamp: Date.now(),
      priority
    };
    
    this.callHistory.push(call);
    if (this.callHistory.length > 1000) {
      this.callHistory.shift();
    }
  }

  async requestPermission(requestId: string, priority: string = 'normal'): Promise<RequestPermission> {
    const status = this.checkLimits();
    
    // Circuit breaker check with faster recovery
    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceOpen = Date.now() - this.circuitBreaker.lastFailureTime;
      const actualDuration = this.circuitBreaker.openDuration;
      
      if (timeSinceOpen < actualDuration) {
        return {
          allowed: false,
          reason: 'circuit_breaker_open',
          retryAfter: actualDuration - timeSinceOpen
        };
      }
      
      // Auto-transition to half-open for recovery
      this.circuitBreaker.state = 'HALF_OPEN';
      this.circuitBreaker.successCount = 0;
      console.log('[RateLimiter] Circuit breaker transitioning to HALF_OPEN');
    }

    // Much more lenient emergency protection - only at true limits
    if (status.criticalLevel >= 1.0) {
      this.recordFailure('emergency_limit');
      return {
        allowed: false,
        reason: 'emergency_limit',
        retryAfter: Math.min(3000, status.nextResetIn)
      };
    }

    // Adaptive throttling only at very high utilization
    if (status.criticalLevel >= 0.98) {
      const delay = Math.min(2000, this.calculateAdaptiveDelay(status.criticalLevel));
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

    // Standard rate limit check
    if (!status.allowed) {
      this.recordFailure('rate_limit');
      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        retryAfter: status.nextResetIn,
        utilization: status.utilization
      };
    }

    // Success - allow request and record success
    this.incrementCounters();
    this.lastCall = Date.now();
    this.recordCall(requestId, priority);
    this.recordSuccess();

    return {
      allowed: true,
      utilization: status.utilization,
      adaptiveDelay: this.adaptiveDelays.current
    };
  }

  recordSuccess(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.successCount++;
      if (this.circuitBreaker.successCount >= 3) {
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failures = 0;
        console.log('[RateLimiter] Circuit breaker closed after successful requests');
      }
    }
  }

  recordFailure(reason: string): void {
    this.circuitBreaker.failures++;
    // Only open circuit breaker for genuine API failures, not rate limits
    if (reason === 'api_error' && this.circuitBreaker.failures >= 15) {
      this.openCircuitBreaker(reason);
    } else if (reason === 'rate_limit' && this.circuitBreaker.failures >= 25) {
      // More lenient for rate limit failures - these are expected
      this.openCircuitBreaker(reason);
    }
  }

  /**
   * Reset circuit breaker for recovery
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.successCount = 0;
    console.log('[RateLimiter] Circuit breaker manually reset');
  }

  getStatistics(): any {
    const now = Date.now();
    const recentCalls = this.callHistory.filter(call => now - call.timestamp < 3600000);
    
    return {
      currentCounters: { ...this.counters },
      limits: { ...this.limits },
      utilization: {
        monthly: ((this.counters.monthly / this.limits.monthlyLimit) * 100).toFixed(1) + '%',
        daily: ((this.counters.daily / this.limits.dailyLimit) * 100).toFixed(1) + '%',
        hourly: ((this.counters.hourly / this.limits.hourlyLimit) * 100).toFixed(1) + '%'
      },
      circuitBreaker: { ...this.circuitBreaker },
      adaptiveDelay: this.adaptiveDelays.current,
      recentCallsCount: recentCalls.length,
      timeToNextReset: {
        daily: Math.max(0, this.resetTimes.daily - now),
        hourly: Math.max(0, this.resetTimes.hourly - now),
        minute: Math.max(0, this.resetTimes.minute - now)
      },
      projectedMonthlyUsage: Math.round((this.counters.daily / 24) * 24 * 30)
    };
  }

  isWarningLevel(): boolean {
    const status = this.checkLimits();
    return status.criticalLevel >= this.circuitBreaker.thresholds.warning;
  }

  isThrottleLevel(): boolean {
    const status = this.checkLimits();
    return status.criticalLevel >= this.circuitBreaker.thresholds.throttle;
  }
}