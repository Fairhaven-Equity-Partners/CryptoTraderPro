import fetch from 'node-fetch';
import fs from 'fs';

console.log('🔍 COMPREHENSIVE 10-CYCLE CODEBASE HEALTH ANALYSIS');
console.log('═'.repeat(80));
console.log('External Shell Deep Dive - Multi-Cycle System Assessment');
console.log('Ground Rules Enforcement - Zero Tolerance for Synthetic Data');
console.log('Performance Optimization - Identifying Bottlenecks & Improvements');
console.log('═'.repeat(80));

const apiBase = 'http://localhost:5000';
let cycleResults = [];
let overallMetrics = {
  responseTime: [],
  errorCount: 0,
  successCount: 0,
  endpoints: {},
  algorithms: {},
  dataIntegrity: {},
  security: {},
  recommendations: []
};

async function makeRequest(endpoint) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${apiBase}${endpoint}`);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { data, responseTime, success: true };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { 
      error: error.message, 
      responseTime, 
      success: false 
    };
  }
}

async function runSingleCycle(cycleNumber) {
  console.log(`\n🔄 CYCLE ${cycleNumber}/10 - Comprehensive Analysis`);
  console.log('─'.repeat(60));
  
  const cycleStart = Date.now();
  const cycleData = {
    cycleNumber,
    timestamp: new Date().toISOString(),
    tests: {},
    metrics: {},
    issues: [],
    recommendations: []
  };

  // Test 1: Core Architecture
  console.log(`  🏗️  Testing Core Architecture...`);
  const architectureEndpoints = [
    '/api/crypto/all-pairs',
    '/api/market-heatmap',
    '/api/simple-market-data',
    '/api/performance-metrics',
    '/api/automation/status',
    '/api/rate-limiter/stats',
    '/api/authentic-system/status'
  ];

  let workingEndpoints = 0;
  for (const endpoint of architectureEndpoints) {
    const result = await makeRequest(endpoint);
    if (result.success) {
      workingEndpoints++;
      overallMetrics.successCount++;
    } else {
      overallMetrics.errorCount++;
      cycleData.issues.push({
        type: 'endpoint_failure',
        location: endpoint,
        error: result.error
      });
    }
    overallMetrics.responseTime.push(result.responseTime);
  }
  
  cycleData.tests.architecture = {
    total: architectureEndpoints.length,
    working: workingEndpoints,
    healthScore: (workingEndpoints / architectureEndpoints.length) * 100
  };

  console.log(`    Architecture Health: ${cycleData.tests.architecture.healthScore.toFixed(1)}%`);

  // Test 2: Algorithm Integrity & Signal Quality
  console.log(`  🧮 Testing Algorithm Integrity...`);
  const testSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'ADA/USDT'];
  const timeframes = ['1h', '4h', '1d', '1w', '1M'];
  
  let totalSignals = 0;
  let authenticSignals = 0;
  let signalQualityScore = 0;
  let diversityMetrics = { long: 0, short: 0, neutral: 0 };

  for (const symbol of testSymbols.slice(0, 3)) { // Test 3 symbols per cycle
    for (const timeframe of timeframes.slice(0, 3)) { // Test 3 timeframes per symbol
      const result = await makeRequest(`/api/signals/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
      
      if (result.success && result.data && Array.isArray(result.data)) {
        totalSignals += result.data.length;
        
        for (const signal of result.data) {
          // Check signal authenticity
          if (signal.indicators && 
              signal.confidence > 0 && 
              signal.confidence <= 100 &&
              ['LONG', 'SHORT', 'NEUTRAL'].includes(signal.direction) &&
              signal.timestamp &&
              signal.price > 0) {
            authenticSignals++;
            
            // Calculate quality score based on indicator count and confidence
            const indicatorCount = Object.keys(signal.indicators || {}).length;
            const confidenceBonus = signal.confidence > 70 ? 20 : signal.confidence > 50 ? 10 : 0;
            signalQualityScore += (indicatorCount * 10) + confidenceBonus;
            
            // Track diversity
            diversityMetrics[signal.direction.toLowerCase()]++;
          }
        }
      }
      overallMetrics.responseTime.push(result.responseTime);
    }
  }

  const algorithmHealth = totalSignals > 0 ? (authenticSignals / totalSignals) * 100 : 0;
  const avgQualityScore = authenticSignals > 0 ? signalQualityScore / authenticSignals : 0;
  
  cycleData.tests.algorithms = {
    totalSignals,
    authenticSignals,
    healthScore: algorithmHealth,
    avgQualityScore,
    diversity: diversityMetrics
  };

  console.log(`    Algorithm Health: ${algorithmHealth.toFixed(1)}%`);
  console.log(`    Signal Quality: ${avgQualityScore.toFixed(1)} points avg`);

  // Test 3: Data Source Integrity
  console.log(`  📡 Testing Data Source Integrity...`);
  
  // Check rate limiter
  const rateLimiterResult = await makeRequest('/api/rate-limiter/stats');
  let dataIntegrityScore = 0;
  
  if (rateLimiterResult.success) {
    const stats = rateLimiterResult.data;
    const utilizationRate = stats.requestsThisMinute / stats.maxRequestsPerMinute;
    dataIntegrityScore += utilizationRate < 0.8 ? 30 : 20; // Good if under 80% utilization
    dataIntegrityScore += stats.circuitBreakerOpen ? 0 : 20; // Good if circuit breaker closed
  }

  // Check authentic system status
  const authenticResult = await makeRequest('/api/authentic-system/status');
  if (authenticResult.success && authenticResult.data?.status === 'operational') {
    dataIntegrityScore += 25;
  }

  // Check automation system
  const automationResult = await makeRequest('/api/automation/status');
  if (automationResult.success && automationResult.data?.isRunning) {
    dataIntegrityScore += 25;
  }

  cycleData.tests.dataIntegrity = {
    score: dataIntegrityScore,
    rateLimiter: rateLimiterResult.success ? rateLimiterResult.data : null,
    authenticSystem: authenticResult.success ? authenticResult.data : null,
    automation: automationResult.success ? automationResult.data : null
  };

  console.log(`    Data Integrity: ${dataIntegrityScore}%`);

  // Test 4: Performance Analysis
  console.log(`  ⚡ Testing Performance...`);
  
  const performanceTests = [
    { endpoint: '/api/crypto/BTC%2FUSDT', name: 'Single Asset' },
    { endpoint: '/api/market-heatmap', name: 'Market Heatmap' },
    { endpoint: '/api/simple-market-data', name: 'Market Data' },
    { endpoint: '/api/technical-analysis/BTC%2FUSDT', name: 'Technical Analysis' }
  ];

  let performanceResults = [];
  for (const test of performanceTests) {
    const result = await makeRequest(test.endpoint);
    performanceResults.push({
      name: test.name,
      responseTime: result.responseTime,
      success: result.success
    });
    overallMetrics.responseTime.push(result.responseTime);
  }

  const avgResponseTime = performanceResults.reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.length;
  const performanceScore = avgResponseTime < 50 ? 100 : 
                          avgResponseTime < 100 ? 90 : 
                          avgResponseTime < 500 ? 70 : 50;

  cycleData.tests.performance = {
    averageResponseTime: avgResponseTime,
    score: performanceScore,
    results: performanceResults
  };

  console.log(`    Performance Score: ${performanceScore}% (${avgResponseTime.toFixed(0)}ms avg)`);

  // Test 5: Ground Rules Compliance
  console.log(`  📋 Testing Ground Rules Compliance...`);
  
  const syntheticPatterns = ['mock', 'fake', 'placeholder', 'dummy', 'test_data', 'synthetic'];
  let violations = 0;
  
  const testEndpoints = [
    '/api/crypto/BTC%2FUSDT',
    '/api/signals/BTC%2FUSDT',
    '/api/market-heatmap'
  ];

  for (const endpoint of testEndpoints) {
    const result = await makeRequest(endpoint);
    if (result.success) {
      const dataString = JSON.stringify(result.data).toLowerCase();
      if (syntheticPatterns.some(pattern => dataString.includes(pattern))) {
        violations++;
        cycleData.issues.push({
          type: 'ground_rules_violation',
          location: endpoint,
          description: 'Synthetic data pattern detected'
        });
      }
    }
  }

  const groundRulesScore = violations === 0 ? 100 : Math.max(0, 100 - (violations * 25));
  cycleData.tests.groundRules = {
    violations,
    score: groundRulesScore
  };

  console.log(`    Ground Rules: ${groundRulesScore}% (${violations} violations)`);

  // Test 6: Security Assessment
  console.log(`  🔒 Testing Security Measures...`);
  
  let securityScore = 0;
  
  // Check rate limiting implementation
  if (rateLimiterResult.success && rateLimiterResult.data?.maxRequestsPerMinute > 0) {
    securityScore += 40;
  }
  
  // Check circuit breaker
  if (rateLimiterResult.success && rateLimiterResult.data?.hasOwnProperty('circuitBreakerOpen')) {
    securityScore += 30;
  }
  
  // Check error handling
  const invalidEndpointResult = await makeRequest('/api/invalid-test-endpoint');
  if (!invalidEndpointResult.success && invalidEndpointResult.error.includes('404')) {
    securityScore += 30; // Proper error handling
  }

  cycleData.tests.security = {
    score: securityScore
  };

  console.log(`    Security Score: ${securityScore}%`);

  // Calculate cycle overall score
  const cycleScore = [
    cycleData.tests.architecture.healthScore,
    cycleData.tests.algorithms.healthScore,
    cycleData.tests.dataIntegrity.score,
    cycleData.tests.performance.score,
    cycleData.tests.groundRules.score,
    cycleData.tests.security.score
  ].reduce((sum, score) => sum + score, 0) / 6;

  cycleData.overallScore = cycleScore;
  const cycleDuration = Date.now() - cycleStart;
  
  console.log(`  🎯 Cycle ${cycleNumber} Score: ${cycleScore.toFixed(1)}% (${cycleDuration}ms)`);
  
  // Generate cycle-specific recommendations
  if (cycleData.tests.architecture.healthScore < 90) {
    cycleData.recommendations.push('Improve API endpoint reliability');
  }
  if (cycleData.tests.performance.averageResponseTime > 100) {
    cycleData.recommendations.push('Optimize response times');
  }
  if (cycleData.tests.security.score < 80) {
    cycleData.recommendations.push('Strengthen security measures');
  }
  if (violations > 0) {
    cycleData.recommendations.push('CRITICAL: Remove synthetic data violations');
  }

  return cycleData;
}

