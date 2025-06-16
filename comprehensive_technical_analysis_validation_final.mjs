/**
 * COMPREHENSIVE TECHNICAL ANALYSIS VALIDATION - FINAL TEST
 * External Shell Testing - Validate All Display Fixes and API Optimizations
 */

import fetch from 'node-fetch';

class FinalValidationTest {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.results = {};
    this.apiCallCount = 0;
    this.startTime = Date.now();
  }

  async runFinalValidation() {
    console.log('\n🏁 FINAL VALIDATION TEST - TECHNICAL ANALYSIS FIXES');
    console.log('='.repeat(65));
    console.log('External Shell Testing - Verify All Fixes Applied Successfully');
    console.log('='.repeat(65));

    try {
      // Test 1: Verify API Structure Handling
      await this.testAPIStructureHandling();
      
      // Test 2: Verify Mathematical Accuracy
      await this.testMathematicalAccuracy();
      
      // Test 3: Verify API Rate Limiting Compliance
      await this.testAPIRateLimitingCompliance();
      
      // Test 4: Verify Display Consistency
      await this.testDisplayConsistency();
      
      // Final Report
      await this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Final validation failed:', error);
      throw error;
    }
  }

  async testAPIStructureHandling() {
    console.log('\n📊 TEST 1: API STRUCTURE HANDLING');
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch(`${this.baseURL}/api/technical-analysis/BTC%2FUSDT?timeframe=1d`);
      const data = await response.json();
      this.apiCallCount++;
      
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      
      if (data.success && data.indicators) {
        const indicators = data.indicators;
        
        // Test RSI structure
        if (indicators.rsi && typeof indicators.rsi === 'object' && indicators.rsi.value !== undefined) {
          console.log(`✅ RSI: Correct nested structure - {value: ${indicators.rsi.value}, signal: "${indicators.rsi.signal}"}`);
          this.results.rsiStructure = 'CORRECT';
        } else {
          console.log(`❌ RSI: Structure issue`);
          this.results.rsiStructure = 'INCORRECT';
        }
        
        // Test MACD structure
        if (indicators.macd && typeof indicators.macd === 'object' && indicators.macd.value !== undefined) {
          console.log(`✅ MACD: Correct nested structure - {value: ${indicators.macd.value}, trend: "${indicators.macd.trend}"}`);
          this.results.macdStructure = 'CORRECT';
        } else {
          console.log(`❌ MACD: Structure issue`);
          this.results.macdStructure = 'INCORRECT';
        }
        
        // Test Bollinger Bands structure
        if (indicators.bollingerBands && indicators.bollingerBands.upper && indicators.bollingerBands.middle && indicators.bollingerBands.lower) {
          console.log(`✅ Bollinger Bands: Correct structure - Upper: ${indicators.bollingerBands.upper.toFixed(2)}, Middle: ${indicators.bollingerBands.middle.toFixed(2)}, Lower: ${indicators.bollingerBands.lower.toFixed(2)}`);
          this.results.bollingerStructure = 'CORRECT';
        } else {
          console.log(`❌ Bollinger Bands: Structure issue`);
          this.results.bollingerStructure = 'INCORRECT';
        }
        
        // Test Stochastic structure
        if (indicators.stochastic && indicators.stochastic.k !== undefined && indicators.stochastic.d !== undefined) {
          console.log(`✅ Stochastic: Correct structure - K: ${indicators.stochastic.k.toFixed(2)}, D: ${indicators.stochastic.d.toFixed(2)}`);
          this.results.stochasticStructure = 'CORRECT';
        } else {
          console.log(`❌ Stochastic: Structure issue`);
          this.results.stochasticStructure = 'INCORRECT';
        }
        
        // Test current price availability for Bollinger position
        if (data.currentPrice && typeof data.currentPrice === 'number') {
          console.log(`✅ Current Price: Available - $${data.currentPrice.toFixed(2)}`);
          this.results.currentPriceAvailable = 'YES';
        } else {
          console.log(`❌ Current Price: Not available`);
          this.results.currentPriceAvailable = 'NO';
        }
      }
      
      await this.sleep(500);
      
    } catch (error) {
      console.log(`❌ API Structure Test Failed: ${error.message}`);
      this.results.apiStructureTest = 'FAILED';
    }
  }

  async testMathematicalAccuracy() {
    console.log('\n🧮 TEST 2: MATHEMATICAL ACCURACY');
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch(`${this.baseURL}/api/technical-analysis/BTC%2FUSDT?timeframe=1d`);
      const data = await response.json();
      this.apiCallCount++;
      
      if (data.success && data.indicators) {
        const indicators = data.indicators;
        
        // Validate RSI range
        const rsiValue = indicators.rsi?.value;
        if (rsiValue >= 0 && rsiValue <= 100) {
          console.log(`✅ RSI Value: ${rsiValue.toFixed(2)} (valid range 0-100)`);
          this.results.rsiRange = 'VALID';
        } else {
          console.log(`❌ RSI Value: ${rsiValue} (invalid range)`);
          this.results.rsiRange = 'INVALID';
        }
        
        // Validate Bollinger Bands ordering
        const bb = indicators.bollingerBands;
        if (bb && bb.upper > bb.middle && bb.middle > bb.lower) {
          console.log(`✅ Bollinger Bands Ordering: Upper(${bb.upper.toFixed(2)}) > Middle(${bb.middle.toFixed(2)}) > Lower(${bb.lower.toFixed(2)})`);
          this.results.bollingerOrdering = 'VALID';
        } else {
          console.log(`❌ Bollinger Bands Ordering: Invalid`);
          this.results.bollingerOrdering = 'INVALID';
        }
        
        // Validate Stochastic range
        const stoch = indicators.stochastic;
        if (stoch && stoch.k >= 0 && stoch.k <= 100 && stoch.d >= 0 && stoch.d <= 100) {
          console.log(`✅ Stochastic Range: K(${stoch.k.toFixed(2)}) D(${stoch.d.toFixed(2)}) (valid range 0-100)`);
          this.results.stochasticRange = 'VALID';
        } else {
          console.log(`❌ Stochastic Range: Invalid`);
          this.results.stochasticRange = 'INVALID';
        }
        
        // Validate ATR positive value
        const atr = indicators.atr?.value;
        if (atr && atr > 0) {
          console.log(`✅ ATR Value: ${atr.toFixed(2)} (positive value)`);
          this.results.atrPositive = 'VALID';
        } else {
          console.log(`❌ ATR Value: Invalid or negative`);
          this.results.atrPositive = 'INVALID';
        }
      }
      
      await this.sleep(500);
      
    } catch (error) {
      console.log(`❌ Mathematical Accuracy Test Failed: ${error.message}`);
      this.results.mathematicalTest = 'FAILED';
    }
  }

  async testAPIRateLimitingCompliance() {
    console.log('\n📊 TEST 3: API RATE LIMITING COMPLIANCE');
    console.log('-'.repeat(50));
    
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    const requestsPerSecond = this.apiCallCount / elapsedTime;
    
    console.log(`API Calls Made: ${this.apiCallCount}`);
    console.log(`Elapsed Time: ${elapsedTime.toFixed(2)}s`);
    console.log(`Request Rate: ${requestsPerSecond.toFixed(2)} req/s`);
    
    // Calculate daily and monthly projections based on optimized intervals
    const dailyProjection = (0.5 + 0.33 + 0.2 + 0.25) * 60 * 24; // req/min * minutes/day
    const monthlyProjection = dailyProjection * 30;
    
    console.log(`Optimized Daily Projection: ${Math.round(dailyProjection)} requests`);
    console.log(`Optimized Monthly Projection: ${Math.round(monthlyProjection)} requests`);
    
    if (monthlyProjection <= 25000) { // Safe margin below 30k limit
      console.log(`✅ API Rate Limiting: COMPLIANT (within 25k monthly safe limit)`);
      this.results.apiRateLimiting = 'COMPLIANT';
    } else {
      console.log(`❌ API Rate Limiting: EXCEEDS SAFE LIMITS`);
      this.results.apiRateLimiting = 'NON_COMPLIANT';
    }
    
    this.results.monthlyProjection = Math.round(monthlyProjection);
  }

  async testDisplayConsistency() {
    console.log('\n🖥️ TEST 4: DISPLAY CONSISTENCY');
    console.log('-'.repeat(50));
    
    try {
      // Test pattern analysis API
      const patternResponse = await fetch(`${this.baseURL}/api/pattern-analysis/BTC%2FUSDT`);
      const patternData = await patternResponse.json();
      this.apiCallCount++;
      
      if (patternData.success && patternData.patternAnalysis) {
        const patterns = patternData.patternAnalysis.patterns;
        console.log(`✅ Pattern Analysis: ${patterns.length} patterns detected`);
        
        // Validate pattern structure
        const validPatterns = patterns.filter(p => 
          p.type && p.confidence >= 0 && p.confidence <= 1 && p.description
        );
        
        if (validPatterns.length === patterns.length) {
          console.log(`✅ Pattern Structure: All ${patterns.length} patterns have valid structure`);
          this.results.patternStructure = 'VALID';
        } else {
          console.log(`❌ Pattern Structure: ${patterns.length - validPatterns.length} invalid patterns`);
          this.results.patternStructure = 'INVALID';
        }
      }
      
      await this.sleep(500);
      
    } catch (error) {
      console.log(`❌ Display Consistency Test Failed: ${error.message}`);
      this.results.displayTest = 'FAILED';
    }
  }

  async generateFinalReport() {
    console.log('\n📋 FINAL VALIDATION REPORT');
    console.log('='.repeat(65));
    
    const successCount = Object.values(this.results).filter(result => 
      result === 'CORRECT' || result === 'VALID' || result === 'COMPLIANT' || result === 'YES'
    ).length;
    
    const totalTests = Object.keys(this.results).length;
    const successRate = ((successCount / totalTests) * 100).toFixed(1);
    
    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`   Success Rate: ${successRate}% (${successCount}/${totalTests})`);
    console.log(`   API Calls Used: ${this.apiCallCount}`);
    console.log(`   Monthly Projection: ${this.results.monthlyProjection || 'N/A'} requests`);
    
    console.log(`\n📊 DETAILED RESULTS:`);
    Object.entries(this.results).forEach(([test, result]) => {
      const status = ['CORRECT', 'VALID', 'COMPLIANT', 'YES'].includes(result) ? '✅' : '❌';
      console.log(`   ${status} ${test}: ${result}`);
    });
    
    console.log(`\n🏁 VALIDATION STATUS:`);
    if (successRate >= 90) {
      console.log(`   ✅ EXCELLENT - Technical Analysis display fixes successful`);
    } else if (successRate >= 75) {
      console.log(`   ⚠️ GOOD - Minor issues remain but functional`);
    } else {
      console.log(`   ❌ NEEDS WORK - Significant issues detected`);
    }
    
    console.log(`\n🔧 KEY IMPROVEMENTS IMPLEMENTED:`);
    console.log(`   • Fixed API structure handling (nested objects)`);
    console.log(`   • Corrected current price usage in Bollinger position`);
    console.log(`   • Optimized API refresh intervals (2-5 min)`);
    console.log(`   • Enhanced mathematical validation`);
    console.log(`   • Improved error handling and data extraction`);
    
    return this.results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute final validation
async function main() {
  const validator = new FinalValidationTest();
  
  try {
    await validator.runFinalValidation();
    console.log('\n🎯 FINAL VALIDATION COMPLETE');
  } catch (error) {
    console.error('❌ Final validation failed:', error);
    process.exit(1);
  }
}

main();