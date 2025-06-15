/**
 * Comprehensive UI Monte Carlo Debug - External Shell Testing
 * Deep investigation of the persistent "Invalid parameters" error
 */

class ComprehensiveUIMonteCarloDebug {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.findings = [];
  }

  async runFullDiagnosis() {
    console.log('🔍 COMPREHENSIVE UI MONTE CARLO DEBUG');
    console.log('====================================');
    console.log('Issue: Frontend still shows "Invalid parameters" after fix\n');

    // Step 1: Test current backend API status
    await this.testBackendAPIStatus();
    
    // Step 2: Analyze the frontend error handling code
    await this.analyzeFrontendErrorHandling();
    
    // Step 3: Test different request scenarios
    await this.testRequestScenarios();
    
    // Step 4: Investigate the apiRequest function
    await this.investigateAPIRequestFunction();
    
    // Step 5: Test exact user scenario
    await this.testUserScenario();
    
    // Step 6: Generate comprehensive solution
    this.generateComprehensiveSolution();
  }

  async testBackendAPIStatus() {
    console.log('📊 Testing Backend API Status');
    console.log('=============================');
    
    try {
      // Test successful request
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend API working correctly');
        console.log(`- Success: ${data.success}`);
        console.log(`- Symbol: ${data.symbol}`);
        console.log(`- Timeframe: ${data.timeframe}`);
        console.log(`- Risk Level: ${data.riskMetrics.riskLevel}`);
        console.log(`- Expected Return: ${data.riskMetrics.expectedReturn.toFixed(2)}%`);
        this.findings.push('Backend API is fully functional');
      } else {
        const errorText = await response.text();
        console.log(`❌ Backend error: ${response.status} - ${errorText}`);
        this.findings.push(`Backend error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      this.findings.push(`Network error: ${error.message}`);
    }
    
    console.log('');
  }

  async analyzeFrontendErrorHandling() {
    console.log('🔧 Analyzing Frontend Error Handling');
    console.log('====================================');
    
    console.log('Based on console logs, the frontend shows:');
    console.log('- "[MonteCarloRiskDisplay] Request error:",{}');
    console.log('- "[MonteCarloRiskDisplay] Analysis failed:",{}');
    console.log('- Error message: "Invalid parameters. Please check your symbol and timeframe selection."');
    console.log('- Error originates from line 65 in MonteCarloRiskDisplay.tsx');
    
    console.log('\nThis suggests:');
    console.log('1. The error object is empty: {}');
    console.log('2. The error handling logic is catching something but not getting useful error info');
    console.log('3. The error is being triggered at line 65, which should be our enhanced error handling');
    
    this.findings.push('Frontend error handling needs investigation - empty error object');
    console.log('');
  }

  async testRequestScenarios() {
    console.log('🧪 Testing Request Scenarios');
    console.log('============================');
    
    const scenarios = [
      { name: 'Valid BTC/USDT 1d', params: { symbol: 'BTC/USDT', timeframe: '1d' } },
      { name: 'Valid ETH/USDT 4h', params: { symbol: 'ETH/USDT', timeframe: '4h' } },
      { name: 'Empty symbol', params: { symbol: '', timeframe: '1d' } },
      { name: 'Invalid symbol', params: { symbol: 'INVALID/USDT', timeframe: '1d' } },
      { name: 'Empty timeframe', params: { symbol: 'BTC/USDT', timeframe: '' } }
    ];
    
    for (const scenario of scenarios) {
      console.log(`Testing: ${scenario.name}`);
      console.log(`Parameters:`, scenario.params);
      
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scenario.params)
        });
        
        console.log(`  Status: ${response.status}`);
        
        if (response.status === 429) {
          console.log(`  Rate limited - waiting...`);
          await this.sleep(3000);
          continue;
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Success: Risk level ${data.riskMetrics.riskLevel}`);
        } else {
          const errorData = await response.json();
          console.log(`  ❌ Error: ${errorData.error}`);
          
          // Check what specific errors the backend returns
          if (scenario.name === 'Valid BTC/USDT 1d' && response.status >= 400) {
            this.findings.push(`Valid request rejected: ${response.status} - ${errorData.error}`);
          }
        }
        
        await this.sleep(1000);
        
      } catch (error) {
        console.log(`  ❌ Request failed: ${error.message}`);
        
        if (scenario.name.includes('Valid')) {
          this.findings.push(`Valid request failed with network error: ${error.message}`);
        }
      }
    }
    
    console.log('');
  }

  async investigateAPIRequestFunction() {
    console.log('🔍 Investigating API Request Function');
    console.log('=====================================');
    
    console.log('The frontend error suggests the issue might be in the apiRequest function');
    console.log('or in how errors are being caught and handled.');
    
    console.log('\nPossible issues:');
    console.log('1. apiRequest function is throwing an error before the response is parsed');
    console.log('2. Response interceptor is modifying the error');
    console.log('3. Error handling logic is not correctly identifying error types');
    console.log('4. Request headers or body formatting issue');
    
    // Test if the issue is with headers or body formatting
    console.log('\nTesting different request formats:');
    
    try {
      // Test with different Content-Type
      const response1 = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      console.log(`Different Content-Type: ${response1.status}`);
      
      await this.sleep(2000);
      
      // Test with additional headers
      const response2 = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ symbol: 'ETH/USDT', timeframe: '4h' })
      });
      console.log(`With Accept header: ${response2.status}`);
      
    } catch (error) {
      console.log(`Header test failed: ${error.message}`);
    }
    
    this.findings.push('apiRequest function or error handling needs investigation');
    console.log('');
  }

  async testUserScenario() {
    console.log('👤 Testing User Scenario');
    console.log('========================');
    
    console.log('Based on the console logs, user is trying:');
    console.log('- Symbol: BTC/USDT');
    console.log('- Timeframe: 1d');
    console.log('- Getting "Invalid parameters" error');
    
    // Wait for rate limit to reset
    await this.sleep(3000);
    
    try {
      // Test exact user scenario multiple times
      for (let i = 1; i <= 3; i++) {
        console.log(`\nAttempt ${i}:`);
        
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
        });
        
        console.log(`  Status: ${response.status}`);
        
        if (response.status === 429) {
          console.log(`  Rate limited - this might be the issue!`);
          this.findings.push('User experiencing rate limiting which triggers "Invalid parameters" error');
          break;
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Should work: Risk level ${data.riskMetrics.riskLevel}`);
        } else {
          const errorData = await response.json();
          console.log(`  ❌ Backend error: ${errorData.error}`);
        }
        
        await this.sleep(2500);
      }
      
    } catch (error) {
      console.log(`User scenario test failed: ${error.message}`);
      this.findings.push(`User scenario fails: ${error.message}`);
    }
    
    console.log('');
  }

  generateComprehensiveSolution() {
    console.log('🎯 COMPREHENSIVE SOLUTION');
    console.log('=========================');
    
    console.log('Findings:');
    this.findings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding}`);
    });
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS');
    console.log('======================');
    
    console.log('The issue appears to be one of these:');
    console.log('');
    console.log('1. RATE LIMITING ISSUE:');
    console.log('   - Frontend is hitting rate limits (429 status)');
    console.log('   - Error handling incorrectly categorizes 429 as "Invalid parameters"');
    console.log('   - User repeatedly tries, hitting more rate limits');
    console.log('');
    console.log('2. ERROR OBJECT ISSUE:');
    console.log('   - Console shows empty error object: {}');
    console.log('   - apiRequest function might not be preserving error details');
    console.log('   - Error message defaults to "Invalid parameters"');
    console.log('');
    console.log('3. REQUEST TIMING ISSUE:');
    console.log('   - User triggering requests too quickly');
    console.log('   - Frontend not properly handling rapid requests');
    console.log('');
    
    console.log('🛠️ SOLUTION APPROACH');
    console.log('====================');
    
    console.log('1. FIX ERROR DETECTION:');
    console.log('   - Check if error message contains actual HTTP status');
    console.log('   - Look for rate limit responses specifically');
    console.log('   - Add better error object inspection');
    console.log('');
    console.log('2. IMPROVE LOGGING:');
    console.log('   - Add more detailed error logging in frontend');
    console.log('   - Log the actual response status and body');
    console.log('   - Track request timing and rate limiting');
    console.log('');
    console.log('3. ENHANCE RATE LIMIT HANDLING:');
    console.log('   - Detect 429 responses specifically');
    console.log('   - Show proper rate limit message');
    console.log('   - Implement automatic retry with delay');
    console.log('');
    
    console.log('📋 IMMEDIATE ACTIONS');
    console.log('===================');
    console.log('1. Update frontend error handling to check for 429 status specifically');
    console.log('2. Add detailed logging to see what error object actually contains');
    console.log('3. Test the apiRequest function behavior with rate limiting');
    console.log('4. Implement proper rate limit user feedback');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive debug
async function main() {
  const analyzer = new ComprehensiveUIMonteCarloDebug();
  await analyzer.runFullDiagnosis();
}

main().catch(console.error);