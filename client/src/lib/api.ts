import { 
  AssetPrice, 
  ChartData, 
  TimeFrame, 
  Alert, 
  LeverageParams, 
  LeverageResult 
} from '../types';

// API Base URL
const API_BASE_URL = window.location.origin;

// Simulated WebSocket implementation
// This avoids browser console errors while still providing the functionality we need

// WebSocket message handlers
const messageHandlers: Record<string, ((data: any) => void)[]> = {};

// Tracking subscribed symbols
let subscribedSymbols: string[] = [];

// Simulated WebSocket state
let simulatedConnected = false;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

// Connect to simulated WebSocket
export function connectWebSocket(symbols: string[] = []) {
  // Clear any pending reconnect
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  // Log connection
  console.log('Establishing data connection...');
  
  // Simulate successful connection after a short delay
  setTimeout(() => {
    simulatedConnected = true;
    console.log('Data connection established');
    
    // Subscribe to symbols
    if (symbols.length > 0) {
      subscribeToSymbols(symbols);
    }
    
    // Notify any handlers that might be interested in connection status
    if (messageHandlers['connectionStatus']) {
      messageHandlers['connectionStatus'].forEach(handler => 
        handler({ connected: true })
      );
    }
  }, 300);
  
  return true;
}

// Subscribe to symbols on the simulated WebSocket
export function subscribeToSymbols(symbols: string[]) {
  if (!simulatedConnected) {
    // If not connected, connect first
    connectWebSocket(symbols);
    return;
  }
  
  // Add symbols to subscription list if not already there
  symbols.forEach(symbol => {
    if (!subscribedSymbols.includes(symbol)) {
      subscribedSymbols.push(symbol);
    }
  });
  
  console.log(`Subscribed to symbols: ${subscribedSymbols.join(', ')}`);
  
  // Notify subscribers that we've subscribed
  if (messageHandlers['subscriptionUpdate']) {
    messageHandlers['subscriptionUpdate'].forEach(handler => 
      handler({ symbols: subscribedSymbols })
    );
  }
}

export function registerMessageHandler(type: string, handler: (data: any) => void) {
  if (!messageHandlers[type]) {
    messageHandlers[type] = [];
  }
  messageHandlers[type].push(handler);
  
  // Return unsubscribe function
  return () => {
    messageHandlers[type] = messageHandlers[type].filter(h => h !== handler);
  };
}

// Asset API calls
export async function fetchAllAssets(): Promise<AssetPrice[]> {
  try {
    // First try to get from our server
    const response = await fetch(`${API_BASE_URL}/api/crypto`);
    if (!response.ok) {
      throw new Error('Failed to fetch assets from server');
    }
    
    const serverData = await response.json();
    
    // Now try to get real data from CoinGecko
    try {
      const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple&vs_currencies=usd&include_24hr_change=true');
      if (coinGeckoResponse.ok) {
        const realData = await coinGeckoResponse.json();
        
        console.log('Got real price data from CoinGecko:', realData);
        
        // Update our server data with real prices
        return serverData.map((asset: AssetPrice) => {
          if (asset.symbol.includes('BTC') && realData.bitcoin) {
            return { 
              ...asset, 
              price: realData.bitcoin.usd,
              change24h: realData.bitcoin.usd_24h_change || asset.change24h
            };
          } else if (asset.symbol.includes('ETH') && realData.ethereum) {
            return { 
              ...asset, 
              price: realData.ethereum.usd,
              change24h: realData.ethereum.usd_24h_change || asset.change24h
            };
          } else if (asset.symbol.includes('BNB') && realData.binancecoin) {
            return { 
              ...asset, 
              price: realData.binancecoin.usd,
              change24h: realData.binancecoin.usd_24h_change || asset.change24h
            };
          } else if (asset.symbol.includes('SOL') && realData.solana) {
            return { 
              ...asset, 
              price: realData.solana.usd,
              change24h: realData.solana.usd_24h_change || asset.change24h
            };
          } else if (asset.symbol.includes('XRP') && realData.ripple) {
            return { 
              ...asset, 
              price: realData.ripple.usd,
              change24h: realData.ripple.usd_24h_change || asset.change24h
            };
          }
          return asset;
        });
      }
    } catch (coinGeckoError) {
      console.error('Error fetching real price data:', coinGeckoError);
    }
    
    // Return server data if CoinGecko enhancement fails
    return serverData;
  } catch (serverError) {
    console.error('Error fetching assets from server:', serverError);
    
    // If server fails, try to get data directly from CoinGecko
    try {
      const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple&vs_currencies=usd&include_24hr_change=true');
      if (coinGeckoResponse.ok) {
        const realData = await coinGeckoResponse.json();
        
        // Format CoinGecko data to match our expected format
        return [
          { 
            symbol: 'BTC/USDT', 
            price: realData.bitcoin?.usd || 0, 
            change24h: realData.bitcoin?.usd_24h_change || 0 
          },
          { 
            symbol: 'ETH/USDT', 
            price: realData.ethereum?.usd || 0, 
            change24h: realData.ethereum?.usd_24h_change || 0 
          },
          { 
            symbol: 'BNB/USDT', 
            price: realData.binancecoin?.usd || 0, 
            change24h: realData.binancecoin?.usd_24h_change || 0 
          },
          { 
            symbol: 'SOL/USDT', 
            price: realData.solana?.usd || 0, 
            change24h: realData.solana?.usd_24h_change || 0 
          },
          { 
            symbol: 'XRP/USDT', 
            price: realData.ripple?.usd || 0, 
            change24h: realData.ripple?.usd_24h_change || 0 
          }
        ];
      }
    } catch (coinGeckoError) {
      console.error('Error fetching from CoinGecko:', coinGeckoError);
    }
    
    // Return basic empty data if all else fails
    return [
      { symbol: 'BTC/USDT', price: 0, change24h: 0 },
      { symbol: 'ETH/USDT', price: 0, change24h: 0 },
      { symbol: 'BNB/USDT', price: 0, change24h: 0 },
      { symbol: 'SOL/USDT', price: 0, change24h: 0 },
      { symbol: 'XRP/USDT', price: 0, change24h: 0 }
    ];
  }
}

