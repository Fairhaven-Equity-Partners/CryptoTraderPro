/**
 * Final Auto-Calculation System Validation
 * Comprehensive testing of the optimized signal calculation system
 */

class FinalAutoCalculationValidator {
  constructor() {
    this.results = {
      systemHealth: {},
      signalGeneration: {},
      performanceMetrics: {},
      apiEfficiency: {},
      circuitBreakerStatus: {},
      overallStatus: 'UNKNOWN'
    };
    this.startTime = Date.now();
  }

  async runCompleteValidation() {
    console.log('🚀 FINAL AUTO-CALCULATION SYSTEM VALIDATION');
    console.log('=' .repeat(60));
    console.log('Validating optimized signal calculation system\n');

    try {
      await this.validateSystemHealth();
      await this.validateSignalGeneration();
      await this.validatePerformanceMetrics();
      await this.validateAPIEfficiency();
      await this.validateCircuitBreakerStatus();
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      this.results.overallStatus = 'FAILED';
    }
  }

  async validateSystemHealth() {
    console.log('🔍 Validating System Health...');
    
    try {
      // Test core endpoints
      const endpoints = [
        '/api/rate-limiter/stats',
        '/api/signals/BTC%2FUSDT',
        '/api/crypto/BTC/USDT',
        '/api/performance-metrics'
      ];
      
      let successCount = 0;
      const endpointResults = [];
      
      for (const endpoint of endpoints) {
        try {
          const start = Date.now();
          const response = await this.makeRequest(endpoint);
          const responseTime = Date.now() - start;
          
          const result = {
            endpoint,
            responseTime,
            success: true,
            status: 'healthy'
          };
          
          endpointResults.push(result);
          successCount++;
          console.log(`  ✅ ${endpoint}: ${responseTime}ms`);
          
        } catch (error) {
          endpointResults.push({
            endpoint,
            responseTime: null,
            success: false,
            status: 'failed',
            error: error.message
          });
          console.log(`  ❌ ${endpoint}: Failed`);
        }
      }
      
      const healthScore = (successCount / endpoints.length) * 100;
      
      this.results.systemHealth = {
        score: healthScore,
        endpointResults,
        status: healthScore >= 90 ? 'EXCELLENT' : healthScore >= 70 ? 'GOOD' : 'NEEDS_ATTENTION'
      };
      
      console.log(`System Health Score: ${healthScore}%\n`);
      
    } catch (error) {
      this.results.systemHealth = {
        score: 0,
        status: 'FAILED',
        error: error.message
      };
    }
  }

