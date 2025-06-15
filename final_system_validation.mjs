/**
 * Final System Validation - Comprehensive Health Check
 * Tests all endpoints after Monte Carlo fix to measure actual system health
 */

class FinalSystemValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async runFinalValidation() {
    console.log('\n🎯 FINAL SYSTEM VALIDATION');
    console.log('=========================');
    console.log('Testing all systems after Monte Carlo timeframe validation fix');
    
    const monteCarloScore = await this.validateMonteCarloFix();
    const endpointHealth = await this.testAllEndpoints();
    const errorHandling = await this.testErrorHandling();
    const performanceTest = await this.testPerformance();
    
    return this.calculateFinalScore(monteCarloScore, endpointHealth, errorHandling, performanceTest);
  }

  async validateMonteCarloFix() {
    console.log('\n✅ Monte Carlo Validation');
    
    const tests = [
      { symbol: '', timeframe: '1d', expectFail: true, name: 'Empty symbol' },
      { symbol: 'BTC/USDT', timeframe: '', expectFail: true, name: 'Empty timeframe' },
      { symbol: 'BTC/USDT', timeframe: 'invalid', expectFail: true, name: 'Invalid timeframe' },
      { symbol: 'BTC/USDT', timeframe: '1d', expectFail: false, name: 'Valid request' }
    ];
    
    let passing = 0;
    
    for (const test of tests) {
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: test.symbol, timeframe: test.timeframe })
        });
        
        const data = await response.json();
        
        if (test.expectFail && response.status === 400 && data.error) {
          console.log(`   ✅ ${test.name}: Correctly rejected`);
          passing++;
        } else if (!test.expectFail && response.status === 200 && data.success) {
          console.log(`   ✅ ${test.name}: Working correctly`);
          passing++;
        } else {
          console.log(`   ❌ ${test.name}: Unexpected behavior`);
        }
        
        await this.sleep(50);
        
      } catch (error) {
        console.log(`   ❌ ${test.name}: Test failed`);
      }
    }
    
    return (passing / tests.length) * 100;
  }

  async testAllEndpoints() {
    console.log('\n🏥 Endpoint Health Check');
    
    const endpoints = [
      { name: 'Monte Carlo', url: '/api/monte-carlo-risk', method: 'POST', body: { symbol: 'BTC/USDT', timeframe: '1d' } },
      { name: 'Signals', url: '/api/signals/BTC/USDT' },
      { name: 'Performance Metrics', url: '/api/performance-metrics' },
      { name: 'Crypto Data', url: '/api/crypto/BTC/USDT' },
      { name: 'Technical Analysis', url: '/api/technical-analysis/BTC/USDT' },
      { name: 'Pattern Analysis', url: '/api/pattern-analysis/BTC/USDT' },
      { name: 'Confluence Analysis', url: '/api/confluence-analysis/BTC/USDT' }
    ];
    
    let healthy = 0;
    
    for (const endpoint of endpoints) {
      try {
        let response;
        if (endpoint.method === 'POST') {
          response = await fetch(`${this.baseUrl}${endpoint.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(endpoint.body)
          });
        } else {
          response = await fetch(`${this.baseUrl}${endpoint.url}`);
        }
        
        const contentType = response.headers.get('content-type');
        
        if (response.ok && contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`   ✅ ${endpoint.name}: Healthy (JSON)`);
          healthy++;
        } else if (response.ok) {
          console.log(`   ⚠️ ${endpoint.name}: Responds but not JSON`);
        } else {
          console.log(`   ❌ ${endpoint.name}: Failed (${response.status})`);
        }
        
        await this.sleep(50);
        
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: Error`);
      }
    }
    
    return (healthy / endpoints.length) * 100;
  }

  async testErrorHandling() {
    console.log('\n🛡️ Error Handling Test');
    
    const errorTests = [
      { name: 'Monte Carlo Empty Body', test: () => 
        fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }), expectStatus: 400 },
      { name: 'Invalid Symbol', test: () => 
        fetch(`${this.baseUrl}/api/signals/INVALID_SYMBOL`), expectStatus: 200 }, // Empty array is correct
      { name: 'Non-existent Pair', test: () => 
        fetch(`${this.baseUrl}/api/crypto/FAKE/USDT`), expectStatus: [200, 404] }
    ];
    
    let correct = 0;
    
    for (const test of errorTests) {
      try {
        const response = await test.test();
        const expectedStatuses = Array.isArray(test.expectStatus) ? test.expectStatus : [test.expectStatus];
        
        if (expectedStatuses.includes(response.status)) {
          console.log(`   ✅ ${test.name}: Correct (${response.status})`);
          correct++;
        } else {
          console.log(`   ⚠️ ${test.name}: Status ${response.status} (expected ${test.expectStatus})`);
        }
        
        await this.sleep(50);
        
      } catch (error) {
        console.log(`   ❌ ${test.name}: Test failed`);
      }
    }
    
    return (correct / errorTests.length) * 100;
  }

  async testPerformance() {
    console.log('\n⚡ Performance Test');
    
    const perfTests = [
      { name: 'Signal Generation', url: '/api/signals/BTC/USDT', maxTime: 100 },
      { name: 'Performance Metrics', url: '/api/performance-metrics', maxTime: 50 },
      { name: 'Monte Carlo', url: '/api/monte-carlo-risk', method: 'POST', 
        body: { symbol: 'BTC/USDT', timeframe: '1d' }, maxTime: 500 }
    ];
    
    let fast = 0;
    
    for (const test of perfTests) {
      try {
        const startTime = Date.now();
        
        let response;
        if (test.method === 'POST') {
          response = await fetch(`${this.baseUrl}${test.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test.body)
          });
        } else {
          response = await fetch(`${this.baseUrl}${test.url}`);
        }
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok && responseTime <= test.maxTime) {
          console.log(`   ✅ ${test.name}: ${responseTime}ms (under ${test.maxTime}ms)`);
          fast++;
        } else if (response.ok) {
          console.log(`   ⚠️ ${test.name}: ${responseTime}ms (slow)`);
        } else {
          console.log(`   ❌ ${test.name}: Failed`);
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`   ❌ ${test.name}: Test failed`);
      }
    }
    
    return (fast / perfTests.length) * 100;
  }

  calculateFinalScore(monteCarloScore, endpointHealth, errorHandling, performanceScore) {
    console.log('\n📊 FINAL SCORE CALCULATION');
    console.log('===========================');
    
    console.log(`   Monte Carlo Validation: ${monteCarloScore.toFixed(1)}%`);
    console.log(`   Endpoint Health: ${endpointHealth.toFixed(1)}%`);
    console.log(`   Error Handling: ${errorHandling.toFixed(1)}%`);
    console.log(`   Performance: ${performanceScore.toFixed(1)}%`);
    
    // Weighted final score
    const finalScore = (
      monteCarloScore * 0.25 +      // 25% - Monte Carlo reliability
      endpointHealth * 0.40 +       // 40% - Core endpoint functionality
      errorHandling * 0.20 +        // 20% - Error handling
      performanceScore * 0.15       // 15% - Performance
    );
    
    console.log(`\n🎯 FINAL SYSTEM HEALTH: ${finalScore.toFixed(1)}%`);
    
    if (finalScore >= 90) {
      console.log('\n🎉 PHASE 1 COMPLETE - SYSTEM READY FOR PHASE 2');
      console.log('✅ 90%+ system health achieved');
      console.log('🎯 Ready to proceed with UI realignment design');
      console.log('\n📋 NEXT STEPS:');
      console.log('   1. Design realigned main display UI in external shell');
      console.log('   2. Focus on visual/layout improvements');
      console.log('   3. Maintain all current functionality');
      console.log('   4. Test UI design thoroughly before implementation');
      return { ready: true, score: finalScore, phase: 'READY_FOR_PHASE_2' };
    } else if (finalScore >= 80) {
      console.log('\n🚧 PHASE 1 NEAR COMPLETE - Minor Issues Remaining');
      console.log(`⚠️ ${finalScore.toFixed(1)}% system health (need 90%+)`);
      console.log('🔧 Small fixes needed before Phase 2');
      return { ready: false, score: finalScore, phase: 'NEEDS_MINOR_FIXES' };
    } else {
      console.log('\n🔧 PHASE 1 IN PROGRESS - Significant Issues Remaining');
      console.log(`❌ ${finalScore.toFixed(1)}% system health (need 90%+)`);
      console.log('🛠️ Major fixes required before Phase 2');
      return { ready: false, score: finalScore, phase: 'NEEDS_MAJOR_FIXES' };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute final validation
async function main() {
  const validator = new FinalSystemValidator();
  const results = await validator.runFinalValidation();
  
  console.log('\n🏁 FINAL VALIDATION COMPLETE');
  console.log(`Phase 1 Ready: ${results.ready}`);
  console.log(`System Score: ${results.score.toFixed(1)}%`);
  
  process.exit(results.ready ? 0 : 1);
}

main().catch(console.error);