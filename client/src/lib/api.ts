import { 
  AssetPrice, 
  ChartData, 
  TimeFrame, 
  Alert, 
  LeverageParams, 
  LeverageResult 
} from '../types';
import { calculateSafeLeverage } from './calculations';

// API Base URL
const API_BASE_URL = window.location.origin;

// WebSocket message handlers
const messageHandlers: Record<string, ((data: any) => void)[]> = {};

// Tracking subscribed symbols
let subscribedSymbols: string[] = [];

// Chart data cache
let chartDataCache: Record<string, Record<TimeFrame, ChartData[]>> = {};
let chartUpdateListeners: Record<string, (() => void)[]> = {};

// Tracking current state for real-time updates
let realTimeUpdatesActive = false;
let currentSymbols: string[] = [];

// Connect to simulated WebSocket
export function connectWebSocket(symbols: string[] = []) {
  console.log('Establishing data connection...');
  setTimeout(() => {
    console.log('Data connection established');
    if (symbols.length > 0) {
      subscribeToSymbols(symbols);
    }
    if (messageHandlers['connectionStatus']) {
      messageHandlers['connectionStatus'].forEach(handler => 
        handler({ connected: true })
      );
    }
  }, 300);
  return true;
}

// Subscribe to symbols
export function subscribeToSymbols(symbols: string[]) {
  symbols.forEach(symbol => {
    if (!subscribedSymbols.includes(symbol)) {
      subscribedSymbols.push(symbol);
    }
  });
  console.log(`Subscribed to symbols: ${subscribedSymbols.join(', ')}`);
  if (messageHandlers['subscriptionUpdate']) {
    messageHandlers['subscriptionUpdate'].forEach(handler => 
      handler({ symbols: subscribedSymbols })
    );
  }
}

// Register message handler
export function registerMessageHandler(type: string, handler: (data: any) => void) {
  if (!messageHandlers[type]) {
    messageHandlers[type] = [];
  }
  messageHandlers[type].push(handler);
  return () => {
    messageHandlers[type] = messageHandlers[type].filter(h => h !== handler);
  };
}

