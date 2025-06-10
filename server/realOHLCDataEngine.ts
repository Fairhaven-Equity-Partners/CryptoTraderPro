/**
 * Real OHLC Data Engine
 * Fetches authentic historical market data from CoinMarketCap API
 * Replaces synthetic price generation with real market conditions
 */

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeframeConfig {
  timeframe: string;
  days: number;
  interval: string;
}

export class RealOHLCDataEngine {
  private ohlcCache: Map<string, { data: OHLCData[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  private readonly timeframeConfigs: TimeframeConfig[] = [
    { timeframe: '1m', days: 1, interval: 'minutely' },
    { timeframe: '5m', days: 1, interval: 'minutely' },
    { timeframe: '15m', days: 2, interval: 'minutely' },
    { timeframe: '30m', days: 3, interval: 'minutely' },
    { timeframe: '1h', days: 7, interval: 'hourly' },
    { timeframe: '4h', days: 30, interval: 'hourly' },
    { timeframe: '1d', days: 90, interval: 'daily' },
    { timeframe: '3d', days: 180, interval: 'daily' },
    { timeframe: '1w', days: 365, interval: 'daily' },
    { timeframe: '1M', days: 730, interval: 'daily' }
  ];

  /**
   * Get authentic OHLC data for symbol and timeframe
   */
  async getOHLCData(symbol: string, timeframe: string): Promise<OHLCData[]> {
    const cacheKey = `${symbol}_${timeframe}`;
    const cached = this.ohlcCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const freshData = await this.fetchOHLCFromAPI(symbol, timeframe);
      if (freshData.length > 0) {
        this.ohlcCache.set(cacheKey, {
          data: freshData,
          timestamp: Date.now()
        });
        return freshData;
      }
    } catch (error) {
      console.error(`[RealOHLC] Error fetching ${symbol} ${timeframe}:`, error);
    }

    // Return cached data if available, even if expired
    return cached?.data || [];
  }

  /**
   * Fetch OHLC data from CoinGecko market chart API
   */
  private async fetchOHLCFromAPI(symbol: string, timeframe: string): Promise<OHLCData[]> {
    const coinId = this.getCoinGeckoId(symbol);
    if (!coinId) return [];

    const config = this.timeframeConfigs.find(c => c.timeframe === timeframe);
    if (!config) return [];

    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${config.days}&interval=${config.interval}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || ''
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return this.convertToOHLC(data, timeframe);
  }

  /**
   * Convert CoinGecko market chart data to OHLC format
   */
  private convertToOHLC(marketData: any, timeframe: string): OHLCData[] {
    const { prices, total_volumes } = marketData;
    
    if (!prices || !total_volumes) return [];

    const timeframeMs = this.getTimeframeMs(timeframe);
    const ohlcData: OHLCData[] = [];
    
    // Group prices by timeframe intervals
    const pricesByInterval = new Map<number, number[]>();
    const volumesByInterval = new Map<number, number[]>();

    prices.forEach(([timestamp, price]: [number, number]) => {
      const intervalStart = Math.floor(timestamp / timeframeMs) * timeframeMs;
      
      if (!pricesByInterval.has(intervalStart)) {
        pricesByInterval.set(intervalStart, []);
        volumesByInterval.set(intervalStart, []);
      }
      
      pricesByInterval.get(intervalStart)!.push(price);
    });

    total_volumes.forEach(([timestamp, volume]: [number, number]) => {
      const intervalStart = Math.floor(timestamp / timeframeMs) * timeframeMs;
      
      if (volumesByInterval.has(intervalStart)) {
        volumesByInterval.get(intervalStart)!.push(volume);
      }
    });

    // Create OHLC candles
    for (const [intervalStart, intervalPrices] of pricesByInterval.entries()) {
      if (intervalPrices.length === 0) continue;

      const volumes = volumesByInterval.get(intervalStart) || [0];
      const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

      ohlcData.push({
        timestamp: intervalStart,
        open: intervalPrices[0],
        high: Math.max(...intervalPrices),
        low: Math.min(...intervalPrices),
        close: intervalPrices[intervalPrices.length - 1],
        volume: avgVolume
      });
    }

    return ohlcData.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get timeframe in milliseconds
   */
  private getTimeframeMs(timeframe: string): number {
    const timeframeMap: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    };

    return timeframeMap[timeframe] || timeframeMap['1h'];
  }

  /**
   * Map symbol to CoinMarketCap symbol
   */
  private getCMCSymbol(symbol: string): string | null {
    const mapping: { [key: string]: string } = {
      'BTC/USDT': 'BTC',
      'ETH/USDT': 'ETH',
      'BNB/USDT': 'BNB',
      'XRP/USDT': 'XRP',
      'SOL/USDT': 'SOL',
      'USDC/USD': 'USDC',
      'ADA/USDT': 'ADA',
      'AVAX/USDT': 'AVAX',
      'DOGE/USDT': 'DOGE',
      'TRX/USDT': 'TRX',
      'TON/USDT': 'TON',
      'LINK/USDT': 'LINK',
      'MATIC/USDT': 'MATIC',
      'LTC/USDT': 'LTC',
      'BCH/USDT': 'BCH',
      'UNI/USDT': 'UNI',
      'DOT/USDT': 'DOT',
      'XLM/USDT': 'XLM',
      'ATOM/USDT': 'ATOM',
      'XMR/USDT': 'XMR',
      'ETC/USDT': 'ETC',
      'HBAR/USDT': 'HBAR',
      'FIL/USDT': 'FIL',
      'ICP/USDT': 'ICP',
      'VET/USDT': 'VET',
      'APT/USDT': 'APT',
      'NEAR/USDT': 'NEAR',
      'AAVE/USDT': 'AAVE',
      'ARB/USDT': 'ARB',
      'OP/USDT': 'OP',
      'MKR/USDT': 'MKR',
      'GRT/USDT': 'GRT',
      'STX/USDT': 'STX',
      'INJ/USDT': 'INJ',
      'ALGO/USDT': 'ALGO',
      'LDO/USDT': 'LDO',
      'THETA/USDT': 'THETA',
      'SUI/USDT': 'SUI',
      'RUNE/USDT': 'RUNE',
      'MANA/USDT': 'MANA',
      'SAND/USDT': 'SAND',
      'FET/USDT': 'FET',
      'RNDR/USDT': 'RNDR',
      'KAVA/USDT': 'KAVA',
      'MINA/USDT': 'MINA',
      'FLOW/USDT': 'FLOW',
      'XTZ/USDT': 'XTZ',
      'BLUR/USDT': 'BLUR',
      'QNT/USDT': 'QNT'
    };

    return mapping[symbol] || null;
  }

  /**
   * Get latest prices from OHLC data
   */
  getLatestPrices(ohlcData: OHLCData[]): number[] {
    return ohlcData.map(candle => candle.close);
  }

  /**
   * Get volumes from OHLC data
   */
  getVolumes(ohlcData: OHLCData[]): number[] {
    return ohlcData.map(candle => candle.volume);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.ohlcCache.entries()) {
      if ((now - cached.timestamp) > this.CACHE_DURATION) {
        this.ohlcCache.delete(key);
      }
    }
  }
}

export const realOHLCDataEngine = new RealOHLCDataEngine();