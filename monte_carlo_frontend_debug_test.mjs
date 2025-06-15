/**
 * Monte Carlo Frontend Debug Test - External Shell Analysis
 * Comprehensive debugging of the frontend error: "symbol required"
 * 
 * Ground Rules Compliance:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of frontend-backend communication
 * - Zero tolerance for system crashes
 */

class MonteCarloFrontendDebugTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = [];
  }

  async runCompleteDebugging() {
    console.log('🔍 MONTE CARLO FRONTEND DEBUG TEST');
    console.log('===================================');
    
    // 1. Test various request formats
    await this.testRequestFormats();
    
    // 2. Test URL encoding issues
    await this.testURLEncoding();
    
    // 3. Test header issues
    await this.testHeaderFormats();
    
    // 4. Test payload validation
    await this.testPayloadValidation();
    
    // 5. Compare with working backend requests
    await this.testWorkingRequests();
    
    this.generateDebugReport();
  }

  async testRequestFormats() {
    console.log('\n📊 TESTING REQUEST FORMATS');
    console.log('===========================');
    
    const testCases = [
      {
        name: 'Standard POST request',
        config: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
        }
      },
      {
        name: 'URL encoded symbol',
        config: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: 'BTC%2FUSDT', timeframe: '1d' })
        }
      },
      {
        name: 'Different symbol format',
        config: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: 'BTCUSDT', timeframe: '1d' })
        }
      },
      {
        name: 'Missing symbol (should fail)',
        config: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeframe: '1d' })
        }
      },
      {
        name: 'Empty symbol (should fail)',
        config: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: '', timeframe: '1d' })
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.name}`);
      
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, testCase.config);
        const data = await response.text();
        
        console.log(`  Status: ${response.status}`);
        console.log(`  Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
        console.log(`  Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        
        this.testResults.push({
          test: testCase.name,
          status: response.status,
          success: response.ok,
          response: data
        });
        
        await this.sleep(1000);
        
      } catch (error) {
        console.log(`  Error: ${error.message}`);
        this.testResults.push({
          test: testCase.name,
          status: 'ERROR',
          success: false,
          error: error.message
        });
      }
    }
  }

  async testURLEncoding() {
    console.log('\n🔗 TESTING URL ENCODING');
    console.log('=======================');
    
    const symbols = [
      'BTC/USDT',
      'BTC%2FUSDT',
      encodeURIComponent('BTC/USDT'),
      'BTCUSDT'
    ];

    for (const symbol of symbols) {
      console.log(`\nTesting symbol: "${symbol}"`);
      
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, timeframe: '1d' })
        });
        
        const data = await response.text();
        console.log(`  Status: ${response.status}`);
        console.log(`  Response preview: ${data.substring(0, 100)}...`);
        
        await this.sleep(1000);
        
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }
  }

  async testHeaderFormats() {
    console.log('\n📋 TESTING HEADER FORMATS');
    console.log('=========================');
    
    const headerTests = [
      {
        name: 'Standard headers',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'With Accept header',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      {
        name: 'With charset',
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      },
      {
        name: 'Minimal headers',
        headers: {}
      }
    ];

    for (const test of headerTests) {
      console.log(`\nTesting: ${test.name}`);
      
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: test.headers,
          body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
        });
        
        console.log(`  Status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`  Error: ${errorText}`);
        }
        
        await this.sleep(1000);
        
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }
  }

  async testPayloadValidation() {
    console.log('\n📦 TESTING PAYLOAD VALIDATION');
    console.log('=============================');
    
    const payloads = [
      {
        name: 'Valid payload',
        payload: { symbol: 'BTC/USDT', timeframe: '1d' }
      },
      {
        name: 'Null symbol',
        payload: { symbol: null, timeframe: '1d' }
      },
      {
        name: 'Undefined symbol',
        payload: { timeframe: '1d' }
      },
      {
        name: 'Number symbol',
        payload: { symbol: 123, timeframe: '1d' }
      },
      {
        name: 'Array payload',
        payload: [{ symbol: 'BTC/USDT', timeframe: '1d' }]
      },
      {
        name: 'String payload',
        payload: '{"symbol":"BTC/USDT","timeframe":"1d"}'
      }
    ];

    for (const test of payloads) {
      console.log(`\nTesting: ${test.name}`);
      console.log(`  Payload: ${JSON.stringify(test.payload)}`);
      
      try {
        const body = typeof test.payload === 'string' ? test.payload : JSON.stringify(test.payload);
        
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body
        });
        
        const data = await response.text();
        console.log(`  Status: ${response.status}`);
        console.log(`  Response: ${data.substring(0, 150)}${data.length > 150 ? '...' : ''}`);
        
        await this.sleep(1000);
        
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }
  }

  async testWorkingRequests() {
    console.log('\n✅ TESTING WORKING REQUESTS');
    console.log('===========================');
    
    // Test requests that we know work from our previous testing
    const workingTests = [
      {
        name: 'Direct curl equivalent',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
          });
          
          const data = await response.text();
          return { status: response.status, data };
        }
      },
      {
        name: 'Different symbol test',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: 'ETH/USDT', timeframe: '4h' })
          });
          
          const data = await response.text();
          return { status: response.status, data };
        }
      }
    ];

    for (const test of workingTests) {
      console.log(`\nTesting: ${test.name}`);
      
      try {
        const result = await test.test();
        console.log(`  Status: ${result.status}`);
        
        if (result.status === 200) {
          console.log('  ✅ SUCCESS - Request worked correctly');
          // Parse and show key fields
          try {
            const parsed = JSON.parse(result.data);
            console.log(`  Symbol: ${parsed.symbol}`);
            console.log(`  Timeframe: ${parsed.timeframe}`);
            console.log(`  Volatility: ${parsed.riskMetrics?.volatility}`);
            console.log(`  Signal Timeframe: ${parsed.signalInput?.timeframe}`);
          } catch (e) {
            console.log(`  Raw response: ${result.data.substring(0, 200)}...`);
          }
        } else {
          console.log(`  ❌ FAILED - Status ${result.status}`);
          console.log(`  Response: ${result.data}`);
        }
        
        await this.sleep(2000);
        
      } catch (error) {
        console.log(`  Error: ${error.message}`);
      }
    }
  }

  generateDebugReport() {
    console.log('\n📋 MONTE CARLO DEBUG REPORT');
    console.log('===========================');
    
    const successfulTests = this.testResults.filter(t => t.success);
    const failedTests = this.testResults.filter(t => !t.success);
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Successful: ${successfulTests.length}`);
    console.log(`Failed: ${failedTests.length}`);
    
    if (failedTests.length > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      failedTests.forEach((test, i) => {
        console.log(`  ${i+1}. ${test.test} - Status: ${test.status}`);
        if (test.response) {
          console.log(`     Response: ${test.response.substring(0, 100)}...`);
        }
        if (test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
    }
    
    if (successfulTests.length > 0) {
      console.log(`\n✅ SUCCESSFUL TESTS:`);
      successfulTests.forEach((test, i) => {
        console.log(`  ${i+1}. ${test.test} - Status: ${test.status}`);
      });
    }
    
    console.log('\n🔍 ANALYSIS:');
    
    // Analyze patterns
    const symbolRequiredErrors = this.testResults.filter(t => 
      t.response && t.response.includes('symbol required')
    );
    
    if (symbolRequiredErrors.length > 0) {
      console.log('- "Symbol required" errors detected in specific scenarios');
      console.log('- This suggests request parsing or validation issues');
    }
    
    const status400Errors = this.testResults.filter(t => t.status === 400);
    if (status400Errors.length > 0) {
      console.log('- Multiple 400 errors suggest validation problems');
    }
    
    const status200Success = this.testResults.filter(t => t.status === 200);
    if (status200Success.length > 0) {
      console.log('- Some requests work correctly, indicating backend is functional');
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Check request body parsing in backend');
    console.log('2. Verify symbol validation logic');
    console.log('3. Compare successful vs failed request formats');
    console.log('4. Test frontend request generation vs direct API calls');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute debugging
async function main() {
  const tester = new MonteCarloFrontendDebugTest();
  await tester.runCompleteDebugging();
}

main().catch(console.error);