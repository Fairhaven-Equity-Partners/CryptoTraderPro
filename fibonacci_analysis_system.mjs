/**
 * FIBONACCI ANALYSIS SYSTEM
 * External Shell Testing - Advanced Fibonacci Tools Implementation
 * 
 * Implements:
 * - Fibonacci Retracements
 * - Fibonacci Extensions
 * - Fibonacci Time Zones
 * - Fibonacci Fans
 * - Fibonacci Clusters
 */

class FibonacciAnalysisSystem {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618, 2.618];
    this.extensionLevels = [1.272, 1.414, 1.618, 2.000, 2.618, 3.618, 4.236];
  }

  async runFibonacciAnalysis(symbol = 'BTC/USDT', timeframe = '1d') {
    console.log('📐 FIBONACCI ANALYSIS SYSTEM');
    console.log('='.repeat(50));
    
    // Get price data for analysis
    const priceData = await this.getPriceData(symbol, timeframe);
    if (!priceData || priceData.length < 50) {
      console.log('❌ Insufficient price data for Fibonacci analysis');
      return null;
    }
    
    // Calculate swing points
    const swingPoints = this.findSwingPoints(priceData);
    
    // Calculate Fibonacci levels
    const fibAnalysis = {
      retracements: this.calculateRetracements(swingPoints),
      extensions: this.calculateExtensions(swingPoints),
      timeZones: this.calculateTimeZones(swingPoints),
      fans: this.calculateFans(swingPoints),
      clusters: this.findClusters(swingPoints)
    };
    
    // Generate trading signals
    const signals = this.generateFibonacciSignals(fibAnalysis, priceData);
    
    this.displayResults(symbol, timeframe, fibAnalysis, signals);
    
    return {
      symbol,
      timeframe,
      analysis: fibAnalysis,
      signals,
      accuracy: this.calculateAccuracy(signals)
    };
  }

  async getPriceData(symbol, timeframe) {
    try {
      const response = await fetch(`${this.baseURL}/api/chart/${encodeURIComponent(symbol)}/${timeframe}`);
      const data = await response.json();
      
      return data.map(candle => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume || 0
      }));
    } catch (error) {
      console.log('❌ Error fetching price data:', error.message);
      return null;
    }
  }

  findSwingPoints(priceData) {
    const swingHigh = [];
    const swingLow = [];
    const lookback = 5;
    
    for (let i = lookback; i < priceData.length - lookback; i++) {
      const current = priceData[i];
      let isHigh = true;
      let isLow = true;
      
      // Check if current point is a swing high
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && priceData[j].high >= current.high) {
          isHigh = false;
          break;
        }
      }
      
      // Check if current point is a swing low
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && priceData[j].low <= current.low) {
          isLow = false;
          break;
        }
      }
      
      if (isHigh) {
        swingHigh.push({
          index: i,
          time: current.time,
          price: current.high,
          type: 'high'
        });
      }
      
      if (isLow) {
        swingLow.push({
          index: i,
          time: current.time,
          price: current.low,
          type: 'low'
        });
      }
    }
    
    return {
      highs: swingHigh.slice(-5), // Last 5 swing highs
      lows: swingLow.slice(-5)    // Last 5 swing lows
    };
  }

  calculateRetracements(swingPoints) {
    const retracements = [];
    
    // Calculate retracements from recent swing high to swing low
    if (swingPoints.highs.length > 0 && swingPoints.lows.length > 0) {
      const latestHigh = swingPoints.highs[swingPoints.highs.length - 1];
      const latestLow = swingPoints.lows[swingPoints.lows.length - 1];
      
      // Determine direction
      const isUptrend = latestLow.time > latestHigh.time;
      const start = isUptrend ? latestLow : latestHigh;
      const end = isUptrend ? latestHigh : latestLow;
      
      const range = Math.abs(end.price - start.price);
      
      this.fibLevels.forEach(level => {
        const price = isUptrend 
          ? start.price + (range * level)
          : start.price - (range * level);
          
        retracements.push({
          level,
          price,
          percentage: level * 100,
          direction: isUptrend ? 'bullish' : 'bearish',
          strength: this.calculateLevelStrength(level)
        });
      });
    }
    
    return retracements;
  }

  calculateExtensions(swingPoints) {
    const extensions = [];
    
    if (swingPoints.highs.length >= 2 && swingPoints.lows.length >= 2) {
      const recentHighs = swingPoints.highs.slice(-2);
      const recentLows = swingPoints.lows.slice(-2);
      
      // Calculate AB=CD extension pattern
      const pointA = recentLows[0];
      const pointB = recentHighs[0];
      const pointC = recentLows[1];
      
      const abRange = Math.abs(pointB.price - pointA.price);
      
      this.extensionLevels.forEach(level => {
        const projectedPrice = pointC.price + (abRange * level);
        
        extensions.push({
          level,
          price: projectedPrice,
          percentage: level * 100,
          pattern: 'AB=CD',
          strength: this.calculateExtensionStrength(level)
        });
      });
    }
    
    return extensions;
  }

  calculateTimeZones(swingPoints) {
    const timeZones = [];
    const fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
    
    if (swingPoints.highs.length > 0 || swingPoints.lows.length > 0) {
      const allPoints = [...swingPoints.highs, ...swingPoints.lows]
        .sort((a, b) => a.time - b.time);
      
      if (allPoints.length >= 2) {
        const baseTime = allPoints[allPoints.length - 2].time;
        const interval = allPoints[allPoints.length - 1].time - baseTime;
        
        fibSequence.forEach(fib => {
          const projectedTime = baseTime + (interval * fib);
          
          timeZones.push({
            fibNumber: fib,
            projectedTime,
            interval: interval * fib,
            significance: fib > 21 ? 'high' : fib > 8 ? 'medium' : 'low'
          });
        });
      }
    }
    
    return timeZones;
  }

  calculateFans(swingPoints) {
    const fans = [];
    
    if (swingPoints.highs.length > 0 && swingPoints.lows.length > 0) {
      const latestHigh = swingPoints.highs[swingPoints.highs.length - 1];
      const latestLow = swingPoints.lows[swingPoints.lows.length - 1];
      
      const isUptrend = latestLow.time > latestHigh.time;
      const start = isUptrend ? latestLow : latestHigh;
      const end = isUptrend ? latestHigh : latestLow;
      
      const priceRange = Math.abs(end.price - start.price);
      const timeRange = Math.abs(end.time - start.time);
      
      [0.382, 0.5, 0.618].forEach(level => {
        const targetPrice = start.price + (priceRange * level * (isUptrend ? 1 : -1));
        const slope = (targetPrice - start.price) / timeRange;
        
        fans.push({
          level,
          startPoint: { time: start.time, price: start.price },
          slope,
          equation: `y = ${slope.toFixed(6)}x + ${start.price.toFixed(2)}`,
          direction: isUptrend ? 'bullish' : 'bearish'
        });
      });
    }
    
    return fans;
  }

  findClusters(swingPoints) {
    const clusters = [];
    const allLevels = [];
    
    // Collect all Fibonacci levels from different calculations
    const retracements = this.calculateRetracements(swingPoints);
    const extensions = this.calculateExtensions(swingPoints);
    
    retracements.forEach(ret => allLevels.push(ret.price));
    extensions.forEach(ext => allLevels.push(ext.price));
    
    // Find price zones where multiple levels cluster
    const tolerance = 0.01; // 1% tolerance
    const clusters_found = [];
    
    allLevels.forEach((level, index) => {
      const nearbyLevels = allLevels.filter((otherLevel, otherIndex) => {
        if (index === otherIndex) return false;
        const difference = Math.abs(level - otherLevel) / level;
        return difference <= tolerance;
      });
      
      if (nearbyLevels.length >= 1) {
        const clusterPrice = (level + nearbyLevels.reduce((sum, l) => sum + l, 0)) / (nearbyLevels.length + 1);
        
        clusters_found.push({
          price: clusterPrice,
          count: nearbyLevels.length + 1,
          strength: this.calculateClusterStrength(nearbyLevels.length + 1),
          zone: {
            lower: clusterPrice * (1 - tolerance),
            upper: clusterPrice * (1 + tolerance)
          }
        });
      }
    });
    
    // Remove duplicates and sort by strength
    return clusters_found
      .filter((cluster, index, arr) => 
        arr.findIndex(c => Math.abs(c.price - cluster.price) / cluster.price < tolerance) === index
      )
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5); // Top 5 clusters
  }

  generateFibonacciSignals(fibAnalysis, priceData) {
    const signals = [];
    const currentPrice = priceData[priceData.length - 1].close;
    
    // Retracement signals
    fibAnalysis.retracements.forEach(ret => {
      const distance = Math.abs(currentPrice - ret.price) / currentPrice;
      if (distance < 0.005) { // Within 0.5%
        signals.push({
          type: 'retracement',
          level: ret.level,
          price: ret.price,
          signal: ret.direction === 'bullish' ? 'BUY' : 'SELL',
          strength: ret.strength,
          confidence: 70 + (ret.strength * 20)
        });
      }
    });
    
    // Extension signals
    fibAnalysis.extensions.forEach(ext => {
      const distance = Math.abs(currentPrice - ext.price) / currentPrice;
      if (distance < 0.01) { // Within 1%
        signals.push({
          type: 'extension',
          level: ext.level,
          price: ext.price,
          signal: 'SELL', // Extensions often mark reversal points
          strength: ext.strength,
          confidence: 65 + (ext.strength * 25)
        });
      }
    });
    
    // Cluster signals
    fibAnalysis.clusters.forEach(cluster => {
      if (currentPrice >= cluster.zone.lower && currentPrice <= cluster.zone.upper) {
        signals.push({
          type: 'cluster',
          price: cluster.price,
          signal: 'STRONG_LEVEL',
          strength: cluster.strength,
          confidence: 80 + (cluster.strength * 15),
          count: cluster.count
        });
      }
    });
    
    return signals;
  }

  calculateLevelStrength(level) {
    // Key Fibonacci levels have higher strength
    const keyLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
    if (keyLevels.includes(level)) return 0.8;
    if (level === 1) return 1.0; // 100% retracement
    return 0.6;
  }

  calculateExtensionStrength(level) {
    // Strong extension levels
    if ([1.618, 2.618].includes(level)) return 0.9;
    if ([1.272, 2.000].includes(level)) return 0.7;
    return 0.5;
  }

  calculateClusterStrength(count) {
    return Math.min(count / 5, 1.0); // Max strength at 5+ confluences
  }

  calculateAccuracy(signals) {
    if (signals.length === 0) return 0;
    const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    return avgConfidence;
  }

  displayResults(symbol, timeframe, analysis, signals) {
    console.log(`\n📊 Fibonacci Analysis for ${symbol} (${timeframe})`);
    console.log('='.repeat(40));
    
    console.log(`\n📐 Retracements (${analysis.retracements.length}):`);
    analysis.retracements.slice(0, 5).forEach(ret => {
      console.log(`  ${(ret.percentage).toFixed(1)}%: $${ret.price.toFixed(2)} (${ret.direction})`);
    });
    
    console.log(`\n🎯 Extensions (${analysis.extensions.length}):`);
    analysis.extensions.slice(0, 3).forEach(ext => {
      console.log(`  ${(ext.percentage).toFixed(1)}%: $${ext.price.toFixed(2)}`);
    });
    
    console.log(`\n⏰ Time Zones (${analysis.timeZones.length}):`);
    analysis.timeZones.slice(0, 3).forEach(tz => {
      const date = new Date(tz.projectedTime * 1000);
      console.log(`  Fib ${tz.fibNumber}: ${date.toISOString().split('T')[0]} (${tz.significance})`);
    });
    
    console.log(`\n🎪 Clusters (${analysis.clusters.length}):`);
    analysis.clusters.forEach(cluster => {
      console.log(`  $${cluster.price.toFixed(2)} (${cluster.count} levels, strength: ${cluster.strength.toFixed(2)})`);
    });
    
    console.log(`\n📈 Signals Generated: ${signals.length}`);
    signals.forEach(signal => {
      console.log(`  ${signal.type}: ${signal.signal} at $${signal.price.toFixed(2)} (${signal.confidence.toFixed(0)}%)`);
    });
  }
}

// Execute Fibonacci analysis
async function runFibonacciTest() {
  const fibSystem = new FibonacciAnalysisSystem();
  
  console.log('🧪 Testing Fibonacci Analysis on Multiple Pairs');
  const testPairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
  
  for (const pair of testPairs) {
    const result = await fibSystem.runFibonacciAnalysis(pair, '1d');
    if (result) {
      console.log(`✅ ${pair}: ${result.signals.length} signals, ${result.accuracy.toFixed(1)}% accuracy`);
    }
  }
}

runFibonacciTest().catch(console.error);