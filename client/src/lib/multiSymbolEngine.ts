/**
 * Multi-Symbol Calculation Engine
 * Extends the unified calculation core to support all cryptocurrency pairs
 */

import { unifiedCalculationCore } from './unifiedCalculationCore';
import { TimeFrame } from '../../../shared/schema';

export interface MultiSymbolConfig {
  symbols: string[];
  timeframes: TimeFrame[];
  batchSize: number;
  processingDelay: number;
}

export class MultiSymbolEngine {
  private config: MultiSymbolConfig;
  private processingQueue: Map<string, boolean>;
  private calculationResults: Map<string, any>;

  constructor(config: Partial<MultiSymbolConfig> = {}) {
    this.config = {
      symbols: [],
      timeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'],
      batchSize: 5,
      processingDelay: 200,
      ...config
    };
    
    this.processingQueue = new Map();
    this.calculationResults = new Map();
  }

  /**
   * Initialize supported symbols from symbol mapping
   */
  async initializeSupportedSymbols(): Promise<void> {
    try {
      // Import symbol mappings
      const response = await fetch('/api/crypto');
      const cryptoAssets = await response.json();
      
      this.config.symbols = cryptoAssets.map((asset: any) => asset.symbol);
      console.log(`Initialized multi-symbol engine with ${this.config.symbols.length} supported symbols`);
    } catch (error) {
      console.error('Failed to initialize supported symbols:', error);
      // Fallback to major cryptocurrencies
      this.config.symbols = [
        'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'SOL/USDT',
        'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'MATIC/USDT', 'UNI/USDT'
      ];
    }
  }

  /**
   * Process calculations for all symbols
   */
  async processAllSymbols(currentPrices: Map<string, number>): Promise<Map<string, any>> {
    const results = new Map();
    const batches = this.createBatches(this.config.symbols, this.config.batchSize);

    for (const batch of batches) {
      // Fetch authentic API prices for each symbol in the batch
      const batchPromises = batch.map(async symbol => {
        let authenticPrice = 0;
        try {
          // Get authentic price from API endpoint
          const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
          if (response.ok) {
            const data = await response.json();
            authenticPrice = data.lastPrice || 0;
          }
        } catch (error) {
          console.warn(`Failed to fetch authentic price for ${symbol}, using cached:`, error);
          authenticPrice = currentPrices.get(symbol) || 0;
        }
        
        return this.processSymbol(symbol, authenticPrice);
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result) {
          results.set(batch[index], result);
        }
      });

      // Add delay between batches to prevent API throttling
      if (this.config.processingDelay > 0) {
        await this.delay(this.config.processingDelay);
      }
    }

    this.calculationResults = results;
    return results;
  }

  /**
   * Process calculations for a single symbol
   */
  async processSymbol(symbol: string, currentPrice: number): Promise<any> {
    if (this.processingQueue.get(symbol)) {
      return null; // Already processing
    }

    this.processingQueue.set(symbol, true);

    try {
      const symbolResults = new Map();

      // Process each timeframe for the symbol
      for (const timeframe of this.config.timeframes) {
        try {
          const signal = unifiedCalculationCore.generateSignal(symbol, timeframe, currentPrice);
          if (signal) {
            symbolResults.set(timeframe, signal);
          }
        } catch (error) {
          console.error(`Error processing ${symbol} ${timeframe}:`, error);
        }
      }

      return symbolResults;
    } finally {
      this.processingQueue.set(symbol, false);
    }
  }

  /**
   * Get latest calculation results for a symbol
   */
  getSymbolResults(symbol: string): Map<string, any> | null {
    return this.calculationResults.get(symbol) || null;
  }

  /**
   * Get all calculation results
   */
  getAllResults(): Map<string, any> {
    return new Map(this.calculationResults);
  }

  /**
   * Update market data for a symbol across all timeframes
   */
  async updateSymbolData(symbol: string, marketData: any): Promise<void> {
    if (!marketData || !marketData.timeframes) {
      return;
    }

    // Update unified calculation core with new data for each timeframe
    for (const timeframe of this.config.timeframes) {
      const timeframeData = marketData.timeframes[timeframe];
      if (timeframeData && Array.isArray(timeframeData)) {
        unifiedCalculationCore.updateMarketData(symbol, timeframe, timeframeData);
      }
    }
  }

  /**
   * Check if symbol is supported
   */
  isSymbolSupported(symbol: string): boolean {
    return this.config.symbols.includes(symbol);
  }

  /**
   * Get supported symbols
   */
  getSupportedSymbols(): string[] {
    return [...this.config.symbols];
  }

  /**
   * Create processing batches
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay utility for batch processing
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate comprehensive market analysis for all symbols
   */
  async generateMarketAnalysis(): Promise<any> {
    const analysis = {
      timestamp: Date.now(),
      totalSymbols: this.config.symbols.length,
      processedSymbols: 0,
      marketOverview: {
        bullishSignals: 0,
        bearishSignals: 0,
        neutralSignals: 0
      },
      topPerformers: [],
      marketRegimes: new Map(),
      volatilityDistribution: new Map()
    };

    // Analyze all processed symbols
    for (const [symbol, symbolResults] of this.calculationResults) {
      if (!symbolResults) continue;

      analysis.processedSymbols++;

      // Analyze signals across timeframes
      for (const [timeframe, signal] of symbolResults) {
        if (!signal) continue;

        // Count signal directions
        switch (signal.direction) {
          case 'LONG':
            analysis.marketOverview.bullishSignals++;
            break;
          case 'SHORT':
            analysis.marketOverview.bearishSignals++;
            break;
          case 'NEUTRAL':
            analysis.marketOverview.neutralSignals++;
            break;
        }

        // Track market regimes
        const regime = signal.indicators?.marketRegime || 'UNKNOWN';
        analysis.marketRegimes.set(regime, (analysis.marketRegimes.get(regime) || 0) + 1);

        // Track volatility distribution
        const volatility = signal.indicators?.volatility || 0;
        const volatilityBucket = this.getVolatilityBucket(volatility);
        analysis.volatilityDistribution.set(volatilityBucket, 
          (analysis.volatilityDistribution.get(volatilityBucket) || 0) + 1);
      }
    }

    return analysis;
  }

  /**
   * Get volatility bucket for distribution analysis
   */
  private getVolatilityBucket(volatility: number): string {
    if (volatility < 0.02) return 'LOW';
    if (volatility < 0.05) return 'MODERATE';
    if (volatility < 0.08) return 'HIGH';
    return 'EXTREME';
  }

  /**
   * Clear calculation results
   */
  clearResults(): void {
    this.calculationResults.clear();
    this.processingQueue.clear();
  }

  /**
   * Get processing status
   */
  getProcessingStatus(): any {
    const totalSymbols = this.config.symbols.length;
    const processingCount = Array.from(this.processingQueue.values())
      .filter(isProcessing => isProcessing).length;
    const completedCount = this.calculationResults.size;

    return {
      total: totalSymbols,
      processing: processingCount,
      completed: completedCount,
      progress: totalSymbols > 0 ? (completedCount / totalSymbols) * 100 : 0
    };
  }
}

// Export singleton instance
export const multiSymbolEngine = new MultiSymbolEngine();

// Initialize on module load
multiSymbolEngine.initializeSupportedSymbols().catch(console.error);