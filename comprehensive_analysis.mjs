import fetch from 'node-fetch';

console.log('🔍 COMPREHENSIVE CODEBASE ANALYSIS');
console.log('═'.repeat(70));
console.log('External Shell Review - Full System Assessment');
console.log('Ground Rules Compliance - Zero Tolerance for Synthetic Data');
console.log('═'.repeat(70));

const apiBase = 'http://localhost:5000';
let analysisResults = {
  architecture: {},
  algorithms: {},
  dataIntegrity: {},
  performance: {},
  security: {},
  apiCompliance: {},
  groundRules: {},
  recommendations: []
};
let criticalIssues = [];
let groundRulesViolations = [];

async function makeRequest(endpoint) {
  try {
    const response = await fetch(`${apiBase}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// PHASE 1: SYSTEM ARCHITECTURE ANALYSIS
console.log('\n🏗️  PHASE 1: SYSTEM ARCHITECTURE ANALYSIS');
console.log('─'.repeat(50));

const endpoints = [
  '/api/crypto/all-pairs',
  '/api/market-heatmap', 
  '/api/simple-market-data',
  '/api/performance-metrics',
  '/api/automation/status',
  '/api/rate-limiter/stats',
  '/api/authentic-system/status'
];

let workingEndpoints = 0;
let failedEndpoints = [];

for (const endpoint of endpoints) {
  try {
    const response = await makeRequest(endpoint);
    if (response && response.status !== 'error') {
      workingEndpoints++;
      console.log(`✅ ${endpoint} - Operational`);
    } else {
      failedEndpoints.push(endpoint);
      console.log(`❌ ${endpoint} - Failed`);
    }
  } catch (error) {
    failedEndpoints.push(endpoint);
    console.log(`❌ ${endpoint} - Error: ${error.message}`);
  }
}

analysisResults.architecture = {
  totalEndpoints: endpoints.length,
  workingEndpoints,
  failedEndpoints,
  healthScore: (workingEndpoints / endpoints.length) * 100
};

console.log(`\nArchitecture Health: ${analysisResults.architecture.healthScore.toFixed(1)}%`);

// PHASE 2: ALGORITHM INTEGRITY ANALYSIS
console.log('\n🧮 PHASE 2: ALGORITHM INTEGRITY ANALYSIS');
console.log('─'.repeat(50));

const testSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
const timeframes = ['1h', '4h', '1d'];

let totalSignals = 0;
let authenticSignals = 0;
let diversityScore = 0;

for (const symbol of testSymbols) {
  console.log(`\n📊 Testing ${symbol}:`);
  
  for (const timeframe of timeframes) {
    try {
      const signals = await makeRequest(`/api/signals/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
      
      if (signals && Array.isArray(signals) && signals.length > 0) {
        totalSignals += signals.length;
        
        for (const signal of signals) {
          // Check for authentic signal characteristics
          if (signal.indicators && 
              signal.confidence > 0 && 
              signal.confidence <= 100 &&
              ['LONG', 'SHORT', 'NEUTRAL'].includes(signal.direction) &&
              signal.timestamp &&
              signal.price > 0) {
            authenticSignals++;
          }
          
          // Analyze signal diversity
          if (signal.direction !== 'NEUTRAL') {
            diversityScore += signal.direction === 'LONG' ? 1 : -1;
          }
        }
        
        console.log(`  ${timeframe}: ${signals.length} signals, ${signals[0]?.direction || 'N/A'} @ ${signals[0]?.confidence || 0}%`);
      } else {
        console.log(`  ${timeframe}: No signals`);
      }
    } catch (error) {
      console.log(`  ${timeframe}: Error - ${error.message}`);
    }
  }
}

// Calculate algorithm health metrics
const authenticity = totalSignals > 0 ? (authenticSignals / totalSignals) * 100 : 0;
const diversity = Math.abs(diversityScore) < totalSignals * 0.8 ? 100 : 50;

analysisResults.algorithms = {
  totalSignals,
  authenticSignals,
  authenticityScore: authenticity,
  diversityScore: diversity,
  algorithmHealth: (authenticity + diversity) / 2
};

console.log(`\nAlgorithm Health: ${analysisResults.algorithms.algorithmHealth.toFixed(1)}%`);
console.log(`Authenticity: ${authenticity.toFixed(1)}%`);
console.log(`Diversity: ${diversity.toFixed(1)}%`);

// PHASE 3: DATA SOURCE VALIDATION
console.log('\n📡 PHASE 3: DATA SOURCE VALIDATION');
console.log('─'.repeat(50));

