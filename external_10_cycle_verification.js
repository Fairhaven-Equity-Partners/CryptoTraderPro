/**
 * External Shell 10-Cycle Verification System
 * Validates all 50 cryptocurrency pairs display consistently across all timeframes
 * Tests system stability and data consistency over multiple cycles
 */

import fs from 'fs';

class External10CycleVerifier {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    this.expectedPairs = 50;
    this.cycles = 10;
    this.verificationResults = [];
    this.criticalIssues = [];
    this.consistencyReport = {};
  }

  async runExternalVerification() {
    console.log('🚀 Starting External Shell 10-Cycle Verification');
    console.log(`📊 Testing ${this.timeframes.length} timeframes × ${this.cycles} cycles = ${this.timeframes.length * this.cycles} total tests`);
    console.log('⏱️  Expected completion time: ~2 minutes\n');

    for (let cycle = 1; cycle <= this.cycles; cycle++) {
      console.log(`🔄 CYCLE ${cycle}/${this.cycles} - Starting comprehensive timeframe validation`);
      
      const cycleStartTime = Date.now();
      const cycleResults = await this.runSingleCycle(cycle);
      const cycleDuration = Date.now() - cycleStartTime;
      
      this.verificationResults.push({
        cycle,
        duration: cycleDuration,
        results: cycleResults,
        timestamp: new Date().toISOString()
      });
      
      const passedTimeframes = cycleResults.filter(r => r.status === 'PASSED').length;
      console.log(`✅ Cycle ${cycle} completed in ${cycleDuration}ms - ${passedTimeframes}/${this.timeframes.length} timeframes passed\n`);
      
      // Brief pause between cycles to prevent overwhelming the system
      await this.sleep(200);
    }
    
    this.analyzeConsistency();
    this.generateFinalReport();
  }

  async runSingleCycle(cycleNumber) {
    const cycleResults = [];
    
    for (const timeframe of this.timeframes) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}/api/market-heatmap?timeframe=${timeframe}&_cycle=${cycleNumber}&_ts=${Date.now()}`);
        const responseTime = Date.now() - startTime;
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const validation = this.validateTimeframeData(data, timeframe, cycleNumber);
        
        cycleResults.push({
          timeframe,
          cycle: cycleNumber,
          status: validation.status,
          pairCount: validation.pairCount,
          responseTime,
          signalDistribution: validation.signalDistribution,
          issues: validation.issues,
          missingPairs: validation.missingPairs
        });
        
        const statusIcon = validation.status === 'PASSED' ? '✅' : validation.status === 'FAILED' ? '❌' : '🚫';
        process.stdout.write(`   ${statusIcon} ${timeframe}:${validation.pairCount} `);
        
      } catch (error) {
        this.criticalIssues.push(`Cycle ${cycleNumber} ${timeframe}: ${error.message}`);
        cycleResults.push({
          timeframe,
          cycle: cycleNumber,
          status: 'ERROR',
          pairCount: 0,
          responseTime: 0,
          issues: [error.message]
        });
        process.stdout.write(`   🚫 ${timeframe}:ERR `);
      }
    }
    
    console.log(); // New line after timeframe results
    return cycleResults;
  }

  validateTimeframeData(data, timeframe, cycle) {
    const issues = [];
    let status = 'PASSED';
    
    // Validate basic response structure
    if (!data || !data.marketEntries || !Array.isArray(data.marketEntries)) {
      return {
        status: 'FAILED',
        pairCount: 0,
        issues: ['Invalid response structure'],
        signalDistribution: { long: 0, short: 0, neutral: 0 },
        missingPairs: []
      };
    }
    
    const entries = data.marketEntries;
    const pairCount = entries.length;
    
    // Critical: Must have exactly 50 pairs
    if (pairCount !== this.expectedPairs) {
      issues.push(`Expected ${this.expectedPairs} pairs, got ${pairCount}`);
      status = 'FAILED';
    }
    
    // Analyze signal distribution
    const signalDistribution = this.analyzeSignalDistribution(entries, timeframe);
    
    // Find missing pairs
    const missingPairs = this.findMissingPairs(entries);
    if (missingPairs.length > 0) {
      issues.push(`Missing pairs: ${missingPairs.join(', ')}`);
      status = 'FAILED';
    }
    
    // Validate entry quality
    const qualityIssues = this.validateEntryQuality(entries, timeframe);
    if (qualityIssues.length > 0) {
      issues.push(...qualityIssues);
      if (qualityIssues.length > 5) status = 'FAILED'; // Too many quality issues
    }
    
    return {
      status,
      pairCount,
      signalDistribution,
      issues,
      missingPairs
    };
  }

  analyzeSignalDistribution(entries, timeframe) {
    const distribution = { long: 0, short: 0, neutral: 0, invalid: 0 };
    
    entries.forEach(entry => {
      if (entry.signals && entry.signals[timeframe]) {
        const direction = entry.signals[timeframe].direction?.toUpperCase();
        if (direction === 'LONG') distribution.long++;
        else if (direction === 'SHORT') distribution.short++;
        else if (direction === 'NEUTRAL') distribution.neutral++;
        else distribution.invalid++;
      } else {
        distribution.invalid++;
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

  validateEntryQuality(entries, timeframe) {
    const issues = [];
    
    entries.forEach((entry, index) => {
      // Validate basic structure
      if (!entry.symbol) issues.push(`Entry ${index}: Missing symbol`);
      if (!entry.currentPrice || entry.currentPrice <= 0) issues.push(`Entry ${index}: Invalid price`);
      
      // Validate signals
      if (!entry.signals || !entry.signals[timeframe]) {
        issues.push(`Entry ${index}: Missing ${timeframe} signal`);
      } else {
        const signal = entry.signals[timeframe];
        if (!signal.direction) issues.push(`Entry ${index}: Missing signal direction`);
        if (typeof signal.confidence !== 'number' || signal.confidence < 0 || signal.confidence > 100) {
          issues.push(`Entry ${index}: Invalid confidence: ${signal.confidence}`);
        }
      }
    });
    
    return issues;
  }

  analyzeConsistency() {
    console.log('\n📊 Analyzing consistency across all cycles...');
    
    // Group results by timeframe
    this.timeframes.forEach(timeframe => {
      const timeframeResults = this.verificationResults.flatMap(cycle => 
        cycle.results.filter(r => r.timeframe === timeframe)
      );
      
      const pairCounts = timeframeResults.map(r => r.pairCount);
      const responseTimes = timeframeResults.map(r => r.responseTime).filter(t => t > 0);
      const passedCycles = timeframeResults.filter(r => r.status === 'PASSED').length;
      
      this.consistencyReport[timeframe] = {
        totalTests: timeframeResults.length,
        passedTests: passedCycles,
        successRate: (passedCycles / timeframeResults.length * 100).toFixed(1),
        pairCountConsistency: this.calculateConsistency(pairCounts),
        avgResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
        maxResponseTime: Math.max(...responseTimes, 0),
        minResponseTime: Math.min(...responseTimes, 999999)
      };
    });
  }

  calculateConsistency(values) {
    if (values.length === 0) return { consistent: false, range: 'N/A' };
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const allSame = min === max;
    
    return {
      consistent: allSame,
      range: allSame ? `${min}` : `${min}-${max}`,
      target: this.expectedPairs,
      meetsTarget: allSame && min === this.expectedPairs
    };
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 EXTERNAL SHELL 10-CYCLE VERIFICATION REPORT');
    console.log('='.repeat(80));
    
    const totalTests = this.verificationResults.length * this.timeframes.length;
    const allResults = this.verificationResults.flatMap(cycle => cycle.results);
    const passedTests = allResults.filter(r => r.status === 'PASSED').length;
    const failedTests = allResults.filter(r => r.status === 'FAILED').length;
    const errorTests = allResults.filter(r => r.status === 'ERROR').length;
    
    console.log(`📊 Overall Statistics:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
    console.log(`   Failed: ${failedTests} (${(failedTests/totalTests*100).toFixed(1)}%)`);
    console.log(`   Errors: ${errorTests} (${(errorTests/totalTests*100).toFixed(1)}%)`);
    
    console.log(`\n📈 Timeframe Consistency Analysis:`);
    this.timeframes.forEach(timeframe => {
      const report = this.consistencyReport[timeframe];
      const consistencyIcon = report.pairCountConsistency.consistent ? '✅' : '❌';
      const targetIcon = report.pairCountConsistency.meetsTarget ? '🎯' : '⚠️';
      
      console.log(`   ${consistencyIcon}${targetIcon} ${timeframe}: ${report.successRate}% success, ${report.pairCountConsistency.range} pairs, ${report.avgResponseTime}ms avg`);
    });
    
    // Critical issues summary
    if (this.criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues (${this.criticalIssues.length}):`);
      this.criticalIssues.slice(0, 10).forEach(issue => console.log(`   • ${issue}`));
      if (this.criticalIssues.length > 10) {
        console.log(`   • ... and ${this.criticalIssues.length - 10} more issues`);
      }
    }
    
    // Success criteria evaluation
    const perfectConsistency = Object.values(this.consistencyReport).every(r => r.pairCountConsistency.meetsTarget);
    const highSuccessRate = Object.values(this.consistencyReport).every(r => parseFloat(r.successRate) >= 90);
    const lowErrorRate = errorTests / totalTests < 0.05; // Less than 5% errors
    const fastResponse = Object.values(this.consistencyReport).every(r => r.avgResponseTime < 100); // Sub-100ms
    
    console.log(`\n🎯 Success Criteria:`);
    console.log(`   Perfect pair consistency (50/50): ${perfectConsistency ? '✅' : '❌'}`);
    console.log(`   High success rate (>90%): ${highSuccessRate ? '✅' : '❌'}`);
    console.log(`   Low error rate (<5%): ${lowErrorRate ? '✅' : '❌'}`);
    console.log(`   Fast response times (<100ms): ${fastResponse ? '✅' : '❌'}`);
    
    const overallSuccess = perfectConsistency && highSuccessRate && lowErrorRate && fastResponse;
    console.log(`\n🏆 FINAL VERDICT: ${overallSuccess ? '✅ SYSTEM VERIFIED' : '❌ ISSUES DETECTED'}`);
    
    // Export detailed results
    const exportData = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        errorTests,
        successRate: (passedTests/totalTests*100).toFixed(1),
        overallSuccess,
        criticalIssuesCount: this.criticalIssues.length
      },
      consistencyReport: this.consistencyReport,
      criticalIssues: this.criticalIssues,
      detailedResults: this.verificationResults,
      timestamp: new Date().toISOString()
    };
    
    const filename = `external_10cycle_verification_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Detailed results exported to: ${filename}`);
    
    return overallSuccess;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute verification
async function main() {
  try {
    const verifier = new External10CycleVerifier();
    const success = await verifier.runExternalVerification();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ External verification failed:', error);
    process.exit(1);
  }
}

main();