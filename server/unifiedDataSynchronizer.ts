/**
 * Unified Data Synchronizer - Ensures Perfect Dashboard-Signals Alignment
 * Single source of truth for all market data, signals, and analysis
 */

import { optimizedCoinMarketCapService } from './optimizedCoinMarketCapService.js';
import { automatedSignalCalculator } from './automatedSignalCalculator.js';
import { ENHANCED_SYMBOL_MAPPINGS } from './symbolMapping.js';

interface UnifiedMarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  signals: Record<string, any>;
  technicalAnalysis: any;
  confidence: number;
  direction: string;
  timestamp: number;
}

interface SynchronizedResponse {
  marketData: UnifiedMarketData[];
  heatmapEntries: any[];
  signalsData: Record<string, any>;
  analysisData: Record<string, any>;
  metadata: {
    totalSymbols: number;
    dataSource: string;
    timeframe: string;
    timestamp: number;
    synchronizationVersion: string;
  };
}

export class UnifiedDataSynchronizer {
  private cache = new Map<string, any>();
  private lastSync = 0;
  private syncInterval = 30000; // 30 seconds

  /**
   * Get synchronized market data for all symbols
   */
  async getSynchronizedMarketData(timeframe: string = '4h'): Promise<SynchronizedResponse> {
    const cacheKey = `unified_${timeframe}`;
    const now = Date.now();
    
    // Check cache first
    if (this.cache.has(cacheKey) && (now - this.lastSync) < this.syncInterval) {
      return this.cache.get(cacheKey);
    }

    const allSymbols = Object.keys(ENHANCED_SYMBOL_MAPPINGS);
    const marketData: UnifiedMarketData[] = [];
    const heatmapEntries: any[] = [];
    const signalsData: Record<string, any> = {};
    const analysisData: Record<string, any> = {};

    for (const symbol of allSymbols) {
      try {
        // Get unified data for each symbol
        const unifiedData = await this.getUnifiedSymbolData(symbol, timeframe);
        
        if (unifiedData) {
          marketData.push(unifiedData);
          
          // Create heatmap entry
          heatmapEntries.push(this.createHeatmapEntry(unifiedData, timeframe));
          
          // Store signals data
          signalsData[symbol] = unifiedData.signals;
          
          // Store analysis data
          analysisData[symbol] = unifiedData.technicalAnalysis;
        }
      } catch (error) {
        console.warn(`[UnifiedSync] Failed to sync ${symbol}:`, error);
      }
    }

    const response: SynchronizedResponse = {
      marketData,
      heatmapEntries,
      signalsData,
      analysisData,
      metadata: {
        totalSymbols: marketData.length,
        dataSource: 'optimizedCoinMarketCap',
        timeframe,
        timestamp: now,
        synchronizationVersion: '2.0'
      }
    };

    // Cache the response
    this.cache.set(cacheKey, response);
    this.lastSync = now;

    console.log(`[UnifiedSync] Synchronized ${marketData.length} symbols for ${timeframe}`);
    return response;
  }

