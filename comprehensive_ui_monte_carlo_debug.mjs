/**
 * Comprehensive Monte Carlo UI Debug - External Shell Testing
 * Complete analysis of frontend-backend interaction and UI display issues
 */

class ComprehensiveUIMonteCarloDebug {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.successes = [];
  }

  async runCompleteDebug() {
    console.log('🔍 COMPREHENSIVE MONTE CARLO UI DEBUG');
    console.log('====================================');
    console.log('Complete frontend-backend interaction analysis\n');

    // Step 1: Test backend response structure
    await this.testBackendResponseStructure();
    
    // Step 2: Test rate limiting behavior
    await this.testRateLimitingBehavior();
    
    // Step 3: Test error response handling
    await this.testErrorResponseHandling();
    
    // Step 4: Test data validation
    await this.testDataValidation();
    
    // Step 5: Test complete UI flow simulation
    await this.simulateCompleteUIFlow();
    
    // Step 6: Generate comprehensive fix
    await this.generateComprehensiveFix();
    
    this.generateFinalReport();
  }

  async testBackendResponseStructure() {
    console.log('🔧 Testing Backend Response Structure');
    console.log('====================================');
    
    try {
      // Test with valid parameters
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('✅ Response structure analysis:');
        console.log(`- success: ${data.success} (${typeof data.success})`);
        console.log(`- symbol: ${data.symbol} (${typeof data.symbol})`);
        console.log(`- timeframe: ${data.timeframe} (${typeof data.timeframe})`);
        console.log(`- riskMetrics: ${data.riskMetrics ? 'present' : 'missing'} (${typeof data.riskMetrics})`);
        console.log(`- signalInput: ${data.signalInput ? 'present' : 'missing'} (${typeof data.signalInput})`);
        console.log(`- timestamp: ${data.timestamp} (${typeof data.timestamp})`);
        
        if (data.riskMetrics) {
          const rm = data.riskMetrics;
          console.log('\n📊 Risk Metrics Structure:');
          console.log(`- expectedReturn: ${rm.expectedReturn} (${typeof rm.expectedReturn})`);
          console.log(`- var95: ${rm.var95} (${typeof rm.var95})`);
          console.log(`- maxDrawdown: ${rm.maxDrawdown} (${typeof rm.maxDrawdown})`);
          console.log(`- winProbability: ${rm.winProbability} (${typeof rm.winProbability})`);
          console.log(`- riskScore: ${rm.riskScore} (${typeof rm.riskScore})`);
          console.log(`- sharpeRatio: ${rm.sharpeRatio} (${typeof rm.sharpeRatio})`);
          console.log(`- confidenceInterval: ${JSON.stringify(rm.confidenceInterval)} (${typeof rm.confidenceInterval})`);
          console.log(`- riskLevel: ${rm.riskLevel} (${typeof rm.riskLevel})`);
          
          // Validate all required fields are present and correct type
          const requiredFields = [
            { name: 'expectedReturn', type: 'number' },
            { name: 'var95', type: 'number' },
            { name: 'maxDrawdown', type: 'number' },
            { name: 'winProbability', type: 'number' },
            { name: 'riskScore', type: 'number' },
            { name: 'sharpeRatio', type: 'number' },
            { name: 'confidenceInterval', type: 'object' },
            { name: 'riskLevel', type: 'string' }
          ];
          
          let allFieldsValid = true;
          for (const field of requiredFields) {
            const value = rm[field.name];
            const actualType = Array.isArray(value) ? 'object' : typeof value;
            
            if (value === undefined || value === null) {
              console.log(`❌ Missing field: ${field.name}`);
              this.issues.push(`Missing riskMetrics.${field.name}`);
              allFieldsValid = false;
            } else if (actualType !== field.type) {
              console.log(`❌ Wrong type for ${field.name}: expected ${field.type}, got ${actualType}`);
              this.issues.push(`Wrong type for riskMetrics.${field.name}`);
              allFieldsValid = false;
            } else {
              console.log(`✅ ${field.name}: valid ${field.type}`);
            }
          }
          
          if (allFieldsValid) {
            this.successes.push('All riskMetrics fields valid');
          }
        } else {
          console.log('❌ riskMetrics field missing entirely');
          this.issues.push('riskMetrics field missing');
        }
        
        if (data.signalInput) {
          const si = data.signalInput;
          console.log('\n📈 Signal Input Structure:');
          console.log(`- entryPrice: ${si.entryPrice} (${typeof si.entryPrice})`);
          console.log(`- stopLoss: ${si.stopLoss} (${typeof si.stopLoss})`);
          console.log(`- takeProfit: ${si.takeProfit} (${typeof si.takeProfit})`);
          console.log(`- confidence: ${si.confidence} (${typeof si.confidence})`);
          console.log(`- direction: ${si.direction} (${typeof si.direction})`);
          
          const signalFields = [
            { name: 'entryPrice', type: 'number' },
            { name: 'stopLoss', type: 'number' },
            { name: 'takeProfit', type: 'number' },
            { name: 'confidence', type: 'number' },
            { name: 'direction', type: 'string' }
          ];
          
          let allSignalFieldsValid = true;
          for (const field of signalFields) {
            const value = si[field.name];
            const actualType = typeof value;
            
            if (value === undefined || value === null) {
              console.log(`❌ Missing signalInput field: ${field.name}`);
              this.issues.push(`Missing signalInput.${field.name}`);
              allSignalFieldsValid = false;
            } else if (actualType !== field.type) {
              console.log(`❌ Wrong type for signalInput.${field.name}: expected ${field.type}, got ${actualType}`);
              this.issues.push(`Wrong type for signalInput.${field.name}`);
              allSignalFieldsValid = false;
            } else {
              console.log(`✅ signalInput.${field.name}: valid ${field.type}`);
            }
          }
          
          if (allSignalFieldsValid) {
            this.successes.push('All signalInput fields valid');
          }
        } else {
          console.log('❌ signalInput field missing');
          this.issues.push('signalInput field missing');
        }
        
      } else {
        console.log(`❌ Backend returned error: ${response.status}`);
        const errorText = await response.text();
        console.log(`Error response: ${errorText}`);
        this.issues.push(`Backend error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      this.issues.push(`Network error: ${error.message}`);
    }
    
    console.log('');
  }

  async testRateLimitingBehavior() {
    console.log('🛡️ Testing Rate Limiting Behavior');
    console.log('==================================');
    
    try {
      console.log('Making rapid sequential requests...');
      
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(
          fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: 'ETH/USDT', timeframe: '4h' })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      
      let successCount = 0;
      let rateLimitedCount = 0;
      
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        console.log(`Request ${i + 1}: ${response.status}`);
        
        if (response.status === 200) {
          successCount++;
        } else if (response.status === 429) {
          rateLimitedCount++;
          const errorText = await response.text();
          console.log(`  Rate limit message: ${errorText}`);
        } else {
          console.log(`  Unexpected status: ${response.status}`);
        }
      }
      
      console.log(`\nResults: ${successCount} successful, ${rateLimitedCount} rate limited`);
      
      if (rateLimitedCount > 0) {
        console.log('✅ Rate limiting is working correctly');
        this.successes.push('Rate limiting operational');
      } else {
        console.log('⚠️ Rate limiting may not be working');
        this.issues.push('Rate limiting not detected');
      }
      
    } catch (error) {
      console.log(`❌ Rate limiting test failed: ${error.message}`);
      this.issues.push(`Rate limiting test error: ${error.message}`);
    }
    
    console.log('');
  }

  async testErrorResponseHandling() {
    console.log('❌ Testing Error Response Handling');
    console.log('==================================');
    
    const errorTests = [
      { name: 'Empty body', body: '{}' },
      { name: 'Missing symbol', body: '{"timeframe": "1d"}' },
      { name: 'Missing timeframe', body: '{"symbol": "BTC/USDT"}' },
      { name: 'Invalid symbol', body: '{"symbol": "", "timeframe": "1d"}' },
      { name: 'Invalid timeframe', body: '{"symbol": "BTC/USDT", "timeframe": ""}' },
      { name: 'Invalid JSON', body: '{"symbol": "BTC/USDT", "timeframe":' }
    ];
    
    for (const test of errorTests) {
      try {
        console.log(`Testing ${test.name}...`);
        
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: test.body
        });
        
        console.log(`  Status: ${response.status}`);
        
        if (response.status >= 400) {
          const errorText = await response.text();
          console.log(`  Error response: ${errorText.substring(0, 100)}...`);
          
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              console.log(`  ✅ Proper error format with message`);
              this.successes.push(`Error handling for ${test.name}`);
            } else {
              console.log(`  ⚠️ Error response missing error field`);
            }
          } catch (parseError) {
            console.log(`  ⚠️ Error response not valid JSON`);
          }
        } else {
          console.log(`  ⚠️ Should have returned error for ${test.name}`);
          this.issues.push(`No error for ${test.name}`);
        }
        
        await this.sleep(100); // Small delay between tests
        
      } catch (error) {
        if (test.name === 'Invalid JSON' && error.message.includes('JSON')) {
          console.log(`  ✅ Properly rejected invalid JSON`);
          this.successes.push('Invalid JSON rejection');
        } else {
          console.log(`  ❌ Test failed: ${error.message}`);
          this.issues.push(`Error test ${test.name} failed`);
        }
      }
    }
    
    console.log('');
  }

  async testDataValidation() {
    console.log('🔍 Testing Data Validation');
    console.log('==========================');
    
    // Wait for rate limit to reset
    await this.sleep(3000);
    
    try {
      console.log('Testing with valid data...');
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Validate numerical ranges
        if (data.riskMetrics) {
          const rm = data.riskMetrics;
          
          console.log('Validating data ranges...');
          
          // Win probability should be 0-100
          if (rm.winProbability >= 0 && rm.winProbability <= 100) {
            console.log(`✅ Win probability in valid range: ${rm.winProbability}%`);
            this.successes.push('Win probability range valid');
          } else {
            console.log(`❌ Win probability out of range: ${rm.winProbability}%`);
            this.issues.push('Win probability out of range');
          }
          
          // Risk score should be 0-100
          if (rm.riskScore >= 0 && rm.riskScore <= 100) {
            console.log(`✅ Risk score in valid range: ${rm.riskScore}`);
            this.successes.push('Risk score range valid');
          } else {
            console.log(`❌ Risk score out of range: ${rm.riskScore}`);
            this.issues.push('Risk score out of range');
          }
          
          // Risk level should be valid enum
          const validRiskLevels = ['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
          if (validRiskLevels.includes(rm.riskLevel)) {
            console.log(`✅ Risk level valid: ${rm.riskLevel}`);
            this.successes.push('Risk level valid');
          } else {
            console.log(`❌ Invalid risk level: ${rm.riskLevel}`);
            this.issues.push('Invalid risk level');
          }
          
          // Confidence interval should be array of 2 numbers
          if (Array.isArray(rm.confidenceInterval) && rm.confidenceInterval.length === 2) {
            console.log(`✅ Confidence interval valid: [${rm.confidenceInterval.join(', ')}]`);
            this.successes.push('Confidence interval valid');
          } else {
            console.log(`❌ Invalid confidence interval: ${JSON.stringify(rm.confidenceInterval)}`);
            this.issues.push('Invalid confidence interval');
          }
        }
        
        // Validate signal input
        if (data.signalInput) {
          const si = data.signalInput;
          
          // Prices should be positive
          const prices = [si.entryPrice, si.stopLoss, si.takeProfit];
          let allPricesValid = true;
          
          for (const price of prices) {
            if (price <= 0) {
              console.log(`❌ Invalid price: ${price}`);
              this.issues.push('Invalid price value');
              allPricesValid = false;
            }
          }
          
          if (allPricesValid) {
            console.log(`✅ All prices positive: Entry $${si.entryPrice.toFixed(2)}`);
            this.successes.push('Price values valid');
          }
          
          // Confidence should be 0-100
          if (si.confidence >= 0 && si.confidence <= 100) {
            console.log(`✅ Signal confidence valid: ${si.confidence}%`);
            this.successes.push('Signal confidence valid');
          } else {
            console.log(`❌ Invalid signal confidence: ${si.confidence}%`);
            this.issues.push('Invalid signal confidence');
          }
        }
        
      } else {
        console.log(`❌ Data validation test failed: ${response.status}`);
        this.issues.push('Data validation test failed');
      }
      
    } catch (error) {
      console.log(`❌ Data validation error: ${error.message}`);
      this.issues.push(`Data validation error: ${error.message}`);
    }
    
    console.log('');
  }

  async simulateCompleteUIFlow() {
    console.log('🎯 Simulating Complete UI Flow');
    console.log('==============================');
    
    // Wait for rate limit
    await this.sleep(3000);
    
    console.log('Step 1: User selects symbol and timeframe');
    const userSymbol = 'BTC/USDT';
    const userTimeframe = '4h';
    console.log(`User selection: ${userSymbol} on ${userTimeframe}`);
    
    console.log('\nStep 2: User clicks "Run Risk Analysis" button');
    console.log('Frontend validation...');
    
    // Simulate frontend validation
    if (!userSymbol || !userTimeframe) {
      console.log('❌ Frontend validation failed: missing parameters');
      this.issues.push('Frontend validation insufficient');
      return;
    }
    
    if (userSymbol.trim() === '' || userTimeframe.trim() === '') {
      console.log('❌ Frontend validation failed: empty parameters');
      this.issues.push('Frontend validation insufficient');
      return;
    }
    
    console.log('✅ Frontend validation passed');
    
    console.log('\nStep 3: Making API request...');
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: userSymbol, timeframe: userTimeframe })
      });
      const responseTime = Date.now() - startTime;
      
      console.log(`Response received in ${responseTime}ms`);
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('\nStep 4: Processing response data...');
        
        // Simulate frontend processing
        if (data.success && data.riskMetrics && data.signalInput) {
          console.log('✅ Frontend successfully parsed response');
          
          console.log('\nStep 5: Displaying results to user...');
          console.log('UI Elements that would be displayed:');
          console.log(`- Symbol: ${data.symbol}`);
          console.log(`- Timeframe: ${data.timeframe}`);
          console.log(`- Risk Level: ${data.riskMetrics.riskLevel}`);
          console.log(`- Expected Return: ${data.riskMetrics.expectedReturn.toFixed(2)}%`);
          console.log(`- Value at Risk: ${data.riskMetrics.var95.toFixed(2)}%`);
          console.log(`- Win Probability: ${data.riskMetrics.winProbability.toFixed(1)}%`);
          console.log(`- Entry Price: $${data.signalInput.entryPrice.toLocaleString()}`);
          console.log(`- Stop Loss: $${data.signalInput.stopLoss.toLocaleString()}`);
          console.log(`- Take Profit: $${data.signalInput.takeProfit.toLocaleString()}`);
          
          console.log('\n✅ Complete UI flow successful');
          this.successes.push('Complete UI flow working');
          
        } else {
          console.log('❌ Frontend cannot process response data');
          console.log(`Missing fields: ${!data.success ? 'success ' : ''}${!data.riskMetrics ? 'riskMetrics ' : ''}${!data.signalInput ? 'signalInput' : ''}`);
          this.issues.push('Frontend data processing failed');
        }
        
      } else if (response.status === 429) {
        console.log('⚠️ Rate limited - this is expected behavior');
        console.log('UI should show: "Please wait before making another request"');
        this.successes.push('Rate limiting UI behavior correct');
        
      } else {
        console.log(`❌ API error: ${response.status}`);
        const errorText = await response.text();
        console.log(`Error: ${errorText}`);
        console.log('UI should show: Error message to user');
        this.issues.push('API error handling needed');
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      console.log('UI should show: Network connection error');
      this.issues.push('Network error handling needed');
    }
    
    console.log('');
  }

  async generateComprehensiveFix() {
    console.log('🔧 Generating Comprehensive Fix');
    console.log('===============================');
    
    console.log('Issues identified:');
    this.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\nWorking components:');
    this.successes.forEach((success, index) => {
      console.log(`${index + 1}. ${success}`);
    });
    
    console.log('\nRecommended fixes:');
    
    if (this.issues.length === 0) {
      console.log('✅ No issues found - system appears to be working correctly');
    } else {
      console.log('1. Frontend error handling improvement needed');
      console.log('2. Better error message display in UI');
      console.log('3. Loading state management enhancement');
      console.log('4. Rate limiting user feedback improvement');
    }
  }

  generateFinalReport() {
    console.log('\n📋 FINAL DEBUG REPORT');
    console.log('=====================');
    
    const totalIssues = this.issues.length;
    const totalSuccesses = this.successes.length;
    const healthScore = (totalSuccesses / (totalSuccesses + totalIssues)) * 100;
    
    console.log(`Health Score: ${healthScore.toFixed(1)}%`);
    console.log(`Working Components: ${totalSuccesses}`);
    console.log(`Issues Found: ${totalIssues}`);
    
    if (healthScore >= 90) {
      console.log('🟢 STATUS: System is working correctly');
      console.log('Minor enhancements may be beneficial but not critical');
    } else if (healthScore >= 70) {
      console.log('🟡 STATUS: System mostly working with some issues');
      console.log('Fixes recommended for optimal user experience');
    } else {
      console.log('🔴 STATUS: Significant issues require attention');
      console.log('Multiple fixes needed for proper functionality');
    }
    
    console.log('\nNext Steps:');
    if (totalIssues === 0) {
      console.log('- System appears to be working correctly');
      console.log('- Monitor user feedback for any missed edge cases');
    } else {
      console.log('- Implement error handling improvements');
      console.log('- Enhance user feedback for edge cases');
      console.log('- Test with real user interactions');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive debug
async function main() {
  const debug = new ComprehensiveUIMonteCarloDebug();
  await debug.runCompleteDebug();
}

main().catch(console.error);