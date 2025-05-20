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
  const [isLiveDataReady, setIsLiveDataReady] = useState(false);
  const loadedTimeframes = useRef<Set<TimeFrame>>(new Set());
  const liveDataTimestamp = useRef<number>(0);
  
  // Load chart data for all timeframes
  useEffect(() => {
    // Reset data state when symbol changes
    setChartData({} as any);
    loadedTimeframes.current.clear();
    setIsAllDataLoaded(false);
    setIsLiveDataReady(false);
    liveDataTimestamp.current = 0;
    
    // Define all timeframes we want to load
    const timeframesNeeded: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    
    // Function to load data for a specific timeframe
    const loadTimeframeData = async (tf: TimeFrame) => {
      try {
        console.log(`Loading chart data for ${symbol} (${tf})`);
        const data = await fetchChartData(symbol, tf);
        setChartData(prev => ({ ...prev, [tf]: data }));
        loadedTimeframes.current.add(tf);
        checkAllLoaded();
      } catch (err) {
        console.error(`Error loading ${tf} data for ${symbol}:`, err);
        // Even if there's an error, mark this timeframe as attempted
        loadedTimeframes.current.add(tf);
        checkAllLoaded();
      }
    };
    
    // Start loading all timeframes in parallel
    for (const tf of timeframesNeeded) {
      loadTimeframeData(tf);
    }
    
    // We MUST create a direct way to detect price updates and trigger calculations

    // Function to directly handle the price update events that come from the server
    function handlePriceUpdate(data: any) {
      // Only respond to updates for our specific symbol
      if (data && data.symbol === symbol && data.price) {
        console.log(`✅ LIVE PRICE RECEIVED for ${symbol}: ${data.price}`);
        
        // Update timestamp and set the flag to trigger calculations
        liveDataTimestamp.current = Date.now();
        
        // We need to force this to be true to trigger calculations
        setIsLiveDataReady(true);
        
        // Publish an event to notify the dashboard that new live data is ready
        document.dispatchEvent(new CustomEvent('live-price-update', { 
          detail: { symbol, price: data.price, timestamp: Date.now() }
        }));
      }
    }
    
    // Register our price update listener - we'll subscribe to ALL messages and filter for price updates
    registerMessageHandler((data: any) => handlePriceUpdate(data));
    
    // Cleanup function
    return () => {
      loadedTimeframes.current.clear();
      setIsAllDataLoaded(false);
      setIsLiveDataReady(false);
      liveDataTimestamp.current = 0;
    };
  }, [symbol]);
  
  // Check if all timeframes are loaded
  const checkAllLoaded = useCallback(() => {
    const allTimeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    const allLoaded = allTimeframes.every(tf => loadedTimeframes.current.has(tf));
    
    if (allLoaded && !isAllDataLoaded) {
      console.log(`All timeframe data loaded for ${symbol}`);
      setIsAllDataLoaded(true);
    }
  }, [isAllDataLoaded, symbol]);
  
  return { chartData, isAllDataLoaded, isLiveDataReady, liveDataTimestamp: liveDataTimestamp.current };
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
