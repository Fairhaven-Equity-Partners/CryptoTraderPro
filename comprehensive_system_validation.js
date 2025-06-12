/**
 * Comprehensive System Validation - 35 Cycles
 * Tests complete authentic data flow with optimized rate limiting
 */

class ComprehensiveSystemValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      cycles: [],
      totalTests: 0,
      successfulTests: 0,
      errors: [],
      performance: {
        totalDuration: 0,
        avgResponseTime: 0,
        apiCallsUsed: 0,
        cacheHitRate: 0
      }
    };
    this.startTime = Date.now();
  }

  async runComprehensiveValidation() {
    console.log('🚀 Starting 35-cycle comprehensive system validation...');
    console.log('📊 Testing authentic data flow, rate limiting, and performance');
    
    try {
      // Reset circuit breaker before starting
      await this.resetCircuitBreaker();
      
      for (let cycle = 1; cycle <= 35; cycle++) {
        console.log(`\n🔄 Cycle ${cycle}/35 - Comprehensive validation`);
        await this.runSingleCycle(cycle);
        
        // Rate limiting protection
        if (cycle % 5 === 0) {
          console.log('⏱️  Rate limit protection - 3s pause');
          await this.sleep(3000);
        }
      }
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      this.results.errors.push({
        cycle: 'startup',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async runSingleCycle(cycleNumber) {
    const cycleResults = {
      cycle: cycleNumber,
      tests: [],
      duration: 0,
      timestamp: new Date().toISOString()
    };
    
    const cycleStart = Date.now();
    
    try {
      // Test 1: Rate Limiter Status
      await this.testRateLimiterStatus(cycleResults);
      
      // Test 2: Authentic Data Endpoints
      await this.testAuthenticDataEndpoints(cycleResults);
      
      // Test 3: Signal Generation
      await this.testSignalGeneration(cycleResults);
      
      // Test 4: Performance Metrics
      await this.testPerformanceMetrics(cycleResults);
      
      // Test 5: Data Integrity
      await this.testDataIntegrity(cycleResults);
      
      cycleResults.duration = Date.now() - cycleStart;
      this.results.cycles.push(cycleResults);
      
      console.log(`✅ Cycle ${cycleNumber} completed in ${cycleResults.duration}ms`);
      
    } catch (error) {
      console.error(`❌ Cycle ${cycleNumber} failed:`, error.message);
      cycleResults.error = error.message;
      this.results.errors.push({
        cycle: cycleNumber,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testRateLimiterStatus(cycleResults) {
    try {
      const response = await fetch(`${this.baseUrl}/api/rate-limiter/stats`);
      const data = await response.json();
      
      const test = {
        name: 'Rate Limiter Status',
        success: response.ok && data.rateLimiter,
        responseTime: data.responseTime || 0,
        details: {
          circuitBreakerState: data.rateLimiter?.circuitBreaker?.state,
          monthlyUsage: data.apiCalls?.projectedMonthly,
          cacheHitRate: data.performance?.cacheHitRate
        }
      };
      
      cycleResults.tests.push(test);
      this.results.totalTests++;
      if (test.success) this.results.successfulTests++;
      
      // Update performance tracking
      this.results.performance.apiCallsUsed = data.apiCalls?.total || 0;
      this.results.performance.cacheHitRate = data.performance?.cacheHitRate || 0;
      
    } catch (error) {
      cycleResults.tests.push({
        name: 'Rate Limiter Status',
        success: false,
        error: error.message
      });
      this.results.totalTests++;
    }
  }

  async testAuthenticDataEndpoints(cycleResults) {
    const endpoints = [
      '/api/authentic-data/status',
      '/api/authentic-system/status',
      '/api/timing/metrics'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const data = await response.json();
        
        const test = {
          name: `Authentic Data - ${endpoint}`,
          success: response.ok && data,
          responseTime: data.responseTime || 0,
          details: data
        };
        
        cycleResults.tests.push(test);
        this.results.totalTests++;
        if (test.success) this.results.successfulTests++;
        
      } catch (error) {
        cycleResults.tests.push({
          name: `Authentic Data - ${endpoint}`,
          success: false,
          error: error.message
        });
        this.results.totalTests++;
      }
    }
  }

  async testSignalGeneration(cycleResults) {
    try {
      const response = await fetch(`${this.baseUrl}/api/signals/BTC/USDT`);
      const data = await response.json();
      
      const test = {
        name: 'Signal Generation',
        success: response.ok && Array.isArray(data) && data.length > 0,
        responseTime: data.responseTime || 0,
        details: {
          signalCount: Array.isArray(data) ? data.length : 0,
          timeframes: Array.isArray(data) ? data.map(s => s.timeframe) : []
        }
      };
      
      cycleResults.tests.push(test);
      this.results.totalTests++;
      if (test.success) this.results.successfulTests++;
      
    } catch (error) {
      cycleResults.tests.push({
        name: 'Signal Generation',
        success: false,
        error: error.message
      });
      this.results.totalTests++;
    }
  }

  async testPerformanceMetrics(cycleResults) {
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      const data = await response.json();
      
      const test = {
        name: 'Performance Metrics',
        success: response.ok && data,
        responseTime: data.responseTime || 0,
        details: {
          hasCalculationMetrics: !!data.calculationMetrics,
          hasTimingMetrics: !!data.timingMetrics,
          hasDataPoints: !!data.dataPoints
        }
      };
      
      cycleResults.tests.push(test);
      this.results.totalTests++;
      if (test.success) this.results.successfulTests++;
      
    } catch (error) {
      cycleResults.tests.push({
        name: 'Performance Metrics',
        success: false,
        error: error.message
      });
      this.results.totalTests++;
    }
  }

  async testDataIntegrity(cycleResults) {
    try {
      const response = await fetch(`${this.baseUrl}/api/crypto/BTC/USDT`);
      const data = await response.json();
      
      const hasAuthenticData = data && 
        typeof data.lastPrice === 'number' && 
        data.lastPrice > 0 &&
        !data.isauthentic;
      
      const test = {
        name: 'Data Integrity',
        success: response.ok && hasAuthenticData,
        responseTime: data.responseTime || 0,
        details: {
          hasPrice: typeof data?.lastPrice === 'number',
          priceValue: data?.lastPrice,
          isAuthentic: !data?.isauthentic,
          dataSource: data?.source || 'unknown'
        }
      };
      
      cycleResults.tests.push(test);
      this.results.totalTests++;
      if (test.success) this.results.successfulTests++;
      
    } catch (error) {
      cycleResults.tests.push({
        name: 'Data Integrity',
        success: false,
        error: error.message
      });
      this.results.totalTests++;
    }
  }

  async resetCircuitBreaker() {
    try {
      const response = await fetch(`${this.baseUrl}/api/rate-limiter/reset`, {
        method: 'POST'
      });
      if (response.ok) {
        console.log('🔄 Circuit breaker reset successfully');
      }
    } catch (error) {
      console.warn('⚠️  Could not reset circuit breaker:', error.message);
    }
  }

  generateFinalReport() {
    const totalDuration = Date.now() - this.startTime;
    const successRate = (this.results.successfulTests / this.results.totalTests) * 100;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE VALIDATION REPORT - 35 CYCLES');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}% (${this.results.successfulTests}/${this.results.totalTests})`);
    console.log(`🔄 Cycles Completed: ${this.results.cycles.length}/35`);
    console.log(`📡 API Calls Used: ${this.results.performance.apiCallsUsed}`);
    console.log(`💾 Cache Hit Rate: ${this.results.performance.cacheHitRate.toFixed(1)}%`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.forEach(error => {
        console.log(`  Cycle ${error.cycle}: ${error.error}`);
      });
    }
    
    // Performance analysis
    const avgCycleDuration = this.results.cycles.reduce((sum, cycle) => sum + cycle.duration, 0) / this.results.cycles.length;
    console.log(`\n📈 Performance Analysis:`);
    console.log(`  Average cycle duration: ${avgCycleDuration.toFixed(0)}ms`);
    console.log(`  System stability: ${successRate >= 95 ? 'Excellent' : successRate >= 85 ? 'Good' : 'Needs improvement'}`);
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    if (successRate >= 95) {
      console.log('  ✅ System performing excellently - ready for production');
    } else if (successRate >= 85) {
      console.log('  ⚠️  Good performance - monitor for improvements');
    } else {
      console.log('  🔧 Performance needs improvement - investigate failures');
    }
    
    if (this.results.performance.cacheHitRate < 50) {
      console.log('  💾 Consider optimizing cache strategy for better performance');
    }
    
    console.log('\n✅ Comprehensive validation completed');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run validation
async function main() {
  const validator = new ComprehensiveSystemValidator();
  await validator.runComprehensiveValidation();
}

main().catch(console.error);