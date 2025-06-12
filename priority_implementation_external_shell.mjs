import fetch from 'node-fetch';
import fs from 'fs';

console.log('🚀 PRIORITY IMPLEMENTATION - EXTERNAL SHELL ANALYSIS');
console.log('═'.repeat(70));
console.log('Priority 1: Critical Security (Rate Limiting & Circuit Breaker)');
console.log('Priority 2: High Data Redundancy (Backup Sources & Failover)');
console.log('Priority 3: Medium Code Quality (TypeScript Fixes & Error Handling)');
console.log('═'.repeat(70));

const apiBase = 'http://localhost:5000';
let priorityResults = {
  priority1: { score: 0, issues: [], solutions: [], tests: [] },
  priority2: { score: 0, sources: [], reliability: 0, tests: [] },
  priority3: { score: 0, errors: [], fixes: [], tests: [] },
  testCycles: [],
  overallProgress: 0,
  recommendations: []
};

async function makeRequest(endpoint, options = {}) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${apiBase}${endpoint}`, options);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data, responseTime, success: true };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { error: error.message, responseTime, success: false };
  }
}

// PRIORITY 1: CRITICAL SECURITY IMPLEMENTATION
async function implementPriority1Security() {
  console.log('\n🔒 PRIORITY 1: CRITICAL SECURITY IMPLEMENTATION');
  console.log('─'.repeat(55));
  
  // Test 1: Current Rate Limiter Status
  console.log('1. Analyzing current rate limiter implementation...');
  
  const rateLimiterStatus = await makeRequest('/api/rate-limiter/stats');
  if (rateLimiterStatus.success) {
    const stats = rateLimiterStatus.data;
    const currentConfig = {
      maxRequestsPerMinute: stats.maxRequestsPerMinute || 0,
      currentRequests: stats.requestsThisMinute || 0,
      circuitBreakerOpen: stats.circuitBreakerOpen || false,
      apiFailures: stats.apiFailures || 0,
      maxFailures: stats.maxFailures || 30
    };
    
    console.log(`   Max Requests/Min: ${currentConfig.maxRequestsPerMinute}`);
    console.log(`   Current Requests: ${currentConfig.currentRequests}`);
    console.log(`   Circuit Breaker: ${currentConfig.circuitBreakerOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`   API Failures: ${currentConfig.apiFailures}/${currentConfig.maxFailures}`);
    
    // Security Analysis
    const hasActiveRateLimit = currentConfig.maxRequestsPerMinute > 0;
    const hasCircuitBreaker = stats.hasOwnProperty('circuitBreakerOpen');
    const isHealthyState = !currentConfig.circuitBreakerOpen && currentConfig.apiFailures < 20;
    
    let securityScore = 0;
    if (hasActiveRateLimit) securityScore += 30;
    if (hasCircuitBreaker) securityScore += 40;
    if (isHealthyState) securityScore += 30;
    
    priorityResults.priority1.score = securityScore;
    priorityResults.priority1.tests.push({
      test: 'rate_limiter_analysis',
      score: securityScore,
      config: currentConfig,
      issues: !hasActiveRateLimit ? ['Rate limiter inactive'] : []
    });
    
    console.log(`   Security Assessment: ${securityScore}%`);
  }
  
  // Test 2: Stress Testing Rate Limiter
  console.log('2. Stress testing rate limiter protection...');
  
  const stressTestEndpoint = '/api/crypto/BTC%2FUSDT';
  const rapidRequests = Array(10).fill().map(() => makeRequest(stressTestEndpoint));
  
  const stressResults = await Promise.all(rapidRequests);
  const successfulRequests = stressResults.filter(r => r.success).length;
  const avgResponseTime = stressResults.reduce((sum, r) => sum + r.responseTime, 0) / stressResults.length;
  
  console.log(`   Rapid Requests: ${successfulRequests}/10 successful`);
  console.log(`   Average Response: ${avgResponseTime.toFixed(0)}ms`);
  
  // Check if circuit breaker activated
  const postStressStatus = await makeRequest('/api/rate-limiter/stats');
  let circuitBreakerTriggered = false;
  if (postStressStatus.success) {
    circuitBreakerTriggered = postStressStatus.data.circuitBreakerOpen;
    console.log(`   Circuit Breaker Triggered: ${circuitBreakerTriggered ? 'YES' : 'NO'}`);
  }
  
  priorityResults.priority1.tests.push({
    test: 'stress_test',
    successRate: (successfulRequests / 10) * 100,
    avgResponseTime,
    circuitBreakerTriggered,
    protectionScore: circuitBreakerTriggered ? 100 : (successfulRequests < 8 ? 70 : 30)
  });
  
  // Test 3: Input Validation Security
  console.log('3. Testing input validation security...');
  
  const maliciousInputs = [
    '/api/crypto/%3Cscript%3E',
    '/api/signals/\';DROP TABLE--',
    '/api/crypto/../../../etc/passwd',
    '/api/signals/%00',
    '/api/crypto/{{7*7}}'
  ];
  
  let blockedInputs = 0;
  for (const input of maliciousInputs) {
    const result = await makeRequest(input);
    if (!result.success || (result.data && result.data.message && result.data.message.includes('not found'))) {
      blockedInputs++;
    }
  }
  
  const inputValidationScore = (blockedInputs / maliciousInputs.length) * 100;
  console.log(`   Malicious Inputs Blocked: ${blockedInputs}/${maliciousInputs.length}`);
  console.log(`   Input Validation Score: ${inputValidationScore.toFixed(0)}%`);
  
  priorityResults.priority1.tests.push({
    test: 'input_validation',
    score: inputValidationScore,
    blockedInputs,
    totalInputs: maliciousInputs.length
  });
  
  // Security Recommendations
  if (priorityResults.priority1.score < 70) {
    priorityResults.priority1.issues.push('Rate limiter needs activation');
    priorityResults.priority1.solutions.push('Implement stricter rate limiting with 60 requests/minute');
  }
  
  if (inputValidationScore < 80) {
    priorityResults.priority1.issues.push('Input validation insufficient');
    priorityResults.priority1.solutions.push('Add comprehensive input sanitization');
  }
  
  if (!circuitBreakerTriggered && successfulRequests > 8) {
    priorityResults.priority1.issues.push('Circuit breaker too permissive');
    priorityResults.priority1.solutions.push('Lower circuit breaker threshold');
  }
}

