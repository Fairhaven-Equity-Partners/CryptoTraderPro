/**
 * CROSS-PAIR SWITCHING VALIDATION - Quick 10-Cycle Test
 * External Shell Testing - Focused Component Data Flow Validation
 */

class CrossPairValidation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testPairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    this.results = { success: 0, failed: 0, issues: [] };
  }

  async runValidation() {
    console.log('🔍 CROSS-PAIR SWITCHING VALIDATION - Component Data Flow Testing\n');
    
    for (let cycle = 1; cycle <= 10; cycle++) {
      console.log(`🔄 CYCLE ${cycle}/10`);
      
      for (const pair of this.testPairs) {
        try {
          // Test Technical Analysis API with symbol parameter
          const techResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(pair)}`);
          
          if (techResponse.success && techResponse.symbol === pair && techResponse.data && techResponse.data.indicators) {
            this.results.success++;
            console.log(`  ✅ ${pair}: Technical Analysis - RSI: ${techResponse.data.indicators.rsi?.value?.toFixed(2)}, Price: $${techResponse.currentPrice?.toFixed(4)}`);
          } else {
            this.results.failed++;
            this.results.issues.push(`❌ Cycle ${cycle}: ${pair} - Technical analysis incomplete`);
          }
          
          // Test Risk Assessment API
          const riskResponse = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(pair)}`);
          
          if (riskResponse.success && riskResponse.symbol === pair && riskResponse.riskAssessment) {
            this.results.success++;
            console.log(`  ✅ ${pair}: Risk Assessment - Position: ${riskResponse.riskAssessment.positionSize || riskResponse.riskAssessment.positionSizing}`);
          } else {
            this.results.failed++;
            this.results.issues.push(`❌ Cycle ${cycle}: ${pair} - Risk assessment incomplete`);
          }
          
          await this.sleep(50);
          
        } catch (error) {
          this.results.failed++;
          this.results.issues.push(`❌ Cycle ${cycle}: ${pair} - Request failed: ${error.message}`);
        }
      }
    }
    
    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 CROSS-PAIR SWITCHING VALIDATION REPORT');
    console.log('============================================\n');
    
    const totalTests = this.results.success + this.results.failed;
    const successRate = Math.round((this.results.success / totalTests) * 100);
    
    console.log(`🎯 SUCCESS RATE: ${successRate}% (${this.results.success}/${totalTests})`);
    console.log(`✅ Successful Tests: ${this.results.success}`);
    console.log(`❌ Failed Tests: ${this.results.failed}`);
    
    if (this.results.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      this.results.issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n🎉 NO ISSUES FOUND - CROSS-PAIR SWITCHING WORKING PERFECTLY!');
    }
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (successRate >= 95) {
      console.log('   ✅ EXCELLENT - Cross-pair switching fully operational');
    } else if (successRate >= 85) {
      console.log('   ⚠️ GOOD - Minor issues detected');
    } else {
      console.log('   ❌ CRITICAL - Major issues prevent proper switching');
    }
    
    return {
      successRate,
      ready: successRate >= 95,
      totalIssues: this.results.issues.length
    };
  }

  async makeRequest(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return await response.json();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const validator = new CrossPairValidation();
  await validator.runValidation();
}

main().catch(console.error);