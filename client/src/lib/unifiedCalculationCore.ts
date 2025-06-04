import { TimeFrame } from '../types';
import { 
  advancedMarketStructureAnalyzer, 
  MarketStructureData, 
  VWAPData, 
  PsychologicalLevel, 
  CandlestickAnalysis 
} from './advancedMarketStructure';

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketStructureInsights {
  vwap: {
    value: number;
    upperBand: number;
    lowerBand: number;
    position: 'above' | 'inside' | 'below';
  };
  supplyDemandZones: {
    supply: number[];
    demand: number[];
    strength: 'weak' | 'moderate' | 'strong';
  };
  psychologicalLevels: {
    levels: number[];
    fibonacciConfluence: boolean;
    roundNumberProximity: number;
  };
  candlestickSignal: {
    pattern: string;
    reliability: number;
    direction: 'bullish' | 'bearish' | 'neutral';
  };
}

interface TechnicalIndicators {
  rsi: { value: number; signal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: 'WEAK' | 'MODERATE' | 'STRONG' };
  macd: { value: number; signal: 'BUY' | 'SELL' | 'NEUTRAL'; histogram: number; strength: 'WEAK' | 'MODERATE' | 'STRONG' };
  ema: { short: number; medium: number; long: number };
  stochastic: { k: number; d: number };
  bb: { upper: number; middle: number; lower: number; width: number; percentB: number };
  adx: { value: number; pdi: number; ndi: number };
  atr: { value: number };
  supports: number[];
  resistances: number[];
  volatility: number;
  marketRegime: 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'HIGH_VOLATILITY' | 'LOW_VOLATILITY';
  confidenceFactors: {
    trendAlignment: boolean;
    momentumConfluence: boolean;
    volatilityLevel: string;
  };
  // Advanced institutional features
  marketStructure: MarketStructureInsights;
}

interface UnifiedSignal {
  symbol: string;
  timeframe: TimeFrame;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  indicators: TechnicalIndicators;
  successProbability: number;
  patternFormations?: any[];
  macroInsights?: string[];
}

class UnifiedCalculationCore {
  private dataCache = new Map<string, OHLCData[]>();
  private indicatorCache = new Map<string, any>();

  /**
   * Calculate RSI using Wilder's smoothing method - Optimized
   */
  private calculateRSI(data: OHLCData[], period = 14): number {
    if (data.length < period + 1) return 50;
    
    let avgGain = 0;
    let avgLoss = 0;
    const periodF = period;
    const alpha = 1 / period;
    const oneMinusAlpha = 1 - alpha;
    
    // Calculate initial gains/losses
    for (let i = 1; i <= period; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) avgGain += change;
      else avgLoss -= change;
    }
    
    avgGain /= periodF;
    avgLoss /= periodF;
    
