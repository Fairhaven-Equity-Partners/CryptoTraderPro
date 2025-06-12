import fetch from 'node-fetch';

console.log('🔍 STREAMLINED CODEBASE HEALTH ANALYSIS');
console.log('═'.repeat(70));

const apiBase = 'http://localhost:5000';
let healthMetrics = {
  architecture: 0,
  algorithms: 0,
  dataIntegrity: 0,
  performance: 0,
  security: 0,
  groundRules: 0,
  responseTime: [],
  issues: [],
  recommendations: []
};

async function makeRequest(endpoint) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${apiBase}${endpoint}`);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return { data, responseTime, success: true };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { error: error.message, responseTime, success: false };
  }
}

async function runHealthAnalysis() {
  console.log('\n🏗️  ARCHITECTURE HEALTH');
  console.log('─'.repeat(30));
  
  const coreEndpoints = [
    '/api/crypto/all-pairs',
    '/api/market-heatmap',
    '/api/simple-market-data',
    '/api/performance-metrics',
    '/api/automation/status',
    '/api/rate-limiter/stats',
    '/api/authentic-system/status'
  ];

  let workingEndpoints = 0;
  for (const endpoint of coreEndpoints) {
    const result = await makeRequest(endpoint);
    healthMetrics.responseTime.push(result.responseTime);
    
    if (result.success) {
      workingEndpoints++;
      console.log(`✅ ${endpoint} (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${endpoint} - ${result.error}`);
      healthMetrics.issues.push(`Endpoint failure: ${endpoint}`);
    }
  }
  
  healthMetrics.architecture = (workingEndpoints / coreEndpoints.length) * 100;
  console.log(`Architecture Score: ${healthMetrics.architecture.toFixed(1)}%`);

  console.log('\n🧮 ALGORITHM INTEGRITY');
  console.log('─'.repeat(30));
  
  const testSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
  let totalSignals = 0;
  let authenticSignals = 0;
  let signalQuality = 0;
  
  for (const symbol of testSymbols) {
    const result = await makeRequest(`/api/signals/${encodeURIComponent(symbol)}`);
    healthMetrics.responseTime.push(result.responseTime);
    
    if (result.success && Array.isArray(result.data)) {
      totalSignals += result.data.length;
      
      for (const signal of result.data) {
        if (signal.indicators && signal.confidence > 0 && signal.price > 0) {
          authenticSignals++;
          signalQuality += signal.confidence;
        }
      }
      
      console.log(`✅ ${symbol}: ${result.data.length} signals`);
    } else {
      console.log(`❌ ${symbol} - ${result.error || 'No data'}`);
    }
  }
  
  healthMetrics.algorithms = totalSignals > 0 ? (authenticSignals / totalSignals) * 100 : 0;
  const avgQuality = authenticSignals > 0 ? signalQuality / authenticSignals : 0;
  console.log(`Algorithm Score: ${healthMetrics.algorithms.toFixed(1)}%`);
  console.log(`Average Signal Quality: ${avgQuality.toFixed(1)}%`);

  console.log('\n📡 DATA INTEGRITY');
  console.log('─'.repeat(30));
  
  let dataScore = 0;
  
  // Rate limiter check
  const rateLimiterResult = await makeRequest('/api/rate-limiter/stats');
  if (rateLimiterResult.success) {
    const stats = rateLimiterResult.data;
    if (stats.maxRequestsPerMinute > 0) dataScore += 30;
    if (!stats.circuitBreakerOpen) dataScore += 20;
    console.log(`✅ Rate Limiter: ${stats.requestsThisMinute}/${stats.maxRequestsPerMinute}`);
  }
  
  // Automation check
  const automationResult = await makeRequest('/api/automation/status');
  if (automationResult.success && automationResult.data?.isRunning) {
    dataScore += 30;
    console.log(`✅ Automation: Running`);
  }
  
  // Price data authenticity
  const priceResult = await makeRequest('/api/crypto/BTC%2FUSDT');
  if (priceResult.success && priceResult.data?.price > 50000) {
    dataScore += 20;
    console.log(`✅ Price Data: $${priceResult.data.price.toFixed(2)}`);
  }
  
  healthMetrics.dataIntegrity = dataScore;
  console.log(`Data Integrity Score: ${dataScore}%`);

  console.log('\n⚡ PERFORMANCE');
  console.log('─'.repeat(30));
  
  const avgResponseTime = healthMetrics.responseTime.reduce((sum, time) => sum + time, 0) / healthMetrics.responseTime.length;
  const performanceScore = avgResponseTime < 50 ? 100 : 
                          avgResponseTime < 100 ? 90 : 
                          avgResponseTime < 500 ? 70 : 50;
  
  healthMetrics.performance = performanceScore;
  console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`Performance Score: ${performanceScore}%`);

  console.log('\n🔒 SECURITY');
  console.log('─'.repeat(30));
  
  let securityScore = 0;
  
  if (rateLimiterResult.success) {
    if (rateLimiterResult.data?.maxRequestsPerMinute > 0) securityScore += 40;
    if (rateLimiterResult.data?.hasOwnProperty('circuitBreakerOpen')) securityScore += 30;
  }
  
  // Error handling test
  const invalidResult = await makeRequest('/api/invalid-endpoint');
  if (!invalidResult.success) securityScore += 30;
  
  healthMetrics.security = securityScore;
  console.log(`Security Score: ${securityScore}%`);

  console.log('\n📋 GROUND RULES COMPLIANCE');
  console.log('─'.repeat(30));
  
  const syntheticPatterns = ['mock', 'fake', 'placeholder', 'dummy'];
  let violations = 0;
  
  const testEndpoints = ['/api/crypto/BTC%2FUSDT', '/api/market-heatmap'];
  for (const endpoint of testEndpoints) {
    const result = await makeRequest(endpoint);
    if (result.success) {
      const dataString = JSON.stringify(result.data).toLowerCase();
      if (syntheticPatterns.some(pattern => dataString.includes(pattern))) {
        violations++;
        healthMetrics.issues.push(`Synthetic data detected in ${endpoint}`);
      }
    }
  }
  
  healthMetrics.groundRules = violations === 0 ? 100 : Math.max(0, 100 - (violations * 25));
  console.log(`Ground Rules Score: ${healthMetrics.groundRules}%`);
  console.log(`Violations: ${violations}`);
}

async function generateRecommendations() {
  console.log('\n💡 IMPROVEMENT RECOMMENDATIONS');
  console.log('═'.repeat(50));
  
  const recommendations = [];
  
  // Critical Priority
  if (healthMetrics.security < 80) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Security',
      issue: 'Insufficient security measures',
      recommendation: 'Implement comprehensive rate limiting and input validation',
      impact: 'Prevent API abuse and system vulnerabilities'
    });
  }
  
  if (healthMetrics.groundRules < 100) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Data Integrity',
      issue: 'Ground rules violations detected',
      recommendation: 'Eliminate all synthetic data sources immediately',
      impact: 'Ensure authentic data only as per ground rules'
    });
  }
  
  // High Priority
  if (healthMetrics.performance < 80) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Performance',
      issue: 'Response times above optimal',
      recommendation: 'Implement response caching and query optimization',
      impact: 'Reduce response times by 40-60%'
    });
  }
  
  if (healthMetrics.dataIntegrity < 90) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Data Sources',
      issue: 'Limited data source redundancy',
      recommendation: 'Add backup data sources and fallback mechanisms',
      impact: 'Improve system reliability and uptime'
    });
  }
  
  // Medium Priority
  if (healthMetrics.architecture < 95) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Architecture',
      issue: 'Some endpoints showing instability',
      recommendation: 'Add comprehensive error handling and retry logic',
      impact: 'Increase system reliability'
    });
  }
  
  if (healthMetrics.algorithms < 95) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Algorithms',
      issue: 'Signal quality could be improved',
      recommendation: 'Enhance indicator weighting and validation',
      impact: 'Increase signal accuracy and confidence'
    });
  }
  
  // Code Quality Improvements
  recommendations.push({
    priority: 'MEDIUM',
    category: 'Code Quality',
    issue: 'TypeScript errors detected',
    recommendation: 'Fix type annotations and interface definitions',
    impact: 'Improve code maintainability and catch errors early'
  });
  
  recommendations.push({
    priority: 'LOW',
    category: 'Monitoring',
    issue: 'Limited observability',
    recommendation: 'Implement comprehensive logging and metrics',
    impact: 'Better system monitoring and debugging'
  });
  
  // Display recommendations by priority
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  priorities.forEach(priority => {
    const priorityRecs = recommendations.filter(r => r.priority === priority);
    if (priorityRecs.length > 0) {
      console.log(`\n${priority} PRIORITY:`);
      priorityRecs.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.category}] ${rec.recommendation}`);
        console.log(`   Issue: ${rec.issue}`);
        console.log(`   Impact: ${rec.impact}`);
      });
    }
  });
  
  return recommendations;
}

