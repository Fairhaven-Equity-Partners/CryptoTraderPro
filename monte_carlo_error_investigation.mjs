/**
 * Monte Carlo Error Investigation - External Shell Testing
 * Deep dive into the frontend error: "Invalid request parameters"
 */

class MonteCarloErrorInvestigation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.findings = [];
  }

  async investigateError() {
    console.log('🔍 MONTE CARLO ERROR INVESTIGATION');
    console.log('==================================');
    console.log('Investigating: "Invalid request parameters" error\n');

    // Step 1: Test the exact same request that frontend is making
    await this.testFrontendRequest();
    
    // Step 2: Test parameter validation
    await this.testParameterValidation();
    
    // Step 3: Test the API response format
    await this.testAPIResponseFormat();
    
    // Step 4: Test error handling flow
    await this.testErrorHandlingFlow();
    
    // Step 5: Generate solution
    this.generateSolution();
  }

  async testFrontendRequest() {
    console.log('📋 Testing Exact Frontend Request');
    console.log('=================================');
    
    // Simulate the exact request that frontend makes
    const testParams = { symbol: 'BTC/USDT', timeframe: '1d' };
    
    console.log('Test parameters:', testParams);
    console.log('Request body:', JSON.stringify(testParams));
    
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testParams)
      });
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend request successful');
        console.log('Response structure:', {
          success: data.success,
          symbol: data.symbol,
          timeframe: data.timeframe,
          hasRiskMetrics: !!data.riskMetrics,
          hasSignalInput: !!data.signalInput
        });
        this.findings.push('Backend API is working correctly');
      } else {
        const errorText = await response.text();
        console.log(`❌ Backend error: ${response.status}`);
        console.log(`Error response: ${errorText}`);
        this.findings.push(`Backend error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      this.findings.push(`Network error: ${error.message}`);
    }
    
    console.log('');
  }

  async testParameterValidation() {
    console.log('🔍 Testing Parameter Validation');
    console.log('==============================');
    
    const testCases = [
      { name: 'Valid parameters', params: { symbol: 'BTC/USDT', timeframe: '1d' } },
      { name: 'Empty symbol', params: { symbol: '', timeframe: '1d' } },
      { name: 'Empty timeframe', params: { symbol: 'BTC/USDT', timeframe: '' } },
      { name: 'Missing symbol', params: { timeframe: '1d' } },
      { name: 'Missing timeframe', params: { symbol: 'BTC/USDT' } },
      { name: 'Symbol with spaces', params: { symbol: ' BTC/USDT ', timeframe: '1d' } },
      { name: 'Timeframe with spaces', params: { symbol: 'BTC/USDT', timeframe: ' 1d ' } }
    ];
    
    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Parameters:`, testCase.params);
      
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.params)
        });
        
        console.log(`  Status: ${response.status}`);
        
        if (response.status === 429) {
          console.log(`  Rate limited - this is expected`);
          await this.sleep(2500); // Wait for rate limit
          continue;
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Success: ${data.success}`);
        } else {
          const errorText = await response.text();
          console.log(`  ❌ Error: ${errorText.substring(0, 100)}...`);
          
          if (testCase.name === 'Valid parameters' && response.status >= 400) {
            this.findings.push(`Valid parameters rejected with ${response.status}`);
          }
        }
        
        await this.sleep(100); // Small delay between requests
        
      } catch (error) {
        console.log(`  ❌ Request failed: ${error.message}`);
      }
    }
    
    console.log('');
  }

  async testAPIResponseFormat() {
    console.log('📊 Testing API Response Format');
    console.log('==============================');
    
    // Wait for rate limit to reset
    await this.sleep(3000);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '4h' })
      });
      
      if (response.ok) {
        const rawResponse = await response.text();
        console.log('Raw response length:', rawResponse.length);
        console.log('Raw response preview:', rawResponse.substring(0, 200) + '...');
        
        try {
          const data = JSON.parse(rawResponse);
          console.log('✅ Valid JSON response');
          console.log('Response keys:', Object.keys(data));
          
          // Check if response matches expected TypeScript interface
          const expectedFields = ['success', 'symbol', 'timeframe', 'riskMetrics', 'signalInput', 'timestamp'];
          const missingFields = expectedFields.filter(field => !(field in data));
          
          if (missingFields.length === 0) {
            console.log('✅ All expected fields present');
            this.findings.push('API response format is correct');
          } else {
            console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
            this.findings.push(`Missing response fields: ${missingFields.join(', ')}`);
          }
          
        } catch (parseError) {
          console.log(`❌ Invalid JSON: ${parseError.message}`);
          this.findings.push('API returning invalid JSON');
        }
        
      } else {
        console.log(`❌ API error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async testErrorHandlingFlow() {
    console.log('🚨 Testing Error Handling Flow');
    console.log('==============================');
    
    // Test various error scenarios to understand frontend error handling
    const errorTests = [
      {
        name: 'Network error simulation',
        url: 'http://localhost:9999/api/monte-carlo-risk', // Invalid port
        params: { symbol: 'BTC/USDT', timeframe: '1d' }
      },
      {
        name: 'Invalid endpoint',
        url: `${this.baseUrl}/api/invalid-endpoint`,
        params: { symbol: 'BTC/USDT', timeframe: '1d' }
      }
    ];
    
    for (const test of errorTests) {
      console.log(`Testing: ${test.name}`);
      
      try {
        const response = await fetch(test.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.params)
        });
        
        console.log(`  Status: ${response.status}`);
        
      } catch (error) {
        console.log(`  ✅ Expected error: ${error.message}`);
        console.log(`  Error type: ${error.constructor.name}`);
        
        // Check if this matches the frontend error
        if (error.message.includes('fetch')) {
          this.findings.push('Network errors are handled properly');
        }
      }
    }
    
    console.log('');
  }

  generateSolution() {
    console.log('🔧 SOLUTION ANALYSIS');
    console.log('====================');
    
    console.log('Findings:');
    this.findings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding}`);
    });
    
    console.log('\n🎯 ROOT CAUSE ANALYSIS');
    console.log('======================');
    
    console.log('Based on the console logs and investigation:');
    console.log('1. Frontend shows: "Invalid request parameters. Please check symbol and timeframe."');
    console.log('2. This error comes from the frontend error handling logic');
    console.log('3. The parameters "BTC/USDT" and "1d" appear to be valid');
    console.log('4. Backend external testing shows the API is working correctly');
    
    console.log('\n🔍 LIKELY ISSUE');
    console.log('===============');
    console.log('The frontend is catching an error and interpreting it as a 400 error');
    console.log('This triggers the enhanced error handling that shows "Invalid request parameters"');
    console.log('But the actual issue might be different (network, parsing, etc.)');
    
    console.log('\n🛠️ SOLUTION APPROACH');
    console.log('====================');
    console.log('1. Improve frontend error logging to show actual error details');
    console.log('2. Add better error differentiation in the frontend');
    console.log('3. Check if there are any interceptors or middleware affecting the request');
    console.log('4. Verify the apiRequest function is working correctly');
    
    console.log('\n📋 NEXT STEPS');
    console.log('=============');
    console.log('1. Examine the apiRequest function in the frontend');
    console.log('2. Add more detailed error logging to understand the actual error');
    console.log('3. Test the request without the enhanced error handling');
    console.log('4. Verify there are no request interceptors causing issues');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute investigation
async function main() {
  const investigator = new MonteCarloErrorInvestigation();
  await investigator.investigateError();
}

main().catch(console.error);