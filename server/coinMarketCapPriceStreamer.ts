/**
 * CoinMarketCap Price Streamer
 * Replaces CoinGecko with CoinMarketCap for real-time price data
 */

import { WebSocketServer } from 'ws';
import { TOP_50_SYMBOL_MAPPINGS, getCMCSymbol, type SymbolMapping } from './optimizedSymbolMapping.js';
import { CoinMarketCapAPI } from './coinMarketCapAPI.js';

interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h?: number;
  timestamp: number;
  source: 'coinmarketcap';
}

interface HistoricalData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class CoinMarketCapPriceStreamer {
  private clients = new Set<any>();
  private priceCache = new Map<string, PriceUpdate>();
  private historicalCache = new Map<string, HistoricalData[]>();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private cmcAPI: CoinMarketCapAPI;

  constructor() {
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    if (!apiKey) {
      throw new Error('COINMARKETCAP_API_KEY environment variable is required');
    }
    this.cmcAPI = new CoinMarketCapAPI(apiKey);
  }

  /**
   * Initialize the price streamer
   */
  initialize(wss: WebSocketServer): void {
    wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[CMC PriceStreamer] Client connected. Total: ${this.clients.size}`);
      
      // Send current price cache to new client
      this.sendPriceCacheToClient(ws);
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[CMC PriceStreamer] Client disconnected. Remaining: ${this.clients.size}`);
      });
    });
  }

  /**
   * Start real-time price streaming
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[CMC PriceStreamer] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[CMC PriceStreamer] Starting CoinMarketCap price streaming');

    // Initial price fetch
    await this.fetchAllPrices();

    // Start periodic updates every 2 minutes to respect API limits
    this.updateInterval = setInterval(async () => {
      await this.fetchAllPrices();
    }, 120000); // 2 minutes

    console.log('[CMC PriceStreamer] CoinMarketCap price streaming started');
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
    console.log('[CMC PriceStreamer] Price streaming stopped');
  }

  /**
   * Fetch all cryptocurrency prices from CoinMarketCap
   */
  private async fetchAllPrices(): Promise<void> {
    try {
      console.log('[CMC PriceStreamer] Fetching real-time prices for all symbols');
      
      // Get all CMC symbols
      const cmcSymbols = TOP_50_SYMBOL_MAPPINGS.map((crypto: SymbolMapping) => crypto.cmcSymbol);
      
      // Fetch prices in batches to respect rate limits
      const batchData = await this.cmcAPI.getBatchQuotes(cmcSymbols, 10);
      
      let updateCount = 0;
      
      for (const mapping of TOP_50_SYMBOL_MAPPINGS) {
        const cmcData = batchData[mapping.cmcSymbol];
        if (cmcData) {
          const priceUpdate: PriceUpdate = {
            symbol: mapping.symbol,
            price: cmcData.quote.USD.price,
            change24h: cmcData.quote.USD.percent_change_24h,
            volume24h: cmcData.quote.USD.volume_24h,
            timestamp: Date.now(),
            source: 'coinmarketcap'
          };
          
          this.priceCache.set(mapping.symbol, priceUpdate);
          updateCount++;
        }
      }
      
      console.log(`[CMC PriceStreamer] Updated ${updateCount} prices successfully`);
      
      // Broadcast updates to all connected clients
      this.broadcastPriceUpdates();
      
    } catch (error) {
      console.error('[CMC PriceStreamer] Error fetching prices:', error);
    }
  }

  /**
   * Get current price for a specific symbol
   */
  async getCurrentPrice(symbol: string): Promise<number | null> {
    const cached = this.priceCache.get(symbol);
    if (cached) {
      return cached.price;
    }

    // Fetch fresh price if not cached
    const cmcSymbol = getCMCSymbol(symbol);
    if (!cmcSymbol) {
      console.warn(`[CMC PriceStreamer] No CMC symbol mapping found for ${symbol}`);
      return null;
    }

    try {
      const cmcData = await this.cmcAPI.getSingleQuote(cmcSymbol);
      const price = cmcData.quote.USD.price;
      
      // Cache the result
      const priceUpdate: PriceUpdate = {
        symbol,
        price,
        change24h: cmcData.quote.USD.percent_change_24h,
        volume24h: cmcData.quote.USD.volume_24h,
        timestamp: Date.now(),
        source: 'coinmarketcap'
      };
      
      this.priceCache.set(symbol, priceUpdate);
      return price;
      
    } catch (error) {
      console.error(`[CMC PriceStreamer] Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical data for technical analysis
   */
  async getHistoricalData(symbol: string, days: number = 90): Promise<HistoricalData[]> {
    const cacheKey = `${symbol}_${days}`;
    const cached = this.historicalCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const cmcSymbol = getCMCSymbol(symbol);
    if (!cmcSymbol) {
      console.warn(`[CMC PriceStreamer] No CMC symbol mapping found for ${symbol}`);
      return this.getEmptyHistoricalData(symbol, days);
    }

    try {
      const historicalData = await this.cmcAPI.getHistoricalData(cmcSymbol, days);
      
      const formattedData: HistoricalData[] = historicalData.data.quotes.map(quote => ({
        timestamp: new Date(quote.timestamp).getTime(),
        open: quote.quote.USD.open,
        high: quote.quote.USD.high,
        low: quote.quote.USD.low,
        close: quote.quote.USD.close,
        volume: quote.quote.USD.volume
      }));

      this.historicalCache.set(cacheKey, formattedData);
      return formattedData;
      
    } catch (error) {
      console.error(`[CMC PriceStreamer] Error fetching historical data for ${symbol}:`, error);
      return this.getEmptyHistoricalData(symbol, days);
    }
  }

  /**
   * REMOVED: No authentic data generation - Real data only
   * Returns empty array instead of authentic data
   */
  private getEmptyHistoricalData(symbol: string, days: number): HistoricalData[] {
    console.log(`[CMC PriceStreamer] Real-data-only mode: No authentic data for ${symbol}`);
    return [];
  }

  /**
   * Send current price cache to a specific client
   */
  private sendPriceCacheToClient(ws: any): void {
    try {
      const prices = Array.from(this.priceCache.values());
      ws.send(JSON.stringify({
        type: 'price_update',
        data: prices
      }));
    } catch (error) {
      console.error('[CMC PriceStreamer] Error sending cache to client:', error);
    }
  }

  /**
   * Broadcast price updates to all connected clients
   */
  private broadcastPriceUpdates(): void {
    if (this.clients.size === 0) return;

    const prices = Array.from(this.priceCache.values());
    const message = JSON.stringify({
      type: 'price_update',
      data: prices
    });

    this.clients.forEach(client => {
      try {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      } catch (error) {
        console.error('[CMC PriceStreamer] Error broadcasting to client:', error);
        this.clients.delete(client);
      }
    });

    console.log(`[CMC PriceStreamer] Broadcasted ${prices.length} price updates to ${this.clients.size} clients`);
  }

  /**
   * Get cached price for symbol
   */
  getCachedPrice(symbol: string): PriceUpdate | null {
    return this.priceCache.get(symbol) || null;
  }

  /**
   * Get API usage statistics
   */
  getAPIStats(): { requestCount: number } {
    return {
      requestCount: this.cmcAPI.getRequestCount()
    };
  }
}

export { CoinMarketCapPriceStreamer, type PriceUpdate, type HistoricalData };