import { useState, useEffect } from 'react';
import { 
  analyzeIndicators, 
  generateSignalSummary, 
  generateTimeframeSignals 
} from '../lib/indicators';
import { useChartData } from './useMarketData';
import { Indicator, SignalDirection, TimeFrame, TimeframeSignal } from '../types';

// Hook for technical analysis of a single timeframe
export function useSignalAnalysis(symbol: string, timeframe: TimeFrame) {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [direction, setDirection] = useState<SignalDirection>('NEUTRAL');
  const [strength, setStrength] = useState(50);
  const { chartData, isLoading } = useChartData(symbol, timeframe);
  
  useEffect(() => {
    if (chartData.length > 0) {
      // Analyze indicators based on chart data
      const newIndicators = analyzeIndicators(chartData);
      setIndicators(newIndicators);
      
      // Generate signal summary
      const { direction: newDirection, strength: newStrength } = generateSignalSummary(newIndicators);
      setDirection(newDirection);
      setStrength(newStrength);
    }
  }, [chartData]);
  
  return {
    indicators,
    direction,
    strength,
    isLoading,
    categorizedIndicators: indicators.length > 0 
      ? generateSignalSummary(indicators).categorizedIndicators 
      : {
          MOMENTUM: [],
          TREND: [],
          VOLATILITY: [],
          VOLUME: []
        }
  };
}

// Hook for multi-timeframe analysis
export function useMultiTimeframeAnalysis(symbol: string) {
  const [timeframeSignals, setTimeframeSignals] = useState<TimeframeSignal[]>([]);
  const [dominantDirection, setDominantDirection] = useState<SignalDirection>('NEUTRAL');
  
  useEffect(() => {
    // In a real app, we would make API calls for each timeframe
    // For now, generate simulated data
    const signals = generateTimeframeSignals();
    setTimeframeSignals(signals);
    
    // Determine dominant direction
    const longCount = signals.filter(s => s.signal === 'LONG').length;
    const shortCount = signals.filter(s => s.signal === 'SHORT').length;
    
    if (longCount > shortCount && longCount > signals.length / 3) {
      setDominantDirection('LONG');
    } else if (shortCount > longCount && shortCount > signals.length / 3) {
      setDominantDirection('SHORT');
    } else {
      setDominantDirection('NEUTRAL');
    }
  }, [symbol]);
  
  return {
    timeframeSignals,
    dominantDirection
  };
}
