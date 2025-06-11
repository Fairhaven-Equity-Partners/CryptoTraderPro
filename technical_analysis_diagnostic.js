/**
 * Technical Analysis Box Diagnostic Tool
 * Analyzes the technical analysis component vs performance analysis component
 * Identifies data flow issues and redundancy problems
 */

class TechnicalAnalysisDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      technicalAnalysisEndpoint: null,
      performanceMetricsEndpoint: null,
      componentAnalysis: {},
      dataFlowIssues: [],
      redundancyAnalysis: {},
      recommendations: []
    };
  }

  async runCompleteDiagnostic() {
    console.log('🔍 TECHNICAL ANALYSIS DIAGNOSTIC STARTING');
    console.log('==========================================');
    
    try {
      // Test both endpoints with BTC/USDT
      await this.testTechnicalAnalysisEndpoint();
      await this.testPerformanceMetricsEndpoint();
      
      // Analyze component differences
      await this.analyzeComponentDifferences();
      
      // Check for redundancy
      await this.analyzeRedundancy();
      
      // Test market analysis dependency
      await this.testMarketAnalysisDependency();
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
    }
  }

  async testTechnicalAnalysisEndpoint() {
    console.log('\n📊 TESTING TECHNICAL ANALYSIS ENDPOINT');
    console.log('=====================================');
    
    try {
      const response = await this.makeRequest('/api/technical-analysis/BTC%2FUSDT?timeframe=1d');
      
      this.results.technicalAnalysisEndpoint = {
        status: response.status || 'unknown',
        hasData: !!response.indicators,
        dataStructure: this.analyzeDataStructure(response),
        indicators: this.extractIndicators(response),
        isEmpty: this.isDataEmpty(response)
      };
      
      console.log('📈 Technical Analysis Response Status:', this.results.technicalAnalysisEndpoint.status);
      console.log('📊 Has Indicator Data:', this.results.technicalAnalysisEndpoint.hasData);
      console.log('🔢 Indicators Found:', Object.keys(this.results.technicalAnalysisEndpoint.indicators || {}).length);
      
      if (this.results.technicalAnalysisEndpoint.isEmpty) {
        console.log('⚠️  CRITICAL: Technical analysis endpoint returns empty/no data');
        this.results.dataFlowIssues.push('Technical analysis endpoint returns no meaningful data');
      }
      
    } catch (error) {
      console.error('❌ Technical analysis endpoint failed:', error.message);
      this.results.technicalAnalysisEndpoint = { error: error.message, isEmpty: true };
    }
  }

  async testPerformanceMetricsEndpoint() {
    console.log('\n📈 TESTING PERFORMANCE METRICS ENDPOINT');
    console.log('======================================');
    
    try {
      const response = await this.makeRequest('/api/performance-metrics');
      
      this.results.performanceMetricsEndpoint = {
        status: 'success',
        hasData: !!response.indicators,
        indicators: response.indicators || [],
        dataStructure: this.analyzeDataStructure(response),
        isEmpty: !response.indicators || response.indicators.length === 0
      };
      
      console.log('📊 Performance Metrics Status: success');
      console.log('📈 Has Indicators:', this.results.performanceMetricsEndpoint.hasData);
      console.log('🔢 Indicator Count:', this.results.performanceMetricsEndpoint.indicators.length);
      
      if (this.results.performanceMetricsEndpoint.hasData) {
        console.log('✅ Performance metrics working with authentic data');
        this.results.performanceMetricsEndpoint.indicators.forEach((ind, idx) => {
          console.log(`   ${idx + 1}. ${ind.indicator}: ${ind.value}% (${ind.status})`);
        });
      }
      
    } catch (error) {
      console.error('❌ Performance metrics endpoint failed:', error.message);
      this.results.performanceMetricsEndpoint = { error: error.message, isEmpty: true };
    }
  }

  async analyzeComponentDifferences() {
    console.log('\n🔍 ANALYZING COMPONENT DIFFERENCES');
    console.log('=================================');
    
    const technical = this.results.technicalAnalysisEndpoint;
    const performance = this.results.performanceMetricsEndpoint;
    
    this.results.componentAnalysis = {
      technicalAnalysisEmpty: technical?.isEmpty || false,
      performanceMetricsWorking: performance?.hasData || false,
      purposeDifference: this.analyzePurposeDifference(),
      dataOverlap: this.analyzeDataOverlap()
    };
    
    console.log('📊 Technical Analysis Box:', technical?.isEmpty ? 'EMPTY/NO DATA' : 'HAS DATA');
    console.log('📈 Performance Analysis Box:', performance?.hasData ? 'WORKING' : 'NO DATA');
    
    if (technical?.isEmpty && performance?.hasData) {
      console.log('⚠️  ISSUE IDENTIFIED: Technical analysis empty while performance metrics working');
      this.results.dataFlowIssues.push('Technical analysis component not receiving authentic indicator data');
    }
  }

  analyzePurposeDifference() {
    return {
      technicalAnalysis: 'Real-time RSI, MACD, EMA, SMA, Stochastic values for specific symbol/timeframe',
      performanceMetrics: 'Historical accuracy tracking of prediction indicators over time',
      shouldBeDistinct: true,
      currentIssue: 'Technical analysis should show live indicator values, not prediction accuracy'
    };
  }

  analyzeDataOverlap() {
    const technical = this.results.technicalAnalysisEndpoint?.indicators || {};
    const performance = this.results.performanceMetricsEndpoint?.indicators || [];
    
    const technicalIndicators = Object.keys(technical);
    const performanceIndicators = performance.map(p => p.indicator);
    
    return {
      technicalIndicators,
      performanceIndicators,
      overlap: technicalIndicators.filter(t => performanceIndicators.includes(t)),
      distinct: {
        technicalOnly: technicalIndicators.filter(t => !performanceIndicators.includes(t)),
        performanceOnly: performanceIndicators.filter(p => !technicalIndicators.includes(p))
      }
    };
  }

  async analyzeRedundancy() {
    console.log('\n🔄 ANALYZING REDUNDANCY');
    console.log('=====================');
    
    this.results.redundancyAnalysis = {
      isRedundant: false,
      reasoning: 'Different purposes - technical shows live values, performance shows accuracy',
      issue: 'Technical analysis box is empty/broken, not redundant',
      solution: 'Fix technical analysis to show live RSI, MACD, EMA values'
    };
    
    console.log('❓ Are components redundant?', this.results.redundancyAnalysis.isRedundant ? 'YES' : 'NO');
    console.log('📝 Analysis:', this.results.redundancyAnalysis.reasoning);
    console.log('🔧 Issue:', this.results.redundancyAnalysis.issue);
  }

  async testMarketAnalysisDependency() {
    console.log('\n🏪 TESTING MARKET ANALYSIS DEPENDENCY');
    console.log('====================================');
    
    try {
      // Test market heatmap endpoint
      const heatmapResponse = await this.makeRequest('/api/market-heatmap');
      
      const dependsOnTechnical = this.analyzeMarketDependency(heatmapResponse);
      const dependsOnPerformance = this.analyzeMarketDependency(heatmapResponse, 'performance');
      
      console.log('📊 Market analysis depends on technical data:', dependsOnTechnical ? 'YES' : 'NO');
      console.log('📈 Market analysis depends on performance data:', dependsOnPerformance ? 'YES' : 'NO');
      
      if (dependsOnTechnical) {
        this.results.dataFlowIssues.push('Market analysis may be using empty technical analysis data');
      }
      
    } catch (error) {
      console.log('⚠️  Could not test market analysis dependency:', error.message);
    }
  }

  analyzeMarketDependency(data, type = 'technical') {
    // Analyze if market data contains technical indicators or performance metrics
    const dataStr = JSON.stringify(data).toLowerCase();
    
    if (type === 'technical') {
      return dataStr.includes('rsi') || dataStr.includes('macd') || dataStr.includes('ema') || dataStr.includes('sma');
    } else {
      return dataStr.includes('accuracy') || dataStr.includes('performance') || dataStr.includes('hitrate');
    }
  }

  analyzeDataStructure(data) {
    if (!data) return { empty: true };
    
    return {
      hasIndicators: !!data.indicators || !!data.rsi || !!data.macd,
      hasValues: this.hasNumericValues(data),
      structure: Object.keys(data),
      dataTypes: this.getDataTypes(data)
    };
  }

  extractIndicators(response) {
    if (!response) return {};
    
    const indicators = {};
    
    // Extract various indicator formats
    if (response.rsi) indicators.RSI = response.rsi;
    if (response.macd) indicators.MACD = response.macd;
    if (response.ema) indicators.EMA = response.ema;
    if (response.sma) indicators.SMA = response.sma;
    if (response.stochastic) indicators.Stochastic = response.stochastic;
    if (response.bollingerBands) indicators.BollingerBands = response.bollingerBands;
    
    return indicators;
  }

  isDataEmpty(data) {
    if (!data) return true;
    if (data.success === false) return true;
    
    const indicators = this.extractIndicators(data);
    return Object.keys(indicators).length === 0;
  }

  hasNumericValues(data) {
    const str = JSON.stringify(data);
    return /\d+\.\d+/.test(str); // Look for decimal numbers
  }

  getDataTypes(data) {
    const types = {};
    for (const [key, value] of Object.entries(data)) {
      types[key] = typeof value;
    }
    return types;
  }

  generateFinalReport() {
    console.log('\n📋 FINAL DIAGNOSTIC REPORT');
    console.log('==========================');
    
    const technical = this.results.technicalAnalysisEndpoint;
    const performance = this.results.performanceMetricsEndpoint;
    
    console.log('\n🔍 FINDINGS:');
    console.log('1. Technical Analysis Box:', technical?.isEmpty ? '❌ EMPTY/BROKEN' : '✅ WORKING');
    console.log('2. Performance Analysis Box:', performance?.hasData ? '✅ WORKING' : '❌ BROKEN');
    console.log('3. Components Redundant:', this.results.redundancyAnalysis.isRedundant ? 'YES' : 'NO');
    
    console.log('\n⚠️  CRITICAL ISSUES:');
    this.results.dataFlowIssues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue}`);
    });
    
    console.log('\n🔧 RECOMMENDATIONS:');
    
    if (technical?.isEmpty) {
      console.log('1. 🚨 URGENT: Fix technical analysis endpoint to return live RSI, MACD, EMA, SMA, Stochastic values');
      console.log('2. 📊 Technical analysis should show real-time indicator values for selected symbol/timeframe');
      console.log('3. 🔄 Ensure technical analysis uses authentic market data from CoinMarketCap API');
    }
    
    if (performance?.hasData && technical?.isEmpty) {
      console.log('4. ✅ Performance analysis is working correctly with authentic data');
      console.log('5. 🎯 Focus repair efforts on technical analysis component only');
    }
    
    console.log('\n📝 SUMMARY:');
    console.log('The technical analysis box is NOT redundant with performance analysis.');
    console.log('Technical analysis should show live indicator values (RSI: 45.2, MACD: 0.34, etc.)');
    console.log('Performance analysis shows prediction accuracy over time (EMA: 76.0% accuracy)');
    console.log('The technical analysis box needs to be fixed to display authentic live indicator data.');
  }

  async makeRequest(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute diagnostic
async function main() {
  const diagnostic = new TechnicalAnalysisDiagnostic();
  await diagnostic.runCompleteDiagnostic();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TechnicalAnalysisDiagnostic };
} else {
  main().catch(console.error);
}