/**
 * Component Display Validation - External Shell Testing
 * Final validation of Critical Signal Analysis and Technical Analysis Summary fixes
 */

class ComponentDisplayValidation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {};
  }

  async runFinalValidation() {
    console.log('🔍 COMPONENT DISPLAY VALIDATION');
    console.log('===============================');
    
    await this.validateCriticalSignalAnalysis();
    await this.validateTechnicalAnalysisSummary();
    await this.generateValidationReport();
  }

  async validateCriticalSignalAnalysis() {
    console.log('🎯 CRITICAL SIGNAL ANALYSIS VALIDATION');
    console.log('======================================');
    
    // Test signals availability
    try {
      const signalsResponse = await fetch(`${this.baseUrl}/api/signals`);
      const signalsData = await signalsResponse.json();
      
      console.log(`Signals endpoint: ${signalsResponse.status}`);
      console.log(`Signals data: ${Array.isArray(signalsData) ? signalsData.length : 'Not array'} items`);
      
      if (Array.isArray(signalsData) && signalsData.length > 0) {
        this.results.signalsData = 'AVAILABLE';
      } else {
        this.results.signalsData = 'EMPTY';
      }
    } catch (error) {
      this.results.signalsData = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test BTC specific signals
    try {
      const btcSignalsResponse = await fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`);
      const btcSignalsData = await btcSignalsResponse.json();
      
      console.log(`BTC signals: ${Array.isArray(btcSignalsData) ? btcSignalsData.length : 'Not array'} items`);
      
      if (Array.isArray(btcSignalsData) && btcSignalsData.length > 0) {
        const sample = btcSignalsData[0];
        console.log(`Sample signal: ${sample.direction} ${sample.confidence}%`);
        this.results.btcSignals = 'VALID';
      } else {
        this.results.btcSignals = 'EMPTY';
      }
    } catch (error) {
      this.results.btcSignals = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test confluence data with new field
    try {
      const confluenceResponse = await fetch(`${this.baseUrl}/api/confluence-analysis/BTC/USDT`);
      const confluenceData = await confluenceResponse.json();
      
      console.log(`Confluence endpoint: ${confluenceResponse.status}`);
      
      if (confluenceData.confluence !== undefined) {
        console.log(`Confluence field: ${confluenceData.confluence} ✓`);
        this.results.confluenceField = 'PRESENT';
      } else if (confluenceData.confluenceAnalysis?.confluenceStrength !== undefined) {
        console.log(`Confluence strength: ${confluenceData.confluenceAnalysis.confluenceStrength} ✓`);
        this.results.confluenceField = 'FALLBACK';
      } else {
        console.log(`Confluence field: Missing ❌`);
        this.results.confluenceField = 'MISSING';
      }
    } catch (error) {
      this.results.confluenceField = 'ERROR';
    }
    
    console.log('');
  }

  async validateTechnicalAnalysisSummary() {
    console.log('📊 TECHNICAL ANALYSIS SUMMARY VALIDATION');
    console.log('========================================');
    
    // Test technical analysis data
    try {
      const techResponse = await fetch(`${this.baseUrl}/api/technical-analysis/BTC%2FUSDT`);
      const techData = await techResponse.json();
      
      console.log(`Technical analysis: ${techResponse.status}`);
      
      if (techData.indicators) {
        const indicators = techData.indicators;
        console.log(`Indicators available: ${Object.keys(indicators).join(', ')}`);
        
        const hasRSI = typeof indicators.rsi === 'number';
        const hasMACD = typeof indicators.macd === 'number';
        const hasBollinger = typeof indicators.bollingerBands === 'number';
        
        console.log(`RSI: ${hasRSI ? indicators.rsi.toFixed(2) : 'Missing'}`);
        console.log(`MACD: ${hasMACD ? indicators.macd.toFixed(4) : 'Missing'}`);
        console.log(`Bollinger: ${hasBollinger ? indicators.bollingerBands.toFixed(2) : 'Missing'}`);
        
        if (hasRSI && hasMACD) {
          this.results.technicalIndicators = 'COMPLETE';
        } else {
          this.results.technicalIndicators = 'PARTIAL';
        }
      } else {
        console.log(`No indicators object found`);
        this.results.technicalIndicators = 'MISSING';
      }
    } catch (error) {
      this.results.technicalIndicators = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test pattern analysis data
    try {
      const patternResponse = await fetch(`${this.baseUrl}/api/pattern-analysis/BTC%2FUSDT`);
      const patternData = await patternResponse.json();
      
      console.log(`Pattern analysis: ${patternResponse.status}`);
      
      if (patternData.patternAnalysis) {
        const analysis = patternData.patternAnalysis;
        console.log(`Pattern analysis structure: ${Object.keys(analysis).join(', ')}`);
        
        if (analysis.patterns || analysis.summary) {
          this.results.patternData = 'AVAILABLE';
        } else {
          this.results.patternData = 'INCOMPLETE';
        }
      } else {
        console.log(`No pattern analysis found`);
        this.results.patternData = 'MISSING';
      }
    } catch (error) {
      this.results.patternData = 'ERROR';
    }
    
    console.log('');
  }

  async generateValidationReport() {
    console.log('📋 COMPONENT DISPLAY VALIDATION REPORT');
    console.log('======================================');
    
    const totalChecks = Object.keys(this.results).length;
    const passedChecks = Object.values(this.results).filter(r => 
      r === 'AVAILABLE' || r === 'VALID' || r === 'PRESENT' || r === 'COMPLETE'
    ).length;
    
    const healthScore = (passedChecks / totalChecks) * 100;
    
    console.log(`\n🎯 COMPONENT HEALTH SCORE: ${healthScore.toFixed(1)}%`);
    console.log(`Passed Checks: ${passedChecks}/${totalChecks}`);
    
    console.log('\n📊 DETAILED RESULTS:');
    Object.entries(this.results).forEach(([component, status]) => {
      const icon = this.getStatusIcon(status);
      console.log(`${icon} ${component}: ${status}`);
    });
    
    console.log('\n🚀 COMPONENT STATUS SUMMARY:');
    
    // Critical Signal Analysis Status
    const criticalSignalWorking = [
      this.results.btcSignals,
      this.results.confluenceField
    ].every(status => ['VALID', 'PRESENT', 'FALLBACK'].includes(status));
    
    console.log(`Critical Signal Analysis: ${criticalSignalWorking ? '✅ OPERATIONAL' : '❌ NEEDS ATTENTION'}`);
    
    // Technical Analysis Status  
    const technicalWorking = [
      this.results.technicalIndicators,
      this.results.patternData
    ].every(status => ['COMPLETE', 'AVAILABLE', 'PARTIAL'].includes(status));
    
    console.log(`Technical Analysis Summary: ${technicalWorking ? '✅ OPERATIONAL' : '❌ NEEDS ATTENTION'}`);
    
    if (healthScore >= 80) {
      console.log('\n✅ COMPONENT DISPLAY FIXES SUCCESSFUL');
      console.log('Both components should now display correctly in the UI');
    } else if (healthScore >= 60) {
      console.log('\n⚠️ PARTIAL SUCCESS');
      console.log('Some components working, others need additional fixes');
    } else {
      console.log('\n❌ ADDITIONAL FIXES REQUIRED');
      console.log('Critical issues still preventing proper display');
    }
    
    return {
      healthScore,
      passedChecks,
      totalChecks,
      results: this.results,
      isOperational: healthScore >= 80
    };
  }

  getStatusIcon(status) {
    switch (status) {
      case 'AVAILABLE':
      case 'VALID': 
      case 'PRESENT':
      case 'COMPLETE': return '✅';
      case 'PARTIAL':
      case 'FALLBACK':
      case 'INCOMPLETE': return '⚠️';
      case 'EMPTY':
      case 'MISSING': return '❌';
      case 'ERROR': return '❌';
      default: return '❓';
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const validator = new ComponentDisplayValidation();
  const results = await validator.runFinalValidation();
  return results;
}

main().catch(console.error);