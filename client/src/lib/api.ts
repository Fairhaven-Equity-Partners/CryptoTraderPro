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

// WebSocket connection
let ws: WebSocket | null = null;

// WebSocket message handlers
const messageHandlers: Record<string, ((data: any) => void)[]> = {};

export function connectWebSocket(symbols: string[] = []) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}`;
  
  // Close existing connection if any
  if (ws) {
    ws.close();
  }
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    // Subscribe to symbols
    if (symbols.length > 0) {
      ws.send(JSON.stringify({
        type: 'subscribe',
        symbols
      }));
    }
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      const { type, data } = message;
      
      // Call registered handlers for this message type
      if (messageHandlers[type]) {
        messageHandlers[type].forEach(handler => handler(data));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Reconnect after a delay
    setTimeout(() => connectWebSocket(symbols), 5000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    ws.close();
  };
}

export function subscribeToSymbols(symbols: string[]) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'subscribe',
      symbols
    }));
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

// Crypto price chart data (in a real app, this would call to a real data provider)
export async function fetchChartData(symbol: string, timeframe: TimeFrame): Promise<ChartData[]> {
  // Simulate API call
  // In a real app, this would connect to a data provider like CoinGecko, Binance, etc.
  return simulateChartData(timeframe);
}

function simulateChartData(timeframe: TimeFrame): ChartData[] {
  const now = Math.floor(Date.now() / 1000);
  const data: ChartData[] = [];
  
  // Determine time increment based on timeframe
  let timeIncrement: number;
  let count: number;
  
  switch (timeframe) {
    case '1m':
      timeIncrement = 60;
      count = 100;
      break;
    case '5m':
      timeIncrement = 300;
      count = 100;
      break;
    case '15m':
      timeIncrement = 900;
      count = 100;
      break;
    case '30m':
      timeIncrement = 1800;
      count = 100;
      break;
    case '1h':
      timeIncrement = 3600;
      count = 100;
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
  
  let price = 43000 + Math.random() * 1000;
  
  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * timeIncrement;
    const change = (Math.random() - 0.48) * 100; // Slightly bullish bias
    price += change;
    
    const open = price;
    const close = price + (Math.random() - 0.5) * 50;
    const high = Math.max(open, close) + Math.random() * 30;
    const low = Math.min(open, close) - Math.random() * 30;
    const volume = 1000000 + Math.random() * 5000000;
    
    data.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  return data;
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
