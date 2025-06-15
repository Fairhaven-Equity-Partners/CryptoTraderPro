/**
 * System Perfection Analysis - Path to 100% Health
 * Identifies and addresses all issues preventing perfect system validation
 */

class SystemPerfectionAnalyzer {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issuesFound = [];
    this.fixesPlan = [];
    this.currentHealth = 0;
    this.targetHealth = 95; // Near 100%
  }

  async analyzeForPerfection() {
    console.log('\n🎯 SYSTEM PERFECTION ANALYSIS');
    console.log('============================');
    console.log('Target: Near 100% system health');
    
    await this.step1_identifyEndpointIssues();
    await this.step2_analyzeErrorHandling();
    await this.step3_validateMonteCarloEdgeCases();
    await this.step4_assessPerformanceIssues();
    await this.step5_createFixPlan();
    
    return this.generatePerfectionRoadmap();
  }

  async step1_identifyEndpointIssues() {
    console.log('\n🔍 Step 1: Endpoint Health Analysis');
    
    const criticalEndpoints = [
      '/api/crypto/BTC/USDT',
      '/api/signals/BTC/USDT', 
      '/api/performance-metrics',
      '/api/technical-analysis/BTC/USDT',
      '/api/pattern-analysis/BTC/USDT',
      '/api/confluence-analysis/BTC/USDT',
      '/api/monte-carlo-risk',
      '/api/enhanced-pattern-recognition/BTC/USDT'
    ];
    
    let healthyCount = 0;
    let totalTests = 0;
    
    for (const endpoint of criticalEndpoints) {
      try {
        const testUrl = endpoint === '/api/monte-carlo-risk' 
          ? `${this.baseUrl}${endpoint}` 
          : `${this.baseUrl}${endpoint}`;
          
        let response;
        if (endpoint === '/api/monte-carlo-risk') {
          response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
          });
        } else {
          response = await fetch(testUrl);
        }
        
        totalTests++;
        
        if (response.ok) {
          const data = await response.json();
          const hasValidData = this.validateEndpointData(endpoint, data);
          
          if (hasValidData) {
            console.log(`✅ ${endpoint}: Healthy with valid data`);
            healthyCount++;
          } else {
            console.log(`⚠️ ${endpoint}: Responds but data structure issues`);
            this.issuesFound.push({
              type: 'data_structure',
              endpoint,
              severity: 'medium',
              description: 'Endpoint responds but data structure needs validation'
            });
          }
        } else {
          console.log(`❌ ${endpoint}: Status ${response.status}`);
          this.issuesFound.push({
            type: 'endpoint_failure',
            endpoint,
            severity: 'high',
            statusCode: response.status,
            description: `Endpoint failing with status ${response.status}`
          });
        }
        
        await this.sleep(200);
        
      } catch (error) {
        console.log(`❌ ${endpoint}: Connection failed - ${error.message}`);
        this.issuesFound.push({
          type: 'connection_failure',
          endpoint,
          severity: 'critical',
          error: error.message,
          description: 'Cannot connect to endpoint'
        });
        totalTests++;
      }
    }
    
    const endpointHealth = (healthyCount / totalTests) * 100;
    console.log(`🎯 Endpoint Health: ${endpointHealth.toFixed(1)}% (${healthyCount}/${totalTests})`);
    
    if (endpointHealth < 90) {
      this.issuesFound.push({
        type: 'overall_endpoint_health',
        severity: 'critical',
        description: `Endpoint health at ${endpointHealth.toFixed(1)}%, need 90%+ for production`
      });
    }
  }

  async step2_analyzeErrorHandling() {
    console.log('\n🚨 Step 2: Error Handling Perfection Analysis');
    
    const errorTests = [
      {
        name: 'Invalid Symbol - Should 404',
        test: () => fetch(`${this.baseUrl}/api/signals/INVALID_SYMBOL`),
        expectedStatus: [404, 400],
        expectedErrorField: true
      },
      {
        name: 'Empty Monte Carlo Request - Should 400',
        test: () => fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }),
        expectedStatus: [400],
        expectedErrorField: true
      },
      {
        name: 'Missing Parameters - Should 400',
        test: () => fetch(`${this.baseUrl}/api/technical-analysis/`),
        expectedStatus: [404, 400],
        expectedErrorField: true
      },
      {
        name: 'Non-existent Endpoint - Should 404',
        test: () => fetch(`${this.baseUrl}/api/nonexistent-endpoint`),
        expectedStatus: [404],
        expectedErrorField: true
      }
    ];
    
    let errorHandlingScore = 0;
    const maxScore = errorTests.length * 25;
    
    for (const errorTest of errorTests) {
      try {
        const response = await errorTest.test();
        const isExpectedStatus = errorTest.expectedStatus.includes(response.status);
        
        if (isExpectedStatus) {
          try {
            const data = await response.json();
            const hasErrorField = data.error || data.message;
            
            if (hasErrorField) {
              console.log(`✅ ${errorTest.name}: Perfect error handling`);
              errorHandlingScore += 25;
            } else {
              console.log(`⚠️ ${errorTest.name}: Correct status but missing error details`);
              errorHandlingScore += 15;
              this.issuesFound.push({
                type: 'error_response_format',
                test: errorTest.name,
                severity: 'medium',
                description: 'Error responses should include error field with details'
              });
            }
          } catch (parseError) {
            console.log(`⚠️ ${errorTest.name}: Correct status but non-JSON response`);
            errorHandlingScore += 10;
            this.issuesFound.push({
              type: 'error_response_format',
              test: errorTest.name,
              severity: 'medium',
              description: 'Error responses should be valid JSON'
            });
          }
        } else {
          console.log(`❌ ${errorTest.name}: Wrong status ${response.status}, expected ${errorTest.expectedStatus}`);
          this.issuesFound.push({
            type: 'incorrect_error_status',
            test: errorTest.name,
            severity: 'high',
            actualStatus: response.status,
            expectedStatus: errorTest.expectedStatus,
            description: 'Endpoint not returning appropriate error status codes'
          });
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`❌ ${errorTest.name}: Test failed - ${error.message}`);
        this.issuesFound.push({
          type: 'error_test_failure',
          test: errorTest.name,
          severity: 'high',
          error: error.message,
          description: 'Error handling test could not complete'
        });
      }
    }
    
    const errorHandlingPercent = (errorHandlingScore / maxScore) * 100;
    console.log(`🛡️ Error Handling: ${errorHandlingPercent.toFixed(1)}% (${errorHandlingScore}/${maxScore})`);
    
    if (errorHandlingPercent < 90) {
      this.issuesFound.push({
        type: 'error_handling_insufficient',
        severity: 'high',
        score: errorHandlingPercent,
        description: 'Error handling below 90% threshold for production'
      });
    }
  }

  async step3_validateMonteCarloEdgeCases() {
    console.log('\n🎲 Step 3: Monte Carlo Edge Case Validation');
    
    const edgeCases = [
      { symbol: '', timeframe: '1d', description: 'Empty symbol' },
      { symbol: 'BTC/USDT', timeframe: '', description: 'Empty timeframe' },
      { symbol: null, timeframe: '1d', description: 'Null symbol' },
      { symbol: 'BTC/USDT', timeframe: null, description: 'Null timeframe' },
      { symbol: 'A'.repeat(1000), timeframe: '1d', description: 'Very long symbol' },
      { symbol: 'BTC/USDT', timeframe: 'invalid', description: 'Invalid timeframe' },
      { symbol: 'NONEXISTENT/USDT', timeframe: '1d', description: 'Non-existent pair' }
    ];
    
    let perfectCases = 0;
    
    for (const testCase of edgeCases) {
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: testCase.symbol,
            timeframe: testCase.timeframe
          })
        });
        
        const shouldFail = !testCase.symbol || !testCase.timeframe || 
                          testCase.symbol === null || testCase.timeframe === null ||
                          testCase.symbol.trim() === '' || testCase.timeframe.trim() === '';
        
        if (shouldFail) {
          if (response.status === 400) {
            const data = await response.json();
            if (data.error) {
              console.log(`✅ ${testCase.description}: Correctly rejected with error`);
              perfectCases++;
            } else {
              console.log(`⚠️ ${testCase.description}: Rejected but no error message`);
              this.issuesFound.push({
                type: 'monte_carlo_error_message',
                case: testCase.description,
                severity: 'medium',
                description: 'Monte Carlo should provide error messages for invalid inputs'
              });
            }
          } else {
            console.log(`❌ ${testCase.description}: Should be rejected but got ${response.status}`);
            this.issuesFound.push({
              type: 'monte_carlo_validation',
              case: testCase.description,
              severity: 'high',
              actualStatus: response.status,
              description: 'Monte Carlo not properly validating inputs'
            });
          }
        } else {
          // Cases that should work or fail gracefully
          if (response.ok) {
            const data = await response.json();
            if (data.success && this.validateMonteCarloResponse(data)) {
              console.log(`✅ ${testCase.description}: Handled correctly`);
              perfectCases++;
            } else {
              console.log(`⚠️ ${testCase.description}: Response structure issues`);
              this.issuesFound.push({
                type: 'monte_carlo_response_structure',
                case: testCase.description,
                severity: 'medium',
                description: 'Monte Carlo response structure inconsistent'
              });
            }
          } else {
            // Graceful failure is acceptable for non-existent pairs
            if (response.status === 404) {
              console.log(`✅ ${testCase.description}: Gracefully handled as 404`);
              perfectCases++;
            } else {
              console.log(`⚠️ ${testCase.description}: Unexpected status ${response.status}`);
            }
          }
        }
        
        await this.sleep(150);
        
      } catch (error) {
        console.log(`❌ ${testCase.description}: Test failed - ${error.message}`);
        this.issuesFound.push({
          type: 'monte_carlo_test_failure',
          case: testCase.description,
          severity: 'high',
          error: error.message,
          description: 'Monte Carlo edge case test could not complete'
        });
      }
    }
    
    const monteCarloReliability = (perfectCases / edgeCases.length) * 100;
    console.log(`🎯 Monte Carlo Edge Cases: ${monteCarloReliability.toFixed(1)}% (${perfectCases}/${edgeCases.length})`);
    
    if (monteCarloReliability < 90) {
      this.issuesFound.push({
        type: 'monte_carlo_reliability',
        severity: 'high',
        reliability: monteCarloReliability,
        description: 'Monte Carlo edge case handling below 90% threshold'
      });
    }
  }

  async step4_assessPerformanceIssues() {
    console.log('\n⚡ Step 4: Performance Issues Assessment');
    
    const performanceTests = [
      { name: 'Signal Generation', endpoint: '/api/signals/BTC/USDT', maxTime: 100 },
      { name: 'Performance Metrics', endpoint: '/api/performance-metrics', maxTime: 50 },
      { name: 'Crypto Data', endpoint: '/api/crypto/BTC/USDT', maxTime: 200 },
      { name: 'Monte Carlo', endpoint: '/api/monte-carlo-risk', method: 'POST', maxTime: 1000 }
    ];
    
    let performanceScore = 0;
    const maxPerformanceScore = performanceTests.length * 25;
    
    for (const test of performanceTests) {
      try {
        let totalTime = 0;
        const iterations = 3;
        
        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
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
          
          const responseTime = Date.now() - startTime;
          totalTime += responseTime;
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          await this.sleep(100);
        }
        
        const avgTime = totalTime / iterations;
        
        if (avgTime <= test.maxTime) {
          console.log(`✅ ${test.name}: ${avgTime.toFixed(1)}ms (under ${test.maxTime}ms)`);
          performanceScore += 25;
        } else if (avgTime <= test.maxTime * 2) {
          console.log(`⚠️ ${test.name}: ${avgTime.toFixed(1)}ms (slow but acceptable)`);
          performanceScore += 15;
          this.issuesFound.push({
            type: 'performance_slow',
            test: test.name,
            severity: 'medium',
            actualTime: avgTime,
            maxTime: test.maxTime,
            description: `${test.name} response time ${avgTime.toFixed(1)}ms exceeds optimal ${test.maxTime}ms`
          });
        } else {
          console.log(`❌ ${test.name}: ${avgTime.toFixed(1)}ms (too slow)`);
          this.issuesFound.push({
            type: 'performance_critical',
            test: test.name,
            severity: 'high',
            actualTime: avgTime,
            maxTime: test.maxTime,
            description: `${test.name} response time ${avgTime.toFixed(1)}ms critically exceeds ${test.maxTime}ms`
          });
        }
        
      } catch (error) {
        console.log(`❌ ${test.name}: Performance test failed - ${error.message}`);
        this.issuesFound.push({
          type: 'performance_test_failure',
          test: test.name,
          severity: 'high',
          error: error.message,
          description: 'Performance test could not complete'
        });
      }
    }
    
    const performancePercent = (performanceScore / maxPerformanceScore) * 100;
    console.log(`⚡ Performance Score: ${performancePercent.toFixed(1)}% (${performanceScore}/${maxPerformanceScore})`);
    
    if (performancePercent < 90) {
      this.issuesFound.push({
        type: 'overall_performance',
        severity: 'high',
        score: performancePercent,
        description: 'Overall performance below 90% threshold for production'
      });
    }
  }

  async step5_createFixPlan() {
    console.log('\n🔧 Step 5: Creating Fix Plan');
    
    // Group issues by type and severity
    const criticalIssues = this.issuesFound.filter(i => i.severity === 'critical');
    const highIssues = this.issuesFound.filter(i => i.severity === 'high');
    const mediumIssues = this.issuesFound.filter(i => i.severity === 'medium');
    
    console.log(`📊 Issues Found: ${criticalIssues.length} critical, ${highIssues.length} high, ${mediumIssues.length} medium`);
    
    // Create specific fixes for each issue type
    const issueTypes = [...new Set(this.issuesFound.map(i => i.type))];
    
    for (const issueType of issueTypes) {
      const issues = this.issuesFound.filter(i => i.type === issueType);
      const severity = Math.max(...issues.map(i => 
        i.severity === 'critical' ? 3 : i.severity === 'high' ? 2 : 1
      ));
      
      this.fixesPlan.push({
        issueType,
        count: issues.length,
        severity: severity === 3 ? 'critical' : severity === 2 ? 'high' : 'medium',
        fix: this.generateFixForIssueType(issueType, issues),
        priority: severity === 3 ? 1 : severity === 2 ? 2 : 3
      });
    }
    
    // Sort by priority
    this.fixesPlan.sort((a, b) => a.priority - b.priority);
    
    console.log('\n🎯 Fix Plan (by priority):');
    this.fixesPlan.forEach((fix, index) => {
      console.log(`   ${index + 1}. [${fix.severity.toUpperCase()}] ${fix.issueType} (${fix.count} issues)`);
      console.log(`      Fix: ${fix.fix}`);
    });
  }

  generateFixForIssueType(issueType, issues) {
    switch (issueType) {
      case 'endpoint_failure':
        return 'Check endpoint routing and ensure all endpoints are properly registered';
      case 'connection_failure':
        return 'Investigate server connectivity and ensure all services are running';
      case 'data_structure':
        return 'Validate and standardize API response structures across endpoints';
      case 'error_response_format':
        return 'Implement consistent error response format with error field and descriptive messages';
      case 'incorrect_error_status':
        return 'Review and correct HTTP status codes for error conditions';
      case 'monte_carlo_validation':
        return 'Enhance Monte Carlo input validation and error handling';
      case 'monte_carlo_response_structure':
        return 'Standardize Monte Carlo response structure and validation';
      case 'performance_critical':
        return 'Optimize slow endpoints through caching, query optimization, or async processing';
      case 'performance_slow':
        return 'Improve response times through performance optimization';
      case 'overall_endpoint_health':
        return 'Address all endpoint failures to achieve 90%+ health';
      case 'error_handling_insufficient':
        return 'Implement comprehensive error handling across all endpoints';
      case 'monte_carlo_reliability':
        return 'Enhance Monte Carlo edge case handling and validation';
      case 'overall_performance':
        return 'Optimize system performance to achieve 90%+ performance score';
      default:
        return 'Investigate and resolve specific issue type';
    }
  }

  validateEndpointData(endpoint, data) {
    try {
      switch (endpoint) {
        case '/api/crypto/BTC/USDT':
          return data.symbol && data.lastPrice !== undefined;
        case '/api/signals/BTC/USDT':
          return Array.isArray(data) && (data.length === 0 || data[0].symbol);
        case '/api/performance-metrics':
          return data.indicators && Array.isArray(data.indicators);
        case '/api/technical-analysis/BTC/USDT':
          return data.success !== undefined;
        case '/api/pattern-analysis/BTC/USDT':
          return data.success !== undefined;
        case '/api/confluence-analysis/BTC/USDT':
          return data.success !== undefined;
        case '/api/monte-carlo-risk':
          return this.validateMonteCarloResponse(data);
        case '/api/enhanced-pattern-recognition/BTC/USDT':
          return data !== null && typeof data === 'object';
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }

  validateMonteCarloResponse(result) {
    return result && result.success && 
           result.results && 
           typeof result.results.var95 === 'number' &&
           typeof result.results.sharpeRatio === 'number' &&
           typeof result.results.maxDrawdown === 'number' &&
           result.signalInput &&
           typeof result.signalInput.entryPrice === 'number';
  }

  generatePerfectionRoadmap() {
    console.log('\n📋 SYSTEM PERFECTION ROADMAP');
    console.log('===========================');
    
    const totalIssues = this.issuesFound.length;
    const criticalCount = this.issuesFound.filter(i => i.severity === 'critical').length;
    const highCount = this.issuesFound.filter(i => i.severity === 'high').length;
    
    console.log(`📊 Current Status: ${totalIssues} issues preventing 100% health`);
    console.log(`   Critical: ${criticalCount}, High: ${highCount}, Medium: ${totalIssues - criticalCount - highCount}`);
    
    if (totalIssues === 0) {
      console.log('🎯 SYSTEM READY: Near 100% health achieved');
      return { ready: true, healthScore: 100, issues: [] };
    }
    
    console.log('\n🔧 FIXES REQUIRED FOR 100% HEALTH:');
    this.fixesPlan.forEach((fix, index) => {
      console.log(`   ${index + 1}. ${fix.fix}`);
    });
    
    console.log('\n📋 IMPLEMENTATION ORDER:');
    console.log('   1. Fix all critical issues first');
    console.log('   2. Address high-priority issues');
    console.log('   3. Resolve medium-priority issues');
    console.log('   4. Re-run comprehensive validation');
    console.log('   5. Achieve 95%+ health score');
    
    const estimatedHealthAfterFixes = Math.max(0, 100 - (criticalCount * 15) - (highCount * 8) - ((totalIssues - criticalCount - highCount) * 3));
    
    console.log(`\n🎯 PROJECTED HEALTH AFTER FIXES: ${estimatedHealthAfterFixes}%`);
    
    return {
      ready: false,
      currentIssues: totalIssues,
      fixes: this.fixesPlan,
      projectedHealth: estimatedHealthAfterFixes,
      readyForChanges: estimatedHealthAfterFixes >= 95
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute perfection analysis
async function main() {
  const analyzer = new SystemPerfectionAnalyzer();
  const roadmap = await analyzer.analyzeForPerfection();
  
  console.log('\n🏁 PERFECTION ANALYSIS COMPLETE');
  console.log(`Ready for changes: ${roadmap.readyForChanges}`);
  
  process.exit(roadmap.readyForChanges ? 0 : 1);
}

main().catch(console.error);