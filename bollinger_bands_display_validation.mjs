/**
 * BOLLINGER BANDS DISPLAY VALIDATION - EXTERNAL SHELL TESTING
 * Comprehensive validation of duplicate Bollinger Bands elimination
 * 
 * Ground Rules Compliance:
 * - External shell testing with 20+ cycles validation
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of UI display fixes
 * - Zero tolerance for system crashes
 * - Market-driven data extraction verification
 */

import { spawn } from 'child_process';
import fs from 'fs';

class BollingerBandsDisplayValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      apiDataValidation: [],
      duplicateEliminationValidation: [],
      displayCorrectness: [],
      systemHealth: [],
      overallScore: 0
    };
    this.validationCycles = 0;
    this.targetCycles = 25;
  }

  async runCompleteValidation() {
    console.log('🔧 BOLLINGER BANDS DISPLAY VALIDATION - EXTERNAL SHELL TESTING');
    console.log('===============================================================');
    console.log('Target: Validate duplicate elimination and display correctness');
    console.log(`Validation Cycles: ${this.targetCycles}`);
    console.log('Ground Rules: Authentic data only, zero synthetic fallbacks\n');

    for (let cycle = 1; cycle <= this.targetCycles; cycle++) {
      console.log(`\n--- VALIDATION CYCLE ${cycle}/${this.targetCycles} ---`);
      
      await this.validateAPIDataStructure(cycle);
      await this.validateDuplicateElimination(cycle);
      await this.validateDisplayCorrectness(cycle);
      await this.validateSystemHealth(cycle);
      
      this.validationCycles++;
      
      if (cycle < this.targetCycles) {
        await this.sleep(2000); // 2-second interval between cycles
      }
    }

    await this.generateFinalValidationReport();
  }

  async validateAPIDataStructure(cycle) {
    try {
      console.log(`\n📊 API Data Structure Validation - Cycle ${cycle}`);
      
      // Test technical analysis API response structure
      const response = await this.makeRequest('/api/technical-analysis/BTC%2FUSDT?timeframe=1d');
      
      if (!response.success) {
        throw new Error(`API returned error: ${response.error || 'Unknown error'}`);
      }

      // Validate Bollinger Bands data structure
      const indicators = response.indicators;
      const bollingerBands = indicators?.bollingerBands;
      
      const validation = {
        cycle,
        timestamp: new Date().toISOString(),
        hasIndicators: !!indicators,
        hasBollingerBands: !!bollingerBands,
        hasUpperBand: typeof bollingerBands?.upper === 'number',
        hasMiddleBand: typeof bollingerBands?.middle === 'number',
        hasLowerBand: typeof bollingerBands?.lower === 'number',
        hasPosition: typeof bollingerBands?.position === 'string',
        upperValue: bollingerBands?.upper,
        middleValue: bollingerBands?.middle,
        lowerValue: bollingerBands?.lower,
        position: bollingerBands?.position,
        currentPrice: response.currentPrice,
        dataSource: response.dataSource
      };

      // Validate data quality
      if (validation.hasUpperBand && validation.hasMiddleBand && validation.hasLowerBand) {
        validation.bandsValid = validation.upperValue > validation.middleValue > validation.lowerValue;
        validation.priceWithinRange = validation.currentPrice >= validation.lowerValue && 
                                     validation.currentPrice <= validation.upperValue;
      }

      console.log(`✅ BB Data: Upper=${validation.upperValue?.toFixed(0)}, Middle=${validation.middleValue?.toFixed(0)}, Lower=${validation.lowerValue?.toFixed(0)}`);
      console.log(`📍 Position: ${validation.position}, Price: $${validation.currentPrice?.toFixed(2)}`);
      console.log(`🔍 Validation: Bands=${validation.bandsValid ? 'VALID' : 'INVALID'}, Price Range=${validation.priceWithinRange ? 'WITHIN' : 'OUTSIDE'}`);

      this.testResults.apiDataValidation.push(validation);

    } catch (error) {
      console.log(`❌ API Data Structure Validation Failed - Cycle ${cycle}:`, error.message);
      this.testResults.apiDataValidation.push({
        cycle,
        timestamp: new Date().toISOString(),
        error: error.message,
        failed: true
      });
    }
  }

  async validateDuplicateElimination(cycle) {
    try {
      console.log(`\n🎯 Duplicate Elimination Validation - Cycle ${cycle}`);
      
      // Read the component file to verify duplicate removal
      const componentPath = './client/src/components/TechnicalAnalysisSummary.tsx';
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // Count Bollinger Bands display sections
      const bollingerSectionMatches = componentContent.match(/Bollinger Bands/g) || [];
      const bbUpperMatches = componentContent.match(/bb_upper/g) || [];
      const bbLowerMatches = componentContent.match(/bb_lower/g) || [];
      const bbMiddleMatches = componentContent.match(/bb_middle/g) || [];
      
      // Check for the working section (bollingerBands.upper pattern)
      const workingSectionExists = componentContent.includes('bollingerBands?.upper');
      
      // Check that non-working section (indicators.bb_upper pattern) is removed
      const nonWorkingSectionRemoved = !componentContent.includes('indicators.bb_upper?.toFixed');

      const validation = {
        cycle,
        timestamp: new Date().toISOString(),
        bollingerSectionCount: bollingerSectionMatches.length,
        bbUpperReferences: bbUpperMatches.length,
        bbLowerReferences: bbLowerMatches.length,
        bbMiddleReferences: bbMiddleMatches.length,
        workingSectionExists,
        nonWorkingSectionRemoved,
        duplicateEliminated: bollingerSectionMatches.length === 1 && workingSectionExists && nonWorkingSectionRemoved
      };

      console.log(`📊 BB Sections Found: ${validation.bollingerSectionCount}`);
      console.log(`✅ Working Section: ${validation.workingSectionExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`🗑️  Non-Working Section: ${validation.nonWorkingSectionRemoved ? 'REMOVED' : 'STILL PRESENT'}`);
      console.log(`🎯 Duplicate Elimination: ${validation.duplicateEliminated ? 'SUCCESS' : 'FAILED'}`);

      this.testResults.duplicateEliminationValidation.push(validation);

    } catch (error) {
      console.log(`❌ Duplicate Elimination Validation Failed - Cycle ${cycle}:`, error.message);
      this.testResults.duplicateEliminationValidation.push({
        cycle,
        timestamp: new Date().toISOString(),
        error: error.message,
        failed: true
      });
    }
  }

  async validateDisplayCorrectness(cycle) {
    try {
      console.log(`\n🖥️  Display Correctness Validation - Cycle ${cycle}`);
      
      // Simulate component data extraction logic
      const apiResponse = await this.makeRequest('/api/technical-analysis/BTC%2FUSDT?timeframe=1d');
      
      if (!apiResponse.success) {
        throw new Error('API response failed');
      }

      const indicators = apiResponse.indicators;
      
      // Test the extraction logic used in the component
      const extractedData = {
        bollingerBands: indicators?.bollingerBands,
        bb_upper: indicators?.bb_upper,
        bb_lower: indicators?.bb_lower,
        bb_middle: indicators?.bb_middle
      };

      // Simulate the component's safeNumber function
      const safeNumber = (value, fallback) => {
        if (typeof value === 'number' && !isNaN(value)) return value;
        return fallback;
      };

      // Test extraction as done in component
      const bbUpper = safeNumber(extractedData.bollingerBands?.upper || extractedData.bb_upper, 0);
      const bbLower = safeNumber(extractedData.bollingerBands?.lower || extractedData.bb_lower, 0);
      const bbMiddle = safeNumber(extractedData.bollingerBands?.middle || extractedData.bb_middle, 0);

      const validation = {
        cycle,
        timestamp: new Date().toISOString(),
        rawBollingerBands: extractedData.bollingerBands,
        rawBbUpper: extractedData.bb_upper,
        extractedUpper: bbUpper,
        extractedMiddle: bbMiddle,
        extractedLower: bbLower,
        valuesExtracted: bbUpper > 0 && bbMiddle > 0 && bbLower > 0,
        bandsLogicalOrder: bbUpper > bbMiddle && bbMiddle > bbLower,
        displayReady: bbUpper > 0 && bbMiddle > 0 && bbLower > 0 && bbUpper > bbMiddle && bbMiddle > bbLower
      };

      console.log(`📊 Extracted Values: Upper=${bbUpper}, Middle=${bbMiddle}, Lower=${bbLower}`);
      console.log(`✅ Values Present: ${validation.valuesExtracted ? 'YES' : 'NO'}`);
      console.log(`📈 Logical Order: ${validation.bandsLogicalOrder ? 'CORRECT' : 'INCORRECT'}`);
      console.log(`🖥️  Display Ready: ${validation.displayReady ? 'YES' : 'NO'}`);

      this.testResults.displayCorrectness.push(validation);

    } catch (error) {
      console.log(`❌ Display Correctness Validation Failed - Cycle ${cycle}:`, error.message);
      this.testResults.displayCorrectness.push({
        cycle,
        timestamp: new Date().toISOString(),
        error: error.message,
        failed: true
      });
    }
  }

  async validateSystemHealth(cycle) {
    try {
      console.log(`\n🏥 System Health Validation - Cycle ${cycle}`);
      
      // Test multiple endpoints to ensure no crashes
      const endpoints = [
        '/api/technical-analysis/BTC%2FUSDT?timeframe=1d',
        '/api/pattern-analysis/BTC%2FUSDT',
        '/api/signals/BTC%2FUSDT',
        '/api/crypto/BTC%2FUSDT'
      ];

      const healthChecks = [];
      
      for (const endpoint of endpoints) {
        try {
          const startTime = Date.now();
          const response = await this.makeRequest(endpoint);
          const responseTime = Date.now() - startTime;
          
          healthChecks.push({
            endpoint,
            status: response ? 'SUCCESS' : 'FAILED',
            responseTime,
            hasData: !!response
          });
          
        } catch (error) {
          healthChecks.push({
            endpoint,
            status: 'ERROR',
            error: error.message,
            responseTime: 0
          });
        }
      }

      const successfulChecks = healthChecks.filter(check => check.status === 'SUCCESS').length;
      const avgResponseTime = healthChecks
        .filter(check => check.responseTime > 0)
        .reduce((sum, check) => sum + check.responseTime, 0) / healthChecks.length;

      const validation = {
        cycle,
        timestamp: new Date().toISOString(),
        healthChecks,
        successfulEndpoints: successfulChecks,
        totalEndpoints: endpoints.length,
        healthScore: (successfulChecks / endpoints.length) * 100,
        avgResponseTime,
        systemStable: successfulChecks >= 3
      };

      console.log(`🔍 Endpoints Tested: ${validation.totalEndpoints}`);
      console.log(`✅ Successful: ${validation.successfulEndpoints}/${validation.totalEndpoints}`);
      console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`🏥 System Health: ${validation.healthScore.toFixed(1)}%`);

      this.testResults.systemHealth.push(validation);

    } catch (error) {
      console.log(`❌ System Health Validation Failed - Cycle ${cycle}:`, error.message);
      this.testResults.systemHealth.push({
        cycle,
        timestamp: new Date().toISOString(),
        error: error.message,
        failed: true
      });
    }
  }

  async generateFinalValidationReport() {
    console.log('\n🏁 FINAL VALIDATION REPORT');
    console.log('===========================');

    // Calculate success rates
    const apiValidationSuccess = this.calculateSuccessRate(this.testResults.apiDataValidation, 'bandsValid');
    const duplicateEliminationSuccess = this.calculateSuccessRate(this.testResults.duplicateEliminationValidation, 'duplicateEliminated');
    const displayCorrectnessSuccess = this.calculateSuccessRate(this.testResults.displayCorrectness, 'displayReady');
    const systemHealthSuccess = this.calculateSuccessRate(this.testResults.systemHealth, 'systemStable');

    // Calculate overall score
    const overallScore = (apiValidationSuccess + duplicateEliminationSuccess + displayCorrectnessSuccess + systemHealthSuccess) / 4;

    const report = {
      validationSummary: {
        totalCycles: this.validationCycles,
        targetCycles: this.targetCycles,
        completionRate: (this.validationCycles / this.targetCycles) * 100
      },
      metrics: {
        apiDataValidation: `${apiValidationSuccess.toFixed(1)}%`,
        duplicateElimination: `${duplicateEliminationSuccess.toFixed(1)}%`,
        displayCorrectness: `${displayCorrectnessSuccess.toFixed(1)}%`,
        systemHealth: `${systemHealthSuccess.toFixed(1)}%`,
        overallScore: `${overallScore.toFixed(1)}%`
      },
      validationResults: {
        bollingerBandsDataStructure: apiValidationSuccess >= 90 ? 'EXCELLENT' : apiValidationSuccess >= 70 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
        duplicateElimination: duplicateEliminationSuccess >= 95 ? 'COMPLETE' : 'INCOMPLETE',
        displayFunctionality: displayCorrectnessSuccess >= 90 ? 'WORKING' : 'ISSUES_DETECTED',
        systemStability: systemHealthSuccess >= 85 ? 'STABLE' : 'UNSTABLE'
      },
      recommendations: this.generateRecommendations(overallScore, {
        apiValidationSuccess,
        duplicateEliminationSuccess,
        displayCorrectnessSuccess,
        systemHealthSuccess
      }),
      timestamp: new Date().toISOString()
    };

    // Display results
    console.log('\n📊 VALIDATION METRICS:');
    console.log(`├─ API Data Validation: ${report.metrics.apiDataValidation}`);
    console.log(`├─ Duplicate Elimination: ${report.metrics.duplicateElimination}`);
    console.log(`├─ Display Correctness: ${report.metrics.displayCorrectness}`);
    console.log(`├─ System Health: ${report.metrics.systemHealth}`);
    console.log(`└─ Overall Score: ${report.metrics.overallScore}`);

    console.log('\n🎯 VALIDATION RESULTS:');
    console.log(`├─ Bollinger Bands Data: ${report.validationResults.bollingerBandsDataStructure}`);
    console.log(`├─ Duplicate Elimination: ${report.validationResults.duplicateElimination}`);
    console.log(`├─ Display Functionality: ${report.validationResults.displayFunctionality}`);
    console.log(`└─ System Stability: ${report.validationResults.systemStability}`);

    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`├─ ${rec}`));

    // Save detailed report
    const reportPath = `bollinger_bands_validation_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
      report,
      detailedResults: this.testResults
    }, null, 2));

    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
    // Final status
    if (overallScore >= 90) {
      console.log('\n🎉 BOLLINGER BANDS DISPLAY FIX: VALIDATION SUCCESSFUL');
      console.log('✅ Duplicate eliminated, display working correctly');
    } else if (overallScore >= 70) {
      console.log('\n⚠️  BOLLINGER BANDS DISPLAY FIX: MOSTLY SUCCESSFUL');
      console.log('🔧 Minor issues detected, may need fine-tuning');
    } else {
      console.log('\n❌ BOLLINGER BANDS DISPLAY FIX: VALIDATION FAILED');
      console.log('🚨 Critical issues detected, requires immediate attention');
    }

    return report;
  }

  calculateSuccessRate(results, successKey) {
    if (!results.length) return 0;
    const successful = results.filter(result => !result.failed && result[successKey]).length;
    return (successful / results.length) * 100;
  }

  generateRecommendations(overallScore, scores) {
    const recommendations = [];

    if (scores.duplicateEliminationSuccess < 100) {
      recommendations.push('Complete removal of non-working Bollinger Bands section');
    }

    if (scores.displayCorrectnessSuccess < 90) {
      recommendations.push('Verify data extraction logic in TechnicalAnalysisSummary component');
    }

    if (scores.apiValidationSuccess < 90) {
      recommendations.push('Check API response structure consistency');
    }

    if (scores.systemHealthSuccess < 85) {
      recommendations.push('Monitor system stability and endpoint response times');
    }

    if (overallScore >= 90) {
      recommendations.push('Bollinger Bands display fix validated successfully');
    } else {
      recommendations.push('Continue monitoring display functionality');
    }

    return recommendations;
  }

  async makeRequest(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.log(`Request failed for ${endpoint}:`, error.message);
      return null;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute validation
async function main() {
  const validator = new BollingerBandsDisplayValidator();
  
  try {
    await validator.runCompleteValidation();
    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();