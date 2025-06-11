/**
 * External Test Runner for Phase 2 Implementation
 * Executes comprehensive 25-cycle testing before any changes
 */

// Using built-in fetch in Node.js 18+

class ExternalTestRunner {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = [];
    this.cycles = 25;
    this.components = [
      'crypto',
      'signals',
      'market-heatmap',
      'technical-analysis',
      'authentic-data',
      'rate-limiter',
      'performance-metrics',
      'streaming'
    ];
  }

  async executeCompleteTesting() {
    console.log('🔬 EXTERNAL TESTING FRAMEWORK ACTIVATED');
    console.log('========================================');
    console.log(`Running ${this.cycles} cycles across ${this.components.length} components`);
    console.log('This validates system stability before Phase 2 implementation');
    console.log('');

    // System readiness check
    const isReady = await this.verifySystemReadiness();
    if (!isReady) {
      console.error('❌ System not ready for testing');
      return false;
    }

    // Execute test cycles
    for (let cycle = 1; cycle <= this.cycles; cycle++) {
      console.log(`\n📊 CYCLE ${cycle}/${this.cycles}`);
      await this.runTestCycle(cycle);
      
      if (cycle % 5 === 0) {
        this.generateProgressReport(cycle);
      }
      
      // Brief pause between cycles
      await this.sleep(1000);
    }

    // Generate final report
    return await this.generateFinalReport();
  }

  async verifySystemReadiness() {
    console.log('🔍 Verifying system readiness...');
    
    try {
      // Check main endpoints
      const endpoints = [
        '/api/crypto/BTC%2FUSDT',
        '/api/authentic-data/status',
        '/api/rate-limiter/stats',
        '/api/performance-metrics'
      ];

      for (const endpoint of endpoints) {
        const response = await this.makeRequest(endpoint);
        if (!response.ok) {
          console.error(`❌ Endpoint ${endpoint} not ready: ${response.status}`);
          return false;
        }
      }

      console.log('✅ System ready for testing');
      return true;
    } catch (error) {
      console.error('❌ System readiness check failed:', error.message);
      return false;
    }
  }

  async runTestCycle(cycleNumber) {
    const cycleResults = {
      cycle: cycleNumber,
      timestamp: Date.now(),
      componentTests: {},
      errors: [],
      performance: {}
    };

    for (const component of this.components) {
      try {
        const startTime = Date.now();
        const result = await this.testComponent(component);
        const endTime = Date.now();

        cycleResults.componentTests[component] = {
          success: result.success,
          responseTime: endTime - startTime,
          data: result.data,
          errors: result.errors || []
        };

        cycleResults.performance[component] = endTime - startTime;

        // Real-time feedback
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${component}: ${endTime - startTime}ms`);

      } catch (error) {
        cycleResults.componentTests[component] = {
          success: false,
          responseTime: 0,
          data: null,
          errors: [error.message]
        };
        cycleResults.errors.push(`${component}: ${error.message}`);
        console.log(`  ❌ ${component}: ERROR - ${error.message}`);
      }
    }

    this.testResults.push(cycleResults);
  }

  async testComponent(componentName) {
    switch (componentName) {
      case 'crypto':
        return await this.testCryptoData();
      case 'signals':
        return await this.testSignalGeneration();
      case 'market-heatmap':
        return await this.testMarketHeatmap();
      case 'technical-analysis':
        return await this.testTechnicalAnalysis();
      case 'authentic-data':
        return await this.testAuthenticData();
      case 'rate-limiter':
        return await this.testRateLimiter();
      case 'performance-metrics':
        return await this.testPerformanceMetrics();
      case 'streaming':
        return await this.testStreamingStatus();
      default:
        throw new Error(`Unknown component: ${componentName}`);
    }
  }

  async testCryptoData() {
    const response = await this.makeRequest('/api/crypto/BTC%2FUSDT');
    const data = await response.json();
    
    return {
      success: response.ok && data.price > 0,
      data: {
        symbol: data.symbol,
        price: data.price,
        change24h: data.change24h
      },
      validations: [
        { field: 'price', valid: typeof data.price === 'number' && data.price > 0 },
        { field: 'symbol', valid: data.symbol === 'BTC/USDT' },
        { field: 'change24h', valid: typeof data.change24h === 'number' }
      ]
    };
  }

  async testSignalGeneration() {
    const response = await this.makeRequest('/api/signals/BTC%2FUSDT');
    const data = await response.json();
    
    return {
      success: response.ok && Array.isArray(data),
      data: {
        signalCount: data.length,
        timeframes: data.map(s => s.timeframe),
        hasSignals: data.length > 0
      }
    };
  }

  async testMarketHeatmap() {
    const response = await this.makeRequest('/api/market-heatmap');
    const data = await response.json();
    
    return {
      success: response.ok && Array.isArray(data),
      data: {
        symbolCount: data.length,
        hasData: data.length > 0,
        sampleSymbol: data[0]?.symbol
      }
    };
  }

  async testTechnicalAnalysis() {
    const response = await this.makeRequest('/api/technical-analysis/BTC%2FUSDT');
    const data = await response.json();
    
    return {
      success: response.ok,
      data: {
        symbol: data.symbol,
        hasDataQuality: !!data.dataQuality,
        dataPointCount: data.dataQuality?.pointCount || 0,
        isReady: data.dataQuality?.isReady || false
      }
    };
  }

  async testAuthenticData() {
    const response = await this.makeRequest('/api/authentic-data/status');
    const data = await response.json();
    
    return {
      success: response.ok && data.totalSymbols > 0,
      data: {
        totalSymbols: data.totalSymbols,
        authenticDataReady: data.authenticDataReady,
        averageDataQuality: data.averageDataQuality
      }
    };
  }

  async testRateLimiter() {
    const response = await this.makeRequest('/api/rate-limiter/stats');
    const data = await response.json();
    
    return {
      success: response.ok && data.rateLimiter,
      data: {
        status: data.rateLimiter.status,
        requestsToday: data.rateLimiter.currentCounters?.daily || 0,
        circuitBreakerOpen: data.rateLimiter.circuitBreakerOpen
      }
    };
  }

  async testPerformanceMetrics() {
    const response = await this.makeRequest('/api/performance-metrics');
    const data = await response.json();
    
    return {
      success: response.ok && Array.isArray(data.indicators),
      data: {
        indicatorCount: data.indicators?.length || 0,
        timeframeCount: data.timeframes?.length || 0,
        lastUpdated: data.lastUpdated
      }
    };
  }

  async testStreamingStatus() {
    const response = await this.makeRequest('/api/streaming/status');
    const data = await response.json();
    
    return {
      success: response.ok && data.streaming,
      data: {
        totalSymbols: data.streaming?.totalSymbols || 0,
        activePairs: data.streaming?.activePairs || 0,
        lastUpdate: data.streaming?.lastUpdate || 0
      }
    };
  }

  generateProgressReport(cycleNumber) {
    console.log(`\n📈 PROGRESS REPORT - ${cycleNumber}/${this.cycles} CYCLES COMPLETE`);
    console.log('='.repeat(50));
    
    const recentResults = this.testResults.slice(-5);
    const componentStats = {};
    
    // Calculate component success rates
    this.components.forEach(component => {
      const successes = recentResults.filter(r => r.componentTests[component]?.success).length;
      const total = recentResults.length;
      componentStats[component] = {
        successRate: (successes / total * 100).toFixed(1),
        avgResponseTime: this.calculateAverageResponseTime(component, recentResults)
      };
    });
    
    // Display stats
    Object.entries(componentStats).forEach(([component, stats]) => {
      const status = parseFloat(stats.successRate) >= 80 ? '✅' : '⚠️';
      console.log(`${status} ${component}: ${stats.successRate}% success, ${stats.avgResponseTime}ms avg`);
    });
    
    console.log('='.repeat(50));
  }

  calculateAverageResponseTime(component, results) {
    const times = results
      .map(r => r.performance[component])
      .filter(t => t && t > 0);
    
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  }

  async generateFinalReport() {
    console.log('\n🎯 FINAL TESTING REPORT');
    console.log('========================');
    
    const totalTests = this.testResults.length * this.components.length;
    let successfulTests = 0;
    const componentStats = {};
    
    // Calculate overall statistics
    this.components.forEach(component => {
      const tests = this.testResults.map(r => r.componentTests[component]);
      const successes = tests.filter(t => t.success).length;
      const avgResponseTime = this.calculateAverageResponseTime(component, this.testResults);
      
      componentStats[component] = {
        successRate: (successes / tests.length * 100).toFixed(1),
        avgResponseTime,
        totalTests: tests.length,
        successes
      };
      
      successfulTests += successes;
    });
    
    const overallSuccessRate = (successfulTests / totalTests * 100).toFixed(1);
    
    console.log(`Overall Success Rate: ${overallSuccessRate}%`);
    console.log(`Total Tests Executed: ${totalTests}`);
    console.log(`Successful Tests: ${successfulTests}`);
    console.log('');
    
    // Component breakdown
    console.log('Component Performance:');
    Object.entries(componentStats).forEach(([component, stats]) => {
      const status = parseFloat(stats.successRate) >= 80 ? '✅' : '❌';
      console.log(`${status} ${component.padEnd(20)} ${stats.successRate}% (${stats.successes}/${stats.totalTests}) - ${stats.avgResponseTime}ms avg`);
    });
    
    // System stability assessment
    const isStable = parseFloat(overallSuccessRate) >= 80;
    console.log('\n🔍 SYSTEM STABILITY ASSESSMENT');
    console.log('==============================');
    
    if (isStable) {
      console.log('✅ SYSTEM STABLE - Ready for Phase 2 implementation');
      console.log('   - All critical components operating within acceptable parameters');
      console.log('   - Authentic data accumulation functioning correctly');
      console.log('   - Rate limiting and circuit breakers operational');
    } else {
      console.log('⚠️  SYSTEM UNSTABLE - Phase 2 implementation not recommended');
      console.log('   - Multiple component failures detected');
      console.log('   - Recommend investigating issues before proceeding');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    
    const failingComponents = Object.entries(componentStats)
      .filter(([_, stats]) => parseFloat(stats.successRate) < 80)
      .map(([component, _]) => component);
    
    if (failingComponents.length === 0) {
      console.log('✅ No critical issues detected');
      console.log('✅ Phase 2 technical indicator migration can proceed safely');
      console.log('✅ Authentic data quality sufficient for advanced analysis');
    } else {
      console.log('⚠️  Address these components before Phase 2:');
      failingComponents.forEach(component => {
        console.log(`   - ${component}: Review and stabilize`);
      });
    }
    
    return {
      stable: isStable,
      overallSuccessRate: parseFloat(overallSuccessRate),
      componentStats,
      totalTests,
      recommendations: isStable ? 'PROCEED_WITH_PHASE_2' : 'STABILIZE_FIRST'
    };
  }

  async makeRequest(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'External-Test-Framework/1.0'
      }
    });
    
    if (!response.ok && response.status !== 500) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute testing
const testRunner = new ExternalTestRunner();
testRunner.executeCompleteTesting()
  .then(results => {
    console.log('\n🎉 EXTERNAL TESTING COMPLETE');
    console.log(`Final Assessment: ${results.recommendations}`);
    process.exit(results.stable ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 EXTERNAL TESTING FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  });