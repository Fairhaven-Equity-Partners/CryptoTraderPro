import { TimeFrame, AdvancedSignal, ChartData } from '../types';
import * as indicators from './technicalIndicators';

// Unified calculation engine with optimized performance
export class StreamlinedCore {
  private static instance: StreamlinedCore;
  private priceData: Map<string, Map<TimeFrame, ChartData[]>> = new Map();
  private calculationCache: Map<string, AdvancedSignal> = new Map();
  private isCalculating = false;

  static getInstance(): StreamlinedCore {
    if (!StreamlinedCore.instance) {
      StreamlinedCore.instance = new StreamlinedCore();
    }
    return StreamlinedCore.instance;
  }

  updatePriceData(symbol: string, timeframe: TimeFrame, data: ChartData[]): void {
    if (!this.priceData.has(symbol)) {
      this.priceData.set(symbol, new Map());
    }
    this.priceData.get(symbol)!.set(timeframe, data);
  }

  async calculateSignal(
    symbol: string, 
    timeframe: TimeFrame, 
    currentPrice: number
  ): Promise<AdvancedSignal> {
    const cacheKey = `${symbol}-${timeframe}-${currentPrice`}`;
    
    if (this.calculationCache.has(cacheKey)) {
      return this.calculationCache.get(cacheKey)!;
    }

    if (this.isCalculating) {
      return this.createNeutralSignal(symbol, timeframe, currentPrice);
    }

    this.isCalculating = true;

    try {
      const data = this.priceData.get(symbol)?.get(timeframe);
      if (!data || data.length < 50) {
        return this.createNeutralSignal(symbol, timeframe, currentPrice);
      }

      const indicatorResults = {
        rsi: indicators.calculateRSI(data, 14),
        macd: indicators.calculateMACD(data, 12, 26, 9),
        ema: indicators.calculateEMA(data, 20),
        stochastic: indicators.calculateStochastic(data, 14, 3),
        bb: indicators.calculateBollingerBands(data, 20, 2),
        adx: indicators.calculateADX(data, 14),
        atr: indicators.calculateATR(data, 14)
      };
      const signal = this.generateOptimizedSignal(symbol, timeframe, currentPrice, indicatorResults);
      
      this.calculationCache.set(cacheKey, signal);
      
      // Cache cleanup - keep only last 100 entries
      if (this.calculationCache.size > 100) {
        const entries = Array.from(this.calculationCache.entries());
        this.calculationCache.clear();
        entries.slice(-50).forEach(([key, value]) => {
          this.calculationCache.set(key, value);
        });
      }

      return signal;
    } finally {
      this.isCalculating = false;
    }
  }

  private generateOptimizedSignal(
    symbol: string,
    timeframe: TimeFrame,
    currentPrice: number,
    indicators: any
  ): AdvancedSignal {
    const direction = this.determineDirection(indicators);
    const confidence = this.calculateConfidence(indicators, timeframe);
    const { stopLoss, takeProfit } = this.calculateRiskLevels(currentPrice, indicators, timeframe);
    
    return {
      direction,
      confidence,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      timeframe,
      timestamp: Date.now(),
      successProbability: this.calculateSuccessProbability(confidence, timeframe, direction),
      indicators
    };
  }

  private determineDirection(indicators: any): 'LONG' | 'SHORT' | 'NEUTRAL' {
    let bullishSignals = 0;
    let bearishSignals = 0;

    // RSI analysis
    if (indicators.rsi?.value < 30) bullishSignals += 2;
    else if (indicators.rsi?.value > 70) bearishSignals += 2;
    else if (indicators.rsi?.value < 45) bullishSignals += 1;
    else if (indicators.rsi?.value > 55) bearishSignals += 1;

    // MACD analysis
    if (indicators.macd?.histogram > 0) bullishSignals += 2;
    else if (indicators.macd?.histogram < 0) bearishSignals += 2;

    // EMA trend analysis
    if (indicators.ema?.short > indicators.ema?.medium && 
        indicators.ema?.medium > indicators.ema?.long) bullishSignals += 3;
    else if (indicators.ema?.short < indicators.ema?.medium && 
             indicators.ema?.medium < indicators.ema?.long) bearishSignals += 3;

    // Stochastic analysis
    if (indicators.stochastic?.k < 20) bullishSignals += 1;
    else if (indicators.stochastic?.k > 80) bearishSignals += 1;

    // ADX trend strength
    if (indicators.adx?.value > 25) {
      if (indicators.adx.pdi > indicators.adx.ndi) bullishSignals += 2;
      else bearishSignals += 2;
    }

    const diff = bullishSignals - bearishSignals;
    if (diff >= 2) return 'LONG';
    if (diff <= -2) return 'SHORT';
    return 'NEUTRAL';
  }

  private calculateConfidence(indicators: any, timeframe: TimeFrame): number {
    let confidence = 50;

    // RSI contribution
    const rsiValue = indicators.rsi?.value || 50;
    if (rsiValue < 30 || rsiValue > 70) confidence += 15;
    else if (rsiValue < 40 || rsiValue > 60) confidence += 8;

    // MACD contribution
    if (Math.abs(indicators.macd?.histogram || 0) > 50) confidence += 12;

    // Trend strength from ADX
    if (indicators.adx?.value > 25) confidence += 10;
    if (indicators.adx?.value > 40) confidence += 5;

    // Bollinger Bands squeeze/expansion
    if (indicators.bb?.width < 0.02) confidence += 8; // Squeeze
    if (indicators.bb?.width > 0.1) confidence += 6; // Expansion

    // Timeframe adjustments
    const timeframeMultipliers: Record<TimeFrame, number> = {
      '1m': 0.8, '5m': 0.85, '15m': 0.9, '30m': 0.95,
      '1h': 1.0, '4h': 1.05, '1d': 1.1, '3d': 1.15, '1w': 1.2, '1M': 1.25
    };

    confidence *= timeframeMultipliers[timeframe];
    return Math.max(30, Math.min(95, confidence));
  }

  private calculateRiskLevels(
    currentPrice: number, 
    indicators: any, 
    timeframe: TimeFrame
  ): { stopLoss: number; takeProfit: number } {
    const atr = indicators.atr || currentPrice * 0.02;
    
    const riskMultipliers: Record<TimeFrame, number> = {
      '1m': 0.8, '5m': 1.0, '15m': 1.2, '30m': 1.5,
      '1h': 2.0, '4h': 2.5, '1d': 3.0, '3d': 3.5, '1w': 4.0, '1M': 5.0
    };

    const multiplier = riskMultipliers[timeframe];
    const riskAmount = atr * multiplier;

    return {
      stopLoss: currentPrice - riskAmount,
      takeProfit: currentPrice + (riskAmount * 2) // 2:1 reward ratio
    };
  }

  private calculateSuccessProbability(
    confidence: number, 
    timeframe: TimeFrame, 
    direction: 'LONG' | 'SHORT' | 'NEUTRAL'
  ): number {
    let probability = confidence * 0.724;

    // Timeframe adjustments
    const timeframeAdjustments: Record<TimeFrame, number> = {
      '1m': -10, '5m': -5, '15m': 0, '30m': 2,
      '1h': 5, '4h': 8, '1d': 10, '3d': 12, '1w': 15, '1M': 18
    };

    probability += timeframeAdjustments[timeframe];

    // Direction bias (markets trend upward long-term)
    if (direction === 'LONG' && ['1d', '3d', '1w', '1M'].includes(timeframe)) {
      probability += 5;
    }

    return Math.max(20, Math.min(95, probability));
  }

  private createNeutralSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): AdvancedSignal {
    return {
      direction: 'NEUTRAL',
      confidence: 50,
      entryPrice: currentPrice,
      stopLoss: currentPrice * 0.98,
      takeProfit: currentPrice * 1.04,
      timeframe,
      timestamp: Date.now(),
      successProbability: 50,
      indicators: {}
    };
  }

  clearCache(): void {
    this.calculationCache.clear();
  }

  getDataStatus(symbol: string): { loaded: boolean; timeframes: number } {
    const symbolData = this.priceData.get(symbol);
    return {
      loaded: !!symbolData,
      timeframes: symbolData?.size || 0
    };
  }
}

export const streamlinedCore = StreamlinedCore.getInstance();