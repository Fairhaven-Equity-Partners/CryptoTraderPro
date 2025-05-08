import React from 'react';
import { useSignalAnalysis } from '../hooks/useSignalAnalysis';
import { IndicatorCategory, IndicatorSignal } from '../types';
import { Progress } from '@/components/ui/progress';

interface SignalSummaryProps {
  symbol: string;
  timeframe: string;
}

// Mapping of indicator signals to display text
const signalToText: Record<IndicatorSignal, string> = {
  'BUY': 'BUY',
  'SELL': 'SELL',
  'NEUTRAL': 'NEUTRAL'
};

// Mapping of indicator signals to CSS classes
const signalToClass: Record<IndicatorSignal, string> = {
  'BUY': 'text-success',
  'SELL': 'text-danger',
  'NEUTRAL': 'text-neutral'
};

// Category titles for the UI
const categoryTitles: Record<IndicatorCategory, string> = {
  'MOMENTUM': 'Momentum',
  'TREND': 'Trend',
  'VOLATILITY': 'Volatility',
  'VOLUME': 'Volume'
};

const SignalSummary: React.FC<SignalSummaryProps> = ({ symbol, timeframe }) => {
  const { direction, strength, categorizedIndicators, isLoading } = useSignalAnalysis(symbol, timeframe as any);
  
  if (isLoading) {
    return (
      <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white text-lg font-medium">Signal Summary</h2>
          <div className="h-6 w-20 bg-gray-700 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(categoryTitles).map((title) => (
            <div key={title} className="bg-gray-800 rounded-lg p-2">
              <h3 className="text-neutral text-xs uppercase font-medium mb-2">{title}</h3>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-3 w-16 bg-gray-700 animate-pulse rounded"></div>
                    <div className="h-3 w-12 bg-gray-700 animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  const directionColor = direction === 'LONG' ? 'bg-success' : direction === 'SHORT' ? 'bg-danger' : 'bg-neutral';
  
  return (
    <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white text-lg font-medium">Signal Summary</h2>
        <span className={`text-xs py-1 px-2 rounded ${directionColor} text-white font-medium`}>
          {direction} {strength}%
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(categorizedIndicators).map(([category, indicators]) => (
          <div key={category} className="bg-gray-800 rounded-lg p-2">
            <h3 className="text-neutral text-xs uppercase font-medium mb-2">
              {categoryTitles[category as IndicatorCategory]}
            </h3>
            <div className="flex flex-col space-y-2">
              {indicators.map((indicator) => (
                <div key={indicator.name} className="flex justify-between items-center">
                  <span className="text-xs">{indicator.name}</span>
                  <span className={`text-xs font-medium ${signalToClass[indicator.signal]}`}>
                    {indicator.strength || signalToText[indicator.signal]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalSummary;
