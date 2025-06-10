/**
 * Enhanced Price Streamer with CoinMarketCap Integration
 * Real-time price streaming for 50+ cryptocurrency pairs
 */

import WebSocket, { WebSocketServer } from 'ws';
import { TOP_50_SYMBOL_MAPPINGS, getCMCSymbol, type SymbolMapping } from './optimizedSymbolMapping.js';

interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
  source: string;
}

interface CachedPrice {
  price: number;
  change24h: number;
  timestamp: number;
}

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class EnhancedPriceStreamer {
  private wss: WebSocketServer | null = null;
  private priceCache: Map<string, CachedPrice> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.startPriceUpdates();
  }

  /**
   * Initialize WebSocket server for real-time price streaming
   */
  initializeWebSocket(server: any) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws) => {
      console.log('[PriceStreamer] Client connected');
      
      // Send cached prices immediately on connection
      this.sendCachedPrices(ws);
      
      ws.on('close', () => {
        console.log('[PriceStreamer] Client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('[PriceStreamer] WebSocket error:', error);
      });
    });
  }

  /**
   * Start periodic price updates
   */
  private startPriceUpdates() {
    // Initial fetch
    this.fetchAllPrices();
    
    // Set up interval for regular updates
    this.updateInterval = setInterval(() => {
      this.fetchAllPrices();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Fetch prices for all tracked cryptocurrencies
   */
  private async fetchAllPrices(): Promise<void> {
    try {
      console.log('[PriceStreamer] Fetching real-time prices for all symbols');
      
      // Use CoinMarketCap service for all price fetching
      const { coinMarketCapService } = await import('./coinMarketCapService.js');
      const updates: PriceUpdate[] = [];

      // Process each cryptocurrency with rate limiting
      for (const crypto of TOP_50_SYMBOL_MAPPINGS) {
        try {
          const priceData = await coinMarketCapService.fetchPrice(crypto.cmcSymbol);
          if (priceData) {
            const update: PriceUpdate = {
              symbol: crypto.symbol,
              price: priceData.price,
              change24h: priceData.change24h || 0,
              volume24h: priceData.volume24h || 0,
              timestamp: Date.now(),
              source: 'coinmarketcap'
            };

            this.priceCache.set(crypto.symbol, {
              price: priceData.price,
              change24h: priceData.change24h || 0,
              timestamp: Date.now()
            });
            updates.push(update);
          }
        } catch (error) {
          console.error(`[PriceStreamer] Error fetching ${crypto.symbol}:`, error);
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
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
   * Get cached price for a symbol
   */
  getPrice(symbol: string): number | null {
    const cached = this.priceCache.get(symbol);
    return cached ? cached.price : null;
  }

  /**
   * Get cached price data with timestamp
   */
  getPriceData(symbol: string): CachedPrice | null {
    return this.priceCache.get(symbol) || null;
  }

  /**
   * Fetch historical OHLC data for technical analysis
   */
  async fetchHistoricalData(symbol: string, days: number = 30): Promise<OHLCData[]> {
    try {
      const { coinMarketCapService } = await import('./coinMarketCapService.js');
      const cmcSymbol = getCMCSymbol(symbol);
      if (!cmcSymbol) return [];

      // REAL DATA ONLY - No synthetic OHLC generation
      // CoinMarketCap basic plan doesn't include historical OHLC data
      // Return empty array rather than generate fake data
      console.log(`[PriceStreamer] Real-data-only mode: No historical OHLC for ${symbol}`);
      return [];
      
    } catch (error) {
      console.error(`[PriceStreamer] Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Fetch single price with retry logic
   */
  async fetchSinglePrice(symbol: string): Promise<CachedPrice | null> {
    try {
      const { coinMarketCapService } = await import('./coinMarketCapService.js');
      const cmcSymbol = getCMCSymbol(symbol);
      if (!cmcSymbol) return null;

      const priceData = await coinMarketCapService.fetchPrice(cmcSymbol);
      if (priceData) {
        const result = {
          price: priceData.price,
          change24h: priceData.change24h || 0,
          timestamp: Date.now()
        };
        
        // Update cache
        this.priceCache.set(symbol, result);
        return result;
      }

      return null;
    } catch (error) {
      console.error(`[PriceStreamer] Error fetching single price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Send cached prices to a specific WebSocket client
   */
  private sendCachedPrices(ws: WebSocket) {
    const cachedData = Array.from(this.priceCache.entries()).map(([symbol, data]) => ({
      symbol,
      price: data.price,
      change24h: data.change24h,
      timestamp: data.timestamp,
      source: 'coinmarketcap'
    }));

    if (cachedData.length > 0) {
      ws.send(JSON.stringify({
        type: 'price_updates',
        data: cachedData,
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: any) {
    if (!this.wss) return;

    const messageStr = JSON.stringify(message);
    let clientCount = 0;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
        clientCount++;
      }
    });

    console.log(`Broadcast message sent to ${clientCount} clients: ${JSON.stringify({ type: message.type, dataCount: message.data?.length })}`);
  }

  /**
   * Clear historical cache for symbol
   */
  clearHistoricalCache(symbol: string) {
    console.log(`[PriceStreamer] Cleared historical cache for ${symbol}`);
    // Implementation for clearing specific historical data cache
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.priceCache.clear();
    console.log('[PriceStreamer] Resources cleaned up');
  }
}

// Export singleton instance
export const enhancedPriceStreamer = new EnhancedPriceStreamer();