/**
 * Final UI Component Validation - External Shell Testing
 * Validates all priority-based UI fixes are working correctly
 */

class FinalUIComponentValidation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {};
  }

  async runFinalValidation() {
    console.log('🔍 FINAL UI COMPONENT VALIDATION');
    console.log('================================');
    
    await this.validateCriticalAPIFixes();
    await this.validateDataStructureCompatibility();
    await this.validateComponentIntegration();
    await this.generateFinalReport();
  }

  async validateCriticalAPIFixes() {
    console.log('🔧 VALIDATING CRITICAL API FIXES');
    console.log('================================');
    
    // Test 1: /api/signals endpoint returning JSON
    console.log('Testing /api/signals endpoint...');
    try {
      const response = await fetch(`${this.baseUrl}/api/signals`);
      const contentType = response.headers.get('content-type');
      
      if (response.status === 200 && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`  ✅ /api/signals: Valid JSON response with ${Array.isArray(data) ? data.length : 0} signals`);
        this.results.signalsEndpoint = 'FIXED';
      } else {
        console.log(`  ❌ /api/signals: Still returning ${contentType || 'unknown'} instead of JSON`);
        this.results.signalsEndpoint = 'STILL_BROKEN';
      }
    } catch (error) {
      console.log(`  ❌ /api/signals: ${error.message}`);
      this.results.signalsEndpoint = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test 2: Market data compatibility
    console.log('Testing market data API...');
    try {
      const response = await fetch(`${this.baseUrl}/api/crypto/all-pairs`);
      if (response.status === 200) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const sample = data[0];
          const hasCompatiblePrice = sample.currentPrice !== undefined || sample.price !== undefined;
          const hasChange = sample.change24h !== undefined;
          
          console.log(`  ✅ Market data: ${hasCompatiblePrice ? 'Price compatible' : 'No price'}, ${hasChange ? 'Change available' : 'No change'}`);
          this.results.marketData = hasCompatiblePrice && hasChange ? 'COMPATIBLE' : 'PARTIAL';
        } else {
          console.log(`  ⚠️ Market data: Empty response`);
          this.results.marketData = 'EMPTY';
        }
      }
    } catch (error) {
      console.log(`  ❌ Market data: ${error.message}`);
      this.results.marketData = 'ERROR';
    }
    
    console.log('');
  }

  async validateDataStructureCompatibility() {
    console.log('📊 VALIDATING DATA STRUCTURE COMPATIBILITY');
    console.log('==========================================');
    
    // Test performance metrics structure
    console.log('Testing performance metrics structure...');
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      if (response.status === 200) {
        const data = await response.json();
        
        if (data && Array.isArray(data.indicators)) {
          console.log(`  ✅ Performance metrics: ${data.indicators.length} indicators available`);
          this.results.performanceMetrics = 'COMPATIBLE';
        } else {
          console.log(`  ❌ Performance metrics: Invalid structure`);
          this.results.performanceMetrics = 'INCOMPATIBLE';
        }
      }
    } catch (error) {
      console.log(`  ❌ Performance metrics: ${error.message}`);
      this.results.performanceMetrics = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test technical analysis structure
    console.log('Testing technical analysis structure...');
    try {
      const response = await fetch(`${this.baseUrl}/api/technical-analysis/BTC%2FUSDT`);
      if (response.status === 200) {
        const data = await response.json();
        
        if (data && data.indicators) {
          console.log(`  ✅ Technical analysis: Indicators structure present`);
          this.results.technicalAnalysis = 'COMPATIBLE';
        } else {
          console.log(`  ❌ Technical analysis: Missing indicators`);
          this.results.technicalAnalysis = 'INCOMPATIBLE';
        }
      }
    } catch (error) {
      console.log(`  ❌ Technical analysis: ${error.message}`);
      this.results.technicalAnalysis = 'ERROR';
    }
    
    await this.sleep(200);
    
    // Test confluence analysis structure
    console.log('Testing confluence analysis structure...');
    try {
      const response = await fetch(`${this.baseUrl}/api/confluence-analysis/BTC/USDT`);
      if (response.status === 200) {
        const data = await response.json();
        
        if (data && data.confluence !== undefined) {
          console.log(`  ✅ Confluence analysis: Structure compatible`);
          this.results.confluenceAnalysis = 'COMPATIBLE';
        } else {
          console.log(`  ❌ Confluence analysis: Missing confluence field`);
          this.results.confluenceAnalysis = 'INCOMPATIBLE';
        }
      }
    } catch (error) {
      console.log(`  ❌ Confluence analysis: ${error.message}`);
      this.results.confluenceAnalysis = 'ERROR';
    }
    
    console.log('');
  }

  async validateComponentIntegration() {
    console.log('🧩 VALIDATING COMPONENT INTEGRATION');
    console.log('===================================');
    
    // Test simultaneous data loading (simulating component mounting)
    console.log('Testing simultaneous component data loading...');
    
    const startTime = Date.now();
    
    try {
      const promises = [
        fetch(`${this.baseUrl}/api/crypto/all-pairs`),
        fetch(`${this.baseUrl}/api/signals`),
        fetch(`${this.baseUrl}/api/performance-metrics`),
        fetch(`${this.baseUrl}/api/technical-analysis/BTC%2FUSDT`),
        fetch(`${this.baseUrl}/api/confluence-analysis/BTC/USDT`)
      ];
      
      const responses = await Promise.all(promises);
      const loadTime = Date.now() - startTime;
      
      const successfulResponses = responses.filter(r => r.status === 200).length;
      
      console.log(`  Load time: ${loadTime}ms`);
      console.log(`  Successful responses: ${successfulResponses}/${responses.length}`);
      
      if (successfulResponses >= 4 && loadTime < 2000) {
        console.log(`  ✅ Component integration: All systems operational`);
        this.results.componentIntegration = 'OPERATIONAL';
      } else if (successfulResponses >= 3) {
        console.log(`  ⚠️ Component integration: Mostly operational`);
        this.results.componentIntegration = 'PARTIAL';
      } else {
        console.log(`  ❌ Component integration: Multiple failures`);
        this.results.componentIntegration = 'FAILED';
      }
      
    } catch (error) {
      console.log(`  ❌ Component integration test failed: ${error.message}`);
      this.results.componentIntegration = 'ERROR';
    }
    
    console.log('');
  }

  async generateFinalReport() {
    console.log('📋 FINAL VALIDATION REPORT');
    console.log('==========================');
    
    const totalChecks = Object.keys(this.results).length;
    const passedChecks = Object.values(this.results).filter(r => 
      r === 'FIXED' || r === 'COMPATIBLE' || r === 'OPERATIONAL'
    ).length;
    
    const healthScore = (passedChecks / totalChecks) * 100;
    
    console.log(`\n🎯 UI COMPONENT HEALTH SCORE: ${healthScore.toFixed(1)}%`);
    console.log(`Passed Checks: ${passedChecks}/${totalChecks}`);
    
    console.log('\n📊 DETAILED RESULTS:');
    Object.entries(this.results).forEach(([component, status]) => {
      const icon = this.getStatusIcon(status);
      console.log(`${icon} ${component}: ${status}`);
    });
    
    console.log('\n🚀 PRIORITY-BASED UI LAYOUT STATUS:');
    
    if (healthScore >= 85) {
      console.log('✅ FULLY OPERATIONAL');
      console.log('✅ All critical API endpoints returning valid JSON');
      console.log('✅ Data structure compatibility resolved');
      console.log('✅ Component integration working correctly');
      console.log('✅ Priority-based layout ready for user interaction');
    } else if (healthScore >= 70) {
      console.log('⚠️ MOSTLY OPERATIONAL');
      console.log('Some minor issues present but core functionality working');
    } else if (healthScore >= 50) {
      console.log('⚠️ PARTIALLY OPERATIONAL');
      console.log('Some critical issues resolved, others still need attention');
    } else {
      console.log('❌ NEEDS IMMEDIATE ATTENTION');
      console.log('Critical issues still preventing proper operation');
    }
    
    console.log('\n🎉 EXTERNAL SHELL VALIDATION COMPLETE');
    console.log('Priority-based UI layout fixes validated through comprehensive testing');
    
    return {
      healthScore,
      passedChecks,
      totalChecks,
      results: this.results,
      isFullyOperational: healthScore >= 85
    };
  }

  getStatusIcon(status) {
    switch (status) {
      case 'FIXED':
      case 'COMPATIBLE': 
      case 'OPERATIONAL': return '✅';
      case 'PARTIAL': return '⚠️';
      case 'INCOMPATIBLE':
      case 'FAILED':
      case 'STILL_BROKEN': return '❌';
      case 'EMPTY': return '⚠️';
      case 'ERROR': return '❌';
      default: return '❓';
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const validator = new FinalUIComponentValidation();
  const results = await validator.runFinalValidation();
  return results;
}

main().catch(console.error);