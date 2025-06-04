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
  
  useEffect(() => {
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
    
    window.addEventListener('price-update', handlePriceUpdate);
    document.addEventListener('live-price-update', handlePriceUpdate);
    
    return () => {
      window.removeEventListener('price-update', handlePriceUpdate);
      document.removeEventListener('live-price-update', handlePriceUpdate);
    };
  }, [symbol, initialPrice]);
  
  return {
    price: realtimePrice || initialPrice,
    isLoading: isLoading && !realtimePrice,
    error,
    isLiveDataConnected
  };
}

// Optimized chart data hook
export function useChartData(symbol: string, timeframe: TimeFrame) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchChartData(symbol, timeframe);
      setChartData(data);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch chart data'));
      setIsLoading(false);
    }
  }, [symbol, timeframe]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { chartData, isLoading, error, refetch: fetchData };
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