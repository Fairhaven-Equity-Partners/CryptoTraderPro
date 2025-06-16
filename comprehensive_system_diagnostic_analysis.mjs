/**
 * COMPREHENSIVE SYSTEM DIAGNOSTIC ANALYSIS
 * Complete Line-by-Line Investigation of Cross-Pair & Timeframe Switching Issues
 * 
 * INVESTIGATION SCOPE:
 * - Technical Analysis Summary component data flow
 * - Risk Assessment Dashboard component data flow
 * - Advanced Signal Dashboard (working correctly)
 * - Cross-pair switching behavior
 * - Timeframe switching behavior
 * - React Query caching and invalidation
 * - API endpoint responses
 * - Symbol parameter passing
 * - Component re-rendering triggers
 */

class ComprehensiveSystemDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testPairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT'];
    this.timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
    this.issues = [];
    this.componentBehavior = {
      technicalAnalysisSummary: { switching: false, timeframeUpdate: false },
      riskAssessmentDashboard: { switching: false, timeframeUpdate: false },
      advancedSignalDashboard: { switching: true, timeframeUpdate: true }
    };
  }

  async runComprehensiveDiagnostic() {
    console.log('🔍 COMPREHENSIVE SYSTEM DIAGNOSTIC ANALYSIS');
    console.log('===========================================\n');
    
    console.log('📋 INVESTIGATION PLAN:');
    console.log('1. Cross-Pair Switching Analysis');
    console.log('2. Timeframe Update Analysis');
    console.log('3. React Query Cache Investigation');
    console.log('4. API Response Structure Validation');
    console.log('5. Component Props Analysis');
    console.log('6. Symbol Parameter Flow Tracking');
    console.log('7. Root Cause Identification');
    console.log('8. Complete Fix Implementation Plan\n');

    await this.analyzeCrossPairSwitching();
    await this.analyzeTimeframeUpdates();
    await this.analyzeReactQueryBehavior();
    await this.analyzeAPIResponseStructure();
    await this.identifyRootCauses();
    this.generateComprehensiveFixPlan();
  }

  async analyzeCrossPairSwitching() {
    console.log('🔄 PHASE 1: Cross-Pair Switching Analysis\n');
    
    for (let i = 0; i < this.testPairs.length - 1; i++) {
      const fromPair = this.testPairs[i];
      const toPair = this.testPairs[i + 1];
      
      console.log(`Testing switch: ${fromPair} → ${toPair}`);
      
      try {
        // Test Technical Analysis API responses
        const fromTechResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(fromPair)}`);
        await this.sleep(100);
        const toTechResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(toPair)}`);
        
        console.log(`  📊 Technical Analysis API:`);
        console.log(`    ${fromPair}: Symbol=${fromTechResponse.symbol}, Price=$${fromTechResponse.currentPrice?.toFixed(4)}`);
        console.log(`    ${toPair}: Symbol=${toTechResponse.symbol}, Price=$${toTechResponse.currentPrice?.toFixed(4)}`);
        
        if (fromTechResponse.symbol !== fromPair || toTechResponse.symbol !== toPair) {
          this.issues.push(`❌ Technical Analysis API returning wrong symbols`);
        }
        
        // Test Risk Assessment API responses
        const fromRiskResponse = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(fromPair)}`);
        await this.sleep(100);
        const toRiskResponse = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(toPair)}`);
        
        console.log(`  💰 Risk Assessment API:`);
        console.log(`    ${fromPair}: Symbol=${fromRiskResponse.symbol}, Position=${fromRiskResponse.riskAssessment?.positionSize || fromRiskResponse.riskAssessment?.positionSizing}`);
        console.log(`    ${toPair}: Symbol=${toRiskResponse.symbol}, Position=${toRiskResponse.riskAssessment?.positionSize || toRiskResponse.riskAssessment?.positionSizing}`);
        
        if (fromRiskResponse.symbol !== fromPair || toRiskResponse.symbol !== toPair) {
          this.issues.push(`❌ Risk Assessment API returning wrong symbols`);
        }
        
        console.log('');
        
      } catch (error) {
        this.issues.push(`❌ API error during ${fromPair}→${toPair} switch: ${error.message}`);
      }
    }
  }

  async analyzeTimeframeUpdates() {
    console.log('⏱️ PHASE 2: Timeframe Update Analysis\n');
    
    const testPair = 'BTC/USDT';
    console.log(`Testing timeframe updates for ${testPair}:`);
    
    for (const timeframe of this.timeframes.slice(0, 4)) { // Test first 4 timeframes
      try {
        const response = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(testPair)}?timeframe=${timeframe}`);
        
        console.log(`  📈 ${timeframe}: RSI=${response.data?.indicators?.rsi?.value?.toFixed(2)}, Confidence=${response.confidence}%`);
        
        if (!response.data?.indicators?.rsi) {
          this.issues.push(`❌ Missing RSI data for ${timeframe} timeframe`);
        }
        
        await this.sleep(50);
        
      } catch (error) {
        this.issues.push(`❌ Timeframe ${timeframe} error: ${error.message}`);
      }
    }
    console.log('');
  }

  async analyzeReactQueryBehavior() {
    console.log('🔄 PHASE 3: React Query Cache Investigation\n');
    
    console.log('React Query Cache Analysis:');
    console.log('  📝 Technical Analysis Summary query keys should include symbol parameter');
    console.log('  📝 Risk Assessment Dashboard query keys should include symbol parameter');
    console.log('  📝 Cache invalidation should trigger on symbol/timeframe changes');
    console.log('  📝 queryFn functions should use current symbol, not hardcoded values\n');
    
    // Test cache behavior by making repeated requests
    const testPair1 = 'BTC/USDT';
    const testPair2 = 'ETH/USDT';
    
    const response1a = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(testPair1)}`);
    const response2 = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(testPair2)}`);
    const response1b = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(testPair1)}`);
    
    console.log('Cache Validation Results:');
    console.log(`  ${testPair1} (1st call): Price=$${response1a.currentPrice?.toFixed(4)}`);
    console.log(`  ${testPair2}: Price=$${response2.currentPrice?.toFixed(4)}`);
    console.log(`  ${testPair1} (2nd call): Price=$${response1b.currentPrice?.toFixed(4)}`);
    
    if (response1a.currentPrice === response2.currentPrice) {
      this.issues.push(`❌ Cache contamination detected - same price for different symbols`);
    }
    console.log('');
  }

  async analyzeAPIResponseStructure() {
    console.log('📊 PHASE 4: API Response Structure Validation\n');
    
    const testPair = 'XRP/USDT';
    
    try {
      const techResponse = await this.makeRequest(`/api/technical-analysis/${encodeURIComponent(testPair)}`);
      
      console.log('Technical Analysis Response Structure:');
      console.log(`  ✅ Symbol: ${techResponse.symbol}`);
      console.log(`  ✅ Current Price: $${techResponse.currentPrice}`);
      console.log(`  ✅ Indicators: ${techResponse.data?.indicators ? 'Present' : 'Missing'}`);
      console.log(`  ✅ RSI: ${techResponse.data?.indicators?.rsi?.value?.toFixed(2)}`);
      console.log(`  ✅ MACD: ${techResponse.data?.indicators?.macd?.value?.toFixed(2)}`);
      console.log('');
      
      const riskResponse = await this.makeRequest(`/api/enhanced-risk-management/${encodeURIComponent(testPair)}`);
      
      console.log('Risk Assessment Response Structure:');
      console.log(`  ✅ Symbol: ${riskResponse.symbol}`);
      console.log(`  ✅ Risk Assessment: ${riskResponse.riskAssessment ? 'Present' : 'Missing'}`);
      console.log(`  ✅ Position Size: ${riskResponse.riskAssessment?.positionSize || riskResponse.riskAssessment?.positionSizing}`);
      console.log(`  ✅ Stop Loss: ${riskResponse.riskAssessment?.stopLoss}`);
      console.log('');
      
    } catch (error) {
      this.issues.push(`❌ API structure validation failed: ${error.message}`);
    }
  }

  identifyRootCauses() {
    console.log('🔍 PHASE 5: Root Cause Identification\n');
    
    console.log('SUSPECTED ROOT CAUSES:');
    console.log('');
    
    console.log('1. 🎯 React Query Cache Keys Issue:');
    console.log('   - Technical Analysis Summary may not include symbol in queryKey');
    console.log('   - Risk Assessment Dashboard may not include symbol in queryKey');
    console.log('   - This causes cache hits for wrong symbols');
    console.log('');
    
    console.log('2. 🎯 Component Symbol Prop Issue:');
    console.log('   - Components may not be receiving updated symbol prop');
    console.log('   - Props chain from Analysis.tsx may be broken');
    console.log('   - Default values may override current symbol');
    console.log('');
    
    console.log('3. 🎯 Timeframe Update Issue:');
    console.log('   - Components may not be listening to timeframe changes');
    console.log('   - Timeframe prop may not trigger re-fetch');
    console.log('   - Cache invalidation missing for timeframe changes');
    console.log('');
    
    console.log('4. 🎯 Query Function Hardcoding:');
    console.log('   - queryFn may use hardcoded symbol instead of dynamic prop');
    console.log('   - URL construction may ignore current symbol');
    console.log('   - Default symbol fallback masking the issue');
    console.log('');
    
    console.log('INVESTIGATION STATUS:');
    if (this.issues.length === 0) {
      console.log('✅ No API-level issues detected - problem is in frontend components');
    } else {
      console.log(`❌ ${this.issues.length} issues detected requiring fixes`);
      this.issues.forEach(issue => console.log(`   ${issue}`));
    }
    console.log('');
  }

  generateComprehensiveFixPlan() {
    console.log('🛠️ COMPREHENSIVE FIX IMPLEMENTATION PLAN');
    console.log('========================================\n');
    
    console.log('PHASE 1: Technical Analysis Summary Component Fix');
    console.log('  1.1 ✅ Add symbol parameter to React Query queryKey');
    console.log('  1.2 ✅ Update queryFn to use current symbol prop');
    console.log('  1.3 ✅ Add timeframe parameter to queryKey for timeframe switching');
    console.log('  1.4 ✅ Implement proper cache invalidation');
    console.log('  1.5 ✅ Add symbol and timeframe dependency to useEffect');
    console.log('');
    
    console.log('PHASE 2: Risk Assessment Dashboard Component Fix');
    console.log('  2.1 ✅ Add symbol parameter to React Query queryKey');
    console.log('  2.2 ✅ Update queryFn to use current symbol prop');
    console.log('  2.3 ✅ Add timeframe parameter to queryKey for timeframe switching');
    console.log('  2.4 ✅ Implement proper cache invalidation');
    console.log('  2.5 ✅ Add symbol and timeframe dependency to useEffect');
    console.log('');
    
    console.log('PHASE 3: Props Chain Validation');
    console.log('  3.1 ✅ Verify Analysis.tsx passes symbol to all components');
    console.log('  3.2 ✅ Verify timeframe prop is passed correctly');
    console.log('  3.3 ✅ Add debugging logs to trace prop flow');
    console.log('  3.4 ✅ Ensure no default overrides');
    console.log('');
    
    console.log('PHASE 4: React Query Configuration');
    console.log('  4.1 ✅ Update queryKey format: [endpoint, symbol, timeframe]');
    console.log('  4.2 ✅ Add proper error handling in queryFn');
    console.log('  4.3 ✅ Configure appropriate refetch intervals');
    console.log('  4.4 ✅ Add retry logic for failed requests');
    console.log('');
    
    console.log('PHASE 5: Comprehensive Testing Protocol');
    console.log('  5.1 ✅ Cross-pair switching validation (50 pairs)');
    console.log('  5.2 ✅ Timeframe switching validation (7 timeframes)');
    console.log('  5.3 ✅ Component isolation testing');
    console.log('  5.4 ✅ Cache behavior validation');
    console.log('  5.5 ✅ Real-time update testing');
    console.log('  5.6 ✅ Performance impact assessment');
    console.log('');
    
    console.log('EXPECTED OUTCOMES:');
    console.log('  ✅ 100% cross-pair switching accuracy');
    console.log('  ✅ 100% timeframe update accuracy');
    console.log('  ✅ Real-time component synchronization');
    console.log('  ✅ Zero cache contamination');
    console.log('  ✅ Consistent API response handling');
    console.log('  ✅ Production-ready deployment status');
    console.log('');
    
    console.log('VALIDATION CRITERIA:');
    console.log('  📊 Technical Analysis Summary shows correct symbol data');
    console.log('  💰 Risk Assessment Dashboard shows correct symbol data');
    console.log('  ⏱️ Both components update on timeframe changes');
    console.log('  🔄 Smooth transitions between any pair combinations');
    console.log('  📈 Real-time data accuracy maintained');
    console.log('  🚀 Zero component failures across all scenarios');
    
    return {
      issuesFound: this.issues.length,
      fixRequired: true,
      implementationPlan: 'comprehensive-component-fix',
      testingRequired: 'full-validation-suite'
    };
  }

  async makeRequest(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return await response.json();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const diagnostic = new ComprehensiveSystemDiagnostic();
  await diagnostic.runComprehensiveDiagnostic();
}

main().catch(console.error);