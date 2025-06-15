/**
 * Post-Fix Validation - Testing Monte Carlo Enhancement
 * Validates the timeframe validation fix and measures overall improvement
 */

class PostFixValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async validateMonteCarleFix() {
    console.log('\n🎯 VALIDATING MONTE CARLO TIMEFRAME FIX');
    console.log('=====================================');
    
    const validationTests = [
      { symbol: '', timeframe: '1d', shouldFail: true, reason: 'Empty symbol' },
      { symbol: 'BTC/USDT', timeframe: '', shouldFail: true, reason: 'Empty timeframe' },
      { symbol: null, timeframe: '1d', shouldFail: true, reason: 'Null symbol' },
      { symbol: 'BTC/USDT', timeframe: null, shouldFail: true, reason: 'Null timeframe' },
      { symbol: 'BTC/USDT', timeframe: 'invalid', shouldFail: true, reason: 'Invalid timeframe' },
      { symbol: 'BTC/USDT', timeframe: '1d', shouldFail: false, reason: 'Valid request' }
    ];
    
    let correctBehaviors = 0;
    
    for (const test of validationTests) {
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: test.symbol,
            timeframe: test.timeframe
          })
        });
        
        const data = await response.json();
        
        if (test.shouldFail) {
          if (response.status === 400 && data.error) {
            console.log(`✅ ${test.reason}: Correctly rejected (${data.error})`);
            correctBehaviors++;
          } else {
            console.log(`❌ ${test.reason}: Should be rejected but got ${response.status}`);
          }
        } else {
          if (response.status === 200 && data.success) {
            console.log(`✅ ${test.reason}: Working correctly`);
            correctBehaviors++;
          } else {
            console.log(`❌ ${test.reason}: Should work but got ${response.status}`);
          }
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`❌ ${test.reason}: Test failed - ${error.message}`);
      }
    }
    
    const validationScore = (correctBehaviors / validationTests.length) * 100;
    console.log(`\n🎯 Monte Carlo Validation: ${validationScore}% (${correctBehaviors}/${validationTests.length})`);
    
    return validationScore;
  }

  async runComprehensiveHealthCheck() {
    console.log('\n🏥 COMPREHENSIVE SYSTEM HEALTH CHECK');
    console.log('===================================');
    
    const healthTests = [
      { name: 'Core Monte Carlo', endpoint: '/api/monte-carlo-risk', method: 'POST', body: { symbol: 'BTC/USDT', timeframe: '1d' } },
      { name: 'Signal Generation', endpoint: '/api/signals/BTC/USDT' },
      { name: 'Performance Metrics', endpoint: '/api/performance-metrics' },
      { name: 'Crypto Data', endpoint: '/api/crypto/BTC/USDT' },
      { name: 'Technical Analysis', endpoint: '/api/technical-analysis/BTC/USDT' },
      { name: 'Pattern Analysis', endpoint: '/api/pattern-analysis/BTC/USDT' },
      { name: 'Confluence Analysis', endpoint: '/api/confluence-analysis/BTC/USDT' }
    ];
    
    let healthyEndpoints = 0;
    const endpointResults = [];
    
    for (const test of healthTests) {
      try {
        const startTime = Date.now();
        
        let response;
        if (test.method === 'POST') {
          response = await fetch(`${this.baseUrl}${test.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test.body)
          });
        } else {
          response = await fetch(`${this.baseUrl}${test.endpoint}`);
        }
        
        const responseTime = Date.now() - startTime;
        const contentType = response.headers.get('content-type');
        
        if (response.ok && contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`✅ ${test.name}: Healthy (${responseTime}ms, JSON)`);
          healthyEndpoints++;
          endpointResults.push({ name: test.name, status: 'healthy', responseTime, contentType: 'json' });
        } else if (response.ok) {
          console.log(`⚠️ ${test.name}: Responds but not JSON (${responseTime}ms, ${contentType})`);
          endpointResults.push({ name: test.name, status: 'partial', responseTime, contentType });
        } else {
          console.log(`❌ ${test.name}: Failed (${response.status}, ${responseTime}ms)`);
          endpointResults.push({ name: test.name, status: 'failed', responseTime, statusCode: response.status });
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`❌ ${test.name}: Error - ${error.message}`);
        endpointResults.push({ name: test.name, status: 'error', error: error.message });
      }
    }
    
    const overallHealth = (healthyEndpoints / healthTests.length) * 100;
    console.log(`\n🎯 Overall System Health: ${overallHealth}% (${healthyEndpoints}/${healthTests.length})`);
    
    return { overallHealth, healthyEndpoints, totalTests: healthTests.length, endpointResults };
  }

  async testErrorHandling() {
    console.log('\n🚨 ERROR HANDLING ASSESSMENT');
    console.log('============================');
    
    const errorTests = [
      { name: 'Invalid Symbol', url: '/api/signals/INVALID_SYMBOL', expectedBehavior: 'Empty array or 404' },
      { name: 'Non-existent Endpoint', url: '/api/nonexistent', expectedBehavior: 'Should be 404' },
      { name: 'Monte Carlo Empty Body', url: '/api/monte-carlo-risk', method: 'POST', body: {}, expectedBehavior: 'Should be 400' }
    ];
    
    let properErrorHandling = 0;
    
    for (const test of errorTests) {
      try {
        let response;
        if (test.method === 'POST') {
          response = await fetch(`${this.baseUrl}${test.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test.body || {})
          });
        } else {
          response = await fetch(`${this.baseUrl}${test.url}`);
        }
        
        const contentType = response.headers.get('content-type');
        
        if (test.name === 'Invalid Symbol' && response.status === 200) {
          // This is actually correct behavior for signals
          const data = await response.json();
          if (Array.isArray(data) && data.length === 0) {
            console.log(`✅ ${test.name}: Correct (empty array)`);
            properErrorHandling++;
          }
        } else if (test.name === 'Monte Carlo Empty Body' && response.status === 400) {
          console.log(`✅ ${test.name}: Correct (400 error)`);
          properErrorHandling++;
        } else if (test.name === 'Non-existent Endpoint' && response.status === 404) {
          console.log(`✅ ${test.name}: Correct (404 error)`);
          properErrorHandling++;
        } else {
          console.log(`⚠️ ${test.name}: Status ${response.status} (${test.expectedBehavior})`);
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`❌ ${test.name}: Test failed - ${error.message}`);
      }
    }
    
    const errorHandlingScore = (properErrorHandling / errorTests.length) * 100;
    console.log(`\n🛡️ Error Handling Score: ${errorHandlingScore}%`);
    
    return errorHandlingScore;
  }

  async calculateFinalHealthScore() {
    console.log('\n📊 FINAL HEALTH SCORE CALCULATION');
    console.log('=================================');
    
    const monteCarloScore = await this.validateMonteCarleFix();
    const healthCheck = await this.runComprehensiveHealthCheck();
    const errorHandlingScore = await this.testErrorHandling();
    
    // Weight the scores
    const finalScore = (
      monteCarloScore * 0.3 +           // 30% - Monte Carlo reliability
      healthCheck.overallHealth * 0.5 + // 50% - Overall endpoint health
      errorHandlingScore * 0.2           // 20% - Error handling
    );
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log(`   Monte Carlo Validation: ${monteCarloScore}%`);
    console.log(`   System Health: ${healthCheck.overallHealth}%`);
    console.log(`   Error Handling: ${errorHandlingScore}%`);
    console.log(`   FINAL SCORE: ${finalScore.toFixed(1)}%`);
    
    const readyForPhase2 = finalScore >= 90;
    
    console.log('\n🚀 PHASE 1 STATUS:');
    if (readyForPhase2) {
      console.log(`   ✅ PHASE 1 COMPLETE: ${finalScore.toFixed(1)}% health achieved`);
      console.log('   🎯 READY FOR PHASE 2: UI realignment design');
      console.log('   📋 Next: Design realigned main display UI in external shell');
    } else {
      console.log(`   ⚠️ PHASE 1 PROGRESS: ${finalScore.toFixed(1)}% health (need 90%+)`);
      console.log('   🔧 Remaining issues to address before Phase 2');
    }
    
    return {
      finalScore,
      readyForPhase2,
      monteCarloScore,
      systemHealth: healthCheck.overallHealth,
      errorHandling: errorHandlingScore,
      endpointDetails: healthCheck.endpointResults
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive validation
async function main() {
  const validator = new PostFixValidator();
  const results = await validator.calculateFinalHealthScore();
  
  console.log('\n🏁 VALIDATION COMPLETE');
  process.exit(results.readyForPhase2 ? 0 : 1);
}

main().catch(console.error);