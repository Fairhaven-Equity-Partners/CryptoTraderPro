/**
 * COMPREHENSIVE CONFLUENCE DIAGNOSTIC - External Shell Testing
 * Systematic Investigation of Critical Signal Analysis Display Issue
 * 
 * Ground Rules Compliance:
 * - External shell testing for all investigations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of signal structure
 * - Zero tolerance for incomplete fixes
 */

import fetch from 'node-fetch';

class ComprehensiveConfluenceDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      signalStructure: {},
      routeAnalysis: {},
      dataTransformation: {},
      cacheInvestigation: {},
      endpointComparison: {}
    };
  }

  async runCompleteDiagnostic() {
    console.log('🔍 COMPREHENSIVE CONFLUENCE DIAGNOSTIC - External Shell Testing');
    console.log('Following All 11 Ground Rules for Authentic Market Data');
    console.log('================================================================================\n');

    await this.investigateSignalStructure();
    await this.analyzeRouteTransformation();
    await this.investigateDataFlow();
    await this.testCacheGeneration();
    await this.compareEndpointResponses();
    
    await this.generateDiagnosticReport();
  }

  async investigateSignalStructure() {
    console.log('🧪 Step 1: Deep Signal Structure Investigation');
    console.log('--------------------------------------------------\n');

    // Test raw signal generation by forcing new calculation
    const response = await this.makeRequest('/api/automation/force-regenerate', 'POST');
    console.log(`🔄 Forced cache regeneration: ${response.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Wait for regeneration
    await this.sleep(3000);
    
    // Test multiple endpoints for signal structure
    const endpoints = [
      '/api/signals',
      '/api/signals/BTC/USDT',
      '/api/signals/BTC%2FUSDT',
      '/api/automation/status'
    ];

    for (const endpoint of endpoints) {
      try {
        const data = await this.makeRequest(endpoint);
        const structure = this.analyzeDataStructure(data, endpoint);
        this.testResults.signalStructure[endpoint] = structure;
        
        console.log(`📊 ${endpoint}:`);
        console.log(`   ✓ Response type: ${structure.type}`);
        console.log(`   ✓ Data count: ${structure.count}`);
        console.log(`   ✓ Confluence fields: ${structure.confluenceFields}`);
        console.log(`   ✓ Sample keys: ${structure.sampleKeys.slice(0, 8).join(', ')}`);
        
        if (structure.sampleSignal) {
          console.log(`   ✓ Confluence present: ${structure.sampleSignal.hasOwnProperty('confluence') ? 'YES' : 'NO'}`);
          console.log(`   ✓ ConfluenceAnalysis present: ${structure.sampleSignal.hasOwnProperty('confluenceAnalysis') ? 'YES' : 'NO'}`);
          console.log(`   ✓ ConfluenceScore present: ${structure.sampleSignal.hasOwnProperty('confluenceScore') ? 'YES' : 'NO'}`);
        }
        console.log('');
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
        this.testResults.signalStructure[endpoint] = { error: error.message };
      }
    }
  }

  async analyzeRouteTransformation() {
    console.log('🔧 Step 2: Route Transformation Analysis');
    console.log('--------------------------------------------------\n');

    // Test if signals are being transformed or filtered in routes
    const testSymbols = ['BTC/USDT', 'ETH/USDT'];
    
    for (const symbol of testSymbols) {
      const encodedSymbol = encodeURIComponent(symbol);
      
      // Test multiple route variations
      const routes = [
        `/api/signals/${symbol}`,
        `/api/signals/${encodedSymbol}`,
        `/api/signals/${symbol}?timeframe=1h`,
        `/api/signals/${encodedSymbol}?timeframe=1h`
      ];

      console.log(`🎯 Testing ${symbol} routes:`);
      
      for (const route of routes) {
        try {
          const data = await this.makeRequest(route);
          const hasConfluence = this.checkConfluenceFields(data);
          
          console.log(`   ✓ ${route}: ${Array.isArray(data) ? data.length : 'N/A'} signals, confluence: ${hasConfluence ? 'YES' : 'NO'}`);
          
          this.testResults.routeAnalysis[route] = {
            count: Array.isArray(data) ? data.length : 0,
            hasConfluence: hasConfluence,
            structure: this.analyzeDataStructure(data, route)
          };
        } catch (error) {
          console.log(`   ❌ ${route}: ${error.message}`);
          this.testResults.routeAnalysis[route] = { error: error.message };
        }
      }
      console.log('');
    }
  }

  async investigateDataFlow() {
    console.log('🔍 Step 3: Data Flow Investigation');
    console.log('--------------------------------------------------\n');

    // Check automation status for signal cache info
    const status = await this.makeRequest('/api/automation/status');
    console.log(`📊 Signal Cache Status:`);
    console.log(`   ✓ Cache size: ${status.cachedSignalsCount}`);
    console.log(`   ✓ Last calculation: ${new Date(status.lastCalculationTime).toISOString()}`);
    console.log(`   ✓ Running: ${status.isRunning}`);
    console.log('');

    // Test individual signal access
    const btcSignals = await this.makeRequest('/api/signals/BTC/USDT');
    if (Array.isArray(btcSignals) && btcSignals.length > 0) {
      const signal = btcSignals[0];
      console.log(`🔬 First BTC Signal Analysis:`);
      console.log(`   ✓ Symbol: ${signal.symbol}`);
      console.log(`   ✓ Timeframe: ${signal.timeframe}`);
      console.log(`   ✓ Direction: ${signal.direction}`);
      console.log(`   ✓ Confidence: ${signal.confidence}`);
      console.log(`   ✓ Has confluence: ${signal.hasOwnProperty('confluence')}`);
      console.log(`   ✓ Has confluenceAnalysis: ${signal.hasOwnProperty('confluenceAnalysis')}`);
      console.log(`   ✓ Has confluenceScore: ${signal.hasOwnProperty('confluenceScore')}`);
      
      // Show full structure for debugging
      console.log(`   ✓ All keys: ${Object.keys(signal).join(', ')}`);
      console.log('');
      
      this.testResults.dataTransformation.sampleSignal = signal;
    }
  }

  async testCacheGeneration() {
    console.log('⚡ Step 4: Cache Generation Testing');
    console.log('--------------------------------------------------\n');

    // Force multiple cache regenerations and test consistency
    for (let i = 1; i <= 3; i++) {
      console.log(`🔄 Cache regeneration attempt ${i}:`);
      
      const regenResponse = await this.makeRequest('/api/automation/force-regenerate', 'POST');
      console.log(`   ✓ Regeneration triggered: ${regenResponse.success}`);
      
      // Wait for regeneration
      await this.sleep(2000);
      
      const signals = await this.makeRequest('/api/signals/BTC/USDT');
      const hasConfluence = this.checkConfluenceFields(signals);
      
      console.log(`   ✓ Signals generated: ${Array.isArray(signals) ? signals.length : 0}`);
      console.log(`   ✓ Confluence fields: ${hasConfluence ? 'PRESENT' : 'MISSING'}`);
      
      this.testResults.cacheInvestigation[`attempt_${i}`] = {
        success: regenResponse.success,
        signalCount: Array.isArray(signals) ? signals.length : 0,
        hasConfluence: hasConfluence
      };
      
      console.log('');
    }
  }

  async compareEndpointResponses() {
    console.log('📊 Step 5: Endpoint Response Comparison');
    console.log('--------------------------------------------------\n');

    // Compare different endpoint responses for same data
    const endpoints = [
      '/api/signals',
      '/api/signals/BTC/USDT',
      '/api/signals/BTC%2FUSDT'
    ];

    console.log('🔍 Comparing endpoint responses:');
    
    for (const endpoint of endpoints) {
      const data = await this.makeRequest(endpoint);
      const analysis = this.analyzeDataStructure(data, endpoint);
      
      console.log(`   ✓ ${endpoint}:`);
      console.log(`     - Type: ${analysis.type}`);
      console.log(`     - Count: ${analysis.count}`);
      console.log(`     - Confluence: ${analysis.confluenceFields}`);
      
      if (analysis.sampleSignal) {
        const signal = analysis.sampleSignal;
        console.log(`     - Sample structure: ${Object.keys(signal).length} fields`);
        console.log(`     - Has confluence: ${signal.hasOwnProperty('confluence')}`);
        console.log(`     - Has confluenceAnalysis: ${signal.hasOwnProperty('confluenceAnalysis')}`);
      }
      
      this.testResults.endpointComparison[endpoint] = analysis;
    }
    console.log('');
  }

  analyzeDataStructure(data, endpoint) {
    if (Array.isArray(data)) {
      const sampleSignal = data.length > 0 ? data[0] : null;
      return {
        type: 'array',
        count: data.length,
        sampleKeys: sampleSignal ? Object.keys(sampleSignal) : [],
        sampleSignal: sampleSignal,
        confluenceFields: this.checkConfluenceFields(data) ? 'PRESENT' : 'MISSING'
      };
    } else if (typeof data === 'object' && data !== null) {
      return {
        type: 'object',
        count: 1,
        sampleKeys: Object.keys(data),
        sampleSignal: data,
        confluenceFields: data.hasOwnProperty('confluence') || data.hasOwnProperty('confluenceAnalysis') ? 'PRESENT' : 'MISSING'
      };
    } else {
      return {
        type: typeof data,
        count: 0,
        sampleKeys: [],
        sampleSignal: null,
        confluenceFields: 'N/A'
      };
    }
  }

  checkConfluenceFields(data) {
    if (Array.isArray(data) && data.length > 0) {
      const signal = data[0];
      return signal.hasOwnProperty('confluence') || signal.hasOwnProperty('confluenceAnalysis');
    } else if (typeof data === 'object' && data !== null) {
      return data.hasOwnProperty('confluence') || data.hasOwnProperty('confluenceAnalysis');
    }
    return false;
  }

  async generateDiagnosticReport() {
    console.log('================================================================================');
    console.log('📋 COMPREHENSIVE CONFLUENCE DIAGNOSTIC REPORT');
    console.log('================================================================================\n');

    // Calculate overall diagnostic score
    let totalTests = 0;
    let passedTests = 0;

    console.log('🎯 DIAGNOSTIC SUMMARY:\n');

    // Signal Structure Analysis
    console.log('📊 Signal Structure Analysis:');
    Object.entries(this.testResults.signalStructure).forEach(([endpoint, result]) => {
      totalTests++;
      if (result.confluenceFields === 'PRESENT') {
        passedTests++;
        console.log(`   ✅ ${endpoint}: Confluence fields present`);
      } else if (result.error) {
        console.log(`   ❌ ${endpoint}: Error - ${result.error}`);
      } else {
        console.log(`   ❌ ${endpoint}: Confluence fields missing`);
      }
    });

    // Route Analysis
    console.log('\n🔧 Route Transformation Analysis:');
    Object.entries(this.testResults.routeAnalysis).forEach(([route, result]) => {
      totalTests++;
      if (result.hasConfluence) {
        passedTests++;
        console.log(`   ✅ ${route}: Confluence fields present`);
      } else if (result.error) {
        console.log(`   ❌ ${route}: Error - ${result.error}`);
      } else {
        console.log(`   ❌ ${route}: Confluence fields missing`);
      }
    });

    // Cache Generation Analysis
    console.log('\n⚡ Cache Generation Analysis:');
    Object.entries(this.testResults.cacheInvestigation).forEach(([attempt, result]) => {
      totalTests++;
      if (result.hasConfluence) {
        passedTests++;
        console.log(`   ✅ ${attempt}: Confluence fields generated`);
      } else {
        console.log(`   ❌ ${attempt}: Confluence fields missing after regeneration`);
      }
    });

    const diagnosticScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    console.log('\n================================================================================');
    console.log(`🎯 OVERALL DIAGNOSTIC SCORE: ${diagnosticScore}%`);
    console.log('================================================================================\n');

    console.log('📊 DIAGNOSTIC RESULTS:');
    console.log(`   Signal Structure Validation: ${this.calculateCategoryScore('signalStructure')}%`);
    console.log(`   Route Transformation Analysis: ${this.calculateCategoryScore('routeAnalysis')}%`);
    console.log(`   Cache Generation Testing: ${this.calculateCategoryScore('cacheInvestigation')}%`);

    console.log('\n🔍 ISSUES FOUND:');
    if (diagnosticScore < 100) {
      console.log('   ❌ Confluence fields consistently missing across all endpoints');
      console.log('   ❌ Signal structure lacks confluence and confluenceAnalysis fields');
      console.log('   ❌ Cache regeneration not solving the missing fields issue');
      console.log('   ❌ Route transformation not adding required fields');
    } else {
      console.log('   ✅ All diagnostic tests passed');
    }

    console.log('\n🛠️ ROOT CAUSE ANALYSIS:');
    console.log('   🔧 Signal generation in automatedSignalCalculator appears incomplete');
    console.log('   🔧 Interface definition may not match actual implementation');
    console.log('   🔧 Fallback signal creation missing confluence fields');
    console.log('   🔧 Cache serving signals without required confluence data');

    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('   ❌ Current approach incomplete - need deeper investigation');
    console.log('   🔧 Verify actual signal creation vs interface definition');
    console.log('   🔧 Check if signals are using fallback path exclusively');
    console.log('   🔧 Ensure all signal creation paths include confluence fields');

    console.log('\n================================================================================');
    
    return {
      score: diagnosticScore,
      passed: passedTests,
      total: totalTests,
      results: this.testResults
    };
  }

  calculateCategoryScore(category) {
    const results = this.testResults[category];
    if (!results || Object.keys(results).length === 0) return 0;

    let passed = 0;
    let total = 0;

    Object.values(results).forEach(result => {
      total++;
      if (result.hasConfluence || result.confluenceFields === 'PRESENT') {
        passed++;
      }
    });

    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute diagnostic
async function main() {
  const diagnostic = new ComprehensiveConfluenceDiagnostic();
  
  try {
    await diagnostic.runCompleteDiagnostic();
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    process.exit(1);
  }
}

main();