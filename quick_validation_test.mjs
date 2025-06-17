/**
 * QUICK VALIDATION TEST FOR 100% PERFECTION IMPLEMENTATION
 * Testing enhanced system with AI platform optimizations
 */

import fetch from 'node-fetch';

class QuickValidationTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {};
  }

  async runQuickValidation() {
    console.log('🎯 QUICK VALIDATION - 100% PERFECTION IMPLEMENTATION');
    console.log('==================================================');
    
    // Test enhanced signal generation
    await this.testEnhancedSignalGeneration();
    
    // Test technical analysis
    await this.testTechnicalAnalysis();
    
    // Test pattern recognition
    await this.testPatternRecognition();
    
    // Test Monte Carlo risk
    await this.testMonteCarloRisk();
    
    this.generateReport();
  }

  async testEnhancedSignalGeneration() {
    console.log('\n📊 Testing Enhanced Signal Generation...');
    try {
      const response = await fetch(`${this.baseUrl}/api/signals?symbol=BTC%2FUSDT&timeframe=4h`, {
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const signal = data[0];
          console.log(`   ✅ Signal: ${signal.direction} ${signal.confidence}%`);
          console.log(`   ✅ Entry: $${signal.entryPrice?.toLocaleString()}`);
          
          if (signal.reasoning && signal.reasoning.length > 0) {
            console.log(`   ✅ Reasoning: ${signal.reasoning.length} factors`);
          }
          
          this.results.signalGeneration = 'OPERATIONAL';
        } else {
          console.log('   ❌ No signal data');
          this.results.signalGeneration = 'NO_DATA';
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}`);
        this.results.signalGeneration = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.signalGeneration = 'FAILED';
    }
  }

  async testTechnicalAnalysis() {
    console.log('\n📈 Testing Technical Analysis...');
    try {
      const response = await fetch(`${this.baseUrl}/api/technical-analysis?symbol=BTC%2FUSDT&timeframe=4h`, {
        timeout: 8000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.indicators) {
          const indicatorCount = Object.keys(data.indicators).length;
          console.log(`   ✅ Indicators: ${indicatorCount} calculated`);
          this.results.technicalAnalysis = 'OPERATIONAL';
        } else {
          console.log('   ❌ Invalid data structure');
          this.results.technicalAnalysis = 'INVALID';
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}`);
        this.results.technicalAnalysis = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.technicalAnalysis = 'FAILED';
    }
  }

  async testPatternRecognition() {
    console.log('\n🔍 Testing Pattern Recognition...');
    try {
      const response = await fetch(`${this.baseUrl}/api/pattern-analysis/BTC%2FUSDT`, {
        timeout: 8000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.patterns) {
          console.log(`   ✅ Patterns: ${data.patterns.length} detected`);
          this.results.patternRecognition = 'OPERATIONAL';
        } else {
          console.log('   ❌ Invalid pattern data');
          this.results.patternRecognition = 'INVALID';
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}`);
        this.results.patternRecognition = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.patternRecognition = 'FAILED';
    }
  }

  async testMonteCarloRisk() {
    console.log('\n🎲 Testing Monte Carlo Risk Assessment...');
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '4h' }),
        timeout: 12000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.volatility !== undefined) {
          console.log(`   ✅ Risk Level: ${data.riskLevel}`);
          console.log(`   ✅ Volatility: ${data.volatility}%`);
          this.results.monteCarloRisk = 'OPERATIONAL';
        } else {
          console.log('   ❌ Invalid risk data');
          this.results.monteCarloRisk = 'INVALID';
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}`);
        this.results.monteCarloRisk = 'ERROR';
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.monteCarloRisk = 'FAILED';
    }
  }

  generateReport() {
    console.log('\n🎯 VALIDATION RESULTS');
    console.log('====================');
    console.log(`📊 Enhanced Signal Generation: ${this.results.signalGeneration}`);
    console.log(`📈 Technical Analysis: ${this.results.technicalAnalysis}`);
    console.log(`🔍 Pattern Recognition: ${this.results.patternRecognition}`);
    console.log(`🎲 Monte Carlo Risk: ${this.results.monteCarloRisk}`);
    
    const operationalCount = Object.values(this.results).filter(r => r === 'OPERATIONAL').length;
    const totalTests = Object.keys(this.results).length;
    const healthScore = ((operationalCount / totalTests) * 100).toFixed(1);
    
    console.log(`\n🎯 SYSTEM HEALTH: ${healthScore}%`);
    
    if (healthScore >= 75) {
      console.log('✅ ENHANCED SYSTEM OPERATIONAL - AI platform optimizations working correctly');
    } else {
      console.log('⚠️  System needs attention - some components not responding');
    }
  }
}

async function main() {
  const tester = new QuickValidationTest();
  await tester.runQuickValidation();
}

main().catch(console.error);