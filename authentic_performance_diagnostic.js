/**
 * Authentic Performance Data Diagnostic - External Shell Analysis
 * Investigates static data issues and technical analysis problems
 */

class AuthenticPerformanceDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      performanceMetrics: {},
      technicalAnalysis: {},
      dataAuthenticity: {},
      staticDataSources: [],
      recommendations: []
    };
  }

  async runCompleteDiagnostic() {
    console.log('🔍 AUTHENTIC PERFORMANCE DATA DIAGNOSTIC');
    console.log('========================================');
    
    try {
      // Test performance metrics authenticity
      await this.analyzePerformanceMetricsAuthenticity();
      
      // Test technical analysis issues
      await this.analyzeTechnicalAnalysisProblems();
      
      // Check for static/fallback data sources
      await this.identifyStaticDataSources();
      
      // Generate solutions
      await this.generateAuthenticDataSolutions();
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error.message);
    }
  }

  async analyzePerformanceMetricsAuthenticity() {
    console.log('\n📊 ANALYZING PERFORMANCE METRICS AUTHENTICITY...');
    
    try {
      // Make multiple requests to check for variation
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(fetch(`${this.baseUrl}/api/performance-metrics?_cache=${Date.now()}`));
        await this.sleep(500); // 500ms between requests
      }
      
      const responses = await Promise.all(requests);
      const dataSnapshots = [];
      
      for (const response of responses) {
        const data = await response.json();
        dataSnapshots.push(data);
      }
      
      // Analyze for variations
      console.log('  📈 Performance Metrics Variation Analysis:');
      
      if (dataSnapshots.length > 0 && dataSnapshots[0].indicators) {
        const firstSnapshot = dataSnapshots[0].indicators;
        let hasVariation = false;
        
        dataSnapshots[0].indicators.forEach((indicator, index) => {
          const values = dataSnapshots.map(snapshot => 
            snapshot.indicators[index]?.value || 'N/A'
          );
          
          const uniqueValues = [...new Set(values)];
          const isStatic = uniqueValues.length === 1;
          
          console.log(`    - ${indicator.indicator}: ${isStatic ? '❌ STATIC' : '✅ DYNAMIC'}`);
          console.log(`      Values: [${values.slice(0, 3).join(', ')}...]`);
          
          if (!isStatic) hasVariation = true;
          
          this.results.performanceMetrics[indicator.indicator] = {
            isStatic,
            values: uniqueValues,
            sampleValues: values
          };
        });
        
        console.log(`\n  📊 Overall Assessment: ${hasVariation ? '✅ HAS VARIATION' : '❌ ALL STATIC DATA'}`);
        this.results.performanceMetrics.overallAuthentic = hasVariation;
        
      } else {
        console.log('  ❌ No performance indicators found');
        this.results.performanceMetrics.error = 'No indicators returned';
      }
      
    } catch (error) {
      console.log(`  ❌ Performance metrics test failed: ${error.message}`);
      this.results.performanceMetrics.error = error.message;
    }
  }

  async analyzeTechnicalAnalysisProblems() {
    console.log('\n🔧 ANALYZING TECHNICAL ANALYSIS ISSUES...');
    
    try {
      // Test technical analysis for different symbols and timeframes
      const testCases = [
        { symbol: 'BTC/USDT', timeframe: '1h' },
        { symbol: 'BTC/USDT', timeframe: '4h' },
        { symbol: 'BTC/USDT', timeframe: '1d' },
        { symbol: 'ETH/USDT', timeframe: '1h' }
      ];
      
      for (const testCase of testCases) {
        console.log(`  🧪 Testing ${testCase.symbol} (${testCase.timeframe})...`);
        
        const response = await fetch(
          `${this.baseUrl}/api/technical-analysis/${encodeURIComponent(testCase.symbol)}?timeframe=${testCase.timeframe}`
        );
        
        const data = await response.json();
        
        console.log(`    Status: ${response.status}`);
        console.log(`    Success: ${data.success || false}`);
        
        if (data.success) {
          console.log(`    ✅ Technical data available`);
          console.log(`    Indicators: RSI=${data.indicators?.rsi}, MACD=${data.indicators?.macd}`);
        } else {
          console.log(`    ❌ ${data.status || data.error || 'No technical data'}`);
          console.log(`    Reason: ${data.reason || 'Unknown'}`);
        }
        
        this.results.technicalAnalysis[`${testCase.symbol}_${testCase.timeframe}`] = {
          success: data.success,
          status: data.status,
          hasIndicators: !!data.indicators,
          error: data.error || data.reason
        };
        
        await this.sleep(200);
      }
      
    } catch (error) {
      console.log(`  ❌ Technical analysis test failed: ${error.message}`);
      this.results.technicalAnalysis.error = error.message;
    }
  }

  async identifyStaticDataSources() {
    console.log('\n🔍 IDENTIFYING STATIC DATA SOURCES...');
    
    try {
      // Check various endpoints for static data patterns
      const endpoints = [
        '/api/performance-metrics',
        '/api/crypto/BTC/USDT',
        '/api/system-status'
      ];
      
      for (const endpoint of endpoints) {
        console.log(`  📡 Checking ${endpoint}...`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const data = await response.json();
        
        // Look for suspicious static patterns
        const staticPatterns = this.detectStaticPatterns(data, endpoint);
        
        if (staticPatterns.length > 0) {
          console.log(`    ⚠️  Potential static data detected:`);
          staticPatterns.forEach(pattern => {
            console.log(`      - ${pattern}`);
          });
          this.results.staticDataSources.push({
            endpoint,
            patterns: staticPatterns
          });
        } else {
          console.log(`    ✅ No obvious static patterns`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Static data analysis failed: ${error.message}`);
    }
  }

  detectStaticPatterns(data, endpoint) {
    const patterns = [];
    
    // Look for round numbers (often indicates fallback data)
    const checkForRoundNumbers = (obj, path = '') => {
      if (typeof obj === 'number') {
        if (obj % 1 === 0 && obj >= 10) { // Round numbers >= 10
          patterns.push(`Round number at ${path}: ${obj}`);
        }
      } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          checkForRoundNumbers(obj[key], path ? `${path}.${key}` : key);
        });
      }
    };
    
    // Look for repeated values
    const checkForRepeatedValues = (obj, path = '') => {
      if (typeof obj === 'object' && obj !== null && Array.isArray(obj)) {
        const values = obj.filter(item => typeof item === 'number');
        const uniqueValues = [...new Set(values)];
        if (values.length > 2 && uniqueValues.length === 1) {
          patterns.push(`All array values identical at ${path}: ${uniqueValues[0]}`);
        }
      }
    };
    
    // Look for placeholder text
    const checkForPlaceholders = (obj, path = '') => {
      if (typeof obj === 'string') {
        const placeholderIndicators = ['fallback', 'default', 'placeholder', 'N/A', '--'];
        placeholderIndicators.forEach(indicator => {
          if (obj.toLowerCase().includes(indicator.toLowerCase())) {
            patterns.push(`Placeholder text at ${path}: "${obj}"`);
          }
        });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          checkForPlaceholders(obj[key], path ? `${path}.${key}` : key);
        });
      }
    };
    
    checkForRoundNumbers(data);
    checkForRepeatedValues(data);
    checkForPlaceholders(data);
    
    return patterns;
  }

  async generateAuthenticDataSolutions() {
    console.log('\n💡 GENERATING AUTHENTIC DATA SOLUTIONS...');
    
    // Analyze results and generate recommendations
    if (!this.results.performanceMetrics.overallAuthentic) {
      this.results.recommendations.push({
        issue: 'Static Performance Metrics',
        priority: 'HIGH',
        solution: 'Replace static feedback calculations with real-time market data aggregation'
      });
    }
    
    const technicalFailures = Object.values(this.results.technicalAnalysis)
      .filter(result => !result.success).length;
    
    if (technicalFailures > 0) {
      this.results.recommendations.push({
        issue: 'Technical Analysis Failures',
        priority: 'HIGH',
        solution: 'Implement proper OHLC data collection and technical indicator calculations'
      });
    }
    
    if (this.results.staticDataSources.length > 0) {
      this.results.recommendations.push({
        issue: 'Static Data Sources Detected',
        priority: 'MEDIUM',
        solution: 'Replace all detected static/fallback data with authentic API sources'
      });
    }
    
    console.log('  📋 Generated solutions:');
    this.results.recommendations.forEach((rec, index) => {
      console.log(`    ${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`       → ${rec.solution}`);
    });
  }

  generateFinalReport() {
    console.log('\n📋 FINAL DIAGNOSTIC REPORT');
    console.log('==========================');
    
    console.log('\n🎯 KEY FINDINGS:');
    
    // Performance Metrics Assessment
    if (this.results.performanceMetrics.overallAuthentic === false) {
      console.log('  ❌ CRITICAL: Performance metrics using static/fallback data');
    } else if (this.results.performanceMetrics.overallAuthentic === true) {
      console.log('  ✅ Performance metrics showing dynamic variation');
    } else {
      console.log('  ⚠️  Performance metrics status unclear');
    }
    
    // Technical Analysis Assessment
    const techResults = Object.values(this.results.technicalAnalysis);
    const successfulTech = techResults.filter(r => r.success).length;
    const totalTech = techResults.length;
    
    if (successfulTech === 0) {
      console.log('  ❌ CRITICAL: Technical analysis completely non-functional');
    } else if (successfulTech < totalTech) {
      console.log(`  ⚠️  Technical analysis partially working (${successfulTech}/${totalTech})`);
    } else {
      console.log('  ✅ Technical analysis functioning properly');
    }
    
    // Static Data Assessment
    if (this.results.staticDataSources.length > 0) {
      console.log(`  ⚠️  ${this.results.staticDataSources.length} endpoints showing static data patterns`);
    } else {
      console.log('  ✅ No obvious static data patterns detected');
    }
    
    console.log('\n🛠️  RECOMMENDED ACTIONS:');
    if (this.results.recommendations.length === 0) {
      console.log('  ✅ No immediate actions required');
    } else {
      this.results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority}] ${rec.solution}`);
      });
    }
    
    console.log('\n🔄 NEXT STEPS:');
    console.log('  1. Implement authentic data collection for performance metrics');
    console.log('  2. Fix technical analysis OHLC data pipeline');
    console.log('  3. Remove all static/fallback data sources');
    console.log('  4. Verify data authenticity across all endpoints');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute diagnostic
async function main() {
  const diagnostic = new AuthenticPerformanceDiagnostic();
  await diagnostic.runCompleteDiagnostic();
}

main().catch(console.error);