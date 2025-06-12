/**
 * Mathematical Accuracy Final Validation
 * Comprehensive test of all risk calculations after fixes
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';

class MathematicalAccuracyValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.validationResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalErrors: [],
      validatedSymbols: [],
      mathematicalAccuracy: 0
    };
  }

  async runFinalValidation() {
    console.log('\n🧮 MATHEMATICAL ACCURACY FINAL VALIDATION');
    console.log('=' .repeat(70));
    
    // Test all risk calculations across multiple endpoints
    await this.validateHeatmapRiskCalculations();
    await this.validateSignalDashboardCalculations();
    await this.validateSimpleMarketDataCalculations();
    
    // Generate final mathematical report
    this.generateFinalMathematicalReport();
    
    return this.validationResults;
  }

  async validateHeatmapRiskCalculations() {
    console.log('\n📊 Validating Heatmap Risk Calculations...');
    
    try {
      const heatmapData = await this.makeRequest('/api/market-heatmap');
      const symbols = heatmapData.marketEntries?.slice(0, 15) || [];
      
      for (const entry of symbols) {
        if (entry.signals) {
          Object.entries(entry.signals).forEach(([timeframe, signal]) => {
            if (signal && signal.stopLoss && signal.takeProfit && signal.direction) {
              this.validateRiskCalculation(
                entry.symbol,
                timeframe,
                entry.currentPrice,
                signal.stopLoss,
                signal.takeProfit,
                signal.direction,
                'heatmap'
              );
            }
          });
        }
      }
      
    } catch (error) {
      console.log(`Error validating heatmap: ${error.message}`);
    }
  }

  async validateSignalDashboardCalculations() {
    console.log('\n🎯 Validating Signal Dashboard Calculations...');
    
    try {
      // Test major symbols
      const testSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'BNB/USDT'];
      
      for (const symbol of testSymbols) {
        const signalData = await this.makeRequest(`/api/crypto/${symbol.replace('/', '/')}`);
        
        if (signalData && signalData.signals) {
          Object.entries(signalData.signals).forEach(([timeframe, signal]) => {
            if (signal && signal.stopLoss && signal.takeProfit && signal.direction) {
              this.validateRiskCalculation(
                symbol,
                timeframe,
                signalData.currentPrice,
                signal.stopLoss,
                signal.takeProfit,
                signal.direction,
                'dashboard'
              );
            }
          });
        }
      }
      
    } catch (error) {
      console.log(`Error validating dashboard: ${error.message}`);
    }
  }

  async validateSimpleMarketDataCalculations() {
    console.log('\n📈 Validating Simple Market Data Calculations...');
    
    try {
      const simpleData = await this.makeRequest('/api/simple-market-data');
      const symbols = simpleData.data?.slice(0, 10) || [];
      
      for (const entry of symbols) {
        if (entry.signals) {
          Object.entries(entry.signals).forEach(([timeframe, signal]) => {
            if (signal && signal.stopLoss && signal.takeProfit && signal.direction) {
              this.validateRiskCalculation(
                entry.symbol,
                timeframe,
                entry.currentPrice,
                signal.stopLoss,
                signal.takeProfit,
                signal.direction,
                'simple-data'
              );
            }
          });
        }
      }
      
    } catch (error) {
      console.log(`Error validating simple data: ${error.message}`);
    }
  }

  validateRiskCalculation(symbol, timeframe, entryPrice, stopLoss, takeProfit, direction, source) {
    this.validationResults.totalTests++;
    
    let isValid = true;
    const errors = [];
    
    // Mathematical validation for SHORT positions
    if (direction === 'SHORT') {
      // Stop loss should be ABOVE entry price for SHORT positions
      if (stopLoss <= entryPrice) {
        isValid = false;
        errors.push('Stop loss should be above entry price for SHORT positions');
        this.validationResults.criticalErrors.push({
          symbol,
          timeframe,
          direction,
          source,
          issue: 'INVERTED_STOP_LOSS',
          entryPrice,
          stopLoss,
          expected: 'stopLoss > entryPrice',
          actual: `${stopLoss} <= ${entryPrice}`
        });
      }
      
      // Take profit should be BELOW entry price for SHORT positions
      if (takeProfit >= entryPrice) {
        isValid = false;
        errors.push('Take profit should be below entry price for SHORT positions');
        this.validationResults.criticalErrors.push({
          symbol,
          timeframe,
          direction,
          source,
          issue: 'INVERTED_TAKE_PROFIT',
          entryPrice,
          takeProfit,
          expected: 'takeProfit < entryPrice',
          actual: `${takeProfit} >= ${entryPrice}`
        });
      }
    }
    
    // Mathematical validation for LONG positions
    else if (direction === 'LONG') {
      // Stop loss should be BELOW entry price for LONG positions
      if (stopLoss >= entryPrice) {
        isValid = false;
        errors.push('Stop loss should be below entry price for LONG positions');
        this.validationResults.criticalErrors.push({
          symbol,
          timeframe,
          direction,
          source,
          issue: 'INVERTED_STOP_LOSS',
          entryPrice,
          stopLoss,
          expected: 'stopLoss < entryPrice',
          actual: `${stopLoss} >= ${entryPrice}`
        });
      }
      
      // Take profit should be ABOVE entry price for LONG positions
      if (takeProfit <= entryPrice) {
        isValid = false;
        errors.push('Take profit should be above entry price for LONG positions');
        this.validationResults.criticalErrors.push({
          symbol,
          timeframe,
          direction,
          source,
          issue: 'INVERTED_TAKE_PROFIT',
          entryPrice,
          takeProfit,
          expected: 'takeProfit > entryPrice',
          actual: `${takeProfit} <= ${entryPrice}`
        });
      }
    }
    
    // Record results
    if (isValid) {
      this.validationResults.passedTests++;
      console.log(`  ✓ ${symbol} ${timeframe} ${direction} (${source})`);
    } else {
      this.validationResults.failedTests++;
      console.log(`  ✗ ${symbol} ${timeframe} ${direction} (${source}) - ${errors.join(', ')}`);
    }
    
    // Track validated symbols
    if (!this.validationResults.validatedSymbols.includes(symbol)) {
      this.validationResults.validatedSymbols.push(symbol);
    }
  }

  generateFinalMathematicalReport() {
    console.log('\n📋 FINAL MATHEMATICAL VALIDATION REPORT');
    console.log('=' .repeat(70));
    
    // Calculate accuracy percentage
    this.validationResults.mathematicalAccuracy = this.validationResults.totalTests > 0 
      ? Math.round((this.validationResults.passedTests / this.validationResults.totalTests) * 100)
      : 0;
    
    console.log(`\n📊 VALIDATION RESULTS:`);
    console.log(`  Total Tests: ${this.validationResults.totalTests}`);
    console.log(`  Passed Tests: ${this.validationResults.passedTests}`);
    console.log(`  Failed Tests: ${this.validationResults.failedTests}`);
    console.log(`  Mathematical Accuracy: ${this.validationResults.mathematicalAccuracy}%`);
    console.log(`  Validated Symbols: ${this.validationResults.validatedSymbols.length}`);
    
    if (this.validationResults.criticalErrors.length > 0) {
      console.log(`\n🚨 CRITICAL MATHEMATICAL ERRORS FOUND:`);
      
      // Group errors by type
      const errorsByType = this.validationResults.criticalErrors.reduce((acc, error) => {
        if (!acc[error.issue]) acc[error.issue] = [];
        acc[error.issue].push(error);
        return acc;
      }, {});
      
      Object.entries(errorsByType).forEach(([errorType, errors]) => {
        console.log(`\n  ${errorType}: ${errors.length} occurrences`);
        errors.slice(0, 3).forEach(error => {
          console.log(`    ${error.symbol} ${error.timeframe} ${error.direction} (${error.source})`);
          console.log(`      Expected: ${error.expected}`);
          console.log(`      Actual: ${error.actual}`);
        });
        if (errors.length > 3) {
          console.log(`    ... and ${errors.length - 3} more`);
        }
      });
    } else {
      console.log(`\n✅ NO CRITICAL MATHEMATICAL ERRORS FOUND`);
      console.log(`All risk calculations are mathematically correct!`);
    }
    
    // System health assessment
    console.log(`\n🏥 SYSTEM HEALTH ASSESSMENT:`);
    if (this.validationResults.mathematicalAccuracy >= 100) {
      console.log(`  Status: PERFECT - 100% mathematical accuracy achieved`);
      console.log(`  Risk Level: ZERO - All calculations are mathematically sound`);
      console.log(`  Recommendation: System ready for production deployment`);
    } else if (this.validationResults.mathematicalAccuracy >= 95) {
      console.log(`  Status: EXCELLENT - ${this.validationResults.mathematicalAccuracy}% mathematical accuracy`);
      console.log(`  Risk Level: MINIMAL - Minor issues that should be addressed`);
      console.log(`  Recommendation: Address remaining errors before production`);
    } else if (this.validationResults.mathematicalAccuracy >= 80) {
      console.log(`  Status: GOOD - ${this.validationResults.mathematicalAccuracy}% mathematical accuracy`);
      console.log(`  Risk Level: MODERATE - Some mathematical errors need fixing`);
      console.log(`  Recommendation: Fix critical errors before deployment`);
    } else {
      console.log(`  Status: CRITICAL - ${this.validationResults.mathematicalAccuracy}% mathematical accuracy`);
      console.log(`  Risk Level: HIGH - Significant mathematical errors present`);
      console.log(`  Recommendation: IMMEDIATE FIX REQUIRED - Do not deploy`);
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      mathematicalAccuracy: this.validationResults.mathematicalAccuracy,
      totalTests: this.validationResults.totalTests,
      passedTests: this.validationResults.passedTests,
      failedTests: this.validationResults.failedTests,
      criticalErrors: this.validationResults.criticalErrors,
      validatedSymbols: this.validationResults.validatedSymbols,
      systemHealth: this.validationResults.mathematicalAccuracy >= 100 ? 'PERFECT' : 
                   this.validationResults.mathematicalAccuracy >= 95 ? 'EXCELLENT' :
                   this.validationResults.mathematicalAccuracy >= 80 ? 'GOOD' : 'CRITICAL'
    };
    
    fs.writeFile(
      `mathematical_accuracy_final_report_${Date.now()}.json`,
      JSON.stringify(reportData, null, 2)
    ).catch(console.error);
    
    console.log(`\n📄 Detailed report saved to mathematical_accuracy_final_report_[timestamp].json`);
  }

  async makeRequest(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();
    if (text.trim().startsWith('<!DOCTYPE html>')) {
      throw new Error('Received HTML instead of JSON');
    }
    return JSON.parse(text);
  }
}

// Execute final validation
async function main() {
  const validator = new MathematicalAccuracyValidator();
  const results = await validator.runFinalValidation();
  
  console.log('\n✅ MATHEMATICAL ACCURACY VALIDATION COMPLETE');
  
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MathematicalAccuracyValidator };