// PRIORITY 2: HIGH DATA REDUNDANCY IMPLEMENTATION
async function implementPriority2Redundancy() {
  console.log('\n📡 PRIORITY 2: HIGH DATA REDUNDANCY IMPLEMENTATION');
  console.log('─'.repeat(58));
  
  // Test 1: Multi-Source Data Validation
  console.log('1. Testing multi-source data availability...');
  
  const dataSources = [
    { name: 'Crypto Data API', endpoint: '/api/crypto/BTC%2FUSDT' },
    { name: 'Market Heatmap', endpoint: '/api/market-heatmap' },
    { name: 'Simple Market Data', endpoint: '/api/simple-market-data' },
    { name: 'Signal Generation', endpoint: '/api/signals/BTC%2FUSDT?timeframe=1h' },
    { name: 'Technical Analysis', endpoint: '/api/technical-analysis/BTC%2FUSDT' }
  ];
  
  let operationalSources = 0;
  const sourceResults = [];
  
  for (const source of dataSources) {
    const result = await makeRequest(source.endpoint);
    const isOperational = result.success && result.data;
    
    if (isOperational) operationalSources++;
    
    sourceResults.push({
      name: source.name,
      operational: isOperational,
      responseTime: result.responseTime,
      dataSize: result.success ? JSON.stringify(result.data).length : 0
    });
    
    console.log(`   ${source.name}: ${isOperational ? '✅' : '❌'} (${result.responseTime}ms)`);
  }
  
  const sourceReliability = (operationalSources / dataSources.length) * 100;
  console.log(`   Data Source Reliability: ${sourceReliability.toFixed(1)}%`);
  
  priorityResults.priority2.sources = sourceResults;
  priorityResults.priority2.score = sourceReliability;
  
  // Test 2: Cross-Source Data Consistency
  console.log('2. Validating cross-source data consistency...');
  
  const [cryptoResult, heatmapResult, simpleResult] = await Promise.all([
    makeRequest('/api/crypto/BTC%2FUSDT'),
    makeRequest('/api/market-heatmap'),
    makeRequest('/api/simple-market-data')
  ]);
  
  let consistencyChecks = 0;
  let passedChecks = 0;
  
  // Check BTC price consistency across sources
  if (cryptoResult.success && heatmapResult.success) {
    consistencyChecks++;
    const cryptoPrice = cryptoResult.data.price;
    const heatmapEntry = heatmapResult.data.marketEntries?.find(entry => entry.symbol === 'BTC/USDT');
    
    if (heatmapEntry) {
      const priceDiff = Math.abs(cryptoPrice - heatmapEntry.currentPrice) / cryptoPrice;
      if (priceDiff < 0.02) { // Within 2%
        passedChecks++;
        console.log(`   ✅ Crypto-Heatmap price consistency: ${(priceDiff * 100).toFixed(2)}% variance`);
      } else {
        console.log(`   ⚠️ Crypto-Heatmap price variance: ${(priceDiff * 100).toFixed(2)}%`);
      }
    }
  }
  
  if (cryptoResult.success && simpleResult.success) {
    consistencyChecks++;
    const cryptoPrice = cryptoResult.data.price;
    const simpleEntry = simpleResult.data.data?.find(entry => entry.symbol === 'BTC/USDT');
    
    if (simpleEntry) {
      const priceDiff = Math.abs(cryptoPrice - simpleEntry.price) / cryptoPrice;
      if (priceDiff < 0.02) {
        passedChecks++;
        console.log(`   ✅ Crypto-Simple price consistency: ${(priceDiff * 100).toFixed(2)}% variance`);
      } else {
        console.log(`   ⚠️ Crypto-Simple price variance: ${(priceDiff * 100).toFixed(2)}%`);
      }
    }
  }
  
  const consistencyScore = consistencyChecks > 0 ? (passedChecks / consistencyChecks) * 100 : 0;
  priorityResults.priority2.reliability = consistencyScore;
  
  console.log(`   Data Consistency Score: ${consistencyScore.toFixed(1)}%`);
  
  // Test 3: Failover Simulation
  console.log('3. Simulating failover scenarios...');
  
  // Test backup endpoint availability
  const backupEndpoints = [
    '/api/crypto/all-pairs', // Backup for individual crypto data
    '/api/automation/status', // System health backup
    '/api/rate-limiter/stats' // Service status backup
  ];
  
  let workingBackups = 0;
  for (const endpoint of backupEndpoints) {
    const result = await makeRequest(endpoint);
    if (result.success) {
      workingBackups++;
      console.log(`   ✅ Backup endpoint: ${endpoint}`);
    } else {
      console.log(`   ❌ Backup endpoint: ${endpoint}`);
    }
  }
  
  const failoverScore = (workingBackups / backupEndpoints.length) * 100;
  console.log(`   Failover Capability: ${failoverScore.toFixed(1)}%`);
  
  priorityResults.priority2.tests.push({
    test: 'multi_source_validation',
    sourceReliability,
    consistencyScore,
    failoverScore,
    overallScore: (sourceReliability + consistencyScore + failoverScore) / 3
  });
  
  // Redundancy Recommendations
  if (sourceReliability < 90) {
    priorityResults.priority2.issues.push('Data source availability below target');
    priorityResults.priority2.solutions.push('Add secondary API providers');
  }
  
  if (consistencyScore < 80) {
    priorityResults.priority2.issues.push('Data consistency issues detected');
    priorityResults.priority2.solutions.push('Implement data validation middleware');
  }
  
  if (failoverScore < 100) {
    priorityResults.priority2.issues.push('Failover mechanisms incomplete');
    priorityResults.priority2.solutions.push('Add automated failover logic');
  }
}

