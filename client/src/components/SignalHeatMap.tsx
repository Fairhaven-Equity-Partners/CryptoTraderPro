import React, { useState, useEffect, useMemo } from 'react';
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

export default function SignalHeatMap() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [sortBy, setSortBy] = useState<'confidence' | 'marketCap' | 'change24h'>('confidence');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterMinMarketCap, setFilterMinMarketCap] = useState<number>(100000000); // $100M
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'LONG' | 'SHORT' | 'NEUTRAL'>('ALL');
  
  // Fetch all crypto assets
  const { data: cryptoAssets, isLoading } = useQuery({
    queryKey: ['/api/crypto'],
    staleTime: 30000 // 30 seconds
  });

  // Generate mock signals for demonstration
  const cryptoSignals = useMemo(() => {
    if (!cryptoAssets) return [];
    
    return cryptoAssets
      .filter((asset: CryptoAsset) => asset.marketCap >= filterMinMarketCap)
      .map((asset: CryptoAsset) => {
        // For demonstration, generate signals based on asset properties
        const price = asset.lastPrice;
        const change24h = asset.change24h || 0;
        
        // Use the 24h change to influence the direction for demo purposes
        // In a real implementation, this would come from signal analysis
        let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
        let confidence: number;
        
        // Different timeframes can have different signals
        const timeframeIndex = ALL_TIMEFRAMES.indexOf(selectedTimeframe);
        const isLongerTimeframe = timeframeIndex <= 4; // Monthly, weekly, 3d, daily, 4h
        
        if (change24h > 1.5) {
          direction = 'LONG';
          // Longer timeframes have more stable and higher confidence
          confidence = isLongerTimeframe ? 
            75 + Math.min(20, Math.floor(change24h * 3)) : 
            60 + Math.min(25, Math.floor(change24h * 2));
        } else if (change24h < -1.5) {
          direction = 'SHORT';
          confidence = isLongerTimeframe ? 
            75 + Math.min(20, Math.floor(Math.abs(change24h) * 3)) : 
            60 + Math.min(25, Math.floor(Math.abs(change24h) * 2));
        } else {
          direction = 'NEUTRAL';
          confidence = 50;
        }
        
        // Add randomness for better distribution
        confidence = Math.min(98, Math.max(55, confidence + (Math.random() * 10 - 5)));
        // Ensure NEUTRAL signals have 50% confidence
        if (direction === 'NEUTRAL') confidence = 50;
        
        return {
          symbol: asset.symbol,
          name: asset.name,
          marketCap: asset.marketCap,
          direction,
          confidence: Math.round(confidence),
          price,
          change24h
        };
      });
  }, [cryptoAssets, filterMinMarketCap, selectedTimeframe]);

  // Apply sorting and filtering
  const sortedAndFilteredSignals = useMemo(() => {
    if (!cryptoSignals) return [];
    
    // Apply direction filtering
    let filtered = cryptoSignals;
    if (filterDirection !== 'ALL') {
      filtered = cryptoSignals.filter(signal => signal.direction === filterDirection);
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'confidence') {
        comparison = b.confidence - a.confidence;
      } else if (sortBy === 'marketCap') {
        comparison = b.marketCap - a.marketCap;
      } else if (sortBy === 'change24h') {
        comparison = b.change24h - a.change24h;
      }
      
      return sortDirection === 'asc' ? -comparison : comparison;
    });
  }, [cryptoSignals, sortBy, sortDirection, filterDirection]);

  const toggleSort = (field: 'confidence' | 'marketCap' | 'change24h') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

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
          Showing {sortedAndFilteredSignals.length} cryptocurrencies with market cap ≥ $100M
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
                      className={`${getColorForConfidence(signal.direction, signal.confidence)} text-white hover:bg-opacity-90`}
                      title={`${signal.confidence}% confidence`}
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
                      className={`${getColorForConfidence(signal.direction, signal.confidence)} text-white hover:bg-opacity-90`}
                      title={`${signal.confidence}% confidence`}
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
                      className="bg-gray-600 text-white hover:bg-gray-500"
                      title="50% confidence (Neutral)"
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
                      className={`${getColorForConfidence(signal.direction, signal.confidence)} text-white hover:bg-opacity-90`}
                      title={`${signal.confidence}% confidence`}
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
                      className={`${getColorForConfidence(signal.direction, signal.confidence)} text-white hover:bg-opacity-90`}
                      title={`${signal.confidence}% confidence`}
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
        
        {/* Detailed Table */}
        <div className="mt-8 overflow-x-auto">
          <div className="text-sm font-semibold mb-3 border-b border-gray-700 pb-1">
            Detailed Signals
          </div>
          <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-800 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <th className="px-4 py-2">Asset</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSort('change24h')}>
                    24h Change
                    {sortBy === 'change24h' && (
                      sortDirection === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-2">
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSort('marketCap')}>
                    Market Cap
                    {sortBy === 'marketCap' && (
                      sortDirection === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-2">
                  <div className="flex items-center cursor-pointer" onClick={() => toggleSort('confidence')}>
                    Signal
                    {sortBy === 'confidence' && (
                      sortDirection === 'desc' ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {sortedAndFilteredSignals.map((signal) => (
                <tr key={signal.symbol} className="hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-2">
                        <div className="font-medium text-white">{signal.name}</div>
                        <div className="text-xs text-gray-400">{signal.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-white">${signal.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className={`text-sm ${signal.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {signal.change24h >= 0 ? '+' : ''}{signal.change24h.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-white">
                      ${(signal.marketCap / 1000000000).toFixed(1)}B
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`
                        px-2 py-1 rounded-md text-xs font-medium
                        ${signal.direction === 'LONG' ? 'bg-green-800/50 text-green-300' : 
                          signal.direction === 'SHORT' ? 'bg-red-800/50 text-red-300' : 
                          'bg-gray-700 text-gray-300'}
                      `}>
                        {getSignalText(signal.direction, signal.confidence)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}