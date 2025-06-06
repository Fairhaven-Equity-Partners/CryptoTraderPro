/**
 * Real OHLC Data Engine
 * Fetches authentic historical market data from CoinGecko API
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
   * Map symbol to CoinGecko ID
   */
  private getCoinGeckoId(symbol: string): string | null {
    const mapping: { [key: string]: string } = {
      'BTC/USDT': 'bitcoin',
      'ETH/USDT': 'ethereum',
      'BNB/USDT': 'binancecoin',
      'XRP/USDT': 'ripple',
      'SOL/USDT': 'solana',
      'USDC/USD': 'usd-coin',
      'ADA/USDT': 'cardano',
      'AVAX/USDT': 'avalanche-2',
      'DOGE/USDT': 'dogecoin',
      'TRX/USDT': 'tron',
      'TON/USDT': 'the-open-network',
      'LINK/USDT': 'chainlink',
      'MATIC/USDT': 'matic-network',
      'LTC/USDT': 'litecoin',
      'BCH/USDT': 'bitcoin-cash',
      'UNI/USDT': 'uniswap',
      'DOT/USDT': 'polkadot',
      'XLM/USDT': 'stellar',
      'ATOM/USDT': 'cosmos',
      'XMR/USDT': 'monero',
      'ETC/USDT': 'ethereum-classic',
      'HBAR/USDT': 'hedera-hashgraph',
      'FIL/USDT': 'filecoin',
      'ICP/USDT': 'internet-computer',
      'VET/USDT': 'vechain',
      'APT/USDT': 'aptos',
      'NEAR/USDT': 'near',
      'AAVE/USDT': 'aave',
      'ARB/USDT': 'arbitrum',
      'OP/USDT': 'optimism',
      'MKR/USDT': 'maker',
      'GRT/USDT': 'the-graph',
      'STX/USDT': 'stacks',
      'INJ/USDT': 'injective-protocol',
      'ALGO/USDT': 'algorand',
      'LDO/USDT': 'lido-dao',
      'THETA/USDT': 'theta-token',
      'SUI/USDT': 'sui',
      'RUNE/USDT': 'thorchain',
      'MANA/USDT': 'decentraland',
      'SAND/USDT': 'the-sandbox',
      'FET/USDT': 'fetch-ai',
      'RNDR/USDT': 'render-token',
      'KAVA/USDT': 'kava',
      'MINA/USDT': 'mina-protocol',
      'FLOW/USDT': 'flow',
      'XTZ/USDT': 'tezos',
      'BLUR/USDT': 'blur',
      'QNT/USDT': 'quant-network'
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