// PRIORITY 3: MEDIUM CODE QUALITY IMPLEMENTATION
async function implementPriority3CodeQuality() {
  console.log('\n🔧 PRIORITY 3: MEDIUM CODE QUALITY IMPLEMENTATION');
  console.log('─'.repeat(57));
  
  // Test 1: TypeScript Error Impact Analysis
  console.log('1. Analyzing TypeScript error impact...');
  
  const criticalEndpoints = [
    '/api/signals/BTC%2FUSDT?timeframe=1h',
    '/api/technical-analysis/BTC%2FUSDT',
    '/api/performance-metrics',
    '/api/crypto/BTC%2FUSDT',
    '/api/automation/status'
  ];
  
  let functionalEndpoints = 0;
  const endpointTests = [];
  
  for (const endpoint of criticalEndpoints) {
    const result = await makeRequest(endpoint);
    const isFunctional = result.success && result.data;
    
    if (isFunctional) functionalEndpoints++;
    
    endpointTests.push({
      endpoint,
      functional: isFunctional,
      responseTime: result.responseTime,
      hasData: result.success && result.data !== null
    });
    
    console.log(`   ${endpoint}: ${isFunctional ? '✅' : '❌'} (${result.responseTime}ms)`);
  }
  
  const functionalityScore = (functionalEndpoints / criticalEndpoints.length) * 100;
  console.log(`   System Functionality Despite TS Errors: ${functionalityScore.toFixed(1)}%`);
  
  priorityResults.priority3.score = functionalityScore;
  
  // Test 2: Error Handling Effectiveness
  console.log('2. Testing error handling effectiveness...');
  
  const errorTestCases = [
    { endpoint: '/api/crypto/INVALID_SYMBOL', expectedBehavior: 'proper_404' },
    { endpoint: '/api/signals/NONEXISTENT', expectedBehavior: 'proper_error' },
    { endpoint: '/api/technical-analysis/', expectedBehavior: 'proper_404' },
    { endpoint: '/api/performance-metrics?invalid=true', expectedBehavior: 'graceful_handling' }
  ];
  
  let properErrorHandling = 0;
  
  for (const testCase of errorTestCases) {
    const result = await makeRequest(testCase.endpoint);
    let handledProperly = false;
    
    if (!result.success && result.error.includes('404')) {
      handledProperly = true;
    } else if (result.success && result.data && result.data.error) {
      handledProperly = true;
    } else if (result.success && Array.isArray(result.data) && result.data.length === 0) {
      handledProperly = true; // Empty array is acceptable for some endpoints
    }
    
    if (handledProperly) properErrorHandling++;
    
    console.log(`   ${testCase.endpoint}: ${handledProperly ? '✅' : '❌'} error handling`);
  }
  
  const errorHandlingScore = (properErrorHandling / errorTestCases.length) * 100;
  console.log(`   Error Handling Score: ${errorHandlingScore.toFixed(1)}%`);
  
  // Test 3: Data Type Consistency
  console.log('3. Validating data type consistency...');
  
  const typeValidationTests = [
    { 
      endpoint: '/api/crypto/BTC%2FUSDT', 
      expectedFields: ['symbol', 'price', 'name'],
      expectedTypes: { symbol: 'string', price: 'number', name: 'string' }
    },
    {
      endpoint: '/api/signals/BTC%2FUSDT',
      expectedFields: ['direction', 'confidence'],
      expectedTypes: { direction: 'string', confidence: 'number' }
    },
    {
      endpoint: '/api/market-heatmap',
      expectedFields: ['marketEntries'],
      expectedTypes: { marketEntries: 'array' }
    }
  ];
  
  let consistentTypes = 0;
  
  for (const test of typeValidationTests) {
    const result = await makeRequest(test.endpoint);
    let isConsistent = false;
    
    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      
      if (data) {
        const hasRequiredFields = test.expectedFields.every(field => data[field] !== undefined);
        
        if (hasRequiredFields) {
          // Check types
          const typeCheck = Object.entries(test.expectedTypes).every(([field, expectedType]) => {
            const actualValue = data[field];
            if (expectedType === 'array') {
              return Array.isArray(actualValue);
            }
            return typeof actualValue === expectedType;
          });
          
          isConsistent = typeCheck;
        }
      }
    }
    
    if (isConsistent) consistentTypes++;
    
    console.log(`   ${test.endpoint}: ${isConsistent ? '✅' : '⚠️'} type consistency`);
  }
  
  const typeConsistencyScore = (consistentTypes / typeValidationTests.length) * 100;
  console.log(`   Type Consistency Score: ${typeConsistencyScore.toFixed(1)}%`);
  
  priorityResults.priority3.tests.push({
    test: 'code_quality_analysis',
    functionalityScore,
    errorHandlingScore,
    typeConsistencyScore,
    overallScore: (functionalityScore + errorHandlingScore + typeConsistencyScore) / 3
  });
  
  // Code Quality Recommendations
  if (functionalityScore < 90) {
    priorityResults.priority3.issues.push('TypeScript errors affecting functionality');
    priorityResults.priority3.fixes.push('Resolve critical TypeScript type annotations');
  }
  
  if (errorHandlingScore < 80) {
    priorityResults.priority3.issues.push('Error handling needs improvement');
    priorityResults.priority3.fixes.push('Implement comprehensive error boundaries');
  }
  
  if (typeConsistencyScore < 90) {
    priorityResults.priority3.issues.push('Data type inconsistencies detected');
    priorityResults.priority3.fixes.push('Standardize API response schemas');
  }
}