// Fetch all assets
export async function fetchAllAssets(): Promise<AssetPrice[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crypto`);
    if (!response.ok) {
      throw new Error('Failed to fetch assets from server');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching assets:', error);
    // Return mock data if server fails
    return [
      { symbol: 'BTC/USDT', name: 'Bitcoin', price: 60000 + Math.random() * 5000, change24h: (Math.random() * 5) - 2 },
      { symbol: 'ETH/USDT', name: 'Ethereum', price: 3000 + Math.random() * 300, change24h: (Math.random() * 8) - 3 },
      { symbol: 'BNB/USDT', name: 'Binance Coin', price: 600 + Math.random() * 50, change24h: (Math.random() * 6) - 2 },
      { symbol: 'SOL/USDT', name: 'Solana', price: 150 + Math.random() * 20, change24h: (Math.random() * 10) - 4 },
      { symbol: 'XRP/USDT', name: 'Ripple', price: 2 + Math.random() * 0.5, change24h: (Math.random() * 7) - 3 }
    ];
  }
}

// Fetch asset by symbol
export async function fetchAssetBySymbol(symbol: string): Promise<AssetPrice> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crypto/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${symbol} data from server`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${symbol} data:`, error);
    // Return mock data
    if (symbol.includes('BTC')) {
      return { symbol, name: 'Bitcoin', price: 60000 + Math.random() * 5000, change24h: (Math.random() * 5) - 2 };
    } else if (symbol.includes('ETH')) {
      return { symbol, name: 'Ethereum', price: 3000 + Math.random() * 300, change24h: (Math.random() * 8) - 3 };
    } else if (symbol.includes('BNB')) {
      return { symbol, name: 'Binance Coin', price: 600 + Math.random() * 50, change24h: (Math.random() * 6) - 2 };
    } else if (symbol.includes('SOL')) {
      return { symbol, name: 'Solana', price: 150 + Math.random() * 20, change24h: (Math.random() * 10) - 4 };
    } else if (symbol.includes('XRP')) {
      return { symbol, name: 'Ripple', price: 2 + Math.random() * 0.5, change24h: (Math.random() * 7) - 3 };
    } else {
      return { symbol, name: symbol, price: 100 + Math.random() * 10, change24h: (Math.random() * 5) - 2 };
    }
  }
}

// Fetch chart data
export async function fetchChartData(symbol: string, timeframe: TimeFrame): Promise<ChartData[]> {
  // If we have cached data, return it immediately
  if (chartDataCache[symbol] && chartDataCache[symbol][timeframe]) {
    console.log(`Loading chart with ${chartDataCache[symbol][timeframe].length} data points for ${symbol} (${timeframe})`);
    return [...chartDataCache[symbol][timeframe]];
  }
  
  try {
    // Generate data since we don't have a chart API endpoint
    const data = generateChartData(timeframe, symbol);
    
    // Cache the data
    if (!chartDataCache[symbol]) {
      chartDataCache[symbol] = {} as Record<TimeFrame, ChartData[]>;
    }
    chartDataCache[symbol][timeframe] = data;
    
    // Start real-time updates if not already running
    if (!realTimeUpdatesActive) {
      startRealTimeUpdates();
    }
    
    // Track current symbol for updates
    if (!currentSymbols.includes(symbol)) {
      currentSymbols.push(symbol);
      subscribeToSymbols(currentSymbols);
    }
    
    console.log(`Loading chart with ${data.length} data points for ${symbol} (${timeframe})`);
    return [...data];
  } catch (error) {
    console.error('Error fetching chart data:', error);
    // Generate fallback data
    const fallbackData = generateChartData(timeframe, symbol);
    
    // Still cache this fallback data
    if (!chartDataCache[symbol]) {
      chartDataCache[symbol] = {} as Record<TimeFrame, ChartData[]>;
    }
    chartDataCache[symbol][timeframe] = fallbackData;
    
    return fallbackData;
  }
}

// Start real-time updates
export function startRealTimeUpdates() {
  if (realTimeUpdatesActive) return;
  
  realTimeUpdatesActive = true;
  connectWebSocket(currentSymbols);
  
  // Create handler for price updates
  const handlePriceUpdate = (data: { symbol: string, price: number, change24h: number }) => {
    // Update the latest candle for each timeframe
    if (chartDataCache[data.symbol]) {
      Object.entries(chartDataCache[data.symbol]).forEach(([timeframe, candles]) => {
        if (candles.length > 0) {
          const lastCandle = candles[candles.length - 1];
          const newPrice = data.price;
          
          // Update the last candle
          lastCandle.close = newPrice;
          lastCandle.high = Math.max(lastCandle.high, newPrice);
          lastCandle.low = Math.min(lastCandle.low, newPrice);
          
          // Notify listeners
          if (chartUpdateListeners[`${data.symbol}_${timeframe}`]) {
            chartUpdateListeners[`${data.symbol}_${timeframe}`].forEach(listener => listener());
          }
        }
      });
    }
  };
  
  // Register handler for price updates
  registerMessageHandler('priceUpdate', handlePriceUpdate);
  
  // Update prices every 15 seconds with generated data
  const updateInterval = setInterval(() => {
    try {
      // Generate random price updates
      const mockPriceData = {
        bitcoin: { 
          usd: 60000 + Math.random() * 5000, 
          usd_24h_change: (Math.random() * 5) - 2 
        },
        ethereum: { 
          usd: 3000 + Math.random() * 300, 
          usd_24h_change: (Math.random() * 8) - 3 
        },
        binancecoin: { 
          usd: 600 + Math.random() * 50, 
          usd_24h_change: (Math.random() * 6) - 2 
        },
        solana: { 
          usd: 150 + Math.random() * 20, 
          usd_24h_change: (Math.random() * 10) - 4 
        },
        ripple: { 
          usd: 2 + Math.random() * 0.5, 
          usd_24h_change: (Math.random() * 7) - 3 
        }
      };
      
      console.log('Generated price update data:', mockPriceData);
      
      // Update each subscribed symbol
      currentSymbols.forEach(symbol => {
        const currentPrice = getCurrentPrice(symbol);
        let newPrice: number;
        let change24h: number = 0;
        
        // Map symbol to mock data
        if (symbol.includes('BTC')) {
          newPrice = mockPriceData.bitcoin.usd;
          change24h = mockPriceData.bitcoin.usd_24h_change;
        } else if (symbol.includes('ETH')) {
          newPrice = mockPriceData.ethereum.usd;
          change24h = mockPriceData.ethereum.usd_24h_change;
        } else if (symbol.includes('BNB')) {
          newPrice = mockPriceData.binancecoin.usd;
          change24h = mockPriceData.binancecoin.usd_24h_change;
        } else if (symbol.includes('SOL')) {
          newPrice = mockPriceData.solana.usd;
          change24h = mockPriceData.solana.usd_24h_change;
        } else if (symbol.includes('XRP')) {
          newPrice = mockPriceData.ripple.usd;
          change24h = mockPriceData.ripple.usd_24h_change;
        } else {
          // For unsupported symbols, just do a small random change
          const priceChange = (Math.random() - 0.48) * 0.003; 
          newPrice = currentPrice * (1 + priceChange);
          change24h = (Math.random() - 0.48) * 5;
        }
        
        // Only log if we have a price
        if (newPrice && currentPrice) {
          console.log(`Price update for ${symbol}: ${currentPrice.toFixed(2)} → ${newPrice.toFixed(2)}`);
        }
        
        // Notify all handlers about the price update
        const priceData = {
          symbol,
          price: newPrice,
          change24h
        };
        
        // Directly call the price update handler
        handlePriceUpdate(priceData);
        
        // Also broadcast to all message handlers
        if (messageHandlers['priceUpdate']) {
          messageHandlers['priceUpdate'].forEach(handler => {
            handler(priceData);
          });
        }
      });
    } catch (error) {
      console.error('Error in price update:', error);
    }
  }, 15000);
  
  // Return the interval ID so it can be cleared if needed
  return updateInterval;
}

// Generate realistic looking chart data with trend patterns
function generateChartData(timeframe: TimeFrame, symbol: string): ChartData[] {
  const now = Math.floor(Date.now() / 1000);
  const data: ChartData[] = [];
  
  // Determine time increment based on timeframe
  let timeIncrement: number;
  let count: number;
  
  // Significantly increase historical data points for better analysis
  switch (timeframe) {
    case '1m':
      timeIncrement = 60;
      count = 1000; // 1000 minutes (~16.7 hours)
      break;
    case '5m':
      timeIncrement = 300;
      count = 1000; // 5000 minutes (~3.5 days)
      break;
    case '15m':
      timeIncrement = 900;
      count = 800; // 12000 minutes (~8.3 days)
      break;
    case '30m':
      timeIncrement = 1800;
      count = 800; // 24000 minutes (~16.7 days)
      break;
    case '1h':
      timeIncrement = 3600;
      count = 720; // 720 hours (30 days)
      break;
    case '4h':
      timeIncrement = 14400;
      count = 500; // 2000 hours (~83.3 days)
      break;
    case '1d':
      timeIncrement = 86400;
      count = 365; // 365 days (1 year)
      break;
    case '1w':
      timeIncrement = 604800;
      count = 200; // 200 weeks (~3.8 years)
      break;
    case '1M':
      timeIncrement = 2592000;
      count = 60; // 60 months (5 years)
      break;
    default:
      timeIncrement = 3600;
      count = 100;
  }
  
  // Starting price based on symbol
  let basePrice = 0;
  if (symbol.includes('BTC')) {
    basePrice = 65000 + Math.random() * 2000;
  } else if (symbol.includes('ETH')) {
    basePrice = 3500 + Math.random() * 200;
  } else {
    basePrice = 100 + Math.random() * 50;
  }
  
  let price = basePrice;
  
  // Create some trend cycles to make the data look realistic
  const trendCycles = [
    { length: Math.floor(count * 0.2), bias: 0.48 },  // small downtrend
    { length: Math.floor(count * 0.3), bias: 0.53 },  // stronger uptrend
    { length: Math.floor(count * 0.2), bias: 0.5 },   // sideways
    { length: Math.floor(count * 0.3), bias: 0.45 }   // downtrend
  ];
  
  let cycleIndex = 0;
  let posInCycle = 0;
  
  for (let i = 0; i < count; i++) {
    // Check if we need to move to the next cycle
    if (posInCycle >= trendCycles[cycleIndex].length) {
      cycleIndex = (cycleIndex + 1) % trendCycles.length;
      posInCycle = 0;
    }
    
    const time = now - (count - i) * timeIncrement;
    const currentBias = trendCycles[cycleIndex].bias;
    
    // Calculate price change with the current trend bias
    const change = (Math.random() - currentBias) * (price * 0.01);
    price += change;
    
    const volatility = getVolatilityForTimeframe(timeframe);
    
    const open = price;
    const close = price + (Math.random() - 0.5) * (price * volatility);
    const high = Math.max(open, close) + Math.random() * (price * volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (price * volatility * 0.5);
    const volume = getBaseVolumeForSymbol(symbol) * (0.8 + Math.random() * 0.4);
    
    data.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
    posInCycle++;
  }
  
  return data;
}

// Helper function to get volatility based on timeframe
function getVolatilityForTimeframe(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1m': return 0.004;
    case '5m': return 0.006;
    case '15m': return 0.008;
    case '30m': return 0.01;
    case '1h': return 0.015;
    case '4h': return 0.025;
    case '1d': return 0.04;
    case '1w': return 0.06;
    case '1M': return 0.1;
    default: return 0.01;
  }
}

// Helper function to get base volume for a symbol
function getBaseVolumeForSymbol(symbol: string): number {
  if (symbol.includes('BTC')) {
    return 5000000 + Math.random() * 2000000;
  } else if (symbol.includes('ETH')) {
    return 3000000 + Math.random() * 1000000;
  } else {
    return 500000 + Math.random() * 300000;
  }
}

// Get current price for a symbol
function getCurrentPrice(symbol: string): number {
  // Try to get from the chart data cache
  if (chartDataCache[symbol] && Object.keys(chartDataCache[symbol]).length > 0) {
    const firstTimeframe = Object.keys(chartDataCache[symbol])[0] as TimeFrame;
    const candles = chartDataCache[symbol][firstTimeframe];
    if (candles.length > 0) {
      return candles[candles.length - 1].close;
    }
  }
  
  // Simple fallback values
  if (symbol.includes('BTC')) {
    return 65000;
  } else if (symbol.includes('ETH')) {
    return 3500;
  } else if (symbol.includes('BNB')) {
    return 550;
  } else if (symbol.includes('SOL')) {
    return 140;
  } else if (symbol.includes('XRP')) {
    return 0.5;
  } else {
    return 100;
  }
}

// Register for chart updates
export function registerChartUpdateListener(symbol: string, timeframe: TimeFrame, callback: () => void): () => void {
  const key = `${symbol}_${timeframe}`;
  
  if (!chartUpdateListeners[key]) {
    chartUpdateListeners[key] = [];
  }
  
  chartUpdateListeners[key].push(callback);
  
  // Return unsubscribe function
  return () => {
    chartUpdateListeners[key] = chartUpdateListeners[key].filter(cb => cb !== callback);
  };
}

// Alerts API calls
export async function fetchAlerts(userId?: number): Promise<Alert[]> {
  const url = userId 
    ? `${API_BASE_URL}/api/alerts?userId=${userId}`
    : `${API_BASE_URL}/api/alerts`;
    
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  return response.json();
}

export async function createAlert(alert: Omit<Alert, 'id' | 'isTriggered'>): Promise<Alert> {
  const response = await fetch(`${API_BASE_URL}/api/alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(alert)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create alert');
  }
  return response.json();
}

export async function updateAlert(id: number, alert: Partial<Alert>): Promise<Alert> {
  const response = await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(alert)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update alert');
  }
  return response.json();
}

export async function deleteAlert(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete alert');
  }
}

// Leverage calculator API call
export async function calculateLeverage(params: LeverageParams): Promise<LeverageResult> {
  const response = await fetch(`${API_BASE_URL}/api/calculate-leverage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error('Failed to calculate leverage');
  }
  return response.json();
}