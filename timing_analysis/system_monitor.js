/**
 * System Timing Monitor
 * Monitors actual timing mechanisms in the running application
 * Extracts real performance data for analysis
 */

const http = require('http');
const fs = require('fs');

class SystemTimingMonitor {
  constructor() {
    this.baseUrl = 'http://localhost:5000'; // Adjust based on actual port
    this.monitoringActive = false;
    this.collectedData = [];
    this.monitoringStartTime = null;
    
    this.endpoints = [
      '/api/signals/BTC/USDT',
      '/api/crypto/BTC/USDT',
      '/api/performance-metrics',
      '/api/rate-limiter/stats',
      '/api/accuracy/BTC/USDT'
    ];
    
    this.timingMetrics = {
      apiLatencies: [],
      signalCalculationTimes: [],
      priceUpdateFrequencies: [],
      cacheHitRatios: [],
      errorRates: []
    };
  }

  /**
   * Start monitoring system timing for specified duration
   */
  async startMonitoring(durationMinutes = 30) {
    console.log(`\n🔍 SYSTEM TIMING MONITOR STARTING`);
    console.log(`Monitoring duration: ${durationMinutes} minutes`);
    console.log(`Base URL: ${this.baseUrl}`);
    console.log('─'.repeat(60));
    
    this.monitoringActive = true;
    this.monitoringStartTime = Date.now();
    
    // Start multiple monitoring streams
    const monitoringPromises = [
      this.monitorApiLatencies(),
      this.monitorSignalCalculations(),
      this.monitorPriceUpdates(),
      this.monitorCachePerformance(),
      this.monitorErrorRates()
    ];
    
    // Set timeout for monitoring duration
    const timeout = new Promise(resolve => {
      setTimeout(() => {
        this.monitoringActive = false;
        resolve();
      }, durationMinutes * 60 * 1000);
    });
    
    // Wait for either timeout or manual stop
    await Promise.race([Promise.all(monitoringPromises), timeout]);
    
    console.log('\n📊 Monitoring completed, generating analysis...');
    await this.analyzeCollectedData();
  }

  /**
   * Monitor API response latencies
   */
  async monitorApiLatencies() {
    console.log('📡 Monitoring API latencies...');
    
    while (this.monitoringActive) {
      for (const endpoint of this.endpoints) {
        try {
          const startTime = Date.now();
          await this.makeRequest(endpoint);
          const latency = Date.now() - startTime;
          
          this.timingMetrics.apiLatencies.push({
            endpoint,
            latency,
            timestamp: Date.now()
          });
          
          console.log(`   ${endpoint}: ${latency}ms`);
          
        } catch (error) {
          console.log(`   ${endpoint}: ERROR - ${error.message}`);
        }
        
        await this.sleep(1000); // 1 second between requests
      }
      
      await this.sleep(5000); // 5 seconds between full cycles
    }
  }

  /**
   * Monitor signal calculation timing
   */
  async monitorSignalCalculations() {
    console.log('⚡ Monitoring signal calculations...');
    
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
    
    while (this.monitoringActive) {
      for (const timeframe of timeframes) {
        try {
          const startTime = Date.now();
          const response = await this.makeRequest(`/api/signals/BTC/USDT?timeframe=${timeframe}`);
          const calculationTime = Date.now() - startTime;
          
          this.timingMetrics.signalCalculationTimes.push({
            timeframe,
            calculationTime,
            signalCount: response.data ? response.data.length : 0,
            timestamp: Date.now()
          });
          
          console.log(`   Signal calc ${timeframe}: ${calculationTime}ms`);
          
        } catch (error) {
          console.log(`   Signal calc ${timeframe}: ERROR`);
        }
        
        await this.sleep(2000);
      }
      
      await this.sleep(10000); // 10 seconds between signal calculation cycles
    }
  }

  /**
   * Monitor price update frequencies
   */
  async monitorPriceUpdates() {
    console.log('💰 Monitoring price update frequencies...');
    
    let lastPriceUpdate = null;
    
    while (this.monitoringActive) {
      try {
        const response = await this.makeRequest('/api/crypto/BTC/USDT');
        const currentTime = Date.now();
        
        if (lastPriceUpdate && response.data && response.data.lastPrice) {
          const updateInterval = currentTime - lastPriceUpdate.timestamp;
          
          this.timingMetrics.priceUpdateFrequencies.push({
            pair: 'BTC/USDT',
            updateInterval,
            price: response.data.lastPrice,
            timestamp: currentTime
          });
          
          console.log(`   Price update interval: ${updateInterval}ms`);
        }
        
        lastPriceUpdate = {
          price: response.data ? response.data.lastPrice : null,
          timestamp: currentTime
        };
        
      } catch (error) {
        console.log(`   Price update: ERROR`);
      }
      
      await this.sleep(3000); // Check every 3 seconds
    }
  }

