import React, { useState, useEffect, useRef } from 'react';
import { useAssetPrice } from '../hooks/useMarketData';
import { useSignalAnalysis } from '../hooks/useSignalAnalysis';
import { formatPrice, formatPercentage, getPriceChangeClass } from '../lib/calculations';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { 
  startPricePolling, 
  subscribeToPriceUpdates, 
  getSecondsUntilNextRefresh 
} from '../lib/fixedPriceSystem';

interface PriceOverviewProps {
  symbol: string;
  timeframe: string;
}

const PriceOverview: React.FC<PriceOverviewProps> = ({ symbol, timeframe }) => {
  // Global price data from API (for 24h change %, etc)
  const { price, isLoading } = useAssetPrice(symbol);
  const { direction, strength } = useSignalAnalysis(symbol, timeframe as any);
  
  // Track price state with animation
  const [priceState, setPriceState] = useState({
    price: 0,
    previousPrice: 0,
    flash: false,
    lastUpdate: new Date()
  });
  
  // Countdown timer until next refresh
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(180);
  
  // Ref for flash animation timer
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set up the price display countdown timer
  useEffect(() => {
    // Start with the current remaining time
    setNextRefreshIn(getSecondsUntilNextRefresh());
    
    // Update the countdown every second 
    const countdownTimer = setInterval(() => {
      setNextRefreshIn(getSecondsUntilNextRefresh());
    }, 1000);
    
    // Listen for price-timer-reset events
    const handleTimerReset = () => {
      console.log('Price timer reset event received');
      setNextRefreshIn(180); // Reset to 3 minutes
    };
    
    // Register for timer reset events
    window.addEventListener('price-timer-reset', handleTimerReset);
    
    return () => {
      clearInterval(countdownTimer);
      window.removeEventListener('price-timer-reset', handleTimerReset);
    };
  }, []);
  
  // Start price polling and subscribe to updates
  useEffect(() => {
    console.log(`Setting up price updates for ${symbol}`);
    
    // Start the 3-minute price polling system
    const stopPolling = startPricePolling(symbol);
    
    // Subscribe to price updates from our unified system
    const unsubscribe = subscribeToPriceUpdates(symbol, (newPrice) => {
      console.log(`Price update received: ${newPrice}`);
      
      // Update the price state with animation
      setPriceState(prev => ({
        previousPrice: prev.price,
        price: newPrice,
        flash: true,
        lastUpdate: new Date()
      }));
      
      // Clear any existing flash timer
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      
      // Set timer to remove flash effect after 2 seconds
      flashTimerRef.current = setTimeout(() => {
        setPriceState(prev => ({
          ...prev,
          flash: false
        }));
      }, 2000);
    });
    
    // Cleanup
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      unsubscribe();
      stopPolling();
    };
  }, [symbol]);
  
  if (isLoading || !price) {
    return (
      <div className="px-4 py-3 bg-secondary mb-2 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-5 bg-gray-700 rounded w-20 mt-1 animate-pulse"></div>
          </div>
          <div>
            <div className="h-5 bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-5 bg-gray-700 rounded w-24 mt-1 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const priceChangeClass = getPriceChangeClass(price.change24h);
  const directionColor = direction === 'LONG' ? 'text-success' : direction === 'SHORT' ? 'text-danger' : 'text-neutral';
  const progressColor = direction === 'LONG' ? 'bg-success' : direction === 'SHORT' ? 'bg-danger' : 'bg-neutral';
  
  // Get flash animation class
  const flashClass = priceState.flash ? 
    (priceState.price > priceState.previousPrice ? 'text-green-500' : 'text-red-500') : '';
  
  // Calculate time since last update
  const timeSinceUpdate = Math.floor((new Date().getTime() - priceState.lastUpdate.getTime()) / 1000);
  
  // Price direction indicator
  const priceDirection = priceState.price > priceState.previousPrice ? 
    <ArrowUp className="h-4 w-4 text-green-500" /> : 
    <ArrowDown className="h-4 w-4 text-red-500" />;
  
  return (
    <div className="px-4 py-3 bg-secondary mb-2 border-b border-gray-700">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <span className={`text-2xl font-semibold text-white transition-colors duration-300 ${flashClass}`}>
              {formatPrice(priceState.price, symbol)}
            </span>
            {priceState.flash && priceDirection}
            <Badge variant="outline" className="ml-2 text-xs font-medium text-white">
              Next update: {Math.floor(nextRefreshIn / 60)}m {nextRefreshIn % 60}s
            </Badge>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`${priceChangeClass} text-sm font-medium`}>
              {formatPercentage(price.change24h)}
            </span>
            <span className="text-neutral text-xs">(24h)</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-medium">Signal Strength</div>
          <div className="mt-1 flex items-center justify-end">
            <span className={`${directionColor} text-sm font-medium mr-1`}>{direction}</span>
            <div className="bg-gray-700 w-16 h-2 rounded-full overflow-hidden">
              <Progress value={strength} className={progressColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceOverview;