async function analyzeTrends(cycles) {
  console.log('\n📈 TREND ANALYSIS');
  console.log('─'.repeat(40));
  
  const scores = cycles.map(c => c.overallScore);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const trend = scores.length > 1 ? (scores[scores.length - 1] - scores[0]) / (scores.length - 1) : 0;
  
  console.log(`Average Health Score: ${avgScore.toFixed(1)}%`);
  console.log(`Trend: ${trend > 0 ? '+' : ''}${trend.toFixed(2)}% per cycle`);
  
  // Analyze response times
  const avgResponseTime = overallMetrics.responseTime.reduce((sum, time) => sum + time, 0) / overallMetrics.responseTime.length;
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  // Success rate
  const totalRequests = overallMetrics.successCount + overallMetrics.errorCount;
  const successRate = (overallMetrics.successCount / totalRequests) * 100;
  console.log(`Success Rate: ${successRate.toFixed(1)}% (${overallMetrics.successCount}/${totalRequests})`);
  
  return { avgScore, trend, avgResponseTime, successRate };
}

async function generateComprehensiveRecommendations(cycles, trends) {
  console.log('\n💡 COMPREHENSIVE IMPROVEMENT RECOMMENDATIONS');
  console.log('═'.repeat(60));
  
  const recommendations = [];
  
  // Performance Recommendations
  if (trends.avgResponseTime > 100) {
    recommendations.push({
      category: 'Performance',
      priority: 'High',
      recommendation: 'Implement response caching for frequently accessed endpoints',
      impact: 'Reduce average response time by 50-70%'
    });
  }
  
  if (trends.avgResponseTime > 50) {
    recommendations.push({
      category: 'Performance', 
      priority: 'Medium',
      recommendation: 'Optimize database queries and API response serialization',
      impact: 'Improve response times by 20-30%'
    });
  }

  // Security Recommendations
  const securityScores = cycles.map(c => c.tests.security.score);
  const avgSecurityScore = securityScores.reduce((sum, score) => sum + score, 0) / securityScores.length;
  
  if (avgSecurityScore < 80) {
    recommendations.push({
      category: 'Security',
      priority: 'Critical',
      recommendation: 'Implement comprehensive rate limiting and request validation',
      impact: 'Prevent API abuse and improve system stability'
    });
    
    recommendations.push({
      category: 'Security',
      priority: 'High', 
      recommendation: 'Add authentication middleware for sensitive endpoints',
      impact: 'Secure system against unauthorized access'
    });
  }

  // Algorithm Recommendations
  const algorithmHealth = cycles.map(c => c.tests.algorithms.healthScore);
  const avgAlgorithmHealth = algorithmHealth.reduce((sum, score) => sum + score, 0) / algorithmHealth.length;
  
  if (avgAlgorithmHealth < 95) {
    recommendations.push({
      category: 'Algorithms',
      priority: 'Medium',
      recommendation: 'Enhance signal validation and indicator weighting',
      impact: 'Increase signal accuracy and reliability'
    });
  }

  // Data Integrity Recommendations  
  const dataScores = cycles.map(c => c.tests.dataIntegrity.score);
  const avgDataScore = dataScores.reduce((sum, score) => sum + score, 0) / dataScores.length;
  
  if (avgDataScore < 90) {
    recommendations.push({
      category: 'Data Integrity',
      priority: 'High',
      recommendation: 'Implement redundant data sources and fallback mechanisms',
      impact: 'Improve system reliability and data availability'
    });
  }

  // Architecture Recommendations
  if (trends.successRate < 95) {
    recommendations.push({
      category: 'Architecture',
      priority: 'High',
      recommendation: 'Add comprehensive error handling and retry logic',
      impact: 'Increase system reliability and user experience'
    });
  }

  // Code Quality Recommendations
  recommendations.push({
    category: 'Code Quality',
    priority: 'Medium',
    recommendation: 'Implement comprehensive logging and monitoring',
    impact: 'Better debugging and system observability'
  });

  recommendations.push({
    category: 'Code Quality',
    priority: 'Low',
    recommendation: 'Add automated testing suite for all endpoints',
    impact: 'Prevent regressions and improve code confidence'
  });

  // Scalability Recommendations
  if (trends.avgResponseTime > 50) {
    recommendations.push({
      category: 'Scalability',
      priority: 'Medium',
      recommendation: 'Implement horizontal scaling and load balancing',
      impact: 'Handle increased traffic and improve performance'
    });
  }

  return recommendations;
}

