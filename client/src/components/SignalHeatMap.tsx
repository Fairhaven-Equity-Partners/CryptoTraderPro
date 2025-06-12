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

function getSignalText(direction: string, confidence: number): string {selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch heatmap data');
      const data = await response.json();
      return data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds to keep data fresh
    staleTime: 5000,
    refetchOnMount: true,
    refetchOnWindowFocu});

  // Extract data and summary from the new response structure
  const marketEntries: OptimizedMarketEntry[] = heatmapResponse?.marketEntries || [];
  const marketSummary: MarketSummary | undefined = heatmapResponse?.summary;
  
  // Force refetch when timeframe changes
  React.useEffect(() => {
    refetch();
  }, [selectedTimeframe, refetch]);

  // Process optimized market entries from the new backend structure
  const processedMarketEntries = useMemo(() => {
    if (!marketEntries || !Array.isArray(marketEntries)) {
      return [];
    }
    
    const processed = marketEntries
      .filter((entry: OptimizedMarketEntry) => {selectedTimeframe})
      .map((entry: OptimizedMarketEntry) => {selectedTimeframe};
        
        return processedEntry;
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
    

    
    return groups;
  }, [sortedAndFilteredEntries, filterDirection, selectedTimeframe]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[300px]">Loading market data...</div>;
  }

  if (!marketEntries || marketEntries.length === 0) {selectedTimeframe} timeframe</div>
        </CardContent>
      </Card>
    );
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
              ALL ({sortedAndFilteredEntries.length})
            </Button>
            <Button 
              size="sm" 
              variant={filterDirection === 'LONG' ? 'default' : 'outline'} 
              className="h-7 px-2 py-1 text-green-400"
              onClick={() => setFilterDirection('LONG')}
            >
              LONG ({processedMarketEntries.filter(e => e.displayDirection === 'LONG').length})
            </Button>
            <Button 
              size="sm" 
              variant={filterDirection === 'SHORT' ? 'default' : 'outline'} 
              className="h-7 px-2 py-1 text-red-400"
              onClick={() => setFilterDirection('SHORT')}
            >
              SHORT ({processedMarketEntries.filter(e => e.displayDirection === 'SHORT').length})
            </Button>
          </div>
        </div>
        <CardDescription className="text-gray-400">
          Market analysis for {processedMarketEntries.length} cryptocurrencies ({selectedTimeframe} timeframe)
          <div className="mt-1 text-xs">
            LONG: {processedMarketEntries.filter(e => e.displayDirection === 'LONG').length} • 
            SHORT: {processedMarketEntries.filter(e => e.displayDirection === 'SHORT').length} • 
            NEUTRAL: {processedMarketEntries.filter(e => e.displayDirection === 'NEUTRAL').length} • 
            High Confidence (80%+): {processedMarketEntries.filter(e => e.displayConfidence >= 80).length}
          </div>
        </CardDescription>
        
        <Tabs defaultValue="4h" className="mt-4" onValueChange={(value) => setSelectedTimeframe(value as TimeFrame)}>
          <TabsList className="w-full bg-gray-800 grid grid-cols-5 md:grid-cols-10">
            {ALL_TIMEFRAMES.map(timeframe => (
              <TabsTrigger
                key={timeframe}
                value={timeframe}
                className={selectedTimeframe}
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
                      className={`${getColorForConfidence(entry.displayDirection, entry.displayConfidence)} text-white hover:bg-opacity-90 cursor-pointer transition-all duration-20`0`}
                      title={`${entry.displayConfidence}% confidence - Click to analyze ${entry.name`}`}
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
                      className={`${getColorForConfidence(entry.displayDirection, entry.displayConfidence)} text-white hover:bg-opacity-90 cursor-pointer transition-all duration-20`0`}
                      title={`${entry.displayConfidence}% confidence - Click to analyze ${entry.name`}`}
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
                      title={`${entry.displayConfidence}% confidence (Neutral) - Click to analyze ${entry.name`}`}
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
                      className={`${getColorForConfidence(entry.displayDirection, entry.displayConfidence)} text-white hover:bg-opacity-90 cursor-pointer transition-all duration-20`0`}
                      title={`${entry.displayConfidence}% confidence - Click to analyze ${entry.name`}`}
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
                      className={`${getColorForConfidence(entry.displayDirection, entry.displayConfidence)} text-white hover:bg-opacity-90 cursor-pointer transition-all duration-20`0`}
                      title={`${entry.displayConfidence}% confidence - Click to analyze ${entry.name`}`}
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

        {/* Debug Information - Show total count verification */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
            <div className="text-xs text-gray-400 space-y-1">
              <div>Debug Info - Total Pairs Verification:</div>
              <div>• Backend entries: {marketEntries.length}</div>
              <div>• Processed entries: {processedMarketEntries.length}</div>
              <div>• High confidence LONG: {groupedByConfidence.high_long.length}</div>
              <div>• Medium confidence LONG: {groupedByConfidence.medium_long.length}</div>
              <div>• Low confidence LONG: {groupedByConfidence.low_long.length}</div>
              <div>• NEUTRAL: {groupedByConfidence.neutral.length}</div>
              <div>• Low confidence SHORT: {groupedByConfidence.low_short.length}</div>
              <div>• Medium confidence SHORT: {groupedByConfidence.medium_short.length}</div>
              <div>• High confidence SHORT: {groupedByConfidence.high_short.length}</div>
              <div className="pt-1 border-t border-gray-600">
                <strong>Total displayed: {Object.values(groupedByConfidence).reduce((sum, group) => sum + group.length, 0)} / 50</strong>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}