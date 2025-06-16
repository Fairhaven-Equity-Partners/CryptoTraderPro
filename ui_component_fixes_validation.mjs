#!/usr/bin/env node
/**
 * UI COMPONENT FIXES VALIDATION - EXTERNAL SHELL
 * Direct API testing to identify Technical Analysis Summary data structure issues
 * 
 * Ground Rules Compliance:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of data structure issues
 * - Zero tolerance for undefined data display
 */

class UIComponentFixesValidation {
  constructor() {
    this.results = {
      technicalAnalysisAPI: { score: 0, details: [], issues: [] },
      riskAssessmentAPI: { score: 0, details: [], issues: [] },
      dataStructure: { score: 0, details: [], issues: [] },
      overallScore: 0
    };
    this.baseUrl = 'http://localhost:5000';
  }

  async runCompleteValidation() {
    console.log('🔍 UI COMPONENT FIXES VALIDATION - Direct API Testing\n');
    
    try {
      await this.validateTechnicalAnalysisAPI();
      await this.validateRiskAssessmentAPI();
      await this.validateDataStructureConsistency();
      
      this.calculateOverallScore();
      await this.generateDetailedReport();
      
    } catch (error) {
      console.error('❌ UI component validation failed:', error.message);
      await this.handleValidationFailure(error);
    }
  }

