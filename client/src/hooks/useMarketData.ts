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

// Combined hook for market data
export function useMarketData(symbol: string) {
  const [chartData, setChartData] = useState<Record<TimeFrame, ChartData[]>>({} as any);
  const [isAllDataLoaded, setIsAllDataLoaded] = useState(false);
  const loadedTimeframes = useRef<Set<TimeFrame>>(new Set());
  
  // Load chart data for all timeframes
  useEffect(() => {
    console.log(`Loading chart with data points for ${symbol} (4h)`);
    fetchChartData(symbol, '4h').then(data => {
      setChartData(prev => ({ ...prev, '4h': data }));
      loadedTimeframes.current.add('4h');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 4h data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (1m)`);
    fetchChartData(symbol, '1m').then(data => {
      setChartData(prev => ({ ...prev, '1m': data }));
      loadedTimeframes.current.add('1m');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 1m data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (5m)`);
    fetchChartData(symbol, '5m').then(data => {
      setChartData(prev => ({ ...prev, '5m': data }));
      loadedTimeframes.current.add('5m');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 5m data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (15m)`);
    fetchChartData(symbol, '15m').then(data => {
      setChartData(prev => ({ ...prev, '15m': data }));
      loadedTimeframes.current.add('15m');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 15m data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (30m)`);
    fetchChartData(symbol, '30m').then(data => {
      setChartData(prev => ({ ...prev, '30m': data }));
      loadedTimeframes.current.add('30m');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 30m data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (1h)`);
    fetchChartData(symbol, '1h').then(data => {
      setChartData(prev => ({ ...prev, '1h': data }));
      loadedTimeframes.current.add('1h');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 1h data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (1d)`);
    fetchChartData(symbol, '1d').then(data => {
      setChartData(prev => ({ ...prev, '1d': data }));
      loadedTimeframes.current.add('1d');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 1d data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (3d)`);
    fetchChartData(symbol, '3d').then(data => {
      setChartData(prev => ({ ...prev, '3d': data }));
      loadedTimeframes.current.add('3d');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 3d data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (1w)`);
    fetchChartData(symbol, '1w').then(data => {
      setChartData(prev => ({ ...prev, '1w': data }));
      loadedTimeframes.current.add('1w');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 1w data:", err));
    
    console.log(`Loading chart with data points for ${symbol} (1M)`);
    fetchChartData(symbol, '1M').then(data => {
      setChartData(prev => ({ ...prev, '1M': data }));
      loadedTimeframes.current.add('1M');
      checkAllLoaded();
    }).catch(err => console.error("Error loading 1M data:", err));
    
    // Reset all loaded state when symbol changes
    return () => {
      loadedTimeframes.current.clear();
      setIsAllDataLoaded(false);
    };
    
  }, [symbol]);
  
  // Check if all timeframes are loaded
  const checkAllLoaded = useCallback(() => {
    const allTimeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    const allLoaded = allTimeframes.every(tf => loadedTimeframes.current.has(tf));
    
    if (allLoaded && !isAllDataLoaded) {
      setIsAllDataLoaded(true);
    }
  }, [isAllDataLoaded]);
  
  return { chartData, isAllDataLoaded };
}

// Hook for getting real-time asset price data
export function useAssetPrice(symbol: string) {
  const [realtimePrice, setRealtimePrice] = useState<AssetPrice | null>(null);
  const [isLiveDataConnected, setIsLiveDataConnected] = useState(false);
  
  // Clear realtime price when symbol changes to avoid showing stale data
  useEffect(() => {
    setRealtimePrice(null);
    setIsLiveDataConnected(false);
  }, [symbol]);
  
  // Fetch initial price data
  const { data: initialPrice, isLoading, error } = useQuery({
    queryKey: [`/api/crypto/${symbol}`],
    queryFn: () => fetchAssetBySymbol(symbol),
    staleTime: 30000, // 30 seconds
  });
  
  useEffect(() => {
    if (initialPrice) {
      // Update with fresh data when it arrives
      setRealtimePrice(initialPrice);
    }
  }, [initialPrice]);
  
  useEffect(() => {
    // Connect to WebSocket for real-time updates
    connectWebSocket([symbol]);
    
    // Register handler for price updates
    const unsubscribe = registerMessageHandler('priceUpdate', (data) => {
      // Only update if this update is for our current symbol
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
  
  // Use a ref to store previous data to avoid showing loading state during transitions
  const previousDataRef = useRef<{[key: string]: ChartData[]}>({});
  
  // Reference to track if the component is mounted
  const isMounted = useRef(true);
  
  // Fetch chart data with optimization
  const fetchData = useCallback(async () => {
    try {
      // Don't show loading state if we have previous data for this symbol
      const cacheKey = `${symbol}_${timeframe}`;
      const hasPreviousData = previousDataRef.current[cacheKey]?.length > 0;
      
      if (!hasPreviousData) {
        setIsLoading(true);
      }
      
      // Fetch new data
      const data = await fetchChartData(symbol, timeframe);
      
      if (isMounted.current) {
        setChartData(data);
        setIsLoading(false);
        setError(null);
        
        // Store this data for future symbol switches
        previousDataRef.current[cacheKey] = data;
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
    // Check cache first to prevent flickering
    const cacheKey = `${symbol}_${timeframe}`;
    if (previousDataRef.current[cacheKey]?.length > 0) {
      // Use cached data immediately to avoid loading state
      setChartData(previousDataRef.current[cacheKey]);
      setIsLoading(false);
    }
    
    // Fetch fresh data in any case
    fetchData();
    
    // Register for live updates with optimized error handling
    const unsubscribe = registerChartUpdateListener(symbol, timeframe, () => {
      fetchChartData(symbol, timeframe)
        .then(newData => {
          if (isMounted.current) {
            setChartData(newData);
            previousDataRef.current[cacheKey] = newData;
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