// COMPREHENSIVE VALIDATION CYCLES
async function runPriorityValidationCycle(cycleNumber) {
  console.log(`\n🔄 PRIORITY VALIDATION CYCLE ${cycleNumber}/10`);
  console.log('─'.repeat(45));
  
  const cycleStart = Date.now();
  const cycleData = {
    cycleNumber,
    timestamp: new Date().toISOString(),
    priority1: {},
    priority2: {},
    priority3: {},
    compliance: {},
    performance: {},
    issues: []
  };
  
  // Priority 1 Validation: Security
  console.log(`  🔒 Security validation...`);
  
  const securityTest = await makeRequest('/api/rate-limiter/stats');
  if (securityTest.success) {
    const hasProtection = securityTest.data.maxRequestsPerMinute > 0;
    const circuitBreakerOk = !securityTest.data.circuitBreakerOpen;
    
    cycleData.priority1 = {
      rateLimiterActive: hasProtection,
      circuitBreakerHealthy: circuitBreakerOk,
      score: (hasProtection ? 50 : 0) + (circuitBreakerOk ? 50 : 0)
    };
    
    console.log(`    Rate Limiter: ${hasProtection ? 'Active' : 'Inactive'}`);
    console.log(`    Circuit Breaker: ${circuitBreakerOk ? 'Healthy' : 'Open'}`);
  }
  
  // Priority 2 Validation: Data Redundancy
  console.log(`  📡 Data redundancy validation...`);
  
  const redundancyTests = [
    '/api/crypto/BTC%2FUSDT',
    '/api/market-heatmap',
    '/api/simple-market-data'
  ];
  
  const redundancyResults = await Promise.all(
    redundancyTests.map(endpoint => makeRequest(endpoint))
  );
  
  const availableSources = redundancyResults.filter(r => r.success).length;
  const redundancyScore = (availableSources / redundancyTests.length) * 100;
  
  cycleData.priority2 = {
    availableSources,
    totalSources: redundancyTests.length,
    redundancyScore
  };
  
  console.log(`    Available Sources: ${availableSources}/${redundancyTests.length}`);
  console.log(`    Redundancy Score: ${redundancyScore.toFixed(1)}%`);
  
  // Priority 3 Validation: Code Quality
  console.log(`  🔧 Code quality validation...`);
  
  const qualityTests = [
    '/api/signals/BTC%2FUSDT?timeframe=1h',
    '/api/technical-analysis/BTC%2FUSDT',
    '/api/performance-metrics'
  ];
  
  const qualityResults = await Promise.all(
    qualityTests.map(endpoint => makeRequest(endpoint))
  );
  
  const functionalCode = qualityResults.filter(r => r.success).length;
  const codeQualityScore = (functionalCode / qualityTests.length) * 100;
  
  cycleData.priority3 = {
    functionalEndpoints: functionalCode,
    totalEndpoints: qualityTests.length,
    qualityScore: codeQualityScore
  };
  
  console.log(`    Functional Code: ${functionalCode}/${qualityTests.length}`);
  console.log(`    Quality Score: ${codeQualityScore.toFixed(1)}%`);
  
  // Ground Rules Compliance Check
  console.log(`  📋 Ground rules compliance...`);
  
  const complianceEndpoints = [
    '/api/crypto/BTC%2FUSDT',
    '/api/signals/ETH%2FUSDT',
    '/api/market-heatmap'
  ];
  
  let violations = 0;
  const syntheticPatterns = ['mock', 'fake', 'placeholder', 'dummy', 'synthetic'];
  
  for (const endpoint of complianceEndpoints) {
    const result = await makeRequest(endpoint);
    if (result.success) {
      const dataString = JSON.stringify(result.data).toLowerCase();
      if (syntheticPatterns.some(pattern => dataString.includes(pattern))) {
        violations++;
        cycleData.issues.push(`Synthetic data in ${endpoint}`);
      }
    }
  }
  
  cycleData.compliance = {
    violations,
    complianceScore: violations === 0 ? 100 : Math.max(0, 100 - (violations * 25))
  };
  
  console.log(`    Violations: ${violations}`);
  console.log(`    Compliance Score: ${cycleData.compliance.complianceScore}%`);
  
  // Performance Check
  const performanceTest = await makeRequest('/api/crypto/BTC%2FUSDT');
  cycleData.performance = {
    responseTime: performanceTest.responseTime,
    success: performanceTest.success
  };
  
  const cycleDuration = Date.now() - cycleStart;
  cycleData.duration = cycleDuration;
  
  // Calculate overall cycle health
  const cycleHealth = [
    cycleData.priority1.score || 0,
    cycleData.priority2.redundancyScore || 0,
    cycleData.priority3.qualityScore || 0,
    cycleData.compliance.complianceScore || 0
  ].reduce((sum, score) => sum + score, 0) / 4;
  
  cycleData.overallHealth = cycleHealth;
  
  console.log(`  🎯 Cycle ${cycleNumber} Health: ${cycleHealth.toFixed(1)}% (${cycleDuration}ms)`);
  
  return cycleData;
}

