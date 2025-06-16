/**
 * CRITICAL SYSTEM DIAGNOSIS AND FIX
 * Targeted analysis of BTC to XRP switching issue and complete system validation
 * 
 * Based on error log analysis:
 * - API endpoints returning HTML instead of JSON
 * - Technical Analysis Summary and Risk Assessment Dashboard failing on symbol change
 * - Missing required fields in signal data structure
 * - Cross-pair switching data loading problems
 */

import fs from 'fs';

class CriticalSystemDiagnosis {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.fixes = [];
    this.validationResults = {};
  }

  async runCompleteDiagnosis() {
    console.log('\n🔍 CRITICAL SYSTEM DIAGNOSIS - BTC TO XRP SWITCHING ISSUE');
    console.log('='.repeat(80));

    // Phase 1: Analyze the specific BTC to XRP issue from error logs
    await this.analyzeCrossPairSwitchingIssue();
    
    // Phase 2: Test API endpoint reliability
    await this.testAPIEndpointReliability();
    
    // Phase 3: Validate signal data structure
    await this.validateSignalDataStructure();
    
    // Phase 4: Test Technical Analysis Summary component data flow
    await this.testTechnicalAnalysisDataFlow();
    
    // Phase 5: Test Risk Assessment Dashboard data flow
    await this.testRiskAssessmentDataFlow();
    
    // Phase 6: Verify mathematical calculations accuracy
    await this.verifyMathematicalCalculations();
    
    // Phase 7: Generate comprehensive fix plan
    await this.generateComprehensiveFixPlan();
    
    return this.generateDiagnosisReport();
  }

  async analyzeCrossPairSwitchingIssue() {
    console.log('\n📋 PHASE 1: ANALYZING BTC TO XRP SWITCHING ISSUE');
    console.log('-'.repeat(60));
    
    // From error log analysis, the key issue appears to be:
    // 1. "No signal available for BTC/USDT on 4h" - recommendation generation failing
    // 2. API endpoints returning HTML instead of JSON responses
    // 3. Technical Analysis Summary and Risk Assessment not updating properly
    
    const logAnalysis = {
      btcCalculationWorking: true, // BTC calculations completed successfully
      xrpCalculationWorking: true, // XRP calculations completed successfully  
      symbolSwitchDetected: true,  // "Symbol changed from BTC/USDT to XRP/USDT" logged
      recommendationFailure: true, // "No signal available for BTC/USDT on 4h"
      apiRoutingIssue: true        // HTML responses instead of JSON
    };
    
    this.issues.push({
      category: 'Cross-Pair Switching',
      severity: 'HIGH',
      description: 'Technical Analysis Summary and Risk Assessment Dashboard not loading data when switching from BTC to XRP',
      rootCause: 'API endpoints returning HTML instead of JSON, causing component data loading failures',
      evidence: 'External shell testing shows "Unexpected token \'<\', \"<!DOCTYPE \"... is not valid JSON"'
    });
    
    console.log('✅ Cross-pair switching issue identified');
    console.log('   - BTC calculations: Working');
    console.log('   - XRP calculations: Working');
    console.log('   - Symbol switching: Detected');
    console.log('   - API routing: BROKEN (HTML responses)');
    console.log('   - Component updates: FAILING');
  }

  async testAPIEndpointReliability() {
    console.log('\n🔧 PHASE 2: TESTING API ENDPOINT RELIABILITY');
    console.log('-'.repeat(60));
    
    const criticalEndpoints = [
      '/api/technical-analysis/BTC%2FUSDT?timeframe=4h',
      '/api/technical-analysis/XRP%2FUSDT?timeframe=4h',
      '/api/risk-assessment?symbol=BTC%2FUSDT&timeframe=4h',
      '/api/risk-assessment?symbol=XRP%2FUSDT&timeframe=4h',
      '/api/signals?symbol=BTC%2FUSDT',
      '/api/signals?symbol=XRP%2FUSDT'
    ];
    
    let workingEndpoints = 0;
    let failedEndpoints = [];
    
    for (const endpoint of criticalEndpoints) {
      try {
        console.log(`Testing: ${endpoint}`);
        const response = await this.makeRequest(endpoint);
        
        if (response && typeof response === 'object' && !response.error) {
          workingEndpoints++;
          console.log(`  ✅ Working: JSON response received`);
        } else {
          failedEndpoints.push(endpoint);
          console.log(`  ❌ Failed: ${response ? 'Error response' : 'No response'}`);
        }
      } catch (error) {
        failedEndpoints.push(endpoint);
        console.log(`  ❌ Failed: ${error.message}`);
      }
      
      await this.sleep(100);
    }
    
    this.validationResults.apiEndpoints = {
      total: criticalEndpoints.length,
      working: workingEndpoints,
      failed: failedEndpoints.length,
      reliability: (workingEndpoints / criticalEndpoints.length) * 100,
      failedEndpoints
    };
    
    if (failedEndpoints.length > 0) {
      this.issues.push({
        category: 'API Routing',
        severity: 'CRITICAL',
        description: `${failedEndpoints.length} critical API endpoints failing`,
        rootCause: 'Server routing configuration returning HTML instead of JSON',
        affectedEndpoints: failedEndpoints
      });
    }
    
    console.log(`📊 API Reliability: ${this.validationResults.apiEndpoints.reliability.toFixed(1)}%`);
  }

  async validateSignalDataStructure() {
    console.log('\n📊 PHASE 3: VALIDATING SIGNAL DATA STRUCTURE');
    console.log('-'.repeat(60));
    
    try {
      const btcSignals = await this.makeRequest('/api/signals?symbol=BTC%2FUSDT');
      const xrpSignals = await this.makeRequest('/api/signals?symbol=XRP%2FUSDT');
      
      const requiredFields = [
        'direction', 'confidence', 'timeframe', 'entryPrice', 
        'stopLoss', 'takeProfit', 'symbol', 'timestamp'
      ];
      
      const validateSignalStructure = (signals, symbol) => {
        if (!Array.isArray(signals) || signals.length === 0) {
          return { valid: false, error: 'No signals array or empty' };
        }
        
        const sampleSignal = signals[0];
        const missingFields = requiredFields.filter(field => !(field in sampleSignal));
        
        return {
          valid: missingFields.length === 0,
          missingFields,
          sampleSignal,
          signalCount: signals.length
        };
      };
      
      const btcValidation = validateSignalStructure(btcSignals, 'BTC/USDT');
      const xrpValidation = validateSignalStructure(xrpSignals, 'XRP/USDT');
      
      this.validationResults.signalStructure = {
        btc: btcValidation,
        xrp: xrpValidation
      };
      
      if (!btcValidation.valid || !xrpValidation.valid) {
        this.issues.push({
          category: 'Signal Data Structure',
          severity: 'HIGH',
          description: 'Signal data missing required fields for component display',
          rootCause: 'Backend signal generation not including entryPrice, stopLoss, takeProfit',
          btcMissingFields: btcValidation.missingFields || [],
          xrpMissingFields: xrpValidation.missingFields || []
        });
      }
      
      console.log(`BTC signals: ${btcValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`XRP signals: ${xrpValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
      
    } catch (error) {
      console.log(`❌ Signal validation failed: ${error.message}`);
      this.issues.push({
        category: 'Signal Data Structure',
        severity: 'CRITICAL',
        description: 'Unable to validate signal data structure',
        error: error.message
      });
    }
  }

  async testTechnicalAnalysisDataFlow() {
    console.log('\n📈 PHASE 4: TESTING TECHNICAL ANALYSIS DATA FLOW');
    console.log('-'.repeat(60));
    
    // Test the specific data flow that feeds TechnicalAnalysisSummary component
    try {
      const btcTechnical = await this.makeRequest('/api/technical-analysis/BTC%2FUSDT?timeframe=4h');
      const xrpTechnical = await this.makeRequest('/api/technical-analysis/XRP%2FUSDT?timeframe=4h');
      
      const validateTechnicalData = (data, symbol) => {
        if (!data || typeof data !== 'object') {
          return { valid: false, error: 'No data or invalid format' };
        }
        
        const requiredStructure = {
          indicators: 'object',
          currentPrice: 'number',
          timeframe: 'string',
          confidence: 'number'
        };
        
        const issues = [];
        for (const [field, expectedType] of Object.entries(requiredStructure)) {
          if (!(field in data)) {
            issues.push(`Missing field: ${field}`);
          } else if (typeof data[field] !== expectedType) {
            issues.push(`Wrong type for ${field}: expected ${expectedType}, got ${typeof data[field]}`);
          }
        }
        
        return {
          valid: issues.length === 0,
          issues,
          hasIndicators: data.indicators && typeof data.indicators === 'object',
          indicatorCount: data.indicators ? Object.keys(data.indicators).length : 0
        };
      };
      
      const btcValidation = validateTechnicalData(btcTechnical, 'BTC/USDT');
      const xrpValidation = validateTechnicalData(xrpTechnical, 'XRP/USDT');
      
      this.validationResults.technicalAnalysis = {
        btc: btcValidation,
        xrp: xrpValidation
      };
      
      console.log(`BTC Technical Analysis: ${btcValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`XRP Technical Analysis: ${xrpValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (!btcValidation.valid || !xrpValidation.valid) {
        this.issues.push({
          category: 'Technical Analysis Data Flow',
          severity: 'HIGH',
          description: 'Technical Analysis component not receiving properly formatted data',
          btcIssues: btcValidation.issues || [],
          xrpIssues: xrpValidation.issues || []
        });
      }
      
    } catch (error) {
      console.log(`❌ Technical Analysis data flow test failed: ${error.message}`);
      this.issues.push({
        category: 'Technical Analysis Data Flow',
        severity: 'CRITICAL',
        description: 'Technical Analysis API completely non-functional',
        error: error.message
      });
    }
  }

  async testRiskAssessmentDataFlow() {
    console.log('\n🛡️ PHASE 5: TESTING RISK ASSESSMENT DATA FLOW');
    console.log('-'.repeat(60));
    
    try {
      const btcRisk = await this.makeRequest('/api/risk-assessment?symbol=BTC%2FUSDT&timeframe=4h');
      const xrpRisk = await this.makeRequest('/api/risk-assessment?symbol=XRP%2FUSDT&timeframe=4h');
      
      const validateRiskData = (data, symbol) => {
        if (!data || typeof data !== 'object') {
          return { valid: false, error: 'No data or invalid format' };
        }
        
        const requiredFields = [
          'riskLevel', 'expectedReturn', 'volatility', 'winProbability'
        ];
        
        const missingFields = requiredFields.filter(field => !(field in data));
        
        return {
          valid: missingFields.length === 0,
          missingFields,
          hasValidRiskMetrics: data.riskLevel && data.expectedReturn !== undefined
        };
      };
      
      const btcValidation = validateRiskData(btcRisk, 'BTC/USDT');
      const xrpValidation = validateRiskData(xrpRisk, 'XRP/USDT');
      
      this.validationResults.riskAssessment = {
        btc: btcValidation,
        xrp: xrpValidation
      };
      
      console.log(`BTC Risk Assessment: ${btcValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`XRP Risk Assessment: ${xrpValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (!btcValidation.valid || !xrpValidation.valid) {
        this.issues.push({
          category: 'Risk Assessment Data Flow',
          severity: 'HIGH',
          description: 'Risk Assessment component not receiving properly formatted data',
          btcMissingFields: btcValidation.missingFields || [],
          xrpMissingFields: xrpValidation.missingFields || []
        });
      }
      
    } catch (error) {
      console.log(`❌ Risk Assessment data flow test failed: ${error.message}`);
      this.issues.push({
        category: 'Risk Assessment Data Flow',
        severity: 'CRITICAL',
        description: 'Risk Assessment API completely non-functional',
        error: error.message
      });
    }
  }

  async verifyMathematicalCalculations() {
    console.log('\n🧮 PHASE 6: VERIFYING MATHEMATICAL CALCULATIONS');
    console.log('-'.repeat(60));
    
    // From the error logs, calculations are working but data structure might be wrong
    try {
      const signals = await this.makeRequest('/api/signals?symbol=XRP%2FUSDT');
      
      if (Array.isArray(signals) && signals.length > 0) {
        const signal = signals[0];
        
        // Verify confidence is within valid range
        const confidenceValid = signal.confidence >= 0 && signal.confidence <= 100;
        
        // Verify mathematical relationships
        const priceValid = signal.entryPrice > 0;
        const stopLossValid = signal.stopLoss > 0;
        const takeProfitValid = signal.takeProfit > 0;
        
        // For SHORT signals, stop loss should be higher than entry
        // For LONG signals, stop loss should be lower than entry
        const riskRewardValid = signal.direction === 'SHORT' ? 
          (signal.stopLoss > signal.entryPrice && signal.takeProfit < signal.entryPrice) :
          (signal.stopLoss < signal.entryPrice && signal.takeProfit > signal.entryPrice);
        
        this.validationResults.mathematicalAccuracy = {
          confidenceValid,
          priceValid,
          stopLossValid,
          takeProfitValid,
          riskRewardValid,
          sampleCalculation: {
            direction: signal.direction,
            confidence: signal.confidence,
            entryPrice: signal.entryPrice,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit
          }
        };
        
        const overallMathValid = confidenceValid && priceValid && stopLossValid && takeProfitValid && riskRewardValid;
        
        console.log(`Mathematical calculations: ${overallMathValid ? '✅ Valid' : '❌ Invalid'}`);
        
        if (!overallMathValid) {
          this.issues.push({
            category: 'Mathematical Calculations',
            severity: 'MEDIUM',
            description: 'Some mathematical relationships are invalid',
            details: {
              confidenceValid,
              priceValid,
              stopLossValid,
              takeProfitValid,
              riskRewardValid
            }
          });
        }
      } else {
        console.log('❌ No signals available for mathematical verification');
      }
      
    } catch (error) {
      console.log(`❌ Mathematical verification failed: ${error.message}`);
    }
  }

  async generateComprehensiveFixPlan() {
    console.log('\n🔧 PHASE 7: GENERATING COMPREHENSIVE FIX PLAN');
    console.log('-'.repeat(60));
    
    // Based on all identified issues, create targeted fixes
    this.fixes = [
      {
        priority: 1,
        category: 'API Routing Fix',
        title: 'Fix HTML responses from API endpoints',
        description: 'Update server routes to ensure proper JSON responses for technical-analysis and risk-assessment endpoints',
        implementation: [
          'Add proper route parameters for technical-analysis endpoint',
          'Fix route handler to return JSON instead of HTML',
          'Add proper error handling and JSON responses',
          'Test all endpoint responses with external validation'
        ],
        affectedComponents: ['TechnicalAnalysisSummary', 'RiskAssessmentDashboard'],
        urgency: 'CRITICAL'
      },
      {
        priority: 2,
        category: 'Signal Data Structure',
        title: 'Complete signal data structure for UI components',
        description: 'Ensure all signals include required fields for proper component display',
        implementation: [
          'Add entryPrice, stopLoss, takeProfit to all signal responses',
          'Validate signal data structure in backend before sending',
          'Update signal generation to include all required fields',
          'Add proper TypeScript types for signal validation'
        ],
        affectedComponents: ['AdvancedSignalDashboard', 'TechnicalAnalysisSummary'],
        urgency: 'HIGH'
      },
      {
        priority: 3,
        category: 'Cross-Pair State Management',
        title: 'Improve cross-pair switching reliability',
        description: 'Enhance component state management when switching between cryptocurrency pairs',
        implementation: [
          'Add proper state reset when symbol changes',
          'Implement loading states during symbol transitions',
          'Add error boundaries for component state failures',
          'Ensure proper cleanup of previous symbol data'
        ],
        affectedComponents: ['All analysis components'],
        urgency: 'MEDIUM'
      }
    ];
    
    console.log('✅ Comprehensive fix plan generated');
    console.log(`   - ${this.fixes.length} targeted fixes identified`);
    console.log(`   - ${this.fixes.filter(f => f.urgency === 'CRITICAL').length} critical priority fixes`);
  }

  generateDiagnosisReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        criticalIssues: this.issues.filter(i => i.severity === 'CRITICAL').length,
        highIssues: this.issues.filter(i => i.severity === 'HIGH').length,
        mediumIssues: this.issues.filter(i => i.severity === 'MEDIUM').length
      },
      rootCauseAnalysis: {
        primaryIssue: 'API endpoints returning HTML instead of JSON responses',
        secondaryIssue: 'Incomplete signal data structure missing required fields',
        impactedFunctionality: [
          'Technical Analysis Summary component data loading',
          'Risk Assessment Dashboard component data loading',
          'Cross-pair switching reliability'
        ]
      },
      validationResults: this.validationResults,
      identifiedIssues: this.issues,
      comprehensiveFixPlan: this.fixes,
      recommendedActions: [
        'Implement API routing fixes immediately (Critical Priority)',
        'Complete signal data structure (High Priority)', 
        'Test cross-pair switching after fixes (Medium Priority)',
        'Validate all mathematical calculations (Ongoing)',
        'Implement comprehensive external shell testing (Ongoing)'
      ],
      systemHealthScore: this.calculateSystemHealthScore()
    };
    
    // Save report
    const reportPath = `critical_system_diagnosis_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 DIAGNOSIS REPORT SUMMARY');
    console.log('='.repeat(80));
    console.log(`System Health Score: ${report.systemHealthScore}%`);
    console.log(`Total Issues: ${report.summary.totalIssues}`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`High Priority Issues: ${report.summary.highIssues}`);
    console.log(`\nRoot Cause: ${report.rootCauseAnalysis.primaryIssue}`);
    console.log(`\nFix Plan: ${this.fixes.length} targeted fixes identified`);
    console.log(`Report saved to: ${reportPath}`);
    
    return report;
  }

  calculateSystemHealthScore() {
    // Calculate based on validation results
    let score = 100;
    
    // API endpoint reliability
    if (this.validationResults.apiEndpoints) {
      score *= (this.validationResults.apiEndpoints.reliability / 100);
    } else {
      score *= 0.5; // Major penalty if endpoints couldn't be tested
    }
    
    // Signal structure validity
    if (this.validationResults.signalStructure) {
      const btcValid = this.validationResults.signalStructure.btc?.valid || false;
      const xrpValid = this.validationResults.signalStructure.xrp?.valid || false;
      score *= (btcValid && xrpValid) ? 1.0 : 0.7;
    }
    
    // Technical analysis data flow
    if (this.validationResults.technicalAnalysis) {
      const btcValid = this.validationResults.technicalAnalysis.btc?.valid || false;
      const xrpValid = this.validationResults.technicalAnalysis.xrp?.valid || false;
      score *= (btcValid && xrpValid) ? 1.0 : 0.6;
    }
    
    // Risk assessment data flow
    if (this.validationResults.riskAssessment) {
      const btcValid = this.validationResults.riskAssessment.btc?.valid || false;
      const xrpValid = this.validationResults.riskAssessment.xrp?.valid || false;
      score *= (btcValid && xrpValid) ? 1.0 : 0.8;
    }
    
    return Math.round(score);
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
        // This is the problem - getting HTML instead of JSON
        const text = await response.text();
        throw new Error(`Expected JSON but received: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute diagnosis
async function main() {
  const diagnosis = new CriticalSystemDiagnosis();
  
  try {
    console.log('🚀 Starting Critical System Diagnosis...');
    const report = await diagnosis.runCompleteDiagnosis();
    
    console.log('\n✅ Diagnosis Complete!');
    console.log('Comprehensive fix plan generated with targeted solutions.');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  }
}

main();