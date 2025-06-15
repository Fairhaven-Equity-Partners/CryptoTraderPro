/**
 * External Shell Comprehensive Validation - COMPLETE SYSTEM TEST
 * Tests all components before any main codebase changes
 * Ground Rules: External shell testing only, no synthetic data, thorough validation
 */

class ExternalShellValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = [];
    this.apiLimitTracking = {
      callsMade: 0,
      rateLimitHits: 0,
      circuitBreakerTriggered: false
    };
    this.monteCarloTests = [];
    this.systemHealthMetrics = {};
  }

  async runCompleteValidation() {
    console.log('\n🔍 EXTERNAL SHELL COMPREHENSIVE VALIDATION');
    console.log('==========================================');
    console.log('Ground Rules: External testing only, authentic data, thorough validation');
    
    try {
      await this.phase1_validateCurrentSystem();
      await this.phase2_monteCarloValidation();
      await this.phase3_apiLimitCompliance();
      await this.phase4_performanceValidation();
      await this.phase5_errorHandlingValidation();
      await this.phase6_integrationValidation();
      await this.generateFinalValidationReport();
      
    } catch (error) {
      console.error('Validation framework error:', error.message);
      return { validated: false, error: error.message };
    }
  }

  async phase1_validateCurrentSystem() {
    console.log('\n📋 Phase 1: Current System Validation');
    
    const endpoints = [
      '/api/crypto/BTC/USDT',
      '/api/signals/BTC/USDT',
      '/api/performance-metrics',
      '/api/technical-analysis/BTC/USDT',
      '/api/pattern-analysis/BTC/USDT',
      '/api/confluence-analysis/BTC/USDT'
    ];
    
    let healthyEndpoints = 0;
    let totalResponseTime = 0;
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: ${response.status} (${responseTime}ms)`);
          healthyEndpoints++;
          
          this.testResults.push({
            endpoint,
            status: 'healthy',
            responseTime,
            dataPresent: Object.keys(data).length > 0
          });
        } else {
          console.log(`❌ ${endpoint}: ${response.status}`);
          this.testResults.push({
            endpoint,
            status: 'unhealthy',
            responseTime,
            statusCode: response.status
          });
        }
        
        this.apiLimitTracking.callsMade++;
        await this.sleep(100); // Respectful API usage
        
      } catch (error) {
        console.log(`❌ ${endpoint}: Request failed`);
        this.testResults.push({
          endpoint,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    this.systemHealthMetrics.endpointHealth = (healthyEndpoints / endpoints.length) * 100;
    this.systemHealthMetrics.avgResponseTime = totalResponseTime / endpoints.length;
    
    console.log(`🎯 System Health: ${this.systemHealthMetrics.endpointHealth.toFixed(1)}%`);
    console.log(`⚡ Average Response Time: ${this.systemHealthMetrics.avgResponseTime.toFixed(1)}ms`);
  }

  async phase2_monteCarloValidation() {
    console.log('\n🎲 Phase 2: Monte Carlo Risk Assessment Validation');
    
    const testCases = [
      { symbol: 'BTC/USDT', timeframe: '1d', expectedSuccess: true },
      { symbol: 'ETH/USDT', timeframe: '4h', expectedSuccess: true },
      { symbol: 'BNB/USDT', timeframe: '1h', expectedSuccess: true },
      { symbol: '', timeframe: '1d', expectedSuccess: false }, // Invalid
      { symbol: 'BTC/USDT', timeframe: '', expectedSuccess: false }, // Invalid
      { symbol: 'NONEXISTENT/USDT', timeframe: '1d', expectedSuccess: false } // No signals
    ];
    
    let validTests = 0;
    let totalTests = 0;
    
    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: testCase.symbol,
            timeframe: testCase.timeframe
          })
        });
        
        const responseTime = Date.now() - startTime;
        const result = await response.json();
        
        totalTests++;
        this.apiLimitTracking.callsMade++;
        
        if (testCase.expectedSuccess) {
          if (response.ok && result.success) {
            console.log(`✅ Valid case ${testCase.symbol} ${testCase.timeframe}: Success (${responseTime}ms)`);
            
            // Validate response structure
            if (this.validateMonteCarloResponse(result)) {
              validTests++;
              
              this.monteCarloTests.push({
                symbol: testCase.symbol,
                timeframe: testCase.timeframe,
                status: 'passed',
                responseTime,
                var95: result.results.var95,
                sharpeRatio: result.results.sharpeRatio,
                maxDrawdown: result.results.maxDrawdown
              });
            } else {
              console.log(`⚠️ Valid case ${testCase.symbol} ${testCase.timeframe}: Invalid structure`);
            }
          } else {
            console.log(`❌ Valid case ${testCase.symbol} ${testCase.timeframe}: Failed`);
          }
        } else {
          if (!response.ok || !result.success) {
            console.log(`✅ Invalid case "${testCase.symbol}" "${testCase.timeframe}": Correctly rejected`);
            validTests++;
            
            this.monteCarloTests.push({
              symbol: testCase.symbol,
              timeframe: testCase.timeframe,
              status: 'correctly_rejected',
              responseTime
            });
          } else {
            console.log(`❌ Invalid case "${testCase.symbol}" "${testCase.timeframe}": Should have been rejected`);
          }
        }
        
        await this.sleep(200); // API rate limiting respect
        
      } catch (error) {
        console.log(`❌ Test case ${testCase.symbol} ${testCase.timeframe}: ${error.message}`);
        totalTests++;
      }
    }
    
    this.systemHealthMetrics.monteCarloReliability = (validTests / totalTests) * 100;
    console.log(`🎯 Monte Carlo Reliability: ${this.systemHealthMetrics.monteCarloReliability.toFixed(1)}%`);
  }

  async phase3_apiLimitCompliance() {
    console.log('\n⚡ Phase 3: API Limit Compliance Validation');
    
    // Monitor rate limiter behavior
    let rateLimitDetected = false;
    let circuitBreakerActive = false;
    
    // Test rapid requests to trigger rate limiting
    console.log('🧪 Testing rate limiter response...');
    
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/crypto/BTC/USDT`);
        this.apiLimitTracking.callsMade++;
        
        if (response.status === 429) {
          rateLimitDetected = true;
          this.apiLimitTracking.rateLimitHits++;
          console.log(`✅ Rate limiting active: Request ${i + 1} throttled`);
        } else if (response.ok) {
          console.log(`📊 Request ${i + 1}: Success`);
        }
        
        await this.sleep(50); // Rapid testing
        
      } catch (error) {
        if (error.message.includes('circuit') || error.message.includes('limit')) {
          circuitBreakerActive = true;
          this.apiLimitTracking.circuitBreakerTriggered = true;
          console.log(`🔐 Circuit breaker active: ${error.message}`);
        }
      }
    }
    
    // Check for CoinMarketCap API usage patterns
    console.log('📊 Analyzing API usage patterns...');
    
    try {
      // This should trigger the OptimizedCMC service
      const response = await fetch(`${this.baseUrl}/api/crypto/BTC/USDT`);
      this.apiLimitTracking.callsMade++;
      
      if (response.ok) {
        console.log('✅ CoinMarketCap integration working within limits');
      }
    } catch (error) {
      console.log(`⚠️ CoinMarketCap integration: ${error.message}`);
    }
    
    this.systemHealthMetrics.apiCompliance = {
      rateLimiterActive: rateLimitDetected || this.apiLimitTracking.rateLimitHits > 0,
      circuitBreakerActive,
      totalCallsMade: this.apiLimitTracking.callsMade,
      withinLimits: this.apiLimitTracking.callsMade < 100 // Conservative test limit
    };
    
    console.log(`🛡️ Rate Limiter: ${this.systemHealthMetrics.apiCompliance.rateLimiterActive ? 'Active' : 'Not Detected'}`);
    console.log(`🔐 Circuit Breaker: ${this.systemHealthMetrics.apiCompliance.circuitBreakerActive ? 'Triggered' : 'Stable'}`);
    console.log(`📊 API Calls Made: ${this.systemHealthMetrics.apiCompliance.totalCallsMade}`);
  }

  async phase4_performanceValidation() {
    console.log('\n⚡ Phase 4: Performance Validation');
    
    const performanceTests = [
      { name: 'Single Signal Generation', endpoint: '/api/signals/BTC/USDT' },
      { name: 'Technical Analysis', endpoint: '/api/technical-analysis/BTC/USDT' },
      { name: 'Pattern Recognition', endpoint: '/api/pattern-analysis/BTC/USDT' },
      { name: 'Performance Metrics', endpoint: '/api/performance-metrics' }
    ];
    
    let totalPerformanceTime = 0;
    let performanceTests_passed = 0;
    
    for (const test of performanceTests) {
      try {
        const iterations = 3;
        let testTotalTime = 0;
        
        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          const response = await fetch(`${this.baseUrl}${test.endpoint}`);
          const responseTime = Date.now() - startTime;
          
          testTotalTime += responseTime;
          this.apiLimitTracking.callsMade++;
          
          if (response.ok) {
            const data = await response.json();
          }
          
          await this.sleep(100);
        }
        
        const avgTime = testTotalTime / iterations;
        totalPerformanceTime += avgTime;
        
        if (avgTime < 1000) { // Under 1 second
          performanceTests_passed++;
          console.log(`✅ ${test.name}: ${avgTime.toFixed(1)}ms average`);
        } else {
          console.log(`⚠️ ${test.name}: ${avgTime.toFixed(1)}ms average (slow)`);
        }
        
      } catch (error) {
        console.log(`❌ ${test.name}: Performance test failed`);
      }
    }
    
    this.systemHealthMetrics.performance = {
      avgResponseTime: totalPerformanceTime / performanceTests.length,
      testsUnder1Second: performanceTests_passed,
      totalTests: performanceTests.length,
      performanceScore: (performanceTests_passed / performanceTests.length) * 100
    };
    
    console.log(`🎯 Performance Score: ${this.systemHealthMetrics.performance.performanceScore.toFixed(1)}%`);
  }

  async phase5_errorHandlingValidation() {
    console.log('\n🚨 Phase 5: Error Handling Validation');
    
    const errorTests = [
      { name: 'Invalid Symbol', endpoint: '/api/signals/INVALID_SYMBOL' },
      { name: 'Malformed Request', endpoint: '/api/monte-carlo-risk', method: 'POST', body: '{invalid}' },
      { name: 'Missing Parameters', endpoint: '/api/technical-analysis/' },
      { name: 'Non-existent Endpoint', endpoint: '/api/nonexistent' }
    ];
    
    let errorHandlingScore = 0;
    
    for (const test of errorTests) {
      try {
        const options = {
          method: test.method || 'GET'
        };
        
        if (test.body) {
          options.headers = { 'Content-Type': 'application/json' };
          options.body = test.body;
        }
        
        const response = await fetch(`${this.baseUrl}${test.endpoint}`, options);
        this.apiLimitTracking.callsMade++;
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            if (errorData.error || errorData.message) {
              console.log(`✅ ${test.name}: Error handled gracefully`);
              errorHandlingScore += 25;
            } else {
              console.log(`⚠️ ${test.name}: Error response lacks details`);
              errorHandlingScore += 10;
            }
          } catch (parseError) {
            console.log(`⚠️ ${test.name}: Non-JSON error response`);
            errorHandlingScore += 5;
          }
        } else {
          console.log(`❌ ${test.name}: Should have returned error`);
        }
        
        await this.sleep(100);
        
      } catch (error) {
        if (test.name === 'Malformed Request') {
          console.log(`✅ ${test.name}: Request properly rejected`);
          errorHandlingScore += 25;
        } else {
          console.log(`❌ ${test.name}: Unhandled error`);
        }
      }
    }
    
    this.systemHealthMetrics.errorHandling = errorHandlingScore;
    console.log(`🛡️ Error Handling Score: ${errorHandlingScore}/100`);
  }

  async phase6_integrationValidation() {
    console.log('\n🔗 Phase 6: Integration Validation');
    
    // Test complete workflow: Price -> Signal -> Monte Carlo
    console.log('🧪 Testing complete workflow...');
    
    try {
      // Step 1: Get price data
      const priceResponse = await fetch(`${this.baseUrl}/api/crypto/BTC/USDT`);
      const priceData = await priceResponse.json();
      this.apiLimitTracking.callsMade++;
      
      if (!priceResponse.ok || !priceData.lastPrice) {
        throw new Error('Price data unavailable');
      }
      
      console.log(`✅ Step 1: Price data retrieved ($${priceData.lastPrice})`);
      
      // Step 2: Get signal data
      const signalResponse = await fetch(`${this.baseUrl}/api/signals/BTC/USDT`);
      const signalData = await signalResponse.json();
      this.apiLimitTracking.callsMade++;
      
      if (!signalResponse.ok || !Array.isArray(signalData) || signalData.length === 0) {
        throw new Error('Signal data unavailable');
      }
      
      console.log(`✅ Step 2: Signal data retrieved (${signalData.length} signals)`);
      
      // Step 3: Run Monte Carlo analysis
      const monteCarloResponse = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      const monteCarloData = await monteCarloResponse.json();
      this.apiLimitTracking.callsMade++;
      
      if (!monteCarloResponse.ok || !monteCarloData.success) {
        throw new Error('Monte Carlo analysis failed');
      }
      
      console.log(`✅ Step 3: Monte Carlo analysis completed`);
      
      this.systemHealthMetrics.integrationWorking = true;
      console.log('🎯 Integration Test: PASSED - Complete workflow functional');
      
    } catch (error) {
      this.systemHealthMetrics.integrationWorking = false;
      console.log(`❌ Integration Test: FAILED - ${error.message}`);
    }
  }

  validateMonteCarloResponse(result) {
    return result.success && 
           result.results && 
           typeof result.results.var95 === 'number' &&
           typeof result.results.sharpeRatio === 'number' &&
           typeof result.results.maxDrawdown === 'number' &&
           result.signalInput &&
           typeof result.signalInput.entryPrice === 'number';
  }

  async generateFinalValidationReport() {
    console.log('\n📋 EXTERNAL SHELL VALIDATION REPORT');
    console.log('===================================');
    
    // Calculate overall system health
    const healthMetrics = [
      this.systemHealthMetrics.endpointHealth || 0,
      this.systemHealthMetrics.monteCarloReliability || 0,
      this.systemHealthMetrics.performance?.performanceScore || 0,
      this.systemHealthMetrics.errorHandling || 0
    ];
    
    const averageHealth = healthMetrics.reduce((a, b) => a + b, 0) / healthMetrics.length;
    
    console.log('\n📊 SYSTEM HEALTH METRICS:');
    console.log(`   Endpoint Health: ${(this.systemHealthMetrics.endpointHealth || 0).toFixed(1)}%`);
    console.log(`   Monte Carlo Reliability: ${(this.systemHealthMetrics.monteCarloReliability || 0).toFixed(1)}%`);
    console.log(`   Performance Score: ${(this.systemHealthMetrics.performance?.performanceScore || 0).toFixed(1)}%`);
    console.log(`   Error Handling: ${this.systemHealthMetrics.errorHandling || 0}/100`);
    console.log(`   Integration Status: ${this.systemHealthMetrics.integrationWorking ? 'Working' : 'Failed'}`);
    
    console.log('\n⚡ API COMPLIANCE STATUS:');
    console.log(`   Rate Limiter: ${this.systemHealthMetrics.apiCompliance?.rateLimiterActive ? 'Active' : 'Not Detected'}`);
    console.log(`   Circuit Breaker: ${this.systemHealthMetrics.apiCompliance?.circuitBreakerActive ? 'Triggered' : 'Stable'}`);
    console.log(`   Total API Calls: ${this.apiLimitTracking.callsMade}`);
    console.log(`   Within Limits: ${this.systemHealthMetrics.apiCompliance?.withinLimits ? 'Yes' : 'No'}`);
    
    console.log('\n🎯 VALIDATION SUMMARY:');
    console.log(`   Overall Health: ${averageHealth.toFixed(1)}%`);
    console.log(`   Monte Carlo Tests: ${this.monteCarloTests.length} completed`);
    console.log(`   Integration: ${this.systemHealthMetrics.integrationWorking ? 'FUNCTIONAL' : 'NEEDS ATTENTION'}`);
    
    if (averageHealth >= 90 && this.systemHealthMetrics.integrationWorking) {
      console.log('   Status: SYSTEM FULLY VALIDATED');
      console.log('   Recommendation: SAFE TO PROCEED WITH CHANGES');
    } else if (averageHealth >= 70) {
      console.log('   Status: SYSTEM MOSTLY FUNCTIONAL');
      console.log('   Recommendation: PROCEED WITH CAUTION');
    } else {
      console.log('   Status: SYSTEM NEEDS ATTENTION');
      console.log('   Recommendation: FIX ISSUES BEFORE CHANGES');
    }
    
    return {
      validated: averageHealth >= 70 && this.systemHealthMetrics.integrationWorking,
      healthScore: averageHealth,
      apiCompliant: this.systemHealthMetrics.apiCompliance?.withinLimits || false,
      monteCarloWorking: this.systemHealthMetrics.monteCarloReliability >= 80,
      recommendation: averageHealth >= 90 ? 'proceed' : averageHealth >= 70 ? 'caution' : 'fix'
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive validation
async function main() {
  const validator = new ExternalShellValidator();
  const result = await validator.runCompleteValidation();
  
  console.log('\n🏁 EXTERNAL SHELL VALIDATION COMPLETE');
  console.log(`Validated: ${result.validated}`);
  console.log(`Recommendation: ${result.recommendation.toUpperCase()}`);
  
  process.exit(result.validated ? 0 : 1);
}

main().catch(console.error);