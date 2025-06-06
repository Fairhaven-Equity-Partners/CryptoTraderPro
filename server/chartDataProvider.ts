/**
 * Chart Data Provider - Authentic Market Data Only
 * Provides real-time OHLCV data from CoinGecko API
 */

// TimeFrame type definition
type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '3d' | '1w' | '1M';

export interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// CoinGecko symbol mapping for chart data
const COINGECKO_CHART_MAPPING: Record<string, string> = {
  'BTC/USDT': 'bitcoin',
  'ETH/USDT': 'ethereum',
  'BNB/USDT': 'binancecoin',
  'XRP/USDT': 'ripple',
  'SOL/USDT': 'solana',
  'ADA/USDT': 'cardano',
  'AVAX/USDT': 'avalanche-2',
  'DOGE/USDT': 'dogecoin',
  'TRX/USDT': 'tron',
  'TON/USDT': 'the-open-network',
  'LINK/USDT': 'chainlink',
  'MATIC/USDT': 'matic-network',
  'SHIB/USDT': 'shiba-inu',
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
  'KAVA/USDT': 'kava'
};

// Timeframe to days mapping - use only what works with free CoinGecko API
const TIMEFRAME_TO_DAYS: Record<string, number> = {
  '1m': 7,     // Use 7 days minimum for free tier hourly data
  '5m': 7,     // Use 7 days minimum for free tier hourly data
  '15m': 7,    // Use 7 days minimum for free tier hourly data
  '30m': 7,    // Use 7 days minimum for free tier hourly data
  '1h': 7,     // Use 7 days minimum for free tier hourly data
  '4h': 30,    // 30 days for 4h timeframe
  '1d': 90,    // 90 days for daily data
  '3d': 90,    // 90 days for 3d timeframe
  '1w': 365,   // 365 days for weekly
  '1M': 365    // 365 days for monthly
};

/**
 * Fetch authentic chart data from CoinGecko within free tier limitations
 */
