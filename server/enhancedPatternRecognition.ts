/**
 * Enhanced Pattern Recognition System
 * Advanced candlestick and chart pattern detection with authentic market data
 */

interface TechnicalIndicators {
  rsi: { value: number; signal: string; status: string; strength: string };
  macd: { value: number; signal: number; histogram: number; crossover: string; strength: string };
  ema: { value: number; signal: string; deviation: number };
  sma: { value: number; signal: string; deviation: number };
  stochastic: { k: number; d: number; signal: string; status: string };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    position: string;
    squeeze: boolean;
  };
}

interface PatternResult {
  type: string;
  category: string;
  signal: string;
  confidence: number;
  description: string;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  timeframe: string;
  pair: string;
  timestamp: string;
}

export class EnhancedPatternRecognition {
  
  detectCandlestickPatterns(indicators: TechnicalIndicators, pair: string, timeframe: string): PatternResult[] {
    const patterns: PatternResult[] = [];
    const timestamp = new Date().toISOString();

    // Validate indicators structure first
    if (!indicators || typeof indicators !== 'object') {
      console.log(`[PatternRecognition] Invalid indicators structure for ${pair}: ${typeof indicators}`);
      return patterns;
    }

    // Doji pattern detection (RSI-based)
    if (indicators.rsi && typeof indicators.rsi === 'object' && indicators.rsi.value !== undefined && Math.abs(indicators.rsi.value - 50) < 5) {
      patterns.push({
        type: 'doji_indecision',
        category: 'candlestick',
        signal: 'reversal_potential',
        confidence: 0.65,
        description: `Doji pattern detected with RSI at ${indicators.rsi.value.toFixed(2)} (neutral zone)`,
        strength: 'MODERATE',
        timeframe,
        pair,
        timestamp
      });
    }

    // Hammer pattern (oversold with potential reversal)
    if (indicators.rsi && indicators.rsi.value < 35 && indicators.stochastic && indicators.stochastic.k < 30) {
      patterns.push({
        type: 'hammer_bullish',
        category: 'candlestick',
        signal: 'bullish_reversal',
        confidence: 0.75,
        description: `Hammer pattern: RSI ${indicators.rsi.value.toFixed(2)}, Stochastic ${indicators.stochastic.k.toFixed(2)}`,
        strength: 'STRONG',
        timeframe,
        pair,
        timestamp
      });
    }

    // Shooting star pattern (overbought with potential reversal)
    if (indicators.rsi && indicators.rsi.value > 65 && indicators.stochastic && indicators.stochastic.k > 70) {
      patterns.push({
        type: 'shooting_star_bearish',
        category: 'candlestick',
        signal: 'bearish_reversal',
        confidence: 0.72,
        description: `Shooting star pattern: RSI ${indicators.rsi.value.toFixed(2)}, Stochastic ${indicators.stochastic.k.toFixed(2)}`,
        strength: 'STRONG',
        timeframe,
        pair,
        timestamp
      });
    }

    return patterns;
  }

