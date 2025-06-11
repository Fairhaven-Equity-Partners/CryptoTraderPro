/**
 * CoinMarketCap API Usage Analyzer & Rate Limiting Strategy
 * Target: Keep usage under 30,000 calls/month during development
 */

import fs from 'fs';

class APIUsageAnalyzer {
  constructor() {
    this.targetMonthlyLimit = 30000;
    this.dailyLimit = Math.floor(this.targetMonthlyLimit / 30); // 1000 calls/day
    this.hourlyLimit = Math.floor(this.dailyLimit / 24); // 42 calls/hour
    this.minuteLimit = Math.max(1, Math.floor(this.hourlyLimit / 60)); // 1 call/minute minimum
    
    console.log(`🎯 API LIMITS: ${this.targetMonthlyLimit}/month, ${this.dailyLimit}/day, ${this.hourlyLimit}/hour`);
  }

  analyzeCurrentUsage() {
    // Current system analysis based on observed behavior
    const currentSystems = {
      priceStreamer: {
        description: 'Individual API calls for each symbol',
        symbolCount: 50,
        intervalSeconds: 30,
        callsPerSymbol: 1
      },
      automatedSignals: {
        description: 'Batch API call every 4 minutes',
        symbolCount: 50,
        intervalSeconds: 240,
        callsPerSymbol: 0.02 // 1 batch call for 50 symbols
      },
      userRequests: {
        description: 'Individual user-triggered requests',
        estimatedDaily: 100
      }
    };

    // Calculate current usage
    const streamerHourly = Math.ceil((3600 / currentSystems.priceStreamer.intervalSeconds) * currentSystems.priceStreamer.symbolCount);
    const signalsHourly = Math.ceil(3600 / currentSystems.automatedSignals.intervalSeconds);
    const userHourly = Math.ceil(currentSystems.userRequests.estimatedDaily / 24);

    const currentUsage = {
      priceStreamer: {
        hourly: streamerHourly,
        daily: streamerHourly * 24,
        monthly: streamerHourly * 24 * 30
      },
      automatedSignals: {
        hourly: signalsHourly,
        daily: signalsHourly * 24,
        monthly: signalsHourly * 24 * 30
      },
      userRequests: {
        hourly: userHourly,
        daily: currentSystems.userRequests.estimatedDaily,
        monthly: currentSystems.userRequests.estimatedDaily * 30
      }
    };

    currentUsage.total = {
      hourly: currentUsage.priceStreamer.hourly + currentUsage.automatedSignals.hourly + currentUsage.userRequests.hourly,
      daily: currentUsage.priceStreamer.daily + currentUsage.automatedSignals.daily + currentUsage.userRequests.daily,
      monthly: currentUsage.priceStreamer.monthly + currentUsage.automatedSignals.monthly + currentUsage.userRequests.monthly
    };

    return { currentSystems, currentUsage };
  }

  designOptimizedStrategy() {
    const strategies = [
      {
        name: 'Smart Caching',
        description: 'Cache prices based on volatility and importance',
        implementation: {
          highPriority: '1 minute cache (BTC, ETH, top 5)',
          mediumPriority: '3 minute cache (top 20)',
          lowPriority: '5 minute cache (remaining)',
          volatilityBonus: 'Reduce cache time by 50% during high volatility'
        },
        expectedSavings: 0.6
      },
      {
        name: 'Batch Optimization',
        description: 'Use batch calls wherever possible',
        implementation: {
          priceStreamer: 'Single batch call every 2 minutes instead of individual calls',
          automatedSignals: 'Already optimized with batch calls'
        },
        expectedSavings: 0.8
      },
      {
        name: 'Priority Tiers',
        description: 'Different update frequencies for different importance levels',
        implementation: {
          tier1: 'BTC, ETH, BNB, XRP, SOL - every 1 minute',
          tier2: 'Next 15 symbols - every 2 minutes',
          tier3: 'Remaining 30 symbols - every 5 minutes'
        },
        expectedSavings: 0.4
      },
      {
        name: 'Circuit Breaker',
        description: 'Automatic throttling when approaching limits',
        implementation: {
          warning: '70% of daily limit - extend cache times',
          throttle: '85% of daily limit - reduce update frequency',
          emergency: '95% of daily limit - pause non-essential updates'
        },
        expectedSavings: 0.2
      }
    ];

    return strategies;
  }