export async function fetchAssetBySymbol(symbol: string): Promise<AssetPrice> {
  try {
    // First try to get from our server
    const response = await fetch(`${API_BASE_URL}/api/crypto/${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${symbol} data from server`);
    }
    
    const serverData = await response.json();
    
    // Try to enhance with real price data
    try {
      let coinId;
      if (symbol.includes('BTC')) coinId = 'bitcoin';
      else if (symbol.includes('ETH')) coinId = 'ethereum';
      else if (symbol.includes('BNB')) coinId = 'binancecoin';
      else if (symbol.includes('SOL')) coinId = 'solana';
      else if (symbol.includes('XRP')) coinId = 'ripple';
      else return serverData;
      
      const coinGeckoResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
      if (coinGeckoResponse.ok) {
        const realData = await coinGeckoResponse.json();
        
        console.log(`Got real price data for ${symbol}:`, realData);
        
        if (realData[coinId]) {
          return {
            ...serverData,
            price: realData[coinId].usd,
            change24h: realData[coinId].usd_24h_change || serverData.change24h
          };
        }
      }
    } catch (coinGeckoError) {
      console.error(`Error fetching real ${symbol} data:`, coinGeckoError);
    }
    
    // Return server data if CoinGecko enhancement fails
    return serverData;
  } catch (serverError) {
    console.error(`Error fetching ${symbol} data from server:`, serverError);
    
    // Try to get real data directly from CoinGecko if server fails
    try {
      let coinId;
      if (symbol.includes('BTC')) coinId = 'bitcoin';
      else if (symbol.includes('ETH')) coinId = 'ethereum';
      else if (symbol.includes('BNB')) coinId = 'binancecoin';
      else if (symbol.includes('SOL')) coinId = 'solana';
      else if (symbol.includes('XRP')) coinId = 'ripple';
      else return { symbol, price: 0, change24h: 0 };
      
      const coinGeckoResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
      if (coinGeckoResponse.ok) {
        const realData = await coinGeckoResponse.json();
        
        if (realData[coinId]) {
          return {
            symbol,
            price: realData[coinId].usd,
            change24h: realData[coinId].usd_24h_change || 0
          };
        }
      }
    } catch (coinGeckoError) {
      console.error(`Error fetching from CoinGecko for ${symbol}:`, coinGeckoError);
    }
    
    // Return empty data if all else fails
    return { symbol, price: 0, change24h: 0 };
  }
}

// Crypto price chart data with live updates
let chartDataCache: Record<string, Record<TimeFrame, ChartData[]>> = {};
let chartUpdateListeners: Record<string, (() => void)[]> = {};

// Flag to track real-time updates
let realTimeUpdatesActive = false;
let currentSymbols: string[] = [];
let currentTimeframe: TimeFrame = '1h';

// Start the real-time updates immediately
// This ensures we only need to start it once for the entire app
setTimeout(() => {
  if (!realTimeUpdatesActive) {
    startRealTimeUpdates();
  }
}, 1000);

export async function fetchChartData(symbol: string, timeframe: TimeFrame): Promise<ChartData[]> {
  const cacheKey = `${symbol}_${timeframe}`;
  
  // If we have cached data, return it immediately
  if (chartDataCache[symbol] && chartDataCache[symbol][timeframe]) {
    return [...chartDataCache[symbol][timeframe]];
  }
  
  try {
    // For a real implementation, this would make an API call to a data provider
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
    
    // Update current symbols and timeframe for real-time updates
    if (!currentSymbols.includes(symbol)) {
      currentSymbols.push(symbol);
      // In a real implementation, we would subscribe to the symbol via WebSocket
      subscribeToSymbols(currentSymbols);
    }
    currentTimeframe = timeframe;
    
    return [...data];
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return generateChartData(timeframe, symbol);
  }
}

