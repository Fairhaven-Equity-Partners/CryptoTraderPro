import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  fetchAllAssets, 
  fetchAssetBySymbol, 
  fetchChartData, 
  connectWebSocket, 
  registerMessageHandler, 
  subscribeToSymbols,
  registerChartUpdateListener,
  startRealTimeUpdates
} from '../lib/api';
import { AssetPrice, ChartData, TimeFrame } from '../types';

// Hook for getting real-time asset price data
export function useAssetPrice(symbol: string) {
  const [realtimePrice, setRealtimePrice] = useState<AssetPrice | null>(null);
  const [isLiveDataConnected, setIsLiveDataConnected] = useState(false);
  
  // Fetch initial price data
  const { data: initialPrice, isLoading, error } = useQuery({
    queryKey: [`/api/crypto/${symbol}`],
    queryFn: () => fetchAssetBySymbol(symbol),
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
    const unsubscribe = registerMessageHandler('priceUpdate', (data) => {
      // Removed console logs for performance
      if (data.symbol === symbol) {
        setRealtimePrice(prevPrice => {
          // Merge with previous price data to maintain any fields we still need
          const updatedPrice = { 
            ...(prevPrice || {}), 
            ...data,
            // If this is from an API with lastPrice field, map it accordingly
            lastPrice: data.price || (data as any).lastPrice
          } as AssetPrice;
          
          return updatedPrice;
        });
        setIsLiveDataConnected(true);
      }
    });
    
    // Subscribe to updates for this symbol
    subscribeToSymbols([symbol]);
    
    // Real-time updates are started automatically by fetchChartData
    
    return () => {
      // Clean up subscription when component unmounts
      unsubscribe();
    };
  }, [symbol]);
  
  return {
    price: realtimePrice || initialPrice,
    isLoading,
    error,
    isLiveDataConnected
  };
}

// Hook for getting chart data with live updates
export function useChartData(symbol: string, timeframe: TimeFrame) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLiveDataConnected, setIsLiveDataConnected] = useState(false);
  
  // Reference to track if the component is mounted
  const isMounted = useRef(true);
  
  // Fetch chart data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchChartData(symbol, timeframe);
      
      if (isMounted.current) {
        setChartData(data);
        setIsLoading(false);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch chart data'));
        setIsLoading(false);
      }
    }
  }, [symbol, timeframe]);
  
  // Initial fetch
  useEffect(() => {
    fetchData();
    
    // Register for live updates with optimized error handling
    const unsubscribe = registerChartUpdateListener(symbol, timeframe, () => {
      fetchChartData(symbol, timeframe)
        .then(newData => {
          if (isMounted.current) {
            setChartData(newData);
            setIsLiveDataConnected(true);
          }
        })
        .catch(() => {
          // Silent fail to avoid console spam
        });
    });
    
    // Set up cleanup
    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [symbol, timeframe, fetchData]);
  
  // Reset mounted flag on cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    chartData,
    isLoading,
    error,
    refetch,
    isLiveDataConnected
  };
}

// Hook for getting asset list with live updates
export function useAssetList() {
  const [assets, setAssets] = useState<AssetPrice[]>([]);
  const [isLiveDataConnected, setIsLiveDataConnected] = useState(false);
  
  // Fetch asset list
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/crypto'],
    queryFn: fetchAllAssets,
    staleTime: 60000, // 1 minute
  });
  
  useEffect(() => {
    if (data) {
      setAssets(data);
    }
  }, [data]);
  
  // Register for live price updates
  useEffect(() => {
    if (data && data.length > 0) {
      // Get all symbols
      const symbols = data.map(asset => asset.symbol);
      
      // Connect to WebSocket for all assets
      connectWebSocket(symbols);
      
      // Register for price updates
      const unsubscribe = registerMessageHandler('priceUpdate', (updatedAsset) => {
        setAssets(prevAssets => {
          return prevAssets.map(asset => {
            if (asset.symbol === updatedAsset.symbol) {
              setIsLiveDataConnected(true);
              return {
                ...asset,
                price: updatedAsset.price,
                change24h: updatedAsset.change24h
              };
            }
            return asset;
          });
        });
      });
      
      // Subscribe to updates for all symbols
      subscribeToSymbols(symbols);
      
      return () => {
        unsubscribe();
      };
    }
  }, [data]);
  
  return {
    assets: assets.length > 0 ? assets : (data || []),
    isLoading,
    error,
    isLiveDataConnected
  };
}
