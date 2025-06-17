/**
 * COMPREHENSIVE 10-MINUTE BASELINE TEST
 * Full system validation before perfection implementation
 * Testing all measures for 100% achievement targets
 */

import fetch from 'node-fetch';

class Comprehensive10MinBaselineTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testDuration = 10 * 60 * 1000; // 10 minutes
    this.results = {
      connectivity: [],
      signalGeneration: [],
      crossPairSwitching: [],
      patternRecognition: [],
      technicalAnalysis: [],
      monteCarloRisk: [],
      performanceMetrics: [],
      uiDisplayAccuracy: [],
      realTimeUpdates: []
    };
    this.startTime = Date.now();
  }

  async runComprehensive10MinTest() {
    console.log('🎯 COMPREHENSIVE 10-MINUTE BASELINE TEST');
    console.log('=========================================');
    console.log('Testing all system measures for 100% achievement targets');
    console.log(`Duration: ${this.testDuration / 1000} seconds\n`);

    const endTime = this.startTime + this.testDuration;
    let testCycle = 1;

    while (Date.now() < endTime) {
      const cycleStart = Date.now();
      console.log(`\n--- TEST CYCLE ${testCycle} ---`);
      
      // Core system tests
      await this.testSystemConnectivity(testCycle);
      await this.testSignalGenerationAccuracy(testCycle);
      await this.testCrossPairSwitching(testCycle);
      await this.testPatternRecognition(testCycle);
      await this.testTechnicalAnalysis(testCycle);
      await this.testMonteCarloRisk(testCycle);
      await this.testPerformanceMetrics(testCycle);
      await this.testUIDisplayAccuracy(testCycle);
      
      const cycleTime = Date.now() - cycleStart;
      console.log(`   Cycle ${testCycle} completed in ${cycleTime}ms`);
      
      testCycle++;
      await this.sleep(5000); // 5-second interval between cycles
    }

    this.generateComprehensiveReport();
  }

  async testSystemConnectivity(cycle) {
    console.log(`📡 Testing connectivity (Cycle ${cycle})...`);
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`, {
        timeout: 5000
      });
      
      const isConnected = response.ok;
      this.results.connectivity.push({ cycle, connected: isConnected, timestamp: Date.now() });
      
      if (isConnected) {
        console.log(`   ✅ Connected: ${response.status}`);
      } else {
        console.log(`   ❌ Failed: ${response.status}`);
      }
    } catch (error) {
      this.results.connectivity.push({ cycle, connected: false, error: error.message, timestamp: Date.now() });
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  async testSignalGenerationAccuracy(cycle) {
    console.log(`📊 Testing signal generation (Cycle ${cycle})...`);
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
    let successfulSignals = 0;
    let totalSignals = 0;

    for (const timeframe of timeframes) {
      try {
        totalSignals++;
        const response = await fetch(
          `${this.baseUrl}/api/signals?symbol=BTC%2FUSDT&timeframe=${timeframe}`,
          { timeout: 8000 }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0 && data[0].confidence > 0) {
            successfulSignals++;
            console.log(`   ✅ ${timeframe}: ${data[0].direction} ${data[0].confidence}%`);
          }
        }
        
        await this.sleep(200);
      } catch (error) {
        console.log(`   ❌ ${timeframe}: ${error.message}`);
      }
    }

    const accuracy = (successfulSignals / totalSignals) * 100;
    this.results.signalGeneration.push({ 
      cycle, 
      accuracy, 
      successful: successfulSignals, 
      total: totalSignals,
      timestamp: Date.now() 
    });
    
    console.log(`   📈 Signal Generation: ${successfulSignals}/${totalSignals} (${accuracy.toFixed(1)}%)`);
  }

  async testCrossPairSwitching(cycle) {
    console.log(`🔄 Testing cross-pair switching (Cycle ${cycle})...`);
    const pairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'BNB/USDT'];
    let successfulSwitches = 0;
    let totalSwitches = 0;

    for (const pair of pairs) {
      try {
        totalSwitches++;
        const encodedPair = encodeURIComponent(pair);
        const response = await fetch(
          `${this.baseUrl}/api/signals?symbol=${encodedPair}&timeframe=4h`,
          { timeout: 6000 }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0 && data[0].symbol === pair) {
            successfulSwitches++;
            console.log(`   ✅ ${pair}: ${data[0].direction} ${data[0].confidence}%`);
          }
        }
        
        await this.sleep(300);
      } catch (error) {
        console.log(`   ❌ ${pair}: ${error.message}`);
      }
    }

    const switchingAccuracy = (successfulSwitches / totalSwitches) * 100;
    this.results.crossPairSwitching.push({ 
      cycle, 
      accuracy: switchingAccuracy, 
      successful: successfulSwitches, 
      total: totalSwitches,
      timestamp: Date.now() 
    });
    
    console.log(`   🔄 Cross-pair Switching: ${successfulSwitches}/${totalSwitches} (${switchingAccuracy.toFixed(1)}%)`);
  }

  async testPatternRecognition(cycle) {
    console.log(`🔍 Testing pattern recognition (Cycle ${cycle})...`);
    try {
      const response = await fetch(`${this.baseUrl}/api/pattern-analysis/BTC%2FUSDT`, {
        timeout: 6000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.patterns) {
          const patternCount = data.patterns.length;
          const avgConfidence = data.patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / patternCount;
          
          this.results.patternRecognition.push({ 
            cycle, 
            patterns: patternCount, 
            avgConfidence, 
            success: true,
            timestamp: Date.now() 
          });
          
          console.log(`   ✅ Patterns: ${patternCount}, Avg Confidence: ${avgConfidence.toFixed(1)}%`);
        } else {
          this.results.patternRecognition.push({ cycle, success: false, timestamp: Date.now() });
          console.log(`   ❌ Invalid pattern data`);
        }
      }
    } catch (error) {
      this.results.patternRecognition.push({ cycle, success: false, error: error.message, timestamp: Date.now() });
      console.log(`   ❌ Pattern recognition: ${error.message}`);
    }
  }

  async testTechnicalAnalysis(cycle) {
    console.log(`📈 Testing technical analysis (Cycle ${cycle})...`);
    try {
      const response = await fetch(
        `${this.baseUrl}/api/technical-analysis?symbol=BTC%2FUSDT&timeframe=4h`,
        { timeout: 6000 }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.indicators) {
          const indicatorCount = Object.keys(data.indicators).length;
          
          this.results.technicalAnalysis.push({ 
            cycle, 
            indicators: indicatorCount, 
            success: true,
            timestamp: Date.now() 
          });
          
          console.log(`   ✅ Technical Analysis: ${indicatorCount} indicators`);
        } else {
          this.results.technicalAnalysis.push({ cycle, success: false, timestamp: Date.now() });
          console.log(`   ❌ Invalid technical analysis data`);
        }
      }
    } catch (error) {
      this.results.technicalAnalysis.push({ cycle, success: false, error: error.message, timestamp: Date.now() });
      console.log(`   ❌ Technical analysis: ${error.message}`);
    }
  }

  async testMonteCarloRisk(cycle) {
    console.log(`🎲 Testing Monte Carlo risk (Cycle ${cycle})...`);
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '4h' }),
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.volatility !== undefined) {
          this.results.monteCarloRisk.push({ 
            cycle, 
            volatility: data.volatility, 
            riskLevel: data.riskLevel, 
            success: true,
            timestamp: Date.now() 
          });
          
          console.log(`   ✅ Monte Carlo: ${data.riskLevel} risk, ${data.volatility}% volatility`);
        } else {
          this.results.monteCarloRisk.push({ cycle, success: false, timestamp: Date.now() });
          console.log(`   ❌ Invalid Monte Carlo data`);
        }
      }
    } catch (error) {
      this.results.monteCarloRisk.push({ cycle, success: false, error: error.message, timestamp: Date.now() });
      console.log(`   ❌ Monte Carlo: ${error.message}`);
    }
  }

  async testPerformanceMetrics(cycle) {
    console.log(`📱 Testing performance metrics (Cycle ${cycle})...`);
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`, {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.indicators && Array.isArray(data.indicators)) {
          this.results.performanceMetrics.push({ 
            cycle, 
            indicators: data.indicators.length, 
            success: true,
            timestamp: Date.now() 
          });
          
          console.log(`   ✅ Performance: ${data.indicators.length} indicators`);
        } else {
          this.results.performanceMetrics.push({ cycle, success: false, timestamp: Date.now() });
          console.log(`   ❌ Invalid performance data`);
        }
      }
    } catch (error) {
      this.results.performanceMetrics.push({ cycle, success: false, error: error.message, timestamp: Date.now() });
      console.log(`   ❌ Performance metrics: ${error.message}`);
    }
  }

  async testUIDisplayAccuracy(cycle) {
    console.log(`🖥️  Testing UI display accuracy (Cycle ${cycle})...`);
    // Test signal data structure for UI compatibility
    try {
      const response = await fetch(`${this.baseUrl}/api/signals?symbol=BTC%2FUSDT&timeframe=4h`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const signal = data[0];
          const hasRequiredFields = signal.symbol && signal.direction && 
                                  signal.confidence !== undefined && signal.entryPrice !== undefined;
          
          this.results.uiDisplayAccuracy.push({ 
            cycle, 
            hasRequiredFields, 
            confidence: signal.confidence,
            timestamp: Date.now() 
          });
          
          if (hasRequiredFields) {
            console.log(`   ✅ UI Data: Complete signal structure`);
          } else {
            console.log(`   ❌ UI Data: Missing required fields`);
          }
        }
      }
    } catch (error) {
      this.results.uiDisplayAccuracy.push({ cycle, success: false, error: error.message, timestamp: Date.now() });
      console.log(`   ❌ UI display test: ${error.message}`);
    }
  }

  generateComprehensiveReport() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\n🎯 COMPREHENSIVE 10-MINUTE BASELINE REPORT');
    console.log('==========================================');
    console.log(`⏱️  Total Test Duration: ${totalTime} seconds\n`);
    
    // Calculate success rates for each component
    const connectivityRate = this.calculateSuccessRate(this.results.connectivity, 'connected');
    const signalGenerationRate = this.calculateAverageAccuracy(this.results.signalGeneration);
    const crossPairRate = this.calculateAverageAccuracy(this.results.crossPairSwitching);
    const patternRecognitionRate = this.calculateSuccessRate(this.results.patternRecognition, 'success');
    const technicalAnalysisRate = this.calculateSuccessRate(this.results.technicalAnalysis, 'success');
    const monteCarloRate = this.calculateSuccessRate(this.results.monteCarloRisk, 'success');
    const performanceMetricsRate = this.calculateSuccessRate(this.results.performanceMetrics, 'success');
    const uiDisplayRate = this.calculateSuccessRate(this.results.uiDisplayAccuracy, 'hasRequiredFields');
    
    console.log('📊 SYSTEM COMPONENT PERFORMANCE:');
    console.log(`📡 System Connectivity: ${connectivityRate.toFixed(1)}%`);
    console.log(`📊 Signal Generation: ${signalGenerationRate.toFixed(1)}%`);
    console.log(`🔄 Cross-pair Switching: ${crossPairRate.toFixed(1)}%`);
    console.log(`🔍 Pattern Recognition: ${patternRecognitionRate.toFixed(1)}%`);
    console.log(`📈 Technical Analysis: ${technicalAnalysisRate.toFixed(1)}%`);
    console.log(`🎲 Monte Carlo Risk: ${monteCarloRate.toFixed(1)}%`);
    console.log(`📱 Performance Metrics: ${performanceMetricsRate.toFixed(1)}%`);
    console.log(`🖥️  UI Display Accuracy: ${uiDisplayRate.toFixed(1)}%`);
    
    // Calculate overall system health
    const overallHealth = (
      connectivityRate + signalGenerationRate + crossPairRate + 
      patternRecognitionRate + technicalAnalysisRate + monteCarloRate + 
      performanceMetricsRate + uiDisplayRate
    ) / 8;
    
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallHealth.toFixed(1)}%`);
    
    // Identify areas needing improvement
    console.log('\n🔧 IMPROVEMENT OPPORTUNITIES:');
    if (connectivityRate < 100) console.log(`   ⚠️  System Connectivity: ${connectivityRate.toFixed(1)}% (Target: 100%)`);
    if (signalGenerationRate < 90) console.log(`   ⚠️  Signal Generation: ${signalGenerationRate.toFixed(1)}% (Target: 90%+)`);
    if (crossPairRate < 100) console.log(`   ⚠️  Cross-pair Switching: ${crossPairRate.toFixed(1)}% (Target: 100%)`);
    if (patternRecognitionRate < 95) console.log(`   ⚠️  Pattern Recognition: ${patternRecognitionRate.toFixed(1)}% (Target: 95%+)`);
    if (technicalAnalysisRate < 100) console.log(`   ⚠️  Technical Analysis: ${technicalAnalysisRate.toFixed(1)}% (Target: 100%)`);
    if (monteCarloRate < 95) console.log(`   ⚠️  Monte Carlo Risk: ${monteCarloRate.toFixed(1)}% (Target: 95%+)`);
    if (performanceMetricsRate < 100) console.log(`   ⚠️  Performance Metrics: ${performanceMetricsRate.toFixed(1)}% (Target: 100%)`);
    if (uiDisplayRate < 100) console.log(`   ⚠️  UI Display Accuracy: ${uiDisplayRate.toFixed(1)}% (Target: 100%)`);
    
    if (overallHealth >= 95) {
      console.log('\n✅ SYSTEM STATUS: EXCELLENT - Ready for perfection implementation');
    } else if (overallHealth >= 80) {
      console.log('\n⚠️  SYSTEM STATUS: GOOD - Minor optimizations needed');
    } else {
      console.log('\n❌ SYSTEM STATUS: NEEDS IMPROVEMENT - Stability fixes required');
    }
    
    return {
      overallHealth,
      componentRates: {
        connectivity: connectivityRate,
        signalGeneration: signalGenerationRate,
        crossPair: crossPairRate,
        patternRecognition: patternRecognitionRate,
        technicalAnalysis: technicalAnalysisRate,
        monteCarlo: monteCarloRate,
        performanceMetrics: performanceMetricsRate,
        uiDisplay: uiDisplayRate
      }
    };
  }

  calculateSuccessRate(results, field) {
    if (results.length === 0) return 0;
    const successful = results.filter(r => r[field] === true).length;
    return (successful / results.length) * 100;
  }

  calculateAverageAccuracy(results) {
    if (results.length === 0) return 0;
    const totalAccuracy = results.reduce((sum, r) => sum + (r.accuracy || 0), 0);
    return totalAccuracy / results.length;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive 10-minute baseline test
async function main() {
  const tester = new Comprehensive10MinBaselineTest();
  await tester.runComprehensive10MinTest();
}

main().catch(console.error);