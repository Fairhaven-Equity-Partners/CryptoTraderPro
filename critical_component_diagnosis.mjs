/**
 * Critical Component Diagnosis - External Shell Testing
 * Comprehensive analysis of Critical Signal Analysis and Technical Analysis Summary display issues
 * 
 * Ground Rules Compliance:
 * 1. External shell testing for all validations
 * 2. NO synthetic data, only authentic market calculations
 * 3. Real-time validation of all implementations
 * 4. Zero tolerance for system crashes
 * 5. Market-driven signal generation only
 * 6. Complete data structure validation
 * 7. Systematic error identification and resolution
 * 8. Performance optimization requirements
 * 9. User experience excellence standards
 * 10. Production-ready implementations only
 * 11. Comprehensive testing before any changes
 */

class CriticalComponentDiagnosis {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.componentStatus = {};
    this.dataStructures = {};
  }

  async runComprehensiveDiagnosis() {
    console.log('🔍 CRITICAL COMPONENT DIAGNOSIS');
    console.log('===============================');
    console.log('Following 11 Ground Rules Protocol\n');
    
    await this.phase1_ComponentAPIValidation();
    await this.phase2_DataStructureAnalysis();
    await this.phase3_ComponentLogicValidation();
    await this.phase4_DisplayIssueIdentification();
    await this.generateDiagnosisReport();
  }

  async phase1_ComponentAPIValidation() {
    console.log('🔬 PHASE 1: COMPONENT API VALIDATION');
    console.log('====================================');
    
    // Test Critical Signal Analysis APIs
    console.log('Testing Critical Signal Analysis APIs...');
    
    // Test signals endpoint
    try {
      const signalsResponse = await fetch(`${this.baseUrl}/api/signals`);
      console.log(`  Signals endpoint: ${signalsResponse.status}`);
      
      if (signalsResponse.status === 200) {
        const signalsData = await signalsResponse.json();
        console.log(`  Signals data: ${Array.isArray(signalsData) ? signalsData.length : 'Not array'} items`);
        this.dataStructures.signals = signalsData;
        
        if (Array.isArray(signalsData) && signalsData.length > 0) {
          const sample = signalsData[0];
          console.log(`  Sample signal fields: ${Object.keys(sample).join(', ')}`);
          this.componentStatus.signalsAPI = 'VALID_DATA';
        } else {
          console.log(`  Signals data: Empty array`);
          this.componentStatus.signalsAPI = 'EMPTY_DATA';
        }
      } else {
        console.log(`  Signals API error: ${signalsResponse.status}`);
        this.componentStatus.signalsAPI = 'API_ERROR';
      }
    } catch (error) {
      console.log(`  Signals API error: ${error.message}`);
      this.componentStatus.signalsAPI = 'NETWORK_ERROR';
    }
    
    await this.sleep(200);
    
    // Test BTC specific signals
    try {
      const btcSignalsResponse = await fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`);
      console.log(`  BTC signals endpoint: ${btcSignalsResponse.status}`);
      
      if (btcSignalsResponse.status === 200) {
        const btcSignalsData = await btcSignalsResponse.json();
        console.log(`  BTC signals: ${Array.isArray(btcSignalsData) ? btcSignalsData.length : 'Not array'} items`);
        this.dataStructures.btcSignals = btcSignalsData;
        
        if (Array.isArray(btcSignalsData) && btcSignalsData.length > 0) {
          this.componentStatus.btcSignalsAPI = 'VALID_DATA';
        } else {
          this.componentStatus.btcSignalsAPI = 'EMPTY_DATA';
        }
      }
    } catch (error) {
      console.log(`  BTC signals error: ${error.message}`);
      this.componentStatus.btcSignalsAPI = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test confluence analysis
    try {
      const confluenceResponse = await fetch(`${this.baseUrl}/api/confluence-analysis/BTC/USDT`);
      console.log(`  Confluence endpoint: ${confluenceResponse.status}`);
      
      if (confluenceResponse.status === 200) {
        const confluenceData = await confluenceResponse.json();
        console.log(`  Confluence data structure: ${Object.keys(confluenceData).join(', ')}`);
        this.dataStructures.confluence = confluenceData;
        
        if (confluenceData.confluence !== undefined) {
          console.log(`  Confluence value: ${confluenceData.confluence}`);
          this.componentStatus.confluenceAPI = 'VALID_DATA';
        } else {
          console.log(`  Confluence field missing`);
          this.componentStatus.confluenceAPI = 'MISSING_FIELD';
        }
      }
    } catch (error) {
      console.log(`  Confluence error: ${error.message}`);
      this.componentStatus.confluenceAPI = 'ERROR';
    }
    
    console.log('\nTesting Technical Analysis APIs...');
    
    // Test technical analysis
    try {
      const techResponse = await fetch(`${this.baseUrl}/api/technical-analysis/BTC%2FUSDT`);
      console.log(`  Technical analysis endpoint: ${techResponse.status}`);
      
      if (techResponse.status === 200) {
        const techData = await techResponse.json();
        console.log(`  Technical data structure: ${Object.keys(techData).join(', ')}`);
        this.dataStructures.technical = techData;
        
        if (techData.indicators) {
          console.log(`  Indicators present: ${Object.keys(techData.indicators).join(', ')}`);
          this.componentStatus.technicalAPI = 'VALID_DATA';
        } else {
          console.log(`  Indicators missing`);
          this.componentStatus.technicalAPI = 'MISSING_INDICATORS';
        }
      }
    } catch (error) {
      console.log(`  Technical analysis error: ${error.message}`);
      this.componentStatus.technicalAPI = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test pattern analysis
    try {
      const patternResponse = await fetch(`${this.baseUrl}/api/pattern-analysis/BTC%2FUSDT`);
      console.log(`  Pattern analysis endpoint: ${patternResponse.status}`);
      
      if (patternResponse.status === 200) {
        const patternData = await patternResponse.json();
        console.log(`  Pattern data structure: ${Object.keys(patternData).join(', ')}`);
        this.dataStructures.patterns = patternData;
        
        if (patternData.patterns !== undefined) {
          console.log(`  Patterns field present`);
          this.componentStatus.patternsAPI = 'VALID_DATA';
        } else {
          console.log(`  Patterns field missing`);
          this.componentStatus.patternsAPI = 'MISSING_FIELD';
        }
      }
    } catch (error) {
      console.log(`  Pattern analysis error: ${error.message}`);
      this.componentStatus.patternsAPI = 'ERROR';
    }
    
    console.log('');
  }

  async phase2_DataStructureAnalysis() {
    console.log('📊 PHASE 2: DATA STRUCTURE ANALYSIS');
    console.log('===================================');
    
    // Analyze Critical Signal Analysis data requirements
    console.log('Analyzing Critical Signal Analysis data requirements...');
    
    if (this.dataStructures.signals) {
      const signals = this.dataStructures.signals;
      console.log(`  Signals array length: ${signals.length}`);
      
      if (signals.length > 0) {
        const signal = signals[0];
        const requiredFields = ['symbol', 'direction', 'confidence', 'timeframe'];
        const presentFields = requiredFields.filter(field => signal[field] !== undefined);
        const missingFields = requiredFields.filter(field => signal[field] === undefined);
        
        console.log(`  Required fields present: ${presentFields.join(', ')}`);
        if (missingFields.length > 0) {
          console.log(`  Missing fields: ${missingFields.join(', ')}`);
          this.issues.push({
            component: 'CriticalSignalAnalysis',
            type: 'MISSING_REQUIRED_FIELDS',
            fields: missingFields,
            severity: 'HIGH'
          });
        }
        
        // Check confidence value validity
        if (typeof signal.confidence === 'number') {
          console.log(`  Confidence value: ${signal.confidence}% (${typeof signal.confidence})`);
        } else {
          console.log(`  Confidence value invalid: ${signal.confidence} (${typeof signal.confidence})`);
          this.issues.push({
            component: 'CriticalSignalAnalysis',
            type: 'INVALID_CONFIDENCE_TYPE',
            value: signal.confidence,
            severity: 'HIGH'
          });
        }
      } else {
        console.log(`  No signals data to analyze`);
        this.issues.push({
          component: 'CriticalSignalAnalysis',
          type: 'NO_SIGNALS_DATA',
          severity: 'CRITICAL'
        });
      }
    }
    
    // Analyze confluence data
    if (this.dataStructures.confluence) {
      const confluence = this.dataStructures.confluence;
      console.log(`  Confluence structure: ${JSON.stringify(confluence, null, 2).slice(0, 200)}...`);
      
      if (confluence.confluence !== undefined) {
        console.log(`  Confluence value: ${confluence.confluence} (${typeof confluence.confluence})`);
      } else {
        console.log(`  Confluence field missing from response`);
        this.issues.push({
          component: 'CriticalSignalAnalysis',
          type: 'MISSING_CONFLUENCE_FIELD',
          severity: 'HIGH'
        });
      }
    }
    
    await this.sleep(300);
    
    // Analyze Technical Analysis data requirements
    console.log('\nAnalyzing Technical Analysis data requirements...');
    
    if (this.dataStructures.technical) {
      const technical = this.dataStructures.technical;
      console.log(`  Technical analysis structure keys: ${Object.keys(technical).join(', ')}`);
      
      if (technical.indicators) {
        const indicators = technical.indicators;
        console.log(`  Indicators available: ${Object.keys(indicators).join(', ')}`);
        
        // Check for expected indicators
        const expectedIndicators = ['rsi', 'macd', 'bollingerBands'];
        const presentIndicators = expectedIndicators.filter(ind => indicators[ind] !== undefined);
        const missingIndicators = expectedIndicators.filter(ind => indicators[ind] === undefined);
        
        console.log(`  Expected indicators present: ${presentIndicators.join(', ')}`);
        if (missingIndicators.length > 0) {
          console.log(`  Missing indicators: ${missingIndicators.join(', ')}`);
          this.issues.push({
            component: 'TechnicalAnalysisSummary',
            type: 'MISSING_INDICATORS',
            indicators: missingIndicators,
            severity: 'MEDIUM'
          });
        }
        
        // Check indicator value types
        Object.entries(indicators).forEach(([name, value]) => {
          if (typeof value === 'number' && !isNaN(value)) {
            console.log(`  ${name}: ${value.toFixed(4)} ✓`);
          } else {
            console.log(`  ${name}: ${value} (invalid) ❌`);
            this.issues.push({
              component: 'TechnicalAnalysisSummary',
              type: 'INVALID_INDICATOR_VALUE',
              indicator: name,
              value: value,
              severity: 'MEDIUM'
            });
          }
        });
      } else {
        console.log(`  No indicators object found`);
        this.issues.push({
          component: 'TechnicalAnalysisSummary',
          type: 'NO_INDICATORS_OBJECT',
          severity: 'CRITICAL'
        });
      }
    }
    
    // Analyze pattern data
    if (this.dataStructures.patterns) {
      const patterns = this.dataStructures.patterns;
      console.log(`  Pattern data keys: ${Object.keys(patterns).join(', ')}`);
      
      if (patterns.patterns !== undefined) {
        console.log(`  Patterns field type: ${typeof patterns.patterns}`);
        if (Array.isArray(patterns.patterns)) {
          console.log(`  Patterns array length: ${patterns.patterns.length}`);
        }
      } else {
        console.log(`  Patterns field missing`);
        this.issues.push({
          component: 'TechnicalAnalysisSummary',
          type: 'MISSING_PATTERNS_FIELD',
          severity: 'MEDIUM'
        });
      }
    }
    
    console.log('');
  }

  async phase3_ComponentLogicValidation() {
    console.log('🧮 PHASE 3: COMPONENT LOGIC VALIDATION');
    console.log('======================================');
    
    // Test Critical Signal Analysis logic
    console.log('Testing Critical Signal Analysis logic...');
    
    // Test confidence level calculation
    const testConfidenceValues = [0, 25, 50, 75, 100, undefined, null, 'invalid'];
    
    testConfidenceValues.forEach(confidence => {
      const result = this.getConfidenceLevel(confidence);
      console.log(`  Confidence ${confidence} → ${result.level} (${result.color})`);
    });
    
    // Test signal filtering logic
    if (this.dataStructures.signals && Array.isArray(this.dataStructures.signals)) {
      const highConfidenceSignals = this.dataStructures.signals.filter(signal => 
        signal && typeof signal.confidence === 'number' && signal.confidence >= 70
      );
      console.log(`  High confidence signals: ${highConfidenceSignals.length}/${this.dataStructures.signals.length}`);
    }
    
    await this.sleep(200);
    
    // Test Technical Analysis logic
    console.log('\nTesting Technical Analysis logic...');
    
    // Test indicator formatting
    if (this.dataStructures.technical && this.dataStructures.technical.indicators) {
      const indicators = this.dataStructures.technical.indicators;
      
      Object.entries(indicators).forEach(([name, value]) => {
        const formatted = this.formatIndicatorValue(name, value);
        console.log(`  ${name}: ${value} → ${formatted}`);
      });
    }
    
    // Test pattern processing
    if (this.dataStructures.patterns && this.dataStructures.patterns.patterns) {
      const patterns = this.dataStructures.patterns.patterns;
      console.log(`  Pattern processing test: ${Array.isArray(patterns) ? 'Array' : typeof patterns}`);
      
      if (Array.isArray(patterns)) {
        patterns.forEach((pattern, index) => {
          console.log(`  Pattern ${index}: ${typeof pattern === 'object' ? Object.keys(pattern).join(', ') : pattern}`);
        });
      }
    }
    
    console.log('');
  }

  async phase4_DisplayIssueIdentification() {
    console.log('🖥️ PHASE 4: DISPLAY ISSUE IDENTIFICATION');
    console.log('========================================');
    
    // Identify potential display issues
    console.log('Identifying potential display issues...');
    
    // Check for empty data that could cause blank displays
    const emptyDataChecks = [
      { name: 'Signals', data: this.dataStructures.signals, expected: 'array with items' },
      { name: 'Confluence', data: this.dataStructures.confluence?.confluence, expected: 'number' },
      { name: 'Technical Indicators', data: this.dataStructures.technical?.indicators, expected: 'object with properties' },
      { name: 'Patterns', data: this.dataStructures.patterns?.patterns, expected: 'array or object' }
    ];
    
    emptyDataChecks.forEach(check => {
      const { name, data, expected } = check;
      
      if (data === undefined || data === null) {
        console.log(`  ${name}: Missing (${expected} expected)`);
        this.issues.push({
          component: name.includes('Signal') ? 'CriticalSignalAnalysis' : 'TechnicalAnalysisSummary',
          type: 'MISSING_DISPLAY_DATA',
          field: name,
          severity: 'HIGH'
        });
      } else if (Array.isArray(data) && data.length === 0) {
        console.log(`  ${name}: Empty array (${expected} expected)`);
        this.issues.push({
          component: name.includes('Signal') ? 'CriticalSignalAnalysis' : 'TechnicalAnalysisSummary',
          type: 'EMPTY_DISPLAY_DATA',
          field: name,
          severity: 'MEDIUM'
        });
      } else if (typeof data === 'object' && Object.keys(data).length === 0) {
        console.log(`  ${name}: Empty object (${expected} expected)`);
        this.issues.push({
          component: name.includes('Signal') ? 'CriticalSignalAnalysis' : 'TechnicalAnalysisSummary',
          type: 'EMPTY_DISPLAY_DATA',
          field: name,
          severity: 'MEDIUM'
        });
      } else {
        console.log(`  ${name}: Data present ✓`);
      }
    });
    
    // Check for data type mismatches that could cause rendering errors
    const typeChecks = [
      { field: 'confidence', value: this.dataStructures.signals?.[0]?.confidence, expectedType: 'number' },
      { field: 'confluence', value: this.dataStructures.confluence?.confluence, expectedType: 'number' },
      { field: 'rsi', value: this.dataStructures.technical?.indicators?.rsi, expectedType: 'number' }
    ];
    
    typeChecks.forEach(check => {
      const { field, value, expectedType } = check;
      const actualType = typeof value;
      
      if (actualType !== expectedType && value !== undefined) {
        console.log(`  ${field}: Type mismatch - expected ${expectedType}, got ${actualType} (${value})`);
        this.issues.push({
          type: 'TYPE_MISMATCH',
          field: field,
          expected: expectedType,
          actual: actualType,
          value: value,
          severity: 'HIGH'
        });
      }
    });
    
    console.log('');
  }

  getConfidenceLevel(confidence) {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
      return { level: 'Unknown', color: 'text-gray-500' };
    }
    
    if (confidence >= 80) return { level: 'Very High', color: 'text-green-600' };
    if (confidence >= 60) return { level: 'High', color: 'text-green-500' };
    if (confidence >= 40) return { level: 'Medium', color: 'text-yellow-600' };
    if (confidence >= 20) return { level: 'Low', color: 'text-orange-600' };
    return { level: 'Very Low', color: 'text-red-600' };
  }

  formatIndicatorValue(name, value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A';
    }
    
    switch (name.toLowerCase()) {
      case 'rsi':
        return `${value.toFixed(1)}`;
      case 'macd':
        return `${value.toFixed(4)}`;
      case 'bollingerbands':
        return `$${value.toFixed(2)}`;
      default:
        return `${value.toFixed(2)}`;
    }
  }

  async generateDiagnosisReport() {
    console.log('📋 CRITICAL COMPONENT DIAGNOSIS REPORT');
    console.log('======================================');
    
    const totalComponents = 2; // CriticalSignalAnalysis, TechnicalAnalysisSummary
    const operationalComponents = [
      this.componentStatus.signalsAPI,
      this.componentStatus.technicalAPI
    ].filter(status => status === 'VALID_DATA').length;
    
    const healthScore = (operationalComponents / totalComponents) * 100;
    
    console.log(`\n🎯 COMPONENT HEALTH SCORE: ${healthScore.toFixed(1)}%`);
    console.log(`Operational Components: ${operationalComponents}/${totalComponents}`);
    
    // API Status Summary
    console.log('\n🔗 API STATUS SUMMARY:');
    Object.entries(this.componentStatus).forEach(([api, status]) => {
      const icon = status === 'VALID_DATA' ? '✅' : 
                  status === 'EMPTY_DATA' ? '⚠️' : '❌';
      console.log(`${icon} ${api}: ${status}`);
    });
    
    // Critical Issues
    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = this.issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = this.issues.filter(i => i.severity === 'MEDIUM');
    
    console.log(`\n🚨 ISSUE BREAKDOWN:`);
    console.log(`Critical: ${criticalIssues.length}`);
    console.log(`High: ${highIssues.length}`);
    console.log(`Medium: ${mediumIssues.length}`);
    
    if (criticalIssues.length > 0) {
      console.log('\n🔥 CRITICAL ISSUES:');
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.component}: ${issue.type}`);
        if (issue.fields) console.log(`   Missing: ${issue.fields.join(', ')}`);
      });
    }
    
    if (highIssues.length > 0) {
      console.log('\n⚠️ HIGH PRIORITY ISSUES:');
      highIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.component || 'General'}: ${issue.type}`);
        if (issue.field) console.log(`   Field: ${issue.field}`);
        if (issue.value !== undefined) console.log(`   Value: ${issue.value}`);
      });
    }
    
    // Root Cause Analysis
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    
    if (this.issues.some(i => i.type === 'NO_SIGNALS_DATA')) {
      console.log('1. Critical Signal Analysis: No signal data available');
      console.log('   → Backend signal generation may not be working');
      console.log('   → /api/signals endpoint returning empty array');
    }
    
    if (this.issues.some(i => i.type === 'NO_INDICATORS_OBJECT')) {
      console.log('2. Technical Analysis: No indicators object');
      console.log('   → Backend technical analysis calculation failing');
      console.log('   → /api/technical-analysis endpoint missing indicators');
    }
    
    if (this.issues.some(i => i.type === 'TYPE_MISMATCH')) {
      console.log('3. Data Type Issues: Frontend expecting different data types');
      console.log('   → Backend API response format mismatch with frontend');
      console.log('   → Component type checking needs enhancement');
    }
    
    // Recommended Fixes
    console.log('\n🔧 RECOMMENDED FIXES:');
    
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      console.log('1. Backend Data Generation:');
      console.log('   - Verify automated signal calculator is generating signals');
      console.log('   - Check technical analysis calculations are working');
      console.log('   - Ensure API endpoints return expected data structures');
      
      console.log('2. Frontend Error Handling:');
      console.log('   - Add null/undefined checks for all data fields');
      console.log('   - Implement loading states for empty data');
      console.log('   - Add fallback displays for missing data');
      
      console.log('3. Data Structure Validation:');
      console.log('   - Add runtime type checking in components');
      console.log('   - Implement data validation before rendering');
      console.log('   - Add console logging for debugging data issues');
    }
    
    console.log('\n✅ DIAGNOSIS COMPLETE - READY FOR SYSTEMATIC FIXES');
    console.log('Following 11 Ground Rules Protocol Implementation Required');
    
    return {
      healthScore,
      issues: this.issues,
      componentStatus: this.componentStatus,
      dataStructures: this.dataStructures,
      needsImmediateAttention: criticalIssues.length > 0 || healthScore < 50
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const diagnosis = new CriticalComponentDiagnosis();
  const results = await diagnosis.runComprehensiveDiagnosis();
  return results;
}

main().catch(console.error);