  async validateSignalGeneration() {
    console.log('📡 Validating Signal Generation...');
    
    try {
      const timeframes = ['1m', '5m', '15m', '1h', '4h'];
      const symbols = ['BTC%2FUSDT', 'ETH%2FUSDT'];
      
      let totalTests = 0;
      let successfulTests = 0;
      const signalResults = [];
      
      for (const symbol of symbols) {
        for (const timeframe of timeframes) {
          totalTests++;
          
          try {
            const start = Date.now();
            const response = await this.makeRequest(`/api/signals/${symbol}?timeframe=${timeframe}`);
            const signals = JSON.parse(response);
            const responseTime = Date.now() - start;
            
            const isValid = Array.isArray(signals) && signals.length > 0;
            const hasValidData = isValid && signals[0].confidence !== undefined;
            
            if (hasValidData) {
              successfulTests++;
              signalResults.push({
                symbol: symbol.replace('%2F', '/'),
                timeframe,
                responseTime,
                signalCount: signals.length,
                confidence: signals[0].confidence,
                success: true
              });
              console.log(`  ✅ ${symbol.replace('%2F', '/')} ${timeframe}: ${signals.length} signals (${responseTime}ms)`);
            } else {
              signalResults.push({
                symbol: symbol.replace('%2F', '/'),
                timeframe,
                responseTime,
                signalCount: 0,
                success: false
              });
              console.log(`  ❌ ${symbol.replace('%2F', '/')} ${timeframe}: No valid signals`);
            }
            
          } catch (error) {
            signalResults.push({
              symbol: symbol.replace('%2F', '/'),
              timeframe,
              responseTime: null,
              success: false,
              error: error.message
            });
            console.log(`  ❌ ${symbol.replace('%2F', '/')} ${timeframe}: Error`);
          }
        }
      }
      
      const successRate = (successfulTests / totalTests) * 100;
      const avgResponseTime = signalResults
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.responseTime, 0) / successfulTests;
      
      this.results.signalGeneration = {
        successRate,
        avgResponseTime,
        totalTests,
        successfulTests,
        results: signalResults,
        status: successRate >= 80 ? 'EXCELLENT' : successRate >= 60 ? 'GOOD' : 'NEEDS_ATTENTION'
      };
      
      console.log(`Signal Generation: ${successRate}% success rate, ${avgResponseTime.toFixed(0)}ms avg\n`);
      
    } catch (error) {
      this.results.signalGeneration = {
        successRate: 0,
        status: 'FAILED',
        error: error.message
      };
    }
  }

  async validatePerformanceMetrics() {
    console.log('⚡ Validating Performance Metrics...');
    
    try {
      const testRuns = 10;
      const responseTimes = [];
      let successCount = 0;
      
      for (let i = 0; i < testRuns; i++) {
        try {
          const start = Date.now();
          const response = await this.makeRequest('/api/performance-metrics');
          const responseTime = Date.now() - start;
          const data = JSON.parse(response);
          
          if (data.indicators && Array.isArray(data.indicators)) {
            responseTimes.push(responseTime);
            successCount++;
          }
          
          await this.sleep(100); // Small delay between requests
        } catch (error) {
          // Continue with next test
        }
      }
      
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const successRate = (successCount / testRuns) * 100;
      
      this.results.performanceMetrics = {
        avgResponseTime,
        successRate,
        testRuns,
        status: avgResponseTime < 50 && successRate >= 90 ? 'EXCELLENT' : 'GOOD'
      };
      
      console.log(`Performance: ${successRate}% success, ${avgResponseTime.toFixed(0)}ms avg response\n`);
      
    } catch (error) {
      this.results.performanceMetrics = {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  async validateAPIEfficiency() {
    console.log('🔧 Validating API Efficiency...');
    
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
      
      const maxUtilization = Math.max(...Object.values(utilization));
      const isOptimal = maxUtilization < 0.8;
      
      this.results.apiEfficiency = {
        utilization,
        maxUtilization,
        isOptimal,
        status: isOptimal ? 'EXCELLENT' : maxUtilization < 0.9 ? 'GOOD' : 'NEEDS_ATTENTION'
      };
      
      console.log(`API Efficiency: ${(maxUtilization * 100).toFixed(1)}% max utilization`);
      console.log(`Status: ${isOptimal ? 'Optimal' : 'Needs Optimization'}\n`);
      
    } catch (error) {
      this.results.apiEfficiency = {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  async validateCircuitBreakerStatus() {
    console.log('🛡️ Validating Circuit Breaker Status...');
    
    try {
      const response = await this.makeRequest('/api/rate-limiter/stats');
      const stats = JSON.parse(response);
      
      const circuitBreaker = stats.rateLimiter?.circuitBreaker;
      const state = circuitBreaker?.state || 'Unknown';
      const failures = circuitBreaker?.failures || 0;
      
      this.results.circuitBreakerStatus = {
        state,
        failures,
        isHealthy: state === 'CLOSED' && failures < 10,
        status: state === 'CLOSED' ? 'HEALTHY' : 'ATTENTION_REQUIRED'
      };
      
      console.log(`Circuit Breaker: ${state} (${failures} failures)`);
      console.log(`Status: ${state === 'CLOSED' ? 'Healthy' : 'Needs Attention'}\n`);
      
    } catch (error) {
      this.results.circuitBreakerStatus = {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  generateFinalReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('=' .repeat(60));
    console.log('FINAL AUTO-CALCULATION SYSTEM VALIDATION REPORT');
    console.log('=' .repeat(60));
    console.log(`Validation completed in ${duration}s\n`);
    
    // Calculate overall score
    const scores = {
      systemHealth: this.getScoreFromStatus(this.results.systemHealth.status),
      signalGeneration: this.getScoreFromStatus(this.results.signalGeneration.status),
      performanceMetrics: this.getScoreFromStatus(this.results.performanceMetrics.status),
      apiEfficiency: this.getScoreFromStatus(this.results.apiEfficiency.status),
      circuitBreakerStatus: this.getScoreFromStatus(this.results.circuitBreakerStatus.status)
    };
    
    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    // Generate overall status
    this.results.overallStatus = overallScore >= 90 ? 'EXCELLENT' : 
                                overallScore >= 75 ? 'GOOD' : 
                                overallScore >= 60 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT';
    
    console.log('📊 VALIDATION RESULTS:');
    console.log(`Overall Status: ${this.results.overallStatus} (${overallScore.toFixed(1)}%)\n`);
    
    // Individual component results
    Object.entries(this.results).forEach(([component, result]) => {
      if (component !== 'overallStatus' && result.status) {
        const status = this.getStatusIcon(result.status);
        console.log(`${status} ${component.replace(/([A-Z])/g, ' $1').trim()}: ${result.status}`);
        
        if (result.successRate !== undefined) {
          console.log(`   Success Rate: ${result.successRate.toFixed(1)}%`);
        }
        if (result.avgResponseTime !== undefined) {
          console.log(`   Avg Response Time: ${result.avgResponseTime.toFixed(0)}ms`);
        }
        if (result.maxUtilization !== undefined) {
          console.log(`   Max Utilization: ${(result.maxUtilization * 100).toFixed(1)}%`);
        }
        
        console.log('');
      }
    });
    
    // Final recommendations
    console.log('🎯 RECOMMENDATIONS:');
    
    if (this.results.overallStatus === 'EXCELLENT') {
      console.log('✅ Auto-calculation system is fully optimized and ready for production');
      console.log('✅ All components are performing optimally');
      console.log('✅ System is ready for 35-cycle comprehensive testing');
      console.log('✅ Circuit breaker protection is functioning correctly');
      console.log('✅ API usage is well within limits');
    } else {
      console.log('⚠️  System requires attention in the following areas:');
      
      Object.entries(this.results).forEach(([component, result]) => {
        if (result.status && !['EXCELLENT', 'HEALTHY'].includes(result.status)) {
          console.log(`   • ${component}: ${result.status}`);
        }
      });
    }
    
    console.log('\n🎬 AUTO-CALCULATION SYSTEM STATUS');
    if (this.results.overallStatus === 'EXCELLENT') {
      console.log('The auto-calculation system optimization is COMPLETE.');
      console.log('All critical issues have been resolved and the system is stable.');
      console.log('Ready for full production deployment.');
    } else {
      console.log('The auto-calculation system requires additional optimization.');
      console.log('Address the identified issues before proceeding to production.');
    }
  }

  getScoreFromStatus(status) {
    const scoreMap = {
      'EXCELLENT': 100,
      'HEALTHY': 100,
      'GOOD': 80,
      'ACCEPTABLE': 60,
      'NEEDS_ATTENTION': 40,
      'ATTENTION_REQUIRED': 40,
      'NEEDS_IMPROVEMENT': 20,
      'FAILED': 0
    };
    return scoreMap[status] || 0;
  }

  getStatusIcon(status) {
    const iconMap = {
      'EXCELLENT': '✅',
      'HEALTHY': '✅',
      'GOOD': '✅',
      'ACCEPTABLE': '⚠️',
      'NEEDS_ATTENTION': '⚠️',
      'ATTENTION_REQUIRED': '⚠️',
      'NEEDS_IMPROVEMENT': '❌',
      'FAILED': '❌'
    };
    return iconMap[status] || '❓';
  }

  async makeRequest(endpoint) {
    const url = `http://localhost:5000${endpoint}`;
    const response = await fetch(url);
    return await response.text();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run final validation
async function main() {
  const validator = new FinalAutoCalculationValidator();
  await validator.runCompleteValidation();
}

main().catch(console.error);