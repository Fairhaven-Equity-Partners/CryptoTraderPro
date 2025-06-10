/**
 * Clean Multi-Pair Manager using CoinMarketCap API
 * Replaces the broken CoinGecko implementation
 */

import { coinMarketCapService } from './coinMarketCapService.js';
import { getCMCSymbol } from './optimizedSymbolMapping.js';

interface PairData {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdate: number;
  isActive: boolean;
}

interface BatchFetchResult {
  successful: string[];
  failed: string[];
  data: Map<string, PairData>;
}

export class CleanMultiPairManager {
  private pairData = new Map<string, PairData>();
  private lastUpdateTime = 0;
  private updateInterval = 4 * 60 * 1000; // 4 minutes
  private isUpdating = false;

  constructor() {
    this.startPeriodicUpdates();
  }

  private startPeriodicUpdates(): void {
    setInterval(async () => {
      if (!this.isUpdating) {
        await this.updateAllPairs();
      }
    }, this.updateInterval);
  }

  async updateAllPairs(): Promise<BatchFetchResult> {
    if (this.isUpdating) {
      return this.createEmptyResult();
    }

    this.isUpdating = true;
    const result: BatchFetchResult = {
      successful: [],
      failed: [],
      data: new Map()
    };

    try {
      // Get all supported symbols
      const symbols = [
        'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'SOL/USDT',
        'USDC/USD', 'ADA/USDT', 'AVAX/USDT', 'DOGE/USDT', 'TRX/USDT',
        'TON/USDT', 'LINK/USDT', 'MATIC/USDT', 'SHIB/USDT', 'LTC/USDT'
      ];

      for (const symbol of symbols) {
        const cmcSymbol = getCMCSymbol(symbol);
        if (!cmcSymbol) continue;

        try {
          const priceData = await coinMarketCapService.fetchPrice(symbol);
          if (priceData) {
            const pairData: PairData = {
              symbol,
              price: priceData.price,
              change24h: priceData.change24h,
              lastUpdate: Date.now(),
              isActive: true
            };

            this.pairData.set(symbol, pairData);
            result.successful.push(symbol);
            result.data.set(symbol, pairData);
          } else {
            result.failed.push(symbol);
          }
        } catch (error) {
          console.error(`Failed to fetch ${symbol}:`, error);
          result.failed.push(symbol);
        }
      }

      this.lastUpdateTime = Date.now();
      console.log(`Updated ${result.successful.length} pairs successfully`);

    } catch (error) {
      console.error('Multi-pair update failed:', error);
    } finally {
      this.isUpdating = false;
    }

    return result;
  }

  getPairData(symbol: string): PairData | null {
    return this.pairData.get(symbol) || null;
  }

  getAllPairData(): Map<string, PairData> {
    return new Map(this.pairData);
  }

  getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }

  private createEmptyResult(): BatchFetchResult {
    return {
      successful: [],
      failed: [],
      data: new Map()
    };
  }
}

export const cleanMultiPairManager = new CleanMultiPairManager();