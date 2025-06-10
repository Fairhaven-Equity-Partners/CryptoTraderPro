/**
 * Comprehensive Codebase Analysis Framework
 * 35-cycle complete system validation with API rate limit protection
 */

import { execSync } from 'child_process';

class ComprehensiveCodebaseAnalyzer {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.cycles = 35;
    this.currentCycle = 0;
    this.results = {
      endpoints: new Map(),
      components: new Map(),
      dataFlow: new Map(),
      performance: new Map(),
      errors: [],
      apiUsage: { requests: 0, errors: 0 },
      systemHealth: { uptime: 0, stability: 0 }
    };
    this.testSections = [
      'core-endpoints',
      'data-integrity', 
      'phase-validation',
      'real-time-systems',
      'performance-metrics',
      'api-efficiency',
      'error-handling',
      'authentic-data-flow'
    ];
  }

  async executeComprehensiveAnalysis() {
    console.log('🔬 COMPREHENSIVE CODEBASE ANALYSIS');
    console.log('==================================');
    console.log(`Target: ${this.cycles} complete cycles`);
    console.log(`Sections: ${this.testSections.length} areas per cycle`);
    console.log('API Rate Limit Protection: ACTIVE\n');

    const startTime = Date.now();

    for (let cycle = 1; cycle <= this.cycles; cycle++) {
      this.currentCycle = cycle;
      console.log(`\n📊 CYCLE ${cycle}/${this.cycles}`);
      console.log('=' + '='.repeat(20));

      await this.executeCycle(cycle);
      await this.rateLimitDelay();
      
      if (cycle % 5 === 0) {
        this.generateProgressReport(cycle);
      }
    }

    const totalDuration = Date.now() - startTime;
    return this.generateFinalAnalysisReport(totalDuration);
  }

  async executeCycle(cycleNumber) {
    for (const section of this.testSections) {
      try {
        await this.analyzeSection(section, cycleNumber);
      } catch (error) {
        this.recordError(section, cycleNumber, error.message);
      }
    }
  }

  async analyzeSection(section, cycle) {
    switch (section) {
      case 'core-endpoints':
        await this.analyzeCoreEndpoints(cycle);
        break;
      case 'data-integrity':
        await this.analyzeDataIntegrity(cycle);
        break;
      case 'phase-validation':
        await this.analyzePhaseValidation(cycle);
        break;
      case 'real-time-systems':
        await this.analyzeRealTimeSystems(cycle);
        break;
      case 'performance-metrics':
        await this.analyzePerformanceMetrics(cycle);
        break;
      case 'api-efficiency':
        await this.analyzeAPIEfficiency(cycle);
        break;
      case 'error-handling':
        await this.analyzeErrorHandling(cycle);
        break;
      case 'authentic-data-flow':
        await this.analyzeAuthenticDataFlow(cycle);
        break;
    }
  }

  async analyzeCoreEndpoints(cycle) {
    const endpoints = [
      '/api/crypto',
      '/api/crypto/all-pairs',
      '/api/automation/status',
      '/api/performance-metrics',
      '/api/market-heatmap',
      '/api/signals/BTC/USDT'
    ];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint);
      this.recordEndpointResult('core-endpoints', endpoint, cycle, result);
    }
  }

  async analyzeDataIntegrity(cycle) {
    const dataEndpoints = [
      '/api/authentic-data/status',
      '/api/authentic-system/status',
      '/api/rate-limiter/stats',
      '/api/timing/metrics'
    ];

    for (const endpoint of dataEndpoints) {
      const result = await this.testEndpoint(endpoint);
      this.validateDataAuthenticity(result, endpoint, cycle);
    }
  }

  async analyzePhaseValidation(cycle) {
    const phases = [
      { endpoint: '/api/authentic-data/status', phase: 'Phase 1' },
      { endpoint: '/api/authentic-system/status', phase: 'Phase 2' },
      { endpoint: '/api/feedback/performance-report', phase: 'Phase 3' },
      { endpoint: '/api/phase4/system-status', phase: 'Phase 4' }
    ];

    for (const { endpoint, phase } of phases) {
      const result = await this.testEndpoint(endpoint);
      this.validatePhaseIntegrity(result, phase, cycle);
    }
  }

  async analyzeRealTimeSystems(cycle) {
    // Test streaming status
    const streamingStatus = await this.testEndpoint('/api/streaming/status');
    this.validateStreamingSystem(streamingStatus, cycle);

    // Test price updates
    const priceData = await this.testEndpoint('/api/crypto/BTC/USDT');
    this.validatePriceAccuracy(priceData, cycle);

    // Test signal generation
    const signals = await this.testEndpoint('/api/signals/BTC/USDT');
    this.validateSignalQuality(signals, cycle);
  }

  async analyzePerformanceMetrics(cycle) {
    const performanceData = await this.testEndpoint('/api/performance-metrics');
    this.validatePerformanceData(performanceData, cycle);

    // Test specific symbol performance
    const btcAccuracy = await this.testEndpoint('/api/accuracy/BTC/USDT');
    this.validateAccuracyMetrics(btcAccuracy, cycle);
  }

  async analyzeAPIEfficiency(cycle) {
    const rateLimiterStats = await this.testEndpoint('/api/rate-limiter/stats');
    this.validateAPIEfficiency(rateLimiterStats, cycle);

    const timingMetrics = await this.testEndpoint('/api/timing/metrics');
    this.validateTimingEfficiency(timingMetrics, cycle);
  }

  async analyzeErrorHandling(cycle) {
    // Test invalid endpoints
    const invalidResult = await this.testEndpoint('/api/invalid-endpoint');
    this.validateErrorResponse(invalidResult, cycle);

    // Test malformed requests
    try {
      const malformedResult = await this.makeRequest('/api/signals', 'POST', { invalid: 'data' });
      this.validateErrorHandling(malformedResult, cycle);
    } catch (error) {
      this.recordExpectedError(cycle, error.message);
    }
  }

  async analyzeAuthenticDataFlow(cycle) {
    // Test authentic data accumulation
    const authenticStatus = await this.testEndpoint('/api/authentic-data/status');
    this.validateAuthenticAccumulation(authenticStatus, cycle);

    // Test technical analysis authenticity
    const technicalAnalysis = await this.testEndpoint('/api/authentic-technical-analysis/BTC/USDT');
    this.validateTechnicalAuthenticity(technicalAnalysis, cycle);
  }

  async testEndpoint(endpoint) {
    try {
      const result = await this.makeRequest(endpoint);
      this.results.apiUsage.requests++;
      return {
        success: true,
        data: result,
        responseTime: Date.now() - this.requestStart,
        endpoint
      };
    } catch (error) {
      this.results.apiUsage.errors++;
      return {
        success: false,
        error: error.message,
        endpoint
      };
    }
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    this.requestStart = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    let curlCommand;

    if (method === 'POST' && data) {
      curlCommand = `curl -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify(data)}' "${url}"`;
    } else if (method === 'POST') {
      curlCommand = `curl -s -X POST "${url}"`;
    } else {
      curlCommand = `curl -s "${url}"`;
    }

    try {
      const result = execSync(curlCommand, { encoding: 'utf8', timeout: 10000 });
      return JSON.parse(result);
    } catch (error) {
      if (error.stdout) {
        try {
          const response = JSON.parse(error.stdout);
          if (response.error) {
            throw new Error(response.error);
          }
          return response;
        } catch (parseError) {
          throw new Error(`Request failed: ${error.message}`);
        }
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  recordEndpointResult(section, endpoint, cycle, result) {
    if (!this.results.endpoints.has(endpoint)) {
      this.results.endpoints.set(endpoint, {
        totalTests: 0,
        successes: 0,
        failures: 0,
        avgResponseTime: 0,
        responseTimes: []
      });
    }

    const stats = this.results.endpoints.get(endpoint);
    stats.totalTests++;
    
    if (result.success) {
      stats.successes++;
      stats.responseTimes.push(result.responseTime);
      stats.avgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
    } else {
      stats.failures++;
    }

    console.log(`  ${endpoint}: ${result.success ? '✓' : '✗'} (${result.responseTime || 'N/A'}ms)`);
  }

  validateDataAuthenticity(result, endpoint, cycle) {
    if (!result.success) return;

    const data = result.data;
    let isAuthentic = true;
    const issues = [];

    // Check for synthetic data indicators
    if (data.synthetic === true) {
      isAuthentic = false;
      issues.push('Synthetic data detected');
    }

    if (data.fallback === true) {
      isAuthentic = false;
      issues.push('Fallback data detected');
    }

    // Check for authentic data markers
    if (data.source && !data.source.includes('CoinMarketCap') && !data.source.includes('authentic')) {
      issues.push('Non-authentic data source');
    }

    this.recordDataIntegrityResult(endpoint, cycle, isAuthentic, issues);
  }

  validatePhaseIntegrity(result, phase, cycle) {
    if (!result.success) return;

    const data = result.data;
    let phaseHealthy = true;
    const issues = [];

    switch (phase) {
      case 'Phase 1':
        if (!data.system || data.system.totalSymbols < 50) {
          phaseHealthy = false;
          issues.push('Insufficient symbols in Phase 1');
        }
        break;
      case 'Phase 2':
        if (!data.phase2Implementation || data.phase2Implementation.status !== 'active') {
          phaseHealthy = false;
          issues.push('Phase 2 not active');
        }
        break;
      case 'Phase 3':
        if (!data.feedbackSystem || data.feedbackSystem.status !== 'active') {
          phaseHealthy = false;
          issues.push('Phase 3 feedback system not active');
        }
        break;
      case 'Phase 4':
        if (!data.phase4Active || !data.syntheticEliminationComplete) {
          phaseHealthy = false;
          issues.push('Phase 4 synthetic elimination incomplete');
        }
        break;
    }

    this.recordPhaseValidation(phase, cycle, phaseHealthy, issues);
  }

  validatePerformanceData(data, cycle) {
    if (!data || !data.indicators) {
      this.recordError('performance-metrics', cycle, 'Missing performance indicators');
      return;
    }

    const issues = [];
    
    // Check for complete indicator set
    const expectedIndicators = ['MACD', 'RSI', 'Bollinger Bands', 'SMA Cross', 'EMA Cross'];
    for (const expected of expectedIndicators) {
      const found = data.indicators.find(ind => ind.indicator === expected);
      if (!found) {
        issues.push(`Missing indicator: ${expected}`);
      }
    }

    // Validate indicator data completeness
    data.indicators.forEach(indicator => {
      if (!indicator.accuracyRate || indicator.accuracyRate < 0) {
        issues.push(`Invalid accuracy rate for ${indicator.indicator}`);
      }
      if (!indicator.totalPredictions || indicator.totalPredictions < 0) {
        issues.push(`Invalid prediction count for ${indicator.indicator}`);
      }
    });

    this.recordPerformanceValidation(cycle, issues.length === 0, issues);
  }

  recordError(section, cycle, error) {
    this.results.errors.push({
      section,
      cycle,
      error,
      timestamp: new Date().toISOString()
    });
  }

  recordDataIntegrityResult(endpoint, cycle, isAuthentic, issues) {
    console.log(`  Data Integrity [${endpoint}]: ${isAuthentic ? '✓' : '✗'} ${issues.length > 0 ? `(${issues.join(', ')})` : ''}`);
  }

  recordPhaseValidation(phase, cycle, healthy, issues) {
    console.log(`  ${phase}: ${healthy ? '✓' : '✗'} ${issues.length > 0 ? `(${issues.join(', ')})` : ''}`);
  }

  recordPerformanceValidation(cycle, valid, issues) {
    console.log(`  Performance Data: ${valid ? '✓' : '✗'} ${issues.length > 0 ? `(${issues.join(', ')})` : ''}`);
  }

  async rateLimitDelay() {
    // Intelligent delay to stay within API limits
    const delay = Math.min(2000, Math.max(500, this.results.apiUsage.errors * 100));
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  generateProgressReport(cycle) {
    const successRate = this.calculateSuccessRate();
    const errorRate = (this.results.apiUsage.errors / this.results.apiUsage.requests) * 100;

    console.log(`\n📈 PROGRESS REPORT - CYCLE ${cycle}/${this.cycles}`);
    console.log('======================================');
    console.log(`Overall Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`API Error Rate: ${errorRate.toFixed(1)}%`);
    console.log(`Total Requests: ${this.results.apiUsage.requests}`);
    console.log(`Errors Recorded: ${this.results.errors.length}`);
  }

  calculateSuccessRate() {
    if (this.results.apiUsage.requests === 0) return 0;
    const successfulRequests = this.results.apiUsage.requests - this.results.apiUsage.errors;
    return (successfulRequests / this.results.apiUsage.requests) * 100;
  }

  generateFinalAnalysisReport(totalDuration) {
    const successRate = this.calculateSuccessRate();
    const avgResponseTime = this.calculateAverageResponseTime();

    console.log('\n🎯 FINAL COMPREHENSIVE ANALYSIS REPORT');
    console.log('=====================================');
    console.log(`Analysis Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`Total Cycles Completed: ${this.cycles}`);
    console.log(`Total API Requests: ${this.results.apiUsage.requests}`);
    console.log(`Overall Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
    console.log(`Total Errors: ${this.results.errors.length}`);

    console.log('\n📊 ENDPOINT ANALYSIS');
    console.log('===================');
    for (const [endpoint, stats] of this.results.endpoints) {
      const endpointSuccessRate = (stats.successes / stats.totalTests) * 100;
      console.log(`${endpoint}:`);
      console.log(`  Success Rate: ${endpointSuccessRate.toFixed(1)}% (${stats.successes}/${stats.totalTests})`);
      console.log(`  Avg Response Time: ${stats.avgResponseTime.toFixed(1)}ms`);
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(successRate);
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('==================');
    recommendations.forEach(rec => console.log(`• ${rec}`));

    // Identify performance metrics issues
    const performanceIssues = this.identifyPerformanceIssues();
    
    console.log('\n🔧 PERFORMANCE METRICS ISSUES IDENTIFIED');
    console.log('=======================================');
    performanceIssues.forEach(issue => console.log(`• ${issue}`));

    return {
      successRate,
      totalDuration,
      totalRequests: this.results.apiUsage.requests,
      totalErrors: this.results.errors.length,
      avgResponseTime,
      recommendations,
      performanceIssues,
      readyForOptimization: successRate > 80 && this.results.errors.length < 10
    };
  }

  calculateAverageResponseTime() {
    const allTimes = [];
    for (const [, stats] of this.results.endpoints) {
      allTimes.push(...stats.responseTimes);
    }
    return allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
  }

  generateRecommendations(successRate) {
    const recommendations = [];

    if (successRate < 90) {
      recommendations.push('Investigate failing endpoints and improve error handling');
    }

    if (this.results.apiUsage.errors > this.results.apiUsage.requests * 0.1) {
      recommendations.push('Optimize API usage to reduce error rate');
    }

    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime > 1000) {
      recommendations.push('Optimize response times for better user experience');
    }

    if (this.results.errors.length > 0) {
      recommendations.push('Address recorded errors to improve system stability');
    }

    recommendations.push('Continue monitoring authentic data accumulation progress');
    recommendations.push('Verify all four phases remain operational and integrated');

    return recommendations;
  }

  identifyPerformanceIssues() {
    const issues = [];

    // Check for common performance data issues
    const performanceErrors = this.results.errors.filter(err => 
      err.section === 'performance-metrics' || 
      err.error.includes('performance') ||
      err.error.includes('indicator')
    );

    if (performanceErrors.length > 0) {
      issues.push('Performance metrics API returning incomplete data');
      issues.push('Indicator data validation failures detected');
    }

    // Check endpoint-specific issues
    const performanceEndpoint = this.results.endpoints.get('/api/performance-metrics');
    if (performanceEndpoint && performanceEndpoint.failures > 0) {
      issues.push('Performance metrics endpoint experiencing failures');
    }

    if (issues.length === 0) {
      issues.push('No specific performance metrics issues detected in analysis');
      issues.push('May require investigation of data completeness in UI rendering');
    }

    return issues;
  }
}

// Execute comprehensive analysis
async function main() {
  const analyzer = new ComprehensiveCodebaseAnalyzer();
  const results = await analyzer.executeComprehensiveAnalysis();
  
  console.log('\n🚀 ANALYSIS COMPLETE');
  console.log('===================');
  console.log(`System Status: ${results.readyForOptimization ? 'READY FOR OPTIMIZATION' : 'NEEDS ATTENTION'}`);
  
  process.exit(results.readyForOptimization ? 0 : 1);
}

main().catch(error => {
  console.error('Analysis error:', error);
  process.exit(1);
});