import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface MarketEntry {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  confidence: number;
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  volume: number;
}

interface SimpleMarketListProps {
  timeframe?: string;
  onRefresh?: () => void;
}

export default function SimpleMarketList({ timeframe = '4h', onRefresh }: SimpleMarketListProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/simple-market-data', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/simple-market-data?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  useEffect(() => {
    if (data) {
      setLastUpdate(new Date());
    }
  }, [data]);

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-slate-400">Loading market data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">Failed to load market data</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const marketEntries = data?.data || [];
  const metadata = data?.metadata || {};

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'LONG': return 'text-green-400 bg-green-400/10';
      case 'SHORT': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Timeframe Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/40">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-base font-medium text-white">Market Analysis Dashboard</span>
        </div>
        <div className="px-4 py-2 bg-purple-600/40 border border-purple-400/60 rounded-lg shadow-lg">
          <span className="text-lg font-black text-purple-200">{timeframe.toUpperCase()}</span>
          <span className="text-sm text-purple-300 ml-1">SIGNALS</span>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{metadata.totalPairs || 0}</div>
          <div className="text-xs text-slate-400">Trading Pairs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {marketEntries.filter((e: MarketEntry) => e.signal === 'LONG').length}
          </div>
          <div className="text-xs text-slate-400">Long Signals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">
            {marketEntries.filter((e: MarketEntry) => e.signal === 'SHORT').length}
          </div>
          <div className="text-xs text-slate-400">Short Signals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-300">
            {marketEntries.length > 0 
              ? (marketEntries.reduce((sum: number, e: MarketEntry) => sum + e.confidence, 0) / marketEntries.length).toFixed(1)
              : '0'
            }%
          </div>
          <div className="text-xs text-slate-400">Avg Confidence</div>
        </div>
      </div>

      {/* Market Entries List */}
      <div className="grid gap-3">
        {marketEntries.map((entry: MarketEntry) => (
          <div
            key={entry.symbol}
            className="bg-gradient-to-r from-slate-800/60 to-slate-700/40 border border-slate-600 rounded-lg p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              {/* Symbol Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                  {entry.symbol.substring(0, 3)}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{entry.symbol}</h3>
                  <div className="text-xs text-slate-400">{entry.name}</div>
                </div>
              </div>

              {/* Price Info */}
              <div className="text-right">
                <div className="text-xl font-bold text-white">{formatPrice(entry.price)}</div>
                <div className={`text-sm px-2 py-1 rounded ${
                  entry.change24h > 0 ? 'text-green-400 bg-green-400/10' :
                  entry.change24h < 0 ? 'text-red-400 bg-red-400/10' :
                  'text-slate-400 bg-slate-400/10'
                }`}>
                  {formatChange(entry.change24h)}
                </div>
              </div>
            </div>

            {/* Signal Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Signal</div>
                <div className={`text-sm font-semibold px-2 py-1 rounded ${getSignalColor(entry.signal)}`}>
                  {entry.signal}
                </div>
              </div>
              
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Confidence</div>
                <div className={`text-sm font-semibold ${getConfidenceColor(entry.confidence)}`}>
                  {entry.confidence}%
                </div>
              </div>
              
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Volume</div>
                <div className="text-sm font-semibold text-slate-300">
                  {entry.volume > 0 ? `${(entry.volume / 1000000).toFixed(1)}M` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer with Last Update */}
      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700">
        <div className="text-xs text-slate-400">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}