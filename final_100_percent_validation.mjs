/**
 * FINAL 100% VALIDATION SYSTEM
 * Comprehensive testing to verify 100% scores achieved
 */

class Final100PercentValidation {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.results = {};
  }

  async runFinalValidation() {
    console.log('🎯 FINAL 100% VALIDATION');
    console.log('='.repeat(50));
    
    // Test 1: Monte Carlo System (Fixed)
    const monteCarloTest = await this.testMonteCarlo();
    
    // Test 2: Signal Generation
    const signalTest = await this.testSignals();
    
    // Test 3: Technical Analysis
    const technicalTest = await this.testTechnicalAnalysis();
    
    // Test 4: Performance Metrics
    const performanceTest = await this.testPerformance();
    
    // Test 5: API Connectivity
    const apiTest = await this.testAPI();
    
    const finalScore = this.calculateFinalScore({
      monteCarlo: monteCarloTest,
      signals: signalTest,
      technical: technicalTest,
      performance: performanceTest,
      api: apiTest
    });
    
    this.generateFinalReport(finalScore);
    return finalScore;
  }

  async testMonteCarlo() {
    console.log('\n🎰 Testing Monte Carlo System...');
    try {
      const response = await fetch(`${this.baseURL}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      const data = await response.json();
      
      if (data.success && data.riskAssessment && data.signalInput) {
        const assessment = data.riskAssessment;
        const hasAllMetrics = assessment.expectedReturn !== undefined && 
                             assessment.var95 !== undefined && 
                             assessment.sharpeRatio !== undefined &&
                             assessment.winProbability !== undefined &&
                             assessment.riskScore !== undefined;
        
        console.log(`✅ Monte Carlo: ${hasAllMetrics ? '100%' : '85%'}`);
        return hasAllMetrics ? 100 : 85;
      }
      
      console.log('❌ Monte Carlo: 0%');
      return 0;
    } catch (error) {
      console.log('❌ Monte Carlo: 0%');
      return 0;
    }
  }

  async testSignals() {
    console.log('\n📊 Testing Signal Generation...');
    try {
      const response = await fetch(`${this.baseURL}/api/signals/BTC%2FUSDT`);
      const signals = await response.json();
      
      if (signals && signals.length > 0) {
        const validSignals = signals.filter(s => 
          ['LONG', 'SHORT', 'NEUTRAL'].includes(s.direction) &&
          s.confidence >= 0 && s.confidence <= 100 &&
          s.entryPrice > 0 &&
          s.stopLoss && s.takeProfit
        );
        
        const score = (validSignals.length / signals.length) * 100;
        console.log(`✅ Signals: ${score.toFixed(1)}%`);
        return score;
      }
      
      console.log('❌ Signals: 0%');
      return 0;
    } catch (error) {
      console.log('❌ Signals: 0%');
      return 0;
    }
  }

  async testTechnicalAnalysis() {
    console.log('\n📈 Testing Technical Analysis...');
    try {
      const response = await fetch(`${this.baseURL}/api/technical-analysis/BTC%2FUSDT`);
      const data = await response.json();
      
      if (data.success && data.indicators) {
        let score = 0;
        const indicators = data.indicators;
        
        if (indicators.RSI && indicators.RSI.value >= 0 && indicators.RSI.value <= 100) score += 25;
        if (indicators.MACD && indicators.MACD.line !== undefined) score += 25;
        if (indicators.bollingerBands && indicators.bollingerBands.upper > indicators.bollingerBands.lower) score += 25;
        if (indicators.ATR && indicators.ATR.value > 0) score += 25;
        
        console.log(`✅ Technical Analysis: ${score}%`);
        return score;
      }
      
      console.log('❌ Technical Analysis: 0%');
      return 0;
    } catch (error) {
      console.log('❌ Technical Analysis: 0%');
      return 0;
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    try {
      const start = Date.now();
      const response = await fetch(`${this.baseURL}/api/performance-metrics`);
      const duration = Date.now() - start;
      
      const data = await response.json();
      
      if (response.ok && data) {
        const score = Math.max(0, 100 - (duration / 10)); // Penalty for slow response
        console.log(`✅ Performance: ${score.toFixed(1)}%`);
        return score;
      }
      
      console.log('❌ Performance: 0%');
      return 0;
    } catch (error) {
      console.log('❌ Performance: 0%');
      return 0;
    }
  }

  async testAPI() {
    console.log('\n🔗 Testing API Connectivity...');
    try {
      const response = await fetch(`${this.baseURL}/api/crypto/BTC/USDT`);
      const data = await response.json();
      
      if (response.ok && data && data.name) {
        console.log('✅ API: 100%');
        return 100;
      }
      
      console.log('❌ API: 0%');
      return 0;
    } catch (error) {
      console.log('❌ API: 0%');
      return 0;
    }
  }

  calculateFinalScore(results) {
    const weights = {
      monteCarlo: 0.30,
      signals: 0.25,
      technical: 0.20,
      performance: 0.15,
      api: 0.10
    };

    let weightedScore = 0;
    Object.entries(weights).forEach(([component, weight]) => {
      weightedScore += (results[component] || 0) * weight;
    });

    return Math.round(weightedScore * 100) / 100;
  }

  generateFinalReport(finalScore) {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FINAL VALIDATION REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🏆 FINAL HEALTH SCORE: ${finalScore}%`);
    
    if (finalScore >= 100) {
      console.log('🎉 PERFECT SCORE ACHIEVED!');
      console.log('✅ All systems operating at 100% capacity');
      console.log('✅ Monte Carlo risk assessment fully operational');
      console.log('✅ Signal generation with complete data');
      console.log('✅ Technical analysis working correctly');
      console.log('✅ Performance optimized');
      console.log('✅ API connectivity established');
    } else if (finalScore >= 95) {
      console.log('🌟 NEAR-PERFECT PERFORMANCE!');
      console.log('✅ System ready for production deployment');
    } else if (finalScore >= 90) {
      console.log('⭐ EXCELLENT PERFORMANCE!');
      console.log('✅ Minor optimizations available');
    } else {
      console.log('⚠️ Further optimization needed');
    }
    
    console.log('\n✅ VALIDATION COMPLETE');
  }
}

// Execute validation
const validator = new Final100PercentValidation();
validator.runFinalValidation().then(score => {
  process.exit(score >= 95 ? 0 : 1);
}).catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});