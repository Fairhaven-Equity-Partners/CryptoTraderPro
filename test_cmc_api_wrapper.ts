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

class CoinMarketCapAPI {
  private apiKey: string;
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string): Promise<any> {
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

  getRequestCount(): number {
    return this.requestCount;
  }

  resetRequestCount(): void {
    this.requestCount = 0;
    this.lastResetTime = Date.now();
  }
}

export { CoinMarketCapAPI, type CMCQuoteData, type CMCResponse };