  /**
   * Get unified data for a single symbol
   */
  async getUnifiedSymbolData(symbol: string, timeframe: string): Promise<UnifiedMarketData | null> {
    try {
      // Get price data from CoinMarketCap service
      const quotesResponse = await optimizedCoinMarketCapService.getQuotes([symbol]);
      
      if (!quotesResponse || !quotesResponse[symbol]) {
        return null;
      }
      
      const priceData = quotesResponse[symbol];

      // Get signals from automated calculator
      const signals = automatedSignalCalculator.getSignals(symbol, timeframe);
      const latestSignal = signals && signals.length > 0 ? signals[0] : null;

      // Create technical analysis data
      const technicalAnalysis = this.generateTechnicalAnalysis(priceData, latestSignal);

      // Determine overall direction and confidence
      const direction = latestSignal?.direction || 'NEUTRAL';
      const confidence = latestSignal?.confidence || 50;

      return {
        symbol,
        name: this.getSymbolName(symbol),
        price: priceData.price,
        change24h: priceData.change24h || 0,
        changePercent24h: priceData.changePercent24h || 0,
        signals: this.formatSignalsData(signals, timeframe),
        technicalAnalysis,
        confidence,
        direction,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`[UnifiedSync] Error getting data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Create heatmap entry from unified data
   */
  private createHeatmapEntry(data: UnifiedMarketData, timeframe: string): any {
    const signalStrength = data.confidence / 100;
    const priceChangeAbs = Math.abs(data.changePercent24h);
    
    return {
      id: data.symbol.toLowerCase().replace('/', ''),
      symbol: data.symbol,
      name: data.name,
      currentPrice: data.price,
      priceChange24h: data.change24h,
      priceChangePercentage24h: data.changePercent24h,
      confidence: data.confidence,
      signals: {
        [timeframe]: {
          direction: data.direction,
          confidence: data.confidence,
          strength: signalStrength,
          timestamp: data.timestamp
        }
      },
      sentiment: {
        direction: data.direction,
        strength: signalStrength,
        score: data.confidence
      },
      technicalAnalysis: data.technicalAnalysis,
      volume: 0, // Volume data would require additional API calls
      marketCap: 0,
      opacity: Math.max(0.1, Math.min(1.0, signalStrength)),
      size: Math.max(0.1, Math.min(1.0, priceChangeAbs / 10))
    };
  }

  /**
   * Format signals data for consistency
   */
  private formatSignalsData(signals: any[], timeframe: string): Record<string, any> {
    const formattedSignals: Record<string, any> = {};
    
    if (signals && signals.length > 0) {
      const signal = signals[0];
      formattedSignals[timeframe] = {
        direction: signal.direction,
        confidence: signal.confidence,
        strength: signal.strength || (signal.confidence / 100),
        timestamp: signal.timestamp || Date.now(),
        indicators: signal.indicators || {},
        price: signal.price
      };
    }
    
    return formattedSignals;
  }

  /**
   * Generate technical analysis from price and signal data
   */
  private generateTechnicalAnalysis(priceData: any, signal: any): any {
    return {
      trend: signal?.direction || 'NEUTRAL',
      momentum: this.calculateMomentum(priceData.changePercent24h),
      volatility: this.calculateVolatility(priceData.changePercent24h),
      support: priceData.price * 0.95,
      resistance: priceData.price * 1.05,
      recommendation: this.generateRecommendation(signal?.direction, signal?.confidence),
      indicators: signal?.indicators || {},
      lastUpdated: Date.now()
    };
  }

  /**
   * Calculate momentum from price change
   */
  private calculateMomentum(changePercent: number): string {
    if (changePercent > 5) return 'STRONG_BULLISH';
    if (changePercent > 2) return 'BULLISH';
    if (changePercent < -5) return 'STRONG_BEARISH';
    if (changePercent < -2) return 'BEARISH';
    return 'NEUTRAL';
  }

  /**
   * Calculate volatility from price change
   */
  private calculateVolatility(changePercent: number): string {
    const absChange = Math.abs(changePercent);
    if (absChange > 10) return 'HIGH';
    if (absChange > 5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate trading recommendation
   */
  private generateRecommendation(direction: string, confidence: number): any {
    if (!direction || !confidence) {
      return { action: 'HOLD', strength: 'WEAK' };
    }

    const strength = confidence > 80 ? 'STRONG' : confidence > 60 ? 'MODERATE' : 'WEAK';
    
    let action = 'HOLD';
    if (direction === 'LONG' && confidence > 60) action = 'BUY';
    if (direction === 'SHORT' && confidence > 60) action = 'SELL';
    
    return { action, strength, confidence };
  }

  /**
   * Get human-readable symbol name
   */
  private getSymbolName(symbol: string): string {
    const [base, quote] = symbol.split('/');
    const symbolNames: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'BNB',
      'XRP': 'XRP',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'AVAX': 'Avalanche',
      'DOGE': 'Dogecoin',
      'LINK': 'Chainlink',
      'MATIC': 'Polygon',
      'UNI': 'Uniswap',
      'DOT': 'Polkadot',
      'ATOM': 'Cosmos',
      'NEAR': 'Near Protocol',
      'AAVE': 'Aave',
      'SUI': 'Sui',
      'ARB': 'Arbitrum',
      'OP': 'Optimism'
    };
    
    return symbolNames[base] || `${base} / ${quote}`;
  }

  /**
   * Clear cache to force refresh
   */
  clearCache(): void {
    this.cache.clear();
    this.lastSync = 0;
    console.log('[UnifiedSync] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    return {
      cacheSize: this.cache.size,
      lastSync: this.lastSync,
      syncInterval: this.syncInterval,
      nextSyncIn: Math.max(0, this.syncInterval - (Date.now() - this.lastSync))
    };
  }
}

export const unifiedDataSynchronizer = new UnifiedDataSynchronizer();