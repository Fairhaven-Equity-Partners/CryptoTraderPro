import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { forexAnalysisEngine, ForexSignal } from '@/lib/forexAnalysis';

interface ForexDashboardProps {
  pair: string;
}

export default function ForexDashboard({ pair = 'EUR/USD' }: ForexDashboardProps) {
  const [signals, setSignals] = useState<ForexSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const generateAnalysis = useCallback(async () => {
    setIsLoading(true);
    try {
      const analysis = forexAnalysisEngine.generateMultiTimeframeAnalysis();
      setSignals(analysis);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error generating forex analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    generateAnalysis();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(generateAnalysis, 30000);
    return () => clearInterval(interval);
  }, [generateAnalysis]);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'LONG': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'SHORT': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'bg-green-100 text-green-800 border-green-200';
      case 'SHORT': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 font-bold';
    if (confidence >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600';
  };

  const formatPrice = (price: number) => price.toFixed(5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{pair} Analysis</h2>
          <p className="text-sm text-gray-600">
            Focus: VWAP, Fibonacci, Market Structure, Price Action
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={generateAnalysis}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Multi-Timeframe Signals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {signals.map((signal, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{signal.timeframe}</CardTitle>
                <div className="flex items-center gap-2">
                  {getDirectionIcon(signal.direction)}
                  <Badge className={`${getDirectionColor(signal.direction)} border`}>
                    {signal.direction}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Price Levels */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Entry</p>
                  <p className="font-semibold">{formatPrice(signal.entryPrice)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Stop Loss</p>
                  <p className="font-semibold text-red-600">{formatPrice(signal.stopLoss)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Take Profit</p>
                  <p className="font-semibold text-green-600">{formatPrice(signal.takeProfit)}</p>
                </div>
              </div>

              {/* Confidence */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Confidence</span>
                <span className={`text-sm ${getConfidenceColor(signal.confidence)}`}>
                  {signal.confidence}%
                </span>
              </div>

              {/* VWAP Analysis */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">VWAP Analysis</h4>
                <div className="space-y-1 text-xs">
                  <p>Position: <span className="font-semibold">{signal.vwapAnalysis.position}</span></p>
                  <p>Divergence: <span className="font-semibold">{signal.vwapAnalysis.divergence ? 'Yes' : 'No'}</span></p>
                  <p>Strength: <span className="font-semibold">{signal.vwapAnalysis.strength.toFixed(2)}%</span></p>
                </div>
              </div>

              {/* Market Structure */}
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-800 mb-2">Market Structure</h4>
                <div className="space-y-1 text-xs">
                  <p>Trend: <span className="font-semibold capitalize">{signal.marketStructure.trend}</span></p>
                  <p>Higher Highs: <span className="font-semibold">{signal.marketStructure.higherHighs ? 'Yes' : 'No'}</span></p>
                  <p>Higher Lows: <span className="font-semibold">{signal.marketStructure.higherLows ? 'Yes' : 'No'}</span></p>
                </div>
              </div>

              {/* Price Action */}
              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">Price Action</h4>
                <div className="space-y-1 text-xs">
                  <p>Pattern: <span className="font-semibold">{signal.priceAction.pattern}</span></p>
                  <p>Strength: <span className="font-semibold">{signal.priceAction.strength}%</span></p>
                  <p className="text-xs text-gray-600">{signal.priceAction.description}</p>
                </div>
              </div>

              {/* Fibonacci Levels */}
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-green-800 mb-2">Key Fibonacci Levels</h4>
                <div className="space-y-1 text-xs">
                  {signal.fibonacciLevels.slice(0, 3).map((fib, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{(fib.level * 100).toFixed(1)}%</span>
                      <span className="font-semibold">{formatPrice(fib.price)}</span>
                      <span className={`px-1 rounded text-xs ${
                        fib.type === 'support' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {fib.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Analysis Summary</h4>
                <p className="text-xs text-gray-700">{signal.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Management Panel */}
      {signals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Management Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Position Sizing</h4>
                <ul className="space-y-1 text-xs text-blue-700">
                  <li>• Risk 1-2% per trade</li>
                  <li>• Use proper lot sizing</li>
                  <li>• Consider leverage carefully</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Entry Rules</h4>
                <ul className="space-y-1 text-xs text-green-700">
                  <li>• Wait for VWAP confirmation</li>
                  <li>• Check Fibonacci confluence</li>
                  <li>• Confirm market structure</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">Stop Loss</h4>
                <ul className="space-y-1 text-xs text-orange-700">
                  <li>• Always use stop losses</li>
                  <li>• Based on market structure</li>
                  <li>• Never move against you</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Take Profit</h4>
                <ul className="space-y-1 text-xs text-purple-700">
                  <li>• Scale out at key levels</li>
                  <li>• Use Fibonacci targets</li>
                  <li>• Trail stops in profit</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}