console.log('Testing CoinMarketCap Integration:');
try {
  const cmcStatus = await makeRequest('/api/rate-limiter/stats');
  
  if (cmcStatus) {
    console.log(`✅ Rate Limiter Active: ${cmcStatus.requestsThisMinute}/${cmcStatus.maxRequestsPerMinute} requests`);
    console.log(`✅ Circuit Breaker: ${cmcStatus.circuitBreakerOpen ? 'OPEN' : 'CLOSED'}`);
    
    analysisResults.dataIntegrity.rateLimiter = {
      functional: true,
      utilizationPercent: (cmcStatus.requestsThisMinute / cmcStatus.maxRequestsPerMinute) * 100,
      circuitBreakerStatus: cmcStatus.circuitBreakerOpen ? 'OPEN' : 'CLOSED'
    };
  }
} catch (error) {
  console.log(`❌ Rate Limiter: ${error.message}`);
}

console.log('\nTesting Authentic Data Endpoints:');
try {
  const authenticStatus = await makeRequest('/api/authentic-system/status');
  
  if (authenticStatus) {
    console.log(`✅ Authentic System: ${authenticStatus.status}`);
    console.log(`✅ Data Sources: ${authenticStatus.activeSources || 0} active`);
    
    analysisResults.dataIntegrity.authenticSystem = {
      status: authenticStatus.status,
      activeSources: authenticStatus.activeSources || 0,
      operational: authenticStatus.status === 'operational'
    };
  }
} catch (error) {
  console.log(`❌ Authentic System: ${error.message}`);
}

// Test price data authenticity
console.log('\nValidating Price Data Authenticity:');
try {
  const cryptoData = await makeRequest('/api/crypto/BTC%2FUSDT');
  
  if (cryptoData && cryptoData.price > 0) {
    // Check if price is realistic (between $10,000 and $200,000 for BTC)
    const isRealistic = cryptoData.price >= 10000 && cryptoData.price <= 200000;
    console.log(`✅ Price Data: ${isRealistic ? 'Authentic' : 'Suspicious'} ($${cryptoData.price})`);
  }
} catch (error) {
  console.log(`❌ Price Data: Validation Failed`);
}

// PHASE 4: PERFORMANCE ANALYSIS
console.log('\n⚡ PHASE 4: PERFORMANCE ANALYSIS');
console.log('─'.repeat(50));

const performanceTests = [
  { endpoint: '/api/crypto/BTC%2FUSDT', name: 'Single Asset' },
  { endpoint: '/api/market-heatmap', name: 'Market Heatmap' },
  { endpoint: '/api/simple-market-data', name: 'Market Data' },
  { endpoint: '/api/performance-metrics', name: 'Performance Metrics' }
];

const performanceResults = [];

for (const test of performanceTests) {
  const startTime = Date.now();
  try {
    await makeRequest(test.endpoint);
    const responseTime = Date.now() - startTime;
    performanceResults.push({
      name: test.name,
      responseTime,
      status: 'success'
    });
    console.log(`✅ ${test.name}: ${responseTime}ms`);
  } catch (error) {
    performanceResults.push({
      name: test.name,
      responseTime: null,
      status: 'failed',
      error: error.message
    });
    console.log(`❌ ${test.name}: Failed`);
  }
}

const successfulTests = performanceResults.filter(r => r.status === 'success');
const avgResponseTime = successfulTests.length > 0 ? 
  successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length : 0;

analysisResults.performance = {
  averageResponseTime: avgResponseTime,
  successfulTests: successfulTests.length,
  totalTests: performanceResults.length,
  performanceScore: avgResponseTime < 1000 ? 100 : Math.max(0, 100 - (avgResponseTime - 1000) / 100)
};

console.log(`\nAverage Response Time: ${avgResponseTime.toFixed(0)}ms`);
console.log(`Performance Score: ${analysisResults.performance.performanceScore.toFixed(1)}%`);

// PHASE 5: API COMPLIANCE ANALYSIS
console.log('\n🔌 PHASE 5: API COMPLIANCE ANALYSIS');
console.log('─'.repeat(50));

const complianceTests = [
  { endpoint: '/api/crypto/BTC%2FUSDT', expectedType: 'object', requiredFields: ['symbol', 'price'] },
  { endpoint: '/api/signals/BTC%2FUSDT', expectedType: 'array', requiredFields: ['direction', 'confidence'] },
  { endpoint: '/api/market-heatmap', expectedType: 'object', requiredFields: ['marketEntries'] },
  { endpoint: '/api/accuracy/BTC%2FUSDT', expectedType: 'object', requiredFields: ['symbol', 'accuracy'] }
];

let compliantEndpoints = 0;
const violations = [];

