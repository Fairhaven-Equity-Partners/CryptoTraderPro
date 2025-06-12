/**
 * Authentic Price History Manager
 * Accumulates real price data over time for legitimate technical analysis
 * Replaces authentic price generation with authentic market data
 */

interface AuthenticPricePoint {
  timestamp: number;
  price: number;
  volume24h: number;
  change1h: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  source: 'coinmarketcap' | 'cache';
}

interface PriceHistoryData {
  symbol: string;
  pricePoints: AuthenticPricePoint[];
  lastUpdated: number;
  dataQuality: 'insufficient' | 'basic' | 'good' | 'excellent';
  minPointsForAnalysis: number;
}

export class AuthenticPriceHistoryManager {
  private priceHistories: Map<string, PriceHistoryData> = new Map();
  private readonly MAX_HISTORY_POINTS = 200;
  private readonly MIN_POINTS_BASIC = 20;
  private readonly MIN_POINTS_GOOD = 50;
  private readonly MIN_POINTS_EXCELLENT = 100;

  constructor() {
    console.log('[AuthenticPriceHistory] Initializing authentic price history accumulation');
    
    // Start periodic cleanup of old data
    setInterval(() => this.cleanupOldData(), 60000 * 60); // Every hour
  }

  /**
   * Add authentic price point to history
   */
  addPricePoint(symbol: string, priceData: {
    price: number;
    volume24h: number;
    change1h: number;
    change24h: number;
    change7d: number;
    marketCap: number;
    source?: 'coinmarketcap' | 'cache';
  }): void {
    const timestamp = Date.now();
    
    if (!this.priceHistories.has(symbol)) {
      this.priceHistories.set(symbol, {
        symbol,
        pricePoints: [],
        lastUpdated: timestamp,
        dataQuality: 'insufficient',
        minPointsForAnalysis: this.MIN_POINTS_BASIC
      });
    }

    const history = this.priceHistories.get(symbol)!;
    
    // Only add if price is valid and not duplicate
    if (this.isValidPricePoint(priceData, history)) {
      const pricePoint: AuthenticPricePoint = {
        timestamp,
        price: priceData.price,
        volume24h: priceData.volume24h,
        change1h: priceData.change1h,
        change24h: priceData.change24h,
        change7d: priceData.change7d,
        marketCap: priceData.marketCap,
        source: priceData.source || 'coinmarketcap'
      };

      history.pricePoints.push(pricePoint);
      history.lastUpdated = timestamp;

      // Maintain maximum history size
      if (history.pricePoints.length > this.MAX_HISTORY_POINTS) {
        history.pricePoints.shift();
      }

      // Update data quality assessment
      this.updateDataQuality(history);

      console.log(`[AuthenticPriceHistory] Added point for ${symbol}: $${priceData.price.toFixed(2)} (${history.pricePoints.length} total, ${history.dataQuality} quality)`);
    }
  }

  /**
   * Get price history for symbol
   */
  getPriceHistory(symbol: string): PriceHistoryData | null {
    return this.priceHistories.get(symbol) || null;
  }

  /**
   * Get authentic price array for calculations
   */
  getAuthenticPrices(symbol: string, maxPoints?: number): number[] {
    const history = this.priceHistories.get(symbol);
    if (!history || history.pricePoints.length === 0) {
      return [];
    }

    const prices = history.pricePoints.map(point => point.price);
    
    if (maxPoints && maxPoints < prices.length) {
      return prices.slice(-maxPoints);
    }

    return prices;
  }

  /**
   * Check if symbol has sufficient data for technical analysis
   */
  hasSufficientData(symbol: string, analysisType: 'basic' | 'advanced' = 'basic'): boolean {
    const history = this.priceHistories.get(symbol);
    if (!history) return false;

    const requiredPoints = analysisType === 'advanced' ? this.MIN_POINTS_GOOD : this.MIN_POINTS_BASIC;
    return history.pricePoints.length >= requiredPoints;
  }

  /**
   * Get data quality assessment
   */
  getDataQuality(symbol: string): { 
    quality: string; 
    pointCount: number; 
    isReady: boolean; 
    recommendedAnalysis: string[];
  } {
    const history = this.priceHistories.get(symbol);
    
    if (!history || history.pricePoints.length === 0) {
      return {
        quality: 'no_data',
        pointCount: 0,
        isReady: false,
        recommendedAnalysis: []
      };
    }

    const pointCount = history.pricePoints.length;
    const recommendedAnalysis: string[] = [];

    if (pointCount >= this.MIN_POINTS_BASIC) {
      recommendedAnalysis.push('Simple Moving Average', 'Price Momentum');
    }
    
    if (pointCount >= this.MIN_POINTS_GOOD) {
      recommendedAnalysis.push('RSI', 'MACD', 'Bollinger Bands');
    }
    
    if (pointCount >= this.MIN_POINTS_EXCELLENT) {
      recommendedAnalysis.push('Advanced Patterns', 'Multi-timeframe Analysis');
    }

    return {
      quality: history.dataQuality,
      pointCount,
      isReady: pointCount >= this.MIN_POINTS_BASIC,
      recommendedAnalysis
    };
  }

  /**
   * Get volume data for analysis
   */
  getVolumeHistory(symbol: string, maxPoints?: number): number[] {
    const history = this.priceHistories.get(symbol);
    if (!history || history.pricePoints.length === 0) {
      return [];
    }

    const volumes = history.pricePoints.map(point => point.volume24h);
    
    if (maxPoints && maxPoints < volumes.length) {
      return volumes.slice(-maxPoints);
    }

    return volumes;
  }