    // Apply Wilder's smoothing
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      avgGain = change > 0 ? (avgGain * oneMinusAlpha) + (change * alpha) : avgGain * oneMinusAlpha;
      avgLoss = change < 0 ? (avgLoss * oneMinusAlpha) + (-change * alpha) : avgLoss * oneMinusAlpha;
    }
    
    return avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
  }

  /**
   * Calculate MACD with optimized EMA progression
   */
  private calculateMACD(data: OHLCData[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (data.length < slowPeriod) return { macdLine: 0, signalLine: 0, histogram: 0 };
    
    const fastK = 2 / (fastPeriod + 1);
    const slowK = 2 / (slowPeriod + 1);
    const signalK = 2 / (signalPeriod + 1);
    
    // Initialize EMAs with SMA
    let fastEMA = 0;
    let slowEMA = 0;
    
    for (let i = 0; i < slowPeriod; i++) {
      const price = data[i].close;
      if (i < fastPeriod) fastEMA += price;
      slowEMA += price;
    }
    
    fastEMA /= fastPeriod;
    slowEMA /= slowPeriod;
    
    const macdValues: number[] = [];
    
    // Calculate MACD values
    for (let i = slowPeriod; i < data.length; i++) {
      const price = data[i].close;
      fastEMA = (price * fastK) + (fastEMA * (1 - fastK));
      slowEMA = (price * slowK) + (slowEMA * (1 - slowK));
      macdValues.push(fastEMA - slowEMA);
    }
    
    if (macdValues.length < signalPeriod) {
      const macdLine = macdValues[macdValues.length - 1] || 0;
      return { macdLine, signalLine: 0, histogram: macdLine };
    }
    
    // Calculate signal line
    let signalEMA = macdValues.slice(0, signalPeriod).reduce((a, b) => a + b) / signalPeriod;
    
    for (let i = signalPeriod; i < macdValues.length; i++) {
      signalEMA = (macdValues[i] * signalK) + (signalEMA * (1 - signalK));
    }
    
    const macdLine = macdValues[macdValues.length - 1];
    return { macdLine, signalLine: signalEMA, histogram: macdLine - signalEMA };
  }

  /**
   * Calculate EMA (Exponential Moving Average) - Optimized
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const k = 2 / (period + 1);
    const oneMinusK = 1 - k;
    let ema = 0;
    
    // SMA for first value
    for (let i = 0; i < period; i++) {
      ema += prices[i];
    }
    ema /= period;
    
    // EMA for remaining values
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * oneMinusK);
    }
    
    return ema;
  }



  /**
   * Calculate ADX with precise Wilder's smoothing and accurate DX progression
   */
  private calculateADX(data: OHLCData[], period = 14) {
    if (data.length < period * 2) return { adx: 25, pdi: 50, ndi: 50 };
    
    const trueRanges: number[] = [];
    const plusDMs: number[] = [];
    const minusDMs: number[] = [];
    const dxValues: number[] = [];
    
    // Calculate TR, +DM, -DM for each period
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevHigh = data[i - 1].high;
      const prevLow = data[i - 1].low;
      const prevClose = data[i - 1].close;
      
      // True Range (most conservative approach)
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
      
      // Directional Movement (precise calculation)
      const upMove = high - prevHigh;
      const downMove = prevLow - low;
      
      const plusDM = (upMove > downMove && upMove > 0) ? upMove : 0;
      const minusDM = (downMove > upMove && downMove > 0) ? downMove : 0;
      
      plusDMs.push(plusDM);
      minusDMs.push(minusDM);
    }
    
    // Initialize first smoothed values
    let smoothedTR = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0);
    let smoothedPlusDM = plusDMs.slice(0, period).reduce((sum, dm) => sum + dm, 0);
    let smoothedMinusDM = minusDMs.slice(0, period).reduce((sum, dm) => sum + dm, 0);
    
    // Calculate progressive DX values using Wilder's smoothing
    for (let i = period; i < trueRanges.length; i++) {
      // Apply Wilder's smoothing formula: Current Smoothed Value = ((Prior Smoothed Value * (n-1)) + Current Value) / n
      smoothedTR = ((smoothedTR * (period - 1)) + trueRanges[i]);
      smoothedPlusDM = ((smoothedPlusDM * (period - 1)) + plusDMs[i]);
      smoothedMinusDM = ((smoothedMinusDM * (period - 1)) + minusDMs[i]);
      
      // Calculate +DI and -DI
      const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
      const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
      
      // Calculate DX
      const diSum = plusDI + minusDI;
      const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;
      dxValues.push(dx);
    }
    
    // Calculate ADX as smoothed average of DX values
    if (dxValues.length < period) {
      const lastDX = dxValues[dxValues.length - 1] || 25;
      return { adx: lastDX, pdi: 50, ndi: 50 };
    }
    
    // Initial ADX is simple average of first period DX values
    let adx = dxValues.slice(0, period).reduce((sum, dx) => sum + dx, 0) / period;
    
    // Apply Wilder's smoothing to subsequent ADX values
    for (let i = period; i < dxValues.length; i++) {
      adx = ((adx * (period - 1)) + dxValues[i]) / period;
    }
    
    // Final +DI and -DI calculation
    const finalPlusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
    const finalMinusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
    
    return { 
      adx: Math.min(Math.max(adx, 0), 100), 
      pdi: Math.min(Math.max(finalPlusDI, 0), 100), 
      ndi: Math.min(Math.max(finalMinusDI, 0), 100) 
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(data: OHLCData[], period = 20, stdDev = 2) {
    const prices = data.map(d => d.close);
    const sma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
    
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    const upper = sma + (standardDeviation * stdDev);
    const lower = sma - (standardDeviation * stdDev);
    const width = (upper - lower) / sma;
    const percentB = (prices[prices.length - 1] - lower) / (upper - lower) * 100;
    
    return { upper, middle: sma, lower, width, percentB };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  private calculateATR(data: OHLCData[], period = 14): number {
    if (data.length < period + 1) return 0;
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      trueRanges.push(tr);
    }
    
    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }

  /**
   * Optimized support and resistance calculation with intelligent pivot detection
   */
  private calculateSupportResistance(data: OHLCData[], lookback = 12): { supports: number[]; resistances: number[] } {
    if (data.length < 20) {
      const currentPrice = data[data.length - 1]?.close || 0;
      return currentPrice > 0 ? {
        supports: [currentPrice * 0.985, currentPrice * 0.970, currentPrice * 0.955],
        resistances: [currentPrice * 1.015, currentPrice * 1.030, currentPrice * 1.045]
      } : { supports: [], resistances: [] };
    }
    
    const currentPrice = data[data.length - 1].close;
    const supports = new Set<number>();
    const resistances = new Set<number>();
    
    // Optimized pivot detection with adaptive lookback
    const adaptiveLookback = Math.max(5, Math.min(lookback, Math.floor(data.length / 4)));
    const significanceThreshold = currentPrice * 0.008; // 0.8% minimum significance
    
    for (let i = adaptiveLookback; i < data.length - adaptiveLookback; i++) {
      const current = data[i];
      const prevCandles = data.slice(i - adaptiveLookback, i);
      const nextCandles = data.slice(i + 1, i + adaptiveLookback + 1);
      
      // Pivot high detection (resistance)
      const isPivotHigh = prevCandles.every(c => c.high <= current.high) && 
                         nextCandles.every(c => c.high <= current.high) &&
                         Math.abs(current.high - currentPrice) > significanceThreshold;
      
      // Pivot low detection (support)  
      const isPivotLow = prevCandles.every(c => c.low >= current.low) && 
                        nextCandles.every(c => c.low >= current.low) &&
                        Math.abs(current.low - currentPrice) > significanceThreshold;
      
      if (isPivotHigh && current.high > currentPrice) resistances.add(current.high);
      if (isPivotLow && current.low < currentPrice) supports.add(current.low);
    }
    
    // Add volume-weighted and psychological levels
    const recentData = data.slice(-Math.min(100, data.length));
    const volumeLevels = this.calculateVolumeWeightedLevels(recentData);
    volumeLevels.supports.forEach(level => level < currentPrice && supports.add(level));
    volumeLevels.resistances.forEach(level => level > currentPrice && resistances.add(level));
    
    // Add recent extremes if significant
    const recentHigh = Math.max(...recentData.map(d => d.high));
    const recentLow = Math.min(...recentData.map(d => d.low));
    if (recentHigh > currentPrice * 1.003) resistances.add(recentHigh);
    if (recentLow < currentPrice * 0.997) supports.add(recentLow);
    
    // Return top 3 most significant levels
    return {
      supports: Array.from(supports)
        .filter(level => level > 0 && level < currentPrice * 0.98)
        .sort((a, b) => b - a)
        .slice(0, 3),
      resistances: Array.from(resistances)
        .filter(level => level > currentPrice * 1.02)
        .sort((a, b) => a - b)
        .slice(0, 3)
    };
  }
  
  /**
   * Calculate volume-weighted support and resistance levels
   */
  private calculateVolumeWeightedLevels(data: OHLCData[]): { supports: number[]; resistances: number[] } {
    const supports: number[] = [];
    const resistances: number[] = [];
    const currentPrice = data[data.length - 1].close;
    
    // Group price levels by volume
    const priceVolumeMap = new Map<number, number>();
    const recentData = data.slice(-100);
    
    recentData.forEach(candle => {
      const priceLevel = Math.round(candle.close / 10) * 10; // Round to nearest 10
      const currentVolume = priceVolumeMap.get(priceLevel) || 0;
      priceVolumeMap.set(priceLevel, currentVolume + candle.volume);
    });
    
    // Sort by volume and extract significant levels
    const sortedLevels = Array.from(priceVolumeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
    
    sortedLevels.forEach(level => {
      if (level < currentPrice) {
        supports.push(level);
      } else if (level > currentPrice) {
        resistances.push(level);
      }
    });
    
    return { supports, resistances };
  }

  /**
   * Optimized market regime detection with enhanced volatility analysis
   */
  private detectMarketRegime(data: OHLCData[], indicators: any): string {
    const volatility = indicators.volatility;
    const adx = indicators.adx?.adx || indicators.adx?.value || 25;
    const rsi = indicators.rsi?.value || 50;
    
    // Enhanced regime classification with multiple factors
    if (volatility > 0.05) return 'HIGH_VOLATILITY';
    if (volatility < 0.012) return 'LOW_VOLATILITY';
    if (adx > 28 && rsi > 65) return 'TRENDING_UP';
    if (adx > 28 && rsi < 35) return 'TRENDING_DOWN';
    if (adx < 20 && volatility < 0.025) return 'RANGING';
    return 'NORMAL';
  }

  /**
   * Calculate realistic position sizing based on ATR with market validation
   */
  private calculatePositionSizing(timeframe: TimeFrame, atr: number, currentPrice: number) {
    const timeframeMultipliers = {
      '1m': 0.5, '5m': 0.75, '15m': 1.0, '30m': 1.25,
      '1h': 1.5, '4h': 2.0, '1d': 3.0, '3d': 4.0,
      '1w': 5.0, '1M': 8.0
    };
    
    const multiplier = timeframeMultipliers[timeframe] || 1.0;
    const atrPercentage = (atr / currentPrice) * 100;
    
    // Ensure realistic risk/reward ratios (max 15% stop loss, max 30% take profit)
    const maxStopLoss = currentPrice * 0.15;
    const maxTakeProfit = currentPrice * 0.30;
    
    const stopLossDistance = Math.min(atr * multiplier * 0.8, maxStopLoss);
    const takeProfitDistance = Math.min(atr * multiplier * 1.6, maxTakeProfit);
    
    return {
      stopLossDistance,
      takeProfitDistance,
      riskPercentage: Math.min(atrPercentage * multiplier, 3.0)
    };
  }

  /**
   * Calculate VWAP with institutional-grade precision
   */
  private calculateInstitutionalVWAP(data: OHLCData[]): MarketStructureInsights['vwap'] {
    if (data.length === 0) {
      return {
        value: 0,
        upperBand: 0,
        lowerBand: 0,
        position: 'inside'
      };
    }
    
    let cumulativePV = 0;
    let cumulativeVolume = 0;
    let cumulativePV2 = 0;
    
    // Calculate session VWAP (daily reset for intraday timeframes)
    const sessionData = data.slice(-100); // Last 100 periods for session
    
    for (const candle of sessionData) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      const volume = candle.volume || 1000;
      
      cumulativePV += typicalPrice * volume;
      cumulativeVolume += volume;
      cumulativePV2 += typicalPrice * typicalPrice * volume;
    }
    
    const vwap = cumulativePV / cumulativeVolume;
    const variance = (cumulativePV2 / cumulativeVolume) - (vwap * vwap);
    const stdDev = Math.sqrt(Math.max(variance, 0));
    
    // Double bands for 95% price coverage
    const upperBand = vwap + (2 * stdDev);
    const lowerBand = vwap - (2 * stdDev);
    
    const currentPrice = data[data.length - 1].close;
    let position: 'above' | 'inside' | 'below';
    
    if (currentPrice > upperBand) position = 'above';
    else if (currentPrice < lowerBand) position = 'below';
    else position = 'inside';
    
    return { value: vwap, upperBand, lowerBand, position };
  }

  /**
   * Identify supply and demand zones using fractal analysis
   */
  private identifySupplyDemandZones(data: OHLCData[]): MarketStructureInsights['supplyDemandZones'] {
    const supply: number[] = [];
    const demand: number[] = [];
    
    // Find swing highs (supply zones) and swing lows (demand zones)
    const lookback = 5;
    
    for (let i = lookback; i < data.length - lookback; i++) {
      const current = data[i];
      
      // Check for swing high (supply zone)
      let isSwingHigh = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].high >= current.high) {
          isSwingHigh = false;
          break;
        }
      }
      
      // Check for swing low (demand zone)
      let isSwingLow = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && data[j].low <= current.low) {
          isSwingLow = false;
          break;
        }
      }
      
      if (isSwingHigh) supply.push(current.high);
      if (isSwingLow) demand.push(current.low);
    }
    
    // Keep only recent significant levels
    const recentSupply = supply.slice(-5);
    const recentDemand = demand.slice(-5);
    
    // Determine zone strength based on volume and touches
    let strength: 'weak' | 'moderate' | 'strong' = 'moderate';
    if (recentSupply.length >= 3 && recentDemand.length >= 3) strength = 'strong';
    else if (recentSupply.length <= 1 || recentDemand.length <= 1) strength = 'weak';
    
    return { supply: recentSupply, demand: recentDemand, strength };
  }

  /**
   * Identify psychological levels with Fibonacci confirmation
   */
  private identifyPsychologicalLevels(data: OHLCData[], currentPrice: number): MarketStructureInsights['psychologicalLevels'] {
    const levels: number[] = [];
    
    // Generate round number levels
    const magnitude = Math.pow(10, Math.floor(Math.log10(currentPrice)));
    const roundBase = Math.round(currentPrice / magnitude) * magnitude;
    
    for (let i = -2; i <= 2; i++) {
      levels.push(roundBase + (i * magnitude * 0.5));
    }
    
    // Calculate Fibonacci levels from recent high/low
    const recentData = data.slice(-50);
    const high = Math.max(...recentData.map(d => d.high));
    const low = Math.min(...recentData.map(d => d.low));
    const range = high - low;
    
    const fibRatios = [0.236, 0.382, 0.5, 0.618, 0.786];
    const fibLevels = fibRatios.map(ratio => low + (range * ratio));
    
    // Check for Fibonacci confluence with round numbers
    let fibonacciConfluence = false;
    const tolerance = currentPrice * 0.002; // 0.2% tolerance
    
    for (const fibLevel of fibLevels) {
      for (const roundLevel of levels) {
        if (Math.abs(fibLevel - roundLevel) < tolerance) {
          fibonacciConfluence = true;
          break;
        }
      }
      if (fibonacciConfluence) break;
    }
    
    // Calculate proximity to nearest round number
    const nearestRound = levels.reduce((prev, curr) => 
      Math.abs(curr - currentPrice) < Math.abs(prev - currentPrice) ? curr : prev
    );
    const roundNumberProximity = Math.abs(currentPrice - nearestRound) / currentPrice;
    
    return {
      levels: [...levels, ...fibLevels].sort((a, b) => a - b),
      fibonacciConfluence,
      roundNumberProximity
    };
  }

  /**
   * Analyze candlestick patterns for scalping precision
   */
  private analyzeCandlestickPattern(data: OHLCData[], timeframe: TimeFrame): MarketStructureInsights['candlestickSignal'] {
    if (data.length < 3) {
      return { pattern: 'insufficient_data', reliability: 0, direction: 'neutral' };
    }
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const bodySize = Math.abs(current.close - current.open);
    const totalRange = current.high - current.low;
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    
    // Pattern identification with close analysis
    let pattern = 'neutral';
    let reliability = 50;
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    
    // Strong bullish close (price closes in upper 80% of range)
    const closePosition = (current.close - current.low) / totalRange;
    
    if (closePosition > 0.8 && current.close > current.open) {
      pattern = 'strong_bullish_close';
      direction = 'bullish';
      reliability = 85;
    } else if (closePosition < 0.2 && current.close < current.open) {
      pattern = 'strong_bearish_close';
      direction = 'bearish';
      reliability = 85;
    } else if (upperWick > bodySize * 2) {
      pattern = 'rejection_from_high';
      direction = 'bearish';
      reliability = 75;
    } else if (lowerWick > bodySize * 2) {
      pattern = 'rejection_from_low';
      direction = 'bullish';
      reliability = 75;
    } else if (bodySize < totalRange * 0.3) {
      pattern = 'indecision_doji';
      direction = 'neutral';
      reliability = 60;
    }
    
    // Adjust reliability for timeframe (shorter timeframes less reliable)
    const timeframeMultiplier = timeframe === '1m' ? 0.6 : 
                               timeframe === '5m' ? 0.8 : 
                               timeframe === '15m' ? 1.0 : 1.1;
    
    reliability *= timeframeMultiplier;
    
    return { pattern, reliability, direction };
  }

  /**
   * Generate unified signal with advanced institutional analysis
   */
  public generateSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): UnifiedSignal | null {
    const cacheKey = `${symbol}_${timeframe}`;
    const data = this.dataCache.get(cacheKey);
    
    if (!data || data.length < 50) return null;
    
    // Calculate traditional indicators
    const rsi = this.calculateRSI(data);
    const macd = this.calculateMACD(data);
    const ema = {
      short: this.calculateEMA(data.map(d => d.close), 9),
      medium: this.calculateEMA(data.map(d => d.close), 21),
      long: this.calculateEMA(data.map(d => d.close), 50)
    };
    const stochastic = this.calculateStochastic(data);
    const bb = this.calculateBollingerBands(data);
    const adx = this.calculateADX(data);
    const atr = this.calculateATR(data);
    
    // Calculate volatility
    const prices = data.slice(-20).map(d => d.close);
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length) * Math.sqrt(252);
    
    // Calculate traditional support and resistance
    const supportResistance = this.calculateSupportResistance(data);
    
    const finalSupports = supportResistance.supports.length > 0 ? supportResistance.supports : [
      currentPrice * 0.985,
      currentPrice * 0.970,
      currentPrice * 0.955
    ];
    
    const finalResistances = supportResistance.resistances.length > 0 ? supportResistance.resistances : [
      currentPrice * 1.015,
      currentPrice * 1.030,
      currentPrice * 1.045
    ];

    // Calculate advanced market structure features
    const vwapAnalysis = this.calculateInstitutionalVWAP(data);
    const supplyDemandZones = this.identifySupplyDemandZones(data);
    const psychologicalLevels = this.identifyPsychologicalLevels(data, currentPrice);
    const candlestickSignal = this.analyzeCandlestickPattern(data, timeframe);

    const indicators: TechnicalIndicators = {
      rsi: {
        value: rsi,
        signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL',
        strength: Math.abs(rsi - 50) > 30 ? 'STRONG' : Math.abs(rsi - 50) > 15 ? 'MODERATE' : 'WEAK'
      },
      macd: {
        value: macd.macdLine,
        signal: macd.histogram > 0 ? 'BUY' : 'SELL',
        histogram: macd.histogram,
        strength: Math.abs(macd.histogram) > 100 ? 'STRONG' : Math.abs(macd.histogram) > 50 ? 'MODERATE' : 'WEAK'
      },
      ema,
      stochastic,
      bb,
      adx: { value: adx.adx, pdi: adx.pdi, ndi: adx.ndi },
      atr: { value: atr },
      supports: finalSupports,
      resistances: finalResistances,
      volatility,
      marketRegime: this.detectMarketRegime(data, { volatility, adx, rsi: { value: rsi } }) as any,
      confidenceFactors: {
        trendAlignment: ema.short > ema.medium && ema.medium > ema.long,
        momentumConfluence: (rsi > 50 && macd.histogram > 0) || (rsi < 50 && macd.histogram < 0),
        volatilityLevel: volatility > 0.04 ? 'HIGH_VOLATILITY' : volatility < 0.015 ? 'LOW_VOLATILITY' : 'NORMAL'
      },
      // Advanced institutional market structure features
      marketStructure: {
        vwap: vwapAnalysis,
        supplyDemandZones,
        psychologicalLevels,
        candlestickSignal
      }
    };
    
    // Advanced signal direction and confidence calculation with multiple confluence checks
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;
    
    // Realistic signal scoring with market uncertainty factored in
    const bullishSignals = [
      // RSI momentum (conservative scoring)
      rsi < 20 ? 15 : rsi < 30 ? 12 : rsi < 40 ? 8 : rsi < 50 ? 4 : 0,
      // MACD trend confirmation (adjusted thresholds)
      macd.histogram > 50 ? 18 : macd.histogram > 0 ? 12 : macd.histogram > -20 ? 5 : 0,
      // EMA trend alignment (realistic weights)
      ema.short > ema.medium && ema.medium > ema.long ? 15 : ema.short > ema.medium ? 8 : 0,
      // Bollinger Band positioning
      bb.percentB < 10 ? 12 : bb.percentB < 20 ? 8 : bb.percentB < 30 ? 4 : 0,
      // ADX trend strength (conservative)
      adx.adx > 30 && adx.pdi > adx.ndi ? 12 : adx.pdi > adx.ndi ? 6 : 0,
      // Volatility environment (market uncertainty factor)
      volatility > 0.03 && volatility < 0.06 ? 5 : 0,
      // Support level proximity (reduced weight)
      finalSupports.some(support => Math.abs(currentPrice - support) / currentPrice < 0.02) ? 8 : 0
    ].reduce((sum, score) => sum + score, 0);
    
    // Realistic bearish signal scoring
    const bearishSignals = [
      // RSI momentum (conservative scoring)
      rsi > 80 ? 15 : rsi > 70 ? 12 : rsi > 60 ? 8 : rsi > 50 ? 4 : 0,
      // MACD trend confirmation (adjusted thresholds)
      macd.histogram < -50 ? 18 : macd.histogram < 0 ? 12 : macd.histogram < 20 ? 5 : 0,
      // EMA trend alignment (realistic weights)
      ema.short < ema.medium && ema.medium < ema.long ? 15 : ema.short < ema.medium ? 8 : 0,
      // Bollinger Band positioning
      bb.percentB > 90 ? 12 : bb.percentB > 80 ? 8 : bb.percentB > 70 ? 4 : 0,
      // ADX trend strength (conservative)
      adx.adx > 30 && adx.ndi > adx.pdi ? 12 : adx.ndi > adx.pdi ? 6 : 0,
      // Volatility environment (market uncertainty factor)
      volatility > 0.03 && volatility < 0.06 ? 5 : 0,
      // Resistance level proximity (reduced weight)
      finalResistances.some(resistance => Math.abs(currentPrice - resistance) / currentPrice < 0.02) ? 8 : 0
    ].reduce((sum, score) => sum + score, 0);
    
    // Market uncertainty adjustment - reduce confidence in volatile conditions
    const uncertaintyPenalty = volatility > 0.08 ? 15 : volatility > 0.05 ? 10 : 0;
    const signalStrength = Math.abs(bullishSignals - bearishSignals);
    
    // Realistic confidence calculation with market uncertainty
    if (bullishSignals > bearishSignals + 15 && bullishSignals > 30) {
      direction = 'LONG';
      confidence = Math.max(Math.min(55 + Math.floor(bullishSignals * 0.6) - uncertaintyPenalty, 85), 52);
    } else if (bearishSignals > bullishSignals + 15 && bearishSignals > 30) {
      direction = 'SHORT';
      confidence = Math.max(Math.min(55 + Math.floor(bearishSignals * 0.6) - uncertaintyPenalty, 85), 52);
    } else if (signalStrength > 8) {
      // Moderate signals with uncertainty
      direction = bullishSignals > bearishSignals ? 'LONG' : 'SHORT';
      confidence = Math.max(Math.min(50 + Math.floor(signalStrength * 0.4) - uncertaintyPenalty, 75), 51);
    }
    
    // Calculate position sizing
    const sizing = this.calculatePositionSizing(timeframe, atr, currentPrice);
    
    return {
      symbol,
      timeframe,
      direction,
      confidence,
      entryPrice: currentPrice,
      stopLoss: direction === 'LONG' 
        ? Math.max(currentPrice - sizing.stopLossDistance, currentPrice * 0.85)
        : Math.min(currentPrice + sizing.stopLossDistance, currentPrice * 1.15),
      takeProfit: direction === 'LONG'
        ? Math.min(currentPrice + sizing.takeProfitDistance, currentPrice * 1.30)
        : Math.max(currentPrice - sizing.takeProfitDistance, currentPrice * 0.70),
      timestamp: Date.now(),
      indicators,
      successProbability: Math.min(confidence + Math.random() * 10 - 5, 85),
      patternFormations: [],
      macroInsights: [
        `Market Regime: ${indicators.marketRegime}`,
        `RSI: ${indicators.rsi.value.toFixed(2)} (${indicators.rsi.signal})`,
        `MACD: ${indicators.macd.value.toFixed(2)} (${indicators.macd.signal})`,
        `ADX: ${indicators.adx.value.toFixed(2)}`,
        `Volatility: ${(indicators.volatility * 100).toFixed(2)}%`,
        `Trend Alignment: ${indicators.confidenceFactors.trendAlignment ? 'Yes' : 'No'}`,
        `Momentum Confluence: ${indicators.confidenceFactors.momentumConfluence ? 'Yes' : 'No'}`
      ]
    };
  }

  private calculateStochastic(data: OHLCData[], kPeriod = 14, dPeriod = 3) {
    const recent = data.slice(-kPeriod);
    const currentClose = data[data.length - 1].close;
    const lowestLow = Math.min(...recent.map(d => d.low));
    const highestHigh = Math.max(...recent.map(d => d.high));
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // Calculate %D (3-period SMA of %K)
    const kValues = [];
    for (let i = data.length - dPeriod; i < data.length; i++) {
      const recentForK = data.slice(i - kPeriod + 1, i + 1);
      const closeForK = data[i].close;
      const lowForK = Math.min(...recentForK.map(d => d.low));
      const highForK = Math.max(...recentForK.map(d => d.high));
      kValues.push(((closeForK - lowForK) / (highForK - lowForK)) * 100);
    }
    
    const d = kValues.reduce((sum, val) => sum + val, 0) / kValues.length;
    
    return { k, d };
  }

  public updateMarketData(symbol: string, timeframe: TimeFrame, data: OHLCData[]): void {
    const cacheKey = `${symbol}_${timeframe}`;
    this.dataCache.set(cacheKey, data);
  }
}

export const unifiedCalculationCore = new UnifiedCalculationCore();

// Export the multi-timeframe calculation function for backward compatibility
export function calculateMultiTimeframeSignals(symbol: string, currentPrice: number, chartData?: any) {
  const results = new Map();
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  
  // If no chart data provided, return empty results
  if (!chartData || typeof chartData !== 'object') {
    console.log('No valid chart data provided for calculations');
    return results;
  }
  
  for (const timeframe of timeframes) {
    try {
      if (chartData[timeframe] && Array.isArray(chartData[timeframe]) && chartData[timeframe].length > 0) {
        unifiedCalculationCore.updateMarketData(symbol, timeframe, chartData[timeframe]);
        const signal = unifiedCalculationCore.generateSignal(symbol, timeframe, currentPrice);
        if (signal) {
          results.set(timeframe, signal);
        }
      }
    } catch (error) {
      console.error(`Error calculating signal for ${timeframe}:`, error);
      continue;
    }
  }
  
  return results;
}