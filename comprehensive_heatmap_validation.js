/**
 * Comprehensive Heatmap Validation System
 * Validates all 50 cryptocurrency pairs display consistently across all 10 timeframes
 */

class ComprehensiveHeatmapValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    this.expectedPairs = 50;
    this.validationResults = {};
    this.issues = [];
  }

  async runCompleteValidation() {
    console.log('🔄 Starting comprehensive heatmap validation across all timeframes');
    console.log(`📊 Testing ${this.timeframes.length} timeframes for ${this.expectedPairs} pairs each`);
    
    for (const timeframe of this.timeframes) {
      console.log(`\n⏱️  Validating timeframe: ${timeframe}`);
      await this.validateTimeframe(timeframe);
      await this.sleep(500); // Prevent rate limiting
    }
    
    this.generateValidationReport();
    return this.validationResults;
  }

  async validateTimeframe(timeframe) {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-heatmap?timeframe=${timeframe}`);
      const data = await response.json();
      
      if (!data.marketEntries || !Array.isArray(data.marketEntries)) {
        this.issues.push(`❌ ${timeframe}: No market entries found`);
        this.validationResults[timeframe] = { status: 'FAILED', count: 0, issues: ['No data'] };
        return;
      }
      
      const entryCount = data.marketEntries.length;
      const signals = this.analyzeSignalDistribution(data.marketEntries);
      const missingPairs = this.findMissingPairs(data.marketEntries);
      
      console.log(`   📈 Found ${entryCount}/${this.expectedPairs} pairs`);
      console.log(`   🎯 Signal distribution: ${signals.long} LONG, ${signals.short} SHORT, ${signals.neutral} NEUTRAL`);
      
      if (entryCount !== this.expectedPairs) {
        this.issues.push(`❌ ${timeframe}: Expected ${this.expectedPairs} pairs, got ${entryCount}`);
        if (missingPairs.length > 0) {
          console.log(`   ⚠️  Missing pairs: ${missingPairs.join(', ')}`);
        }
      }
      
      // Validate each entry has required fields
      const validationIssues = this.validateEntryStructure(data.marketEntries, timeframe);
      
      this.validationResults[timeframe] = {
        status: entryCount === this.expectedPairs && validationIssues.length === 0 ? 'PASSED' : 'FAILED',
        count: entryCount,
        expected: this.expectedPairs,
        signals: signals,
        missingPairs: missingPairs,
        issues: validationIssues
      };
      
    } catch (error) {
      console.error(`❌ Error validating ${timeframe}:`, error.message);
      this.issues.push(`❌ ${timeframe}: Request failed - ${error.message}`);
      this.validationResults[timeframe] = { 
        status: 'ERROR', 
        count: 0, 
        issues: [error.message] 
      };
    }
  }

  analyzeSignalDistribution(entries) {
    const distribution = { long: 0, short: 0, neutral: 0 };
    
    entries.forEach(entry => {
      if (entry.signals && entry.signals[Object.keys(entry.signals)[0]]) {
        const signal = entry.signals[Object.keys(entry.signals)[0]];
        const direction = signal.direction?.toUpperCase();
        if (direction === 'LONG') distribution.long++;
        else if (direction === 'SHORT') distribution.short++;
        else distribution.neutral++;
      }
    });
    
    return distribution;
  }

  findMissingPairs(entries) {
    const expectedSymbols = [
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'SOL/USDT', 'USDC/USD', 'ADA/USDT', 'AVAX/USDT',
      'DOGE/USDT', 'TRX/USDT', 'TON/USDT', 'LINK/USDT', 'MATIC/USDT', 'SHIB/USDT', 'LTC/USDT', 'BCH/USDT',
      'UNI/USDT', 'DOT/USDT', 'XLM/USDT', 'ATOM/USDT', 'XMR/USDT', 'ETC/USDT', 'HBAR/USDT', 'FIL/USDT',
      'ICP/USDT', 'VET/USDT', 'APT/USDT', 'NEAR/USDT', 'AAVE/USDT', 'ARB/USDT', 'OP/USDT', 'MKR/USDT',
      'GRT/USDT', 'STX/USDT', 'INJ/USDT', 'ALGO/USDT', 'LDO/USDT', 'THETA/USDT', 'SUI/USDT', 'RUNE/USDT',
      'MANA/USDT', 'SAND/USDT', 'FET/USDT', 'RNDR/USDT', 'KAVA/USDT', 'MINA/USDT', 'FLOW/USDT', 'XTZ/USDT',
      'BLUR/USDT', 'QNT/USDT'
    ];
    
    const foundSymbols = entries.map(entry => entry.symbol);
    return expectedSymbols.filter(symbol => !foundSymbols.includes(symbol));
  }

  validateEntryStructure(entries, timeframe) {
    const issues = [];
    
    entries.forEach((entry, index) => {
      // Validate required fields
      if (!entry.symbol) issues.push(`Entry ${index}: Missing symbol`);
      if (!entry.currentPrice || entry.currentPrice <= 0) issues.push(`Entry ${index}: Invalid price`);
      if (!entry.signals || Object.keys(entry.signals).length === 0) issues.push(`Entry ${index}: Missing signals`);
      
      // Validate signal structure
      if (entry.signals && entry.signals[timeframe]) {
        const signal = entry.signals[timeframe];
        if (!signal.direction) issues.push(`Entry ${index}: Missing signal direction`);
        if (typeof signal.confidence !== 'number') issues.push(`Entry ${index}: Invalid confidence`);
        if (!signal.entryPrice || signal.entryPrice <= 0) issues.push(`Entry ${index}: Invalid entry price`);
      }
    });
    
    return issues;
  }

  generateValidationReport() {
    console.log('\n📋 COMPREHENSIVE HEATMAP VALIDATION REPORT');
    console.log('='.repeat(60));
    
    const totalTests = this.timeframes.length;
    const passedTests = Object.values(this.validationResults).filter(r => r.status === 'PASSED').length;
    const failedTests = Object.values(this.validationResults).filter(r => r.status === 'FAILED').length;
    const errorTests = Object.values(this.validationResults).filter(r => r.status === 'ERROR').length;
    
    console.log(`📊 Overall Results: ${passedTests}/${totalTests} timeframes passed`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`🚫 Errors: ${errorTests}`);
    
    // Detailed results per timeframe
    console.log('\n📝 Detailed Results:');
    this.timeframes.forEach(timeframe => {
      const result = this.validationResults[timeframe];
      if (!result) return;
      
      const status = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '🚫';
      console.log(`${status} ${timeframe}: ${result.count}/${result.expected} pairs`);
      
      if (result.signals) {
        console.log(`     Signals: ${result.signals.long}L/${result.signals.short}S/${result.signals.neutral}N`);
      }
      
      if (result.missingPairs && result.missingPairs.length > 0) {
        console.log(`     Missing: ${result.missingPairs.slice(0, 3).join(', ')}${result.missingPairs.length > 3 ? '...' : ''}`);
      }
      
      if (result.issues && result.issues.length > 0) {
        console.log(`     Issues: ${result.issues.length} validation errors`);
      }
    });
    
    // Critical issues summary
    if (this.issues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      this.issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    // Success criteria
    const allTimeframesPassed = passedTests === totalTests;
    const consistentPairCount = Object.values(this.validationResults).every(r => r.count === this.expectedPairs);
    
    console.log('\n🎯 Success Criteria:');
    console.log(`   All timeframes display 50 pairs: ${consistentPairCount ? '✅' : '❌'}`);
    console.log(`   All timeframes pass validation: ${allTimeframesPassed ? '✅' : '❌'}`);
    console.log(`   No critical errors: ${errorTests === 0 ? '✅' : '❌'}`);
    
    const overallSuccess = allTimeframesPassed && consistentPairCount && errorTests === 0;
    console.log(`\n🏆 OVERALL STATUS: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS ATTENTION'}`);
    
    return {
      success: overallSuccess,
      passed: passedTests,
      total: totalTests,
      consistentPairs: consistentPairCount,
      summary: {
        passed: passedTests,
        failed: failedTests,
        errors: errorTests,
        issues: this.issues.length
      }
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run validation
import fs from 'fs';

async function main() {
  try {
    const validator = new ComprehensiveHeatmapValidator();
    const results = await validator.runCompleteValidation();
    
    console.log('\n💾 Exporting validation results...');
    fs.writeFileSync(
      `heatmap_validation_results_${Date.now()}.json`,
      JSON.stringify(results, null, 2)
    );
    
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();