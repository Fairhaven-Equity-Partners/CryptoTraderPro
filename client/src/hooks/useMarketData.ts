import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchAllAssets, 
  fetchAssetBySymbol, 
  fetchChartData, 
  connectWebSocket, 
  registerMessageHandler, 
  subscribeToSymbols 
} from '../lib/api';
import { AssetPrice, ChartData, TimeFrame } from '../types';

// Hook for getting real-time asset price data
export function useAssetPrice(symbol: string) {
  const [realtimePrice, setRealtimePrice] = useState<AssetPrice | null>(null);
  
  // Fetch initial price data
  const { data: initialPrice, isLoading, error } = useQuery({
    queryKey: [`/api/crypto/${symbol}`],
    staleTime: 30000, // 30 seconds
  });
  
  useEffect(() => {
    if (initialPrice) {
      setRealtimePrice(initialPrice);
    }
  }, [initialPrice]);
  
  useEffect(() => {
    // Connect to WebSocket for real-time updates
    connectWebSocket([symbol]);
    
    // Register handler for price updates
    const unsubscribe = registerMessageHandler('price_update', (data) => {
      if (data.symbol === symbol) {
        setRealtimePrice(data);
      }
    });
    
    // Subscribe to updates for this symbol
    subscribeToSymbols([symbol]);
    
    return () => {
      // Clean up subscription when component unmounts
      unsubscribe();
    };
  }, [symbol]);
  
  return {
    price: realtimePrice || initialPrice,
    isLoading,
    error
  };
}

// Hook for getting chart data
export function useChartData(symbol: string, timeframe: TimeFrame) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/chart/${symbol}/${timeframe}`],
    queryFn: () => fetchChartData(symbol, timeframe),
    staleTime: 60000, // 1 minute
  });
  
  // Auto-refresh data on timeframe change
  useEffect(() => {
    refetch();
  }, [timeframe, refetch]);
  
  return {
    chartData: data || [],
    isLoading,
    error,
    refetch
  };
}

// Hook for getting asset list
export function useAssetList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/crypto'],
    staleTime: 60000, // 1 minute
  });
  
  return {
    assets: data || [],
    isLoading,
    error
  };
}