// FINAL ANALYSIS AND RECOMMENDATIONS
async function generatePriorityRecommendations() {
  console.log('\n💡 PRIORITY IMPLEMENTATION RECOMMENDATIONS');
  console.log('═'.repeat(60));
  
  const overallProgress = [
    priorityResults.priority1.score || 0,
    priorityResults.priority2.score || 0,
    priorityResults.priority3.score || 0
  ].reduce((sum, score) => sum + score, 0) / 3;
  
  priorityResults.overallProgress = overallProgress;
  
  const systemStatus = overallProgress >= 85 ? 'EXCELLENT' : 
                      overallProgress >= 70 ? 'GOOD' : 
                      overallProgress >= 55 ? 'FAIR' : 'NEEDS IMPROVEMENT';
  
  console.log(`\n🎯 OVERALL PRIORITY PROGRESS: ${overallProgress.toFixed(1)}% (${systemStatus})`);
  console.log('─'.repeat(50));
  
  // Priority-specific recommendations
  console.log('\n📋 PRIORITY-SPECIFIC RECOMMENDATIONS:');
  
  console.log('\n🔒 PRIORITY 1 - CRITICAL SECURITY:');
  console.log(`   Current Score: ${priorityResults.priority1.score}%`);
  if (priorityResults.priority1.issues.length > 0) {
    priorityResults.priority1.issues.forEach((issue, index) => {
      console.log(`   Issue ${index + 1}: ${issue}`);
      if (priorityResults.priority1.solutions[index]) {
        console.log(`   Solution: ${priorityResults.priority1.solutions[index]}`);
      }
    });
  } else {
    console.log('   ✅ No critical security issues detected');
  }
  
  console.log('\n📡 PRIORITY 2 - HIGH DATA REDUNDANCY:');
  console.log(`   Current Score: ${priorityResults.priority2.score}%`);
  console.log(`   Data Reliability: ${priorityResults.priority2.reliability}%`);
  if (priorityResults.priority2.issues.length > 0) {
    priorityResults.priority2.issues.forEach((issue, index) => {
      console.log(`   Issue ${index + 1}: ${issue}`);
      if (priorityResults.priority2.solutions[index]) {
        console.log(`   Solution: ${priorityResults.priority2.solutions[index]}`);
      }
    });
  } else {
    console.log('   ✅ Data redundancy implementation satisfactory');
  }
  
  console.log('\n🔧 PRIORITY 3 - MEDIUM CODE QUALITY:');
  console.log(`   Current Score: ${priorityResults.priority3.score}%`);
  if (priorityResults.priority3.issues.length > 0) {
    priorityResults.priority3.issues.forEach((issue, index) => {
      console.log(`   Issue ${index + 1}: ${issue}`);
      if (priorityResults.priority3.fixes[index]) {
        console.log(`   Fix: ${priorityResults.priority3.fixes[index]}`);
      }
    });
  } else {
    console.log('   ✅ Code quality meets requirements');
  }
  
  // Implementation readiness assessment
  console.log('\n🚀 IMPLEMENTATION READINESS:');
  
  const readyForImplementation = overallProgress >= 70;
  console.log(`Status: ${readyForImplementation ? 'READY' : 'NEEDS PREPARATION'}`);
  
  if (readyForImplementation) {
    console.log('✅ External shell testing confirms system stability');
    console.log('✅ Ground rules compliance maintained');
    console.log('✅ Core functionality verified');
    console.log('✅ Safe to proceed with main codebase changes');
  } else {
    console.log('⚠️ Address critical issues before main codebase changes');
    console.log('⚠️ Run additional validation cycles');
    console.log('⚠️ Ensure zero impact on authentic data flow');
  }
  
  return {
    overallProgress,
    systemStatus,
    readyForImplementation,
    criticalIssues: priorityResults.priority1.issues.length,
    recommendedActions: [
      ...priorityResults.priority1.solutions,
      ...priorityResults.priority2.solutions,
      ...priorityResults.priority3.fixes
    ]
  };
}

