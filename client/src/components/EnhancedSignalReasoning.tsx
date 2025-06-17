
/**
 * Enhanced Signal Reasoning UI Component
 * Interactive tooltips and detailed signal explanations
 */

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface SignalReasoningProps {
  signal: {
    direction: string;
    confidence: number;
    reasoning: string[];
    confidenceBreakdown: {
      technical_indicators: number;
      pattern_recognition: number;
      market_regime: number;
      confluence_score: number;
    };
    indicators: Record<string, number>;
    marketRegime: string;
  };
}

export function EnhancedSignalReasoning({ signal }: SignalReasoningProps) {
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'LONG': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'SHORT': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-blue-600 bg-blue-50';
    if (confidence >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getDirectionIcon(signal.direction)}
            Signal Analysis
            <Badge className={`${getConfidenceColor(signal.confidence)} font-semibold`}>
              {signal.confidence.toFixed(1)}% Confidence
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Reasoning Array with Interactive Tooltips */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">AI Reasoning Analysis:</h4>
            {signal.reasoning.map((reason, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-help transition-colors">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    {this.getDetailedExplanation(reason)}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Confidence Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Confidence Breakdown:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(signal.confidenceBreakdown).map(([component, value]) => (
                <Tooltip key={component}>
                  <TooltipTrigger asChild>
                    <div className="flex justify-between items-center p-2 rounded bg-white border">
                      <span className="text-xs font-medium capitalize">
                        {component.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-semibold ${getConfidenceColor(value)}`}>
                        {value.toFixed(1)}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {this.getComponentExplanation(component, value)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Market Regime Context */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              Market Regime: {signal.marketRegime}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-blue-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">
                  {this.getMarketRegimeExplanation(signal.marketRegime)}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );

  getDetailedExplanation(reason: string): string {
    if (reason.includes('RSI')) {
      return 'Relative Strength Index indicates momentum and potential reversal points. Values below 30 suggest oversold conditions, above 70 suggest overbought conditions.';
    }
    if (reason.includes('MACD')) {
      return 'Moving Average Convergence Divergence shows the relationship between two moving averages. Signal line crossovers indicate potential trend changes.';
    }
    if (reason.includes('Bollinger')) {
      return 'Bollinger Bands use standard deviation to show volatility. Price touching bands often indicates potential reversals or breakouts.';
    }
    return 'Advanced technical analysis factor contributing to signal generation with institutional-grade precision calculations.';
  }

  getComponentExplanation(component: string, value: number): string {
    const explanations = {
      'technical_indicators': 'Combined strength of RSI, MACD, Bollinger Bands, and other technical indicators',
      'pattern_recognition': 'Candlestick and chart pattern analysis including engulfing patterns, triangles, and support/resistance',
      'market_regime': 'Current market condition analysis: BULL, BEAR, or SIDEWAYS trending environment',
      'confluence_score': 'Overall agreement between all analysis components for signal reliability'
    };
    return explanations[component] || 'Signal analysis component';
  }

  getMarketRegimeExplanation(regime: string): string {
    const explanations = {
      'BULL': 'Bullish market conditions detected. Indicators favor long positions with trend-following strategies.',
      'BEAR': 'Bearish market conditions detected. Indicators favor short positions with defensive strategies.',
      'SIDEWAYS': 'Neutral market conditions detected. Range-bound trading with support/resistance strategies favored.'
    };
    return explanations[regime] || 'Market condition analysis for optimal strategy selection.';
  }
}