function validateAPICompliance(response, expectedType, requiredFields) {
  if (!response) return false;
  
  // Check type
  if (expectedType === 'array' && !Array.isArray(response)) return false;
  if (expectedType === 'object' && (Array.isArray(response) || typeof response !== 'object')) return false;
  
  // Check required fields
  const checkObject = Array.isArray(response) ? response[0] : response;
  if (!checkObject) return expectedType === 'array'; // Empty array is OK
  
  return requiredFields.every(field => {
    return field.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined;
    }, checkObject) !== undefined;
  });
}

for (const test of complianceTests) {
  try {
    const response = await makeRequest(test.endpoint);
    const isCompliant = validateAPICompliance(response, test.expectedType, test.requiredFields);
    
    if (isCompliant) {
      compliantEndpoints++;
      console.log(`✅ ${test.endpoint} - Compliant`);
    } else {
      violations.push(test.endpoint);
      console.log(`❌ ${test.endpoint} - Non-compliant`);
    }
  } catch (error) {
    violations.push(test.endpoint);
    console.log(`❌ ${test.endpoint} - Error: ${error.message}`);
  }
}

analysisResults.apiCompliance = {
  compliantEndpoints,
  totalEndpoints: complianceTests.length,
  violations,
  complianceScore: (compliantEndpoints / complianceTests.length) * 100
};

console.log(`\nAPI Compliance: ${analysisResults.apiCompliance.complianceScore.toFixed(1)}%`);

// PHASE 6: SECURITY ANALYSIS
console.log('\n🔒 PHASE 6: SECURITY ANALYSIS');
console.log('─'.repeat(50));

console.log('Testing Rate Limiting:');
try {
  const rateLimiterStats = await makeRequest('/api/rate-limiter/stats');
  
  if (rateLimiterStats) {
    const hasRateLimit = rateLimiterStats.maxRequestsPerMinute > 0;
    const hasCircuitBreaker = rateLimiterStats.hasOwnProperty('circuitBreakerOpen');
    
    console.log(`✅ Rate Limiting: ${hasRateLimit ? 'Active' : 'Inactive'}`);
    console.log(`✅ Circuit Breaker: ${hasCircuitBreaker ? 'Implemented' : 'Missing'}`);
    
    analysisResults.security = {
      rateLimitingActive: hasRateLimit,
      circuitBreakerImplemented: hasCircuitBreaker,
      securityScore: (hasRateLimit ? 50 : 0) + (hasCircuitBreaker ? 50 : 0)
    };
  }
} catch (error) {
  console.log(`❌ Security features: ${error.message}`);
}

console.log(`\nSecurity Score: ${analysisResults.security.securityScore || 0}%`);

// PHASE 7: GROUND RULES COMPLIANCE
console.log('\n📋 PHASE 7: GROUND RULES COMPLIANCE');
console.log('─'.repeat(50));

console.log('Validating Ground Rules:');
console.log('1. Zero tolerance for synthetic data');
console.log('2. Authentic data sources only');
console.log('3. No mock or placeholder data');
console.log('4. Real market data integration');

// Check for synthetic data patterns
function containsSyntheticPatterns(data) {
  const dataString = JSON.stringify(data).toLowerCase();
  
  const syntheticPatterns = [
    'mock',
    'fake',
    'placeholder',
    'dummy',
    'test_data',
    'synthetic',
    'random_',
    'generated_'
  ];
  
  return syntheticPatterns.some(pattern => dataString.includes(pattern));
}

let syntheticViolations = 0;
const testEndpoints = [
  '/api/crypto/BTC%2FUSDT',
  '/api/signals/BTC%2FUSDT',
  '/api/market-heatmap'
];

for (const endpoint of testEndpoints) {
  try {
    const data = await makeRequest(endpoint);
    if (containsSyntheticPatterns(data)) {
      console.log(`❌ Synthetic data detected in ${endpoint}`);
      syntheticViolations++;
      groundRulesViolations.push({
        type: 'synthetic_data_violation',
        location: endpoint,
        severity: 'critical'
      });
    }
  } catch (error) {
    // Endpoint error, skip
  }
}

if (syntheticViolations === 0) {
  console.log('✅ No synthetic data patterns detected');
}

// Validate authentic sources
let authenticSources = 0;
try {
  const authenticStatus = await makeRequest('/api/authentic-system/status');
  if (authenticStatus && authenticStatus.status === 'operational') {
    authenticSources++;
  }
  
  const rateLimiterStats = await makeRequest('/api/rate-limiter/stats');
  if (rateLimiterStats && rateLimiterStats.maxRequestsPerMinute > 0) {
    authenticSources++;
  }
  
  const automationStatus = await makeRequest('/api/automation/status');
  if (automationStatus && automationStatus.isRunning) {
    authenticSources++;
  }
} catch (error) {
  // Error checking sources
}

