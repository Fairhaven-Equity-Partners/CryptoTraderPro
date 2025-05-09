import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown,
  ChevronUp,
  BarChart4,
  Percent,
  LineChart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  DollarSign
} from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import { 
  AdvancedSignal,
  TradeRecommendation,
  calculateTimeframeConfidence, 
  generateTradeRecommendation 
} from '../lib/advancedSignals';
import { useChartData } from '../hooks/useMarketData';
import { ChartData, TimeFrame } from '../types';
import { formatCurrency, formatPercentage } from '../lib/calculations';

interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

export default function AdvancedSignalDashboard({ 
  symbol, 
  onTimeframeSelect 
}: AdvancedSignalDashboardProps) {
  const isMobile = useIsMobile();
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({
    '1m': null,
    '5m': null,
    '15m': null,
    '30m': null,
    '1h': null,
    '4h': null,
    '1d': null,
    '1w': null,
    '1M': null
  });
  const [recommendation, setRecommendation] = useState<TradeRecommendation | null>(null);
  const [calculateProgress, setCalculateProgress] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  
  // Get chart data for all timeframes
  const chartData1m = useChartData(symbol, '1m');
  const chartData5m = useChartData(symbol, '5m');
  const chartData15m = useChartData(symbol, '15m');
  const chartData30m = useChartData(symbol, '30m');
  const chartData1h = useChartData(symbol, '1h');
  const chartData4h = useChartData(symbol, '4h');
  const chartData1d = useChartData(symbol, '1d');
  const chartData1w = useChartData(symbol, '1w');
  const chartData1M = useChartData(symbol, '1M');
  
  const chartDataMap: Record<TimeFrame, { data: ChartData[], isLoading: boolean }> = {
    '1m': { data: chartData1m.chartData, isLoading: chartData1m.isLoading },
    '5m': { data: chartData5m.chartData, isLoading: chartData5m.isLoading },
    '15m': { data: chartData15m.chartData, isLoading: chartData15m.isLoading },
    '30m': { data: chartData30m.chartData, isLoading: chartData30m.isLoading },
    '1h': { data: chartData1h.chartData, isLoading: chartData1h.isLoading },
    '4h': { data: chartData4h.chartData, isLoading: chartData4h.isLoading },
    '1d': { data: chartData1d.chartData, isLoading: chartData1d.isLoading },
    '1w': { data: chartData1w.chartData, isLoading: chartData1w.isLoading },
    '1M': { data: chartData1M.chartData, isLoading: chartData1M.isLoading }
  };
  
  // Check if all data is loaded
  const isAllDataLoaded = !Object.values(chartDataMap).some(chart => chart.isLoading);
  
  // Calculate signals for a specific timeframe
  const calculateSignalForTimeframe = (timeframe: TimeFrame) => {
    if (chartDataMap[timeframe]?.data?.length) {
      try {
        const signal = calculateTimeframeConfidence(chartDataMap[timeframe].data, timeframe);
        return signal;
      } catch (err) {
        console.error(`Error calculating signal for ${timeframe}:`, err);
        return null;
      }
    }
    return null;
  };
  
  // Calculate signals for all timeframes
  const calculateAllSignals = async () => {
    if (!isAllDataLoaded) return;
    setIsCalculating(true);
    
    const newSignals: Record<TimeFrame, AdvancedSignal | null> = { ...signals };
    
    // Calculate signals one by one to not block the UI
    for (let i = 0; i < timeframes.length; i++) {
      const tf = timeframes[i];
      setCalculateProgress(Math.round((i / timeframes.length) * 100));
      
      // Use setTimeout to give UI time to update
      await new Promise(resolve => {
        setTimeout(() => {
          newSignals[tf] = calculateSignalForTimeframe(tf);
          setSignals({ ...newSignals });
          resolve(null);
        }, 100);
      });
    }
    
    // Generate overall recommendation
    const validSignals = Object.values(newSignals).filter(Boolean) as AdvancedSignal[];
    if (validSignals.length >= 3) {
      const rec = generateTradeRecommendation(symbol, validSignals);
      setRecommendation(rec);
    }
    
    setCalculateProgress(100);
    setIsCalculating(false);
  };
  
  // Auto-calculate when data is loaded
  useEffect(() => {
    if (isAllDataLoaded && !isCalculating && calculateProgress === 0) {
      calculateAllSignals();
    }
  }, [isAllDataLoaded]);
  
  // Handle timeframe selection
  const handleTimeframeSelect = (timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  };
  
  // Get signal for selected timeframe
  const selectedSignal = signals[selectedTimeframe];
  
  // Helper function to render score badge
  const renderScoreBadge = (score: number) => {
    let color = '';
    if (score < 40) color = 'destructive';
    else if (score < 60) color = 'secondary';
    else if (score < 80) color = 'warning';
    else color = 'success';
    
    return (
      <Badge variant={color === 'success' ? 'outline' : color as any} className={`ml-2 text-lg ${color === 'success' ? 'border-green-500 text-green-500' : ''}`}>
        {score}/100
      </Badge>
    );
  };
  
  // Helper function to render direction badge
  const renderDirectionBadge = (direction: 'LONG' | 'SHORT' | 'NEUTRAL') => {
    if (direction === 'LONG') {
      return (
        <Badge variant="outline" className="ml-2 border-green-500 text-green-500">
          <TrendingUp className="mr-1 h-4 w-4" />
          LONG
        </Badge>
      );
    } else if (direction === 'SHORT') {
      return (
        <Badge variant="destructive" className="ml-2">
          <TrendingDown className="mr-1 h-4 w-4" />
          SHORT
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="ml-2">
          <Minus className="mr-1 h-4 w-4" />
          NEUTRAL
        </Badge>
      );
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Main recommendation card */}
      {recommendation && (
        <Card className={`border-2 ${
          recommendation.direction === 'LONG' ? 'border-green-500' :
          recommendation.direction === 'SHORT' ? 'border-red-500' :
          'border-gray-500'
        } shadow-lg`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                {symbol} Trading Signal 
                {renderDirectionBadge(recommendation.direction)}
              </div>
              <div className="flex items-center">
                <span className="mr-2">Confidence:</span>
                {renderScoreBadge(recommendation.confidence)}
              </div>
            </CardTitle>
            <CardDescription className="text-base">
              {recommendation.summary}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center">
                  <Target className="mr-2 h-4 w-4" />
                  Entry Strategy
                </h3>
                <div className="flex flex-col space-y-1 bg-secondary/20 p-2 rounded-md">
                  <div className="flex justify-between">
                    <span>Ideal Entry:</span>
                    <span className="font-semibold">{formatCurrency(recommendation.entry.ideal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Range:</span>
                    <span>{formatCurrency(recommendation.entry.range[0])} - {formatCurrency(recommendation.entry.range[1])}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Exit Strategy
                </h3>
                <div className="flex flex-col space-y-1 bg-secondary/20 p-2 rounded-md">
                  <div className="flex justify-between">
                    <span>Stop Loss:</span>
                    <span className="font-semibold text-destructive">{formatCurrency(recommendation.exit.stopLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take Profit 1:</span>
                    <span className="font-semibold text-success">{formatCurrency(recommendation.exit.takeProfit[0])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take Profit 2:</span>
                    <span className="font-semibold text-success">{formatCurrency(recommendation.exit.takeProfit[1])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take Profit 3:</span>
                    <span className="font-semibold text-success">{formatCurrency(recommendation.exit.takeProfit[2])}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center">
                  <Percent className="mr-2 h-4 w-4" />
                  Risk Management
                </h3>
                <div className="flex flex-col space-y-1 bg-secondary/20 p-2 rounded-md">
                  <div className="flex justify-between">
                    <span>Leverage:</span>
                    <span className="font-semibold">{recommendation.leverage.recommendation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Position Size:</span>
                    <span>{recommendation.riskManagement.positionSizeRecommendation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk/Reward:</span>
                    <span>{recommendation.riskManagement.potentialRiskReward.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Probability:</span>
                    <span>{Math.round(recommendation.riskManagement.winProbability)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Key indicators */}
            {recommendation.keyIndicators.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Key Indicators</h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.keyIndicators.map((indicator, i) => (
                    <Badge key={i} variant="outline" className="bg-primary/10">
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Timeframe summary */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Timeframe Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {recommendation.timeframeSummary.map((tf) => (
                  <Button
                    key={tf.timeframe}
                    variant="outline"
                    className={`flex justify-between items-center ${
                      tf.direction === 'LONG' ? 'border-green-500' :
                      tf.direction === 'SHORT' ? 'border-red-500' :
                      'border-gray-500'
                    }`}
                    onClick={() => handleTimeframeSelect(tf.timeframe)}
                  >
                    <span>{tf.timeframe}</span>
                    <div className="flex items-center">
                      {tf.direction === 'LONG' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : tf.direction === 'SHORT' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                      <span className="ml-1">{tf.confidence}%</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Loading progress */}
      {isCalculating && (
        <Card>
          <CardHeader>
            <CardTitle>Analyzing market data...</CardTitle>
            <CardDescription>
              Calculating signals across all timeframes and indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={calculateProgress} className="h-2" />
            <p className="text-center mt-2">{calculateProgress}% complete</p>
          </CardContent>
        </Card>
      )}
      
      {/* Timeframe tabs */}
      {!isCalculating && (
        <Tabs value={selectedTimeframe} onValueChange={(v) => handleTimeframeSelect(v as TimeFrame)}>
          <TabsList className="grid grid-cols-8 mb-4">
            {timeframes.map((tf) => (
              <TabsTrigger key={tf} value={tf} disabled={!signals[tf]}>
                {tf}
                {signals[tf]?.direction === 'LONG' && (
                  <ChevronUp className="ml-1 h-3 w-3 text-green-500" />
                )}
                {signals[tf]?.direction === 'SHORT' && (
                  <ChevronDown className="ml-1 h-3 w-3 text-red-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {timeframes.map((tf) => (
            <TabsContent key={tf} value={tf}>
              {signals[tf] ? (
                <DetailedSignalCard 
                  signal={signals[tf]!} 
                  showAdvanced={showAdvancedStats}
                  toggleAdvanced={() => setShowAdvancedStats(!showAdvancedStats)}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p>No analysis available for {tf} timeframe</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
      
      {/* Recalculate button */}
      {!isCalculating && isAllDataLoaded && (
        <div className="flex justify-center mt-4">
          <Button onClick={() => calculateAllSignals()}>
            <LineChart className="mr-2 h-4 w-4" />
            Recalculate Signals
          </Button>
        </div>
      )}
    </div>
  );
}

// Detailed signal card component
function DetailedSignalCard({ 
  signal, 
  showAdvanced,
  toggleAdvanced
}: { 
  signal: AdvancedSignal, 
  showAdvanced: boolean,
  toggleAdvanced: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {signal.timeframe} Analysis
            <Badge variant={signal.direction === 'LONG' ? 'outline' : 
                             signal.direction === 'SHORT' ? 'destructive' : 
                             'secondary'} 
                   className={`ml-2 ${signal.direction === 'LONG' ? 'border-green-500 text-green-500' : ''}`}>
              {signal.direction}
            </Badge>
          </div>
          <Badge variant="outline" className="text-lg">
            {signal.confidence}/100
          </Badge>
        </CardTitle>
        <CardDescription>
          Signal strength indicates {signal.confidence}% confidence in a{' '}
          {signal.direction === 'LONG' ? 'bullish' : 
           signal.direction === 'SHORT' ? 'bearish' : 'neutral'} move
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Entry/Exit levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Entry Price</h3>
              <div className="text-2xl font-bold">
                {formatCurrency(signal.entryPrice)}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-red-500">Stop Loss</h3>
              <div className="text-2xl font-bold">
                {formatCurrency(signal.stopLoss)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatPercentage(Math.abs((signal.stopLoss - signal.entryPrice) / signal.entryPrice))} from entry
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-green-500">Take Profit</h3>
              <div className="text-2xl font-bold">
                {formatCurrency(signal.takeProfit)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatPercentage(Math.abs((signal.takeProfit - signal.entryPrice) / signal.entryPrice))} from entry
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Risk metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Leverage</h3>
              <div className="text-xl font-bold">
                {signal.recommendedLeverage.toFixed(1)}x
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Risk/Reward</h3>
              <div className="text-xl font-bold">
                {signal.optimalRiskReward.toFixed(1)}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Target Move</h3>
              <div className="text-xl font-bold">
                {formatPercentage(signal.predictedMovement.percentChange)}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Time Estimate</h3>
              <div className="text-xl font-bold">
                {signal.predictedMovement.timeEstimate}
              </div>
            </div>
          </div>
          
          {/* Indicator breakdown */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Key Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {Object.entries(signal.indicators).map(([category, indicators]) => {
                if (indicators.length === 0) return null;
                
                const buySignals = indicators.filter(i => i.signal === 'BUY').length;
                const sellSignals = indicators.filter(i => i.signal === 'SELL').length;
                const neutralSignals = indicators.filter(i => i.signal === 'NEUTRAL').length;
                
                let categoryBadge;
                if (buySignals > sellSignals) {
                  categoryBadge = <Badge variant="outline" className="border-green-500 text-green-500">Bullish</Badge>;
                } else if (sellSignals > buySignals) {
                  categoryBadge = <Badge variant="destructive">Bearish</Badge>;
                } else {
                  categoryBadge = <Badge variant="secondary">Neutral</Badge>;
                }
                
                return (
                  <Card key={category} className="overflow-hidden">
                    <CardHeader className="p-2">
                      <CardTitle className="text-sm flex justify-between items-center">
                        <span className="capitalize">{category}</span>
                        {categoryBadge}
                      </CardTitle>
                    </CardHeader>
                    {showAdvanced && (
                      <CardContent className="p-2 pt-0">
                        <div className="text-xs space-y-1">
                          {indicators.slice(0, 3).map((indicator, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{indicator.name}</span>
                              <Badge variant={
                                indicator.signal === 'BUY' ? 'outline' : 
                                indicator.signal === 'SELL' ? 'outline' : 'outline'
                              } className={
                                indicator.signal === 'BUY' ? 'border-green-500 text-green-500' :
                                indicator.signal === 'SELL' ? 'border-red-500 text-red-500' :
                                'border-gray-500'
                              }>
                                {indicator.signal}
                              </Badge>
                            </div>
                          ))}
                          {indicators.length > 3 && (
                            <div className="text-muted-foreground text-center">
                              +{indicators.length - 3} more
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* Support/Resistance */}
          {signal.supportResistance.length > 0 && showAdvanced && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Support & Resistance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {signal.supportResistance.slice(0, 4).map((level, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
                    <Badge variant={level.type === 'support' ? 'outline' : 'destructive'} 
                           className={level.type === 'support' ? 'border-green-500 text-green-500' : ''}>
                      {level.type}
                    </Badge>
                    <span className="font-semibold">{formatCurrency(level.price)}</span>
                    <Badge variant="outline">
                      Strength: {level.strength}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Chart patterns */}
          {signal.patternFormations.length > 0 && showAdvanced && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Chart Patterns</h3>
              <div className="space-y-2">
                {signal.patternFormations.map((pattern, i) => (
                  <Alert key={i}>
                    <AlertTitle className="flex justify-between">
                      <span>{pattern.name}</span>
                      <Badge variant={pattern.direction === 'bullish' ? 'outline' : 
                                       pattern.direction === 'bearish' ? 'destructive' : 
                                       'secondary'}
                             className={pattern.direction === 'bullish' ? 'border-green-500 text-green-500' : ''}>
                        {pattern.direction}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="text-sm">
                      <div className="flex justify-between">
                        <span>Target: {formatCurrency(pattern.priceTarget)}</span>
                        <span>Reliability: {pattern.reliability}%</span>
                      </div>
                      <p className="mt-1">{pattern.description}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={toggleAdvanced} className="w-full">
          {showAdvanced ? 'Hide' : 'Show'} Advanced Analysis
        </Button>
      </CardFooter>
    </Card>
  );
}