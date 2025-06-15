/**
 * Critical Component Diagnosis - External Shell Testing
 * Diagnoses Technical Analysis Summary not running and duplicate timeframe issues
 */

class CriticalComponentDiagnosis {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {};
  }

  async runCompleteDiagnosis() {
    console.log('🔧 CRITICAL COMPONENT DIAGNOSIS');
    console.log('===============================');
    
    await this.diagnoseTechnicalAnalysisSummary();
    await this.diagnoseCriticalSignalAnalysisTimeframes();
    await this.testAPIEndpoints();
    await this.generateDiagnosisReport();
  }

  async diagnoseTechnicalAnalysisSummary() {
    console.log('📊 TECHNICAL ANALYSIS SUMMARY DIAGNOSIS');
    console.log('=======================================');
    
    // Test technical indicators endpoint
    try {
      const techResponse = await fetch(`${this.baseUrl}/api/technical-analysis/BTC%2FUSDT`);
      const techData = await techResponse.json();
      
      console.log(`Technical endpoint status: ${techResponse.status}`);
      console.log(`Response structure:`, Object.keys(techData));
      
      if (techData.success && techData.indicators) {
        console.log(`✅ Indicators available:`, Object.keys(techData.indicators));
        
        // Check specific indicators
        const indicators = techData.indicators;
        console.log(`RSI: ${typeof indicators.rsi} = ${indicators.rsi}`);
        console.log(`MACD: ${typeof indicators.macd} = ${indicators.macd}`);
        console.log(`Bollinger: ${typeof indicators.bollingerBands} = ${indicators.bollingerBands}`);
        
        this.results.technicalIndicators = 'AVAILABLE';
      } else {
        console.log(`❌ No indicators in response`);
        this.results.technicalIndicators = 'MISSING';
      }
    } catch (error) {
      console.log(`❌ Technical analysis error: ${error.message}`);
      this.results.technicalIndicators = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test pattern analysis endpoint
    try {
      const patternResponse = await fetch(`${this.baseUrl}/api/pattern-analysis/BTC%2FUSDT`);
      const patternData = await patternResponse.json();
      
      console.log(`Pattern endpoint status: ${patternResponse.status}`);
      console.log(`Pattern response structure:`, Object.keys(patternData));
      
      if (patternData.success) {
        console.log(`✅ Pattern analysis available`);
        
        // Check for patterns array
        if (patternData.patternAnalysis) {
          const analysis = patternData.patternAnalysis;
          console.log(`Pattern analysis keys:`, Object.keys(analysis));
          
          if (analysis.patterns) {
            console.log(`Patterns found: ${Array.isArray(analysis.patterns) ? analysis.patterns.length : 'Not array'}`);
          }
          
          if (analysis.summary) {
            console.log(`Summary available:`, Object.keys(analysis.summary));
          }
        }
        
        this.results.patternAnalysis = 'AVAILABLE';
      } else {
        console.log(`❌ Pattern analysis failed`);
        this.results.patternAnalysis = 'FAILED';
      }
    } catch (error) {
      console.log(`❌ Pattern analysis error: ${error.message}`);
      this.results.patternAnalysis = 'ERROR';
    }
    
    console.log('');
  }

  async diagnoseCriticalSignalAnalysisTimeframes() {
    console.log('🎯 CRITICAL SIGNAL ANALYSIS TIMEFRAMES');
    console.log('======================================');
    
    // Test signals endpoint for timeframe diversity
    try {
      const signalsResponse = await fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`);
      const signalsData = await signalsResponse.json();
      
      console.log(`Signals status: ${signalsResponse.status}`);
      console.log(`Total signals: ${Array.isArray(signalsData) ? signalsData.length : 'Not array'}`);
      
      if (Array.isArray(signalsData) && signalsData.length > 0) {
        // Analyze timeframes
        const timeframes = signalsData.map(signal => signal.timeframe);
        const uniqueTimeframes = [...new Set(timeframes)];
        const timeframeCounts = {};
        
        timeframes.forEach(tf => {
          timeframeCounts[tf] = (timeframeCounts[tf] || 0) + 1;
        });
        
        console.log(`Unique timeframes: ${uniqueTimeframes.join(', ')}`);
        console.log(`Timeframe distribution:`, timeframeCounts);
        
        // Check for high confidence signals
        const highConfidenceSignals = signalsData.filter(s => s.confidence >= 70);
        console.log(`High confidence (≥70%): ${highConfidenceSignals.length} signals`);
        
        if (highConfidenceSignals.length > 0) {
          console.log(`Sample high confidence signals:`);
          highConfidenceSignals.slice(0, 3).forEach(signal => {
            console.log(`  ${signal.timeframe}: ${signal.direction} ${signal.confidence}%`);
          });
        }
        
        // Diagnosis
        if (uniqueTimeframes.length === 1) {
          this.results.timeframeDiversity = 'DUPLICATE_ISSUE';
          console.log(`⚠️ ISSUE FOUND: All signals using same timeframe (${uniqueTimeframes[0]})`);
        } else if (uniqueTimeframes.length < 3) {
          this.results.timeframeDiversity = 'LIMITED';
          console.log(`⚠️ Limited timeframe diversity`);
        } else {
          this.results.timeframeDiversity = 'GOOD';
          console.log(`✅ Good timeframe diversity`);
        }
        
      } else {
        console.log(`❌ No signals data available`);
        this.results.timeframeDiversity = 'NO_DATA';
      }
    } catch (error) {
      console.log(`❌ Signals analysis error: ${error.message}`);
      this.results.timeframeDiversity = 'ERROR';
    }
    
    console.log('');
  }

  async testAPIEndpoints() {
    console.log('🔗 API ENDPOINTS HEALTH CHECK');
    console.log('=============================');
    
    const endpoints = [
      '/api/signals',
      '/api/signals/BTC%2FUSDT', 
      '/api/technical-analysis/BTC%2FUSDT',
      '/api/pattern-analysis/BTC%2FUSDT',
      '/api/confluence-analysis/BTC%2FUSDT'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const data = await response.json();
        
        console.log(`${endpoint}: ${response.status} ${response.status === 200 ? '✅' : '❌'}`);
        
        if (response.status !== 200) {
          console.log(`  Error: ${data.error || 'Unknown error'}`);
        } else if (Array.isArray(data)) {
          console.log(`  Array with ${data.length} items`);
        } else if (data.success !== undefined) {
          console.log(`  Success: ${data.success}`);
        }
        
        await this.sleep(100);
      } catch (error) {
        console.log(`${endpoint}: ERROR ❌`);
        console.log(`  ${error.message}`);
      }
    }
    
    console.log('');
  }

  async generateDiagnosisReport() {
    console.log('📋 DIAGNOSIS REPORT');
    console.log('==================');
    
    console.log('🔍 IDENTIFIED ISSUES:');
    
    // Technical Analysis Summary Issues
    if (this.results.technicalIndicators === 'MISSING' || this.results.patternAnalysis === 'FAILED') {
      console.log('❌ TECHNICAL ANALYSIS SUMMARY NOT DISPLAYING:');
      console.log('   - Component likely not receiving proper data structure');
      console.log('   - API endpoints may be returning nested data incorrectly');
      console.log('   - Frontend parsing may not handle all response variations');
    } else if (this.results.technicalIndicators === 'AVAILABLE' && this.results.patternAnalysis === 'AVAILABLE') {
      console.log('✅ Technical Analysis data available - issue may be in frontend rendering');
    }
    
    // Critical Signal Analysis Timeframe Issues  
    if (this.results.timeframeDiversity === 'DUPLICATE_ISSUE') {
      console.log('❌ CRITICAL SIGNAL ANALYSIS TIMEFRAME DUPLICATION:');
      console.log('   - All signals showing same timeframe');
      console.log('   - Backend may not be generating diverse timeframe signals');
      console.log('   - Signal generation logic may be defaulting to single timeframe');
    } else if (this.results.timeframeDiversity === 'LIMITED') {
      console.log('⚠️ Limited timeframe diversity in signals');
    }
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    
    // Technical Analysis fixes
    if (this.results.technicalIndicators !== 'AVAILABLE' || this.results.patternAnalysis !== 'AVAILABLE') {
      console.log('1. Technical Analysis Summary:');
      console.log('   - Check component data parsing logic');
      console.log('   - Verify API response structure handling');
      console.log('   - Add more robust error handling and fallbacks');
    }
    
    // Timeframe diversity fixes
    if (this.results.timeframeDiversity === 'DUPLICATE_ISSUE') {
      console.log('2. Critical Signal Analysis Timeframes:');
      console.log('   - Review signal generation to ensure multiple timeframes');
      console.log('   - Check if filtering is removing timeframe diversity');
      console.log('   - Verify high confidence filter not limiting to single timeframe');
    }
    
    return this.results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const diagnosis = new CriticalComponentDiagnosis();
  const results = await diagnosis.runCompleteDiagnosis();
  return results;
}

main().catch(console.error);