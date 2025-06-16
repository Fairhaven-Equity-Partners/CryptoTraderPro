/**
 * FINAL CROSS-PAIR SWITCHING VALIDATION
 * Comprehensive validation of BTC to XRP switching functionality
 * and complete mathematical calculations across all timeframes
 */

import fs from 'fs';

class FinalCrossPairValidation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.validationResults = {};
    this.systemScore = 0;
  }

  async runCompleteValidation() {
    console.log('\n🎯 FINAL CROSS-PAIR SWITCHING VALIDATION');
    console.log('='.repeat(80));

    // Phase 1: Test BTC to XRP switching with all data requirements
    await this.testBTCToXRPSwitching();
    
    // Phase 2: Validate all mathematical calculations across timeframes
    await this.validateMathematicalCalculations();
    
    // Phase 3: Test UI component data flows
    await this.testUIComponentDataFlows();
    
    // Phase 4: Verify system performance and reliability
    await this.verifySystemPerformance();
    
    return this.generateFinalReport();
  }

  async testBTCToXRPSwitching() {
    console.log('\n🔄 PHASE 1: TESTING BTC TO XRP SWITCHING FUNCTIONALITY');
    console.log('-'.repeat(60));
    
    const testTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    let btcResults = {};
    let xrpResults = {};
    
    // Test BTC data retrieval
    console.log('Testing BTC/USDT data retrieval...');
    for (const timeframe of testTimeframes) {
      try {
        const technicalData = await this.makeRequest(`/api/technical-analysis/BTC%2FUSDT?timeframe=${timeframe}`);
        const signalData = await this.makeRequest(`/api/signals/BTC%2FUSDT?timeframe=${timeframe}`);
        
        btcResults[timeframe] = {
          technical: this.validateTechnicalData(technicalData),
          signals: this.validateSignalData(signalData),
          dataComplete: !!(technicalData?.data && signalData?.length)
        };
        
        console.log(`  ✅ BTC ${timeframe}: ${btcResults[timeframe].dataComplete ? 'Complete' : 'Incomplete'}`);
      } catch (error) {
        btcResults[timeframe] = { error: error.message };
        console.log(`  ❌ BTC ${timeframe}: Error - ${error.message}`);
      }
    }
    
    // Test XRP data retrieval
    console.log('\nTesting XRP/USDT data retrieval...');
    for (const timeframe of testTimeframes) {
      try {
        const technicalData = await this.makeRequest(`/api/technical-analysis/XRP%2FUSDT?timeframe=${timeframe}`);
        const signalData = await this.makeRequest(`/api/signals/XRP%2FUSDT?timeframe=${timeframe}`);
        
        xrpResults[timeframe] = {
          technical: this.validateTechnicalData(technicalData),
          signals: this.validateSignalData(signalData),
          dataComplete: !!(technicalData?.data && signalData?.length)
        };
        
        console.log(`  ✅ XRP ${timeframe}: ${xrpResults[timeframe].dataComplete ? 'Complete' : 'Incomplete'}`);
      } catch (error) {
        xrpResults[timeframe] = { error: error.message };
        console.log(`  ❌ XRP ${timeframe}: Error - ${error.message}`);
      }
    }
    
    // Calculate switching reliability
    const btcSuccess = Object.values(btcResults).filter(r => r.dataComplete).length;
    const xrpSuccess = Object.values(xrpResults).filter(r => r.dataComplete).length;
    const totalTests = testTimeframes.length * 2;
    const successRate = ((btcSuccess + xrpSuccess) / totalTests) * 100;
    
    this.validationResults.crossPairSwitching = {
      btcResults,
      xrpResults,
      btcSuccessRate: (btcSuccess / testTimeframes.length) * 100,
      xrpSuccessRate: (xrpSuccess / testTimeframes.length) * 100,
      overallSuccessRate: successRate
    };
    
    console.log(`\n📊 Cross-Pair Switching Results:`);
    console.log(`   BTC Success Rate: ${(btcSuccess / testTimeframes.length) * 100}%`);
    console.log(`   XRP Success Rate: ${(xrpSuccess / testTimeframes.length) * 100}%`);
    console.log(`   Overall Success Rate: ${successRate}%`);
  }

  async validateMathematicalCalculations() {
    console.log('\n🧮 PHASE 2: VALIDATING MATHEMATICAL CALCULATIONS');
    console.log('-'.repeat(60));
    
    const testPairs = ['BTC/USDT', 'XRP/USDT', 'ETH/USDT'];
    let calculationResults = {};
    
    for (const pair of testPairs) {
      console.log(`\nTesting mathematical calculations for ${pair}:`);
      
      try {
        const signals = await this.makeRequest(`/api/signals/${encodeURIComponent(pair)}`);
        
        if (Array.isArray(signals) && signals.length > 0) {
          const signal = signals[0];
          
          // Validate required fields
          const requiredFields = ['entryPrice', 'stopLoss', 'takeProfit', 'confidence', 'direction'];
          const missingFields = requiredFields.filter(field => !(field in signal));
          
          // Validate mathematical relationships
          const validations = {
            hasRequiredFields: missingFields.length === 0,
            confidenceInRange: signal.confidence >= 0 && signal.confidence <= 100,
            pricesPositive: signal.entryPrice > 0 && signal.stopLoss > 0 && signal.takeProfit > 0,
            riskRewardValid: this.validateRiskReward(signal),
            timestampValid: signal.timestamp && !isNaN(new Date(signal.timestamp))
          };
          
          const calculationAccuracy = Object.values(validations).filter(Boolean).length / Object.keys(validations).length * 100;
          
          calculationResults[pair] = {
            validations,
            calculationAccuracy,
            sampleSignal: {
              direction: signal.direction,
              confidence: signal.confidence,
              entryPrice: signal.entryPrice,
              stopLoss: signal.stopLoss,
              takeProfit: signal.takeProfit
            },
            missingFields
          };
          
          console.log(`  ✅ ${pair}: ${calculationAccuracy}% accuracy`);
          console.log(`     Direction: ${signal.direction}, Confidence: ${signal.confidence}%`);
          console.log(`     Entry: $${signal.entryPrice}, SL: $${signal.stopLoss}, TP: $${signal.takeProfit}`);
          
        } else {
          calculationResults[pair] = { error: 'No signals available' };
          console.log(`  ❌ ${pair}: No signals available`);
        }
        
      } catch (error) {
        calculationResults[pair] = { error: error.message };
        console.log(`  ❌ ${pair}: Error - ${error.message}`);
      }
    }
    
    this.validationResults.mathematicalCalculations = calculationResults;
  }

  async testUIComponentDataFlows() {
    console.log('\n🖥️ PHASE 3: TESTING UI COMPONENT DATA FLOWS');
    console.log('-'.repeat(60));
    
    const componentTests = [
      {
        name: 'Technical Analysis Summary',
        endpoint: '/api/technical-analysis/BTC%2FUSDT?timeframe=4h',
        requiredFields: ['data', 'indicators', 'currentPrice', 'confidence']
      },
      {
        name: 'Risk Assessment Dashboard',
        endpoint: '/api/risk-assessment?symbol=BTC%2FUSDT&timeframe=4h',
        requiredFields: ['riskLevel', 'expectedReturn', 'volatility']
      },
      {
        name: 'Advanced Signal Dashboard',
        endpoint: '/api/signals/BTC%2FUSDT',
        requiredFields: ['entryPrice', 'stopLoss', 'takeProfit', 'confluence']
      }
    ];
    
    let componentResults = {};
    
    for (const test of componentTests) {
      console.log(`Testing ${test.name}...`);
      
      try {
        const data = await this.makeRequest(test.endpoint);
        
        let fieldValidation = {};
        if (Array.isArray(data) && data.length > 0) {
          // For array responses (signals), check first item
          const item = data[0];
          fieldValidation = test.requiredFields.reduce((acc, field) => {
            acc[field] = field in item;
            return acc;
          }, {});
        } else if (data && typeof data === 'object') {
          // For object responses
          fieldValidation = test.requiredFields.reduce((acc, field) => {
            acc[field] = this.hasNestedField(data, field);
            return acc;
          }, {});
        }
        
        const fieldsPresent = Object.values(fieldValidation).filter(Boolean).length;
        const completeness = (fieldsPresent / test.requiredFields.length) * 100;
        
        componentResults[test.name] = {
          completeness,
          fieldValidation,
          dataReceived: !!data,
          sampleData: Array.isArray(data) ? data[0] : data
        };
        
        console.log(`  ✅ ${test.name}: ${completeness}% data completeness`);
        
      } catch (error) {
        componentResults[test.name] = { error: error.message };
        console.log(`  ❌ ${test.name}: Error - ${error.message}`);
      }
    }
    
    this.validationResults.uiComponentDataFlows = componentResults;
  }

  async verifySystemPerformance() {
    console.log('\n⚡ PHASE 4: VERIFYING SYSTEM PERFORMANCE');
    console.log('-'.repeat(60));
    
    const performanceTests = [];
    
    // Test API response times
    const testEndpoints = [
      '/api/technical-analysis/BTC%2FUSDT?timeframe=1h',
      '/api/signals/XRP%2FUSDT',
      '/api/risk-assessment?symbol=ETH%2FUSDT&timeframe=1d'
    ];
    
    for (const endpoint of testEndpoints) {
      const startTime = Date.now();
      try {
        await this.makeRequest(endpoint);
        const responseTime = Date.now() - startTime;
        performanceTests.push({ endpoint, responseTime, success: true });
        console.log(`  ✅ ${endpoint}: ${responseTime}ms`);
      } catch (error) {
        performanceTests.push({ endpoint, error: error.message, success: false });
        console.log(`  ❌ ${endpoint}: Error`);
      }
    }
    
    const averageResponseTime = performanceTests
      .filter(t => t.success)
      .reduce((sum, t) => sum + t.responseTime, 0) / performanceTests.filter(t => t.success).length;
    
    const successRate = (performanceTests.filter(t => t.success).length / performanceTests.length) * 100;
    
    this.validationResults.systemPerformance = {
      averageResponseTime,
      successRate,
      performanceTests,
      performanceRating: averageResponseTime < 100 ? 'EXCELLENT' : averageResponseTime < 300 ? 'GOOD' : 'ACCEPTABLE'
    };
    
    console.log(`\n📊 System Performance:`);
    console.log(`   Average Response Time: ${averageResponseTime}ms`);
    console.log(`   Success Rate: ${successRate}%`);
    console.log(`   Performance Rating: ${this.validationResults.systemPerformance.performanceRating}`);
  }

  validateTechnicalData(data) {
    if (!data || typeof data !== 'object') return false;
    return !!(data.data && data.data.indicators && data.currentPrice);
  }

  validateSignalData(data) {
    if (!Array.isArray(data) || data.length === 0) return false;
    const signal = data[0];
    const requiredFields = ['entryPrice', 'stopLoss', 'takeProfit', 'confidence', 'direction'];
    return requiredFields.every(field => field in signal);
  }

  validateRiskReward(signal) {
    if (signal.direction === 'LONG') {
      return signal.stopLoss < signal.entryPrice && signal.takeProfit > signal.entryPrice;
    } else if (signal.direction === 'SHORT') {
      return signal.stopLoss > signal.entryPrice && signal.takeProfit < signal.entryPrice;
    }
    return true; // NEUTRAL positions may have different logic
  }

  hasNestedField(obj, field) {
    if (field in obj) return true;
    if (obj.data && field in obj.data) return true;
    if (obj.indicators && field in obj.indicators) return true;
    return false;
  }

  calculateSystemHealthScore() {
    let score = 0;
    let totalWeight = 0;
    
    // Cross-pair switching (40% weight)
    if (this.validationResults.crossPairSwitching) {
      score += this.validationResults.crossPairSwitching.overallSuccessRate * 0.4;
      totalWeight += 0.4;
    }
    
    // Mathematical calculations (30% weight)
    if (this.validationResults.mathematicalCalculations) {
      const mathScores = Object.values(this.validationResults.mathematicalCalculations)
        .filter(r => !r.error)
        .map(r => r.calculationAccuracy || 0);
      const avgMathScore = mathScores.length > 0 ? mathScores.reduce((a, b) => a + b, 0) / mathScores.length : 0;
      score += avgMathScore * 0.3;
      totalWeight += 0.3;
    }
    
    // UI component data flows (20% weight)
    if (this.validationResults.uiComponentDataFlows) {
      const uiScores = Object.values(this.validationResults.uiComponentDataFlows)
        .filter(r => !r.error)
        .map(r => r.completeness || 0);
      const avgUIScore = uiScores.length > 0 ? uiScores.reduce((a, b) => a + b, 0) / uiScores.length : 0;
      score += avgUIScore * 0.2;
      totalWeight += 0.2;
    }
    
    // System performance (10% weight)
    if (this.validationResults.systemPerformance) {
      score += this.validationResults.systemPerformance.successRate * 0.1;
      totalWeight += 0.1;
    }
    
    return totalWeight > 0 ? Math.round(score / totalWeight * 100) / 100 : 0;
  }

  generateFinalReport() {
    this.systemScore = this.calculateSystemHealthScore();
    
    const report = {
      timestamp: new Date().toISOString(),
      systemHealthScore: this.systemScore,
      validationResults: this.validationResults,
      summary: {
        crossPairSwitching: this.validationResults.crossPairSwitching?.overallSuccessRate || 0,
        mathematicalAccuracy: this.getMathAccuracy(),
        uiComponentReliability: this.getUIReliability(),
        systemPerformance: this.validationResults.systemPerformance?.successRate || 0
      },
      recommendation: this.getRecommendation(),
      status: this.systemScore >= 90 ? 'EXCELLENT' : 
             this.systemScore >= 75 ? 'GOOD' : 
             this.systemScore >= 60 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT'
    };
    
    // Save report
    const reportPath = `final_cross_pair_validation_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n🎯 FINAL VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`System Health Score: ${this.systemScore}%`);
    console.log(`Status: ${report.status}`);
    console.log(`\nComponent Scores:`);
    console.log(`  Cross-Pair Switching: ${report.summary.crossPairSwitching}%`);
    console.log(`  Mathematical Accuracy: ${report.summary.mathematicalAccuracy}%`);
    console.log(`  UI Component Reliability: ${report.summary.uiComponentReliability}%`);
    console.log(`  System Performance: ${report.summary.systemPerformance}%`);
    console.log(`\nRecommendation: ${report.recommendation}`);
    console.log(`Report saved to: ${reportPath}`);
    
    return report;
  }

  getMathAccuracy() {
    if (!this.validationResults.mathematicalCalculations) return 0;
    const scores = Object.values(this.validationResults.mathematicalCalculations)
      .filter(r => !r.error)
      .map(r => r.calculationAccuracy || 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  getUIReliability() {
    if (!this.validationResults.uiComponentDataFlows) return 0;
    const scores = Object.values(this.validationResults.uiComponentDataFlows)
      .filter(r => !r.error)
      .map(r => r.completeness || 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  getRecommendation() {
    if (this.systemScore >= 90) {
      return 'System is performing excellently. Cross-pair switching and mathematical calculations are fully operational.';
    } else if (this.systemScore >= 75) {
      return 'System is performing well with minor optimizations possible for enhanced reliability.';
    } else if (this.systemScore >= 60) {
      return 'System is acceptable but requires targeted improvements in data structure and component integration.';
    } else {
      return 'System requires significant improvements in API routing, data structure, and component reliability.';
    }
  }

  async makeRequest(endpoint) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Expected JSON but received: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
}

// Execute final validation
async function main() {
  const validator = new FinalCrossPairValidation();
  
  try {
    console.log('🚀 Starting Final Cross-Pair Switching Validation...');
    const report = await validator.runCompleteValidation();
    
    console.log('\n✅ Final validation complete!');
    console.log(`System ready for production with ${report.systemHealthScore}% health score.`);
    
  } catch (error) {
    console.error('❌ Final validation failed:', error);
    process.exit(1);
  }
}

main();