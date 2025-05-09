import { useState, useEffect, useCallback } from 'react';
import { 
  analyzeIndicators, 
  generateSignalSummary,
  calculateADX,
  calculateMFI
} from '../lib/indicators';
import { useChartData } from './useMarketData';
import { fetchChartData } from '../lib/api';
import { Indicator, SignalDirection, TimeFrame, TimeframeSignal, ChartData } from '../types';

// Available timeframes for analysis
const ALL_TIMEFRAMES: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];

// Hook for technical analysis of a single timeframe
export function useSignalAnalysis(symbol: string, timeframe: TimeFrame) {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [direction, setDirection] = useState<SignalDirection>('NEUTRAL');
  const [strength, setStrength] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const { chartData, isLoading, isLiveDataConnected } = useChartData(symbol, timeframe);
  
  // Analyze indicators and update signal
  const analyzeData = useCallback((data: ChartData[]) => {
    if (data.length > 0) {
      setIsProcessing(true);
      try {
        // Analyze indicators based on chart data
        const newIndicators = analyzeIndicators(data);
        setIndicators(newIndicators);
        
        // Generate signal summary
        const { direction: newDirection, strength: newStrength } = generateSignalSummary(newIndicators);
        setDirection(newDirection);
        setStrength(newStrength);
      } catch (err) {
        console.error('Error analyzing indicators:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  }, []);
  
  // Process chart data when it changes
  useEffect(() => {
    analyzeData(chartData);
  }, [chartData, analyzeData]);
  
  return {
    indicators,
    direction,
    strength,
    isLoading: isLoading || isProcessing,
    isLiveDataConnected,
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to analyze a timeframe
  const analyzeTimeframe = useCallback(async (tf: TimeFrame): Promise<TimeframeSignal> => {
    try {
      // Fetch chart data for this timeframe
      const chartData = await fetchChartData(symbol, tf);
      
      if (chartData.length === 0) {
        return {
          timeframe: tf,
          signal: 'NEUTRAL',
          strength: 50,
          trend: 'Sideways'
        };
      }
      
      // Analyze indicators
      const indicators = analyzeIndicators(chartData);
      
      // Generate signal summary
      const { direction, strength } = generateSignalSummary(indicators);
      
      // Calculate trend characteristic based on indicators
      const adxResult = calculateADX(chartData);
      const mfi = calculateMFI(chartData);
      
      let trend = 'Sideways';
      if (direction === 'LONG') {
        if (adxResult.adx > 30) {
          trend = 'Strong Bullish';
        } else if (adxResult.adx > 20) {
          trend = 'Bullish';
        } else {
          trend = 'Weak Bullish';
        }
      } else if (direction === 'SHORT') {
        if (adxResult.adx > 30) {
          trend = 'Strong Bearish';
        } else if (adxResult.adx > 20) {
          trend = 'Bearish';
        } else {
          trend = 'Weak Bearish';
        }
      } else {
        if (mfi > 60) {
          trend = 'Overbought Range';
        } else if (mfi < 40) {
          trend = 'Oversold Range';
        } else {
          trend = 'Sideways';
        }
      }
      
      return {
        timeframe: tf,
        signal: direction,
        strength,
        trend
      };
    } catch (err) {
      console.error(`Error analyzing timeframe ${tf}:`, err);
      return {
        timeframe: tf,
        signal: 'NEUTRAL',
        strength: 50,
        trend: 'Data Error'
      };
    }
  }, [symbol]);
  
  // Analyze all timeframes
  const analyzeAllTimeframes = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = ALL_TIMEFRAMES.map(tf => analyzeTimeframe(tf));
      const results = await Promise.all(promises);
      setTimeframeSignals(results);
      
      // Determine dominant direction with more weight to larger timeframes
      let longScore = 0;
      let shortScore = 0;
      
      results.forEach(signal => {
        let weight = 1;
        
        // Give more weight to larger timeframes
        if (['1d', '1w', '1M'].includes(signal.timeframe)) {
          weight = 3;
        } else if (['1h', '4h'].includes(signal.timeframe)) {
          weight = 2;
        }
        
        if (signal.signal === 'LONG') {
          longScore += weight * (signal.strength / 100);
        } else if (signal.signal === 'SHORT') {
          shortScore += weight * (signal.strength / 100);
        }
      });
      
      const totalWeight = results.reduce((sum, signal) => {
        if (['1d', '1w', '1M'].includes(signal.timeframe)) {
          return sum + 3;
        } else if (['1h', '4h'].includes(signal.timeframe)) {
          return sum + 2;
        }
        return sum + 1;
      }, 0);
      
      // Normalize scores
      longScore = longScore / totalWeight;
      shortScore = shortScore / totalWeight;
      
      // Set dominant direction based on normalized scores
      if (longScore > 0.4 && longScore > shortScore) {
        setDominantDirection('LONG');
      } else if (shortScore > 0.4 && shortScore > longScore) {
        setDominantDirection('SHORT');
      } else {
        setDominantDirection('NEUTRAL');
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to analyze timeframes'));
      console.error('Error analyzing timeframes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [analyzeTimeframe]);
  
  // Initial analysis
  useEffect(() => {
    analyzeAllTimeframes();
    
    // Set up periodic updates every 30 seconds to keep analysis current
    const intervalId = setInterval(() => {
      analyzeAllTimeframes();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [symbol, analyzeAllTimeframes]);
  
  return {
    timeframeSignals,
    dominantDirection,
    isLoading,
    error
  };
}
