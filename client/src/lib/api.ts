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
  const response = await fetch(`${API_BASE_URL}/api/crypto`);
  if (!response.ok) {
    throw new Error('Failed to fetch assets');
  }
  return response.json();
}

export async function fetchAssetBySymbol(symbol: string): Promise<AssetPrice> {
  const response = await fetch(`${API_BASE_URL}/api/crypto/${symbol}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${symbol}`);
  }
  return response.json();
}

// Crypto price chart data with live updates
let chartDataCache: Record<string, Record<TimeFrame, ChartData[]>> = {};
let chartUpdateListeners: Record<string, (() => void)[]> = {};

// Flag to track real-time updates
let realTimeUpdatesActive = false;
let currentSymbols: string[] = [];
let currentTimeframe: TimeFrame = '1h';

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
function startRealTimeUpdates() {
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
  
  // For simulation, update prices every 3 seconds 
  // In a real app, this would come from the WebSocket
  setInterval(() => {
    currentSymbols.forEach(symbol => {
      const simulatedPrice = getCurrentPrice(symbol) * (1 + (Math.random() - 0.48) * 0.002);
      handlePriceUpdate({
        symbol,
        price: simulatedPrice,
        change24h: (Math.random() - 0.48) * 5
      });
    });
  }, 3000);
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
  
  // Fallback prices if no cache is available
  if (symbol.includes('BTC')) {
    return 65000 + Math.random() * 2000;
  } else if (symbol.includes('ETH')) {
    return 3500 + Math.random() * 200;
  } else {
    return 100 + Math.random() * 50;
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
