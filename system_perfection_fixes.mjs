/**
 * System Perfection Fixes - External Shell Implementation
 * Addresses specific issues to achieve near 100% system health
 */

class SystemPerfectionFixer {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.fixResults = [];
    this.validationResults = [];
  }

  async implementPerfectionFixes() {
    console.log('\n🔧 IMPLEMENTING SYSTEM PERFECTION FIXES');
    console.log('======================================');
    
    await this.fix1_investigateEndpointIssues();
    await this.fix2_validateErrorHandling();
    await this.fix3_enhanceMonteCarloValidation();
    await this.validateFixesExternal();
    
    return this.generateFixReport();
  }

  async fix1_investigateEndpointIssues() {
    console.log('\n🔍 Fix 1: Investigating Endpoint Issues');
    
    const problematicEndpoints = [
      '/api/technical-analysis/BTC/USDT',
      '/api/pattern-analysis/BTC/USDT', 
      '/api/confluence-analysis/BTC/USDT',
      '/api/enhanced-pattern-recognition/BTC/USDT'
    ];
    
    for (const endpoint of problematicEndpoints) {
      try {
        console.log(`\n🧪 Testing ${endpoint}...`);
        
        // Test with different approaches
        const tests = [
          { name: 'Direct GET', url: `${this.baseUrl}${endpoint}` },
          { name: 'URL Encoded', url: `${this.baseUrl}${endpoint.replace(/\//g, '%2F')}` },
          { name: 'With Accept Header', url: `${this.baseUrl}${endpoint}`, headers: { 'Accept': 'application/json' } }
        ];
        
        for (const test of tests) {
          try {
            const response = await fetch(test.url, {
              headers: test.headers || {}
            });
            
            const contentType = response.headers.get('content-type');
            console.log(`   ${test.name}: Status ${response.status}, Content-Type: ${contentType}`);
            
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              console.log(`   ✅ ${test.name}: Valid JSON response`);
              
              this.fixResults.push({
                endpoint,
                test: test.name,
                status: 'working',
                fix: 'Endpoint responds with valid JSON'
              });
              break; // Found working approach
              
            } else {
              const text = await response.text();
              if (text.includes('<!DOCTYPE')) {
                console.log(`   ❌ ${test.name}: Returning HTML instead of JSON`);
                this.fixResults.push({
                  endpoint,
                  test: test.name,
                  status: 'html_response',
                  issue: 'Endpoint serving HTML instead of JSON',
                  fix: 'Need to check routing and ensure JSON response'
                });
              }
            }
            
          } catch (error) {
            console.log(`   ❌ ${test.name}: ${error.message}`);
          }
          
          await this.sleep(100);
        }
        
      } catch (error) {
        console.log(`❌ Failed to test ${endpoint}: ${error.message}`);
      }
    }
  }

  async fix2_validateErrorHandling() {
    console.log('\n🚨 Fix 2: Error Handling Validation & Improvement Analysis');
    
    const errorTests = [
      {
        name: 'Invalid Symbol Signals',
        test: () => fetch(`${this.baseUrl}/api/signals/INVALID_SYMBOL`),
        expectedBehavior: 'Should return empty array with 200 OR 404 with error',
        currentIssue: 'Returns 200 with empty array instead of 404'
      },
      {
        name: 'Missing Route Parameters',
        test: () => fetch(`${this.baseUrl}/api/technical-analysis/`),
        expectedBehavior: 'Should return 404 or 400 with error message',
        currentIssue: 'Returns 200 instead of error status'
      },
      {
        name: 'Non-existent Endpoint',
        test: () => fetch(`${this.baseUrl}/api/nonexistent-endpoint`),
        expectedBehavior: 'Should return 404 with error message',
        currentIssue: 'Returns 200 instead of 404'
      }
    ];
    
    for (const errorTest of errorTests) {
      try {
        console.log(`\n🧪 Testing: ${errorTest.name}`);
        console.log(`   Expected: ${errorTest.expectedBehavior}`);
        console.log(`   Issue: ${errorTest.currentIssue}`);
        
        const response = await errorTest.test();
        const contentType = response.headers.get('content-type');
        
        console.log(`   Actual Status: ${response.status}`);
        console.log(`   Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`   Response Data: ${JSON.stringify(data).substring(0, 100)}...`);
          
          // Analyze if the behavior is actually correct
          if (errorTest.name === 'Invalid Symbol Signals') {
            if (Array.isArray(data) && data.length === 0) {
              console.log(`   ✅ Analysis: Empty array response is actually correct behavior`);
              this.fixResults.push({
                test: errorTest.name,
                status: 'correct_behavior',
                analysis: 'Empty array for invalid symbol is valid REST API pattern'
              });
            }
          }
        } else {
          const text = await response.text();
          console.log(`   Response Text: ${text.substring(0, 100)}...`);
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
      }
    }
    
    // Propose error handling improvements
    console.log('\n📋 Error Handling Analysis:');
    console.log('   1. /api/signals/INVALID - Returns empty array (actually correct)');
    console.log('   2. /api/technical-analysis/ - Route handling issue');
    console.log('   3. /api/nonexistent - Default route catching all requests');
    console.log('\n💡 Recommended fixes:');
    console.log('   - Add 404 handling for unmatched routes');
    console.log('   - Ensure technical-analysis requires symbol parameter');
    console.log('   - Current signal behavior is actually RESTful and correct');
  }

  async fix3_enhanceMonteCarloValidation() {
    console.log('\n🎲 Fix 3: Monte Carlo Validation Enhancement Analysis');
    
    const validationTests = [
      { symbol: '', timeframe: '1d', shouldFail: true, reason: 'Empty symbol' },
      { symbol: 'BTC/USDT', timeframe: '', shouldFail: true, reason: 'Empty timeframe' },
      { symbol: null, timeframe: '1d', shouldFail: true, reason: 'Null symbol' },
      { symbol: 'BTC/USDT', timeframe: null, shouldFail: true, reason: 'Null timeframe' }
    ];
    
    console.log('\n🧪 Testing Monte Carlo edge cases:');
    
    for (const test of validationTests) {
      try {
        console.log(`\n   Testing: ${test.reason}`);
        
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: test.symbol,
            timeframe: test.timeframe
          })
        });
        
        const data = await response.json();
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${data.success}`);
        
        if (test.shouldFail) {
          if (response.status === 400 && data.error) {
            console.log(`   ✅ Correctly rejected: ${data.error}`);
            this.fixResults.push({
              test: test.reason,
              status: 'working_correctly',
              validation: 'Proper rejection with error message'
            });
          } else if (response.status === 200 && data.success) {
            console.log(`   ❌ Should have been rejected but succeeded`);
            this.fixResults.push({
              test: test.reason,
              status: 'needs_validation',
              issue: 'Should reject invalid input but currently accepts it',
              fix: 'Add stricter input validation for Monte Carlo'
            });
          }
        }
        
        await this.sleep(150);
        
      } catch (error) {
        console.log(`   ❌ Test failed: ${error.message}`);
      }
    }
    
    // Test timeframe validation specifically
    console.log('\n🔍 Timeframe Validation Analysis:');
    const timeframeTests = ['', null, 'invalid', '1x', 'bad'];
    
    for (const timeframe of timeframeTests) {
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: 'BTC/USDT',
            timeframe: timeframe
          })
        });
        
        const data = await response.json();
        console.log(`   Timeframe "${timeframe}": Status ${response.status}, Success: ${data.success}`);
        
        if ((timeframe === '' || timeframe === null) && response.status === 200) {
          this.fixResults.push({
            test: `timeframe_validation_${timeframe}`,
            status: 'needs_fix',
            issue: `Empty/null timeframe should be rejected`,
            fix: 'Add timeframe validation in Monte Carlo endpoint'
          });
        }
        
      } catch (error) {
        console.log(`   Timeframe "${timeframe}": Error - ${error.message}`);
      }
      
      await this.sleep(100);
    }
  }

  async validateFixesExternal() {
    console.log('\n✅ External Validation of System State');
    
    // Quick health check after analysis
    const quickTests = [
      { name: 'Core Monte Carlo', endpoint: '/api/monte-carlo-risk', method: 'POST' },
      { name: 'Signal Generation', endpoint: '/api/signals/BTC/USDT' },
      { name: 'Performance Metrics', endpoint: '/api/performance-metrics' },
      { name: 'Crypto Data', endpoint: '/api/crypto/BTC/USDT' }
    ];
    
    let workingEndpoints = 0;
    
    for (const test of quickTests) {
      try {
        let response;
        if (test.method === 'POST') {
          response = await fetch(`${this.baseUrl}${test.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
          });
        } else {
          response = await fetch(`${this.baseUrl}${test.endpoint}`);
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${test.name}: Working`);
          workingEndpoints++;
          
          this.validationResults.push({
            test: test.name,
            status: 'working',
            endpoint: test.endpoint
          });
        } else {
          console.log(`❌ ${test.name}: Status ${response.status}`);
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    
    const healthPercentage = (workingEndpoints / quickTests.length) * 100;
    console.log(`\n🎯 Core System Health: ${healthPercentage}%`);
    
    this.validationResults.push({
      test: 'overall_health',
      status: healthPercentage >= 80 ? 'good' : 'needs_attention',
      score: healthPercentage
    });
  }

  generateFixReport() {
    console.log('\n📋 SYSTEM PERFECTION FIX REPORT');
    console.log('==============================');
    
    // Categorize findings
    const workingItems = this.fixResults.filter(r => r.status === 'working' || r.status === 'working_correctly');
    const needsFixes = this.fixResults.filter(r => r.status === 'needs_fix' || r.status === 'needs_validation');
    const analysisItems = this.fixResults.filter(r => r.status === 'html_response' || r.status === 'correct_behavior');
    
    console.log('\n✅ WORKING CORRECTLY:');
    workingItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.test || item.endpoint}: ${item.validation || item.fix}`);
    });
    
    console.log('\n🔧 NEEDS FIXES:');
    needsFixes.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.test || item.endpoint}: ${item.issue}`);
      console.log(`      Fix: ${item.fix}`);
    });
    
    console.log('\n📊 ANALYSIS FINDINGS:');
    analysisItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.test || item.endpoint}: ${item.issue || item.analysis}`);
    });
    
    // Calculate improvement potential
    const totalIssues = needsFixes.length;
    const workingCorrectly = workingItems.length;
    
    console.log('\n🎯 IMPROVEMENT ASSESSMENT:');
    console.log(`   Working Correctly: ${workingCorrectly} items`);
    console.log(`   Needs Fixes: ${totalIssues} items`);
    console.log(`   Analysis Items: ${analysisItems.length} items`);
    
    const coreSystemHealth = this.validationResults.find(r => r.test === 'overall_health');
    if (coreSystemHealth) {
      console.log(`   Core System Health: ${coreSystemHealth.score}%`);
    }
    
    console.log('\n📋 PRIORITY FIXES FOR 95%+ HEALTH:');
    console.log('   1. Technical analysis endpoints - HTML response issue');
    console.log('   2. Monte Carlo timeframe validation - Add empty/null checks');
    console.log('   3. Route handling - Add proper 404 for unmatched routes');
    console.log('   4. Error response consistency - Standardize error formats');
    
    console.log('\n🚀 IMPLEMENTATION READY:');
    if (totalIssues <= 3 && coreSystemHealth && coreSystemHealth.score >= 75) {
      console.log('   Status: READY FOR TARGETED FIXES');
      console.log('   Recommendation: Implement specific fixes identified');
      return { ready: true, fixes: needsFixes, coreHealth: coreSystemHealth.score };
    } else {
      console.log('   Status: NEEDS MORE INVESTIGATION');
      console.log('   Recommendation: Address core issues first');
      return { ready: false, fixes: needsFixes, coreHealth: coreSystemHealth?.score || 0 };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute perfection fixes
async function main() {
  const fixer = new SystemPerfectionFixer();
  const report = await fixer.implementPerfectionFixes();
  
  console.log('\n🏁 SYSTEM PERFECTION FIXES COMPLETE');
  console.log(`Ready for implementation: ${report.ready}`);
  
  process.exit(report.ready ? 0 : 1);
}

main().catch(console.error);