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

// API Base URL
const API_BASE_URL = window.location.origin;

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
    // Use a safe fallback that doesn't generate random data
    return { 
      symbol, 
      name: symbol.split('/')[0] || 'Unknown', 
      price: 0, 
      change24h: 0 
    };
  }
}

// Import optimized refresh intervals from our scheduler
import { CACHE_VALIDITY, REFRESH_INTERVALS, PRICE_REFRESH_INTERVAL } from './refreshScheduler';

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
      // Generate data since we don't have a chart API endpoint
      const data = generateChartData(timeframe, symbol);
      
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
      
      // Automatic refresh handled by 5-minute synchronized calculation system
      // scheduleTimeframeRefresh(symbol, timeframe); // DISABLED - redundant with sync system
      
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
    
    // Generate fallback data
    console.log(`Generating fallback data for ${symbol} (${timeframe})`);
    const fallbackData = generateChartData(timeframe, symbol);
    
    // Cache the fallback data
    if (!chartDataCache[symbol]) {
      chartDataCache[symbol] = {} as Record<TimeFrame, ChartData[]>;
    }
    chartDataCache[symbol][timeframe] = fallbackData;
    
    // Update timestamp for the fallback data
    if (!cacheTimestamps[symbol]) {
      cacheTimestamps[symbol] = {} as Record<TimeFrame, number>;
    }
    cacheTimestamps[symbol][timeframe] = Date.now();
    
    return fallbackData;
  }
}

// Track the last time we updated each symbol's price
const lastUpdateTime: Record<string, number> = {};

/**
 * Schedule automatic refresh for a specific symbol and timeframe
 * Uses the optimized intervals from refreshScheduler.ts
 */
function scheduleTimeframeRefresh(symbol: string, timeframe: TimeFrame) {
  // Initialize container for this symbol if it doesn't exist
  activeSchedulers[symbol] = activeSchedulers[symbol] || {};
  
  // Clear any existing interval for this symbol/timeframe
  if (activeSchedulers[symbol][timeframe]) {
    clearInterval(activeSchedulers[symbol][timeframe]);
  }
  
  // Get the appropriate refresh interval for this timeframe
  const refreshInterval = REFRESH_INTERVALS[timeframe];
  
  // Create a new refresh interval
  activeSchedulers[symbol][timeframe] = window.setInterval(() => {
    console.log(`Auto-refreshing data for ${symbol} (${timeframe}) after ${refreshInterval/1000}s interval`);
    
    // Create a new request to refresh data
    fetchChartData(symbol, timeframe).catch(err => {
      console.error(`Error auto-refreshing ${symbol} (${timeframe}):`, err);
    });
  }, refreshInterval);
  
  return activeSchedulers[symbol][timeframe];
}

// Throttle parameters to prevent excessive updates
const PRICE_UPDATE_THROTTLE = 5000; // Minimum 5 seconds between updates for same symbol
const MINOR_CHANGE_THRESHOLD = 0.05; // 0.05% change threshold for minor updates

