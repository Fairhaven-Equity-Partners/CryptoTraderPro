/**
 * 10-Cycle Rate Limiter Test Simulation
 * Validates the throttling system under various load scenarios
 */

import { AdvancedRateLimiter, SmartCacheManager } from './rate_limiter.js';
import fs from 'fs';

class RateLimiterTestSuite {
  constructor() {
    this.testResults = [];
    this.scenarios = [
      { name: 'Normal Load', requestsPerMinute: 5, duration: 60000 },
      { name: 'High Load', requestsPerMinute: 20, duration: 60000 },
      { name: 'Burst Load', requestsPerMinute: 50, duration: 30000 },
      { name: 'Sustained Load', requestsPerMinute: 10, duration: 300000 },
      { name: 'Emergency Load', requestsPerMinute: 100, duration: 60000 },
      { name: 'Mixed Priority', requestsPerMinute: 15, duration: 120000 },
      { name: 'Cache Heavy', requestsPerMinute: 8, duration: 180000 },
      { name: 'Circuit Breaker Test', requestsPerMinute: 200, duration: 60000 },
      { name: 'Recovery Test', requestsPerMinute: 3, duration: 240000 },
      { name: 'Real World Sim', requestsPerMinute: 12, duration: 600000 }
    ];
  }

  async runCycle(cycleNumber, scenario) {
    console.log(`\n🔄 CYCLE ${cycleNumber}: ${scenario.name}`);
    console.log(`   Requests/min: ${scenario.requestsPerMinute}, Duration: ${scenario.duration/1000}s`);
    
    const rateLimiter = new AdvancedRateLimiter({
      monthlyLimit: 30000,
      dailyLimit: 1000,
      hourlyLimit: 41,
      minuteLimit: 1,
      burstLimit: 3
    });

    const cacheManager = new SmartCacheManager();
    const results = {
      cycle: cycleNumber,
      scenario: scenario.name,
      totalRequests: 0,
      allowedRequests: 0,
      deniedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0,
      circuitBreakerTriggered: false,
      finalUtilization: {},
      errors: []
    };

    const startTime = Date.now();
    const interval = 60000 / scenario.requestsPerMinute;
    let requestCount = 0;
    let totalResponseTime = 0;

    // Simulate requests
    while (Date.now() - startTime < scenario.duration) {
      const requestId = `req_${cycleNumber}_${requestCount++}`;
      const symbol = this.getRandomSymbol();
      const priority = this.getRandomPriority();
      
      const requestStart = Date.now();
      
      try {
        // Check cache first
        const cachedData = cacheManager.get(symbol);
        if (cachedData) {
          results.cacheHits++;
          await this.sleep(10); // Simulate fast cache response
        } else {
          results.cacheMisses++;
          
          // Request permission from rate limiter
          const permission = await rateLimiter.requestPermission(requestId, priority);
          
          if (permission.allowed) {
            results.allowedRequests++;
            
            // Simulate API call
            await this.sleep(this.simulateApiCallTime());
            
            // Cache the result
            const volatility = Math.sin(Date.now() / 4000) * 0.4 + 0.5 * 0.1; // 0-10% volatility
            cacheManager.set(symbol, { price: Math.sin(Date.now() / 4000) * 0.4 + 0.5 * 100000 }, volatility);
          } else {
            results.deniedRequests++;
            
            if (permission.reason === 'circuit_breaker_open') {
              results.circuitBreakerTriggered = true;
            }
            
            // Wait for suggested retry time
            if (permission.retryAfter) {
              await this.sleep(Math.min(permission.retryAfter, 5000));
            }
          }
        }
        
        results.totalRequests++;
        totalResponseTime += Date.now() - requestStart;
        
        // Wait between requests
        await this.sleep(interval);
        
      } catch (error) {
        results.errors.push({
          requestId,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }

    // Calculate final metrics
    results.avgResponseTime = totalResponseTime / results.totalRequests;
    results.finalUtilization = rateLimiter.getStatistics().utilization;
    results.successRate = (results.allowedRequests / results.totalRequests * 100).toFixed(1);
    results.cacheHitRate = (results.cacheHits / (results.cacheHits + results.cacheMisses) * 100).toFixed(1);

    console.log(`   ✅ Completed: ${results.totalRequests} requests, ${results.successRate}% success`);
    console.log(`   📊 Cache hit rate: ${results.cacheHitRate}%, Avg response: ${results.avgResponseTime.toFixed(0)}ms`);
    
    if (results.circuitBreakerTriggered) {
      console.log(`   🚨 Circuit breaker activated during test`);
    }

    return results;
  }

  getRandomSymbol() {
    const symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'DOGE', 'LINK', 'MATIC', 'LTC'];
    return symbols[Math.floor(Math.sin(Date.now() / 4000) * 0.4 + 0.5 * symbols.length)];
  }

  getRandomPriority() {
    const priorities = ['high', 'normal', 'low'];
    const weights = [0.2, 0.6, 0.2]; // 20% high, 60% normal, 20% low
    const random = Math.sin(Date.now() / 4000) * 0.4 + 0.5;
    
    if (random < weights[0]) return priorities[0];
    if (random < weights[0] + weights[1]) return priorities[1];
    return priorities[2];
  }

  simulateApiCallTime() {
    // Simulate realistic API response times (50-500ms)
    return 50 + Math.sin(Date.now() / 4000) * 0.4 + 0.5 * 450;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllCycles() {
    console.log('🧪 Starting 10-Cycle Rate Limiter Test Simulation');
    console.log('🎯 Target: Validate 30k/month limit with various load patterns\n');

    const startTime = Date.now();
    
    for (let i = 0; i < this.scenarios.length; i++) {
      const scenario = this.scenarios[i];
      const result = await this.runCycle(i + 1, scenario);
      this.testResults.push(result);
      
      // Brief pause between cycles
      await this.sleep(2000);
    }

    const totalDuration = Date.now() - startTime;
    this.generateReport(totalDuration);
  }

  generateReport(totalDuration) {
    const summary = {
      totalCycles: this.testResults.length,
      totalDuration: totalDuration,
      overallStats: {
        totalRequests: this.testResults.reduce((sum, r) => sum + r.totalRequests, 0),
        totalAllowed: this.testResults.reduce((sum, r) => sum + r.allowedRequests, 0),
        totalDenied: this.testResults.reduce((sum, r) => sum + r.deniedRequests, 0),
        avgSuccessRate: (this.testResults.reduce((sum, r) => sum + parseFloat(r.successRate), 0) / this.testResults.length).toFixed(1),
        avgCacheHitRate: (this.testResults.reduce((sum, r) => sum + parseFloat(r.cacheHitRate), 0) / this.testResults.length).toFixed(1),
        circuitBreakerActivations: this.testResults.filter(r => r.circuitBreakerTriggered).length
      },
      detailedResults: this.testResults
    };

    console.log('\n📋 === 10-CYCLE TEST SIMULATION REPORT ===');
    console.log(`Total Duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`Total Requests: ${summary.overallStats.totalRequests}`);
    console.log(`Overall Success Rate: ${summary.overallStats.avgSuccessRate}%`);
    console.log(`Average Cache Hit Rate: ${summary.overallStats.avgCacheHitRate}%`);
    console.log(`Circuit Breaker Activations: ${summary.overallStats.circuitBreakerActivations}`);

    console.log('\n📊 CYCLE-BY-CYCLE RESULTS:');
    this.testResults.forEach((result, i) => {
      console.log(`${i + 1}. ${result.scenario}: ${result.successRate}% success, ${result.cacheHitRate}% cache hit`);
    });

    // Estimate monthly usage
    const avgRequestsPerMinute = summary.overallStats.totalRequests / (totalDuration / 60000);
    const estimatedMonthlyUsage = avgRequestsPerMinute * 60 * 24 * 30;
    
    console.log('\n🔮 MONTHLY PROJECTION:');
    console.log(`Estimated requests/month: ${Math.round(estimatedMonthlyUsage)}`);
    console.log(`Within 30k limit: ${estimatedMonthlyUsage <= 30000 ? '✅ YES' : '❌ NO'}`);
    console.log(`Safety margin: ${30000 - estimatedMonthlyUsage > 0 ? '+' : ''}${Math.round(30000 - estimatedMonthlyUsage)} calls`);

    // Performance analysis
    console.log('\n⚡ PERFORMANCE ANALYSIS:');
    const bestPerforming = this.testResults.reduce((best, current) => 
      parseFloat(current.successRate) > parseFloat(best.successRate) ? current : best
    );
    const worstPerforming = this.testResults.reduce((worst, current) => 
      parseFloat(current.successRate) < parseFloat(worst.successRate) ? current : worst
    );
    
    console.log(`Best performing: ${bestPerforming.scenario} (${bestPerforming.successRate}% success)`);
    console.log(`Worst performing: ${worstPerforming.scenario} (${worstPerforming.successRate}% success)`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (summary.overallStats.avgSuccessRate >= 90) {
      console.log('✅ Rate limiter performing excellently');
    } else if (summary.overallStats.avgSuccessRate >= 75) {
      console.log('⚠️  Rate limiter needs minor tuning');
    } else {
      console.log('🚨 Rate limiter needs significant adjustments');
    }

    if (parseFloat(summary.overallStats.avgCacheHitRate) >= 70) {
      console.log('✅ Caching strategy very effective');
    } else {
      console.log('⚠️  Consider extending cache TTL times');
    }

    if (estimatedMonthlyUsage <= 25000) {
      console.log('✅ Well within monthly limits - safe to deploy');
    } else if (estimatedMonthlyUsage <= 30000) {
      console.log('⚠️  Close to monthly limit - monitor closely');
    } else {
      console.log('🚨 Exceeds monthly limit - increase cache times');
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary,
      recommendations: [
        estimatedMonthlyUsage <= 30000 ? 'Safe to deploy to production' : 'Increase cache TTL before deployment',
        summary.overallStats.avgSuccessRate >= 90 ? 'Rate limiter tuned correctly' : 'Adjust rate limiter thresholds',
        summary.overallStats.circuitBreakerActivations > 5 ? 'Circuit breaker too sensitive' : 'Circuit breaker working properly'
      ]
    };

    fs.writeFileSync('rate_limiter_test_report.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Detailed report saved to rate_limiter_test_report.json');

    return summary;
  }
}

// Run the test simulation
const testSuite = new RateLimiterTestSuite();
testSuite.runAllCycles().then(() => {
  console.log('\n🎉 All 10 cycles completed successfully!');
}).catch(error => {
  console.error('❌ Test simulation failed:', error);
});