  async validateTechnicalAnalysisAPI() {
    console.log('🧪 Testing Technical Analysis API Data Structure...');
    
    const testSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    
    for (const symbol of testSymbols) {
      try {
        const response = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(symbol)}`);
        
        console.log(`\n🔍 ${symbol} Technical Analysis Response:`);
        console.log(`   Success: ${response.success}`);
        console.log(`   Data field: ${response.data ? 'present' : 'MISSING'}`);
        
        if (response.data) {
          console.log(`   Indicators field: ${response.data.indicators ? 'present' : 'MISSING'}`);
          
          if (response.data.indicators) {
            const indicators = response.data.indicators;
            console.log(`   RSI: ${indicators.rsi ? indicators.rsi.value : 'MISSING'}`);
            console.log(`   MACD: ${indicators.macd ? indicators.macd.value : 'MISSING'}`);
            console.log(`   Bollinger Bands: ${indicators.bollingerBands ? 'present' : 'MISSING'}`);
          }
        }
        
        // Check for UI compatibility
        if (response.success && response.data && response.data.indicators) {
          this.results.technicalAnalysisAPI.details.push(`✅ ${symbol}: Complete data structure`);
          this.results.technicalAnalysisAPI.score += 30;
        } else {
          this.results.technicalAnalysisAPI.issues.push(`❌ ${symbol}: Incomplete data structure`);
        }
        
      } catch (error) {
        console.log(`   ERROR: ${error.message}`);
        this.results.technicalAnalysisAPI.issues.push(`❌ ${symbol}: API request failed - ${error.message}`);
      }
    }
  }

  async validateRiskAssessmentAPI() {
    console.log('\n🧪 Testing Risk Assessment API Data Structure...');
    
    const testSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    
    for (const symbol of testSymbols) {
      try {
        const response = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(symbol)}`);
        
        console.log(`\n🔍 ${symbol} Risk Assessment Response:`);
        console.log(`   Success: ${response.success}`);
        console.log(`   Error: ${response.error || 'none'}`);
        console.log(`   Risk Assessment field: ${response.riskAssessment ? 'present' : 'MISSING'}`);
        
        if (response.riskAssessment) {
          console.log(`   Risk Level: ${response.riskAssessment.riskLevel || 'MISSING'}`);
          console.log(`   Position Sizing: ${response.riskAssessment.positionSizing || 'MISSING'}`);
          console.log(`   Stop Loss: ${response.riskAssessment.stopLoss || 'MISSING'}`);
          console.log(`   Take Profit: ${response.riskAssessment.takeProfit || 'MISSING'}`);
        }
        
        // Check for UI compatibility
        if (response.success && response.riskAssessment) {
          this.results.riskAssessmentAPI.details.push(`✅ ${symbol}: Risk assessment data available`);
          this.results.riskAssessmentAPI.score += 25;
        } else {
          this.results.riskAssessmentAPI.issues.push(`❌ ${symbol}: ${response.error || 'Risk assessment data missing'}`);
        }
        
      } catch (error) {
        console.log(`   ERROR: ${error.message}`);
        this.results.riskAssessmentAPI.issues.push(`❌ ${symbol}: API request failed - ${error.message}`);
      }
    }
  }

  async validateDataStructureConsistency() {
    console.log('\n🧪 Testing Data Structure Consistency...');
    
    try {
      // Test signals endpoint for entry price / stop loss data
      const signalsResponse = await this.makeRequest('/api/signals/BTC%2FUSDT');
      
      console.log('\n🔍 Signals Endpoint Response:');
      console.log(`   Type: ${Array.isArray(signalsResponse) ? 'array' : typeof signalsResponse}`);
      console.log(`   Length: ${Array.isArray(signalsResponse) ? signalsResponse.length : 'N/A'}`);
      
      if (Array.isArray(signalsResponse) && signalsResponse.length > 0) {
        const signal = signalsResponse[0];
        console.log(`   Entry Price: ${signal.entryPrice || signal.price || 'MISSING'}`);
        console.log(`   Stop Loss: ${signal.stopLoss || 'MISSING'}`);
        console.log(`   Take Profit: ${signal.takeProfit || 'MISSING'}`);
        console.log(`   Direction: ${signal.direction || 'MISSING'}`);
        console.log(`   Confidence: ${signal.confidence || 'MISSING'}`);
        
        if ((signal.entryPrice || signal.price) && signal.stopLoss && signal.takeProfit) {
          this.results.dataStructure.details.push('✅ Complete signal data structure');
          this.results.dataStructure.score += 40;
        } else {
          this.results.dataStructure.issues.push('❌ Incomplete signal data structure');
        }
      } else {
        this.results.dataStructure.issues.push('❌ No signals available or invalid format');
      }
      
    } catch (error) {
      console.log(`   ERROR: ${error.message}`);
      this.results.dataStructure.issues.push(`❌ Signals endpoint failed - ${error.message}`);
    }
  }

  calculateOverallScore() {
    const scores = [
      this.results.technicalAnalysisAPI.score,
      this.results.riskAssessmentAPI.score,
      this.results.dataStructure.score
    ];
    
    const maxScores = [90, 75, 40]; // Maximum possible scores for each category
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const maxScore = maxScores.reduce((a, b) => a + b, 0);
    
    this.results.overallScore = Math.round((totalScore / maxScore) * 100);
  }

  async generateDetailedReport() {
    console.log('\n📊 UI COMPONENT FIXES VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 OVERALL SCORE: ${this.results.overallScore}/100`);
    
    console.log('\n🔍 DETAILED ANALYSIS:');
    
    // Technical Analysis API
    console.log('\n📈 TECHNICAL ANALYSIS API:');
    if (this.results.technicalAnalysisAPI.issues.length > 0) {
      this.results.technicalAnalysisAPI.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.technicalAnalysisAPI.details.forEach(detail => console.log(`   ${detail}`));
    
    // Risk Assessment API
    console.log('\n🛡️ RISK ASSESSMENT API:');
    if (this.results.riskAssessmentAPI.issues.length > 0) {
      this.results.riskAssessmentAPI.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.riskAssessmentAPI.details.forEach(detail => console.log(`   ${detail}`));
    
    // Data Structure
    console.log('\n📊 DATA STRUCTURE CONSISTENCY:');
    if (this.results.dataStructure.issues.length > 0) {
      this.results.dataStructure.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.dataStructure.details.forEach(detail => console.log(`   ${detail}`));
    
    console.log('\n🚨 PRIORITY FIXES NEEDED:');
    const allIssues = [
      ...this.results.technicalAnalysisAPI.issues,
      ...this.results.riskAssessmentAPI.issues,
      ...this.results.dataStructure.issues
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
    console.error('\n❌ UI COMPONENT VALIDATION FAILURE');
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
  const validator = new UIComponentFixesValidation();
  await validator.runCompleteValidation();
}

main().catch(console.error);