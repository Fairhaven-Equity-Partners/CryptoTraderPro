/**
 * Monte Carlo Comprehensive UI & System Test - External Shell
 * Thorough testing of both backend functionality and UI display
 */

class MonteCarloComprehensiveTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = [];
    this.uiErrors = [];
    this.systemErrors = [];
    this.performanceMetrics = [];
  }

  async runComprehensiveTest() {
    console.log('\n🎯 MONTE CARLO COMPREHENSIVE SYSTEM TEST');
    console.log('=======================================');
    
    try {
      await this.step1_validateBackendEngine();
      await this.step2_testParameterValidation();
      await this.step3_testMultipleSymbols();
      await this.step4_validateResponseStructure();
      await this.step5_checkErrorHandling();
      await this.step6_performanceValidation();
      await this.step7_uiCompatibilityTest();
      await this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('Comprehensive test error:', error.message);
      this.systemErrors.push({
        component: 'Test Framework',
        error: error.message,
        severity: 'critical'
      });
    }
  }

  async step1_validateBackendEngine() {
    console.log('\n🔧 Step 1: Backend Engine Validation');
    
    const testSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'];
    const timeframes = ['1d', '4h', '1h'];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const symbol of testSymbols) {
      for (const timeframe of timeframes) {
        try {
          const startTime = Date.now();
          
          const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol, timeframe })
          });
          
          const responseTime = Date.now() - startTime;
          const result = await response.json();
          
          if (response.ok && result.success) {
            console.log(`✅ ${symbol} ${timeframe}: Backend operational (${responseTime}ms)`);
            
            // Validate response structure
            if (this.validateMonteCarloResponse(result)) {
              successCount++;
              
              this.performanceMetrics.push({
                symbol,
                timeframe,
                responseTime,
                var95: result.results.var95,
                sharpeRatio: result.results.sharpeRatio,
                maxDrawdown: result.results.maxDrawdown
              });
            } else {
              console.log(`⚠️ ${symbol} ${timeframe}: Invalid response structure`);
              errorCount++;
            }
          } else {
            console.log(`❌ ${symbol} ${timeframe}: ${result.error}`);
            errorCount++;
          }
          
          // Prevent overwhelming the API
          await this.sleep(100);
          
        } catch (error) {
          console.log(`❌ ${symbol} ${timeframe}: Request failed - ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`🎯 Backend Results: ${successCount} successes, ${errorCount} errors`);
    
    this.testResults.push({
      test: 'backend_engine',
      passed: successCount,
      failed: errorCount,
      successRate: ((successCount / (successCount + errorCount)) * 100).toFixed(1)
    });
  }

  async step2_testParameterValidation() {
    console.log('\n🛡️ Step 2: Parameter Validation Testing');
    
    const invalidCases = [
      { description: 'Empty object', payload: {}, shouldFail: true },
      { description: 'Missing symbol', payload: { timeframe: '1d' }, shouldFail: true },
      { description: 'Missing timeframe', payload: { symbol: 'BTC/USDT' }, shouldFail: false },
      { description: 'Empty symbol', payload: { symbol: '', timeframe: '1d' }, shouldFail: true },
      { description: 'Null symbol', payload: { symbol: null, timeframe: '1d' }, shouldFail: true },
      { description: 'Invalid symbol format', payload: { symbol: 'INVALID', timeframe: '1d' }, shouldFail: false },
      { description: 'Very long symbol', payload: { symbol: 'A'.repeat(1000), timeframe: '1d' }, shouldFail: false }
    ];
    
    let validationPassed = 0;
    let validationFailed = 0;
    
    for (const testCase of invalidCases) {
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.payload)
        });
        
        const result = await response.json();
        
        if (testCase.shouldFail) {
          if (response.status === 400 && result.error) {
            console.log(`✅ ${testCase.description}: Correctly rejected`);
            validationPassed++;
          } else {
            console.log(`❌ ${testCase.description}: Should have been rejected`);
            validationFailed++;
          }
        } else {
          if (response.ok || (response.status === 404 && result.error.includes('signal'))) {
            console.log(`✅ ${testCase.description}: Handled appropriately`);
            validationPassed++;
          } else {
            console.log(`❌ ${testCase.description}: Unexpected error`);
            validationFailed++;
          }
        }
        
      } catch (error) {
        console.log(`❌ ${testCase.description}: Request failed`);
        validationFailed++;
      }
    }
    
    console.log(`🎯 Validation Results: ${validationPassed} passed, ${validationFailed} failed`);
    
    this.testResults.push({
      test: 'parameter_validation',
      passed: validationPassed,
      failed: validationFailed,
      successRate: ((validationPassed / (validationPassed + validationFailed)) * 100).toFixed(1)
    });
  }

  async step3_testMultipleSymbols() {
    console.log('\n🔄 Step 3: Multiple Symbol Concurrent Testing');
    
    const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
    const timeframe = '1d';
    
    try {
      const startTime = Date.now();
      
      // Test concurrent requests
      const promises = symbols.map(symbol => 
        fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, timeframe })
        }).then(response => response.json())
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      let concurrentSuccesses = 0;
      results.forEach((result, index) => {
        if (result.success) {
          console.log(`✅ Concurrent ${symbols[index]}: Success`);
          concurrentSuccesses++;
        } else {
          console.log(`❌ Concurrent ${symbols[index]}: ${result.error}`);
        }
      });
      
      console.log(`🎯 Concurrent Processing: ${concurrentSuccesses}/${symbols.length} successful in ${totalTime}ms`);
      
      this.testResults.push({
        test: 'concurrent_processing',
        passed: concurrentSuccesses,
        failed: symbols.length - concurrentSuccesses,
        totalTime,
        avgTimePerRequest: (totalTime / symbols.length).toFixed(1)
      });
      
    } catch (error) {
      console.log(`❌ Concurrent testing failed: ${error.message}`);
    }
  }

  async step4_validateResponseStructure() {
    console.log('\n📋 Step 4: Response Structure Validation');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const requiredFields = [
          'success', 'symbol', 'timeframe', 'results', 'signalInput', 'timestamp'
        ];
        
        const requiredResultFields = [
          'var95', 'sharpeRatio', 'maxDrawdown', 'expectedReturn'
        ];
        
        const requiredSignalFields = [
          'entryPrice', 'stopLoss', 'takeProfit', 'confidence', 'direction'
        ];
        
        let structureValid = true;
        
        // Check top-level fields
        for (const field of requiredFields) {
          if (!(field in result)) {
            console.log(`❌ Missing field: ${field}`);
            structureValid = false;
          }
        }
        
        // Check results fields
        if (result.results) {
          for (const field of requiredResultFields) {
            if (!(field in result.results)) {
              console.log(`❌ Missing results field: ${field}`);
              structureValid = false;
            }
          }
        }
        
        // Check signal input fields
        if (result.signalInput) {
          for (const field of requiredSignalFields) {
            if (!(field in result.signalInput)) {
              console.log(`❌ Missing signalInput field: ${field}`);
              structureValid = false;
            }
          }
        }
        
        if (structureValid) {
          console.log('✅ Response structure: All required fields present');
          
          // Validate data types and ranges
          const dataValidation = this.validateDataTypes(result);
          if (dataValidation.valid) {
            console.log('✅ Data validation: All values within expected ranges');
          } else {
            console.log(`⚠️ Data validation issues: ${dataValidation.issues.join(', ')}`);
          }
        }
        
        this.testResults.push({
          test: 'response_structure',
          passed: structureValid ? 1 : 0,
          failed: structureValid ? 0 : 1,
          details: structureValid ? 'All fields present' : 'Missing required fields'
        });
        
      } else {
        console.log('❌ Could not validate structure: API returned error');
      }
      
    } catch (error) {
      console.log(`❌ Structure validation failed: ${error.message}`);
    }
  }

  async step5_checkErrorHandling() {
    console.log('\n🚨 Step 5: Error Handling Validation');
    
    const errorScenarios = [
      { name: 'Non-existent symbol', payload: { symbol: 'NONEXISTENT/USDT', timeframe: '1d' } },
      { name: 'Invalid timeframe', payload: { symbol: 'BTC/USDT', timeframe: 'invalid' } },
      { name: 'Malformed JSON', endpoint: '/api/monte-carlo-risk', method: 'POST', body: '{invalid json}' }
    ];
    
    let errorHandlingPassed = 0;
    
    for (const scenario of errorScenarios) {
      try {
        const options = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        };
        
        if (scenario.body) {
          options.body = scenario.body;
        } else {
          options.body = JSON.stringify(scenario.payload);
        }
        
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, options);
        const result = await response.json();
        
        if (!response.ok && result.error) {
          console.log(`✅ ${scenario.name}: Error handled gracefully`);
          errorHandlingPassed++;
        } else {
          console.log(`⚠️ ${scenario.name}: Unexpected response`);
        }
        
      } catch (error) {
        if (scenario.name === 'Malformed JSON') {
          console.log(`✅ ${scenario.name}: JSON error handled`);
          errorHandlingPassed++;
        } else {
          console.log(`❌ ${scenario.name}: Unhandled error`);
        }
      }
    }
    
    console.log(`🎯 Error Handling: ${errorHandlingPassed}/${errorScenarios.length} scenarios handled correctly`);
    
    this.testResults.push({
      test: 'error_handling',
      passed: errorHandlingPassed,
      failed: errorScenarios.length - errorHandlingPassed,
      successRate: ((errorHandlingPassed / errorScenarios.length) * 100).toFixed(1)
    });
  }

  async step6_performanceValidation() {
    console.log('\n⚡ Step 6: Performance Validation');
    
    if (this.performanceMetrics.length > 0) {
      const responseTimes = this.performanceMetrics.map(m => m.responseTime);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      
      console.log(`📊 Performance Metrics:`);
      console.log(`   Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
      console.log(`   Max Response Time: ${maxResponseTime}ms`);
      console.log(`   Min Response Time: ${minResponseTime}ms`);
      
      // Performance thresholds
      const avgThreshold = 2000; // 2 seconds
      const maxThreshold = 5000; // 5 seconds
      
      let performanceScore = 0;
      if (avgResponseTime < avgThreshold) performanceScore += 50;
      if (maxResponseTime < maxThreshold) performanceScore += 50;
      
      console.log(`🎯 Performance Score: ${performanceScore}/100`);
      
      this.testResults.push({
        test: 'performance',
        score: performanceScore,
        avgResponseTime: avgResponseTime.toFixed(1),
        maxResponseTime,
        metrics: this.performanceMetrics.length
      });
    } else {
      console.log('⚠️ No performance metrics available');
    }
  }

  async step7_uiCompatibilityTest() {
    console.log('\n🖥️ Step 7: UI Compatibility Test');
    
    // Test response format compatibility with frontend expectations
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Check if response matches expected frontend interface
        const uiCompatibility = this.checkUICompatibility(result);
        
        if (uiCompatibility.compatible) {
          console.log('✅ UI Compatibility: Response format matches frontend expectations');
        } else {
          console.log(`⚠️ UI Compatibility Issues: ${uiCompatibility.issues.join(', ')}`);
          this.uiErrors.push(...uiCompatibility.issues);
        }
        
        this.testResults.push({
          test: 'ui_compatibility',
          passed: uiCompatibility.compatible ? 1 : 0,
          failed: uiCompatibility.compatible ? 0 : 1,
          issues: uiCompatibility.issues
        });
      }
      
    } catch (error) {
      console.log(`❌ UI compatibility test failed: ${error.message}`);
      this.uiErrors.push(error.message);
    }
  }

  validateMonteCarloResponse(result) {
    return result.success && 
           result.results && 
           typeof result.results.var95 === 'number' &&
           typeof result.results.sharpeRatio === 'number' &&
           typeof result.results.maxDrawdown === 'number';
  }

  validateDataTypes(result) {
    const issues = [];
    
    // Check VaR95 (should be negative for losses)
    if (result.results.var95 > 0) {
      issues.push('VaR95 should typically be negative');
    }
    
    // Check Sharpe ratio (reasonable range: -3 to 5)
    if (result.results.sharpeRatio < -3 || result.results.sharpeRatio > 5) {
      issues.push('Sharpe ratio outside reasonable range');
    }
    
    // Check max drawdown (should be positive percentage)
    if (result.results.maxDrawdown < 0 || result.results.maxDrawdown > 1) {
      issues.push('Max drawdown should be between 0 and 1');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  checkUICompatibility(result) {
    const issues = [];
    
    // Check if all UI-expected fields are present and correctly typed
    if (!result.symbol || typeof result.symbol !== 'string') {
      issues.push('Symbol field missing or wrong type');
    }
    
    if (!result.timeframe || typeof result.timeframe !== 'string') {
      issues.push('Timeframe field missing or wrong type');
    }
    
    if (!result.timestamp || typeof result.timestamp !== 'string') {
      issues.push('Timestamp field missing or wrong type');
    }
    
    // Check results structure
    if (!result.results) {
      issues.push('Results object missing');
    } else {
      const requiredNumericFields = ['var95', 'sharpeRatio', 'maxDrawdown', 'expectedReturn'];
      for (const field of requiredNumericFields) {
        if (typeof result.results[field] !== 'number') {
          issues.push(`Results.${field} should be numeric`);
        }
      }
    }
    
    // Check signal input structure
    if (!result.signalInput) {
      issues.push('SignalInput object missing');
    } else {
      const requiredFields = ['entryPrice', 'stopLoss', 'takeProfit', 'confidence'];
      for (const field of requiredFields) {
        if (typeof result.signalInput[field] !== 'number') {
          issues.push(`SignalInput.${field} should be numeric`);
        }
      }
      
      if (!['LONG', 'SHORT', 'NEUTRAL'].includes(result.signalInput.direction)) {
        issues.push('SignalInput.direction should be LONG/SHORT/NEUTRAL');
      }
    }
    
    return {
      compatible: issues.length === 0,
      issues
    };
  }

  async generateComprehensiveReport() {
    console.log('\n📋 MONTE CARLO COMPREHENSIVE TEST REPORT');
    console.log('========================================');
    
    console.log('\n✅ TEST RESULTS SUMMARY:');
    this.testResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.test.toUpperCase()}:`);
      if (result.successRate !== undefined) {
        console.log(`      Success Rate: ${result.successRate}%`);
        console.log(`      Passed: ${result.passed}, Failed: ${result.failed}`);
      } else if (result.score !== undefined) {
        console.log(`      Score: ${result.score}/100`);
      } else {
        console.log(`      Status: ${result.passed > 0 ? 'PASS' : 'FAIL'}`);
      }
    });
    
    if (this.uiErrors.length > 0) {
      console.log('\n⚠️ UI COMPATIBILITY ISSUES:');
      this.uiErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (this.systemErrors.length > 0) {
      console.log('\n❌ SYSTEM ERRORS:');
      this.systemErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.component}: ${error.error}`);
      });
    }
    
    // Calculate overall system health
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => 
      (r.successRate && parseFloat(r.successRate) >= 80) || 
      (r.score && r.score >= 70) ||
      (r.passed && r.passed > 0)
    ).length;
    
    const systemHealth = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log(`   System Health: ${systemHealth}%`);
    console.log(`   Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`   UI Errors: ${this.uiErrors.length}`);
    console.log(`   System Errors: ${this.systemErrors.length}`);
    
    if (systemHealth >= 90 && this.uiErrors.length === 0) {
      console.log('   Status: MONTE CARLO FULLY OPERATIONAL');
      console.log('   Recommendation: DEPLOY TO PRODUCTION');
    } else if (systemHealth >= 70) {
      console.log('   Status: MONTE CARLO MOSTLY FUNCTIONAL');
      console.log('   Recommendation: DEPLOY WITH MONITORING');
    } else {
      console.log('   Status: MONTE CARLO NEEDS ATTENTION');
      console.log('   Recommendation: FIX ISSUES BEFORE DEPLOYMENT');
    }
    
    return {
      systemHealth: parseFloat(systemHealth),
      recommendation: systemHealth >= 90 && this.uiErrors.length === 0 ? 'deploy' : 
                     systemHealth >= 70 ? 'monitor' : 'fix'
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive test
async function main() {
  const test = new MonteCarloComprehensiveTest();
  const result = await test.runComprehensiveTest();
  
  process.exit(result.recommendation === 'deploy' ? 0 : 1);
}

main().catch(console.error);