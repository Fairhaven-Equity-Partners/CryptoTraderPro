/**
 * Institutional Analysis Dashboard
 * Displays advanced market structure features including:
 * - VWAP with double bands (95% coverage)
 * - Supply/Demand zones from fractal analysis
 * - Psychological levels with Fibonacci confirmation
 * - Candlestick close analysis for scalping
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Activity, BarChart3, Crosshair } from 'lucide-react';

interface InstitutionalAnalysisProps {
  signals: Map<string, any>;
  currentPrice: number;
  symbol: string;
}

export default function InstitutionalAnalysisDashboard({ 
  signals, 
  currentPrice, 
  symbol 
}: InstitutionalAnalysisProps) {
  
  // Get the most relevant signal for display (4h or 1h timeframe for institutional analysis)
  const getInstitutionalSignal = () => {
    const preferredTimeframes = ['4h', '1h', '15m', '5m'];
    for (const tf of preferredTimeframes) {
      const signal = signals.get(tf);
      if (signal?.indicators?.marketStructure) {
        return { signal, timeframe: tf };
      }
    }
    return null;
  };

  const institutionalData = getInstitutionalSignal();
  
  if (!institutionalData) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Institutional Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">Loading institutional analysis...</div>
        </CardContent>
      </Card>
    );
  }

  const { signal, timeframe } = institutionalData;
  const marketStructure = signal.indicators.marketStructure;

  const formatPrice = (price: number) => {
    return price?.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) || '$0.00';
  };

  const getVWAPPositionColor = (position: string) => {
    switch (position) {
      case 'above': return 'text-green-400 bg-green-900/20';
      case 'below': return 'text-red-400 bg-red-900/20';
      default: return 'text-yellow-400 bg-yellow-900/20';
    }
  };

  const getZoneStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-purple-400 bg-purple-900/20';
      case 'moderate': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getCandlestickDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish': return 'text-green-400 bg-green-900/20';
      case 'bearish': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* VWAP Analysis */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50">
        <CardHeader>
          <CardTitle className="text-blue-300 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            VWAP Analysis ({timeframe})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400">VWAP</div>
              <div className="text-lg font-semibold text-blue-300">
                {formatPrice(marketStructure.vwap.value)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Position</div>
              <Badge className={getVWAPPositionColor(marketStructure.vwap.position)}>
                {marketStructure.vwap.position.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Upper Band (95%)</span>
              <span className="text-green-400">{formatPrice(marketStructure.vwap.upperBand)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Current Price</span>
              <span className="text-white font-medium">{formatPrice(currentPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Lower Band (95%)</span>
              <span className="text-red-400">{formatPrice(marketStructure.vwap.lowerBand)}</span>
            </div>
          </div>

          {/* VWAP Trading Insights */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-300">
              {marketStructure.vwap.position === 'above' && 
                "Price trading above VWAP upper band - potential mean reversion or strong bullish momentum"
              }
              {marketStructure.vwap.position === 'below' && 
                "Price trading below VWAP lower band - potential mean reversion or strong bearish momentum"
              }
              {marketStructure.vwap.position === 'inside' && 
                "Price trading within VWAP bands - balanced institutional flow"
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supply & Demand Zones */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50">
        <CardHeader>
          <CardTitle className="text-purple-300 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Supply & Demand Zones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Zone Strength</span>
            <Badge className={getZoneStrengthColor(marketStructure.supplyDemandZones.strength)}>
              {marketStructure.supplyDemandZones.strength.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-red-400 mb-2 flex items-center gap-1">
                <TrendingDown className="h-4 w-4" />
                Supply Zones (Resistance)
              </div>
              {marketStructure.supplyDemandZones.supply.slice(0, 3).map((level: number, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-400">S{idx + 1}</span>
                  <span className="text-red-300">{formatPrice(level)}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="text-sm text-green-400 mb-2 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Demand Zones (Support)
              </div>
              {marketStructure.supplyDemandZones.demand.slice(0, 3).map((level: number, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-400">D{idx + 1}</span>
                  <span className="text-green-300">{formatPrice(level)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Psychological Levels */}
      <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-700/50">
        <CardHeader>
          <CardTitle className="text-amber-300 flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            Psychological Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400">Fibonacci Confluence</div>
              <Badge className={marketStructure.psychologicalLevels.fibonacciConfluence ? 
                'text-green-400 bg-green-900/20' : 'text-gray-400 bg-gray-900/20'}>
                {marketStructure.psychologicalLevels.fibonacciConfluence ? 'YES' : 'NO'}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-slate-400">Round Number Proximity</div>
              <div className="text-lg font-semibold text-amber-300">
                {(marketStructure.psychologicalLevels.roundNumberProximity * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-400 mb-2">Key Levels</div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {marketStructure.psychologicalLevels.levels
                .filter((level: number) => Math.abs(level - currentPrice) / currentPrice < 0.05)
                .slice(0, 6)
                .map((level: number, idx: number) => (
                <div key={idx} className="text-xs">
                  <span className="text-amber-300">{formatPrice(level)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Psychological Level Insights */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-300">
              {marketStructure.psychologicalLevels.fibonacciConfluence 
                ? "Strong confluence between Fibonacci and psychological levels - high probability reversal zones"
                : "Standard psychological levels active - watch for reactions at round numbers"
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candlestick Analysis */}
      <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Candlestick Analysis ({timeframe})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400">Pattern</div>
              <div className="text-sm font-medium text-green-300">
                {marketStructure.candlestickSignal.pattern.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Reliability</div>
              <div className="text-lg font-semibold text-green-300">
                {marketStructure.candlestickSignal.reliability.toFixed(0)}%
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-400">Direction Bias</div>
            <Badge className={getCandlestickDirectionColor(marketStructure.candlestickSignal.direction)}>
              {marketStructure.candlestickSignal.direction.toUpperCase()}
            </Badge>
          </div>

          {/* Scalping Insights */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs font-medium text-green-300 mb-1">Scalping Insights:</div>
            <div className="text-xs text-slate-300">
              {timeframe === '1m' || timeframe === '5m' ? (
                <>
                  {marketStructure.candlestickSignal.reliability > 75 ? 
                    "High probability scalp setup - watch for continuation" :
                    "Moderate setup - wait for additional confirmation"
                  }
                </>
              ) : (
                "Use 1m-15m timeframes for optimal scalping signals"
              )}
            </div>
          </div>

          {/* Close Analysis for Scalping */}
          {(timeframe === '1m' || timeframe === '5m' || timeframe === '15m') && (
            <div className="mt-3 p-2 bg-blue-900/20 rounded border border-blue-700/30">
              <div className="text-xs font-medium text-blue-300 mb-1">Close Analysis:</div>
              <div className="text-xs text-slate-300">
                {marketStructure.candlestickSignal.pattern.includes('strong') && 
                  "Strong close indicates committed institutional flow - follow the direction"
                }
                {marketStructure.candlestickSignal.pattern.includes('rejection') && 
                  "Rejection pattern - potential reversal at this level"
                }
                {marketStructure.candlestickSignal.pattern.includes('doji') && 
                  "Indecision - wait for next candle confirmation"
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}