  /**
   * Monitor cache performance
   */
  async monitorCachePerformance() {
    console.log('🗄️ Monitoring cache performance...');
    
    while (this.monitoringActive) {
      try {
        const response = await this.makeRequest('/api/performance-metrics');
        
        if (response.data && response.data.cacheMetrics) {
          this.timingMetrics.cacheHitRatios.push({
            hitRatio: response.data.cacheMetrics.hitRatio || 0,
            totalRequests: response.data.cacheMetrics.totalRequests || 0,
            cacheSize: response.data.cacheMetrics.cacheSize || 0,
            timestamp: Date.now()
          });
          
          console.log(`   Cache hit ratio: ${((response.data.cacheMetrics.hitRatio || 0) * 100).toFixed(1)}%`);
        }
        
      } catch (error) {
        console.log(`   Cache metrics: ERROR`);
      }
      
      await this.sleep(15000); // Check every 15 seconds
    }
  }

  /**
   * Monitor error rates
   */
  async monitorErrorRates() {
    console.log('🚨 Monitoring error rates...');
    
    let totalRequests = 0;
    let errorCount = 0;
    
    while (this.monitoringActive) {
      const endpoints = ['/api/signals/BTC/USDT', '/api/crypto/ETH/USDT', '/api/performance-metrics'];
      
      for (const endpoint of endpoints) {
        totalRequests++;
        
        try {
          await this.makeRequest(endpoint);
        } catch (error) {
          errorCount++;
          
          this.timingMetrics.errorRates.push({
            endpoint,
            errorType: error.message,
            timestamp: Date.now()
          });
        }
      }
      
      const currentErrorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      console.log(`   Error rate: ${currentErrorRate.toFixed(2)}% (${errorCount}/${totalRequests})`);
      
      await this.sleep(8000); // Check every 8 seconds
    }
  }

