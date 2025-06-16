import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface TechnicalIndicators {
  rsi: {value: number, signal: string} | number;
  macd: {value: number, signal: number, histogram: number, trend: string} | number;
  bollingerBands?: {upper: number, middle: number, lower: number, position: string};
  bb_upper?: number;
  bb_lower?: number;
  bb_middle?: number;
  stochastic?: {k: number, d: number, signal: string};
  stochastic_k?: number;
  stochastic_d?: number;
  atr?: {value: number} | number;
  ultraPrecisionMetrics?: any;
}

interface PatternData {
  patterns: Array<{
    type: string;
    strength: number;
    timeframe: string;
  }>;
}

const TechnicalAnalysisSummary: React.FC = () => {
  const { data: techData, isLoading: techLoading } = useQuery({
    queryKey: ['/api/technical-analysis/BTC%2FUSDT'],
    refetchInterval: 300000, // Update every 5 minutes - aggressive API optimization
  });

  const { data: patternData, isLoading: patternLoading } = useQuery({
    queryKey: ['/api/pattern-analysis/BTC%2FUSDT'],
    refetchInterval: 480000, // Update every 8 minutes - aggressive API optimization
  });

  // Integrated performance metrics - replacing eliminated Performance Analysis component
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/performance-metrics'],
    refetchInterval: 600000, // Update every 10 minutes - aggressive API optimization
  });

  const { data: accuracyData, isLoading: accuracyLoading } = useQuery({
    queryKey: ['/api/accuracy/BTC/USDT'],
    refetchInterval: 420000, // Update every 7 minutes - aggressive API optimization
  });

  // Enhanced data structure handling based on external testing findings
  const indicators = (() => {
    if (!techData) return {} as TechnicalIndicators;
    
    // Debug log to understand the actual data structure
    console.log('TechnicalAnalysisSummary parsing indicators from:', techData);
    
    // Handle nested indicators structure from API response
    if (techData.data?.indicators && typeof techData.data.indicators === 'object') {
      console.log('Found indicators in techData.data.indicators:', techData.data.indicators);
      return techData.data.indicators as TechnicalIndicators;
    }
    
    // Handle direct indicators structure
    if (techData.indicators && typeof techData.indicators === 'object') {
      console.log('Found indicators in techData.indicators:', techData.indicators);
      return techData.indicators as TechnicalIndicators;
    }
    
    // Fallback for direct data structure
    if (techData.rsi !== undefined || techData.macd !== undefined) {
      console.log('Found direct indicators in techData:', { rsi: techData.rsi, macd: techData.macd });
      return techData as TechnicalIndicators;
    }
    
    console.log('No indicators found, returning empty object');
    return {} as TechnicalIndicators;
  })();
  
  const patterns = (() => {
    if (!patternData) return [];
    
    // Handle nested patterns structure
    if (Array.isArray(patternData.patterns)) {
      return patternData.patterns;
    }
    
    // Handle patternAnalysis structure from API response
    if (patternData.patternAnalysis?.patterns) {
      return Array.isArray(patternData.patternAnalysis.patterns) ? 
        patternData.patternAnalysis.patterns : [];
    }
    
    // Handle direct patterns array
    if (patternData.summary?.patterns) {
      return Array.isArray(patternData.summary.patterns) ? 
        patternData.summary.patterns : [];
    }
    
    return [];
  })();

  // Debug logging for troubleshooting display issues
  React.useEffect(() => {
    console.log('TechnicalAnalysisSummary DEBUG:');
    console.log('- techData:', techData);
    console.log('- patternData:', patternData);
    console.log('- indicators:', indicators);
    console.log('- patterns:', patterns);
    console.log('- isLoading:', techLoading, patternLoading);
  }, [techData, patternData, indicators, patterns, techLoading, patternLoading]);

  const getRSISignal = (rsi: number) => {
    if (rsi >= 70) return { signal: 'Overbought', color: 'text-red-600', icon: TrendingDown };
    if (rsi <= 30) return { signal: 'Oversold', color: 'text-green-600', icon: TrendingUp };
    return { signal: 'Neutral', color: 'text-blue-600', icon: Activity };
  };

  const getMACDSignal = (macd: number) => {
    if (macd > 0) return { signal: 'Bullish', color: 'text-green-600', icon: TrendingUp };
    if (macd < 0) return { signal: 'Bearish', color: 'text-red-600', icon: TrendingDown };
    return { signal: 'Neutral', color: 'text-blue-600', icon: Activity };
  };

  const getBollingerPosition = (price: number, upper: number, lower: number, middle: number) => {
    if (!price || !upper || !lower || !middle) return { signal: 'N/A', color: 'text-muted-foreground' };
    
    if (price > upper) return { signal: 'Above Upper', color: 'text-red-600' };
    if (price < lower) return { signal: 'Below Lower', color: 'text-green-600' };
    if (price > middle) return { signal: 'Above Middle', color: 'text-blue-600' };
    return { signal: 'Below Middle', color: 'text-yellow-600' };
  };

  const getStochasticSignal = (k: number, d: number) => {
    if (!k || !d) return { signal: 'N/A', color: 'text-muted-foreground' };
    
    if (k >= 80 && d >= 80) return { signal: 'Overbought', color: 'text-red-600' };
    if (k <= 20 && d <= 20) return { signal: 'Oversold', color: 'text-green-600' };
    if (k > d) return { signal: 'Bullish Cross', color: 'text-green-600' };
    if (k < d) return { signal: 'Bearish Cross', color: 'text-red-600' };
    return { signal: 'Neutral', color: 'text-blue-600' };
  };

  const isLoading = techLoading || patternLoading;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Technical Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!indicators) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Technical Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Technical data unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safe numeric extraction with fallbacks - handles both nested and direct values
  const safeNumber = (value: any, fallback: number = 0): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return !isNaN(parsed) ? parsed : fallback;
    }
    if (value && typeof value === 'object' && value.value !== undefined) {
      return safeNumber(value.value, fallback);
    }
    return fallback;
  };

  // Extract indicator values from nested structure - handle object.value pattern
  const rsiValue = safeNumber(
    typeof indicators.rsi === 'object' ? indicators.rsi.value : indicators.rsi, 50
  );
  const macdValue = safeNumber(
    typeof indicators.macd === 'object' ? indicators.macd.value : indicators.macd, 0
  );
  const bbUpper = safeNumber(indicators.bollingerBands?.upper || indicators.bb_upper, 0);
  const bbLower = safeNumber(indicators.bollingerBands?.lower || indicators.bb_lower, 0);
  const bbMiddle = safeNumber(indicators.bollingerBands?.middle || indicators.bb_middle, 0);
  const stochK = safeNumber(indicators.stochastic?.k || indicators.stochastic_k, 50);
  const stochD = safeNumber(indicators.stochastic?.d || indicators.stochastic_d, 50);

  // Extract current price for Bollinger position calculation
  const currentPrice = safeNumber(techData?.currentPrice, 108000);
  
  const rsiSignal = getRSISignal(rsiValue);
  const macdSignal = getMACDSignal(macdValue);
  const bbSignal = getBollingerPosition(currentPrice, bbUpper, bbLower, bbMiddle);
  const stochSignal = getStochasticSignal(stochK, stochD);

  return (
    <Card className="w-full border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Technical Analysis Summary
          </div>
          <Badge variant="outline" className="text-xs">
            BTC/USDT
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Key Indicators */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs text-muted-foreground">Key Indicators</h4>
            
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <rsiSignal.icon className={`h-3 w-3 ${rsiSignal.color}`} />
                <span className="text-xs font-medium">RSI</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold">{rsiValue.toFixed(1)}</div>
                <div className={`text-2xs ${rsiSignal.color}`}>{rsiSignal.signal}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <macdSignal.icon className={`h-3 w-3 ${macdSignal.color}`} />
                <span className="text-xs font-medium">MACD</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold">{macdValue.toFixed(2)}</div>
                <div className={`text-2xs ${macdSignal.color}`}>{macdSignal.signal}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-orange-600" />
                <span className="text-xs font-medium">Bollinger</span>
              </div>
              <div className="text-right">
                <div className="text-2xs space-y-0">
                  <div>U: {bbUpper > 0 ? bbUpper.toFixed(0) : 'N/A'}</div>
                  <div>M: {bbMiddle > 0 ? bbMiddle.toFixed(0) : 'N/A'}</div>
                  <div>L: {bbLower > 0 ? bbLower.toFixed(0) : 'N/A'}</div>
                </div>
                <div className={`text-2xs ${bbSignal.color}`}>{bbSignal.signal}</div>
              </div>
            </div>
          </div>

          {/* Key Patterns - Fibonacci 50% highlighted */}
          <div className="space-y-2">
            <h4 className="font-medium text-xs text-muted-foreground">Key Patterns</h4>
            
            {(() => {
              const fibPattern = patterns.find(p => p.type === 'fibonacci_50');
              if (fibPattern) {
                return (
                  <>
                    {/* Fibonacci 50% Mini Box */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="h-3 w-3 text-amber-600" />
                        <span className="text-xs font-medium">Fib 50%</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold">{Math.round(fibPattern.confidence * 100)}%</div>
                        <div className="text-2xs text-amber-600">Resistance</div>
                      </div>
                    </div>

                    {/* Stochastic directly under Fibonacci 50% */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium">Stochastic</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold">
                          {stochK.toFixed(1)}
                        </div>
                        <div className={`text-2xs ${stochSignal.color}`}>{stochSignal.signal}</div>
                      </div>
                    </div>
                  </>
                );
              } else {
                return (
                  <div className="text-center py-2 text-muted-foreground text-xs">
                    No key patterns detected
                  </div>
                );
              }
            })()}

            {/* Other patterns */}
            {patterns.filter(p => p.type !== 'fibonacci_50').length > 0 && (
              <div className="space-y-1.5 max-h-20 overflow-y-auto">
                <div className="text-2xs text-muted-foreground">Other Patterns</div>
                {patterns.filter(p => p.type !== 'fibonacci_50').slice(0, 2).map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 rounded-lg bg-background border text-2xs">
                    <span className="font-medium">{pattern.type}</span>
                    <Badge variant="secondary" className="text-2xs px-1 py-0">
                      {Math.round(pattern.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}


          </div>
        </div>

        {/* Integrated Performance Metrics Section - Replaces eliminated Performance Analysis component */}
        {performanceData && (
          <div className="mt-3 pt-2 border-t">
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="h-3 w-3" />
              <span className="text-xs font-medium">Performance Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {performanceData.indicators?.slice(0, 4).map((indicator: any, index: number) => (
                <div key={index} className="p-1.5 rounded-lg bg-background border">
                  <div className="text-2xs text-muted-foreground">{indicator.name}</div>
                  <div className="text-xs font-medium">
                    {typeof indicator.value === 'number' 
                      ? `${indicator.value.toFixed(1)}${indicator.id.includes('accuracy') || indicator.id.includes('uptime') ? '%' : ''}`
                      : indicator.value || 'N/A'
                    }
                  </div>
                </div>
              ))}
            </div>
            {accuracyData && (
              <div className="mt-2 p-2 rounded-lg bg-background border">
                <div className="text-xs text-muted-foreground">Signal Accuracy (BTC/USDT)</div>
                <div className="text-sm font-medium">
                  {typeof accuracyData.accuracy === 'number' ? `${accuracyData.accuracy.toFixed(1)}%` : 'Calculating...'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Overall Signal Summary */}
        <div className="mt-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Overall Sentiment</span>
            <div className="flex items-center gap-1">
              {[rsiSignal, macdSignal, stochSignal].filter(s => s.signal.includes('Bullish') || s.signal.includes('Oversold')).length > 1 ? (
                <Badge variant="default" className="text-2xs bg-green-600 px-1.5 py-0.5">Bullish</Badge>
              ) : [rsiSignal, macdSignal, stochSignal].filter(s => s.signal.includes('Bearish') || s.signal.includes('Overbought')).length > 1 ? (
                <Badge variant="destructive" className="text-2xs px-1.5 py-0.5">Bearish</Badge>
              ) : (
                <Badge variant="secondary" className="text-2xs px-1.5 py-0.5">Mixed</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnicalAnalysisSummary;