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
  
  // References to track calculation state
  const calculationTriggeredRef = useRef(false);
  const lastCalculationTimeRef = useRef<number>(0);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recalcIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
    console.log(`Starting signal calculation for ${symbol} (${timeframe})`);
    
    if (!chartDataMap[timeframe]?.data?.length) {
      console.log(`No data available for ${symbol} on ${timeframe} timeframe`);
      return null;
    }
    
    try {
      console.log(`DATA CHECK: ${symbol} on ${timeframe} timeframe has ${chartDataMap[timeframe]?.data?.length} data points.`);
      
      const signal = calculateTimeframeConfidence(
        chartDataMap[timeframe].data, 
        timeframe, 
        undefined, // Use default weights
        symbol     // Pass symbol
      );
      
      console.log(`SUCCESS: Calculated signal for ${symbol} on ${timeframe} timeframe:`, 
          `Direction: ${signal.direction}, Confidence: ${signal.confidence}%`);
      return signal;
    } catch (err) {
      console.error(`Error calculating signal for ${symbol} (${timeframe}):`, err);
      return null;
    }
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
      calculationTimeoutRef.current = null;
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
    
    // Reset calculation triggers to ensure recalculation happens for the new symbol
    calculationTriggeredRef.current = false;
    lastCalculationTimeRef.current = 0;
    
    // Force trigger calculation once data loads, with a delay to ensure data is ready
    setTimeout(() => {
      if (isAllDataLoaded) {
        console.log(`Forcing calculation for new symbol: ${symbol}`);
        triggerCalculation('symbol-changed');
      }
    }, 2000);
  }, [symbol, isAllDataLoaded, triggerCalculation]);
  
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
                    <span className="text-red-500">{formatCurrency(recommendation.exit.stopLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take Profits:</span>
                    <span className="text-green-500">
                      {recommendation.exit.takeProfit.map((tp, i) => 
                        <span key={i} className="mr-1">{formatCurrency(tp)}{i < recommendation.exit.takeProfit.length - 1 ? ',' : ''}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trailing Stop:</span>
                    <span>{formatPercentage(recommendation.exit.trailingStopPercent)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center">
                  <Percent className="mr-2 h-4 w-4" />
                  Risk Management
                  <Badge variant="outline" className="ml-2 text-xs">Win Rate: {formatPercentage(recommendation.riskManagement.winProbability)}</Badge>
                </h3>
                <div className="flex flex-col space-y-1 bg-secondary/20 p-2 rounded-md">
                  <div className="flex justify-between">
                    <span>Risk/Reward:</span>
                    <span>{recommendation.riskManagement.potentialRiskReward.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Leverage:</span>
                    <span className="font-semibold">{recommendation.leverage.recommendation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Risk %:</span>
                    <span>{formatPercentage(recommendation.riskManagement.maxRiskPercentage)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Key Indicators</h3>
              <div className="flex flex-wrap gap-2">
                {recommendation.keyIndicators.map((indicator, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {indicator}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Show calculation progress */}
      {isCalculating && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Calculating signals...</span>
            <span className="text-sm">{calculateProgress}%</span>
          </div>
          <Progress value={calculateProgress} />
        </div>
      )}
      
      {/* Timeframe signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Signal Analysis by Timeframe</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => triggerCalculation('manual')}
              disabled={isCalculating}
            >
              Refresh Analysis
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={selectedTimeframe} onValueChange={(val) => handleTimeframeSelect(val as TimeFrame)}>
            <TabsList className="grid grid-cols-7 mb-4">
              {timeframes.map(tf => (
                <TabsTrigger key={tf} value={tf} className="text-xs sm:text-sm">{tf}</TabsTrigger>
              ))}
            </TabsList>
            
            {timeframes.map(tf => (
              <TabsContent key={tf} value={tf} className="space-y-4">
                {signals[tf] ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold mr-2">
                          {symbol} ({tf})
                        </span>
                        {renderDirectionBadge(signals[tf]!.direction)}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">Confidence:</span>
                        {renderScoreBadge(signals[tf]!.confidence)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border border-gray-800">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">Entry & Exit Strategy</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Entry Price:</span>
                              <span className="font-semibold">{formatCurrency(signals[tf]!.entryPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Stop Loss:</span>
                              <span className="text-red-500">{formatCurrency(signals[tf]!.stopLoss)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Take Profit:</span>
                              <span className="text-green-500">{formatCurrency(signals[tf]!.takeProfit)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Risk/Reward:</span>
                              <span>{signals[tf]!.optimalRiskReward.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Recommended Leverage:</span>
                              <span className={signals[tf]!.recommendedLeverage > 3 ? "text-red-500 font-semibold" : "font-semibold"}>
                                {signals[tf]!.recommendedLeverage}x
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Advanced Stats Panel - always visible */}
                      <Card className="border border-gray-800">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">Advanced Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Trend Strength:</span>
                              <Badge variant={
                                calculateCategoryScore(signals[tf]!.indicators.trend) > 70 ? "outline" : 
                                calculateCategoryScore(signals[tf]!.indicators.trend) > 40 ? "secondary" : "destructive"
                              } className="text-xs">
                                {calculateCategoryScore(signals[tf]!.indicators.trend)}/100
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Momentum:</span>
                              <Badge variant={
                                calculateCategoryScore(signals[tf]!.indicators.momentum) > 70 ? "outline" : 
                                calculateCategoryScore(signals[tf]!.indicators.momentum) > 40 ? "secondary" : "destructive"
                              } className="text-xs">
                                {calculateCategoryScore(signals[tf]!.indicators.momentum)}/100
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Volatility:</span>
                              <Badge variant={
                                calculateCategoryScore(signals[tf]!.indicators.volatility) > 70 ? "outline" : 
                                calculateCategoryScore(signals[tf]!.indicators.volatility) > 40 ? "secondary" : "destructive"
                              } className="text-xs">
                                {calculateCategoryScore(signals[tf]!.indicators.volatility)}/100
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Volume Profile:</span>
                              <Badge variant={
                                calculateCategoryScore(signals[tf]!.indicators.volume) > 70 ? "outline" : 
                                calculateCategoryScore(signals[tf]!.indicators.volume) > 40 ? "secondary" : "destructive"
                              } className="text-xs">
                                {calculateCategoryScore(signals[tf]!.indicators.volume)}/100
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Pattern Recognition:</span>
                              <Badge variant={
                                calculateCategoryScore(signals[tf]!.indicators.pattern) > 70 ? "outline" : 
                                calculateCategoryScore(signals[tf]!.indicators.pattern) > 40 ? "secondary" : "destructive"
                              } className="text-xs">
                                {calculateCategoryScore(signals[tf]!.indicators.pattern)}/100
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Macro Environment:</span>
                              <Badge variant={
                                signals[tf]!.macroScore > 70 ? "outline" : 
                                signals[tf]!.macroScore > 40 ? "secondary" : "destructive"
                              } className="text-xs">
                                {signals[tf]!.macroScore}/100
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Support & Resistance Levels */}
                      <Card className="border border-gray-800">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">Support & Resistance Levels</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-2">
                            {signals[tf]!.supportResistance.map((level, i) => (
                              <div key={i} className="flex justify-between">
                                <span className={level.type === 'support' ? 'text-green-500' : 'text-red-500'}>
                                  {level.type === 'support' ? 'Support' : 'Resistance'} 
                                  <span className="text-xs text-gray-400 ml-1">
                                    ({level.strength}/100)
                                  </span>
                                </span>
                                <span className="font-medium">{formatCurrency(level.price)}</span>
                              </div>
                            ))}
                            {signals[tf]!.supportResistance.length === 0 && (
                              <div className="text-sm text-gray-400">No significant levels detected</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Pattern Formations */}
                      <Card className="border border-gray-800">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">Chart Patterns</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-2">
                            {signals[tf]!.patternFormations.map((pattern, i) => (
                              <div key={i} className="flex flex-col space-y-1 border-b border-gray-800 pb-2 last:border-0">
                                <div className="flex justify-between">
                                  <span className="font-medium">{pattern.name}</span>
                                  <Badge variant={
                                    pattern.direction === 'bullish' ? "outline" : 
                                    pattern.direction === 'bearish' ? "destructive" : "secondary"
                                  } className="text-xs">
                                    {pattern.direction}
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span>Target: {formatCurrency(pattern.priceTarget)}</span>
                                  <span>Reliability: {pattern.reliability}%</span>
                                </div>
                              </div>
                            ))}
                            {signals[tf]!.patternFormations.length === 0 && (
                              <div className="text-sm text-gray-400">No significant patterns detected</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Macro Insights and Prediction */}
                    <Card className="border border-gray-800">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          Macro Environment & Forecast
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Macro Classification</h4>
                            <Badge variant="secondary" className="mb-2">{signals[tf]!.macroClassification}</Badge>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                              {signals[tf]!.macroInsights.map((insight, i) => (
                                <li key={i}>{insight}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Price Prediction</h4>
                            <div className="bg-secondary/20 p-3 rounded-md">
                              <div className="flex justify-between mb-2">
                                <span>Expected Movement:</span>
                                <span className={signals[tf]!.predictedMovement.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  {signals[tf]!.predictedMovement.percentChange >= 0 ? '+' : ''}
                                  {formatPercentage(signals[tf]!.predictedMovement.percentChange)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Timeframe:</span>
                                <span>{signals[tf]!.predictedMovement.timeEstimate}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
                    <p className="text-lg font-semibold">Signal not available</p>
                    <p className="text-gray-400 text-center max-w-md">
                      {isCalculating
                        ? "Calculation in progress..."
                        : "Signal calculation not available for this timeframe yet. Click 'Refresh Analysis' to calculate."}
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate category score
function calculateCategoryScore(indicators: any[]) {
  if (!indicators || indicators.length === 0) return 0;
  
  const total = indicators.reduce((sum, ind) => sum + ind.score, 0);
  return Math.round(total / indicators.length);
}