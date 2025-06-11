import React, { useState, useEffect, useMemo } from 'react';
import { queryClient } from '../lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { TimeFrame } from '../types';
import { CryptoAsset } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, CircleDot } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';

interface OptimizedMarketEntry {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap?: number;
  signals: {
    [timeframe: string]: {
      direction: 'LONG' | 'SHORT' | 'NEUTRAL';
      confidence: number;
      strength: number;
      entryPrice: number;
      stopLoss: number;
      takeProfit: number;
      riskReward: number;
      successProbability: number;
      timestamp: number;
    };
  };
  sentiment: {
    direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    intensity: number;
    strength: number;
    reliability: number;
    timeframe: string;
  };
  technicalSummary: {
    trendStrength: number;
    momentum: number;
    volatility: number;
    confidence: number;
  };
  heatValue: number; // -100 to +100 scale
  color: string;
  opacity: number;
  size: number;
}

interface MarketSummary {
  totalPairs: number;
  bullishSignals: number;
  bearishSignals: number;
  neutralSignals: number;
  averageConfidence: number;
  highConfidenceSignals: number;
  timeframe: string;
  timestamp: number;
}

interface SignalHeatMapProps {
  onSelectAsset?: (symbol: string) => void;
}

// Get all timeframes from longest to shortest
const ALL_TIMEFRAMES: TimeFrame[] = ['1M', '1w', '3d', '1d', '4h', '1h', '30m', '15m', '5m', '1m'];

function getColorForConfidence(direction: string, confidence: number): string {
  if (direction === 'LONG') {
    if (confidence >= 90) return 'bg-green-600';
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 70) return 'bg-green-400';
    if (confidence >= 60) return 'bg-green-300';
    return 'bg-green-200';
  } else if (direction === 'SHORT') {
    if (confidence >= 90) return 'bg-red-600';
    if (confidence >= 80) return 'bg-red-500';
    if (confidence >= 70) return 'bg-red-400';
    if (confidence >= 60) return 'bg-red-300';
    return 'bg-red-200';
  } else {
    return 'bg-gray-300';
  }
}

function getSignalText(direction: string, confidence: number): string {
  if (direction === 'NEUTRAL') return 'NEUTRAL';
  return `${direction} (${confidence}%)`;
}