// Start real-time updates with optimized performance
export function startRealTimeUpdates() {
  if (realTimeUpdatesActive) return;
  
  realTimeUpdatesActive = true;
  connectWebSocket(currentSymbols);
  
  // Optimized handler for price updates - only updates when necessary
  const handlePriceUpdate = (data: { symbol: string, price: number, change24h: number }) => {
    const now = Date.now();
    const symbol = data.symbol;
    const newPrice = data.price;
    const oldPrice = lastPrices[symbol] || 0;
    
    // Skip updates if too frequent and price change is minimal
    const timeSinceLastUpdate = now - (lastUpdateTime[symbol] || 0);
    const percentChange = oldPrice > 0 ? Math.abs((newPrice - oldPrice) / oldPrice * 100) : 0;
    
    if (timeSinceLastUpdate < PRICE_UPDATE_THROTTLE && percentChange < MINOR_CHANGE_THRESHOLD) {
      return; // Skip this update - too soon after last one with minimal change
    }
    
    // Update the latest candle for each timeframe - but only the ones currently in use
    if (chartDataCache[symbol]) {
      Object.entries(chartDataCache[symbol]).forEach(([timeframe, candles]) => {
        if (candles.length > 0) {
          const lastCandle = candles[candles.length - 1];
          
          // Only update the candle if price has actually changed
          if (lastCandle.close !== newPrice) {
            // Update the last candle
            lastCandle.close = newPrice;
            lastCandle.high = Math.max(lastCandle.high, newPrice);
            lastCandle.low = Math.min(lastCandle.low, newPrice);
            
            // Only notify listeners if we have any registered
            const listenerKey = `${symbol}_${timeframe}`;
            if (chartUpdateListeners[listenerKey] && chartUpdateListeners[listenerKey].length > 0) {
              chartUpdateListeners[listenerKey].forEach(listener => listener());
            }
          }
        }
      });
    }
    
    // Update tracking data
    lastPrices[symbol] = newPrice;
    lastChangePercentages[symbol] = data.change24h;
    lastUpdateTime[symbol] = now;
  };
  
  // Register handler for price updates
  registerMessageHandler('priceUpdate', handlePriceUpdate);
  
  // Update prices at the optimal frequency specified in the scheduler
  // This will continue to update live prices for the UI without triggering calculations
  const updateInterval = setInterval(() => {
    // Log for debugging
    console.log(`Scheduled price update check (${PRICE_REFRESH_INTERVAL/1000}-second interval) at ${new Date().toLocaleTimeString()}`);
    try {
      // Fetch real-time price data from CoinGecko
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple&vs_currencies=usd&include_24hr_change=true')
        .then(response => response.json())
        .then(realPriceData => {
          // Use the real data from CoinGecko
          console.log('CoinGecko real-time price data:', realPriceData);
          
          // Update each subscribed symbol
          currentSymbols.forEach(symbol => {
            const currentPrice = getCurrentPrice(symbol);
            let newPrice: number;
            let change24h: number = 0;
            
            // Map symbol to real data from CoinGecko
            if (symbol.includes('BTC')) {
              newPrice = realPriceData.bitcoin.usd;
              change24h = realPriceData.bitcoin.usd_24h_change;
            } else if (symbol.includes('ETH')) {
              newPrice = realPriceData.ethereum.usd;
              change24h = realPriceData.ethereum.usd_24h_change;
            } else if (symbol.includes('BNB')) {
              newPrice = realPriceData.binancecoin.usd;
              change24h = realPriceData.binancecoin.usd_24h_change;
            } else if (symbol.includes('SOL')) {
              newPrice = realPriceData.solana.usd;
              change24h = realPriceData.solana.usd_24h_change;
            } else if (symbol.includes('XRP')) {
              newPrice = realPriceData.ripple.usd;
              change24h = realPriceData.ripple.usd_24h_change;
            } else {
              // For unsupported symbols, just do a small random change
              const priceChange = (Math.random() - 0.48) * 0.003; 
              newPrice = currentPrice * (1 + priceChange);
              change24h = (Math.random() - 0.48) * 5;
            }
            
            // Only log if we have a price
            if (newPrice && currentPrice) {
              console.log(`Price update for ${symbol}: ${currentPrice.toFixed(2)} → ${newPrice.toFixed(2)}`);
              
              // Dispatch both price-update and live-price-update events
              console.log(`[API] Price update received for ${symbol} - dispatching calculation event`);
              
              // Dispatch price-update for UI updates
              window.dispatchEvent(new CustomEvent('price-update', { 
                detail: { symbol, price: newPrice, timestamp: Date.now() }
              }));
              
              // Dispatch live-price-update for calculations (throttling handled in dashboard)
              document.dispatchEvent(new CustomEvent('live-price-update', { 
                detail: { symbol, price: newPrice, timestamp: Date.now(), forceCalculate: true }
              }));
              
              // IMPORTANT: This next line was causing duplicate calculations
              // We still want to update the UI with the latest price, but
              // we don't want to trigger the direct handlePriceUpdate function
              // as this can trigger unwanted calculations
              
              // Update price in the UI but DON'T trigger automatic calculations
              // by calling handlePriceUpdate directly
              const priceData = {
                symbol,
                price: newPrice,
                change24h
              };
              
              // DISABLED: Direct price update handler call to prevent calculations
              // handlePriceUpdate(priceData);
              
              // Only broadcast to UI display handlers, not calculation handlers
              if (messageHandlers['priceUpdate']) {
                messageHandlers['priceUpdate'].forEach(handler => {
                  handler(priceData);
                });
              }
              
              // Update tracking values
              lastPrices[symbol] = newPrice;
              lastChangePercentages[symbol] = change24h;
            }
          });
        })
        .catch(err => {
          console.error('Error fetching CoinGecko data:', err);
        });
    } catch (error) {
      console.error('Error in price update:', error);
    }
  }, PRICE_REFRESH_INTERVAL);
  
  // Return the interval ID so it can be cleared if needed
  return updateInterval;
}

