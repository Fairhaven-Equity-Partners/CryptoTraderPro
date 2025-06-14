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
        
        // Disabled this event dispatch to prevent duplicate calculations
        // The AdvancedSignalDashboard will track isLiveDataReady state directly
        
        // Log for debugging only
        console.log(`[useMarketData] Price update for ${symbol}: ${data.price} - NOT dispatching extra event`);
        
        /* DISABLED TO PREVENT DUPLICATE CALCULATIONS
        document.dispatchEvent(new CustomEvent('live-price-update', { 
          detail: { symbol, price: data.price, timestamp: Date.now() }
        }));
        */
      }
    }
    
    // Register our price update listener - we'll subscribe to ALL messages and filter for price updates
    registerMessageHandler('priceUpdate', (data: any) => handlePriceUpdate(data));
    
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
  
  // Fetch initial price data (we still need this for the other fields like change24h)
  const { data: initialPrice, isLoading, error } = useQuery({
    queryKey: [`/api/crypto/${symbol}`],
    queryFn: () => fetchAssetBySymbol(symbol),
    staleTime: 240000, // 4 minutes to match calculation interval
    refetchInterval: 240000, // Only refetch every 4 minutes
  });
  
  // Use live prices from authentic data sources
  useEffect(() => {
    // Clear realtime price when symbol changes
    setRealtimePrice(null);
    setIsLiveDataConnected(false);
    
    // Use live price data from the API response
    if (initialPrice && initialPrice.price > 0) {
      // Create a price object with live price data
      const livePrice: AssetPrice = {
        ...initialPrice,
        lastPrice: initialPrice.price  // Use authentic price data
      };
      
      setRealtimePrice(livePrice);
      setIsLiveDataConnected(true);
      console.log(`[useMarketData] Using live price for ${symbol}: ${initialPrice.price}`);
    }
  }, [symbol, initialPrice]);
  
  // Subscribe to price updates with proper 3-minute synchronization
  useEffect(() => {
    // Listen for price update events - but DON'T dispatch calculation events
    const handlePriceUpdate = (event: any) => {
      if (event.detail?.symbol === symbol && event.detail?.price) {
        const price = event.detail.price;
        
        setRealtimePrice(prevPrice => {
          // Always update both price fields to ensure they match perfectly
          const syncedPrice = {
            ...(prevPrice || initialPrice || {}),
            price: price,
            lastPrice: price  // Critical: both must be identical
          };
          
          return syncedPrice as AssetPrice;
        });
        setIsLiveDataConnected(true);
        
        // CRITICAL FIX: Only update price display, never trigger calculations here
        console.log(`[useMarketData] Price updated to ${price} for ${symbol} - display only`);
      }
    };
    
    // Set up synchronized 3-minute price fetching without calculation triggers
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
