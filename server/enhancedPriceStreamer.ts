/**
 * Enhanced Price Streamer
 * Real-time WebSocket price updates with historical data integration
 * Uses CoinGecko API for authentic market data
 */

import { WebSocketServer } from 'ws';
import { TOP_50_SYMBOL_MAPPINGS, type SymbolMapping } from './optimizedSymbolMapping.js';

interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h?: number;
  timestamp: number;
  source: 'coingecko' | 'binance';
}

interface HistoricalData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class EnhancedPriceStreamer {
  private clients = new Set<any>();
  private priceCache = new Map<string, PriceUpdate>();
  private historicalCache = new Map<string, HistoricalData[]>();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Initialize the enhanced price streamer
   */
  initialize(wss: WebSocketServer): void {
    wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[PriceStreamer] Client connected. Total: ${this.clients.size}`);
      
      // Send current price cache to new client
      this.sendPriceCacheToClient(ws);
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[PriceStreamer] Client disconnected. Remaining: ${this.clients.size}`);
      });
    });
  }

  /**
   * Start real-time price streaming
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[PriceStreamer] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[PriceStreamer] Starting enhanced real-time price streaming');

    // Initial price fetch
    await this.fetchAllPrices();

    // Start periodic updates every 30 seconds for real-time feeling
    this.updateInterval = setInterval(async () => {
      await this.fetchAllPrices();
    }, 30000);

    console.log('[PriceStreamer] Real-time price streaming started');
  }

  /**
   * Stop price streaming
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log('[PriceStreamer] Price streaming stopped');
  }

  /**
   * Fetch all cryptocurrency prices from CoinGecko
   */
  private async fetchAllPrices(): Promise<void> {
    try {
      console.log('[PriceStreamer] Fetching real-time prices for all symbols');
      
      // Get all CoinGecko IDs
      const coinGeckoIds = TOP_50_SYMBOL_MAPPINGS.map((crypto: SymbolMapping) => crypto.coinGeckoId);
      const idsParam = coinGeckoIds.join(',');
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
        {
          headers: {
            'Accept': 'application/json',
            'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        console.error('[PriceStreamer] CoinGecko API error:', response.status);
        return;
      }

      const priceData = await response.json();
      const updates: PriceUpdate[] = [];

      // Process each cryptocurrency
      for (const crypto of TOP_50_SYMBOL_MAPPINGS) {
        const coinData = priceData[crypto.coinGeckoId];
        if (coinData && coinData.usd) {
          const update: PriceUpdate = {
            symbol: crypto.symbol,
            price: coinData.usd,
            change24h: coinData.usd_24h_change || 0,
            volume24h: coinData.usd_24h_vol || 0,
            timestamp: Date.now(),
            source: 'coingecko'
          };

          this.priceCache.set(crypto.symbol, update);
          updates.push(update);
        }
      }

      // Broadcast updates to all connected clients
      if (updates.length > 0) {
        this.broadcast({
          type: 'price_updates',
          data: updates,
          timestamp: Date.now()
        });

        console.log(`[PriceStreamer] Broadcasted ${updates.length} price updates`);
      }

    } catch (error) {
      console.error('[PriceStreamer] Error fetching prices:', error);
    }
  }

  /**
   * Fetch historical data for technical analysis
   */
  async fetchHistoricalData(symbol: string, days: number = 30): Promise<HistoricalData[]> {
    try {
      const crypto = TOP_50_SYMBOL_MAPPINGS.find((c: SymbolMapping) => c.symbol === symbol);
      if (!crypto) {
        console.error(`[PriceStreamer] Symbol not found: ${symbol}`);
        return [];
      }

      // Check cache first
      const cacheKey = `${symbol}_${days}d`;
      if (this.historicalCache.has(cacheKey)) {
        const cached = this.historicalCache.get(cacheKey)!;
        const cacheAge = Date.now() - cached[cached.length - 1].timestamp;
        
        // Use cache if less than 1 hour old
        if (cacheAge < 3600000) {
          return cached;
        }
      }

      console.log(`[PriceStreamer] Fetching ${days} days of historical data for ${symbol}`);

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${crypto.coinGeckoId}/ohlc?vs_currency=usd&days=${days}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        console.error(`[PriceStreamer] Historical data API error for ${symbol}:`, response.status);
        return [];
      }

      const ohlcData = await response.json();
      const historicalData: HistoricalData[] = ohlcData.map((candle: number[]) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: 0 // CoinGecko OHLC doesn't include volume
      }));

      // Cache the data
      this.historicalCache.set(cacheKey, historicalData);

      return historicalData;

    } catch (error) {
      console.error(`[PriceStreamer] Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Get current price for a symbol
   */
  getCurrentPrice(symbol: string): PriceUpdate | null {
    return this.priceCache.get(symbol) || null;
  }

  /**
   * Get all current prices
   */
  getAllPrices(): Map<string, PriceUpdate> {
    return new Map(this.priceCache);
  }

  /**
   * Send price cache to a specific client
   */
  private sendPriceCacheToClient(ws: any): void {
    const prices = Array.from(this.priceCache.values());
    if (prices.length > 0) {
      ws.send(JSON.stringify({
        type: 'price_cache',
        data: prices,
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(client => {
      try {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(messageStr);
        }
      } catch (error) {
        console.error('[PriceStreamer] Error sending to client:', error);
        this.clients.delete(client);
      }
    });
  }

  /**
   * Broadcast trade simulation update
   */
  broadcastTradeSimulation(data: any): void {
    this.broadcast({
      type: 'trade_simulation_created',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast signal update
   */
  broadcastSignalUpdate(data: any): void {
    this.broadcast({
      type: 'signal_update',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get streaming statistics
   */
  getStats(): {
    connectedClients: number;
    cachedPrices: number;
    cachedHistoricalSets: number;
    isRunning: boolean;
  } {
    return {
      connectedClients: this.clients.size,
      cachedPrices: this.priceCache.size,
      cachedHistoricalSets: this.historicalCache.size,
      isRunning: this.isRunning
    };
  }
}

// Export singleton instance
export const enhancedPriceStreamer = new EnhancedPriceStreamer();