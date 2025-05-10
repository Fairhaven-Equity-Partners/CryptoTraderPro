import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  DollarSign,
  Globe
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
import MacroIndicatorsPanel from './MacroIndicatorsPanel';

interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

export default function AdvancedSignalDashboard({ 
  symbol, 
  onTimeframeSelect 
}: AdvancedSignalDashboardProps) {
  const isMobile = useIsMobile();
  const timeframes: TimeFrame[] = ['15m', '1h', '4h', '1d', '3d', '1w', '1M'];
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
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
  const [recommendation, setRecommendation] = useState<TradeRecommendation | null>(null);
  const [calculateProgress, setCalculateProgress] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  // Always show advanced stats - no toggle functionality
  const showAdvancedStats = true;
  
  // Get chart data for all timeframes
  const chartData1m = useChartData(symbol, '1m');
  const chartData5m = useChartData(symbol, '5m');
  const chartData15m = useChartData(symbol, '15m');
  const chartData30m = useChartData(symbol, '30m');
  const chartData1h = useChartData(symbol, '1h');
  const chartData4h = useChartData(symbol, '4h');
  const chartData1d = useChartData(symbol, '1d');
  const chartData3d = useChartData(symbol, '3d');
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
    '3d': { data: chartData3d.chartData, isLoading: chartData3d.isLoading },
    '1w': { data: chartData1w.chartData, isLoading: chartData1w.isLoading },
    '1M': { data: chartData1M.chartData, isLoading: chartData1M.isLoading }
  };
  
  // Check if all data is loaded
  const isAllDataLoaded = !Object.values(chartDataMap).some(chart => chart.isLoading);
  
  // Calculate signals for a specific timeframe
  const calculateSignalForTimeframe = useCallback((timeframe: TimeFrame) => {
    if (chartDataMap[timeframe]?.data?.length) {
      try {
        const signal = calculateTimeframeConfidence(
          chartDataMap[timeframe].data, 
          timeframe,
          undefined, // Use default weights
          symbol     // Pass the actual symbol
        );
        return signal;
      } catch (err) {
        console.error(`Error calculating signal for ${timeframe}:`, err);
        return null;
      }
    }
    return null;
  }, [chartDataMap, symbol]);
  
  // Calculate signals for all timeframes
  const calculateAllSignals = useCallback(async () => {
    if (!isAllDataLoaded) {
      console.log("Canceling calculation - data not loaded");
      return Promise.resolve(); // Return a resolved promise
    }
    
    console.log("Starting calculation process");
    setIsCalculating(true);
    
    const newSignals: Record<TimeFrame, AdvancedSignal | null> = { ...signals };
    
    try {
      // Calculate signals one by one to not block the UI
      for (let i = 0; i < timeframes.length; i++) {
        const tf = timeframes[i];
        setCalculateProgress(Math.round((i / timeframes.length) * 100));
        
        // Use setTimeout to give UI time to update
        await new Promise(resolve => {
          setTimeout(() => {
            try {
              newSignals[tf] = calculateSignalForTimeframe(tf);
              setSignals(prev => ({ ...prev, [tf]: newSignals[tf] }));
            } catch (error) {
              console.error(`Error calculating signal for ${tf}:`, error);
            }
            resolve(null);
          }, 100);
        });
      }
      
      // Generate overall recommendation
      const validSignals = Object.values(newSignals).filter(Boolean) as AdvancedSignal[];
      console.log(`Found ${validSignals.length} valid signals for recommendation`);
      
      if (validSignals.length >= 3) {
        const rec = generateTradeRecommendation(symbol, validSignals);
        setRecommendation(rec);
      } else {
        console.log("Not enough valid signals to generate recommendation");
      }
      
      setCalculateProgress(100);
    } catch (error) {
      console.error("Error in calculateAllSignals:", error);
    } finally {
      console.log("Calculation process complete");
      setIsCalculating(false);
    }
    
    return Promise.resolve(); // Ensure we always return a promise
  }, [symbol, isAllDataLoaded, signals, timeframes, calculateSignalForTimeframe]);
  
  // Reset signals and trigger calculation when symbol changes
  useEffect(() => {
    console.log("Symbol changed to:", symbol);
    // Reset all signals
    setSignals({
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
    setRecommendation(null);
    setCalculateProgress(0);
    setIsCalculating(false);
    
    // We'll let the calculation effect handle the recalculation
    // once the data is loaded for the new symbol
  }, [symbol]);
  
  // References to track calculation state
  const calculationTriggeredRef = useRef(false);
  const lastCalculationTimeRef = useRef<number>(0);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recalcIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to safely trigger calculation with debouncing
  const triggerCalculation = useCallback((reason: string) => {
    const now = Date.now();
    // Prevent calculation if one is already in progress or happened too recently
    if (calculationTriggeredRef.current || isCalculating || (now - lastCalculationTimeRef.current < 5000)) {
      console.log(`Skipping calculation (${reason}): already calculating or too recent`);
      return;
    }
    
    console.log(`Triggering calculation (${reason})`);
    calculationTriggeredRef.current = true;
    
    // Clear any existing timeout
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    // Set a new timeout for the calculation
    calculationTimeoutRef.current = setTimeout(() => {
      calculateAllSignals().then(() => {
        // Update the last calculation time
        lastCalculationTimeRef.current = Date.now();
        // Reset the flag after a delay
        setTimeout(() => {
          calculationTriggeredRef.current = false;
        }, 5000);
      });
    }, 300); // Small delay to batch updates
  }, [calculateAllSignals, isCalculating]);
  
  // Effect to watch for data loading completion
  useEffect(() => {
    if (isAllDataLoaded && !calculationTriggeredRef.current && !isCalculating) {
      triggerCalculation('data-loaded');
    }
  }, [isAllDataLoaded, triggerCalculation, isCalculating]);
  
  // Set up periodic recalculation
  useEffect(() => {
    // Clear any existing interval when component updates
    if (recalcIntervalRef.current) {
      clearInterval(recalcIntervalRef.current);
      recalcIntervalRef.current = null;
    }
    
    // Set up a new interval for recalculation
    recalcIntervalRef.current = setInterval(() => {
      if (isAllDataLoaded && !isCalculating && !calculationTriggeredRef.current) {
        triggerCalculation('auto-interval');
      }
    }, 60000); // 1 minute interval - increased to reduce server load
    
    // Clean up interval on component unmount
    return () => {
      if (recalcIntervalRef.current) {
        clearInterval(recalcIntervalRef.current);
      }
      
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [isAllDataLoaded, triggerCalculation, isCalculating]);
  
  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    
    // No need to recalculate signals on timeframe selection - they should already be
    // calculated as part of the main calculation process
    
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [onTimeframeSelect]);
  
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
                <Badge variant="outline" className="ml-2 text-xs">Multi-Timeframe</Badge>
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
                  <Badge variant="outline" className="ml-2 text-xs">1H Timeframe</Badge>
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
                  <Badge variant="outline" className="ml-2 text-xs">1H Timeframe</Badge>
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
                  <Badge variant="outline" className="ml-2 text-xs">1H Timeframe</Badge>
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
      
      {/* Macro Indicators Panel - placed between main signal and timeframe analysis */}
      {!isCalculating && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Macro Environment Analysis</h3>
          <MacroIndicatorsPanel symbol={symbol} />
        </div>
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
                  toggleAdvanced={() => {}}
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
      
      {/* Recalculate button and auto-update status */}
      {!isCalculating && isAllDataLoaded && (
        <div className="flex flex-col items-center mt-4 space-y-2">
          <Button onClick={() => calculateAllSignals()}>
            <LineChart className="mr-2 h-4 w-4" />
            Recalculate Now
          </Button>
          <div className="text-xs text-muted-foreground flex items-center">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Auto-recalculation active (every minute)
          </div>
        </div>
      )}
    </div>
  );
}

// Detailed signal card component with integrated position calculator
function DetailedSignalCard({ 
  signal, 
  showAdvanced,
  toggleAdvanced
}: { 
  signal: AdvancedSignal, 
  showAdvanced: boolean,
  toggleAdvanced: () => void
}) {
  // Position calculator logic removed as requested

  return (
    <Card className={`border-l-4 ${
      signal.direction === 'LONG' ? 'border-l-green-500' : 
      signal.direction === 'SHORT' ? 'border-l-red-500' : 
      'border-l-gray-400'
    }`}>
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
          {signal.direction === 'LONG' ? 'Bullish' : 
           signal.direction === 'SHORT' ? 'Bearish' : 'Neutral'} signal with {signal.confidence}% confidence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Combined Trading Strategy Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry/Exit Strategy */}
            <Card className="bg-secondary/10">
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-sm">Entry & Exit Strategy</CardTitle>
              </CardHeader>
              <CardContent className="p-3 grid grid-cols-3 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Entry Price</div>
                  <div className="text-lg font-bold">{formatCurrency(signal.entryPrice)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Stop Loss</div>
                  <div className="text-lg font-bold text-red-500">{formatCurrency(signal.stopLoss)}</div>
                  <div className="text-xs">{formatPercentage(Math.abs((signal.stopLoss - signal.entryPrice) / signal.entryPrice))} risk</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Take Profit</div>
                  <div className="text-lg font-bold text-green-500">{formatCurrency(signal.takeProfit)}</div>
                  <div className="text-xs">{formatPercentage(Math.abs((signal.takeProfit - signal.entryPrice) / signal.entryPrice))} target</div>
                </div>
              </CardContent>
            </Card>
            
            {/* Position Calculator removed as requested */}
          </div>

          <Separator />
          
          {/* Market Prediction */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Direction</h3>
              <div className="text-xl font-bold">
                {signal.direction}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Confidence</h3>
              <div className="text-xl font-bold">
                {signal.confidence}%
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
                          {indicators.map((indicator, i) => (
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
                {signal.supportResistance.map((level, i) => (
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
      {/* Always showing details - button removed */}
    </Card>
  );
}