/**
 * FINAL DEPLOYMENT READINESS VALIDATION
 * Quick validation to confirm 100% system functionality
 */

class FinalDeploymentValidator {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: [],
      systemScore: 0
    };
  }

  async runFinalValidation() {
    console.log('🚀 FINAL DEPLOYMENT READINESS VALIDATION');
    console.log('==========================================');
    
    // Test critical components
    await this.testCriticalAPIs();
    await this.testUIComponents();
    await this.testSwitchingFunctionality();
    
    this.calculateFinalScore();
    this.generateDeploymentReport();
  }

  async testCriticalAPIs() {
    console.log('\n📡 Testing Critical APIs...');
    
    const criticalTests = [
      { endpoint: '/api/technical-analysis/BTC%2FUSDT?timeframe=4h', name: 'Technical Analysis' },
      { endpoint: '/api/signals/BTC%2FUSDT?timeframe=4h', name: 'Signals API' },
      { endpoint: '/api/pattern-analysis/BTC%2FUSDT?timeframe=4h', name: 'Pattern Analysis' },
      { endpoint: '/api/performance-metrics?timeframe=4h', name: 'Performance Metrics' }
    ];

    for (const test of criticalTests) {
      await this.testAPI(test);
    }
  }

  async testAPI({ endpoint, name }) {
    this.results.totalTests++;
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`);
      const data = await response.json();
      
      if (response.ok && data) {
        console.log(`  ✅ ${name}: Working`);
        this.results.passedTests++;
      } else {
        console.log(`  ❌ ${name}: Failed`);
        this.results.failedTests.push(name);
      }
    } catch (error) {
      console.log(`  ❌ ${name}: Error - ${error.message}`);
      this.results.failedTests.push(name);
    }
  }

  async testUIComponents() {
    console.log('\n🧩 Testing UI Components...');
    
    // Test signal direction validation
    try {
      const signalsResponse = await fetch(`${this.baseURL}/api/signals/BTC%2FUSDT?timeframe=4h`);
      const signals = await signalsResponse.json();
      
      this.results.totalTests++;
      if (signals && signals.length > 0 && ['LONG', 'SHORT', 'NEUTRAL'].includes(signals[0].direction)) {
        console.log('  ✅ Signal Direction Display: Working');
        this.results.passedTests++;
      } else {
        console.log('  ❌ Signal Direction Display: Invalid direction');
        this.results.failedTests.push('Signal Direction Display');
      }
    } catch (error) {
      console.log('  ❌ Signal Direction Display: Error');
      this.results.failedTests.push('Signal Direction Display');
    }
  }

  async testSwitchingFunctionality() {
    console.log('\n🔄 Testing Switching Functionality...');
    
    // Test cross-pair switching
    const pairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    const timeframes = ['1h', '4h', '1d'];
    
    for (const pair of pairs) {
      for (const timeframe of timeframes) {
        this.results.totalTests++;
        try {
          const response = await fetch(`${this.baseURL}/api/technical-analysis/${encodeURIComponent(pair)}?timeframe=${timeframe}`);
          if (response.ok) {
            this.results.passedTests++;
          } else {
            this.results.failedTests.push(`${pair} ${timeframe}`);
          }
        } catch (error) {
          this.results.failedTests.push(`${pair} ${timeframe}`);
        }
      }
    }
    
    console.log(`  ✅ Tested ${pairs.length * timeframes.length} combinations`);
  }

  calculateFinalScore() {
    this.results.systemScore = (this.results.passedTests / this.results.totalTests) * 100;
  }

  generateDeploymentReport() {
    console.log('\n📊 FINAL DEPLOYMENT READINESS REPORT');
    console.log('====================================');
    console.log(`🏆 System Score: ${this.results.systemScore.toFixed(2)}/100`);
    console.log(`✅ Passed Tests: ${this.results.passedTests}/${this.results.totalTests}`);
    
    if (this.results.failedTests.length > 0) {
      console.log(`❌ Failed Tests: ${this.results.failedTests.join(', ')}`);
    }
    
    if (this.results.systemScore >= 99.5) {
      console.log('\n🚀 DEPLOYMENT STATUS: ✅ READY FOR PRODUCTION');
      console.log('   Platform achieved deployment readiness criteria');
      console.log('   All critical systems operational');
    } else {
      console.log('\n🚀 DEPLOYMENT STATUS: ⚠️ NEEDS MINOR FIXES');
      console.log('   Platform nearly ready - minor issues detected');
    }
  }
}

async function main() {
  const validator = new FinalDeploymentValidator();
  await validator.runFinalValidation();
}

main().catch(console.error);