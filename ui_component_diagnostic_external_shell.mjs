/**
 * UI COMPONENT DIAGNOSTIC - EXTERNAL SHELL TESTING
 * Comprehensive analysis of Technical Analysis Summary, Risk Assessment Dashboard, and Auto-Calculation Issues
 * 
 * Ground Rules Compliance:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of all implementations
 * - Zero tolerance for system crashes
 */

import fs from 'fs';

class UIComponentDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.diagnosticResults = {};
    this.systemHealth = 0;
  }

  async runCompleteDiagnostic() {
    console.log('\n🔍 UI COMPONENT DIAGNOSTIC - EXTERNAL SHELL TESTING');
    console.log('='.repeat(80));

    // Phase 1: Test API endpoints that feed UI components
    await this.testAPIEndpointsForUIComponents();
    
    // Phase 2: Analyze data structure compatibility
    await this.analyzeDataStructureCompatibility();
    
    // Phase 3: Test auto-calculation system
    await this.testAutoCalculationSystem();
    
    // Phase 4: Identify specific UI component issues
    await this.identifyUIComponentIssues();
    
    return this.generateDiagnosticReport();
  }

  async testAPIEndpointsForUIComponents() {
    console.log('\n📡 PHASE 1: TESTING API ENDPOINTS FOR UI COMPONENTS');
    console.log('-'.repeat(60));
    
    const uiEndpoints = [
      {
        name: 'Technical Analysis Summary',
        endpoint: '/api/technical-analysis/BTC%2FUSDT?timeframe=1d',
        expectedFields: ['data', 'indicators', 'currentPrice', 'confidence', 'patterns']
      },
      {
        name: 'Pattern Analysis (FAILING)',
        endpoint: '/api/pattern-analysis/BTC%2FUSDT',
        expectedFields: ['patterns', 'summary', 'insights']
      },
      {
        name: 'Risk Assessment Dashboard',
        endpoint: '/api/risk-assessment?symbol=BTC%2FUSDT&timeframe=4h',
        expectedFields: ['riskLevel', 'expectedReturn', 'volatility', 'riskReward']
      },
      {
        name: 'Advanced Signal Dashboard',
        endpoint: '/api/signals/BTC%2FUSDT',
        expectedFields: ['entryPrice', 'stopLoss', 'takeProfit', 'confidence', 'direction']
      },
      {
        name: 'Ultra Precision Calculations',
        endpoint: '/api/ultra-precision/BTC%2FUSDT?timeframe=1h',
        expectedFields: ['ultraPrecisionMetrics', 'systemRating', 'mathematicalPrecision']
      }
    ];
    
    let endpointResults = {};
    
    for (const test of uiEndpoints) {
      console.log(`Testing ${test.name}...`);
      
      try {
        const response = await this.makeRequest(test.endpoint);
        
        let dataValidation = {};
        let actualData = response;
        
        // Handle array responses (signals)
        if (Array.isArray(response) && response.length > 0) {
          actualData = response[0];
        }
        
        // Validate expected fields
        for (const field of test.expectedFields) {
          dataValidation[field] = this.hasNestedField(actualData, field) || this.hasNestedField(response, field);
        }
        
        const fieldsPresent = Object.values(dataValidation).filter(Boolean).length;
        const completeness = (fieldsPresent / test.expectedFields.length) * 100;
        
        endpointResults[test.name] = {
          status: 'SUCCESS',
          completeness,
          dataValidation,
          sampleResponse: this.getSampleData(actualData),
          responseType: Array.isArray(response) ? 'Array' : 'Object',
          responseSize: Array.isArray(response) ? response.length : Object.keys(response || {}).length
        };
        
        console.log(`  ✅ ${test.name}: ${completeness}% data completeness`);
        console.log(`     Status: SUCCESS, Type: ${endpointResults[test.name].responseType}, Size: ${endpointResults[test.name].responseSize}`);
        
      } catch (error) {
        endpointResults[test.name] = {
          status: 'FAILED',
          error: error.message,
          completeness: 0
        };
        console.log(`  ❌ ${test.name}: FAILED - ${error.message}`);
      }
    }
    
    this.diagnosticResults.apiEndpoints = endpointResults;
  }

  async analyzeDataStructureCompatibility() {
    console.log('\n🔧 PHASE 2: ANALYZING DATA STRUCTURE COMPATIBILITY');
    console.log('-'.repeat(60));
    
    // Test specific data structure issues identified in logs
    console.log('Testing Technical Analysis data structure...');
    
    try {
      const techAnalysis = await this.makeRequest('/api/technical-analysis/BTC%2FUSDT?timeframe=1d');
      
      const structureAnalysis = {
        hasTopLevelData: !!techAnalysis.data,
        hasIndicators: !!(techAnalysis.data && techAnalysis.data.indicators),
        indicatorsStructure: this.analyzeIndicatorsStructure(techAnalysis.data?.indicators),
        hasCurrentPrice: !!techAnalysis.currentPrice,
        hasConfidence: !!techAnalysis.confidence,
        hasPatterns: !!techAnalysis.patterns,
        patternAnalysisStructure: this.analyzePatternStructure(techAnalysis.patternAnalysis)
      };
      
      console.log('  Technical Analysis Structure:');
      console.log(`    ✅ Top Level Data: ${structureAnalysis.hasTopLevelData}`);
      console.log(`    ✅ Indicators Present: ${structureAnalysis.hasIndicators}`);
      console.log(`    ✅ Current Price: ${structureAnalysis.hasCurrentPrice}`);
      console.log(`    ✅ Confidence Score: ${structureAnalysis.hasConfidence}`);
      console.log(`    ✅ Patterns Array: ${structureAnalysis.hasPatterns}`);
      
      if (structureAnalysis.indicatorsStructure) {
        console.log(`    📊 Indicators Available: ${structureAnalysis.indicatorsStructure.available.join(', ')}`);
        console.log(`    ❌ Missing Indicators: ${structureAnalysis.indicatorsStructure.missing.join(', ')}`);
      }
      
      this.diagnosticResults.dataStructure = {
        technicalAnalysis: structureAnalysis,
        compatibility: this.calculateCompatibilityScore(structureAnalysis)
      };
      
    } catch (error) {
      console.log(`  ❌ Technical Analysis Structure Test Failed: ${error.message}`);
      this.diagnosticResults.dataStructure = {
        technicalAnalysis: { error: error.message },
        compatibility: 0
      };
    }
  }

  async testAutoCalculationSystem() {
    console.log('\n🤖 PHASE 3: TESTING AUTO-CALCULATION SYSTEM');
    console.log('-'.repeat(60));
    
    // Test if auto-calculation is running and producing signals
    console.log('Testing auto-calculation signal generation...');
    
    try {
      // Test multiple pairs to see if auto-calc is working
      const testPairs = ['BTC/USDT', 'XRP/USDT', 'ETH/USDT'];
      let calculationResults = {};
      
      for (const pair of testPairs) {
        const signals = await this.makeRequest(`/api/signals/${encodeURIComponent(pair)}`);
        
        calculationResults[pair] = {
          signalsGenerated: Array.isArray(signals) ? signals.length : 0,
          hasRecentSignals: this.hasRecentSignals(signals),
          signalQuality: this.analyzeSignalQuality(signals),
          timeframes: this.getTimeframesFromSignals(signals)
        };
        
        console.log(`  ${pair}:`);
        console.log(`    Signals Generated: ${calculationResults[pair].signalsGenerated}`);
        console.log(`    Recent Signals: ${calculationResults[pair].hasRecentSignals}`);
        console.log(`    Timeframes: ${calculationResults[pair].timeframes.join(', ')}`);
      }
      
      // Test calculation timing
      const startTime = Date.now();
      await this.makeRequest('/api/signals/BTC%2FUSDT');
      const responseTime = Date.now() - startTime;
      
      this.diagnosticResults.autoCalculation = {
        pairResults: calculationResults,
        responseTime,
        systemActive: Object.values(calculationResults).some(r => r.signalsGenerated > 0),
        overallHealth: this.calculateAutoCalcHealth(calculationResults)
      };
      
      console.log(`\n  📊 Auto-Calculation System:`);
      console.log(`     System Active: ${this.diagnosticResults.autoCalculation.systemActive}`);
      console.log(`     Response Time: ${responseTime}ms`);
      console.log(`     Overall Health: ${this.diagnosticResults.autoCalculation.overallHealth}%`);
      
    } catch (error) {
      console.log(`  ❌ Auto-Calculation Test Failed: ${error.message}`);
      this.diagnosticResults.autoCalculation = {
        error: error.message,
        systemActive: false,
        overallHealth: 0
      };
    }
  }

  async identifyUIComponentIssues() {
    console.log('\n🖥️ PHASE 4: IDENTIFYING UI COMPONENT ISSUES');
    console.log('-'.repeat(60));
    
    // Based on logs, identify specific component problems
    const componentIssues = {
      technicalAnalysisSummary: {
        issue: 'Data received but indicators showing as empty object {}',
        logEvidence: 'TechnicalAnalysisSummary DEBUG: indicators: Object, patterns: Array(0)',
        severity: 'HIGH',
        rootCause: 'Data structure parsing problem in component'
      },
      patternAnalysis: {
        issue: 'API returning 500 Internal Server Error',
        logEvidence: 'Failed to load resource: the server responded with a status of 500',
        severity: 'CRITICAL',
        rootCause: 'Backend pattern analysis endpoint crashing'
      },
      riskAssessmentDashboard: {
        issue: 'Component not displaying data correctly',
        logEvidence: 'Previous validation showed 33% data completeness',
        severity: 'MEDIUM',
        rootCause: 'Missing required fields in risk assessment data'
      },
      autoCalculationDisplay: {
        issue: 'Backend calculations running but UI not updating',
        logEvidence: 'Calculated 48 signals for 50 pairs but UI components not reflecting updates',
        severity: 'HIGH',
        rootCause: 'Component state not updating with new calculation data'
      }
    };
    
    console.log('  Component Issues Identified:');
    for (const [component, issue] of Object.entries(componentIssues)) {
      console.log(`    ${component}:`);
      console.log(`      Issue: ${issue.issue}`);
      console.log(`      Severity: ${issue.severity}`);
      console.log(`      Root Cause: ${issue.rootCause}`);
    }
    
    this.diagnosticResults.componentIssues = componentIssues;
  }

  analyzeIndicatorsStructure(indicators) {
    if (!indicators || typeof indicators !== 'object') {
      return { available: [], missing: ['All indicators missing'], error: 'Indicators object is null or invalid' };
    }
    
    const expectedIndicators = ['rsi', 'macd', 'bollingerBands', 'atr', 'stochastic'];
    const available = expectedIndicators.filter(ind => indicators[ind]);
    const missing = expectedIndicators.filter(ind => !indicators[ind]);
    
    return { available, missing, total: expectedIndicators.length };
  }

  analyzePatternStructure(patternAnalysis) {
    if (!patternAnalysis) return { hasData: false };
    
    return {
      hasData: true,
      hasSummary: !!patternAnalysis.summary,
      hasPatterns: Array.isArray(patternAnalysis.patterns),
      patternCount: Array.isArray(patternAnalysis.patterns) ? patternAnalysis.patterns.length : 0,
      summaryFields: patternAnalysis.summary ? Object.keys(patternAnalysis.summary) : []
    };
  }

  calculateCompatibilityScore(structure) {
    const checks = [
      structure.hasTopLevelData,
      structure.hasIndicators,
      structure.hasCurrentPrice,
      structure.hasConfidence,
      structure.hasPatterns
    ];
    
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  hasRecentSignals(signals) {
    if (!Array.isArray(signals) || signals.length === 0) return false;
    
    const latest = signals[0];
    if (!latest.timestamp) return false;
    
    const signalTime = new Date(latest.timestamp);
    const now = new Date();
    const diffMinutes = (now - signalTime) / (1000 * 60);
    
    return diffMinutes < 30; // Signal within last 30 minutes
  }

  analyzeSignalQuality(signals) {
    if (!Array.isArray(signals) || signals.length === 0) return 0;
    
    const requiredFields = ['entryPrice', 'stopLoss', 'takeProfit', 'confidence', 'direction'];
    let qualityScore = 0;
    
    for (const signal of signals) {
      const hasAllFields = requiredFields.every(field => field in signal);
      if (hasAllFields) qualityScore++;
    }
    
    return Math.round((qualityScore / signals.length) * 100);
  }

  getTimeframesFromSignals(signals) {
    if (!Array.isArray(signals)) return [];
    
    const timeframes = [...new Set(signals.map(s => s.timeframe).filter(Boolean))];
    return timeframes.sort((a, b) => {
      const order = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }

  calculateAutoCalcHealth(results) {
    const pairs = Object.values(results);
    if (pairs.length === 0) return 0;
    
    const activePairs = pairs.filter(p => p.signalsGenerated > 0).length;
    const recentPairs = pairs.filter(p => p.hasRecentSignals).length;
    const qualityScore = pairs.reduce((sum, p) => sum + p.signalQuality, 0) / pairs.length;
    
    return Math.round((activePairs / pairs.length * 40) + (recentPairs / pairs.length * 30) + (qualityScore * 0.3));
  }

  hasNestedField(obj, field) {
    if (!obj || typeof obj !== 'object') return false;
    
    if (field in obj) return true;
    if (obj.data && field in obj.data) return true;
    if (obj.indicators && field in obj.indicators) return true;
    if (obj.data && obj.data.indicators && field in obj.data.indicators) return true;
    
    return false;
  }

  getSampleData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sample = {};
    const keys = Object.keys(data).slice(0, 5); // First 5 keys only
    
    for (const key of keys) {
      if (typeof data[key] === 'object') {
        sample[key] = Array.isArray(data[key]) ? `Array(${data[key].length})` : 'Object';
      } else {
        sample[key] = data[key];
      }
    }
    
    return sample;
  }

  generateDiagnosticReport() {
    this.systemHealth = this.calculateOverallHealth();
    
    const report = {
      timestamp: new Date().toISOString(),
      systemHealth: this.systemHealth,
      diagnosticResults: this.diagnosticResults,
      priorityFixes: this.identifyPriorityFixes(),
      implementationPlan: this.generateImplementationPlan(),
      status: this.systemHealth >= 80 ? 'GOOD' : 
             this.systemHealth >= 60 ? 'ACCEPTABLE' : 'NEEDS_IMMEDIATE_ATTENTION'
    };
    
    // Save report
    const reportPath = `ui_component_diagnostic_report_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n🎯 UI COMPONENT DIAGNOSTIC REPORT');
    console.log('='.repeat(80));
    console.log(`System Health: ${this.systemHealth}%`);
    console.log(`Status: ${report.status}`);
    
    console.log('\n📊 Component Status:');
    if (this.diagnosticResults.apiEndpoints) {
      for (const [name, result] of Object.entries(this.diagnosticResults.apiEndpoints)) {
        console.log(`  ${name}: ${result.status} (${result.completeness || 0}% complete)`);
      }
    }
    
    console.log('\n🔧 Priority Fixes:');
    for (const fix of report.priorityFixes) {
      console.log(`  ${fix.priority}: ${fix.issue} - ${fix.action}`);
    }
    
    console.log(`\nReport saved to: ${reportPath}`);
    
    return report;
  }

  calculateOverallHealth() {
    let totalScore = 0;
    let weights = 0;
    
    // API Endpoints (40% weight)
    if (this.diagnosticResults.apiEndpoints) {
      const endpointScores = Object.values(this.diagnosticResults.apiEndpoints)
        .map(r => r.completeness || 0);
      const avgEndpointScore = endpointScores.length > 0 ? 
        endpointScores.reduce((a, b) => a + b, 0) / endpointScores.length : 0;
      totalScore += avgEndpointScore * 0.4;
      weights += 0.4;
    }
    
    // Data Structure (30% weight)
    if (this.diagnosticResults.dataStructure?.compatibility) {
      totalScore += this.diagnosticResults.dataStructure.compatibility * 0.3;
      weights += 0.3;
    }
    
    // Auto Calculation (30% weight)
    if (this.diagnosticResults.autoCalculation?.overallHealth) {
      totalScore += this.diagnosticResults.autoCalculation.overallHealth * 0.3;
      weights += 0.3;
    }
    
    return weights > 0 ? Math.round(totalScore / weights) : 0;
  }

  identifyPriorityFixes() {
    const fixes = [];
    
    // Check for critical API failures
    if (this.diagnosticResults.componentIssues?.patternAnalysis?.severity === 'CRITICAL') {
      fixes.push({
        priority: 'CRITICAL',
        issue: 'Pattern Analysis API 500 Error',
        action: 'Fix backend pattern analysis endpoint crash'
      });
    }
    
    // Check for data structure issues
    if (this.diagnosticResults.dataStructure?.compatibility < 80) {
      fixes.push({
        priority: 'HIGH',
        issue: 'Technical Analysis data structure processing',
        action: 'Fix component data binding and indicator structure parsing'
      });
    }
    
    // Check auto-calculation issues
    if (this.diagnosticResults.autoCalculation?.overallHealth < 70) {
      fixes.push({
        priority: 'HIGH',
        issue: 'Auto-calculation UI updates',
        action: 'Fix component state updates when new calculations complete'
      });
    }
    
    return fixes;
  }

  generateImplementationPlan() {
    return [
      '1. Fix Pattern Analysis API 500 error in backend',
      '2. Repair Technical Analysis Summary component data processing',
      '3. Fix Risk Assessment Dashboard data completeness',
      '4. Implement proper UI state updates for auto-calculation results',
      '5. Test all components with cross-pair switching',
      '6. Validate complete system integration'
    ];
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

// Execute diagnostic
async function main() {
  const diagnostic = new UIComponentDiagnostic();
  
  try {
    console.log('🚀 Starting UI Component Diagnostic...');
    const report = await diagnostic.runCompleteDiagnostic();
    
    console.log('\n✅ Diagnostic complete!');
    console.log(`System requires ${report.status === 'NEEDS_IMMEDIATE_ATTENTION' ? 'immediate attention' : 'targeted fixes'}.`);
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  }
}

main();