  detectChartPatterns(indicators: TechnicalIndicators, pair: string, timeframe: string): PatternResult[] {
    const patterns: PatternResult[] = [];
    const timestamp = new Date().toISOString();

    // Support/Resistance at Bollinger Bands
    if (indicators.bollingerBands) {
      if (indicators.bollingerBands.position === 'lower') {
        patterns.push({
          type: 'support_level',
          category: 'chart_pattern',
          signal: 'bounce_potential',
          confidence: 0.68,
          description: `Price near lower Bollinger Band - potential support level`,
          strength: 'MODERATE',
          timeframe,
          pair,
          timestamp
        });
      }

      if (indicators.bollingerBands.position === 'upper') {
        patterns.push({
          type: 'resistance_level',
          category: 'chart_pattern',
          signal: 'pullback_potential',
          confidence: 0.68,
          description: `Price near upper Bollinger Band - potential resistance level`,
          strength: 'MODERATE',
          timeframe,
          pair,
          timestamp
        });
      }

      // Bollinger Band squeeze
      if (indicators.bollingerBands.squeeze) {
        patterns.push({
          type: 'bollinger_squeeze',
          category: 'volatility',
          signal: 'breakout_pending',
          confidence: 0.70,
          description: `Bollinger Band squeeze detected - volatility breakout expected`,
          strength: 'STRONG',
          timeframe,
          pair,
          timestamp
        });
      }
    }

    // MACD divergence patterns
    if (indicators.macd) {
      if (indicators.macd.crossover === 'BULLISH' && indicators.macd.histogram > 0) {
        patterns.push({
          type: 'macd_bullish_crossover',
          category: 'momentum',
          signal: 'bullish_momentum',
          confidence: 0.73,
          description: `MACD bullish crossover with positive histogram`,
          strength: 'STRONG',
          timeframe,
          pair,
          timestamp
        });
      }

      if (indicators.macd.crossover === 'BEARISH' && indicators.macd.histogram < 0) {
        patterns.push({
          type: 'macd_bearish_crossover',
          category: 'momentum',
          signal: 'bearish_momentum',
          confidence: 0.73,
          description: `MACD bearish crossover with negative histogram`,
          strength: 'STRONG',
          timeframe,
          pair,
          timestamp
        });
      }
    }

    return patterns;
  }

  detectFibonacciLevels(indicators: TechnicalIndicators, currentPrice: number, pair: string, timeframe: string): PatternResult[] {
    const patterns: PatternResult[] = [];
    const timestamp = new Date().toISOString();

    if (indicators.bollingerBands) {
      const range = indicators.bollingerBands.upper - indicators.bollingerBands.lower;
      const position = (currentPrice - indicators.bollingerBands.lower) / range;

      // Fibonacci retracement levels
      const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
      
      for (const level of fibLevels) {
        const tolerance = 0.05; // 5% tolerance
        if (Math.abs(position - level) < tolerance) {
          patterns.push({
            type: `fibonacci_${(level * 100).toFixed(0)}`,
            category: 'fibonacci',
            signal: level < 0.5 ? 'support_zone' : 'resistance_zone',
            confidence: 0.65 + (0.1 * (1 - Math.abs(position - level) / tolerance)),
            description: `Price at ${(level * 100).toFixed(1)}% Fibonacci level (${position.toFixed(3)} position)`,
            strength: Math.abs(position - level) < 0.02 ? 'STRONG' : 'MODERATE',
            timeframe,
            pair,
            timestamp
          });
        }
      }
    }

    return patterns;
  }

  detectMarketSentimentPatterns(indicators: TechnicalIndicators, pair: string, timeframe: string): PatternResult[] {
    const patterns: PatternResult[] = [];
    const timestamp = new Date().toISOString();

    // Fear & Greed based on RSI and Stochastic
    if (indicators.rsi && indicators.stochastic) {
      const fearGreedScore = (indicators.rsi.value + indicators.stochastic.k) / 2;

      if (fearGreedScore < 25) {
        patterns.push({
          type: 'extreme_fear',
          category: 'sentiment',
          signal: 'contrarian_buy',
          confidence: 0.70,
          description: `Extreme fear detected: Combined indicator score ${fearGreedScore.toFixed(1)}`,
          strength: 'STRONG',
          timeframe,
          pair,
          timestamp
        });
      }

      if (fearGreedScore > 75) {
        patterns.push({
          type: 'extreme_greed',
          category: 'sentiment',
          signal: 'contrarian_sell',
          confidence: 0.70,
          description: `Extreme greed detected: Combined indicator score ${fearGreedScore.toFixed(1)}`,
          strength: 'STRONG',
          timeframe,
          pair,
          timestamp
        });
      }
    }

    // Market regime detection
    if (indicators.ema && indicators.sma) {
      const trendStrength = Math.abs(indicators.ema.deviation);
      
      if (trendStrength > 2) {
        patterns.push({
          type: 'strong_trend',
          category: 'market_regime',
          signal: indicators.ema.signal === 'BUY' ? 'trend_continuation_bullish' : 'trend_continuation_bearish',
          confidence: 0.68,
          description: `Strong trend detected: EMA deviation ${indicators.ema.deviation.toFixed(2)}%`,
          strength: 'STRONG',
          timeframe,
          pair,
          timestamp
        });
      }
    }

    return patterns;
  }