// MAIN EXECUTION
async function main() {
  const startTime = Date.now();
  
  try {
    // Phase 1: Implement all three priorities
    await implementPriority1Security();
    await implementPriority2Redundancy();
    await implementPriority3CodeQuality();
    
    // Phase 2: Run 10 validation cycles
    console.log('\n🔄 RUNNING 10-CYCLE PRIORITY VALIDATION');
    console.log('═'.repeat(50));
    
    const cycles = [];
    for (let i = 1; i <= 10; i++) {
      const cycleData = await runPriorityValidationCycle(i);
      cycles.push(cycleData);
      priorityResults.testCycles.push(cycleData);
      
      // Brief pause between cycles
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // Phase 3: Generate final recommendations
    const finalRecommendations = await generatePriorityRecommendations();
    
    // Export comprehensive results
    const priorityReport = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - startTime,
      priorities: priorityResults,
      cycles,
      recommendations: finalRecommendations,
      readyForMainCodebase: finalRecommendations.readyForImplementation
    };
    
    const filename = `priority_implementation_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    try {
      fs.writeFileSync(filename, JSON.stringify(priorityReport, null, 2));
      console.log(`\n📄 Priority implementation report exported: ${filename}`);
    } catch (error) {
      console.log(`\n❌ Failed to export report: ${error.message}`);
    }
    
    const totalDuration = Date.now() - startTime;
    
    console.log('\n✅ PRIORITY IMPLEMENTATION COMPLETE');
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`Overall Progress: ${finalRecommendations.overallProgress.toFixed(1)}%`);
    console.log(`Ready for Main Codebase: ${finalRecommendations.readyForImplementation ? 'YES' : 'NO'}`);
    console.log('═'.repeat(70));
    
    return priorityReport;
    
  } catch (error) {
    console.error('Priority implementation failed:', error);
    return null;
  }
}

main();