// Main execution
async function runComprehensive10CycleAnalysis() {
  const startTime = Date.now();
  
  // Run 10 cycles
  for (let i = 1; i <= 10; i++) {
    const cycleData = await runSingleCycle(i);
    cycleResults.push(cycleData);
    
    // Brief pause between cycles
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Analyze trends
  const trends = await analyzeTrends(cycleResults);
  
  // Generate recommendations
  const recommendations = await generateComprehensiveRecommendations(cycleResults, trends);
  
  // Final Report
  console.log('\n📊 FINAL COMPREHENSIVE REPORT');
  console.log('═'.repeat(80));
  
  const finalScore = trends.avgScore;
  const systemStatus = finalScore >= 85 ? 'EXCELLENT' : 
                      finalScore >= 70 ? 'GOOD' : 
                      finalScore >= 55 ? 'FAIR' : 'NEEDS IMPROVEMENT';
  
  console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${finalScore.toFixed(1)}% (${systemStatus})`);
  console.log('─'.repeat(50));
  
  // Component breakdown
  const componentScores = cycleResults.reduce((acc, cycle) => {
    acc.architecture += cycle.tests.architecture.healthScore;
    acc.algorithms += cycle.tests.algorithms.healthScore;
    acc.dataIntegrity += cycle.tests.dataIntegrity.score;
    acc.performance += cycle.tests.performance.score;
    acc.groundRules += cycle.tests.groundRules.score;
    acc.security += cycle.tests.security.score;
    return acc;
  }, { architecture: 0, algorithms: 0, dataIntegrity: 0, performance: 0, groundRules: 0, security: 0 });
  
  Object.keys(componentScores).forEach(key => {
    componentScores[key] /= cycleResults.length;
  });
  
  console.log(`Architecture Health: ${componentScores.architecture.toFixed(1)}%`);
  console.log(`Algorithm Integrity: ${componentScores.algorithms.toFixed(1)}%`);
  console.log(`Data Integrity: ${componentScores.dataIntegrity.toFixed(1)}%`);
  console.log(`Performance Score: ${componentScores.performance.toFixed(1)}%`);
  console.log(`Ground Rules Compliance: ${componentScores.groundRules.toFixed(1)}%`);
  console.log(`Security Score: ${componentScores.security.toFixed(1)}%`);
  
  // Key metrics
  console.log('\n📊 KEY METRICS:');
  console.log('─'.repeat(25));
  console.log(`Success Rate: ${trends.successRate.toFixed(1)}%`);
  console.log(`Average Response Time: ${trends.avgResponseTime.toFixed(0)}ms`);
  console.log(`Health Trend: ${trends.trend > 0 ? '+' : ''}${trends.trend.toFixed(2)}% per cycle`);
  console.log(`Total Requests Tested: ${overallMetrics.successCount + overallMetrics.errorCount}`);
  console.log(`Ground Rules Violations: ${cycleResults.reduce((sum, c) => sum + c.tests.groundRules.violations, 0)}`);
  
  // Display recommendations
  console.log('\n💡 PRIORITIZED RECOMMENDATIONS:');
  console.log('─'.repeat(40));
  
  const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
  priorityOrder.forEach(priority => {
    const priorityRecs = recommendations.filter(r => r.priority === priority);
    if (priorityRecs.length > 0) {
      console.log(`\n${priority} Priority:`);
      priorityRecs.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.category}] ${rec.recommendation}`);
        console.log(`     Impact: ${rec.impact}`);
      });
    }
  });
  
  // Export detailed results
  const reportData = {
    timestamp: new Date().toISOString(),
    analysis: {
      totalDuration: Date.now() - startTime,
      cycles: cycleResults.length,
      overallHealth: finalScore,
      systemStatus,
      trends,
      componentScores,
      recommendations
    },
    cycleResults,
    overallMetrics
  };
  
  const filename = `health_analysis_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  try {
    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report exported to: ${filename}`);
  } catch (error) {
    console.log(`\n❌ Failed to export report: ${error.message}`);
  }
  
  console.log('\n✅ 10-CYCLE COMPREHENSIVE ANALYSIS COMPLETE');
  console.log('═'.repeat(80));
  
  return reportData;
}

// Execute the analysis
runComprehensive10CycleAnalysis().catch(console.error);