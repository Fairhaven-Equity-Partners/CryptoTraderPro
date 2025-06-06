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

interface CryptoSignal {
  symbol: string;
  name: string;
  marketCap: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  price: number;
  change24h: number;
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

  // Fetch market heatmap data synchronized with calculation engine
  const { data: cryptoAssets, isLoading, refetch } = useQuery({
    queryKey: ['/api/market-heatmap', selectedTimeframe],
    queryFn: async () => {
      console.log(`[HeatMap] Fetching synchronized heatmap data for ${selectedTimeframe}`);
      const response = await fetch(`/api/market-heatmap?timeframe=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch heatmap data');
      return response.json();
    },
    refetchInterval: false, // Disable automatic refetch - use event-driven updates
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  // Force refetch when timeframe changes
  React.useEffect(() => {
    refetch();
  }, [selectedTimeframe, refetch]);

  // Process authentic market signals from calculation system
  const cryptoSignals = useMemo(() => {
    if (!cryptoAssets || !Array.isArray(cryptoAssets)) return [];
    
    // Use authentic calculated signals from the market analysis system
    return cryptoAssets
      .filter((asset: any) => asset.currentPrice > 0) // Only include assets with valid prices
      .map((asset: any) => {
        const price = asset.currentPrice;
        const change24h = asset.change24h || 0;
        
        // Extract authentic signal data from the calculation system
        const signalData = asset.signals?.[selectedTimeframe] || { direction: 'NEUTRAL', confidence: 50 };
        const direction = signalData.direction as 'LONG' | 'SHORT' | 'NEUTRAL';
        const confidence = Math.round(signalData.confidence || 50);
        
        return {
          symbol: asset.symbol,
          name: asset.name,
          marketCap: asset.marketCap || 0,
          direction,
          confidence,
          price,
          change24h
        };
      })
      .filter((signal, index, self) => 
        index === self.findIndex(s => s.symbol === signal.symbol)
      ); // Remove duplicates by symbol
  }, [cryptoAssets, selectedTimeframe]);

  // Apply direction filtering and sort by confidence (highest to lowest)
  const sortedAndFilteredSignals = useMemo(() => {
    if (!cryptoSignals) return [];
    
    let filtered = cryptoSignals;
    
    // Apply direction filtering
    if (filterDirection !== 'ALL') {
      filtered = cryptoSignals.filter((signal: any) => signal.direction === filterDirection);
    }
    
    // Sort by confidence percentage (highest to lowest)
    return filtered.sort((a: any, b: any) => {
      if (a.direction === 'NEUTRAL' && b.direction !== 'NEUTRAL') return 1;
      if (b.direction === 'NEUTRAL' && a.direction !== 'NEUTRAL') return -1;
      return b.confidence - a.confidence;
    });
  }, [cryptoSignals, filterDirection]);

  // Group signals by confidence ranges for the heat map
  const groupedByConfidence = useMemo(() => {
    const groups = {
      high_long: sortedAndFilteredSignals.filter(s => s.direction === 'LONG' && s.confidence >= 80),
      medium_long: sortedAndFilteredSignals.filter(s => s.direction === 'LONG' && s.confidence >= 65 && s.confidence < 80),
      low_long: sortedAndFilteredSignals.filter(s => s.direction === 'LONG' && s.confidence < 65),
      neutral: sortedAndFilteredSignals.filter(s => s.direction === 'NEUTRAL'),
      low_short: sortedAndFilteredSignals.filter(s => s.direction === 'SHORT' && s.confidence < 65),
      medium_short: sortedAndFilteredSignals.filter(s => s.direction === 'SHORT' && s.confidence >= 65 && s.confidence < 80),
      high_short: sortedAndFilteredSignals.filter(s => s.direction === 'SHORT' && s.confidence >= 80),
    };
    
    return groups;
  }, [sortedAndFilteredSignals]);

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
          Authentic CoinGecko data for {sortedAndFilteredSignals.length} of 50 major cryptocurrencies
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
                  {groupedByConfidence.high_long.map(signal => (
                    <Badge 
                      key={signal.symbol} 
                      className={`${getColorForConfidence(signal.direction, signal.confidence)} text-white hover:bg-opacity-90 cursor-pointer`}
                      title={`${signal.confidence}% confidence - Click to select ${signal.name}`}
                      onClick={() => onSelectAsset && onSelectAsset(signal.symbol)}
                    >
                      {signal.name.split(' ')[0]} {signal.confidence}%
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
                  {groupedByConfidence.medium_long.map(signal => (
                    <Badge 
                      key={signal.symbol} 
                      className={`${getColorForConfidence(signal.direction, signal.confidence)} text-white hover:bg-opacity-90 cursor-pointer`}
                      title={`${signal.confidence}% confidence - Click to select ${signal.name}`}
                      onClick={() => onSelectAsset && onSelectAsset(signal.symbol)}
                    >
                      {signal.name.split(' ')[0]} {signal.confidence}%
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
                <div className="text-sm font-medium text-gray-400 mb-2">50% Confidence</div>
                <div className="flex flex-wrap gap-2">
                  {groupedByConfidence.neutral.map(signal => (
                    <Badge 
                      key={signal.symbol} 
                      className="bg-gray-600 text-white hover:bg-gray-500 cursor-pointer"
                      title={`50% confidence (Neutral) - Click to select ${signal.name}`}
                      onClick={() => onSelectAsset && onSelectAsset(signal.symbol)}
                    >
                      {signal.name.split(' ')[0]}
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
                  {groupedByConfidence.high_short.map(signal => (
                    <Badge 
                      key={signal.symbol} 
                      className={`${getColorForConfidence(signal.direction, signal.confidence)} text-white hover:bg-opacity-90 cursor-pointer`}
                      title={`${signal.confidence}% confidence - Click to select ${signal.name}`}
                      onClick={() => onSelectAsset && onSelectAsset(signal.symbol)}
                    >
                      {signal.name.split(' ')[0]} {signal.confidence}%
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
                  {groupedByConfidence.medium_short.map(signal => (
                    <Badge 
                      key={signal.symbol} 
                      className={`${getColorForConfidence(signal.direction, signal.confidence)} text-white hover:bg-opacity-90 cursor-pointer`}
                      title={`${signal.confidence}% confidence - Click to select ${signal.name}`}
                      onClick={() => onSelectAsset && onSelectAsset(signal.symbol)}
                    >
                      {signal.name.split(' ')[0]} {signal.confidence}%
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