/**
 * Circuit Breaker Optimization & Auto-Calculation Test
 * Validates the intelligent caching system and API rate limit management
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class CircuitBreakerOptimizationTest {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    this.apiCallCount = 0;
  }

  async runOptimizationTest() {
    console.log('🚀 Starting Circuit Breaker Optimization Test...\n');
    
    try {
      await this.testCircuitBreakerRecovery();
      await this.testAutoCalculationSystem();
      await this.testIntelligentCaching();
      await this.testRateLimitOptimization();
      await this.validateSystemStability();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  async testCircuitBreakerRecovery() {
    console.log('🔧 Testing Circuit Breaker Recovery...');
    
    try {
      const response = await this.makeRequest('/api/rate-limiter/stats');
      const stats = JSON.parse(response);
      
      const circuitBreakerState = stats.rateLimiter?.circuitBreaker?.state || 'Unknown';
      const failureCount = stats.rateLimiter?.circuitBreaker?.failures || 0;
      
      console.log(`Circuit Breaker State: ${circuitBreakerState}`);
      console.log(`Failure Count: ${failureCount}`);
      
      this.testResults.push({
        test: 'circuit_breaker_recovery',
        status: circuitBreakerState === 'CLOSED' ? 'PASS' : 'FAIL',
        details: {
          state: circuitBreakerState,
          failures: failureCount
        }
      });
      
      if (circuitBreakerState === 'CLOSED') {
        console.log('✅ Circuit breaker is healthy');
      } else {
        console.log('⚠️  Circuit breaker needs attention');
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'circuit_breaker_recovery',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async testAutoCalculationSystem() {
    console.log('\n📡 Testing Auto-Calculation System...');
    
    const testTimeframes = ['1m', '5m', '15m', '1h', '4h'];
    const results = [];
    
    for (const timeframe of testTimeframes) {
      try {
        const start = Date.now();
        const response = await this.makeRequest(`/api/signals/BTC/USDT?timeframe=${timeframe}`);
        const signals = JSON.parse(response);
        const responseTime = Date.now() - start;
        
        const isValid = Array.isArray(signals) && signals.length > 0;
        const hasValidData = isValid && signals[0].confidence > 0;
        
        results.push({
          timeframe,
          responseTime,
          signalCount: isValid ? signals.length : 0,
          hasValidData,
          success: hasValidData
        });
        
        console.log(`${timeframe}: ${hasValidData ? '✅' : '❌'} ${responseTime}ms`);
        
      } catch (error) {
        results.push({
          timeframe,
          responseTime: null,
          signalCount: 0,
          hasValidData: false,
          success: false,
          error: error.message
        });
        console.log(`${timeframe}: ❌ Failed - ${error.message}`);
      }
    }
    
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    const avgResponseTime = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;
    
    console.log(`\nAuto-Calculation Results: ${successRate}% success rate, ${avgResponseTime.toFixed(0)}ms avg response time`);
    
    this.testResults.push({
      test: 'auto_calculation_system',
      status: successRate >= 80 ? 'PASS' : 'FAIL',
      details: {
        successRate,
        avgResponseTime,
        results
      }
    });
  }

  async testIntelligentCaching() {
    console.log('\n🧠 Testing Intelligent Caching System...');
    
    const testSequence = [
      { symbol: 'BTC/USDT', timeframe: '1h' },
      { symbol: 'ETH/USDT', timeframe: '1h' },
      { symbol: 'BTC/USDT', timeframe: '1h' }, // Should use cache
      { symbol: 'ETH/USDT', timeframe: '1h' }  // Should use cache
    ];
    
    const results = [];
    
    for (let i = 0; i < testSequence.length; i++) {
      const { symbol, timeframe } = testSequence[i];
      const start = Date.now();
      
      try {
        const response = await this.makeRequest(`/api/signals/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
        const responseTime = Date.now() - start;
        const signals = JSON.parse(response);
        
        results.push({
          request: i + 1,
          symbol,
          timeframe,
          responseTime,
          cached: responseTime < 10, // Likely cached if very fast
          success: Array.isArray(signals) && signals.length > 0
        });
        
        console.log(`Request ${i + 1} (${symbol} ${timeframe}): ${responseTime}ms ${responseTime < 10 ? '(cached)' : ''}`);
        
      } catch (error) {
        results.push({
          request: i + 1,
          symbol,
          timeframe,
          responseTime: Date.now() - start,
          cached: false,
          success: false,
          error: error.message
        });
      }
      
      // Small delay between requests
      await this.sleep(100);
    }
    
    const cacheHitRate = (results.filter(r => r.cached).length / results.length) * 100;
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    
    console.log(`Cache Performance: ${cacheHitRate}% hit rate, ${successRate}% success rate`);
    
    this.testResults.push({
      test: 'intelligent_caching',
      status: cacheHitRate >= 25 && successRate >= 75 ? 'PASS' : 'FAIL',
      details: {
        cacheHitRate,
        successRate,
        results
      }
    });
  }

  async testRateLimitOptimization() {
    console.log('\n⚡ Testing Rate Limit Optimization...');
    
    try {
      const response = await this.makeRequest('/api/rate-limiter/stats');
      const stats = JSON.parse(response);
      
      const rateLimiter = stats.rateLimiter;
      const utilization = {
        monthly: (rateLimiter.currentCounters?.monthly || 0) / 30000,
        daily: (rateLimiter.currentCounters?.daily || 0) / 1000,
        hourly: (rateLimiter.currentCounters?.hourly || 0) / 100,
        minute: (rateLimiter.currentCounters?.minute || 0) / 10
      };
      
      console.log('Current Utilization:');
      Object.entries(utilization).forEach(([period, rate]) => {
        const percentage = (rate * 100).toFixed(1);
        const status = rate < 0.8 ? '✅' : rate < 0.9 ? '⚠️' : '❌';
        console.log(`  ${period}: ${percentage}% ${status}`);
      });
      
      const maxUtilization = Math.max(...Object.values(utilization));
      const isOptimal = maxUtilization < 0.8; // Less than 80% utilization
      
      this.testResults.push({
        test: 'rate_limit_optimization',
        status: isOptimal ? 'PASS' : 'FAIL',
        details: {
          utilization,
          maxUtilization,
          isOptimal
        }
      });
      
      console.log(`Rate Limiting Status: ${isOptimal ? 'Optimal' : 'Needs Optimization'}`);
      
    } catch (error) {
      this.testResults.push({
        test: 'rate_limit_optimization',
        status: 'FAIL',
        error: error.message
      });
    }
  }

  async validateSystemStability() {
    console.log('\n🔍 Validating System Stability...');
    
    const stabilityTests = [
      { endpoint: '/api/crypto/BTC/USDT', name: 'Price Data' },
      { endpoint: '/api/signals/BTC/USDT', name: 'Signal Generation' },
      { endpoint: '/api/performance-metrics', name: 'Performance Metrics' }
    ];
    
    const results = [];
    
    for (const test of stabilityTests) {
      const testResults = [];
      
      // Run 5 consecutive requests
      for (let i = 0; i < 5; i++) {
        try {
          const start = Date.now();
          await this.makeRequest(test.endpoint);
          const responseTime = Date.now() - start;
          testResults.push({ success: true, responseTime });
          
        } catch (error) {
          testResults.push({ success: false, responseTime: null, error: error.message });
        }
        
        await this.sleep(50); // Small delay
      }
      
      const successRate = (testResults.filter(r => r.success).length / testResults.length) * 100;
      const avgResponseTime = testResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.responseTime, 0) / testResults.filter(r => r.success).length;
      
      results.push({
        name: test.name,
        endpoint: test.endpoint,
        successRate,
        avgResponseTime: avgResponseTime || 0,
        stable: successRate >= 80
      });
      
      console.log(`${test.name}: ${successRate}% success, ${avgResponseTime.toFixed(0)}ms avg ${successRate >= 80 ? '✅' : '❌'}`);
    }
    
    const overallStability = results.every(r => r.stable);
    
    this.testResults.push({
      test: 'system_stability',
      status: overallStability ? 'PASS' : 'FAIL',
      details: {
        results,
        overallStability
      }
    });
    
    console.log(`Overall System Stability: ${overallStability ? 'Stable' : 'Unstable'}`);
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('CIRCUIT BREAKER OPTIMIZATION TEST REPORT');
    console.log('='.repeat(80));
    
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`Test completed in ${duration}s\n`);
    
    // Test Results Summary
    const passedTests = this.testResults.filter(t => t.status === 'PASS').length;
    const totalTests = this.testResults.length;
    const overallStatus = passedTests === totalTests ? 'PASS' : 'FAIL';
    
    console.log('📊 TEST RESULTS SUMMARY:');
    console.log(`Overall Status: ${overallStatus} (${passedTests}/${totalTests} tests passed)\n`);
    
    this.testResults.forEach((test, index) => {
      const status = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${test.test.replace(/_/g, ' ').toUpperCase()}: ${status}`);
      
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
      
      if (test.details) {
        if (test.details.successRate !== undefined) {
          console.log(`   Success Rate: ${test.details.successRate.toFixed(1)}%`);
        }
        if (test.details.avgResponseTime !== undefined) {
          console.log(`   Avg Response Time: ${test.details.avgResponseTime.toFixed(0)}ms`);
        }
        if (test.details.maxUtilization !== undefined) {
          console.log(`   Max Utilization: ${(test.details.maxUtilization * 100).toFixed(1)}%`);
        }
      }
      
      console.log('');
    });
    
    // Recommendations
    console.log('🎯 OPTIMIZATION RECOMMENDATIONS:');
    
    if (overallStatus === 'PASS') {
      console.log('✅ System is operating optimally');
      console.log('✅ Auto-calculation system is stable');
      console.log('✅ Circuit breaker is functioning correctly');
      console.log('✅ Rate limiting is well-managed');
      console.log('✅ Caching system is effective');
    } else {
      console.log('⚠️  System requires attention:');
      
      this.testResults.forEach(test => {
        if (test.status === 'FAIL') {
          console.log(`   • Fix ${test.test.replace(/_/g, ' ')}`);
          if (test.error) {
            console.log(`     Error: ${test.error}`);
          }
        }
      });
    }
    
    console.log('\n🎬 AUTO-CALCULATION SYSTEM STATUS');
    if (overallStatus === 'PASS') {
      console.log('Auto-calculation system is now fully optimized and stable.');
      console.log('Ready for 35-cycle comprehensive validation.');
    } else {
      console.log('Auto-calculation system requires additional fixes.');
      console.log('Address failing tests before proceeding to validation.');
    }
  }

  async makeRequest(endpoint) {
    const url = `http://localhost:5000${endpoint}`;
    try {
      const response = await fetch(url);
      this.apiCallCount++;
      return await response.text();
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run optimization test
async function main() {
  const test = new CircuitBreakerOptimizationTest();
  await test.runOptimizationTest();
}

main().catch(console.error);