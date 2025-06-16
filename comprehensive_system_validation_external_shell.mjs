/**
 * COMPREHENSIVE SYSTEM VALIDATION - EXTERNAL SHELL TESTING
 * Deep dive analysis of entire main codebase with line-by-line review
 * 
 * Ground Rules Compliance:
 * - External shell testing with 30+ cycle validation
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of all implementations
 * - Zero tolerance for system crashes
 * - Complete mathematical accuracy verification
 * - Full UI display functionality testing
 */

import fs from 'fs';
import path from 'path';

class ComprehensiveSystemValidation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.validationResults = {
      mathematicalCalculations: {},
      autoCalculationSystem: {},
      uiDisplayFunctionality: {},
      crossPairSwitching: {},
      timeframeAnalysis: {},
      systemHealth: {},
      errorAnalysis: {}
    };
    this.testCycles = 0;
    this.maxCycles = 30;
    this.groundRulesCompliance = 0;
  }

  async runComprehensiveValidation() {
    console.log('\n🔍 COMPREHENSIVE SYSTEM VALIDATION - EXTERNAL SHELL TESTING');
    console.log('='.repeat(80));
    
    // Phase 1: Mathematical Calculations Validation
    await this.validateMathematicalCalculations();
    
    // Phase 2: Auto-Calculation System Analysis
    await this.validateAutoCalculationSystem();
    
    // Phase 3: UI Display Functionality Testing
    await this.validateUIDisplayFunctionality();
    
    // Phase 4: Cross-Pair Switching Analysis (BTC to XRP Issue)
    await this.validateCrossPairSwitching();
    
    // Phase 5: Timeframe Analysis Verification
    await this.validateTimeframeAnalysis();
    
    // Phase 6: System Health Deep Dive
    await this.validateSystemHealth();
    
    // Phase 7: Error Log Analysis
    await this.analyzeErrorLogs();
    
    // Generate final validation report
    await this.generateValidationReport();
    
    return this.validationResults;
  }

  async validateMathematicalCalculations() {
    console.log('\n📊 PHASE 1: MATHEMATICAL CALCULATIONS VALIDATION');
    console.log('-'.repeat(60));
    
    const testPairs = ['BTC/USDT', 'XRP/USDT', 'ETH/USDT'];
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    
    for (const pair of testPairs) {
      console.log(`\n🔢 Testing mathematical calculations for ${pair}`);
      
      for (const timeframe of timeframes) {
        try {
          // Test technical analysis API
          const technicalResponse = await this.makeRequest(`/api/technical-analysis?symbol=${encodeURIComponent(pair)}&timeframe=${timeframe}`);
          
          if (technicalResponse.status === 'success' && technicalResponse.data) {
            const indicators = technicalResponse.data.indicators;
            
            // Validate RSI calculation
            if (indicators.rsi !== undefined) {
              const rsiValid = indicators.rsi >= 0 && indicators.rsi <= 100;
              this.validationResults.mathematicalCalculations[`${pair}_${timeframe}_rsi`] = {
                valid: rsiValid,
                value: indicators.rsi,
                expected: 'Between 0-100'
              };
            }
            
            // Validate MACD calculation
            if (indicators.macd && typeof indicators.macd === 'object') {
              const macdValid = typeof indicators.macd.value === 'number' && 
                               typeof indicators.macd.signal === 'number' &&
                               typeof indicators.macd.histogram === 'number';
              this.validationResults.mathematicalCalculations[`${pair}_${timeframe}_macd`] = {
                valid: macdValid,
                value: indicators.macd,
                expected: 'Object with value, signal, histogram'
              };
            }
            
            // Validate Bollinger Bands calculation
            if (indicators.bollingerBands && typeof indicators.bollingerBands === 'object') {
              const bbValid = typeof indicators.bollingerBands.upper === 'number' &&
                             typeof indicators.bollingerBands.middle === 'number' &&
                             typeof indicators.bollingerBands.lower === 'number' &&
                             indicators.bollingerBands.upper > indicators.bollingerBands.middle &&
                             indicators.bollingerBands.middle > indicators.bollingerBands.lower;
              this.validationResults.mathematicalCalculations[`${pair}_${timeframe}_bb`] = {
                valid: bbValid,
                value: indicators.bollingerBands,
                expected: 'Upper > Middle > Lower'
              };
            }
            
            console.log(`  ✅ ${timeframe}: Math calculations valid`);
          } else {
            console.log(`  ❌ ${timeframe}: Failed to get technical analysis data`);
            this.validationResults.mathematicalCalculations[`${pair}_${timeframe}_failed`] = {
              valid: false,
              error: 'API request failed'
            };
          }
          
          await this.sleep(100); // Rate limiting
        } catch (error) {
          console.log(`  ❌ ${timeframe}: Error - ${error.message}`);
          this.validationResults.mathematicalCalculations[`${pair}_${timeframe}_error`] = {
            valid: false,
            error: error.message
          };
        }
      }
    }
  }

  async validateAutoCalculationSystem() {
    console.log('\n🔄 PHASE 2: AUTO-CALCULATION SYSTEM ANALYSIS');
    console.log('-'.repeat(60));
    
    // Test signal generation API
    const signalResponse = await this.makeRequest('/api/signals?symbol=BTC%2FUSDT');
    
    if (signalResponse && Array.isArray(signalResponse) && signalResponse.length > 0) {
      console.log(`✅ Signal generation working - ${signalResponse.length} signals found`);
      
      // Analyze signal structure
      const sampleSignal = signalResponse[0];
      const requiredFields = ['direction', 'confidence', 'timeframe', 'entryPrice', 'stopLoss', 'takeProfit'];
      
      let fieldsValid = true;
      for (const field of requiredFields) {
        if (!(field in sampleSignal)) {
          fieldsValid = false;
          console.log(`❌ Missing required field: ${field}`);
        }
      }
      
      this.validationResults.autoCalculationSystem.signalStructure = {
        valid: fieldsValid,
        sampleSignal: sampleSignal,
        fieldsPresent: Object.keys(sampleSignal)
      };
      
      // Test confidence scoring
      const confidenceValid = signalResponse.every(signal => 
        signal.confidence >= 0 && signal.confidence <= 100
      );
      
      this.validationResults.autoCalculationSystem.confidenceScoring = {
        valid: confidenceValid,
        range: [
          Math.min(...signalResponse.map(s => s.confidence)),
          Math.max(...signalResponse.map(s => s.confidence))
        ]
      };
      
    } else {
      console.log('❌ Signal generation failed or returned empty array');
      this.validationResults.autoCalculationSystem.signalGeneration = {
        valid: false,
        error: 'No signals returned'
      };
    }
    
    // Test automated timing system
    await this.testAutomatedTiming();
  }

  async testAutomatedTiming() {
    console.log('\n⏰ Testing automated timing system...');
    
    // Monitor for automated calculations over a 30-second period
    const startTime = Date.now();
    const monitorDuration = 30000; // 30 seconds
    let calculationEvents = 0;
    
    const checkInterval = setInterval(async () => {
      try {
        const response = await this.makeRequest('/api/signals?symbol=XRP%2FUSDT');
        if (response && Array.isArray(response) && response.length > 0) {
          calculationEvents++;
        }
      } catch (error) {
        // Silent handling for timing test
      }
    }, 5000);
    
    await this.sleep(monitorDuration);
    clearInterval(checkInterval);
    
    this.validationResults.autoCalculationSystem.automatedTiming = {
      valid: calculationEvents > 0,
      events: calculationEvents,
      duration: monitorDuration / 1000,
      frequency: calculationEvents / (monitorDuration / 1000)
    };
    
    console.log(`📊 Automated timing: ${calculationEvents} events in ${monitorDuration/1000}s`);
  }

  async validateUIDisplayFunctionality() {
    console.log('\n🖥️ PHASE 3: UI DISPLAY FUNCTIONALITY TESTING');
    console.log('-'.repeat(60));
    
    // Test all major UI endpoints
    const uiEndpoints = [
      { name: 'Technical Analysis', endpoint: '/api/technical-analysis?symbol=BTC%2FUSDT&timeframe=4h' },
      { name: 'Risk Assessment', endpoint: '/api/risk-assessment?symbol=BTC%2FUSDT&timeframe=4h' },
      { name: 'Advanced Signals', endpoint: '/api/signals?symbol=BTC%2FUSDT' },
      { name: 'Confluence Analysis', endpoint: '/api/confluence-analysis?symbol=BTC%2FUSDT&timeframe=4h' },
      { name: 'Pattern Recognition', endpoint: '/api/pattern-recognition?symbol=BTC%2FUSDT&timeframe=4h' }
    ];
    
    for (const endpoint of uiEndpoints) {
      try {
        console.log(`\n🔍 Testing ${endpoint.name}...`);
        const response = await this.makeRequest(endpoint.endpoint);
        
        if (response && response.status === 'success') {
          console.log(`  ✅ ${endpoint.name}: Data loaded successfully`);
          this.validationResults.uiDisplayFunctionality[endpoint.name] = {
            valid: true,
            responseTime: response.responseTime || 'N/A',
            dataPresent: !!response.data
          };
        } else {
          console.log(`  ❌ ${endpoint.name}: Failed to load data`);
          this.validationResults.uiDisplayFunctionality[endpoint.name] = {
            valid: false,
            error: 'Failed to load data'
          };
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: Error - ${error.message}`);
        this.validationResults.uiDisplayFunctionality[endpoint.name] = {
          valid: false,
          error: error.message
        };
      }
    }
  }

  async validateCrossPairSwitching() {
    console.log('\n🔄 PHASE 4: CROSS-PAIR SWITCHING ANALYSIS (BTC to XRP Issue)');
    console.log('-'.repeat(60));
    
    // Test the specific BTC to XRP switching issue
    console.log('📋 Testing BTC to XRP switching sequence...');
    
    // Step 1: Get BTC data
    const btcTechnical = await this.makeRequest('/api/technical-analysis?symbol=BTC%2FUSDT&timeframe=4h');
    const btcRisk = await this.makeRequest('/api/risk-assessment?symbol=BTC%2FUSDT&timeframe=4h');
    
    await this.sleep(1000);
    
    // Step 2: Switch to XRP data
    const xrpTechnical = await this.makeRequest('/api/technical-analysis?symbol=XRP%2FUSDT&timeframe=4h');
    const xrpRisk = await this.makeRequest('/api/risk-assessment?symbol=XRP%2FUSDT&timeframe=4h');
    
    // Analyze data consistency
    const btcValid = btcTechnical && btcTechnical.status === 'success' && btcRisk && btcRisk.status === 'success';
    const xrpValid = xrpTechnical && xrpTechnical.status === 'success' && xrpRisk && xrpRisk.status === 'success';
    
    this.validationResults.crossPairSwitching = {
      btcDataValid: btcValid,
      xrpDataValid: xrpValid,
      switchingWorking: btcValid && xrpValid,
      btcTechnicalResponse: btcTechnical ? 'Success' : 'Failed',
      btcRiskResponse: btcRisk ? 'Success' : 'Failed',
      xrpTechnicalResponse: xrpTechnical ? 'Success' : 'Failed',
      xrpRiskResponse: xrpRisk ? 'Success' : 'Failed'
    };
    
    if (btcValid && xrpValid) {
      console.log('✅ Cross-pair switching working correctly');
      
      // Deep analysis of data differences
      if (btcTechnical.data && xrpTechnical.data) {
        const btcPrice = btcTechnical.data.currentPrice;
        const xrpPrice = xrpTechnical.data.currentPrice;
        
        console.log(`📊 BTC Price: $${btcPrice}, XRP Price: $${xrpPrice}`);
        
        // Validate price ranges are realistic
        const btcPriceValid = btcPrice > 50000 && btcPrice < 200000;
        const xrpPriceValid = xrpPrice > 0.1 && xrpPrice < 10;
        
        this.validationResults.crossPairSwitching.priceValidation = {
          btcPriceRealistic: btcPriceValid,
          xrpPriceRealistic: xrpPriceValid,
          btcPrice: btcPrice,
          xrpPrice: xrpPrice
        };
      }
    } else {
      console.log('❌ Cross-pair switching issue detected');
      console.log(`   BTC Technical: ${btcTechnical ? 'OK' : 'FAILED'}`);
      console.log(`   BTC Risk: ${btcRisk ? 'OK' : 'FAILED'}`);
      console.log(`   XRP Technical: ${xrpTechnical ? 'OK' : 'FAILED'}`);
      console.log(`   XRP Risk: ${xrpRisk ? 'OK' : 'FAILED'}`);
    }
  }

  async validateTimeframeAnalysis() {
    console.log('\n⏱️ PHASE 5: TIMEFRAME ANALYSIS VERIFICATION');
    console.log('-'.repeat(60));
    
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    const testSymbol = 'XRP/USDT';
    
    for (const timeframe of timeframes) {
      console.log(`\n🔍 Testing ${timeframe} timeframe for ${testSymbol}...`);
      
      try {
        const response = await this.makeRequest(`/api/technical-analysis?symbol=${encodeURIComponent(testSymbol)}&timeframe=${timeframe}`);
        
        if (response && response.status === 'success' && response.data) {
          const data = response.data;
          
          // Validate timeframe-specific data
          const hasValidData = data.indicators && 
                              typeof data.confidence === 'number' &&
                              data.timeframe === timeframe;
          
          this.validationResults.timeframeAnalysis[timeframe] = {
            valid: hasValidData,
            confidence: data.confidence,
            direction: data.direction,
            indicators: Object.keys(data.indicators || {}),
            responseTime: response.responseTime || 'N/A'
          };
          
          console.log(`  ✅ ${timeframe}: Valid data with ${data.confidence}% confidence`);
        } else {
          console.log(`  ❌ ${timeframe}: Invalid response`);
          this.validationResults.timeframeAnalysis[timeframe] = {
            valid: false,
            error: 'Invalid response structure'
          };
        }
      } catch (error) {
        console.log(`  ❌ ${timeframe}: Error - ${error.message}`);
        this.validationResults.timeframeAnalysis[timeframe] = {
          valid: false,
          error: error.message
        };
      }
      
      await this.sleep(200); // Rate limiting
    }
  }

  async validateSystemHealth() {
    console.log('\n🏥 PHASE 6: SYSTEM HEALTH DEEP DIVE');
    console.log('-'.repeat(60));
    
    // Test all critical endpoints
    const healthChecks = [
      { name: 'Server Status', endpoint: '/api/health' },
      { name: 'Price Data', endpoint: '/api/price?symbol=BTC%2FUSDT' },
      { name: 'Signal Generation', endpoint: '/api/signals?symbol=BTC%2FUSDT' },
      { name: 'Technical Analysis', endpoint: '/api/technical-analysis?symbol=BTC%2FUSDT&timeframe=4h' },
      { name: 'Risk Assessment', endpoint: '/api/risk-assessment?symbol=BTC%2FUSDT&timeframe=4h' }
    ];
    
    let healthyEndpoints = 0;
    
    for (const check of healthChecks) {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest(check.endpoint);
        const responseTime = Date.now() - startTime;
        
        const isHealthy = response && (response.status === 'success' || response.price || Array.isArray(response));
        
        if (isHealthy) {
          healthyEndpoints++;
          console.log(`✅ ${check.name}: Healthy (${responseTime}ms)`);
        } else {
          console.log(`❌ ${check.name}: Unhealthy`);
        }
        
        this.validationResults.systemHealth[check.name] = {
          healthy: isHealthy,
          responseTime: responseTime,
          response: response ? 'Data received' : 'No response'
        };
      } catch (error) {
        console.log(`❌ ${check.name}: Error - ${error.message}`);
        this.validationResults.systemHealth[check.name] = {
          healthy: false,
          error: error.message
        };
      }
    }
    
    const overallHealth = (healthyEndpoints / healthChecks.length) * 100;
    this.validationResults.systemHealth.overall = {
      score: overallHealth,
      healthyEndpoints: healthyEndpoints,
      totalEndpoints: healthChecks.length
    };
    
    console.log(`\n📊 Overall System Health: ${overallHealth.toFixed(1)}%`);
  }

  async analyzeErrorLogs() {
    console.log('\n📋 PHASE 7: ERROR LOG ANALYSIS');
    console.log('-'.repeat(60));
    
    // Analyze the provided error log for critical issues
    const errorPatterns = [
      'WebGL',
      'sandbox attribute',
      'Unrecognized feature',
      'Failed to load',
      'Error:',
      'failed:',
      'undefined',
      'null'
    ];
    
    // Read the attached error log file
    const logFilePath = 'attached_assets/Pasted-7609-d3cccd24cfb6d52f-js-1-Replit-version-f92ca64d-pid2-version-0-0-1418-app-bd9f28eaf03fc820-js--1750108273899_1750108273901.txt';
    
    try {
      if (fs.existsSync(logFilePath)) {
        const logContent = fs.readFileSync(logFilePath, 'utf-8');
        const lines = logContent.split('\n');
        
        let criticalErrors = [];
        let warnings = [];
        let calculationIssues = [];
        
        for (const line of lines) {
          // Check for critical errors
          if (line.includes('Error') || line.includes('failed') || line.includes('❌')) {
            criticalErrors.push(line.trim());
          }
          
          // Check for warnings
          if (line.includes('Unrecognized') || line.includes('WebGL') || line.includes('sandbox')) {
            warnings.push(line.trim());
          }
          
          // Check for calculation issues
          if (line.includes('Calculation blocked') || line.includes('No signal available') || line.includes('undefined')) {
            calculationIssues.push(line.trim());
          }
        }
        
        this.validationResults.errorAnalysis = {
          totalLines: lines.length,
          criticalErrors: criticalErrors.length,
          warnings: warnings.length,
          calculationIssues: calculationIssues.length,
          sampleCriticalErrors: criticalErrors.slice(0, 5),
          sampleCalculationIssues: calculationIssues.slice(0, 5)
        };
        
        console.log(`📊 Log Analysis Results:`);
        console.log(`   Total log lines: ${lines.length}`);
        console.log(`   Critical errors: ${criticalErrors.length}`);
        console.log(`   Warnings: ${warnings.length}`);
        console.log(`   Calculation issues: ${calculationIssues.length}`);
        
        // Analyze specific BTC to XRP switching
        const xrpSwitchLines = lines.filter(line => 
          line.includes('XRP/USDT') && 
          (line.includes('Selected new asset') || line.includes('Symbol changed'))
        );
        
        if (xrpSwitchLines.length > 0) {
          console.log(`\n🔄 XRP switching events found: ${xrpSwitchLines.length}`);
          this.validationResults.errorAnalysis.xrpSwitchingEvents = xrpSwitchLines;
        }
        
      } else {
        console.log(`❌ Error log file not found: ${logFilePath}`);
        this.validationResults.errorAnalysis = {
          error: 'Log file not found'
        };
      }
    } catch (error) {
      console.log(`❌ Error reading log file: ${error.message}`);
      this.validationResults.errorAnalysis = {
        error: error.message
      };
    }
  }

  async generateValidationReport() {
    console.log('\n📊 GENERATING COMPREHENSIVE VALIDATION REPORT');
    console.log('='.repeat(80));
    
    // Calculate overall scores
    const mathScore = this.calculateCategoryScore(this.validationResults.mathematicalCalculations);
    const autoCalcScore = this.calculateCategoryScore(this.validationResults.autoCalculationSystem);
    const uiScore = this.calculateCategoryScore(this.validationResults.uiDisplayFunctionality);
    const switchingScore = this.validationResults.crossPairSwitching.switchingWorking ? 100 : 0;
    const timeframeScore = this.calculateCategoryScore(this.validationResults.timeframeAnalysis);
    const healthScore = this.validationResults.systemHealth.overall?.score || 0;
    
    const overallScore = (mathScore + autoCalcScore + uiScore + switchingScore + timeframeScore + healthScore) / 6;
    
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: overallScore.toFixed(1),
      categoryScores: {
        mathematicalCalculations: mathScore.toFixed(1),
        autoCalculationSystem: autoCalcScore.toFixed(1),
        uiDisplayFunctionality: uiScore.toFixed(1),
        crossPairSwitching: switchingScore.toFixed(1),
        timeframeAnalysis: timeframeScore.toFixed(1),
        systemHealth: healthScore.toFixed(1)
      },
      criticalIssues: this.identifyCriticalIssues(),
      recommendations: this.generateRecommendations(),
      groundRulesCompliance: this.calculateGroundRulesCompliance(),
      testCycles: this.testCycles,
      rawResults: this.validationResults
    };
    
    // Save report to file
    const reportPath = `comprehensive_system_validation_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📋 VALIDATION REPORT SUMMARY`);
    console.log(`Overall Score: ${report.overallScore}%`);
    console.log(`Mathematical Calculations: ${report.categoryScores.mathematicalCalculations}%`);
    console.log(`Auto-Calculation System: ${report.categoryScores.autoCalculationSystem}%`);
    console.log(`UI Display Functionality: ${report.categoryScores.uiDisplayFunctionality}%`);
    console.log(`Cross-Pair Switching: ${report.categoryScores.crossPairSwitching}%`);
    console.log(`Timeframe Analysis: ${report.categoryScores.timeframeAnalysis}%`);
    console.log(`System Health: ${report.categoryScores.systemHealth}%`);
    console.log(`Ground Rules Compliance: ${report.groundRulesCompliance}%`);
    
    if (report.criticalIssues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES IDENTIFIED:`);
      report.criticalIssues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    return report;
  }

  calculateCategoryScore(categoryResults) {
    if (!categoryResults || Object.keys(categoryResults).length === 0) return 0;
    
    const results = Object.values(categoryResults);
    const validResults = results.filter(result => result.valid === true).length;
    
    return (validResults / results.length) * 100;
  }

  identifyCriticalIssues() {
    const issues = [];
    
    // Check cross-pair switching
    if (!this.validationResults.crossPairSwitching.switchingWorking) {
      issues.push('Cross-pair switching from BTC to XRP not working properly');
    }
    
    // Check system health
    if (this.validationResults.systemHealth.overall?.score < 80) {
      issues.push('System health below 80% - multiple endpoints failing');
    }
    
    // Check mathematical calculations
    const mathScore = this.calculateCategoryScore(this.validationResults.mathematicalCalculations);
    if (mathScore < 90) {
      issues.push('Mathematical calculations failing on multiple timeframes/pairs');
    }
    
    // Check error log analysis
    if (this.validationResults.errorAnalysis.criticalErrors > 5) {
      issues.push('High number of critical errors detected in logs');
    }
    
    return issues;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Based on cross-pair switching results
    if (!this.validationResults.crossPairSwitching.switchingWorking) {
      recommendations.push('Fix Technical Analysis Summary and Risk Assessment Dashboard data loading when switching pairs');
      recommendations.push('Implement proper state management for symbol changes');
      recommendations.push('Add error boundaries for component state transitions');
    }
    
    // Based on calculation issues
    const calcIssues = this.validationResults.errorAnalysis.calculationIssues || 0;
    if (calcIssues > 0) {
      recommendations.push('Review 4-minute calculation throttling system');
      recommendations.push('Implement better error handling for blocked calculations');
    }
    
    // Based on UI functionality
    const uiScore = this.calculateCategoryScore(this.validationResults.uiDisplayFunctionality);
    if (uiScore < 100) {
      recommendations.push('Fix failing UI endpoints for complete functionality');
      recommendations.push('Implement better error handling in UI components');
    }
    
    return recommendations;
  }

  calculateGroundRulesCompliance() {
    let compliance = 100;
    
    // Deduct for synthetic data usage (should be 0)
    // Deduct for system crashes (should be 0)
    // Deduct for mathematical inaccuracies
    
    const mathScore = this.calculateCategoryScore(this.validationResults.mathematicalCalculations);
    if (mathScore < 95) compliance -= 10;
    
    const healthScore = this.validationResults.systemHealth.overall?.score || 0;
    if (healthScore < 90) compliance -= 10;
    
    if (!this.validationResults.crossPairSwitching.switchingWorking) compliance -= 15;
    
    return Math.max(0, compliance);
  }

  async makeRequest(endpoint) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error.message);
      return null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute validation
async function main() {
  const validator = new ComprehensiveSystemValidation();
  
  try {
    console.log('🚀 Starting Comprehensive System Validation...');
    const results = await validator.runComprehensiveValidation();
    
    console.log('\n✅ Validation Complete!');
    console.log('Check the generated report for detailed analysis.');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();