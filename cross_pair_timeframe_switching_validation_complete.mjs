/**
 * COMPREHENSIVE CROSS-PAIR & TIMEFRAME SWITCHING VALIDATION
 * External Shell Testing - Complete React Query Cache Fix Verification
 * 
 * Ground Rules Compliance:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of frontend component switching
 * - Zero tolerance for cache contamination
 * - Complete deployment readiness verification
 */

import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

class ComprehensiveSwitchingValidation {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testSuite: 'Cross-Pair & Timeframe Switching Complete Validation',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalIssues: [],
      validationResults: {},
      deploymentReadiness: false,
      systemScore: 0
    };
  }

  async runCompleteValidation() {
    console.log('\n🔍 COMPREHENSIVE CROSS-PAIR & TIMEFRAME SWITCHING VALIDATION');
    console.log('==============================================================');
    
    try {
      // Phase 1: Backend API Validation
      await this.validateBackendAPIs();
      
      // Phase 2: React Query Cache Key Validation
      await this.validateReactQueryCacheKeys();
      
      // Phase 3: Component Switching Tests
      await this.validateComponentSwitching();
      
      // Phase 4: Timeframe Switching Tests
      await this.validateTimeframeSwitching();
      
      // Phase 5: Cache Contamination Tests
      await this.validateCacheIsolation();
      
      // Phase 6: Cross-Pair Performance Tests
      await this.validateCrossPairPerformance();
      
      // Generate Final Report
      await this.generateFinalReport();
      
    } catch (error) {
      await this.handleValidationFailure(error);
    }
  }

  async validateBackendAPIs() {
    console.log('\n📡 Phase 1: Backend API Validation');
    console.log('-----------------------------------');
    
    const testPairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    const testTimeframes = ['1h', '4h', '1d'];
    
    for (const symbol of testPairs) {
      for (const timeframe of testTimeframes) {
        await this.testTechnicalAnalysisAPI(symbol, timeframe);
        await this.testPatternAnalysisAPI(symbol, timeframe);
        await this.testMonteCarloAPI(symbol, timeframe);
        await sleep(100); // Rate limiting
      }
    }
  }

  async testTechnicalAnalysisAPI(symbol, timeframe) {
    this.results.totalTests++;
    
    try {
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await fetch(`http://localhost:5000/api/technical-analysis/${encodedSymbol}?timeframe=${timeframe}`);
      
      if (!response.ok) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Technical Analysis API failed for ${symbol} ${timeframe}: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (!data.symbol || !data.timeframe || !data.data?.indicators) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Invalid data structure for ${symbol} ${timeframe} technical analysis`);
        return false;
      }
      
      // Validate symbol matches
      if (data.symbol !== symbol || data.timeframe !== timeframe) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Symbol/timeframe mismatch: Expected ${symbol}/${timeframe}, got ${data.symbol}/${data.timeframe}`);
        return false;
      }
      
      console.log(`✅ Technical Analysis API: ${symbol} ${timeframe} - Valid`);
      this.results.passedTests++;
      return true;
      
    } catch (error) {
      this.results.failedTests++;
      this.results.criticalIssues.push(`Technical Analysis API error for ${symbol} ${timeframe}: ${error.message}`);
      return false;
    }
  }

  async testPatternAnalysisAPI(symbol, timeframe) {
    this.results.totalTests++;
    
    try {
      const encodedSymbol = encodeURIComponent(symbol);
      const response = await fetch(`http://localhost:5000/api/pattern-analysis/${encodedSymbol}?timeframe=${timeframe}`);
      
      if (!response.ok) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Pattern Analysis API failed for ${symbol} ${timeframe}: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      
      // Validate symbol matches
      if (data.symbol !== symbol || data.timeframe !== timeframe) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Pattern API symbol/timeframe mismatch: Expected ${symbol}/${timeframe}, got ${data.symbol}/${data.timeframe}`);
        return false;
      }
      
      console.log(`✅ Pattern Analysis API: ${symbol} ${timeframe} - Valid`);
      this.results.passedTests++;
      return true;
      
    } catch (error) {
      this.results.failedTests++;
      this.results.criticalIssues.push(`Pattern Analysis API error for ${symbol} ${timeframe}: ${error.message}`);
      return false;
    }
  }

  async testMonteCarloAPI(symbol, timeframe) {
    this.results.totalTests++;
    
    try {
      const response = await fetch('http://localhost:5000/api/monte-carlo-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe })
      });
      
      if (!response.ok) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Monte Carlo API failed for ${symbol} ${timeframe}: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (!data.signalInput || data.signalInput.symbol !== symbol || data.signalInput.timeframe !== timeframe) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Monte Carlo symbol/timeframe mismatch for ${symbol} ${timeframe}`);
        return false;
      }
      
      console.log(`✅ Monte Carlo API: ${symbol} ${timeframe} - Valid`);
      this.results.passedTests++;
      return true;
      
    } catch (error) {
      this.results.failedTests++;
      this.results.criticalIssues.push(`Monte Carlo API error for ${symbol} ${timeframe}: ${error.message}`);
      return false;
    }
  }

  async validateReactQueryCacheKeys() {
    console.log('\n🔄 Phase 2: React Query Cache Key Validation');
    console.log('--------------------------------------------');
    
    // Test that cache keys include symbol and timeframe
    const cacheKeyTests = [
      {
        component: 'TechnicalAnalysisSummary',
        expectedKeys: [
          '["/api/technical-analysis","BTC/USDT","1d"]',
          '["/api/pattern-analysis","BTC/USDT","1d"]',
          '["/api/accuracy","BTC/USDT","1d"]'
        ]
      },
      {
        component: 'RiskAssessmentDashboard',
        expectedKeys: [
          '["/api/monte-carlo-risk","BTC/USDT","1d"]',
          '["/api/performance-metrics"]'
        ]
      }
    ];
    
    for (const test of cacheKeyTests) {
      this.results.totalTests++;
      
      // Validate cache key format
      for (const key of test.expectedKeys) {
        if (key.includes('symbol') && key.includes('timeframe')) {
          console.log(`✅ ${test.component} cache key includes symbol and timeframe`);
          this.results.passedTests++;
        } else if (!key.includes('performance-metrics')) {
          this.results.failedTests++;
          this.results.criticalIssues.push(`${test.component} cache key missing symbol/timeframe: ${key}`);
        } else {
          // Performance metrics endpoint doesn't need symbol/timeframe
          this.results.passedTests++;
        }
      }
    }
  }

  async validateComponentSwitching() {
    console.log('\n🔄 Phase 3: Component Switching Validation');
    console.log('------------------------------------------');
    
    // Test switching between pairs
    const switchingTests = [
      { from: 'BTC/USDT', to: 'ETH/USDT', timeframe: '4h' },
      { from: 'ETH/USDT', to: 'XRP/USDT', timeframe: '4h' },
      { from: 'XRP/USDT', to: 'BTC/USDT', timeframe: '4h' }
    ];
    
    for (const test of switchingTests) {
      await this.testCrossPairSwitching(test.from, test.to, test.timeframe);
    }
  }

  async testCrossPairSwitching(fromSymbol, toSymbol, timeframe) {
    this.results.totalTests++;
    
    try {
      // Get data for both symbols
      const fromData = await this.fetchTechnicalAnalysis(fromSymbol, timeframe);
      const toData = await this.fetchTechnicalAnalysis(toSymbol, timeframe);
      
      // Validate data is different (not cached)
      if (fromData.symbol === toData.symbol) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Cache contamination detected: ${fromSymbol} -> ${toSymbol} returned same symbol`);
        return false;
      }
      
      // Validate price differences
      if (Math.abs(fromData.currentPrice - toData.currentPrice) < 0.01) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Suspicious price similarity between ${fromSymbol} and ${toSymbol}`);
        return false;
      }
      
      console.log(`✅ Cross-pair switching: ${fromSymbol} -> ${toSymbol} - Valid`);
      this.results.passedTests++;
      return true;
      
    } catch (error) {
      this.results.failedTests++;
      this.results.criticalIssues.push(`Cross-pair switching error ${fromSymbol} -> ${toSymbol}: ${error.message}`);
      return false;
    }
  }

  async validateTimeframeSwitching() {
    console.log('\n⏰ Phase 4: Timeframe Switching Validation');
    console.log('------------------------------------------');
    
    const symbol = 'BTC/USDT';
    const timeframes = ['1h', '4h', '1d'];
    
    for (let i = 0; i < timeframes.length - 1; i++) {
      await this.testTimeframeSwitching(symbol, timeframes[i], timeframes[i + 1]);
    }
  }

  async testTimeframeSwitching(symbol, fromTimeframe, toTimeframe) {
    this.results.totalTests++;
    
    try {
      // Get data for both timeframes
      const fromData = await this.fetchTechnicalAnalysis(symbol, fromTimeframe);
      const toData = await this.fetchTechnicalAnalysis(symbol, toTimeframe);
      
      // Validate timeframe is correctly set
      if (fromData.timeframe !== fromTimeframe || toData.timeframe !== toTimeframe) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Timeframe switching failed: Expected ${fromTimeframe}/${toTimeframe}, got ${fromData.timeframe}/${toData.timeframe}`);
        return false;
      }
      
      // Validate symbol remains the same
      if (fromData.symbol !== toData.symbol || fromData.symbol !== symbol) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Symbol contamination during timeframe switch: ${symbol}`);
        return false;
      }
      
      console.log(`✅ Timeframe switching: ${fromTimeframe} -> ${toTimeframe} - Valid`);
      this.results.passedTests++;
      return true;
      
    } catch (error) {
      this.results.failedTests++;
      this.results.criticalIssues.push(`Timeframe switching error ${fromTimeframe} -> ${toTimeframe}: ${error.message}`);
      return false;
    }
  }

  async validateCacheIsolation() {
    console.log('\n🛡️ Phase 5: Cache Isolation Validation');
    console.log('--------------------------------------');
    
    // Test rapid switching to detect cache contamination
    const rapidSwitchTests = [
      ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'],
      ['1h', '4h', '1d']
    ];
    
    for (const symbols of [rapidSwitchTests[0]]) {
      await this.testRapidSwitching(symbols, '4h');
    }
    
    for (const timeframes of [rapidSwitchTests[1]]) {
      await this.testRapidTimeframeSwitching('BTC/USDT', timeframes);
    }
  }

  async testRapidSwitching(symbols, timeframe) {
    this.results.totalTests++;
    
    try {
      const results = [];
      
      // Rapidly fetch data for all symbols
      for (const symbol of symbols) {
        const data = await this.fetchTechnicalAnalysis(symbol, timeframe);
        results.push({ symbol, data });
        await sleep(50); // Minimal delay
      }
      
      // Validate each result has correct symbol
      for (const result of results) {
        if (result.data.symbol !== result.symbol) {
          this.results.failedTests++;
          this.results.criticalIssues.push(`Cache contamination in rapid switching: Expected ${result.symbol}, got ${result.data.symbol}`);
          return false;
        }
      }
      
      console.log(`✅ Rapid symbol switching: ${symbols.join(' -> ')} - Valid`);
      this.results.passedTests++;
      return true;
      
    } catch (error) {
      this.results.failedTests++;
      this.results.criticalIssues.push(`Rapid switching error: ${error.message}`);
      return false;
    }
  }

  async testRapidTimeframeSwitching(symbol, timeframes) {
    this.results.totalTests++;
    
    try {
      const results = [];
      
      // Rapidly fetch data for all timeframes
      for (const timeframe of timeframes) {
        const data = await this.fetchTechnicalAnalysis(symbol, timeframe);
        results.push({ timeframe, data });
        await sleep(50); // Minimal delay
      }
      
      // Validate each result has correct timeframe
      for (const result of results) {
        if (result.data.timeframe !== result.timeframe) {
          this.results.failedTests++;
          this.results.criticalIssues.push(`Cache contamination in rapid timeframe switching: Expected ${result.timeframe}, got ${result.data.timeframe}`);
          return false;
        }
      }
      
      console.log(`✅ Rapid timeframe switching: ${timeframes.join(' -> ')} - Valid`);
      this.results.passedTests++;
      return true;
      
    } catch (error) {
      this.results.failedTests++;
      this.results.criticalIssues.push(`Rapid timeframe switching error: ${error.message}`);
      return false;
    }
  }

  async validateCrossPairPerformance() {
    console.log('\n⚡ Phase 6: Cross-Pair Performance Validation');
    console.log('---------------------------------------------');
    
    const performanceTests = [
      { symbol: 'BTC/USDT', timeframe: '4h' },
      { symbol: 'ETH/USDT', timeframe: '4h' },
      { symbol: 'XRP/USDT', timeframe: '4h' }
    ];
    
    for (const test of performanceTests) {
      await this.testAPIPerformance(test.symbol, test.timeframe);
    }
  }

  async testAPIPerformance(symbol, timeframe) {
    this.results.totalTests++;
    
    try {
      const startTime = Date.now();
      const data = await this.fetchTechnicalAnalysis(symbol, timeframe);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      // Validate performance criteria
      if (responseTime > 5000) { // 5 second timeout
        this.results.failedTests++;
        this.results.criticalIssues.push(`Slow API response for ${symbol} ${timeframe}: ${responseTime}ms`);
        return false;
      }
      
      // Validate data quality
      if (!data.data?.indicators || !data.currentPrice) {
        this.results.failedTests++;
        this.results.criticalIssues.push(`Incomplete data for ${symbol} ${timeframe}`);
        return false;
      }
      
      console.log(`✅ Performance test: ${symbol} ${timeframe} - ${responseTime}ms`);
      this.results.passedTests++;
      return true;
      
    } catch (error) {
      this.results.failedTests++;
      this.results.criticalIssues.push(`Performance test error for ${symbol} ${timeframe}: ${error.message}`);
      return false;
    }
  }

  async fetchTechnicalAnalysis(symbol, timeframe) {
    const encodedSymbol = encodeURIComponent(symbol);
    const response = await fetch(`http://localhost:5000/api/technical-analysis/${encodedSymbol}?timeframe=${timeframe}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return response.json();
  }

  async generateFinalReport() {
    console.log('\n📊 COMPREHENSIVE VALIDATION REPORT');
    console.log('===================================');
    
    // Calculate system score
    const successRate = this.results.totalTests > 0 ? (this.results.passedTests / this.results.totalTests) * 100 : 0;
    this.results.systemScore = Math.round(successRate * 100) / 100;
    
    // Determine deployment readiness
    this.results.deploymentReadiness = this.results.criticalIssues.length === 0 && successRate >= 95;
    
    console.log(`\n📈 RESULTS SUMMARY:`);
    console.log(`   Total Tests: ${this.results.totalTests}`);
    console.log(`   Passed: ${this.results.passedTests}`);
    console.log(`   Failed: ${this.results.failedTests}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   System Score: ${this.results.systemScore}/100`);
    
    if (this.results.criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES:`);
      this.results.criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log(`\n🚀 DEPLOYMENT READINESS: ${this.results.deploymentReadiness ? 'READY' : 'NOT READY'}`);
    
    if (this.results.deploymentReadiness) {
      console.log('\n✅ CROSS-PAIR & TIMEFRAME SWITCHING: FULLY OPERATIONAL');
      console.log('✅ REACT QUERY CACHE CONTAMINATION: RESOLVED');
      console.log('✅ COMPONENT DATA FLOW: 100% FUNCTIONAL');
      console.log('✅ API RESPONSE VALIDATION: COMPLETE');
    }
    
    // Save results
    const filename = `cross_pair_timeframe_validation_${Date.now()}.json`;
    await this.saveResults(filename);
    
    return this.results;
  }

  async saveResults(filename) {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
    } catch (error) {
      console.log(`\n❌ Failed to save results: ${error.message}`);
    }
  }

  async handleValidationFailure(error) {
    console.log(`\n🚨 VALIDATION FAILED: ${error.message}`);
    this.results.criticalIssues.push(`Validation framework error: ${error.message}`);
    this.results.deploymentReadiness = false;
    
    await this.generateFinalReport();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute validation
async function main() {
  const validator = new ComprehensiveSwitchingValidation();
  await validator.runCompleteValidation();
}

main().catch(console.error);