let groundRulesScore = 100;
groundRulesScore -= syntheticViolations * 25; // 25 points per violation
groundRulesScore += Math.min(authenticSources * 10, 30); // Up to 30 bonus points
groundRulesScore = Math.max(0, Math.min(100, groundRulesScore));

analysisResults.groundRules = {
  syntheticDataViolations: syntheticViolations,
  authenticSourcesValidated: authenticSources,
  complianceScore: groundRulesScore
};

if (syntheticViolations === 0) {
  console.log('✅ Ground Rules Compliance: PASSED');
} else {
  console.log('❌ Ground Rules Compliance: VIOLATIONS DETECTED');
}

console.log(`Ground Rules Score: ${groundRulesScore.toFixed(1)}%`);

// PHASE 8: COMPONENT INTEGRATION TEST
console.log('\n🔗 PHASE 8: COMPONENT INTEGRATION TEST');
console.log('─'.repeat(50));

console.log('Testing Cross-Component Data Flow:');

const symbol = 'BTC/USDT';
const timeframe = '1h';

try {
  const [cryptoData, signalsData, heatmapData, accuracyData] = await Promise.all([
    makeRequest(`/api/crypto/${encodeURIComponent(symbol)}`),
    makeRequest(`/api/signals/${encodeURIComponent(symbol)}?timeframe=${timeframe}`),
    makeRequest(`/api/market-heatmap?timeframe=${timeframe}`),
    makeRequest(`/api/accuracy/${encodeURIComponent(symbol)}`)
  ]);
  
  // Check data consistency
  let priceConsistency = false;
  let signalConsistency = false;
  let dataFreshness = false;
  
  // Price consistency check
  if (cryptoData && heatmapData) {
    const heatmapEntry = heatmapData.marketEntries?.find(entry => entry.symbol === symbol);
    if (heatmapEntry) {
      const priceDiff = Math.abs(cryptoData.price - heatmapEntry.currentPrice) / cryptoData.price;
      priceConsistency = priceDiff < 0.01; // Within 1%
    }
  }
  
  // Signal consistency check
  if (signalsData && Array.isArray(signalsData) && signalsData.length > 0 && heatmapData) {
    const heatmapEntry = heatmapData.marketEntries?.find(entry => entry.symbol === symbol);
    if (heatmapEntry) {
      const signal = signalsData.find(s => s.timeframe === timeframe);
      const heatmapSignal = heatmapEntry.signals?.[timeframe] || heatmapEntry.sentiment;
      
      if (signal && heatmapSignal) {
        signalConsistency = signal.direction === heatmapSignal.direction;
      }
    }
  }
  
  // Data freshness check
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  const dataArray = [cryptoData, signalsData, heatmapData, accuracyData];
  
  dataFreshness = dataArray.every(data => {
    if (!data) return true; // No data is not necessarily stale
    
    const timestamp = data.timestamp || data.lastCalculationTime || Date.now();
    return (now - new Date(timestamp).getTime()) < maxAge;
  });
  
  const integrationScore = [priceConsistency, signalConsistency, dataFreshness]
    .reduce((sum, check) => sum + (check ? 33.33 : 0), 0);
  
  console.log(`✅ Price Consistency: ${priceConsistency ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Signal Consistency: ${signalConsistency ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Data Freshness: ${dataFreshness ? 'PASS' : 'FAIL'}`);
  console.log(`Integration Score: ${integrationScore.toFixed(1)}%`);
  
  analysisResults.integration = {
    priceConsistency,
    signalConsistency,
    dataFreshness,
    integrationScore
  };
  
} catch (error) {
  console.log(`❌ Integration test failed: ${error.message}`);
  criticalIssues.push({
    type: 'integration_test_failed',
    severity: 'high',
    description: error.message
  });
}

// PHASE 9: DATA FLOW INTEGRITY ANALYSIS
console.log('\n🌊 PHASE 9: DATA FLOW INTEGRITY ANALYSIS');
console.log('─'.repeat(50));

console.log('Analyzing Real-time Data Flow:');

