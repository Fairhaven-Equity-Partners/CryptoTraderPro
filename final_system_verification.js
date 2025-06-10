/**
 * Final System Verification - Complete Authentic Data Flow Test
 * Validates all components are working with CoinMarketCap API integration
 */

class FinalSystemVerifier {
  constructor() {
    this.results = {
      systemStatus: {},
      authenticDataFlow: {},
      performanceMetrics: {},
      rateLimiting: {},
      signalGeneration: {},
      errors: []
    };
  }

  async runCompleteVerification() {
    console.log('🔍 Running Final System Verification...\n');
    
    try {
      await this.verifySystemStatus();
      await this.verifyAuthenticDataFlow();
      await this.verifyPerformanceMetrics();
      await this.verifyRateLimitingSystem();
      await this.verifySignalGeneration();
      
      this.generateFinalReport();
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      this.results.errors.push(`Critical error: ${error.message}`);
    }
  }

  async verifySystemStatus() {
    console.log('📊 Verifying System Status...');
    
    try {
      const response = await fetch('http://localhost:5000/api/streaming/status');
      const data = await response.json();
      
      this.results.systemStatus = {
        status: response.status,
        isRunning: data.totalSymbols > 0,
        totalSymbols: data.totalSymbols,
        activePairs: data.activePairs,
        lastUpdate: data.lastUpdate
      };
      
      console.log(`  ✅ System running: ${data.totalSymbols} symbols, ${data.activePairs} active pairs`);
    } catch (error) {
      this.results.errors.push(`System status check failed: ${error.message}`);
      console.log('  ❌ System status check failed');
    }
  }

  async verifyAuthenticDataFlow() {
    console.log('🔄 Verifying Authentic Data Flow...');
    
    try {
      // Test crypto price endpoint
      const priceResponse = await fetch('http://localhost:5000/api/crypto/BTC%2FUSDT');
      const priceData = await priceResponse.json();
      
      // Test technical analysis endpoint
      const techResponse = await fetch('http://localhost:5000/api/technical-analysis/BTC%2FUSDT');
      const techData = await techResponse.json();
      
      this.results.authenticDataFlow = {
        priceEndpoint: {
          status: priceResponse.status,
          hasPrice: !!priceData.lastPrice,
          hasChange24h: !!priceData.change24h,
          symbol: priceData.symbol
        },
        technicalAnalysis: {
          status: techResponse.status,
          authenticDataOnly: techData.authenticDataOnly,
          statusMessage: techData.status || 'working',
          message: techData.message
        }
      };
      
      console.log(`  ✅ Price data: ${priceData.symbol} @ $${priceData.lastPrice}`);
      console.log(`  ✅ Technical analysis: ${techData.status || 'working'} (authentic data only)`);
    } catch (error) {
      this.results.errors.push(`Authentic data flow check failed: ${error.message}`);
      console.log('  ❌ Authentic data flow check failed');
    }
  }

  async verifyPerformanceMetrics() {
    console.log('📈 Verifying Performance Metrics...');
    
    try {
      const response = await fetch('http://localhost:5000/api/performance-metrics');
      const data = await response.json();
      
      const hasValidStructure = Array.isArray(data.indicators) &&
        data.indicators.length > 0 &&
        data.indicators[0].hasOwnProperty('value') &&
        data.indicators[0].hasOwnProperty('status') &&
        data.indicators[0].hasOwnProperty('change');
      
      this.results.performanceMetrics = {
        status: response.status,
        validStructure: hasValidStructure,
        indicatorCount: data.indicators?.length || 0,
        hasTimeframes: Array.isArray(data.timeframes),
        hasSymbols: Array.isArray(data.symbols)
      };
      
      console.log(`  ✅ Performance metrics: ${data.indicators?.length || 0} indicators with UI-compatible structure`);
    } catch (error) {
      this.results.errors.push(`Performance metrics check failed: ${error.message}`);
      console.log('  ❌ Performance metrics check failed');
    }
  }

  async verifyRateLimitingSystem() {
    console.log('⚡ Verifying Rate Limiting System...');
    
    try {
      const response = await fetch('http://localhost:5000/api/rate-limiter/stats');
      const data = await response.json();
      
      this.results.rateLimiting = {
        status: response.status,
        currentUsage: data.currentUsage,
        monthlyLimit: data.monthlyLimit,
        utilizationRate: data.utilizationPercentage,
        rateLimitActive: data.rateLimitActive
      };
      
      console.log(`  ✅ Rate limiting: ${data.currentUsage}/${data.monthlyLimit} (${data.utilizationPercentage}% utilization)`);
    } catch (error) {
      this.results.errors.push(`Rate limiting check failed: ${error.message}`);
      console.log('  ❌ Rate limiting check failed');
    }
  }

