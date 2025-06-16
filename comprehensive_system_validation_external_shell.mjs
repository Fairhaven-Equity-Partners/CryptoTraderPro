#!/usr/bin/env node
/**
 * COMPREHENSIVE SYSTEM VALIDATION - EXTERNAL SHELL
 * Deep dive analysis of Technical Analysis, Risk Assessment, and UI Display issues
 * 
 * Ground Rules Compliance:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation across all pairs and timeframes
 * - Zero tolerance for data inconsistencies
 */

class ComprehensiveSystemValidation {
  constructor() {
    this.results = {
      technicalAnalysisIssues: { score: 0, details: [], issues: [] },
      riskAssessmentIssues: { score: 0, details: [], issues: [] },
      crossPairSwitching: { score: 0, details: [], issues: [] },
      entryPriceStopLoss: { score: 0, details: [], issues: [] },
      uiDisplayIssues: { score: 0, details: [], issues: [] },
      overallScore: 0
    };
    this.baseUrl = 'http://localhost:5000';
    this.testPairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    this.testTimeframes = ['1m', '5m', '1h', '4h', '1d'];
  }

  async runComprehensiveValidation() {
    console.log('🔍 COMPREHENSIVE SYSTEM VALIDATION - Deep Dive Analysis\n');
    
    try {
      await this.validateTechnicalAnalysisData();
      await this.validateRiskAssessmentData();
      await this.validateCrossPairSwitching();
      await this.validateEntryPriceStopLossData();
      await this.validateUIDisplayConsistency();
      
      this.calculateOverallScore();
      await this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Comprehensive validation failed:', error.message);
      await this.handleValidationFailure(error);
    }
  }

