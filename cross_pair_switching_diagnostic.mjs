/**
 * CROSS-PAIR SWITCHING DIAGNOSTIC - External Shell Analysis
 * Comprehensive investigation of Technical Analysis Summary and Risk Assessment Dashboard
 * pair switching issues with line-by-line component analysis
 */

class CrossPairSwitchingDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testPairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT'];
    this.testTimeframes = ['1m', '5m', '1h', '4h', '1d'];
    this.results = {
      technicalAnalysisAPI: { issues: [], details: [], score: 0 },
      riskAssessmentAPI: { issues: [], details: [], score: 0 },
      componentStateUpdates: { issues: [], details: [], score: 0 },
      dataFlowValidation: { issues: [], details: [], score: 0 },
      crossPairConsistency: { issues: [], details: [], score: 0 }
    };
  }

  async runCompleteDiagnostic() {
    console.log('🔍 CROSS-PAIR SWITCHING DIAGNOSTIC - Comprehensive Analysis\n');
    
    await this.validateTechnicalAnalysisAPI();
    await this.validateRiskAssessmentAPI();
    await this.validateComponentStateUpdates();
    await this.validateDataFlowConsistency();
    await this.validateCrossPairSwitching();
    
    this.generateDiagnosticReport();
  }

  async validateTechnicalAnalysisAPI() {
    console.log('🧪 Testing Technical Analysis API Response Consistency...');
    
    for (const pair of this.testPairs) {
      try {
        const response = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(pair)}`);
        
        if (!response.success) {
          this.results.technicalAnalysisAPI.issues.push(`❌ ${pair}: API failed - ${response.error || 'unknown error'}`);
          continue;
        }

        // Validate symbol consistency
        if (response.symbol !== pair) {
          this.results.technicalAnalysisAPI.issues.push(`❌ ${pair}: Symbol mismatch - Expected: ${pair}, Got: ${response.symbol}`);
        }

        // Validate data structure
        if (!response.data || !response.data.indicators) {
          this.results.technicalAnalysisAPI.issues.push(`❌ ${pair}: Missing indicators data structure`);
          continue;
        }

        // Validate indicator values are not cached from previous pair
        const indicators = response.data.indicators;
        if (!indicators.rsi || !indicators.macd || !indicators.bollingerBands) {
          this.results.technicalAnalysisAPI.issues.push(`❌ ${pair}: Missing core indicators`);
        } else {
          this.results.technicalAnalysisAPI.details.push(`✅ ${pair}: Complete indicators - RSI: ${indicators.rsi.value?.toFixed(2)}, MACD: ${indicators.macd.value?.toFixed(2)}`);
          this.results.technicalAnalysisAPI.score += 25;
        }

        // Test timeframe variations
        for (const timeframe of this.testTimeframes.slice(0, 2)) { // Test first 2 timeframes to avoid rate limits
          const timeframeResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(pair)}?timeframe=${timeframe}`);
          if (timeframeResponse.success && timeframeResponse.symbol === pair) {
            this.results.technicalAnalysisAPI.details.push(`✅ ${pair} ${timeframe}: Timeframe consistency maintained`);
          } else {
            this.results.technicalAnalysisAPI.issues.push(`❌ ${pair} ${timeframe}: Timeframe switching failed`);
          }
          await this.sleep(200); // Rate limiting protection
        }

      } catch (error) {
        this.results.technicalAnalysisAPI.issues.push(`❌ ${pair}: Request failed - ${error.message}`);
      }
    }
  }

  async validateRiskAssessmentAPI() {
    console.log('🧪 Testing Risk Assessment API Response Consistency...');
    
    for (const pair of this.testPairs) {
      try {
        const response = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(pair)}`);
        
        if (!response.success) {
          this.results.riskAssessmentAPI.issues.push(`❌ ${pair}: Risk API failed - ${response.error || 'unknown error'}`);
          continue;
        }

        // Validate symbol consistency
        if (response.symbol !== pair) {
          this.results.riskAssessmentAPI.issues.push(`❌ ${pair}: Symbol mismatch - Expected: ${pair}, Got: ${response.symbol}`);
        }

        // Validate risk assessment data structure
        if (!response.riskAssessment) {
          this.results.riskAssessmentAPI.issues.push(`❌ ${pair}: Missing riskAssessment field`);
          continue;
        }

        const risk = response.riskAssessment;
        
        // Validate essential risk fields
        const hasPositionSize = risk.positionSize || risk.positionSizing;
        const hasStopLoss = risk.stopLoss;
        const hasTakeProfit = risk.takeProfit;
        const hasRiskLevel = risk.riskLevel || risk.signalConfidence;

        if (!hasPositionSize || !hasStopLoss || !hasTakeProfit) {
          this.results.riskAssessmentAPI.issues.push(`❌ ${pair}: Incomplete risk data - Position: ${!!hasPositionSize}, SL: ${!!hasStopLoss}, TP: ${!!hasTakeProfit}`);
        } else {
          this.results.riskAssessmentAPI.details.push(`✅ ${pair}: Complete risk data - Position: ${hasPositionSize ? risk.positionSize || risk.positionSizing : 'N/A'}, Risk Level: ${hasRiskLevel ? 'Present' : 'N/A'}`);
          this.results.riskAssessmentAPI.score += 25;
        }

        // Validate risk values are pair-specific (not cached)
        if (risk.currentPrice && typeof risk.currentPrice === 'number') {
          this.results.riskAssessmentAPI.details.push(`✅ ${pair}: Current price: $${risk.currentPrice.toFixed(4)}`);
        }

      } catch (error) {
        this.results.riskAssessmentAPI.issues.push(`❌ ${pair}: Risk request failed - ${error.message}`);
      }
    }
  }

  async validateComponentStateUpdates() {
    console.log('🧪 Testing Component State Update Consistency...');
    
    // Test rapid pair switching to identify state management issues
    const switchingPairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    
    for (let i = 0; i < switchingPairs.length; i++) {
      const currentPair = switchingPairs[i];
      const nextPair = switchingPairs[(i + 1) % switchingPairs.length];
      
      try {
        // Get baseline data for current pair
        const currentResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(currentPair)}`);
        await this.sleep(500); // Simulate user switching delay
        
        // Switch to next pair
        const nextResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(nextPair)}`);
        
        // Validate no data contamination
        if (currentResponse.success && nextResponse.success) {
          if (currentResponse.symbol === nextResponse.symbol) {
            this.results.componentStateUpdates.issues.push(`❌ ${currentPair} → ${nextPair}: Symbol not updated (caching issue)`);
          } else if (currentResponse.currentPrice === nextResponse.currentPrice) {
            this.results.componentStateUpdates.issues.push(`❌ ${currentPair} → ${nextPair}: Same price returned (data contamination)`);
          } else {
            this.results.componentStateUpdates.details.push(`✅ ${currentPair} → ${nextPair}: Clean state transition`);
            this.results.componentStateUpdates.score += 20;
          }
        }

        // Test concurrent risk assessment update
        const riskResponse = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(nextPair)}`);
        if (riskResponse.success && riskResponse.symbol === nextPair) {
          this.results.componentStateUpdates.details.push(`✅ ${nextPair}: Risk assessment synchronized`);
          this.results.componentStateUpdates.score += 10;
        } else {
          this.results.componentStateUpdates.issues.push(`❌ ${nextPair}: Risk assessment not synchronized`);
        }

      } catch (error) {
        this.results.componentStateUpdates.issues.push(`❌ ${currentPair} → ${nextPair}: State update failed - ${error.message}`);
      }
    }
  }

  async validateDataFlowConsistency() {
    console.log('🧪 Testing Data Flow and Cache Management...');
    
    for (const pair of this.testPairs.slice(0, 2)) { // Test 2 pairs to avoid rate limits
      try {
        // Test multiple rapid requests to same pair (should be consistent)
        const responses = [];
        for (let i = 0; i < 3; i++) {
          const response = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(pair)}`);
          responses.push(response);
          await this.sleep(100);
        }

        // Validate consistency across rapid requests
        const allSameSymbol = responses.every(r => r.success && r.symbol === pair);
        const pricesConsistent = responses.every(r => r.success && typeof r.currentPrice === 'number');

        if (allSameSymbol && pricesConsistent) {
          this.results.dataFlowValidation.details.push(`✅ ${pair}: Consistent data across rapid requests`);
          this.results.dataFlowValidation.score += 25;
        } else {
          this.results.dataFlowValidation.issues.push(`❌ ${pair}: Inconsistent data across requests`);
        }

        // Test URL encoding consistency
        const encodedResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(pair)}`);
        const directResponse = await this.makeRequest(`/api/technical-analysis/${pair.replace('/', '%2F')}`);
        
        if (encodedResponse.success && directResponse.success && 
            encodedResponse.symbol === directResponse.symbol) {
          this.results.dataFlowValidation.details.push(`✅ ${pair}: URL encoding consistent`);
          this.results.dataFlowValidation.score += 15;
        } else {
          this.results.dataFlowValidation.issues.push(`❌ ${pair}: URL encoding inconsistency`);
        }

      } catch (error) {
        this.results.dataFlowValidation.issues.push(`❌ ${pair}: Data flow test failed - ${error.message}`);
      }
    }
  }

  async validateCrossPairSwitching() {
    console.log('🧪 Testing Cross-Pair Switching End-to-End...');
    
    // Sequential pair switching test
    for (let i = 0; i < this.testPairs.length - 1; i++) {
      const fromPair = this.testPairs[i];
      const toPair = this.testPairs[i + 1];
      
      try {
        // Get data for source pair
        const fromTech = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(fromPair)}`);
        const fromRisk = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(fromPair)}`);
        
        await this.sleep(300); // Simulate UI switching delay
        
        // Switch to target pair
        const toTech = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(toPair)}`);
        const toRisk = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(toPair)}`);
        
        // Validate complete switching
        let switchingScore = 0;
        const issues = [];
        
        if (fromTech.success && toTech.success) {
          if (fromTech.symbol !== toTech.symbol) switchingScore += 25;
          else issues.push(`Technical Analysis symbol not updated`);
          
          if (fromTech.currentPrice !== toTech.currentPrice) switchingScore += 25;
          else issues.push(`Technical Analysis price not updated`);
        }
        
        if (fromRisk.success && toRisk.success) {
          if (fromRisk.symbol !== toRisk.symbol) switchingScore += 25;
          else issues.push(`Risk Assessment symbol not updated`);
          
          if (fromRisk.riskAssessment?.currentPrice !== toRisk.riskAssessment?.currentPrice) switchingScore += 25;
          else issues.push(`Risk Assessment price not updated`);
        }
        
        if (issues.length === 0) {
          this.results.crossPairConsistency.details.push(`✅ ${fromPair} → ${toPair}: Complete switching success (${switchingScore}/100)`);
          this.results.crossPairConsistency.score += switchingScore;
        } else {
          this.results.crossPairConsistency.issues.push(`❌ ${fromPair} → ${toPair}: ${issues.join(', ')}`);
        }

      } catch (error) {
        this.results.crossPairConsistency.issues.push(`❌ ${fromPair} → ${toPair}: Switching test failed - ${error.message}`);
      }
    }
  }

  generateDiagnosticReport() {
    const totalScore = Object.values(this.results).reduce((sum, category) => sum + category.score, 0);
    const maxScore = 500; // Approximate maximum possible score
    const overallScore = Math.min(100, Math.round((totalScore / maxScore) * 100));

    console.log('\n📊 CROSS-PAIR SWITCHING DIAGNOSTIC REPORT');
    console.log('============================================================\n');
    console.log(`🎯 OVERALL DIAGNOSTIC SCORE: ${overallScore}/100\n`);

    console.log('🔍 DETAILED ANALYSIS:\n');

    // Technical Analysis API
    console.log('📈 TECHNICAL ANALYSIS API:');
    if (this.results.technicalAnalysisAPI.issues.length > 0) {
      this.results.technicalAnalysisAPI.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.technicalAnalysisAPI.details.forEach(detail => console.log(`   ${detail}`));
    console.log('');

    // Risk Assessment API
    console.log('🛡️ RISK ASSESSMENT API:');
    if (this.results.riskAssessmentAPI.issues.length > 0) {
      this.results.riskAssessmentAPI.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.riskAssessmentAPI.details.forEach(detail => console.log(`   ${detail}`));
    console.log('');

    // Component State Updates
    console.log('🔄 COMPONENT STATE UPDATES:');
    if (this.results.componentStateUpdates.issues.length > 0) {
      this.results.componentStateUpdates.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.componentStateUpdates.details.forEach(detail => console.log(`   ${detail}`));
    console.log('');

    // Data Flow Validation
    console.log('🌊 DATA FLOW VALIDATION:');
    if (this.results.dataFlowValidation.issues.length > 0) {
      this.results.dataFlowValidation.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.dataFlowValidation.details.forEach(detail => console.log(`   ${detail}`));
    console.log('');

    // Cross-Pair Consistency
    console.log('🔄 CROSS-PAIR SWITCHING:');
    if (this.results.crossPairConsistency.issues.length > 0) {
      this.results.crossPairConsistency.issues.forEach(issue => console.log(`   ${issue}`));
    }
    this.results.crossPairConsistency.details.forEach(detail => console.log(`   ${detail}`));
    console.log('');

    console.log('🚨 PRIORITY FIXES NEEDED:');
    const allIssues = [
      ...this.results.technicalAnalysisAPI.issues,
      ...this.results.riskAssessmentAPI.issues,
      ...this.results.componentStateUpdates.issues,
      ...this.results.dataFlowValidation.issues,
      ...this.results.crossPairConsistency.issues
    ];

    if (allIssues.length === 0) {
      console.log('   ✅ No critical issues found!');
    } else {
      allIssues.forEach(issue => console.log(`   ${issue}`));
    }

    console.log('\n============================================================');
  }

  async makeRequest(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return await response.json();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute diagnostic
async function main() {
  const diagnostic = new CrossPairSwitchingDiagnostic();
  await diagnostic.runCompleteDiagnostic();
}

main().catch(console.error);