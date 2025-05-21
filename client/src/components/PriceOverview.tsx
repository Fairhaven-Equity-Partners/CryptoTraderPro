import React, { useState, useEffect, useRef } from 'react';
import { useAssetPrice } from '../hooks/useMarketData';
import { useSignalAnalysis } from '../hooks/useSignalAnalysis';
import { formatPrice, formatPercentage, getPriceChangeClass } from '../lib/calculations';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { onPriceUpdate } from '../lib/singlePriceSource';

interface PriceOverviewProps {
  symbol: string;
  timeframe: string;
}

const PriceOverview: React.FC<PriceOverviewProps> = ({ symbol, timeframe }) => {
  // Use the main price feed from the API
  const { price, isLoading } = useAssetPrice(symbol);
  const { direction, strength } = useSignalAnalysis(symbol, timeframe as any);
  
  // Track only the fetched price and previous price for flash animation
  const [priceState, setPriceState] = useState({
    price: 0,
    previousPrice: 0,
    flash: false,
    lastUpdate: new Date()
  });
  
  // Ref to store interval
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle updates from API and listen for price changes
  useEffect(() => {
    if (!price) return;
    
    // Get the price from the API - single source of truth
    const apiPrice = 'price' in price ? price.price : (price as any).lastPrice || 0;
    
    // Only update if we have a valid new price
    if (apiPrice > 0 && apiPrice !== priceState.price) {
      setPriceState(prev => ({
        previousPrice: prev.price,
        price: apiPrice,
        flash: true,
        lastUpdate: new Date()
      }));
      
      // Clear any existing flash timer
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      
      // Set timer to remove flash effect
      flashTimerRef.current = setTimeout(() => {
        setPriceState(prev => ({
          ...prev,
          flash: false
        }));
      }, 2000);
    }
    
    // Cleanup
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, [price]);
  
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
            <Badge variant="outline" className="ml-2 text-xs">
              Live {timeSinceUpdate < 60 ? `${timeSinceUpdate}s ago` : 'updating...'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`${priceChangeClass} text-sm font-medium`}>
              {formatPercentage(price.change24h)}
            </span>
            <span className="text-neutral text-xs">(24h)</span>
            {priceState.previousPrice > 0 && (
              <span className="text-xs">
                Previous: {formatPrice(priceState.previousPrice, symbol)}
              </span>
            )}
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
