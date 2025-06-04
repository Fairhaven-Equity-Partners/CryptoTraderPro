import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAssetBySymbol, fetchChartData, registerMessageHandler } from '../lib/api';
import { AssetPrice, ChartData, TimeFrame } from '../types';

// Optimized market data hook
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
    
    const timeframesNeeded: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    
    const loadTimeframeData = async (tf: TimeFrame) => {
      try {
        const data = await fetchChartData(symbol, tf);
        setChartData(prev => ({ ...prev, [tf]: data }));
        loadedTimeframes.current.add(tf);
        checkAllLoaded();
      } catch (err) {
        console.error(`Error loading ${tf} data:`, err);
        loadedTimeframes.current.add(tf);
        checkAllLoaded();
      }
    };
    
    timeframesNeeded.forEach(loadTimeframeData);
    
    function handlePriceUpdate(data: any) {
      if (data && data.symbol === symbol && data.price) {
        console.log(`✅ LIVE PRICE RECEIVED for ${symbol}: ${data.price}`);
        liveDataTimestamp.current = Date.now();
        setIsLiveDataReady(true);
        console.log(`[useMarketData] Price update for ${symbol}: ${data.price} - NOT dispatching extra event`);
      }
    }
    
    registerMessageHandler('priceUpdate', handlePriceUpdate);
    
    // Cleanup function
    return () => {
      loadedTimeframes.current.clear();
      setIsAllDataLoaded(false);
      setIsLiveDataReady(false);
      liveDataTimestamp.current = 0;
    };
  }, [symbol]);
  
  const checkAllLoaded = useCallback(() => {
    const allTimeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    const allLoaded = allTimeframes.every(tf => loadedTimeframes.current.has(tf));
    
    if (allLoaded && !isAllDataLoaded) {
      setIsAllDataLoaded(true);
    }
  }, [isAllDataLoaded, symbol]);
  
  return { chartData, isAllDataLoaded, isLiveDataReady, liveDataTimestamp: liveDataTimestamp.current };
}

// Optimized asset price hook
export function useAssetPrice(symbol: string) {
  const [realtimePrice, setRealtimePrice] = useState<AssetPrice | null>(null);
  const [isLiveDataConnected, setIsLiveDataConnected] = useState(false);
  
  const { data: initialPrice, isLoading, error } = useQuery({
    queryKey: [`/api/crypto/${symbol}`],
    queryFn: () => fetchAssetBySymbol(symbol),
    staleTime: 30000,
  });
  
  useEffect(() => {
    setRealtimePrice(null);
    setIsLiveDataConnected(false);
    
    if (initialPrice && initialPrice.price > 0) {
      const livePrice: AssetPrice = {
        ...initialPrice,
        lastPrice: initialPrice.price
      };
      
      setRealtimePrice(livePrice);
      setIsLiveDataConnected(true);
    }
  }, [symbol, initialPrice]);
  
  useEffect(() => {
    const handlePriceUpdate = (event: any) => {
      if (event.detail?.symbol === symbol && event.detail?.price) {
        const price = event.detail.price;
        
        setRealtimePrice(prevPrice => {
          const syncedPrice = {
            ...(prevPrice || initialPrice || {}),
            price: price,
            lastPrice: price
          };
          
          return syncedPrice as AssetPrice;
        });
        setIsLiveDataConnected(true);
      }
    };
    
    // Set up a price update on a 3-minute interval
    let priceUpdateInterval: NodeJS.Timeout | null = null;
    
    const setupPriceUpdates = () => {
      // Initial update
      fetchAssetBySymbol(symbol)
        .then(data => {
          if (data) {
            handlePriceUpdate({ detail: { symbol, price: data.price } });
          }
        })
        .catch(err => console.error("Error fetching initial price:", err));
      
      // Set up a dummy interval that doesn't actually do anything
    // We now use the centralized stable price system instead 
    // This is kept for backward compatibility
      priceUpdateInterval = setInterval(() => {
        console.log(`Using centralized stable price system (3-minute update interval)`);
        // No actual price fetch happens here anymore
      }, 999999999);
    };
    
    // Start the price updates
    setupPriceUpdates();
    
    // Also connect to traditional sources for backward compatibility
    connectWebSocket([symbol]);
    subscribeToSymbols([symbol]);
    
    // Add event listeners
    window.addEventListener('price-update', handlePriceUpdate);
    document.addEventListener('live-price-update', handlePriceUpdate);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('price-update', handlePriceUpdate);
      document.removeEventListener('live-price-update', handlePriceUpdate);
      
      // Clear interval
      if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
      }
    };
  }, [symbol, initialPrice]);
  
  return {
    price: realtimePrice || initialPrice,
    isLoading: isLoading && !realtimePrice,
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

// Simplified asset list hook
export function useAssetList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/crypto'],
    queryFn: () => fetch('/api/crypto').then(res => res.json()),
    staleTime: 60000,
  });
  
  return { assets: data || [], isLoading, error };
}
