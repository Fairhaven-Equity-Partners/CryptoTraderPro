/**
 * FINAL DEPLOYMENT READINESS VALIDATION
 * Comprehensive 15-Cycle Testing - All Critical Systems
 */

class FinalDeploymentValidation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testPairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'ADA/USDT'];
    this.results = {
      crossPairSwitching: { success: 0, failed: 0 },
      technicalAnalysis: { success: 0, failed: 0 },
      riskAssessment: { success: 0, failed: 0 },
      signalGeneration: { success: 0, failed: 0 },
      performanceMetrics: { success: 0, failed: 0 },
      issues: []
    };
  }

  async runFinalValidation() {
    console.log('🚀 FINAL DEPLOYMENT READINESS VALIDATION - 15-Cycle Comprehensive Test\n');
    
    for (let cycle = 1; cycle <= 15; cycle++) {
      console.log(`🔄 CYCLE ${cycle}/15 - Full System Validation`);
      
      await this.validateCrossPairSwitching(cycle);
      await this.validateTechnicalAnalysisComponents(cycle);
      await this.validateRiskAssessmentComponents(cycle);
      await this.validateSignalGenerationFlow(cycle);
      await this.validatePerformanceMetrics(cycle);
      
      await this.sleep(100);
    }
    
    this.generateFinalReport();
  }

  async validateCrossPairSwitching(cycle) {
    // Test sequential pair switching
    for (let i = 0; i < this.testPairs.length - 1; i++) {
      const fromPair = this.testPairs[i];
      const toPair = this.testPairs[i + 1];
      
      try {
        const fromResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(fromPair)}`);
        await this.sleep(50);
        const toResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(toPair)}`);
        
        if (fromResponse.success && toResponse.success && 
            fromResponse.symbol === fromPair && toResponse.symbol === toPair &&
            fromResponse.currentPrice !== toResponse.currentPrice) {
          this.results.crossPairSwitching.success++;
        } else {
          this.results.crossPairSwitching.failed++;
          this.results.issues.push(`❌ Cycle ${cycle}: Cross-pair switching ${fromPair}→${toPair} failed`);
        }
      } catch (error) {
        this.results.crossPairSwitching.failed++;
        this.results.issues.push(`❌ Cycle ${cycle}: Cross-pair switching error: ${error.message}`);
      }
    }
  }

  async validateTechnicalAnalysisComponents(cycle) {
    const testPair = this.testPairs[cycle % this.testPairs.length];
    
    try {
      const response = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(testPair)}`);
      
      if (response.success && response.symbol === testPair && 
          response.data && response.data.indicators &&
          response.data.indicators.rsi && response.data.indicators.macd) {
        this.results.technicalAnalysis.success++;
        console.log(`  ✅ ${testPair}: Technical Analysis - RSI: ${response.data.indicators.rsi.value?.toFixed(2)}`);
      } else {
        this.results.technicalAnalysis.failed++;
        this.results.issues.push(`❌ Cycle ${cycle}: Technical analysis incomplete for ${testPair}`);
      }
    } catch (error) {
      this.results.technicalAnalysis.failed++;
      this.results.issues.push(`❌ Cycle ${cycle}: Technical analysis error: ${error.message}`);
    }
  }

  async validateRiskAssessmentComponents(cycle) {
    const testPair = this.testPairs[cycle % this.testPairs.length];
    
    try {
      const response = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(testPair)}`);
      
      if (response.success && response.symbol === testPair && 
          response.riskAssessment && 
          (response.riskAssessment.positionSize || response.riskAssessment.positionSizing)) {
        this.results.riskAssessment.success++;
        console.log(`  ✅ ${testPair}: Risk Assessment - Position: ${response.riskAssessment.positionSize || response.riskAssessment.positionSizing}`);
      } else {
        this.results.riskAssessment.failed++;
        this.results.issues.push(`❌ Cycle ${cycle}: Risk assessment incomplete for ${testPair}`);
      }
    } catch (error) {
      this.results.riskAssessment.failed++;
      this.results.issues.push(`❌ Cycle ${cycle}: Risk assessment error: ${error.message}`);
    }
  }

  async validateSignalGenerationFlow(cycle) {
    const testPair = this.testPairs[cycle % this.testPairs.length];
    
    try {
      const response = await this.makeRequest(`/api/signals/${encodeURIComponent(testPair)}`);
      
      if (Array.isArray(response) && response.length > 0 && 
          response[0].symbol === testPair && response[0].direction && response[0].confidence) {
        this.results.signalGeneration.success++;
        console.log(`  ✅ ${testPair}: Signal Generation - ${response.length} signals, ${response[0].direction} ${response[0].confidence}%`);
      } else {
        this.results.signalGeneration.failed++;
        this.results.issues.push(`❌ Cycle ${cycle}: Signal generation incomplete for ${testPair}`);
      }
    } catch (error) {
      this.results.signalGeneration.failed++;
      this.results.issues.push(`❌ Cycle ${cycle}: Signal generation error: ${error.message}`);
    }
  }

  async validatePerformanceMetrics(cycle) {
    try {
      const response = await this.makeRequest('/api/performance-metrics');
      
      if (response && typeof response === 'object') {
        this.results.performanceMetrics.success++;
        if (cycle % 5 === 0) console.log(`  ✅ Performance Metrics: Operational`);
      } else {
        this.results.performanceMetrics.failed++;
        this.results.issues.push(`❌ Cycle ${cycle}: Performance metrics failed`);
      }
    } catch (error) {
      this.results.performanceMetrics.failed++;
      this.results.issues.push(`❌ Cycle ${cycle}: Performance metrics error: ${error.message}`);
    }
  }

  generateFinalReport() {
    console.log('\n🎯 FINAL DEPLOYMENT READINESS REPORT');
    console.log('=====================================\n');
    
    const categories = [
      { name: 'Cross-Pair Switching', data: this.results.crossPairSwitching },
      { name: 'Technical Analysis', data: this.results.technicalAnalysis },
      { name: 'Risk Assessment', data: this.results.riskAssessment },
      { name: 'Signal Generation', data: this.results.signalGeneration },
      { name: 'Performance Metrics', data: this.results.performanceMetrics }
    ];
    
    let totalSuccess = 0;
    let totalTests = 0;
    
    console.log('📊 COMPONENT SUCCESS RATES:\n');
    categories.forEach(category => {
      const success = category.data.success;
      const failed = category.data.failed;
      const total = success + failed;
      const rate = total > 0 ? Math.round((success / total) * 100) : 0;
      
      console.log(`${category.name}: ${rate}% (${success}/${total})`);
      totalSuccess += success;
      totalTests += total;
    });
    
    const overallRate = Math.round((totalSuccess / totalTests) * 100);
    console.log(`\n🎯 OVERALL SUCCESS RATE: ${overallRate}% (${totalSuccess}/${totalTests})`);
    
    if (this.results.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      this.results.issues.slice(0, 10).forEach(issue => console.log(`   ${issue}`));
      if (this.results.issues.length > 10) {
        console.log(`   ... and ${this.results.issues.length - 10} more issues`);
      }
    } else {
      console.log('\n🎉 NO ISSUES FOUND - PLATFORM READY FOR DEPLOYMENT!');
    }
    
    console.log('\n🚀 DEPLOYMENT ASSESSMENT:');
    if (overallRate >= 98) {
      console.log('   ✅ PRODUCTION READY - Deploy immediately');
    } else if (overallRate >= 95) {
      console.log('   ✅ DEPLOYMENT READY - Minor monitoring recommended');
    } else if (overallRate >= 90) {
      console.log('   ⚠️ MOSTLY READY - Address critical issues first');
    } else {
      console.log('   ❌ NOT READY - Major issues must be resolved');
    }
    
    console.log('\n=====================================');
    
    return {
      overallRate,
      deploymentReady: overallRate >= 95,
      totalIssues: this.results.issues.length,
      componentStatus: categories.map(c => ({
        name: c.name,
        successRate: c.data.success + c.data.failed > 0 ? 
          Math.round((c.data.success / (c.data.success + c.data.failed)) * 100) : 0
      }))
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
  const validator = new FinalDeploymentValidation();
  await validator.runFinalValidation();
}

main().catch(console.error);