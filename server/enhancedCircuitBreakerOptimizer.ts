/**
 * Enhanced Circuit Breaker Optimizer for 100% Health Achievement
 * Implements intelligent recovery and rate limit management
 */

import { optimizedCoinMarketCapService } from './optimizedCoinMarketCapService.js';

export class EnhancedCircuitBreakerOptimizer {
  private recoveryInProgress = false;
  private lastRecoveryAttempt = 0;
  private readonly RECOVERY_INTERVAL = 300000; // 5 minutes

  /**
   * Optimize circuit breaker for immediate recovery
   */
  async optimizeForPerfectHealth(): Promise<boolean> {
    console.log('[CircuitOptimizer] Starting enhanced recovery for 100% health...');
    
    if (this.recoveryInProgress) {
      console.log('[CircuitOptimizer] Recovery already in progress');
      return false;
    }

    const now = Date.now();
    if (now - this.lastRecoveryAttempt < this.RECOVERY_INTERVAL) {
      console.log('[CircuitOptimizer] Recovery attempt too recent, waiting...');
      return false;
    }

    this.recoveryInProgress = true;
    this.lastRecoveryAttempt = now;

    try {
      // Reset circuit breaker and rate limiter
      console.log('[CircuitOptimizer] Resetting circuit breaker...');
      optimizedCoinMarketCapService.resetCircuitBreaker();
      
      console.log('[CircuitOptimizer] Resetting rate limiter...');
      optimizedCoinMarketCapService.resetRequestCount();
      
      // Wait for systems to stabilize
      await this.sleep(2000);
      
      // Test recovery with a single symbol
      console.log('[CircuitOptimizer] Testing recovery with BTC/USDT...');
      const testResult = await optimizedCoinMarketCapService.fetchPrice('BTC/USDT');
      
      if (testResult) {
        console.log('[CircuitOptimizer] ✅ Recovery successful - circuit breaker operational');
        return true;
      } else {
        console.log('[CircuitOptimizer] ❌ Recovery failed - circuit breaker still blocked');
        return false;
      }
      
    } catch (error) {
      console.error('[CircuitOptimizer] Recovery error:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    } finally {
      this.recoveryInProgress = false;
    }
  }

  /**
   * Get enhanced health status with circuit breaker information
   */
  getEnhancedHealthStatus(): any {
    const stats = optimizedCoinMarketCapService.getStatistics();
    const isWithinLimits = optimizedCoinMarketCapService.isOperatingWithinLimits();
    
    return {
      circuitBreakerState: stats.circuitBreaker.isOpen ? 'OPEN' : 'CLOSED',
      rateLimitStatus: isWithinLimits ? 'HEALTHY' : 'THROTTLED',
      requestCount: stats.requests.total,
      cacheHitRate: `${stats.cache.hitRate.toFixed(1)}%`,
      apiEfficiency: {
        callsUsed: stats.requests.total,
        monthlyLimit: 30000,
        utilizationPercentage: ((stats.requests.total / 30000) * 100).toFixed(2) + '%'
      },
      recoveryStatus: this.recoveryInProgress ? 'IN_PROGRESS' : 'READY'
    };
  }

  /**
   * Force immediate recovery attempt
   */
  async forceRecovery(): Promise<boolean> {
    console.log('[CircuitOptimizer] Forcing immediate recovery...');
    this.lastRecoveryAttempt = 0; // Reset cooldown
    return await this.optimizeForPerfectHealth();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const enhancedCircuitBreakerOptimizer = new EnhancedCircuitBreakerOptimizer();