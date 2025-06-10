import { 
  AssetPrice, 
  ChartData, 
  TimeFrame, 
  Alert, 
  LeverageParams, 
  LeverageResult 
} from '../types';
import { calculateSafeLeverage } from './calculations';
import { getPrice } from './priceSync';
import { centralizedPriceManager } from './centralizedPriceManager';
import { debouncedApiCall } from './requestDebouncer';

// API Base URL
const API_BASE_URL = window.location.origin;

// Rollback-safe authentic price retrieval with immediate feedback
function getAuthenticPriceImmediate(symbol: string): number {
  // Priority 1: Centralized manager synchronous price
  const authenticPrice = centralizedPriceManager.getSynchronousPrice(symbol);
  if (authenticPrice && authenticPrice > 0) {
    return authenticPrice;
  }
  
  // Priority 2: Global registry fallback
  if (window.cryptoPrices && window.cryptoPrices[symbol] > 0) {
    return window.cryptoPrices[symbol];
  }
  
  // Priority 3: Immediate async fetch trigger + synchronous return
  centralizedPriceManager.getImmediatePrice(symbol);
  return centralizedPriceManager.getSynchronousPrice(symbol);
}

// General JSON fetch utility
export async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

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

// Store last prices and change percentages
const lastPrices: Record<string, number> = {};
const lastChangePercentages: Record<string, number> = {};

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
    throw new Error('Failed to fetch authentic market data - requires valid API connection');
  }
}

// Fetch asset by symbol
export async function fetchAssetBySymbol(symbol: string): Promise<AssetPrice> {
  try {
    // Replace any forward slashes in the symbol with an encoded format for the API endpoint
    const encodedSymbol = symbol.replace('/', '%2F');
    console.log(`Fetching data for symbol: ${symbol}, encoded as: ${encodedSymbol}`);
    
    const response = await fetch(`${API_BASE_URL}/api/crypto/${encodedSymbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${symbol} data from server`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${symbol} data:`, error);
    throw new Error(`Failed to fetch authentic data for ${symbol} - requires valid API connection`);
  }
}

// Import optimized refresh intervals from our scheduler
import { CACHE_VALIDITY, REFRESH_INTERVALS, PRICE_REFRESH_INTERVAL } from './refreshScheduler';

// Updated to 4-minute intervals for optimal CoinMarketCap API usage
const OPTIMIZED_PRICE_REFRESH_INTERVAL = 240000; // 4 minutes (240 seconds)

// Use the optimized cache expiration times from refreshScheduler
const CACHE_EXPIRATION = CACHE_VALIDITY;

// Track when data was last fetched
const cacheTimestamps: Record<string, Record<TimeFrame, number>> = {};

// Track in-flight requests to prevent duplicate calls
const pendingRequests: Record<string, Record<TimeFrame, Promise<ChartData[]>>> = {};

// Track active refresh schedulers for each symbol and timeframe
const activeSchedulers: Record<string, Record<TimeFrame, number>> = {};

// Optimized chart data fetching with smart caching
export async function fetchChartData(symbol: string, timeframe: TimeFrame): Promise<ChartData[]> {
  try {
    // Initialize cache structures if they don't exist
    pendingRequests[symbol] = pendingRequests[symbol] || {};
    chartDataCache[symbol] = chartDataCache[symbol] || {};
    cacheTimestamps[symbol] = cacheTimestamps[symbol] || {};
    
    // If there's already a request in progress for this data, return that promise
    if (pendingRequests[symbol][timeframe] !== undefined) {
      return pendingRequests[symbol][timeframe];
    }
    
    // Check if cached data is still valid based on timeframe
    const now = Date.now();
    const cachedData = chartDataCache[symbol][timeframe];
    const lastFetchTime = cacheTimestamps[symbol][timeframe] || 0;
    const isCacheValid = cachedData && 
                         lastFetchTime && 
                         (now - lastFetchTime < CACHE_EXPIRATION[timeframe]);
    
    if (isCacheValid) {
      console.log(`Loading chart with ${cachedData.length} data points for ${symbol} (${timeframe})`);
      return [...cachedData];
    }
    
    // Create and store the promise
    pendingRequests[symbol][timeframe] = (async () => {
      // Fetch authentic chart data from API endpoint
      const encodedSymbol = symbol.replace('/', '%2F');
      const response = await fetch(`${API_BASE_URL}/api/chart/${encodedSymbol}/${timeframe}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data for ${symbol} ${timeframe}`);
      }
      const data = await response.json();
      
      // Update the cache
      chartDataCache[symbol][timeframe] = data;
      cacheTimestamps[symbol][timeframe] = now;
      
      // Ensure real-time updates are active
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
    })();
    
    // Wait for and return the result
    const result = await pendingRequests[symbol][timeframe];
    
    // Clear the pending request reference
    delete pendingRequests[symbol][timeframe];
    
    return result;
  } catch (error) {
    console.error(`Error fetching ${symbol} data:`, error);
    
    // Clear pending request on error
    if (pendingRequests[symbol]) {
      delete pendingRequests[symbol][timeframe];
      
      // If this was the last pending request for this symbol, clean up the object
      if (Object.keys(pendingRequests[symbol]).length === 0) {
        delete pendingRequests[symbol];
      }
    }
    
    // No fallback data - require authentic market data only
    throw error;
  }
}

// Start real-time updates with optimized performance
export function startRealTimeUpdates() {
  if (realTimeUpdatesActive) return;
  
  realTimeUpdatesActive = true;
  connectWebSocket(currentSymbols);
  
  // Register handler for price updates
  const handlePriceUpdate = (data: { symbol: string, price: number, change24h: number }) => {
    // Update the latest candle for each timeframe
    if (chartDataCache[data.symbol]) {
      Object.entries(chartDataCache[data.symbol]).forEach(([timeframe, candles]) => {
        if (candles.length > 0) {
          const lastCandle = candles[candles.length - 1];
          lastCandle.close = data.price;
          lastCandle.high = Math.max(lastCandle.high, data.price);
          lastCandle.low = Math.min(lastCandle.low, data.price);
          
          const listenerKey = `${data.symbol}_${timeframe}`;
          if (chartUpdateListeners[listenerKey]) {
            chartUpdateListeners[listenerKey].forEach(listener => listener());
          }
        }
      });
    }
    
    lastPrices[data.symbol] = data.price;
    lastChangePercentages[data.symbol] = data.change24h;
  };
  
  registerMessageHandler('priceUpdate', handlePriceUpdate);
}

// Get current price for a symbol
export function getCurrentPrice(symbol: string): number {
  return getAuthenticPriceImmediate(symbol);
}

// Add chart update listener
export function addChartUpdateListener(symbol: string, timeframe: TimeFrame, callback: () => void) {
  const key = `${symbol}_${timeframe}`;
  if (!chartUpdateListeners[key]) {
    chartUpdateListeners[key] = [];
  }
  chartUpdateListeners[key].push(callback);
  
  return () => {
    chartUpdateListeners[key] = chartUpdateListeners[key].filter(cb => cb !== callback);
  };
}

// Register chart update listener (alias for addChartUpdateListener)
export function registerChartUpdateListener(symbol: string, timeframe: TimeFrame, callback: () => void): () => void {
  return addChartUpdateListener(symbol, timeframe, callback);
}

// Fetch alerts
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