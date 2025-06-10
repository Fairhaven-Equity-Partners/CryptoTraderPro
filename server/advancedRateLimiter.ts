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
      openDuration: 300000, // 5 minutes
      thresholds: {
        warning: 0.7,
        throttle: 0.85,
        emergency: 0.95
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
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    console.warn(`[RateLimiter] Circuit breaker opened: ${reason}`);
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
    if (this.circuitBreaker.failures >= 5) {
      this.openCircuitBreaker(reason);
    }
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