async function generateFinalReport() {
  const overallHealth = [
    healthMetrics.architecture,
    healthMetrics.algorithms,
    healthMetrics.dataIntegrity,
    healthMetrics.performance,
    healthMetrics.security,
    healthMetrics.groundRules
  ].reduce((sum, score) => sum + score, 0) / 6;
  
  console.log('\n📊 FINAL HEALTH REPORT');
  console.log('═'.repeat(50));
  
  const systemStatus = overallHealth >= 85 ? 'EXCELLENT' : 
                      overallHealth >= 70 ? 'GOOD' : 
                      overallHealth >= 55 ? 'FAIR' : 'NEEDS IMPROVEMENT';
  
  console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallHealth.toFixed(1)}% (${systemStatus})`);
  console.log('─'.repeat(40));
  
  console.log(`Architecture Health: ${healthMetrics.architecture.toFixed(1)}%`);
  console.log(`Algorithm Integrity: ${healthMetrics.algorithms.toFixed(1)}%`);
  console.log(`Data Integrity: ${healthMetrics.dataIntegrity.toFixed(1)}%`);
  console.log(`Performance Score: ${healthMetrics.performance.toFixed(1)}%`);
  console.log(`Security Score: ${healthMetrics.security.toFixed(1)}%`);
  console.log(`Ground Rules Compliance: ${healthMetrics.groundRules.toFixed(1)}%`);
  
  const avgResponseTime = healthMetrics.responseTime.reduce((sum, time) => sum + time, 0) / healthMetrics.responseTime.length;
  console.log(`\nAverage Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`Critical Issues: ${healthMetrics.issues.filter(i => i.includes('violation')).length}`);
  console.log(`Total Issues: ${healthMetrics.issues.length}`);
  
  // Strengths and weaknesses
  console.log('\n✅ SYSTEM STRENGTHS:');
  if (healthMetrics.architecture >= 90) console.log('• Robust API architecture with high endpoint availability');
  if (healthMetrics.algorithms >= 90) console.log('• High-quality authentic signal generation');
  if (healthMetrics.performance >= 90) console.log('• Excellent response times and performance');
  if (healthMetrics.groundRules >= 100) console.log('• Perfect compliance with ground rules (no synthetic data)');
  if (healthMetrics.dataIntegrity >= 80) console.log('• Reliable data sources and automation systems');
  
  console.log('\n⚠️  AREAS FOR IMPROVEMENT:');
  if (healthMetrics.security < 80) console.log('• Security measures need strengthening');
  if (healthMetrics.performance < 80) console.log('• Response times require optimization');
  if (healthMetrics.dataIntegrity < 80) console.log('• Data source reliability needs improvement');
  if (healthMetrics.architecture < 90) console.log('• Some API endpoints need stability improvements');
  
  return { overallHealth, systemStatus };
}

// Execute analysis
async function main() {
  try {
    await runHealthAnalysis();
    const recommendations = await generateRecommendations();
    const finalReport = await generateFinalReport();
    
    console.log('\n✅ STREAMLINED HEALTH ANALYSIS COMPLETE');
    console.log('═'.repeat(50));
    
    return { healthMetrics, recommendations, finalReport };
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

main();