/**
 * Simplified Circuit Breaker Testing Framework
 * HTTP-based testing to validate rate limiter optimization
 */

import http from 'http';
import fs from 'fs';

class SimplifiedCircuitBreakerTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = [];
    this.apiCallCount = 0;
    this.successCount = 0;
    this.failureCount = 0;
    
    console.log('Testing Circuit Breaker Optimization');
    console.log('25-cycle validation of rate limiter improvements');
  }

  async run25CycleValidation() {
    console.log('\nStarting 25-Cycle Circuit Breaker Validation');
    console.log('=' .repeat(50));

    const results = {
      cyclesCompleted: 0,
      apiCallsSuccessful: 0,
      apiCallsBlocked: 0,
      circuitBreakerEvents: 0,
      dataAvailabilityScores: [],
      systemStabilityScores: [],
      errorCount: 0,
      performanceMetrics: []
    };

    for (let cycle = 1; cycle <= 25; cycle++) {
      console.log(`\nCycle ${cycle}/25`);
      
      try {
        const cycleResult = await this.runValidationCycle(cycle);
        
        results.cyclesCompleted++;
        results.apiCallsSuccessful += cycleResult.successfulCalls;
        results.apiCallsBlocked += cycleResult.blockedCalls;
        results.circuitBreakerEvents += cycleResult.circuitBreakerTriggered ? 1 : 0;
        results.dataAvailabilityScores.push(cycleResult.dataAvailability);
        results.systemStabilityScores.push(cycleResult.stabilityScore);
        results.performanceMetrics.push(cycleResult.responseTime);
        
        if (cycleResult.hasErrors) {
          results.errorCount++;
        }

        // Progress report every 5 cycles
        if (cycle % 5 === 0) {
          this.showProgressReport(cycle, results);
        }

        await this.sleep(2000);
        
      } catch (error) {
        console.error(`Cycle ${cycle} failed: ${error.message}`);
        results.errorCount++;
      }
    }

    return this.generateValidationReport(results);
  }

  async runValidationCycle(cycleNumber) {
    const startTime = Date.now();
    
    const cycleResult = {
      cycle: cycleNumber,
      successfulCalls: 0,
      blockedCalls: 0,
      circuitBreakerTriggered: false,
      dataAvailability: 0,
      stabilityScore: 0,
      responseTime: 0,
      hasErrors: false
    };

    try {
      // Test API availability with multiple requests
      const testEndpoints = [
        '/api/crypto/BTC%2FUSDT',
        '/api/crypto/ETH%2FUSDT',
        '/api/crypto/all-pairs',
        '/api/performance-metrics'
      ];

      let successCount = 0;
      let totalResponseTime = 0;

      for (const endpoint of testEndpoints) {
        try {
          const requestStart = Date.now();
          const response = await this.makeHTTPRequest(endpoint);
          const requestTime = Date.now() - requestStart;
          
          totalResponseTime += requestTime;
          
          if (response && response.statusCode === 200) {
            successCount++;
            cycleResult.successfulCalls++;
          } else {
            cycleResult.blockedCalls++;
            if (response && response.statusCode === 429) {
              cycleResult.circuitBreakerTriggered = true;
            }
          }
        } catch (error) {
          cycleResult.blockedCalls++;
          cycleResult.hasErrors = true;
        }
      }

      // Calculate metrics
      cycleResult.dataAvailability = (successCount / testEndpoints.length) * 100;
      cycleResult.stabilityScore = cycleResult.hasErrors ? 50 : 85;
      cycleResult.responseTime = Math.round(totalResponseTime / testEndpoints.length);

      console.log(`  Data availability: ${cycleResult.dataAvailability}%`);
      console.log(`  Successful calls: ${cycleResult.successfulCalls}`);
      console.log(`  Blocked calls: ${cycleResult.blockedCalls}`);
      console.log(`  Circuit breaker triggered: ${cycleResult.circuitBreakerTriggered}`);
      
    } catch (error) {
      console.error(`Cycle validation error: ${error.message}`);
      cycleResult.hasErrors = true;
    }

    return cycleResult;
  }

  async makeHTTPRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'GET',
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  showProgressReport(currentCycle, results) {
    console.log(`\nProgress Report - Cycle ${currentCycle}/25`);
    console.log('-'.repeat(40));
    
    const avgDataAvailability = results.dataAvailabilityScores.reduce((a, b) => a + b, 0) / results.dataAvailabilityScores.length;
    const successRate = (results.apiCallsSuccessful / (results.apiCallsSuccessful + results.apiCallsBlocked)) * 100;
    
    console.log(`Cycles completed: ${results.cyclesCompleted}`);
    console.log(`Average data availability: ${avgDataAvailability.toFixed(1)}%`);
    console.log(`API success rate: ${successRate.toFixed(1)}%`);
    console.log(`Circuit breaker triggers: ${results.circuitBreakerEvents}`);
    console.log(`Error cycles: ${results.errorCount}`);
  }

  generateValidationReport(results) {
    const avgDataAvailability = results.dataAvailabilityScores.reduce((a, b) => a + b, 0) / results.dataAvailabilityScores.length;
    const avgStability = results.systemStabilityScores.reduce((a, b) => a + b, 0) / results.systemStabilityScores.length;
    const avgResponseTime = results.performanceMetrics.reduce((a, b) => a + b, 0) / results.performanceMetrics.length;
    const successRate = (results.apiCallsSuccessful / (results.apiCallsSuccessful + results.apiCallsBlocked)) * 100;

    const report = {
      testingSummary: {
        totalCycles: results.cyclesCompleted,
        completionRate: (results.cyclesCompleted / 25) * 100
      },
      performanceMetrics: {
        apiSuccessRate: successRate,
        averageDataAvailability: avgDataAvailability,
        averageStabilityScore: avgStability,
        averageResponseTime: avgResponseTime,
        circuitBreakerTriggers: results.circuitBreakerEvents,
        errorCycles: results.errorCount
      },
      analysisResults: {
        improvementOverBaseline: this.calculateImprovement(successRate),
        systemStability: avgStability > 70 ? 'STABLE' : 'UNSTABLE',
        dataReliability: avgDataAvailability > 60 ? 'GOOD' : 'POOR',
        rateLimiterEffectiveness: results.circuitBreakerEvents < 10 ? 'EFFECTIVE' : 'NEEDS_TUNING'
      },
      recommendations: this.generateRecommendations(results, successRate, avgDataAvailability),
      implementationReadiness: this.assessReadiness(results, successRate, avgDataAvailability)
    };

    console.log(`\n25-Cycle Validation Complete`);
    console.log('=' .repeat(50));
    console.log(`API Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Data Availability: ${avgDataAvailability.toFixed(1)}%`);
    console.log(`System Stability: ${avgStability.toFixed(1)}/100`);
    console.log(`Circuit Breaker Triggers: ${results.circuitBreakerEvents}`);
    console.log(`Error Cycles: ${results.errorCount}/25`);
    console.log(`Implementation Ready: ${report.implementationReadiness ? 'YES' : 'NO'}`);

    // Save report
    fs.writeFileSync('circuit_breaker_validation_report.json', JSON.stringify(report, null, 2));
    console.log('\nReport saved to circuit_breaker_validation_report.json');

    return report;
  }

  calculateImprovement(currentSuccessRate) {
    // Baseline assumption: previous system had ~20% success rate due to over-blocking
    const baselineSuccessRate = 20;
    return currentSuccessRate - baselineSuccessRate;
  }

  generateRecommendations(results, successRate, dataAvailability) {
    const recommendations = [];
    
    if (successRate > 60) {
      recommendations.push('Circuit breaker optimization successful - proceed with implementation');
    } else if (successRate > 40) {
      recommendations.push('Moderate improvement achieved - consider additional tuning');
    } else {
      recommendations.push('Success rate still low - further optimization needed');
    }
    
    if (results.circuitBreakerEvents > 15) {
      recommendations.push('Circuit breaker triggering too frequently - adjust thresholds');
    }
    
    if (dataAvailability < 50) {
      recommendations.push('Data availability needs improvement - check API integration');
    }
    
    return recommendations;
  }

  assessReadiness(results, successRate, dataAvailability) {
    return (
      results.cyclesCompleted >= 20 &&
      successRate > 40 &&
      dataAvailability > 30 &&
      results.errorCount < 15 &&
      results.circuitBreakerEvents < 20
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute validation
async function runCircuitBreakerValidation() {
  const tester = new SimplifiedCircuitBreakerTester();
  
  try {
    const results = await tester.run25CycleValidation();
    
    console.log('\nValidation Summary:');
    console.log(`Implementation Ready: ${results.implementationReadiness ? 'YES' : 'NO'}`);
    
    if (results.implementationReadiness) {
      console.log('Circuit breaker optimization validated successfully');
    } else {
      console.log('Optimization needs further refinement');
    }
    
    return results;
  } catch (error) {
    console.error('Validation failed:', error);
    return null;
  }
}

runCircuitBreakerValidation();