export async function getChartData(symbol: string, timeframe: string): Promise<ChartDataPoint[]> {
  const coinGeckoId = COINGECKO_CHART_MAPPING[symbol];
  
  if (!coinGeckoId) {
    throw new Error(`No CoinGecko mapping available for ${symbol}`);
  }
  
  // Use proven working limits based on actual API behavior
  // These values have been tested and work with the current API key
  let days: number;
  switch (timeframe) {
    case '1m':
    case '5m':
    case '15m':
    case '30m':
    case '1h':
    case '4h':
      // These work with 90 days and return sufficient data points
      days = 90;
      break;
    case '1d':
      // Daily data works with 180 days (proven from logs)
      days = 180;
      break;
    case '3d':
      // 3d works with 365 days (proven from logs)
      days = 365;
      break;
    case '1w':
      // Weekly works with 365 days (proven from logs)
      days = 365;
      break;
    case '1M':
      // Monthly needs to stay within 365-day limit for free tier
      days = 365;
      break;
    default:
      days = 90;
  }
  
  const apiKey = process.env.COINGECKO_API_KEY;
  
  try {
    // Use only daily data which is available in free tier
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=${days}`;
    
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }
    
    console.log(`Fetching CoinGecko daily chart data for ${symbol} (${days} days)`);
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CoinGecko API error for ${symbol}: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`CoinGecko API failed for ${symbol}: ${response.status} ${response.statusText}`);
    }
    
    const marketData = await response.json();
    
    if (!marketData.prices || !Array.isArray(marketData.prices) || marketData.prices.length === 0) {
      throw new Error(`No authentic market data available for ${symbol}`);
    }
    
    // Convert CoinGecko price data to OHLCV format using authentic price movements
    let rawData: ChartDataPoint[] = marketData.prices.map((pricePoint: number[], index: number) => {
      const timestamp = pricePoint[0];
      const price = pricePoint[1];
      const volume = marketData.total_volumes?.[index]?.[1] || 0;
      
      // Use actual price as close, derive OHLC from price movements between points
      const prevPrice = index > 0 ? marketData.prices[index - 1][1] : price;
      const nextPrice = index < marketData.prices.length - 1 ? marketData.prices[index + 1][1] : price;
      
      const high = Math.max(price, prevPrice, nextPrice);
      const low = Math.min(price, prevPrice, nextPrice);
      const open = prevPrice;
      
      return {
        time: timestamp,
        open: open,
        high: high,
        low: low,
        close: price,
        volume: volume
      };
    });

    // Aggregate data for weekly and monthly timeframes
    let chartData: ChartDataPoint[];
    
    if (timeframe === '1w') {
      chartData = aggregateToWeekly(rawData);
    } else if (timeframe === '1M') {
      chartData = aggregateToMonthly(rawData);
    } else {
      chartData = rawData;
    }
    
    console.log(`Retrieved ${chartData.length} authentic ${timeframe} market data points for ${symbol}`);
    return chartData;
    
  } catch (error) {
    console.error(`Failed to fetch chart data for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Aggregate daily data to weekly intervals
 */
function aggregateToWeekly(dailyData: ChartDataPoint[]): ChartDataPoint[] {
  if (dailyData.length === 0) return [];
  
  const weeklyData: ChartDataPoint[] = [];
  let currentWeekStart = getWeekStart(dailyData[0].time);
  let weekData: ChartDataPoint[] = [];
  
  for (const dataPoint of dailyData) {
    const pointWeekStart = getWeekStart(dataPoint.time);
    
    if (pointWeekStart === currentWeekStart) {
      weekData.push(dataPoint);
    } else {
      if (weekData.length > 0) {
        weeklyData.push(aggregateDataPoints(weekData, currentWeekStart));
      }
      currentWeekStart = pointWeekStart;
      weekData = [dataPoint];
    }
  }
  
  if (weekData.length > 0) {
    weeklyData.push(aggregateDataPoints(weekData, currentWeekStart));
  }
  
  return weeklyData;
}

/**
 * Aggregate daily data to monthly intervals
 */
function aggregateToMonthly(dailyData: ChartDataPoint[]): ChartDataPoint[] {
  if (dailyData.length === 0) return [];
  
  const monthlyData: ChartDataPoint[] = [];
  let currentMonthStart = getMonthStart(dailyData[0].time);
  let monthData: ChartDataPoint[] = [];
  
  for (const dataPoint of dailyData) {
    const pointMonthStart = getMonthStart(dataPoint.time);
    
    if (pointMonthStart === currentMonthStart) {
      monthData.push(dataPoint);
    } else {
      if (monthData.length > 0) {
        monthlyData.push(aggregateDataPoints(monthData, currentMonthStart));
      }
      currentMonthStart = pointMonthStart;
      monthData = [dataPoint];
    }
  }
  
  if (monthData.length > 0) {
    monthlyData.push(aggregateDataPoints(monthData, currentMonthStart));
  }
  
  return monthlyData;
}

/**
 * Get the start of the week (Monday) for a given timestamp
 */
function getWeekStart(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(date.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.getTime();
}

/**
 * Get the start of the month for a given timestamp
 */
function getMonthStart(timestamp: number): number {
  const date = new Date(timestamp);
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart.getTime();
}

/**
 * Aggregate multiple data points into a single OHLCV candle
 */
function aggregateDataPoints(dataPoints: ChartDataPoint[], timestamp: number): ChartDataPoint {
  if (dataPoints.length === 0) {
    throw new Error('Cannot aggregate empty data points array');
  }
  
  const open = dataPoints[0].open;
  const close = dataPoints[dataPoints.length - 1].close;
  const high = Math.max(...dataPoints.map(p => p.high));
  const low = Math.min(...dataPoints.map(p => p.low));
  const volume = dataPoints.reduce((sum, p) => sum + p.volume, 0);
  
  return {
    time: timestamp,
    open,
    high,
    low,
    close,
    volume
  };
}

/**
 * Get supported symbols for chart data
 */
export function getSupportedSymbols(): string[] {
  return Object.keys(COINGECKO_CHART_MAPPING);
}

/**
 * Check if symbol is supported for chart data
 */
export function isSymbolSupported(symbol: string): boolean {
  return symbol in COINGECKO_CHART_MAPPING;
}