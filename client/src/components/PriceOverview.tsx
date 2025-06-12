import React, { useState, useEffect, useRef } from 'react';
import { useAssetPrice } from '../hooks/useMarketData';
import { useSignalAnalysis } from '../hooks/useSignalAnalysis';
import { formatPrice, formatPercentage, getPriceChangeClass } from '../lib/calculations';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useCentralizedPrice } from '../lib/centralizedPriceManager';

interface PriceOverviewProps {
  symbol: string;
  timeframe: string;
}

const PriceOverview: React.FC<PriceOverviewProps> = ({ symbol, timeframe }) => {
  // Use only centralized price manager to eliminate redundant API calls
  const centralizedPrice = useCentralizedPrice(symbol);
  const { direction, strength } = useSignalAnalysis(symbol, timeframe as any);
  
  // Track price state with animation - use authentic CoinMarketCap price
  const [priceState, setPriceState] = useState({
    price: 0,
    previousPrice: 0,
    flash: false,
    lastUpdate: new Date()
  });
  
  // Get price data only when needed (reduced frequency)
  const { price, isLoading } = useAssetPrice(symbol);
  
  // Ref for flash animation timer
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update price state when centralized price changes
  useEffect(() => {
    if (centralizedPrice && centralizedPrice > 0) {setPriceState(prev => {
        const hasChanged = prev.price !== centralizedPrice && prev.price > 0;
        return {
          previousPrice: prev.price,
          price: centralizedPrice,
          flash: hasChanged,
          lastUpdate: new Date()
        };
      });
      
      // Clear any existing flash timer
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
      
      // Set timer to remove flash effect after 2 seconds
      if (priceState.price !== centralizedPrice && priceState.price > 0) {
        flashTimerRef.current = setTimeout(() => {
          setPriceState(current => ({
            ...current,
            flash: false
          }));
        }, 2000);
      }
    }
  }, [centralizedPrice, symbol]);
  
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
    <div className="px-4 py-2 bg-secondary mb-2 border-b border-gray-700">
      <div className="flex items-center space-x-4">
        <h3 className="text-base font-medium text-white">{symbol}</h3>
        <div className="flex items-center space-x-3">
          <span className={`text-lg font-bold text-white transition-colors duration-300 ${flashClass}`}>
            ${parseFloat(priceState.price.toFixed(2)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
          {priceState.flash && priceDirection}
          <span className=`{`${priceChangeClass} text-sm font-mediu`m`}>
            {formatPercentage(price.change24h)}
          </span>
          <span className="text-neutral text-sm">24h</span>
        </div>
      </div>
    </div>
  );
};

export default PriceOverview;
