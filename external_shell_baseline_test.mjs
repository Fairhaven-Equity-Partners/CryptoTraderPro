/**
 * EXTERNAL SHELL BASELINE TEST
 * Complete system validation before any changes
 */

import fetch from 'node-fetch';

class ExternalShellBaselineTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {};
    this.startTime = Date.now();
  }

  async runCompleteBaselineTest() {
    console.log('🔍 EXTERNAL SHELL BASELINE TEST');
    console.log('==============================');
    console.log('Testing all endpoints before making any changes\n');

    // Test 1: Basic server connectivity
    await this.testServerConnectivity();

    // Test 2: Signal generation endpoints
    await this.testSignalGeneration();

    // Test 3: Technical analysis endpoint
    await this.testTechnicalAnalysis();

    // Test 4: Pattern recognition endpoint
    await this.testPatternRecognition();

    // Test 5: Monte Carlo risk endpoint
    await this.testMonteCarloRisk();

    // Test 6: Performance metrics endpoint
    await this.testPerformanceMetrics();

    this.generateBaselineReport();
  }

  async testServerConnectivity() {
    console.log('📡 Testing server connectivity...');
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      if (response.ok) {
        console.log('   ✅ Server responding');
        this.results.serverConnectivity = 'OPERATIONAL';
      } else {
        console.log(`   ❌ Server error: ${response.status}`);
        this.results.serverConnectivity = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      this.results.serverConnectivity = 'FAILED';
    }
  }

  async testSignalGeneration() {
    console.log('\n📊 Testing signal generation...');
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
    let passed = 0;
    let total = 0;

    for (const timeframe of timeframes) {
      try {
        total++;
        const response = await fetch(`${this.baseUrl}/api/signals?symbol=BTC%2FUSDT&timeframe=${timeframe}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          passed++;
          console.log(`   ✅ ${timeframe}: ${data[0].direction} ${data[0].confidence}%`);
        } else {
          console.log(`   ❌ ${timeframe}: No data`);
        }
        
        await this.sleep(50);
      } catch (error) {
        total++;
        console.log(`   ❌ ${timeframe}: ${error.message}`);
      }
    }

    this.results.signalGeneration = {
      passed,
      total,
      rate: ((passed / total) * 100).toFixed(1)
    };
    console.log(`   📊 Signal Generation: ${passed}/${total} (${this.results.signalGeneration.rate}%)`);
  }

  async testTechnicalAnalysis() {
    console.log('\n📈 Testing technical analysis...');
    try {
      const response = await fetch(`${this.baseUrl}/api/technical-analysis?symbol=BTC%2FUSDT&timeframe=4h`);
      const data = await response.json();
      
      if (data && data.success && data.indicators) {
        console.log(`   ✅ Technical Analysis: ${Object.keys(data.indicators).length} indicators`);
        this.results.technicalAnalysis = 'OPERATIONAL';
      } else {
        console.log('   ❌ Technical Analysis: Invalid response');
        this.results.technicalAnalysis = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Technical Analysis: ${error.message}`);
      this.results.technicalAnalysis = 'FAILED';
    }
  }

  async testPatternRecognition() {
    console.log('\n🔍 Testing pattern recognition...');
    try {
      const response = await fetch(`${this.baseUrl}/api/pattern-analysis/BTC%2FUSDT`);
      const data = await response.json();
      
      if (data && data.success && data.patterns) {
        console.log(`   ✅ Pattern Recognition: ${data.patterns.length} patterns detected`);
        this.results.patternRecognition = 'OPERATIONAL';
      } else {
        console.log('   ❌ Pattern Recognition: Invalid response');
        this.results.patternRecognition = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Pattern Recognition: ${error.message}`);
      this.results.patternRecognition = 'FAILED';
    }
  }

  async testMonteCarloRisk() {
    console.log('\n🎲 Testing Monte Carlo risk assessment...');
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '4h' })
      });
      const data = await response.json();
      
      if (data && data.success) {
        console.log(`   ✅ Monte Carlo: ${data.riskLevel} risk, ${data.volatility}% volatility`);
        this.results.monteCarloRisk = 'OPERATIONAL';
      } else {
        console.log('   ❌ Monte Carlo: Invalid response');
        this.results.monteCarloRisk = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Monte Carlo: ${error.message}`);
      this.results.monteCarloRisk = 'FAILED';
    }
  }

  async testPerformanceMetrics() {
    console.log('\n📱 Testing performance metrics...');
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      const data = await response.json();
      
      if (data && data.indicators && Array.isArray(data.indicators)) {
        console.log(`   ✅ Performance Metrics: ${data.indicators.length} indicators`);
        this.results.performanceMetrics = 'OPERATIONAL';
      } else {
        console.log('   ❌ Performance Metrics: Invalid response');
        this.results.performanceMetrics = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Performance Metrics: ${error.message}`);
      this.results.performanceMetrics = 'FAILED';
    }
  }

  generateBaselineReport() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\n🎯 BASELINE TEST COMPLETE');
    console.log('========================');
    console.log(`⏱️  Test Duration: ${totalTime} seconds`);
    
    console.log('\n📊 SYSTEM STATUS:');
    console.log(`📡 Server Connectivity: ${this.results.serverConnectivity}`);
    console.log(`📊 Signal Generation: ${this.results.signalGeneration?.rate || '0'}%`);
    console.log(`📈 Technical Analysis: ${this.results.technicalAnalysis}`);
    console.log(`🔍 Pattern Recognition: ${this.results.patternRecognition}`);
    console.log(`🎲 Monte Carlo Risk: ${this.results.monteCarloRisk}`);
    console.log(`📱 Performance Metrics: ${this.results.performanceMetrics}`);
    
    // Calculate overall health
    const components = [
      this.results.serverConnectivity,
      this.results.technicalAnalysis,
      this.results.patternRecognition,
      this.results.monteCarloRisk,
      this.results.performanceMetrics
    ];
    
    const operational = components.filter(c => c === 'OPERATIONAL').length;
    const healthScore = ((operational / components.length) * 100).toFixed(1);
    
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${healthScore}%`);
    
    if (healthScore >= 80) {
      console.log('✅ System is stable - safe to proceed with optimizations');
    } else {
      console.log('⚠️  System issues detected - needs stabilization first');
    }
    
    return this.results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute baseline test
async function main() {
  const tester = new ExternalShellBaselineTest();
  await tester.runCompleteBaselineTest();
}

main().catch(console.error);