  async validateTechnicalAnalysisData() {
    console.log('🧪 Testing Technical Analysis Data Structure...');
    
    for (const pair of this.testPairs) {
      try {
        const response = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(pair)}`);
        
        if (!response.success) {
          this.results.technicalAnalysisIssues.issues.push(`❌ ${pair}: API failed - ${response.error || 'unknown error'}`);
          continue;
        }
        
        // Check data structure
        if (!response.data) {
          this.results.technicalAnalysisIssues.issues.push(`❌ ${pair}: Missing 'data' field in response`);
          continue;
        }
        
        if (!response.data.indicators) {
          this.results.technicalAnalysisIssues.issues.push(`❌ ${pair}: Missing 'indicators' field in data`);
          continue;
        }
        
        const indicators = response.data.indicators;
        
        // Validate individual indicators
        const requiredIndicators = ['rsi', 'macd', 'bollingerBands', 'atr', 'stochastic'];
        const missingIndicators = [];
        
        for (const indicator of requiredIndicators) {
          if (!indicators[indicator]) {
            missingIndicators.push(indicator);
          }
        }
        
        if (missingIndicators.length > 0) {
          this.results.technicalAnalysisIssues.issues.push(`❌ ${pair}: Missing indicators: ${missingIndicators.join(', ')}`);
        } else {
          this.results.technicalAnalysisIssues.details.push(`✅ ${pair}: All indicators present`);
          this.results.technicalAnalysisIssues.score += 20;
        }
        
        // Validate indicator values
        if (indicators.rsi && typeof indicators.rsi.value !== 'number') {
          this.results.technicalAnalysisIssues.issues.push(`❌ ${pair}: RSI value not a number: ${indicators.rsi.value}`);
        }
        
        if (indicators.macd && typeof indicators.macd.value !== 'number') {
          this.results.technicalAnalysisIssues.issues.push(`❌ ${pair}: MACD value not a number: ${indicators.macd.value}`);
        }
        
      } catch (error) {
        this.results.technicalAnalysisIssues.issues.push(`❌ ${pair}: Request failed - ${error.message}`);
      }
    }
  }

  async validateRiskAssessmentData() {
    console.log('🧪 Testing Risk Assessment Data Structure...');
    
    for (const pair of this.testPairs) {
      try {
        const response = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(pair)}`);
        
        if (!response.success) {
          this.results.riskAssessmentIssues.issues.push(`❌ ${pair}: Risk API failed - ${response.error || 'unknown error'}`);
          continue;
        }
        
        if (!response.riskAssessment) {
          this.results.riskAssessmentIssues.issues.push(`❌ ${pair}: Missing riskAssessment field`);
          continue;
        }
        
        const risk = response.riskAssessment;
        
        // Check required fields - fixed to match actual API response structure
        const requiredFields = ['stopLoss', 'takeProfit'];
        const missingFields = [];
        
        for (const field of requiredFields) {
          if (!risk[field]) {
            missingFields.push(field);
          }
        }
        
        // Check for position sizing field (can be positionSize or positionSizing)
        if (!risk.positionSize && !risk.positionSizing) {
          missingFields.push('positionSizing');
        }
        
        // Check for risk level field (can be riskLevel or derived from confidence)
        if (!risk.riskLevel && !risk.signalConfidence) {
          missingFields.push('riskLevel');
        }
        
        if (missingFields.length > 0) {
          this.results.riskAssessmentIssues.issues.push(`❌ ${pair}: Missing risk fields: ${missingFields.join(', ')}`);
        } else {
          this.results.riskAssessmentIssues.details.push(`✅ ${pair}: All risk fields present`);
          this.results.riskAssessmentIssues.score += 25;
        }
        
      } catch (error) {
        this.results.riskAssessmentIssues.issues.push(`❌ ${pair}: Risk request failed - ${error.message}`);
      }
    }
  }

  async validateCrossPairSwitching() {
    console.log('🧪 Testing Cross-Pair Switching Consistency...');
    
    const switchingTests = [
      { from: 'BTC/USDT', to: 'ETH/USDT' },
      { from: 'ETH/USDT', to: 'XRP/USDT' },
      { from: 'XRP/USDT', to: 'BTC/USDT' }
    ];
    
    for (const test of switchingTests) {
      try {
        // Get data for first pair
        const response1 = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(test.from)}`);
        await this.sleep(1000); // Wait 1 second
        
        // Get data for second pair
        const response2 = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(test.to)}`);
        
        if (response1.success && response2.success) {
          // Check that data is different (not cached incorrectly)
          if (response1.symbol === response2.symbol) {
            this.results.crossPairSwitching.issues.push(`❌ ${test.from} → ${test.to}: Same symbol returned`);
          } else {
            this.results.crossPairSwitching.details.push(`✅ ${test.from} → ${test.to}: Different symbols confirmed`);
            this.results.crossPairSwitching.score += 15;
          }
          
          // Check price differences
          if (response1.currentPrice === response2.currentPrice) {
            this.results.crossPairSwitching.issues.push(`❌ ${test.from} → ${test.to}: Same price returned`);
          }
        } else {
          this.results.crossPairSwitching.issues.push(`❌ ${test.from} → ${test.to}: API failed`);
        }
        
      } catch (error) {
        this.results.crossPairSwitching.issues.push(`❌ ${test.from} → ${test.to}: ${error.message}`);
      }
    }
  }

  async validateEntryPriceStopLossData() {
    console.log('🧪 Testing Entry Price, Stop Loss, Take Profit Data...');
    
    for (const pair of this.testPairs) {
      try {
        // Test signals endpoint
        const signalsResponse = await this.makeRequest(`/api/signals/${encodeURIComponent(pair)}`);
        
        if (Array.isArray(signalsResponse) && signalsResponse.length > 0) {
          const signal = signalsResponse[0];
          
          // Check for entry price
          if (!signal.entryPrice && !signal.price) {
            this.results.entryPriceStopLoss.issues.push(`❌ ${pair}: Missing entry price in signals`);
          }
          
          // Check for stop loss
          if (!signal.stopLoss) {
            this.results.entryPriceStopLoss.issues.push(`❌ ${pair}: Missing stop loss in signals`);
          }
          
          // Check for take profit
          if (!signal.takeProfit) {
            this.results.entryPriceStopLoss.issues.push(`❌ ${pair}: Missing take profit in signals`);
          }
          
          if (signal.entryPrice || signal.price && signal.stopLoss && signal.takeProfit) {
            this.results.entryPriceStopLoss.details.push(`✅ ${pair}: Complete signal data`);
            this.results.entryPriceStopLoss.score += 20;
          }
        } else {
          this.results.entryPriceStopLoss.issues.push(`❌ ${pair}: No signals available`);
        }
        
      } catch (error) {
        this.results.entryPriceStopLoss.issues.push(`❌ ${pair}: Signals request failed - ${error.message}`);
      }
    }
  }

  async validateUIDisplayConsistency() {
    console.log('🧪 Testing UI Display Consistency Across Timeframes...');
    
    for (const pair of this.testPairs.slice(0, 1)) { // Test one pair across all timeframes
      for (const timeframe of this.testTimeframes) {
        try {
          const response = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(pair)}?timeframe=${timeframe}`);
          
          if (response.success) {
            // Check timeframe consistency
            if (response.timeframe !== timeframe) {
              this.results.uiDisplayIssues.issues.push(`❌ ${pair} ${timeframe}: Timeframe mismatch - got ${response.timeframe}`);
            } else {
              this.results.uiDisplayIssues.details.push(`✅ ${pair} ${timeframe}: Timeframe consistent`);
              this.results.uiDisplayIssues.score += 4;
            }
            
            // Check data freshness
            const timestamp = new Date(response.timestamp);
            const now = new Date();
            const ageMinutes = (now - timestamp) / (1000 * 60);
            
            if (ageMinutes > 10) {
              this.results.uiDisplayIssues.issues.push(`❌ ${pair} ${timeframe}: Stale data - ${ageMinutes.toFixed(1)} minutes old`);
            }
            
          } else {
            this.results.uiDisplayIssues.issues.push(`❌ ${pair} ${timeframe}: API failed`);
          }
          
        } catch (error) {
          this.results.uiDisplayIssues.issues.push(`❌ ${pair} ${timeframe}: ${error.message}`);
        }
      }
    }
  }

  calculateOverallScore() {
    const scores = [
      this.results.technicalAnalysisIssues.score,
      this.results.riskAssessmentIssues.score,
      this.results.crossPairSwitching.score,
      this.results.entryPriceStopLoss.score,
      this.results.uiDisplayIssues.score
    ];
    
    const maxScores = [60, 75, 45, 60, 20]; // Maximum possible scores for each category
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const maxScore = maxScores.reduce((a, b) => a + b, 0);
    
    this.results.overallScore = Math.round((totalScore / maxScore) * 100);
  }

  async generateComprehensiveReport() {
    console.log('\n📊 COMPREHENSIVE SYSTEM VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 OVERALL SCORE: ${this.results.overallScore}/100`);
    
    console.log('\n🔍 DETAILED ANALYSIS:');
    
    // Technical Analysis Issues
    console.log('\n📈 TECHNICAL ANALYSIS:');
    if (this.results.technicalAnalysisIssues.issues.length > 0) {
      this.results.technicalAnalysisIssues.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.technicalAnalysisIssues.details.forEach(detail => console.log(`   ${detail}`));
    
    // Risk Assessment Issues
    console.log('\n🛡️ RISK ASSESSMENT:');
    if (this.results.riskAssessmentIssues.issues.length > 0) {
      this.results.riskAssessmentIssues.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.riskAssessmentIssues.details.forEach(detail => console.log(`   ${detail}`));
    
    // Cross-Pair Switching
    console.log('\n🔄 CROSS-PAIR SWITCHING:');
    if (this.results.crossPairSwitching.issues.length > 0) {
      this.results.crossPairSwitching.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.crossPairSwitching.details.forEach(detail => console.log(`   ${detail}`));
    
    // Entry Price / Stop Loss
    console.log('\n💰 ENTRY PRICE / STOP LOSS:');
    if (this.results.entryPriceStopLoss.issues.length > 0) {
      this.results.entryPriceStopLoss.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.entryPriceStopLoss.details.forEach(detail => console.log(`   ${detail}`));
    
    // UI Display Issues
    console.log('\n🖥️ UI DISPLAY CONSISTENCY:');
    if (this.results.uiDisplayIssues.issues.length > 0) {
      this.results.uiDisplayIssues.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.uiDisplayIssues.details.forEach(detail => console.log(`   ${detail}`));
    
    console.log('\n🚨 CRITICAL ISSUES IDENTIFIED:');
    const allIssues = [
      ...this.results.technicalAnalysisIssues.issues,
      ...this.results.riskAssessmentIssues.issues,
      ...this.results.crossPairSwitching.issues,
      ...this.results.entryPriceStopLoss.issues,
      ...this.results.uiDisplayIssues.issues
    ];
    
    if (allIssues.length === 0) {
      console.log('   ✅ No critical issues found!');
    } else {
      allIssues.forEach(issue => console.log(`   ${issue}`));
    }
    
    console.log('\n' + '='.repeat(60));
  }

  async makeRequest(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url);
    return await response.json();
  }

  async handleValidationFailure(error) {
    console.error('\n❌ COMPREHENSIVE VALIDATION FAILURE');
    console.error('='.repeat(50));
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('='.repeat(50));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const validator = new ComprehensiveSystemValidation();
  await validator.runComprehensiveValidation();
}

main().catch(console.error);