  generateOptimizedConfig() {
    return {
      rateLimiting: {
        dailyLimit: this.dailyLimit,
        hourlyLimit: this.hourlyLimit,
        minuteLimit: this.minuteLimit,
        burstLimit: 3,
        resetIntervals: {
          minute: 60000,
          hour: 3600000,
          day: 86400000
        }
      },
      caching: {
        strategies: {
          tier1: { ttl: 60000, symbols: ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'] },
          tier2: { ttl: 120000, symbols: ['USDC', 'ADA', 'AVAX', 'DOGE', 'TRX', 'TON', 'LINK', 'MATIC', 'SHIB', 'LTC', 'BCH', 'UNI', 'DOT', 'XLM', 'ATOM'] },
          tier3: { ttl: 300000, symbols: [] } // Will be populated with remaining
        },
        volatilityMultiplier: 0.5, // Reduce cache time by 50% during high volatility
        minTTL: 30000, // Minimum 30 seconds
        maxTTL: 600000 // Maximum 10 minutes
      },
      batchOptimization: {
        enabled: true,
        maxBatchSize: 50,
        batchInterval: 120000, // 2 minutes
        fallbackToIndividual: true
      },
      circuitBreaker: {
        thresholds: {
          warning: 0.7,
          throttle: 0.85,
          emergency: 0.95
        },
        actions: {
          warning: 'extend_cache_times',
          throttle: 'reduce_frequency',
          emergency: 'pause_non_essential'
        },
        resetInterval: 3600000 // 1 hour
      }
    };
  }

  simulateOptimizedUsage(config) {
    // Calculate with batch optimization
    const batchCallsPerHour = Math.ceil(3600 / (config.batchOptimization.batchInterval / 1000));
    const signalCallsPerHour = Math.ceil(3600 / 240); // Every 4 minutes
    const userCallsPerHour = Math.ceil(50 / 24); // Reduced user calls due to better caching

    const optimizedUsage = {
      batchPriceUpdates: {
        hourly: batchCallsPerHour,
        daily: batchCallsPerHour * 24,
        monthly: batchCallsPerHour * 24 * 30
      },
      automatedSignals: {
        hourly: signalCallsPerHour,
        daily: signalCallsPerHour * 24,
        monthly: signalCallsPerHour * 24 * 30
      },
      userRequests: {
        hourly: userCallsPerHour,
        daily: userCallsPerHour * 24,
        monthly: userCallsPerHour * 24 * 30
      }
    };

    optimizedUsage.total = {
      hourly: optimizedUsage.batchPriceUpdates.hourly + optimizedUsage.automatedSignals.hourly + optimizedUsage.userRequests.hourly,
      daily: optimizedUsage.batchPriceUpdates.daily + optimizedUsage.automatedSignals.daily + optimizedUsage.userRequests.daily,
      monthly: optimizedUsage.batchPriceUpdates.monthly + optimizedUsage.automatedSignals.monthly + optimizedUsage.userRequests.monthly
    };

    return optimizedUsage;
  }

  runAnalysis() {
    console.log('\n=== CoinMarketCap API Usage Analysis ===');
    
    const { currentUsage } = this.analyzeCurrentUsage();
    const strategies = this.designOptimizedStrategy();
    const config = this.generateOptimizedConfig();
    const optimizedUsage = this.simulateOptimizedUsage(config);

    console.log('\n📊 CURRENT USAGE (ESTIMATED):');
    console.log(`   Hourly: ${currentUsage.total.hourly} calls`);
    console.log(`   Daily: ${currentUsage.total.daily} calls`);
    console.log(`   Monthly: ${currentUsage.total.monthly} calls`);
    console.log(`   Status: ${currentUsage.total.monthly > this.targetMonthlyLimit ? '❌ EXCEEDS LIMIT' : '✅ WITHIN LIMIT'}`);

    console.log('\n🚀 OPTIMIZED USAGE (PROJECTED):');
    console.log(`   Hourly: ${optimizedUsage.total.hourly} calls`);
    console.log(`   Daily: ${optimizedUsage.total.daily} calls`);
    console.log(`   Monthly: ${optimizedUsage.total.monthly} calls`);
    console.log(`   Safety Margin: ${this.targetMonthlyLimit - optimizedUsage.total.monthly} calls`);

    const savings = currentUsage.total.monthly - optimizedUsage.total.monthly;
    const savingsPercent = Math.round((savings / currentUsage.total.monthly) * 100);
    console.log(`   💰 Savings: ${savings} calls/month (${savingsPercent}%)`);

    console.log('\n🛡️ OPTIMIZATION STRATEGIES:');
    strategies.forEach((strategy, i) => {
      console.log(`   ${i + 1}. ${strategy.name} - ${Math.round(strategy.expectedSavings * 100)}% reduction`);
    });

    console.log('\n⚙️ CONFIGURATION SUMMARY:');
    console.log(`   Daily Limit: ${config.rateLimiting.dailyLimit} calls`);
    console.log(`   Hourly Limit: ${config.rateLimiting.hourlyLimit} calls`);
    console.log(`   Batch Interval: ${config.batchOptimization.batchInterval / 1000}s`);
    console.log(`   Cache TTL: ${config.caching.strategies.tier1.ttl / 1000}s - ${config.caching.strategies.tier3.ttl / 1000}s`);

    return {
      currentUsage,
      optimizedUsage,
      strategies,
      config,
      analysis: {
        isWithinLimit: optimizedUsage.total.monthly <= this.targetMonthlyLimit,
        safetyMargin: this.targetMonthlyLimit - optimizedUsage.total.monthly,
        savingsPercent
      }
    };
  }
}

// Run the analysis
const analyzer = new APIUsageAnalyzer();
const results = analyzer.runAnalysis();

// Save results for implementation
const reportData = {
  timestamp: new Date().toISOString(),
  analysis: results,
  recommendations: [
    'Implement batch API calls for price streaming',
    'Use tiered caching based on symbol importance',
    'Add circuit breaker protection at 70%/85%/95% thresholds',
    'Monitor usage in real-time with alerts',
    'Cache aggressively during low volatility periods'
  ]
};

fs.writeFileSync('api_analysis_report.json', JSON.stringify(reportData, null, 2));
console.log('\n📋 Full analysis saved to api_analysis_report.json');

export { APIUsageAnalyzer, results };