// Start real-time updates
export function startRealTimeUpdates() {
  if (realTimeUpdatesActive) return;
  
  realTimeUpdatesActive = true;
  connectWebSocket(currentSymbols);
  
  // Create handler for price updates
  const handlePriceUpdate = (data: AssetPrice) => {
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
  
  // Update prices every 15 seconds with real data from CoinGecko
  const updateInterval = setInterval(async () => {
    try {
      // Fetch all coin prices at once for efficiency
      const coinIds = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'];
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Real-time price update from CoinGecko:', data);
        
        // Update each subscribed symbol
        currentSymbols.forEach(symbol => {
          const currentPrice = getCurrentPrice(symbol);
          let newPrice: number;
          let change24h: number = 0;
          
          // Map symbol to CoinGecko data
          if (symbol.includes('BTC') && data.bitcoin) {
            newPrice = data.bitcoin.usd;
            change24h = data.bitcoin.usd_24h_change;
          } else if (symbol.includes('ETH') && data.ethereum) {
            newPrice = data.ethereum.usd;
            change24h = data.ethereum.usd_24h_change;
          } else if (symbol.includes('BNB') && data.binancecoin) {
            newPrice = data.binancecoin.usd;
            change24h = data.binancecoin.usd_24h_change;
          } else if (symbol.includes('SOL') && data.solana) {
            newPrice = data.solana.usd;
            change24h = data.solana.usd_24h_change;
          } else if (symbol.includes('XRP') && data.ripple) {
            newPrice = data.ripple.usd;
            change24h = data.ripple.usd_24h_change;
          } else {
            // For unsupported symbols, just do a small random change
            const priceChange = (Math.random() - 0.48) * 0.003; 
            newPrice = currentPrice * (1 + priceChange);
            change24h = (Math.random() - 0.48) * 5;
          }
          
          // Only log if we have a real price
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
      } else {
        throw new Error('Failed to fetch real-time prices from CoinGecko');
      }
    } catch (error) {
      console.error('Error in real-time price update:', error);
      
      // Fallback to simulated data if API request fails
      currentSymbols.forEach(symbol => {
        const currentPrice = getCurrentPrice(symbol);
        const priceChange = (Math.random() - 0.48) * 0.003; // 0.3% max change
        const simulatedPrice = currentPrice * (1 + priceChange);
        
        console.log(`Fallback price update for ${symbol}: ${currentPrice.toFixed(2)} → ${simulatedPrice.toFixed(2)}`);
        
        // Notify all handlers about the price update
        const priceData = {
          symbol,
          price: simulatedPrice,
          change24h: (Math.random() - 0.48) * 5
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
  
  switch (timeframe) {
    case '1m':
      timeIncrement = 60;
      count = 200;
      break;
    case '5m':
      timeIncrement = 300;
      count = 200;
      break;
    case '15m':
      timeIncrement = 900;
      count = 160;
      break;
    case '30m':
      timeIncrement = 1800;
      count = 160;
      break;
    case '1h':
      timeIncrement = 3600;
      count = 120;
      break;
    case '4h':
      timeIncrement = 14400;
      count = 100;
      break;
    case '1d':
      timeIncrement = 86400;
      count = 100;
      break;
    case '1w':
      timeIncrement = 604800;
      count = 52;
      break;
    case '1M':
      timeIncrement = 2592000;
      count = 24;
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

// Get current price for a symbol - now returns cached values for immediate use
function getCurrentPrice(symbol: string): number {
  // Try to get from the chart data cache
  if (chartDataCache[symbol] && Object.keys(chartDataCache[symbol]).length > 0) {
    const firstTimeframe = Object.keys(chartDataCache[symbol])[0] as TimeFrame;
    const candles = chartDataCache[symbol][firstTimeframe];
    if (candles.length > 0) {
      return candles[candles.length - 1].close;
    }
  }
  
  // Simple fallback values - in real-time updates we'll be using cached data
  // This just avoids TypeScript errors
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

// This async function is used to get the real current price
// Will be called periodically to update our cached data
async function getRealCurrentPrice(symbol: string): Promise<number> {
  try {
    let coinId;
    if (symbol.includes('BTC')) coinId = 'bitcoin';
    else if (symbol.includes('ETH')) coinId = 'ethereum';
    else if (symbol.includes('BNB')) coinId = 'binancecoin';
    else if (symbol.includes('SOL')) coinId = 'solana';
    else if (symbol.includes('XRP')) coinId = 'ripple';
    else return getCurrentPrice(symbol); // Fall back to cached price
    
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    if (response.ok) {
      const data = await response.json();
      if (data[coinId] && data[coinId].usd) {
        console.log(`Real price for ${symbol}: ${data[coinId].usd}`);
        return data[coinId].usd;
      }
    }
    throw new Error('Invalid response or missing data');
  } catch (error) {
    console.error(`Error fetching real price for ${symbol}:`, error);
    return getCurrentPrice(symbol); // Fall back to cached price
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