  /**
   * Make HTTP request to application endpoint
   */
  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      
      const req = http.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve({ data: parsedData, statusCode: res.statusCode });
          } catch (error) {
            resolve({ data: data, statusCode: res.statusCode });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Analyze collected timing data
   */
  async analyzeCollectedData() {
    const totalDuration = Date.now() - this.monitoringStartTime;
    
    console.log('\n📊 SYSTEM TIMING ANALYSIS RESULTS');
    console.log('═'.repeat(70));
    console.log(`Monitoring Duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`Data Collection Period: ${new Date(this.monitoringStartTime).toISOString()}`);
    
    // API Latency Analysis
    if (this.timingMetrics.apiLatencies.length > 0) {
      console.log('\n🚀 API LATENCY ANALYSIS:');
      const latencyByEndpoint = this.groupBy(this.timingMetrics.apiLatencies, 'endpoint');
      
      for (const [endpoint, latencies] of Object.entries(latencyByEndpoint)) {
        const avgLatency = this.average(latencies.map(l => l.latency));
        const minLatency = Math.min(...latencies.map(l => l.latency));
        const maxLatency = Math.max(...latencies.map(l => l.latency));
        
        console.log(`   ${endpoint}:`);
        console.log(`      Average: ${avgLatency.toFixed(0)}ms`);
        console.log(`      Range: ${minLatency}ms - ${maxLatency}ms`);
        console.log(`      Requests: ${latencies.length}`);
      }
    }
    
    // Signal Calculation Analysis
    if (this.timingMetrics.signalCalculationTimes.length > 0) {
      console.log('\n⚡ SIGNAL CALCULATION ANALYSIS:');
      const calcsByTimeframe = this.groupBy(this.timingMetrics.signalCalculationTimes, 'timeframe');
      
      for (const [timeframe, calculations] of Object.entries(calcsByTimeframe)) {
        const avgTime = this.average(calculations.map(c => c.calculationTime));
        const avgSignals = this.average(calculations.map(c => c.signalCount));
        
        console.log(`   ${timeframe}: ${avgTime.toFixed(0)}ms avg, ${avgSignals.toFixed(1)} signals avg`);
      }
    }
    
    // Price Update Analysis
    if (this.timingMetrics.priceUpdateFrequencies.length > 0) {
      console.log('\n💰 PRICE UPDATE ANALYSIS:');
      const intervals = this.timingMetrics.priceUpdateFrequencies.map(p => p.updateInterval);
      const avgInterval = this.average(intervals);
      const minInterval = Math.min(...intervals);
      const maxInterval = Math.max(...intervals);
      
      console.log(`   Average Update Interval: ${(avgInterval / 1000).toFixed(1)}s`);
      console.log(`   Fastest Update: ${(minInterval / 1000).toFixed(1)}s`);
      console.log(`   Slowest Update: ${(maxInterval / 1000).toFixed(1)}s`);
      console.log(`   Total Updates: ${intervals.length}`);
    }
    
    // Cache Performance Analysis
    if (this.timingMetrics.cacheHitRatios.length > 0) {
      console.log('\n🗄️ CACHE PERFORMANCE ANALYSIS:');
      const hitRatios = this.timingMetrics.cacheHitRatios.map(c => c.hitRatio);
      const avgHitRatio = this.average(hitRatios);
      const totalRequests = this.timingMetrics.cacheHitRatios.reduce((sum, c) => sum + c.totalRequests, 0);
      
      console.log(`   Average Hit Ratio: ${(avgHitRatio * 100).toFixed(1)}%`);
      console.log(`   Total Cache Requests: ${totalRequests}`);
      console.log(`   Cache Samples: ${hitRatios.length}`);
    }
    
    // Error Rate Analysis
    if (this.timingMetrics.errorRates.length > 0) {
      console.log('\n🚨 ERROR ANALYSIS:');
      const errorsByEndpoint = this.groupBy(this.timingMetrics.errorRates, 'endpoint');
      
      for (const [endpoint, errors] of Object.entries(errorsByEndpoint)) {
        console.log(`   ${endpoint}: ${errors.length} errors`);
        
        const errorTypes = this.groupBy(errors, 'errorType');
        for (const [errorType, instances] of Object.entries(errorTypes)) {
          console.log(`      ${errorType}: ${instances.length} occurrences`);
        }
      }
    }
    
    // Generate performance score
    const performanceScore = this.calculatePerformanceScore();
    console.log('\n🎯 OVERALL PERFORMANCE SCORE:');
    console.log(`   Score: ${performanceScore.overall.toFixed(1)}/100`);
    console.log(`   Latency: ${performanceScore.latency.toFixed(1)}/100`);
    console.log(`   Reliability: ${performanceScore.reliability.toFixed(1)}/100`);
    console.log(`   Efficiency: ${performanceScore.efficiency.toFixed(1)}/100`);
    
    // Save detailed results
    await this.saveDetailedResults();
    
    // Generate recommendations
    this.generateRecommendations(performanceScore);
  }

  /**
   * Calculate performance score based on collected metrics
   */
  calculatePerformanceScore() {
    let latencyScore = 100;
    let reliabilityScore = 100;
    let efficiencyScore = 100;
    
    // Latency scoring
    if (this.timingMetrics.apiLatencies.length > 0) {
      const avgLatency = this.average(this.timingMetrics.apiLatencies.map(l => l.latency));
      latencyScore = Math.max(0, 100 - (avgLatency - 100) / 10); // Penalty after 100ms
    }
    
    // Reliability scoring
    const totalApiCalls = this.timingMetrics.apiLatencies.length;
    const totalErrors = this.timingMetrics.errorRates.length;
    if (totalApiCalls > 0) {
      const errorRate = totalErrors / totalApiCalls;
      reliabilityScore = Math.max(0, 100 - (errorRate * 1000)); // Heavy penalty for errors
    }
    
    // Efficiency scoring
    if (this.timingMetrics.cacheHitRatios.length > 0) {
      const avgHitRatio = this.average(this.timingMetrics.cacheHitRatios.map(c => c.hitRatio));
      efficiencyScore = avgHitRatio * 100;
    }
    
    const overall = (latencyScore + reliabilityScore + efficiencyScore) / 3;
    
    return {
      overall,
      latency: latencyScore,
      reliability: reliabilityScore,
      efficiency: efficiencyScore
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(performanceScore) {
    console.log('\n🔧 PERFORMANCE RECOMMENDATIONS:');
    
    const recommendations = [];
    
    if (performanceScore.latency < 80) {
      recommendations.push('Optimize API response times - consider caching and connection pooling');
    }
    
    if (performanceScore.reliability < 95) {
      recommendations.push('Improve error handling and add retry mechanisms');
    }
    
    if (performanceScore.efficiency < 70) {
      recommendations.push('Enhance caching strategy to reduce redundant API calls');
    }
    
    if (this.timingMetrics.signalCalculationTimes.length > 0) {
      const avgCalcTime = this.average(this.timingMetrics.signalCalculationTimes.map(c => c.calculationTime));
      if (avgCalcTime > 1000) {
        recommendations.push('Optimize signal calculation algorithms for better performance');
      }
    }
    
    if (recommendations.length === 0) {
      console.log('   ✅ System performance is optimal - no recommendations needed');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  }

  /**
   * Save detailed results to file
   */
  async saveDetailedResults() {
    const results = {
      timestamp: new Date().toISOString(),
      monitoringDuration: Date.now() - this.monitoringStartTime,
      metrics: this.timingMetrics,
      summary: {
        totalApiCalls: this.timingMetrics.apiLatencies.length,
        totalErrors: this.timingMetrics.errorRates.length,
        monitoringPeriod: {
          start: new Date(this.monitoringStartTime).toISOString(),
          end: new Date().toISOString()
        }
      }
    };
    
    try {
      fs.writeFileSync('timing_analysis/system_monitoring_results.json', 
                      JSON.stringify(results, null, 2));
      console.log('\n📁 Detailed results saved to: timing_analysis/system_monitoring_results.json');
    } catch (error) {
      console.log(`\n❌ Failed to save results: ${error.message}`);
    }
  }

  /**
   * Utility functions
   */
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  average(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SystemTimingMonitor;
}

// Run monitoring if called directly
if (typeof require !== 'undefined' && require.main === module) {
  const monitor = new SystemTimingMonitor();
  
  // Get duration from command line argument or default to 10 minutes for testing
  const duration = process.argv[2] ? parseInt(process.argv[2]) : 10;
  
  monitor.startMonitoring(duration)
    .then(() => {
      console.log('\n🏁 System monitoring completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 System monitoring failed:', error);
      process.exit(1);
    });
}