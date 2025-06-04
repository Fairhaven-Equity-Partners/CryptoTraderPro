/**
 * Advanced Market Structure Analysis Module
 * Implements institutional-level analysis including:
 * - Market structure and fractal analysis
 * - VWAP with double bands
 * - Psychological levels with Fibonacci confirmation
 * - Candlestick close analysis for scalping
 */

import { OHLCData, TimeFrame } from './unifiedCalculationCore';

export interface SupplyDemandZone {
  level: number;
  type: 'supply' | 'demand';
  strength: 'weak' | 'moderate' | 'strong';
  timeframe: TimeFrame;
  volume: number;
  touches: number;
  freshness: 'fresh' | 'tested' | 'broken';
}

export interface VWAPData {
  vwap: number;
  upperBand1: number; // 1 standard deviation
  lowerBand1: number;
  upperBand2: number; // 2 standard deviations (95% coverage)
  lowerBand2: number;
  volume: number;
  pricePosition: 'above_upper2' | 'above_upper1' | 'inside' | 'below_lower1' | 'below_lower2';
}

export interface PsychologicalLevel {
  level: number;
  type: 'round_number' | 'fibonacci' | 'previous_high' | 'previous_low';
  strength: number; // 1-100
  confluence: string[];
  timeframe: TimeFrame;
}

export interface CandlestickAnalysis {
  pattern: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  closeType: 'strong_close' | 'weak_close' | 'rejection' | 'indecision';
  volumeConfirmation: boolean;
  reliability: number;
}

export interface MarketStructureData {
  trend: 'uptrend' | 'downtrend' | 'sideways';
  structure: 'break_of_structure' | 'change_of_character' | 'continuation';
  keyLevels: {
    resistance: number[];
    support: number[];
  };
  orderBlocks: SupplyDemandZone[];
  liquidityZones: {
    level: number;
    type: 'buy_side' | 'sell_side';
    strength: number;
  }[];
}

export class AdvancedMarketStructureAnalyzer {
  private priceHistory: Map<string, OHLCData[]> = new Map();
  private vwapCache: Map<string, VWAPData> = new Map();

  /**
   * Analyze market structure and identify supply/demand zones
   */
  public analyzeMarketStructure(data: OHLCData[], timeframe: TimeFrame): MarketStructureData {
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const closes = data.map(d => d.close);
    
    // Identify swing highs and lows
    const swingHighs = this.findSwingPoints(highs, 'high');
    const swingLows = this.findSwingPoints(lows, 'low');
    
    // Determine trend structure
    const trend = this.determineTrend(swingHighs, swingLows);
    const structure = this.analyzeStructureBreak(swingHighs, swingLows, closes);
    
    // Identify order blocks (supply/demand zones)
    const orderBlocks = this.identifyOrderBlocks(data, swingHighs, swingLows);
    
    // Find liquidity zones
    const liquidityZones = this.identifyLiquidityZones(data, swingHighs, swingLows);
    
    return {
      trend,
      structure,
      keyLevels: {
        resistance: swingHighs.map(h => h.price).slice(-5),
        support: swingLows.map(l => l.price).slice(-5)
      },
      orderBlocks,
      liquidityZones
    };
  }

  /**
   * Calculate VWAP with double bands for 95% price coverage
   */
  public calculateVWAP(data: OHLCData[], sessionStart?: number): VWAPData {
    // Use session start or start from beginning of data
    const startIndex = sessionStart || 0;
    const sessionData = data.slice(startIndex);
    
    if (sessionData.length === 0) {
      const currentPrice = data[data.length - 1]?.close || 0;
      return {
        vwap: currentPrice,
        upperBand1: currentPrice * 1.01,
        lowerBand1: currentPrice * 0.99,
        upperBand2: currentPrice * 1.02,
        lowerBand2: currentPrice * 0.98,
        volume: 0,
        pricePosition: 'inside'
      };
    }

    let cumulativePV = 0;
    let cumulativeVolume = 0;
    let cumulativePV2 = 0; // For variance calculation
    
    // Calculate VWAP and variance
    for (const candle of sessionData) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      const volume = candle.volume || 1000; // Default volume if not provided
      
      cumulativePV += typicalPrice * volume;
      cumulativeVolume += volume;
      cumulativePV2 += typicalPrice * typicalPrice * volume;
    }
    
