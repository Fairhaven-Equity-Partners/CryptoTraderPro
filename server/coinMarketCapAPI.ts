/**
 * CoinMarketCap API Wrapper
 * Replaces CoinGecko API with CoinMarketCap for real-time cryptocurrency data
 */

interface CMCQuoteData {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      last_updated: string;
    };
  };
}

interface CMCResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: Record<string, CMCQuoteData>;
}

interface CMCHistoricalData {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
  data: {
    quotes: Array<{
      timestamp: string;
      quote: {
        USD: {
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
          market_cap: number;
        };
      };
    }>;
  };
}

class CoinMarketCapAPI {
  private apiKey: string;
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private requestCount = 0;
  private lastResetTime = Date.now();
  private rateLimitDelay = 1000; // 1 second between requests to avoid rate limits

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string): Promise<any> {
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    this.requestCount++;

    if (data.status.error_code !== 0) {
      throw new Error(`CoinMarketCap API error: ${data.status.error_message}`);
    }

    return data;
  }

  async getQuotes(symbols: string[]): Promise<CMCResponse> {
    const symbolString = symbols.join(',');
    return this.makeRequest(`/cryptocurrency/quotes/latest?symbol=${symbolString}`);
  }

  async getSingleQuote(symbol: string): Promise<CMCQuoteData> {
    const response = await this.getQuotes([symbol]);
    return response.data[symbol];
  }

  async getHistoricalData(symbol: string, count: number = 90): Promise<CMCHistoricalData> {
    // CoinMarketCap historical data endpoint
    return this.makeRequest(`/cryptocurrency/quotes/historical?symbol=${symbol}&count=${count}&interval=daily`);
  }

  async getBatchQuotes(symbols: string[], batchSize: number = 10): Promise<Record<string, CMCQuoteData>> {
    const batches = [];
    for (let i = 0; i < symbols.length; i += batchSize) {
      batches.push(symbols.slice(i, i + batchSize));
    }

    const allData: Record<string, CMCQuoteData> = {};
    
    for (const batch of batches) {
      try {
        const response = await this.getQuotes(batch);
        Object.assign(allData, response.data);
      } catch (error) {
        console.error(`Error fetching batch ${batch.join(',')}:`, error);
      }
    }

    return allData;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  resetRequestCount(): void {
    this.requestCount = 0;
    this.lastResetTime = Date.now();
  }

  // Convert CMC data to format compatible with existing codebase
  formatPriceData(cmcData: CMCQuoteData): {
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
    lastUpdated: string;
  } {
    return {
      price: cmcData.quote.USD.price,
      change24h: cmcData.quote.USD.percent_change_24h,
      volume24h: cmcData.quote.USD.volume_24h,
      marketCap: cmcData.quote.USD.market_cap,
      lastUpdated: cmcData.quote.USD.last_updated
    };
  }
}

export { CoinMarketCapAPI, type CMCQuoteData, type CMCResponse, type CMCHistoricalData };