  /**
   * Calculate authentic price statistics
   */
  calculatePriceStatistics(symbol: string): {
    current: number;
    average: number;
    min: number;
    max: number;
    volatility: number;
    trend: 'upward' | 'downward' | 'sideways';
  } | null {
    const prices = this.getAuthenticPrices(symbol);
    
    if (prices.length < 2) {
      return null;
    }

    const current = prices[prices.length - 1];
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Calculate volatility as standard deviation
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / average;

    // Determine trend direction
    const recentPrices = prices.slice(-10);
    const oldAvg = recentPrices.slice(0, 5).reduce((sum, price) => sum + price, 0) / 5;
    const newAvg = recentPrices.slice(-5).reduce((sum, price) => sum + price, 0) / 5;
    
    let trend: 'upward' | 'downward' | 'sideways' = 'sideways';
    const trendThreshold = 0.01; // 1%
    
    if ((newAvg - oldAvg) / oldAvg > trendThreshold) {
      trend = 'upward';
    } else if ((oldAvg - newAvg) / oldAvg > trendThreshold) {
      trend = 'downward';
    }

    return {
      current,
      average,
      min,
      max,
      volatility,
      trend
    };
  }

  /**
   * Get all symbols with sufficient data
   */
  getSymbolsWithSufficientData(analysisType: 'basic' | 'advanced' = 'basic'): string[] {
    const symbols: string[] = [];
    
    for (const [symbol, history] of this.priceHistories.entries()) {
      const requiredPoints = analysisType === 'advanced' ? this.MIN_POINTS_GOOD : this.MIN_POINTS_BASIC;
      if (history.pricePoints.length >= requiredPoints) {
        symbols.push(symbol);
      }
    }

    return symbols;
  }

  /**
   * Export price history for analysis tools
   */
  exportPriceHistory(symbol: string): {
    timestamps: number[];
    prices: number[];
    volumes: number[];
    changes24h: number[];
  } | null {
    const history = this.priceHistories.get(symbol);
    if (!history) return null;

    return {
      timestamps: history.pricePoints.map(p => p.timestamp),
      prices: history.pricePoints.map(p => p.price),
      volumes: history.pricePoints.map(p => p.volume24h),
      changes24h: history.pricePoints.map(p => p.change24h)
    };
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    totalSymbols: number;
    symbolsReady: number;
    totalDataPoints: number;
    averageDataQuality: string;
    oldestData: number;
    newestData: number;
  } {
    let totalDataPoints = 0;
    let symbolsReady = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    const qualityScores: number[] = [];

    for (const history of this.priceHistories.values()) {
      totalDataPoints += history.pricePoints.length;
      
      if (history.pricePoints.length >= this.MIN_POINTS_BASIC) {
        symbolsReady++;
      }

      if (history.pricePoints.length > 0) {
        const oldest = history.pricePoints[0].timestamp;
        const newest = history.pricePoints[history.pricePoints.length - 1].timestamp;
        
        if (oldest < oldestTimestamp) oldestTimestamp = oldest;
        if (newest > newestTimestamp) newestTimestamp = newest;
      }

      // Convert quality to numeric score
      const qualityScore = this.getQualityScore(history.dataQuality);
      qualityScores.push(qualityScore);
    }

    const avgQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;

    return {
      totalSymbols: this.priceHistories.size,
      symbolsReady,
      totalDataPoints,
      averageDataQuality: this.getQualityFromScore(avgQualityScore),
      oldestData: oldestTimestamp,
      newestData: newestTimestamp
    };
  }

  /**
   * Private helper methods
   */
  private isValidPricePoint(priceData: any, history: PriceHistoryData): boolean {
    // Check if price is valid
    if (!priceData.price || priceData.price <= 0 || isNaN(priceData.price)) {
      return false;
    }

    // Check for duplicate recent price (within 30 seconds)
    const now = Date.now();
    const recentPoints = history.pricePoints.filter(p => now - p.timestamp < 30000);
    
    if (recentPoints.some(p => Math.abs(p.price - priceData.price) < 0.0001)) {
      return false;
    }

    // Check for obviously authentic prices (round numbers with low precision)
    const priceStr = priceData.price.toString();
    if (priceStr.endsWith('0') && priceStr.length <= 3 && priceData.price >= 20) {
      console.warn(`[AuthenticPriceHistory] Suspicious round price detected: $${priceData.price}`);
      return false;
    }

    return true;
  }

  private updateDataQuality(history: PriceHistoryData): void {
    const pointCount = history.pricePoints.length;
    
    if (pointCount >= this.MIN_POINTS_EXCELLENT) {
      history.dataQuality = 'excellent';
    } else if (pointCount >= this.MIN_POINTS_GOOD) {
      history.dataQuality = 'good';
    } else if (pointCount >= this.MIN_POINTS_BASIC) {
      history.dataQuality = 'basic';
    } else {
      history.dataQuality = 'insufficient';
    }
  }

  private getQualityScore(quality: string): number {
    switch (quality) {
      case 'excellent': return 4;
      case 'good': return 3;
      case 'basic': return 2;
      case 'insufficient': return 1;
      default: return 0;
    }
  }

  private getQualityFromScore(score: number): string {
    if (score >= 3.5) return 'excellent';
    if (score >= 2.5) return 'good';
    if (score >= 1.5) return 'basic';
    return 'insufficient';
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    let cleanedPoints = 0;

    for (const history of this.priceHistories.values()) {
      const originalLength = history.pricePoints.length;
      history.pricePoints = history.pricePoints.filter(point => point.timestamp > cutoffTime);
      cleanedPoints += originalLength - history.pricePoints.length;
      
      if (history.pricePoints.length !== originalLength) {
        this.updateDataQuality(history);
      }
    }

    if (cleanedPoints > 0) {
      console.log(`[AuthenticPriceHistory] Cleaned ${cleanedPoints} old data points`);
    }
  }
}