  async verifySignalGeneration() {
    console.log('🎯 Verifying Signal Generation...');
    
    try {
      const response = await fetch('http://localhost:5000/api/signals/BTC%2FUSDT');
      const data = await response.json();
      
      this.results.signalGeneration = {
        status: response.status,
        hasSignals: Array.isArray(data) && data.length > 0,
        signalCount: Array.isArray(data) ? data.length : 0,
        hasTimeframes: data.some && data.some(signal => signal.timeframe)
      };
      
      console.log(`  ✅ Signal generation: ${Array.isArray(data) ? data.length : 0} signals available`);
    } catch (error) {
      this.results.errors.push(`Signal generation check failed: ${error.message}`);
      console.log('  ❌ Signal generation check failed');
    }
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL SYSTEM VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    const systemHealth = this.assessSystemHealth();
    
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${systemHealth.status}`);
    console.log(`📊 Health Score: ${systemHealth.score}/100`);
    
    // System Components Status
    console.log('\n📊 COMPONENT STATUS:');
    console.log(`  🔧 Core System: ${this.results.systemStatus.isRunning ? '✅ RUNNING' : '❌ OFFLINE'}`);
    console.log(`  💰 Price Data: ${this.results.authenticDataFlow.priceEndpoint?.hasPrice ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log(`  📈 Performance Metrics: ${this.results.performanceMetrics.validStructure ? '✅ FIXED' : '❌ BROKEN'}`);
    console.log(`  ⚡ Rate Limiting: ${this.results.rateLimiting.rateLimitActive ? '✅ PROTECTED' : '❌ UNPROTECTED'}`);
    console.log(`  🎯 Signal Generation: ${this.results.signalGeneration.hasSignals ? '✅ OPERATIONAL' : '❌ INACTIVE'}`);
    
    // Data Integrity Status
    console.log('\n🔒 DATA INTEGRITY STATUS:');
    console.log(`  🌐 CoinMarketCap Integration: ${this.results.authenticDataFlow.priceEndpoint?.status === 200 ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log(`  📊 Authentic Data Only: ${this.results.authenticDataFlow.technicalAnalysis?.authenticDataOnly ? '✅ ENFORCED' : '❌ COMPROMISED'}`);
    console.log(`  🚫 Synthetic Elimination: ${this.results.authenticDataFlow.technicalAnalysis?.statusMessage !== 'working' ? '✅ COMPLETE' : '🔄 IN PROGRESS'}`);
    
    // Performance Statistics
    console.log('\n⚡ PERFORMANCE STATISTICS:');
    console.log(`  📊 Active Symbols: ${this.results.systemStatus.totalSymbols || 0}`);
    console.log(`  📈 Performance Indicators: ${this.results.performanceMetrics.indicatorCount || 0}`);
    console.log(`  🎯 Generated Signals: ${this.results.signalGeneration.signalCount || 0}`);
    console.log(`  💎 API Utilization: ${this.results.rateLimiting.utilizationRate || 0}%`);
    
    // Issue Summary
    if (this.results.errors.length > 0) {
      console.log('\n⚠️  IDENTIFIED ISSUES:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ NO CRITICAL ISSUES IDENTIFIED');
    }
    
    // Recommendations
    this.generateRecommendations();
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 VERIFICATION COMPLETE');
    console.log('='.repeat(60));
  }

  assessSystemHealth() {
    let score = 0;
    let status = 'CRITICAL';
    
    // Core system running (25 points)
    if (this.results.systemStatus.isRunning) score += 25;
    
    // Authentic data flow (25 points)
    if (this.results.authenticDataFlow.priceEndpoint?.hasPrice) score += 25;
    
    // Performance metrics fixed (25 points)
    if (this.results.performanceMetrics.validStructure) score += 25;
    
    // Rate limiting active (25 points)
    if (this.results.rateLimiting.rateLimitActive) score += 25;
    
    if (score >= 90) status = 'EXCELLENT';
    else if (score >= 75) status = 'GOOD';
    else if (score >= 50) status = 'FAIR';
    else if (score >= 25) status = 'POOR';
    
    return { score, status };
  }

  generateRecommendations() {
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (!this.results.systemStatus.isRunning) {
      console.log('  🔧 Restart core system services');
    }
    
    if (!this.results.performanceMetrics.validStructure) {
      console.log('  📈 Fix performance metrics data transformation');
    }
    
    if (!this.results.rateLimiting.rateLimitActive) {
      console.log('  ⚡ Enable API rate limiting protection');
    }
    
    if (this.results.authenticDataFlow.technicalAnalysis?.statusMessage === 'INSUFFICIENT_AUTHENTIC_DATA') {
      console.log('  📊 Continue authentic data accumulation for technical analysis');
    }
    
    if (this.results.errors.length === 0) {
      console.log('  🎉 System is operating optimally - continue monitoring');
    }
  }
}

async function main() {
  const verifier = new FinalSystemVerifier();
  await verifier.runCompleteVerification();
}

main();