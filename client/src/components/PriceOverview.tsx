import React from 'react';
import { useAssetPrice } from '../hooks/useMarketData';
import { useSignalAnalysis } from '../hooks/useSignalAnalysis';
import { formatPrice, formatPercentage, getPriceChangeClass } from '../lib/calculations';
import { Progress } from '@/components/ui/progress';

interface PriceOverviewProps {
  symbol: string;
  timeframe: string;
}

const PriceOverview: React.FC<PriceOverviewProps> = ({ symbol, timeframe }) => {
  const { price, isLoading } = useAssetPrice(symbol);
  const { direction, strength } = useSignalAnalysis(symbol, timeframe as any);
  
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
  
  return (
    <div className="px-4 py-3 bg-secondary mb-2 border-b border-gray-700">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-2xl font-semibold text-white">
            {formatPrice(price.lastPrice, symbol)}
          </span>
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
