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
    
    // Handle nested indicators structure from API response
    if (techData.indicators && typeof techData.indicators === 'object') {
      return techData.indicators as TechnicalIndicators;
    }
    
    // Fallback for direct data structure
    if (techData.rsi !== undefined || techData.macd !== undefined) {
      return techData as TechnicalIndicators;
    }
    
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Indicators */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Key Indicators</h4>
            
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <rsiSignal.icon className={`h-4 w-4 ${rsiSignal.color}`} />
                <span className="text-sm font-medium">RSI</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{rsiValue.toFixed(1)}</div>
                <div className={`text-xs ${rsiSignal.color}`}>{rsiSignal.signal}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Stochastic</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {stochK.toFixed(1)}
                </div>
                <div className={`text-xs ${stochSignal.color}`}>{stochSignal.signal}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <macdSignal.icon className={`h-4 w-4 ${macdSignal.color}`} />
                <span className="text-sm font-medium">MACD</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{macdValue.toFixed(4)}</div>
                <div className={`text-xs ${macdSignal.color}`}>{macdSignal.signal}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Bollinger Bands</span>
              </div>
              <div className="text-right">
                <div className="text-xs space-y-0.5">
                  <div>Upper: {bbUpper > 0 ? bbUpper.toFixed(0) : 'N/A'}</div>
                  <div>Middle: {bbMiddle > 0 ? bbMiddle.toFixed(0) : 'N/A'}</div>
                  <div>Lower: {bbLower > 0 ? bbLower.toFixed(0) : 'N/A'}</div>
                </div>
                <div className={`text-xs ${bbSignal.color}`}>{bbSignal.signal}</div>
              </div>
            </div>
          </div>

          {/* Patterns & Signals */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Patterns Detected ({patterns.length})
            </h4>
            
            {patterns.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No patterns detected
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {patterns.slice(0, 3).map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-background border">
                    <div>
                      <div className="text-sm font-medium">{pattern.type}</div>
                      <div className="text-xs text-muted-foreground">{pattern.timeframe}</div>
                    </div>
                    <Badge 
                      variant={pattern.strength >= 70 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {pattern.strength}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}


          </div>
        </div>

        {/* Integrated Performance Metrics Section - Replaces eliminated Performance Analysis component */}
        {performanceData && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Performance Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {performanceData.indicators?.slice(0, 4).map((indicator: any, index: number) => (
                <div key={index} className="p-2 rounded-lg bg-background border">
                  <div className="text-xs text-muted-foreground">{indicator.name}</div>
                  <div className="text-sm font-medium">
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
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Sentiment</span>
            <div className="flex items-center gap-2">
              {[rsiSignal, macdSignal, stochSignal].filter(s => s.signal.includes('Bullish') || s.signal.includes('Oversold')).length > 1 ? (
                <Badge variant="default" className="text-xs bg-green-600">Bullish Bias</Badge>
              ) : [rsiSignal, macdSignal, stochSignal].filter(s => s.signal.includes('Bearish') || s.signal.includes('Overbought')).length > 1 ? (
                <Badge variant="destructive" className="text-xs">Bearish Bias</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Mixed Signals</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnicalAnalysisSummary;