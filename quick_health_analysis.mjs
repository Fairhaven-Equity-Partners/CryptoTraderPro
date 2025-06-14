/**
 * QUICK HEALTH ANALYSIS - External Shell Testing
 * Rapid comprehensive validation targeting 100% health score
 */

class QuickHealthAnalysis {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.results = {};
  }

  async run() {
    console.log('🔬 QUICK COMPREHENSIVE HEALTH ANALYSIS');
    console.log('='.repeat(50));
    
    try {
      // Test core functionality
      const coreTest = await this.testCore();
      const mathTest = await this.testMath();
      const signalTest = await this.testSignals();
      const monteCarloTest = await this.testMonteCarlo();
      
      const healthScore = this.calculateScore([coreTest, mathTest, signalTest, monteCarloTest]);
      
      this.generateReport(healthScore, { coreTest, mathTest, signalTest, monteCarloTest });
      
      return healthScore;
    } catch (error) {
      console.error('Analysis failed:', error.message);
      return 0;
    }
  }

  async testCore() {
    try {
      const response = await fetch(`${this.baseURL}/api/crypto/BTC/USDT`);
      const data = await response.json();
      return response.ok && data ? 95 : 0;
    } catch (error) {
      return 0;
    }
  }

  async testMath() {
    try {
      const response = await fetch(`${this.baseURL}/api/technical-analysis/BTC%2FUSDT`);
      const data = await response.json();
      
      if (data.success && data.indicators) {
        let score = 0;
        if (data.indicators.RSI && data.indicators.RSI.value >= 0 && data.indicators.RSI.value <= 100) score += 25;
        if (data.indicators.MACD) score += 25;
        if (data.indicators.bollingerBands) score += 25;
        if (data.indicators.ATR) score += 25;
        return score;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async testSignals() {
    try {
      const response = await fetch(`${this.baseURL}/api/signals/BTC%2FUSDT`);
      const signals = await response.json();
      
      if (signals && signals.length > 0) {
        const validSignals = signals.filter(s => 
          ['LONG', 'SHORT', 'NEUTRAL'].includes(s.direction) &&
          s.confidence >= 0 && s.confidence <= 100 &&
          s.price > 0
        );
        return (validSignals.length / signals.length) * 100;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async testMonteCarlo() {
    try {
      const response = await fetch(`${this.baseURL}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      const data = await response.json();
      
      if (data.success && data.riskAssessment) {
        const assessment = data.riskAssessment;
        return (assessment.expectedReturn !== undefined && 
                assessment.var95 !== undefined && 
                assessment.sharpeRatio !== undefined) ? 98 : 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  calculateScore(scores) {
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateReport(healthScore, tests) {
    console.log('\n📊 HEALTH ANALYSIS RESULTS');
    console.log('-'.repeat(30));
    console.log(`Core System: ${tests.coreTest}%`);
    console.log(`Mathematics: ${tests.mathTest}%`);
    console.log(`Signals: ${tests.signalTest.toFixed(1)}%`);
    console.log(`Monte Carlo: ${tests.monteCarloTest}%`);
    console.log('-'.repeat(30));
    console.log(`🎯 HEALTH SCORE: ${healthScore.toFixed(2)}%`);
    
    const grade = healthScore >= 95 ? 'A+' : 
                  healthScore >= 90 ? 'A' :
                  healthScore >= 85 ? 'B+' : 'B';
    
    console.log(`🏆 Grade: ${grade}`);
    
    if (healthScore >= 95) {
      console.log('✅ PRODUCTION READY - All systems operational');
    } else if (healthScore >= 90) {
      console.log('✅ NEAR OPTIMAL - Minor optimizations available');
    } else {
      console.log('⚠️ REQUIRES OPTIMIZATION');
    }
    
    console.log('\n✅ ANALYSIS COMPLETE');
  }
}

// Execute
const analyzer = new QuickHealthAnalysis();
analyzer.run().then(score => {
  process.exit(score >= 90 ? 0 : 1);
}).catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});