// Generate realistic looking chart data with trend patterns
function generateChartData(timeframe: TimeFrame, symbol: string): ChartData[] {
  // Important: Always get the current price from the central price registry
  const currentSynchronizedPrice = getPrice(symbol);
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
    case '3d':
      timeIncrement = 259200; // 3 days in seconds
      count = 150; // 150 3-day periods (~1.2 years)
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
  
  // Use the single global source of truth for price data
  const baseAsset = symbol.split('/')[0];
  
  // Get price directly from our global window registry
  let basePrice = window.cryptoPrices[symbol] || 0;

  // If no price in the registry yet, use defaults based on asset
  if (!basePrice || basePrice <= 0) {
    if (baseAsset === 'BTC') {
      basePrice = 108918; // Fixed price for consistency
    } else if (baseAsset === 'ETH') {
      basePrice = 2559;
    } else if (baseAsset === 'BNB') {
      basePrice = 656;
    } else if (baseAsset === 'SOL') {
      basePrice = 171;
    } else if (baseAsset === 'XRP') {
      basePrice = 2.39;
    } else {
      basePrice = 100;
    }
    // Store this price in our global registry for future reference
    window.cryptoPrices[symbol] = basePrice;
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

// Get volatility for different timeframes
function getVolatilityForTimeframe(timeframe: TimeFrame): number {
  // Scale volatility based on timeframe
  switch (timeframe) {
    case '1m': return 0.003;  // 0.3%
    case '5m': return 0.0045; // 0.45%
    case '15m': return 0.006; // 0.6%
    case '30m': return 0.008; // 0.8%
    case '1h': return 0.01;   // 1%
    case '4h': return 0.015;  // 1.5%
    case '1d': return 0.025;  // 2.5%
    case '3d': return 0.035;  // 3.5%
    case '1w': return 0.045;  // 4.5%
    case '1M': return 0.08;   // 8%
    default: return 0.01;
  }
}

// Scale volume based on symbol
function getBaseVolumeForSymbol(symbol: string): number {
  if (symbol.includes('BTC')) {
    return 500 + Math.random() * 200;
  } else if (symbol.includes('ETH')) {
    return 1000 + Math.random() * 500;
  } else if (symbol.includes('BNB')) {
    return 200 + Math.random() * 100;
  } else if (symbol.includes('SOL')) {
    return 800 + Math.random() * 400;
  } else if (symbol.includes('XRP')) {
    return 2000 + Math.random() * 1000;
  }
  return 100 + Math.random() * 50;
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
    return 170;
  } else if (symbol.includes('XRP')) {
    return 2;
  }
  return 100;
}

// Register for chart updates - returns an unsubscribe function
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