    const vwap = cumulativePV / cumulativeVolume;
    const variance = (cumulativePV2 / cumulativeVolume) - (vwap * vwap);
    const stdDev = Math.sqrt(Math.max(variance, 0));
    
    // Calculate bands
    const upperBand1 = vwap + stdDev;
    const lowerBand1 = vwap - stdDev;
    const upperBand2 = vwap + (2 * stdDev); // 95% coverage
    const lowerBand2 = vwap - (2 * stdDev);
    
    // Determine price position
    const currentPrice = data[data.length - 1].close;
    let pricePosition: VWAPData['pricePosition'];
    
    if (currentPrice > upperBand2) pricePosition = 'above_upper2';
    else if (currentPrice > upperBand1) pricePosition = 'above_upper1';
    else if (currentPrice < lowerBand2) pricePosition = 'below_lower2';
    else if (currentPrice < lowerBand1) pricePosition = 'below_lower1';
    else pricePosition = 'inside';
    
    return {
      vwap,
      upperBand1,
      lowerBand1,
      upperBand2,
      lowerBand2,
      volume: cumulativeVolume,
      pricePosition
    };
  }

  /**
   * Identify psychological levels with Fibonacci confirmation
   */
  public identifyPsychologicalLevels(data: OHLCData[], timeframe: TimeFrame): PsychologicalLevel[] {
    const currentPrice = data[data.length - 1].close;
    const high = Math.max(...data.slice(-100).map(d => d.high));
    const low = Math.min(...data.slice(-100).map(d => d.low));
    
    const levels: PsychologicalLevel[] = [];
    
    // Round number levels
    const roundNumbers = this.generateRoundNumbers(currentPrice);
    roundNumbers.forEach(level => {
      levels.push({
        level,
        type: 'round_number',
        strength: this.calculateLevelStrength(level, data),
        confluence: ['round_number'],
        timeframe
      });
    });
    
    // Fibonacci levels
    const fibLevels = this.calculateFibonacciLevels(high, low);
    fibLevels.forEach(level => {
      const confluence = ['fibonacci'];
      
      // Check for round number confluence
      if (this.isNearRoundNumber(level.level)) {
        confluence.push('round_number');
      }
      
      levels.push({
        level: level.level,
        type: 'fibonacci',
        strength: level.strength,
        confluence,
        timeframe
      });
    });
    
    // Previous highs and lows
    const pivots = this.findSignificantPivots(data);
    pivots.forEach(pivot => {
      levels.push({
        level: pivot.price,
        type: pivot.type as 'previous_high' | 'previous_low',
        strength: pivot.strength,
        confluence: [pivot.type],
        timeframe
      });
    });
    
    return levels.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Analyze candlestick patterns for scalping (1m-15m timeframes)
   */
  public analyzeCandlestickClose(data: OHLCData[], timeframe: TimeFrame): CandlestickAnalysis {
    if (data.length < 3) {
      return {
        pattern: 'insufficient_data',
        direction: 'neutral',
        strength: 0,
        closeType: 'indecision',
        volumeConfirmation: false,
        reliability: 0
      };
    }
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    const beforePrevious = data[data.length - 3];
    
    // Analyze current candle
    const bodySize = Math.abs(current.close - current.open);
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const totalRange = current.high - current.low;
    
    // Determine close type
    let closeType: CandlestickAnalysis['closeType'];
    const closePosition = (current.close - current.low) / (current.high - current.low);
    
    if (closePosition > 0.8) closeType = 'strong_close';
    else if (closePosition < 0.2) closeType = 'strong_close';
    else if (upperWick > bodySize * 1.5 || lowerWick > bodySize * 1.5) closeType = 'rejection';
    else if (bodySize < totalRange * 0.3) closeType = 'indecision';
    else closeType = 'weak_close';
    
    // Pattern recognition
    const pattern = this.identifyPattern(current, previous, beforePrevious);
    
    // Volume confirmation
    const avgVolume = data.slice(-10).reduce((sum, d) => sum + (d.volume || 1000), 0) / 10;
    const volumeConfirmation = (current.volume || 1000) > avgVolume * 1.2;
    
    // Direction and strength
    const direction = current.close > current.open ? 'bullish' : 
                     current.close < current.open ? 'bearish' : 'neutral';
    
    const strength = this.calculatePatternStrength(pattern, closeType, volumeConfirmation);
    
    return {
      pattern,
      direction,
      strength,
      closeType,
      volumeConfirmation,
      reliability: this.calculateReliability(timeframe, pattern, volumeConfirmation)
    };
  }

  // Helper methods
  private findSwingPoints(prices: number[], type: 'high' | 'low'): Array<{price: number, index: number}> {
    const points: Array<{price: number, index: number}> = [];
    const lookback = 5;
    
    for (let i = lookback; i < prices.length - lookback; i++) {
      const isSwingHigh = type === 'high' && 
        prices.slice(i - lookback, i).every(p => p <= prices[i]) &&
        prices.slice(i + 1, i + lookback + 1).every(p => p <= prices[i]);
        
      const isSwingLow = type === 'low' && 
        prices.slice(i - lookback, i).every(p => p >= prices[i]) &&
        prices.slice(i + 1, i + lookback + 1).every(p => p >= prices[i]);
      
      if (isSwingHigh || isSwingLow) {
        points.push({ price: prices[i], index: i });
      }
    }
    
    return points;
  }

  private determineTrend(highs: Array<{price: number, index: number}>, lows: Array<{price: number, index: number}>): 'uptrend' | 'downtrend' | 'sideways' {
    if (highs.length < 2 || lows.length < 2) return 'sideways';
    
    const recentHighs = highs.slice(-3);
    const recentLows = lows.slice(-3);
    
    const higherHighs = recentHighs.length >= 2 && recentHighs[recentHighs.length - 1].price > recentHighs[recentHighs.length - 2].price;
    const higherLows = recentLows.length >= 2 && recentLows[recentLows.length - 1].price > recentLows[recentLows.length - 2].price;
    
    const lowerHighs = recentHighs.length >= 2 && recentHighs[recentHighs.length - 1].price < recentHighs[recentHighs.length - 2].price;
    const lowerLows = recentLows.length >= 2 && recentLows[recentLows.length - 1].price < recentLows[recentLows.length - 2].price;
    
    if (higherHighs && higherLows) return 'uptrend';
    if (lowerHighs && lowerLows) return 'downtrend';
    return 'sideways';
  }

  private analyzeStructureBreak(highs: Array<{price: number, index: number}>, lows: Array<{price: number, index: number}>, closes: number[]): 'break_of_structure' | 'change_of_character' | 'continuation' {
    // Simplified structure analysis
    if (highs.length < 2 || lows.length < 2) return 'continuation';
    
    const lastClose = closes[closes.length - 1];
    const lastHigh = highs[highs.length - 1];
    const lastLow = lows[lows.length - 1];
    
    // Check for break of structure
    if (lastClose > lastHigh.price * 1.002) return 'break_of_structure';
    if (lastClose < lastLow.price * 0.998) return 'break_of_structure';
    
    return 'continuation';
  }

  private identifyOrderBlocks(data: OHLCData[], highs: Array<{price: number, index: number}>, lows: Array<{price: number, index: number}>): SupplyDemandZone[] {
    const zones: SupplyDemandZone[] = [];
    
    // Identify supply zones near swing highs
    highs.slice(-5).forEach(high => {
      const zone: SupplyDemandZone = {
        level: high.price,
        type: 'supply',
        strength: 'moderate',
        timeframe: '15m' as TimeFrame,
        volume: data[high.index]?.volume || 1000,
        touches: 1,
        freshness: 'fresh'
      };
      zones.push(zone);
    });
    
    // Identify demand zones near swing lows
    lows.slice(-5).forEach(low => {
      const zone: SupplyDemandZone = {
        level: low.price,
        type: 'demand',
        strength: 'moderate',
        timeframe: '15m' as TimeFrame,
        volume: data[low.index]?.volume || 1000,
        touches: 1,
        freshness: 'fresh'
      };
      zones.push(zone);
    });
    
    return zones;
  }

  private identifyLiquidityZones(data: OHLCData[], highs: Array<{price: number, index: number}>, lows: Array<{price: number, index: number}>) {
    const zones: Array<{level: number, type: 'buy_side' | 'sell_side', strength: number}> = [];
    
    // Buy-side liquidity above recent highs
    highs.slice(-3).forEach(high => {
      zones.push({
        level: high.price * 1.001,
        type: 'buy_side',
        strength: 70
      });
    });
    
    // Sell-side liquidity below recent lows
    lows.slice(-3).forEach(low => {
      zones.push({
        level: low.price * 0.999,
        type: 'sell_side',
        strength: 70
      });
    });
    
    return zones;
  }

  private generateRoundNumbers(price: number): number[] {
    const levels: number[] = [];
    const magnitude = Math.pow(10, Math.floor(Math.log10(price)));
    
    // Generate round numbers around current price
    for (let i = -5; i <= 5; i++) {
      const level = Math.round(price / magnitude + i) * magnitude;
      if (Math.abs(level - price) / price < 0.1) { // Within 10%
        levels.push(level);
      }
    }
    
    return levels;
  }

  private calculateFibonacciLevels(high: number, low: number): Array<{level: number, strength: number}> {
    const range = high - low;
    const fibRatios = [0.236, 0.382, 0.5, 0.618, 0.786];
    
    return fibRatios.map(ratio => ({
      level: low + (range * ratio),
      strength: ratio === 0.382 || ratio === 0.618 ? 90 : 70
    }));
  }

  private calculateLevelStrength(level: number, data: OHLCData[]): number {
    let touches = 0;
    const tolerance = level * 0.002; // 0.2% tolerance
    
    data.slice(-50).forEach(candle => {
      if (Math.abs(candle.high - level) < tolerance || 
          Math.abs(candle.low - level) < tolerance ||
          Math.abs(candle.close - level) < tolerance) {
        touches++;
      }
    });
    
    return Math.min(touches * 15 + 30, 100);
  }

  private isNearRoundNumber(price: number): boolean {
    const magnitude = Math.pow(10, Math.floor(Math.log10(price)));
    const normalized = price / magnitude;
    const roundNormalized = Math.round(normalized);
    
    return Math.abs(normalized - roundNormalized) < 0.02;
  }

  private findSignificantPivots(data: OHLCData[]): Array<{price: number, type: string, strength: number}> {
    const pivots: Array<{price: number, type: string, strength: number}> = [];
    
    // Find recent significant highs and lows
    const recent = data.slice(-50);
    const maxHigh = Math.max(...recent.map(d => d.high));
    const minLow = Math.min(...recent.map(d => d.low));
    
    pivots.push({
      price: maxHigh,
      type: 'previous_high',
      strength: 80
    });
    
    pivots.push({
      price: minLow,
      type: 'previous_low',
      strength: 80
    });
    
    return pivots;
  }

  private identifyPattern(current: OHLCData, previous: OHLCData, beforePrevious: OHLCData): string {
    // Simplified pattern recognition
    const currentBody = Math.abs(current.close - current.open);
    const currentRange = current.high - current.low;
    
    if (currentBody < currentRange * 0.2) return 'doji';
    if (current.close > current.open && currentBody > currentRange * 0.7) return 'strong_bullish';
    if (current.close < current.open && currentBody > currentRange * 0.7) return 'strong_bearish';
    if (current.high - Math.max(current.open, current.close) > currentBody * 1.5) return 'shooting_star';
    if (Math.min(current.open, current.close) - current.low > currentBody * 1.5) return 'hammer';
    
    return 'neutral';
  }

  private calculatePatternStrength(pattern: string, closeType: CandlestickAnalysis['closeType'], volumeConfirmation: boolean): number {
    let strength = 50;
    
    // Pattern strength
    switch (pattern) {
      case 'strong_bullish':
      case 'strong_bearish':
        strength += 30;
        break;
      case 'hammer':
      case 'shooting_star':
        strength += 20;
        break;
      case 'doji':
        strength += 10;
        break;
    }
    
    // Close type strength
    if (closeType === 'strong_close') strength += 20;
    else if (closeType === 'rejection') strength += 15;
    
    // Volume confirmation
    if (volumeConfirmation) strength += 15;
    
    return Math.min(strength, 100);
  }

  private calculateReliability(timeframe: TimeFrame, pattern: string, volumeConfirmation: boolean): number {
    let reliability = 60;
    
    // Timeframe reliability (shorter = less reliable for patterns)
    const timeframeMultiplier = {
      '1m': 0.6,
      '5m': 0.8,
      '15m': 1.0,
      '30m': 1.1,
      '1h': 1.2
    };
    
    reliability *= timeframeMultiplier[timeframe] || 1.0;
    
    // Pattern reliability
    if (pattern.includes('strong')) reliability += 20;
    if (volumeConfirmation) reliability += 15;
    
    return Math.min(reliability, 95);
  }
}

export const advancedMarketStructureAnalyzer = new AdvancedMarketStructureAnalyzer();