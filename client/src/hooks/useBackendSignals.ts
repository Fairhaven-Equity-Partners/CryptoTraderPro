import { useEffect, useState } from 'react';
import { AdvancedSignal, TimeFrame } from '../types';

interface UseBackendSignalsProps {
  symbol: string;
  selectedTimeframe: TimeFrame;
}

export const useBackendSignals = ({ symbol, selectedTimeframe }: UseBackendSignalsProps) => {
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({
    '1m': null,
    '5m': null,
    '15m': null,
    '30m': null,
    '1h': null,
    '4h': null,
    '1d': null,
    '3d': null,
    '1w': null,
    '1M': null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(0);

  const fetchSignalsFromBackend = async () => {
    if (!symbol || isLoading) return;
    
    // Prevent excessive API calls
    const now = Date.now();
    if (now - lastFetch < 5000) return;
    
    setIsLoading(true);
    setLastFetch(now);
    
    console.log(`🔄 Fetching backend signals for ${symbol}`);

    const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    const newSignals: Record<TimeFrame, AdvancedSignal | null> = {};
    let successCount = 0;

    // Fetch all signals in parallel
    const signalPromises = timeframes.map(async (timeframe) => {
      try {
        const response = await fetch(`/api/signal/${encodeURIComponent(symbol)}/${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.signal) {
            const backendSignal = data.signal;
            newSignals[timeframe] = {
              direction: backendSignal.direction,
              confidence: backendSignal.confidence,
              entryPrice: backendSignal.entryPrice || 100000,
              stopLoss: backendSignal.stopLoss || 98000,
              takeProfit: backendSignal.takeProfit || 102000,
              timeframe: timeframe,
              timestamp: backendSignal.timestamp || now,
              successProbability: backendSignal.successProbability || backendSignal.confidence,
              indicators: backendSignal.indicators || {},
              patternFormations: backendSignal.patternFormations || [],
              supportResistance: {
                supports: [],
                resistances: [],
                pivotPoints: []
              },
              environment: {
                trend: 'NEUTRAL',
                volatility: 'MEDIUM',
                volume: 'NORMAL',
                sentiment: 'NEUTRAL'
              },
              marketStructure: {
                trend: 'SIDEWAYS',
                phase: 'CONSOLIDATION',
                strength: 50
              },
              volumeProfile: {
                volumeWeightedPrice: backendSignal.entryPrice || 100000,
                highVolumeNodes: [],
                lowVolumeNodes: []
              },
              expectedDuration: '4-8 hours',
              riskRewardRatio: 1.5,
              optimalRiskReward: {
                ideal: 2.0,
                range: [1.5, 3.0]
              },
              recommendedLeverage: backendSignal.recommendedLeverage || {
                conservative: 1,
                moderate: 2,
                aggressive: 3,
                recommendation: 'conservative'
              },
              macroInsights: []
            };
            successCount++;
            console.log(`✅ ${symbol} ${timeframe}: ${backendSignal.direction} @ ${backendSignal.confidence}%`);
          } else {
            newSignals[timeframe] = null;
          }
        } else {
          newSignals[timeframe] = null;
        }
      } catch (error) {
        newSignals[timeframe] = null;
        console.error(`❌ Error fetching ${symbol} ${timeframe}:`, error);
      }
    });

    await Promise.all(signalPromises);
    
    setSignals(newSignals);
    
    const longCount = Object.values(newSignals).filter(s => s?.direction === 'LONG').length;
    const shortCount = Object.values(newSignals).filter(s => s?.direction === 'SHORT').length;
    
    console.log(`🎯 Loaded ${successCount}/10 signals for ${symbol}: ${longCount} LONG, ${shortCount} SHORT`);
    setIsLoading(false);
  };

  useEffect(() => {
    if (symbol) {
      fetchSignalsFromBackend();
    }
  }, [symbol]);

  // Manual refresh function
  const refreshSignals = () => {
    setLastFetch(0); // Reset throttle
    fetchSignalsFromBackend();
  };

  return {
    signals,
    isLoading,
    refreshSignals,
    validSignalCount: Object.values(signals).filter(s => s !== null).length
  };
};