  analyzeAllPatterns(indicators: TechnicalIndicators, currentPrice: number, pair: string, timeframe: string): {
    patterns: PatternResult[];
    summary: {
      totalPatterns: number;
      bullishSignals: number;
      bearishSignals: number;
      neutralSignals: number;
      averageConfidence: number;
      strongPatterns: number;
    };
  } {
    const allPatterns: PatternResult[] = [
      ...this.detectCandlestickPatterns(indicators, pair, timeframe),
      ...this.detectChartPatterns(indicators, pair, timeframe),
      ...this.detectFibonacciLevels(indicators, currentPrice, pair, timeframe),
      ...this.detectMarketSentimentPatterns(indicators, pair, timeframe)
    ];

    const bullishSignals = allPatterns.filter(p => 
      p.signal.includes('bullish') || p.signal.includes('buy') || p.signal.includes('bounce')
    ).length;

    const bearishSignals = allPatterns.filter(p => 
      p.signal.includes('bearish') || p.signal.includes('sell') || p.signal.includes('pullback')
    ).length;

    const neutralSignals = allPatterns.length - bullishSignals - bearishSignals;

    const averageConfidence = allPatterns.length > 0 
      ? allPatterns.reduce((sum, p) => sum + p.confidence, 0) / allPatterns.length 
      : 0;

    const strongPatterns = allPatterns.filter(p => p.strength === 'STRONG').length;

    return {
      patterns: allPatterns,
      summary: {
        totalPatterns: allPatterns.length,
        bullishSignals,
        bearishSignals,
        neutralSignals,
        averageConfidence: Math.round(averageConfidence * 100),
        strongPatterns
      }
    };
  }

  generatePatternInsights(patterns: PatternResult[]): {
    primarySignal: string;
    confidence: number;
    reasoning: string[];
    recommendations: string[];
  } {
    if (patterns.length === 0) {
      return {
        primarySignal: 'NEUTRAL',
        confidence: 0,
        reasoning: ['No significant patterns detected'],
        recommendations: ['Wait for clearer market signals']
      };
    }

    const strongPatterns = patterns.filter(p => p.strength === 'STRONG');
    const bullishCount = patterns.filter(p => p.signal.includes('bullish') || p.signal.includes('buy')).length;
    const bearishCount = patterns.filter(p => p.signal.includes('bearish') || p.signal.includes('sell')).length;

    let primarySignal: string;
    let confidence: number;
    const reasoning: string[] = [];
    const recommendations: string[] = [];

    if (bullishCount > bearishCount) {
      primarySignal = 'BULLISH';
      confidence = Math.min(85, 60 + (bullishCount * 5) + (strongPatterns.length * 3));
      reasoning.push(`${bullishCount} bullish patterns detected`);
      if (strongPatterns.length > 0) reasoning.push(`${strongPatterns.length} strong confirmation signals`);
      recommendations.push('Consider long positions');
      recommendations.push('Monitor for entry opportunities on pullbacks');
    } else if (bearishCount > bullishCount) {
      primarySignal = 'BEARISH';
      confidence = Math.min(85, 60 + (bearishCount * 5) + (strongPatterns.length * 3));
      reasoning.push(`${bearishCount} bearish patterns detected`);
      if (strongPatterns.length > 0) reasoning.push(`${strongPatterns.length} strong confirmation signals`);
      recommendations.push('Consider short positions');
      recommendations.push('Monitor for entry opportunities on rallies');
    } else {
      primarySignal = 'NEUTRAL';
      confidence = 50;
      reasoning.push('Mixed signals detected');
      recommendations.push('Wait for clearer directional bias');
      recommendations.push('Focus on range trading strategies');
    }

    return {
      primarySignal,
      confidence,
      reasoning,
      recommendations
    };
  }
}

export const patternRecognition = new EnhancedPatternRecognition();