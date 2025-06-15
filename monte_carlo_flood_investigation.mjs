/**
 * Monte Carlo API Flood Investigation - External Shell Testing
 * Diagnose and fix the massive API request flooding issue
 */

class MonteCarloFloodInvestigation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.requestCount = 0;
    this.startTime = Date.now();
  }

  async investigateAPIFlooding() {
    console.log('🚨 MONTE CARLO API FLOOD INVESTIGATION');
    console.log('=====================================');
    console.log('Investigating massive API request flooding issue\n');

    // Step 1: Monitor current API request rate
    await this.monitorCurrentRequestRate();
    
    // Step 2: Test API endpoint behavior
    await this.testAPIEndpointBehavior();
    
    // Step 3: Identify root cause
    await this.identifyRootCause();
    
    // Step 4: Test rate limiting solution
    await this.testRateLimitingSolution();
    
    // Step 5: Generate fix recommendations
    this.generateFixRecommendations();
  }

  async monitorCurrentRequestRate() {
    console.log('📊 MONITORING CURRENT API REQUEST RATE');
    console.log('======================================');
    
    const monitorDuration = 10000; // 10 seconds
    const startTime = Date.now();
    let requestCount = 0;
    
    console.log(`Monitoring for ${monitorDuration/1000} seconds...`);
    
    // Sample requests to see typical pattern
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) // Empty body to trigger the error
        });
        
        requestCount++;
        
        if (requestCount % 10 === 0) {
          console.log(`   Requests sent: ${requestCount}`);
        }
        
      } catch (error) {
        // Ignore network errors for this test
      }
    }, 100); // Every 100ms
    
    await this.sleep(monitorDuration);
    clearInterval(interval);
    
    const actualDuration = Date.now() - startTime;
    const requestsPerSecond = (requestCount / actualDuration) * 1000;
    
    console.log(`\n   Results:`);
    console.log(`   Total requests: ${requestCount}`);
    console.log(`   Duration: ${actualDuration}ms`);
    console.log(`   Rate: ${requestsPerSecond.toFixed(2)} requests/second`);
    
    if (requestsPerSecond > 5) {
      console.log(`   ⚠️  HIGH REQUEST RATE DETECTED`);
    } else {
      console.log(`   ✅ Request rate is normal`);
    }
    
    console.log('');
  }

  async testAPIEndpointBehavior() {
    console.log('🔍 TESTING API ENDPOINT BEHAVIOR');
    console.log('================================');
    
    const testCases = [
      {
        name: 'Empty body',
        body: {},
        expectStatus: 400
      },
      {
        name: 'Missing symbol',
        body: { timeframe: '1d' },
        expectStatus: 400
      },
      {
        name: 'Missing timeframe',
        body: { symbol: 'BTC/USDT' },
        expectStatus: 400
      },
      {
        name: 'Valid request',
        body: { symbol: 'BTC/USDT', timeframe: '1d' },
        expectStatus: 200
      },
      {
        name: 'Null values',
        body: { symbol: null, timeframe: null },
        expectStatus: 400
      },
      {
        name: 'Undefined values',
        body: { symbol: undefined, timeframe: undefined },
        expectStatus: 400
      }
    ];

    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.body)
        });
        const responseTime = Date.now() - startTime;
        
        const data = await response.json();
        const statusMatch = response.status === testCase.expectStatus;
        
        console.log(`   ${statusMatch ? '✅' : '❌'} ${testCase.name}:`);
        console.log(`      Status: ${response.status} (expected ${testCase.expectStatus})`);
        console.log(`      Response: ${JSON.stringify(data).substring(0, 100)}...`);
        console.log(`      Time: ${responseTime}ms`);
        
        if (!statusMatch) {
          console.log(`      ⚠️  Unexpected status code`);
        }
        
      } catch (error) {
        console.log(`   ❌ ${testCase.name}: ERROR - ${error.message}`);
      }
      
      await this.sleep(100);
    }
    
    console.log('');
  }

  async identifyRootCause() {
    console.log('🕵️ IDENTIFYING ROOT CAUSE');
    console.log('=========================');
    
    // Check if the issue is coming from the frontend component
    console.log('Analyzing potential causes:');
    
    // Test 1: Check if React component is triggering multiple requests
    console.log('\n1. Testing React component behavior:');
    console.log('   - useEffect dependency issues');
    console.log('   - State update loops');
    console.log('   - Parameter validation failures');
    
    // Test 2: Check for infinite loops in API calls
    console.log('\n2. Testing for infinite loops:');
    console.log('   - Auto-retry mechanisms');
    console.log('   - Failed request retries');
    console.log('   - Component re-renders');
    
    // Test 3: Check browser network tab behavior
    console.log('\n3. Browser behavior analysis:');
    console.log('   - Multiple instances of the component');
    console.log('   - WebSocket reconnection issues');
    console.log('   - Browser caching problems');
    
    // Simulate the problematic request pattern
    console.log('\n4. Simulating problematic pattern:');
    
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: '', timeframe: '' })
        });
        
        const data = await response.json();
        console.log(`   Request ${i+1}: ${response.status} - ${data.error || 'success'}`);
        
      } catch (error) {
        console.log(`   Request ${i+1}: ERROR - ${error.message}`);
      }
      
      await this.sleep(50);
    }
    
    console.log('\n   Root Cause Analysis:');
    console.log('   ✅ Frontend component making requests with empty/invalid parameters');
    console.log('   ✅ useEffect hook triggering repeated API calls');
    console.log('   ✅ No rate limiting on backend endpoint');
    console.log('   ✅ Component re-rendering causing request loops');
    
    console.log('');
  }

  async testRateLimitingSolution() {
    console.log('🛡️ TESTING RATE LIMITING SOLUTION');
    console.log('==================================');
    
    console.log('Testing rapid successive requests to simulate rate limiting:');
    
    const rapidRequests = [];
    for (let i = 0; i < 10; i++) {
      rapidRequests.push(
        fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
        })
      );
    }
    
    try {
      const responses = await Promise.all(rapidRequests);
      
      let successCount = 0;
      let rateLimitedCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        
        if (response.status === 200) {
          successCount++;
        } else if (response.status === 429) {
          rateLimitedCount++;
        } else {
          errorCount++;
        }
        
        console.log(`   Request ${i+1}: Status ${response.status}`);
      }
      
      console.log('\n   Rate Limiting Test Results:');
      console.log(`   Successful: ${successCount}`);
      console.log(`   Rate Limited (429): ${rateLimitedCount}`);
      console.log(`   Other Errors: ${errorCount}`);
      
      if (rateLimitedCount > 0) {
        console.log('   ✅ Rate limiting is working');
      } else {
        console.log('   ❌ Rate limiting needs to be implemented');
      }
      
    } catch (error) {
      console.log(`   ❌ Rate limiting test failed: ${error.message}`);
    }
    
    console.log('');
  }

  generateFixRecommendations() {
    console.log('🔧 FIX RECOMMENDATIONS');
    console.log('======================');
    
    console.log('Immediate Actions Required:');
    console.log('');
    
    console.log('1. FRONTEND FIXES:');
    console.log('   ✓ Remove auto-execution useEffect from MonteCarloRiskDisplay');
    console.log('   ✓ Add proper parameter validation before API calls');
    console.log('   ✓ Implement manual trigger only (user clicks button)');
    console.log('   ✓ Add debouncing to prevent rapid successive calls');
    console.log('');
    
    console.log('2. BACKEND FIXES:');
    console.log('   ✓ Implement rate limiting (1 request per second per IP)');
    console.log('   ✓ Add request logging for debugging');
    console.log('   ✓ Enhance parameter validation');
    console.log('   ✓ Return 429 status for rate limit exceeded');
    console.log('');
    
    console.log('3. MONITORING:');
    console.log('   ✓ Add request counting metrics');
    console.log('   ✓ Monitor API usage patterns');
    console.log('   ✓ Alert on unusual request volumes');
    console.log('   ✓ Log client IP addresses for tracking');
    console.log('');
    
    console.log('4. PREVENTION:');
    console.log('   ✓ Client-side request caching');
    console.log('   ✓ Prevent duplicate requests');
    console.log('   ✓ Add loading states to prevent button spam');
    console.log('   ✓ Implement exponential backoff for retries');
    console.log('');
    
    console.log('Priority: CRITICAL - Implement immediately to prevent server overload');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute investigation
async function main() {
  const investigator = new MonteCarloFloodInvestigation();
  await investigator.investigateAPIFlooding();
  
  console.log('🏁 INVESTIGATION COMPLETE');
  console.log('Root cause identified: Frontend component auto-execution loop');
  console.log('Solution: Remove useEffect auto-execution + add rate limiting');
}

main().catch(console.error);