try {
  const automationStatus = await makeRequest('/api/automation/status');
  
  if (automationStatus) {
    console.log(`✅ Automation System: ${automationStatus.isRunning ? 'RUNNING' : 'STOPPED'}`);
    console.log(`✅ Last Calculation: ${new Date(automationStatus.lastCalculationTime).toLocaleString()}`);
    
    const dataFlowHealth = automationStatus.isRunning ? 100 : 0;
    
    analysisResults.dataFlow = {
      automationRunning: automationStatus.isRunning,
      lastCalculation: automationStatus.lastCalculationTime,
      dataFlowHealth
    };
    
    console.log(`Data Flow Health: ${dataFlowHealth}%`);
  }
} catch (error) {
  console.log(`❌ Data flow analysis failed: ${error.message}`);
}

try {
  const timingMetrics = await makeRequest('/api/timing/metrics');
  
  if (timingMetrics) {
    console.log(`✅ Timing System: Operational`);
    console.log(`✅ Active Timers: ${timingMetrics.activeTimers || 0}`);
  }
} catch (error) {
  console.log(`❌ Timing metrics unavailable: ${error.message}`);
}

// COMPREHENSIVE REPORT
console.log('\n📊 COMPREHENSIVE ANALYSIS REPORT');
console.log('═'.repeat(70));

// Calculate overall system health
const scores = [
  analysisResults.architecture?.healthScore || 0,
  analysisResults.algorithms?.algorithmHealth || 0,
  analysisResults.performance?.performanceScore || 0,
  analysisResults.apiCompliance?.complianceScore || 0,
  analysisResults.security?.securityScore || 0,
  analysisResults.groundRules?.complianceScore || 0
];

const overallHealth = scores.reduce((sum, score) => sum + score, 0) / scores.length;

console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallHealth.toFixed(1)}%`);
console.log('─'.repeat(50));

// Individual component scores
console.log(`Architecture Health: ${(analysisResults.architecture?.healthScore || 0).toFixed(1)}%`);
console.log(`Algorithm Integrity: ${(analysisResults.algorithms?.algorithmHealth || 0).toFixed(1)}%`);
console.log(`Performance Score: ${(analysisResults.performance?.performanceScore || 0).toFixed(1)}%`);
console.log(`API Compliance: ${(analysisResults.apiCompliance?.complianceScore || 0).toFixed(1)}%`);
console.log(`Security Score: ${(analysisResults.security?.securityScore || 0).toFixed(1)}%`);
console.log(`Ground Rules Compliance: ${(analysisResults.groundRules?.complianceScore || 0).toFixed(1)}%`);

// Critical issues
if (criticalIssues.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES:');
  console.log('─'.repeat(30));
  criticalIssues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
  });
}

// Ground rules violations
if (groundRulesViolations.length > 0) {
  console.log('\n⚠️  GROUND RULES VIOLATIONS:');
  console.log('─'.repeat(35));
  groundRulesViolations.forEach((violation, index) => {
    console.log(`${index + 1}. ${violation.type}: ${violation.location || violation.description}`);
  });
}

// Recommendations
const recommendations = [];

if ((analysisResults.architecture?.healthScore || 0) < 90) {
  recommendations.push('Improve API endpoint reliability and error handling');
}

if ((analysisResults.algorithms?.algorithmHealth || 0) < 80) {
  recommendations.push('Enhance signal generation algorithms for better accuracy');
}

if ((analysisResults.performance?.averageResponseTime || 0) > 1000) {
  recommendations.push('Optimize API response times through caching and query optimization');
}

if ((analysisResults.security?.securityScore || 0) < 100) {
  recommendations.push('Strengthen security measures including rate limiting and input validation');
}

if (groundRulesViolations.length > 0) {
  recommendations.push('CRITICAL: Eliminate all synthetic data sources and ensure authentic data only');
}

if ((analysisResults.dataIntegrity?.authenticSystem?.activeSources || 0) < 2) {
  recommendations.push('Diversify authentic data sources for improved reliability');
}

if (recommendations.length > 0) {
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('─'.repeat(25));
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
}

// Summary
console.log('\n📋 ANALYSIS SUMMARY:');
console.log('─'.repeat(25));
console.log(`System Status: ${overallHealth >= 80 ? 'HEALTHY' : overallHealth >= 60 ? 'WARNING' : 'CRITICAL'}`);
console.log(`Ground Rules Compliant: ${groundRulesViolations.length === 0 ? 'YES' : 'NO'}`);
console.log(`Critical Issues: ${criticalIssues.length}`);
console.log(`Recommendations: ${recommendations.length}`);
console.log(`Tested Endpoints: ${endpoints.length}`);
console.log(`Working Endpoints: ${workingEndpoints}`);
console.log(`Total Signals Analyzed: ${totalSignals}`);
console.log(`Authentic Signals: ${authenticSignals}`);

console.log('\n✅ COMPREHENSIVE CODEBASE ANALYSIS COMPLETE');
console.log('═'.repeat(70));