export default function SignalHeatMap({ onSelectAsset }: SignalHeatMapProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [sortBy, setSortBy] = useState<'confidence' | 'marketCap' | 'change24h'>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'LONG' | 'SHORT' | 'NEUTRAL'>('ALL');

  // Function to handle pair selection with immediate calculation trigger
  const handlePairSelection = (entry: OptimizedMarketEntry) => {
    const timeframeSignal = entry.signals[selectedTimeframe];
    console.log(`Heatmap selection: ${entry.symbol} (${timeframeSignal?.direction} ${timeframeSignal?.confidence}%)`);
    onSelectAsset && onSelectAsset(entry.symbol);
    
    // Trigger immediate calculation for selected pair
    const event = new CustomEvent('immediate-pair-calculation', {
      detail: { symbol: entry.symbol, trigger: 'heatmap-selection' }
    });
    document.dispatchEvent(event);
  };
  
  // Perfect synchronization with ultimateSystemManager timer
  useEffect(() => {
    const syncWithUltimateSystem = () => {
      console.log('[HeatMap] Syncing with ultimate system timer - refreshing heatmap data');
      queryClient.invalidateQueries({ queryKey: ['/api/crypto/all-pairs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/market-heatmap'] });
    };

    // Listen for synchronized calculation events from the ultimate system
    const handleCalculationEvent = (event: CustomEvent) => {
      console.log('[HeatMap] Received synchronized calculation event - updating heatmap');
      syncWithUltimateSystem();
    };

    // Subscribe to synchronized calculation events
    window.addEventListener('synchronized-calculation-complete', handleCalculationEvent as EventListener);
    window.addEventListener('calculation-loop-complete', handleCalculationEvent as EventListener);
    
    return () => {
      window.removeEventListener('synchronized-calculation-complete', handleCalculationEvent as EventListener);
      window.removeEventListener('calculation-loop-complete', handleCalculationEvent as EventListener);
    };
  }, []);

  // Fetch optimized market heatmap data from new backend structure
  const { data: heatmapResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/market-heatmap', selectedTimeframe],
    queryFn: async () => {
      console.log(`[OptimizedHeatMap] Fetching market analysis data for ${selectedTimeframe}`);
      const response = await fetch(`/api/market-heatmap?timeframe=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch heatmap data');
      return response.json();
    },
    refetchInterval: false, // Disable automatic refetch - use event-driven updates
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Extract data and summary from the new response structure
  const marketEntries: OptimizedMarketEntry[] = heatmapResponse?.marketEntries || [];
  const marketSummary: MarketSummary | undefined = heatmapResponse?.summary;
  
  // Debug logging to trace data flow
  console.log('[HeatMap Debug] Raw response:', { 
    hasData: !!heatmapResponse, 
    entriesCount: marketEntries.length,
    firstEntry: marketEntries[0]
  });

  // Force refetch when timeframe changes
  React.useEffect(() => {
    refetch();
  }, [selectedTimeframe, refetch]);

  // Process optimized market entries from the new backend structure
  const processedMarketEntries = useMemo(() => {
    if (!marketEntries || !Array.isArray(marketEntries)) return [];
    
    const processed = marketEntries
      .filter((entry: OptimizedMarketEntry) => entry.currentPrice > 0)
      .map((entry: OptimizedMarketEntry) => {
        const timeframeSignal = entry.signals[selectedTimeframe];
        
        if (!timeframeSignal) {
          // Skip entries without authentic signal data - no synthetic fallback allowed
          return null;
        }
        
        const processedEntry = {
          ...entry,
          displayDirection: timeframeSignal.direction,
          displayConfidence: timeframeSignal.confidence,
          displayStrength: timeframeSignal.strength,
          displayRiskReward: timeframeSignal.riskReward,
          displaySuccessProbability: timeframeSignal.successProbability
        };
        
        // Debug BTC/USDT specifically
        if (entry.symbol === 'BTC/USDT') {
          console.log('[HeatMap Debug] BTC/USDT processed:', {
            timeframe: selectedTimeframe,
            hasSignal: !!timeframeSignal,
            direction: processedEntry.displayDirection,
            confidence: processedEntry.displayConfidence,
            rawSignal: timeframeSignal
          });
        }
        
        return processedEntry;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
      
    console.log('[HeatMap Debug] Processed entries:', {
      total: processed.length,
      shortSignals: processed.filter(e => e.displayDirection === 'SHORT').length,
      highConfShorts: processed.filter(e => e.displayDirection === 'SHORT' && e.displayConfidence >= 80).length
    });
    
    return processed;
  }, [marketEntries, selectedTimeframe]);

  // Apply direction filtering and sort by confidence (highest to lowest)
  const sortedAndFilteredEntries = useMemo(() => {
    if (!processedMarketEntries) return [];
    
    let filtered = processedMarketEntries;
    
    // Apply direction filtering
    if (filterDirection !== 'ALL') {
      filtered = processedMarketEntries.filter((entry) => entry.displayDirection === filterDirection);
    }
    
    // Sort by confidence percentage (highest to lowest)
    return filtered.sort((a, b) => {
      if (a.displayDirection === 'NEUTRAL' && b.displayDirection !== 'NEUTRAL') return 1;
      if (b.displayDirection === 'NEUTRAL' && a.displayDirection !== 'NEUTRAL') return -1;
      return b.displayConfidence - a.displayConfidence;
    });
  }, [processedMarketEntries, filterDirection]);

  // Group signals by confidence ranges for the heat map
  const groupedByConfidence = useMemo(() => {
    const groups = {
      high_long: sortedAndFilteredEntries.filter(s => s.displayDirection === 'LONG' && s.displayConfidence >= 80),
      medium_long: sortedAndFilteredEntries.filter(s => s.displayDirection === 'LONG' && s.displayConfidence >= 65 && s.displayConfidence < 80),
      low_long: sortedAndFilteredEntries.filter(s => s.displayDirection === 'LONG' && s.displayConfidence < 65),
      neutral: sortedAndFilteredEntries.filter(s => s.displayDirection === 'NEUTRAL'),
      low_short: sortedAndFilteredEntries.filter(s => s.displayDirection === 'SHORT' && s.displayConfidence < 65),
      medium_short: sortedAndFilteredEntries.filter(s => s.displayDirection === 'SHORT' && s.displayConfidence >= 65 && s.displayConfidence < 80),
      high_short: sortedAndFilteredEntries.filter(s => s.displayDirection === 'SHORT' && s.displayConfidence >= 80),
    };
    
    console.log('[HeatMap Debug] Grouped signals:', {
      highShort: groups.high_short.length,
      highShortSymbols: groups.high_short.map(s => `${s.symbol}(${s.displayConfidence}%)`),
      totalEntries: sortedAndFilteredEntries.length,
      filterDirection,
      selectedTimeframe
    });
    
    return groups;
  }, [sortedAndFilteredEntries, filterDirection, selectedTimeframe]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[300px]">Loading market data...</div>;
  }

  return (
    <Card className="w-full border-gray-800 bg-gray-900 text-white shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Market Signals Heat Map</CardTitle>
          <div className="flex space-x-2">
            <div className="text-xs opacity-70">Filter:</div>
            <Button 
              size="sm" 
              variant={filterDirection === 'ALL' ? 'default' : 'outline'} 
              className="h-7 px-2 py-1"
              onClick={() => setFilterDirection('ALL')}
            >
              ALL
            </Button>
            <Button 
              size="sm" 
              variant={filterDirection === 'LONG' ? 'default' : 'outline'} 
              className="h-7 px-2 py-1 text-green-400"
              onClick={() => setFilterDirection('LONG')}
            >
              LONG
            </Button>
            <Button 
              size="sm" 
              variant={filterDirection === 'SHORT' ? 'default' : 'outline'} 
              className="h-7 px-2 py-1 text-red-400"
              onClick={() => setFilterDirection('SHORT')}
            >
              SHORT
            </Button>
          </div>
        </div>
        <CardDescription className="text-gray-400">
          Optimized market analysis for {sortedAndFilteredEntries.length} cryptocurrencies ({selectedTimeframe} timeframe)
          {marketSummary && (
            <span className="ml-2 text-xs">
              • {marketSummary.bullishSignals} LONG • {marketSummary.bearishSignals} SHORT • Avg confidence: {marketSummary.averageConfidence}%
            </span>
          )}
        </CardDescription>
        
        <Tabs defaultValue="4h" className="mt-4" onValueChange={(value) => setSelectedTimeframe(value as TimeFrame)}>
          <TabsList className="w-full bg-gray-800 grid grid-cols-5 md:grid-cols-10">
            {ALL_TIMEFRAMES.map(timeframe => (
              <TabsTrigger
                key={timeframe}
                value={timeframe}
                className={selectedTimeframe === timeframe ? 'bg-gray-700 text-white' : 'text-gray-400'}
              >
                {timeframe}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        {/* Heat Map Visualization */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* LONG Signals */}
            <div className="space-y-2">
              <h3 className="text-green-400 font-semibold border-b border-green-900 pb-1">LONG Signals</h3>
              
              {/* High confidence LONG */}
              <div className="bg-green-900/20 p-2 rounded-md">
                <div className="text-sm font-medium text-green-400 mb-2">High Confidence (80-100%)</div>
                <div className="flex flex-wrap gap-2">
                  {groupedByConfidence.high_long.map(entry => (
                    <Badge 
                      key={entry.symbol} 
                      className={`${getColorForConfidence(entry.displayDirection, entry.displayConfidence)} text-white hover:bg-opacity-90 cursor-pointer transition-all duration-200`}
                      title={`${entry.displayConfidence}% confidence - Click to analyze ${entry.name}`}
                      onClick={() => handlePairSelection(entry)}
                    >
                      {entry.name.split(' ')[0]} {entry.displayConfidence}%
                    </Badge>
                  ))}
                  {groupedByConfidence.high_long.length === 0 && (
                    <span className="text-xs text-gray-500">No high confidence signals</span>
                  )}
                </div>
              </div>
              
              {/* Medium confidence LONG */}
              <div className="bg-green-900/10 p-2 rounded-md">
                <div className="text-sm font-medium text-green-300 mb-2">Medium Confidence (65-79%)</div>
                <div className="flex flex-wrap gap-2">
                  {groupedByConfidence.medium_long.map(entry => (
                    <Badge 
                      key={entry.symbol} 
                      className={`${getColorForConfidence(entry.displayDirection, entry.displayConfidence)} text-white hover:bg-opacity-90 cursor-pointer transition-all duration-200`}
                      title={`${entry.displayConfidence}% confidence - Click to analyze ${entry.name}`}
                      onClick={() => handlePairSelection(entry)}
                    >
                      {entry.name.split(' ')[0]} {entry.displayConfidence}%
                    </Badge>
                  ))}
                  {groupedByConfidence.medium_long.length === 0 && (
                    <span className="text-xs text-gray-500">No medium confidence signals</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* NEUTRAL Signals */}
            <div className="space-y-2">
              <h3 className="text-gray-400 font-semibold border-b border-gray-700 pb-1">NEUTRAL Signals</h3>
              <div className="bg-gray-800/30 p-2 rounded-md h-[90%]">
                <div className="text-sm font-medium text-gray-400 mb-2">Neutral Confidence</div>
                <div className="flex flex-wrap gap-2">
                  {groupedByConfidence.neutral.map(entry => (
                    <Badge 
                      key={entry.symbol} 
                      className="bg-gray-600 text-white hover:bg-gray-500 cursor-pointer transition-all duration-200"
                      title={`${entry.displayConfidence}% confidence (Neutral) - Click to analyze ${entry.name}`}
                      onClick={() => handlePairSelection(entry)}
                    >
                      {entry.name.split(' ')[0]} {entry.displayConfidence}%
                    </Badge>
                  ))}
                  {groupedByConfidence.neutral.length === 0 && (
                    <span className="text-xs text-gray-500">No neutral signals</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* SHORT Signals */}
            <div className="space-y-2">
              <h3 className="text-red-400 font-semibold border-b border-red-900 pb-1">SHORT Signals</h3>
              
              {/* High confidence SHORT */}
              <div className="bg-red-900/20 p-2 rounded-md">
                <div className="text-sm font-medium text-red-400 mb-2">High Confidence (80-100%)</div>
                <div className="flex flex-wrap gap-2">
                  {groupedByConfidence.high_short.map(entry => (
                    <Badge 
                      key={entry.symbol} 
                      className={`${getColorForConfidence(entry.displayDirection, entry.displayConfidence)} text-white hover:bg-opacity-90 cursor-pointer transition-all duration-200`}
                      title={`${entry.displayConfidence}% confidence - Click to analyze ${entry.name}`}
                      onClick={() => handlePairSelection(entry)}
                    >
                      {entry.name.split(' ')[0]} {entry.displayConfidence}%
                    </Badge>
                  ))}
                  {groupedByConfidence.high_short.length === 0 && (
                    <span className="text-xs text-gray-500">No high confidence signals</span>
                  )}
                </div>
              </div>
              
              {/* Medium confidence SHORT */}
              <div className="bg-red-900/10 p-2 rounded-md">
                <div className="text-sm font-medium text-red-300 mb-2">Medium Confidence (65-79%)</div>
                <div className="flex flex-wrap gap-2">
                  {groupedByConfidence.medium_short.map(entry => (
                    <Badge 
                      key={entry.symbol} 
                      className={`${getColorForConfidence(entry.displayDirection, entry.displayConfidence)} text-white hover:bg-opacity-90 cursor-pointer transition-all duration-200`}
                      title={`${entry.displayConfidence}% confidence - Click to analyze ${entry.name}`}
                      onClick={() => handlePairSelection(entry)}
                    >
                      {entry.name.split(' ')[0]} {entry.displayConfidence}%
                    </Badge>
                  ))}
                  {groupedByConfidence.medium_short.length === 0 && (
                    <span className="text-xs text-gray-500">No medium confidence signals</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}