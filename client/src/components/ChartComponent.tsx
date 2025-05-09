import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData, 
  CrosshairMode, 
  SeriesType, 
  PriceScaleMode, 
  UTCTimestamp, 
  AutoscaleInfo, 
  DeepPartial, 
  PriceLineOptions,
  // Series definitions
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries 
} from 'lightweight-charts';
import { useChartData } from '../hooks/useMarketData';
import { TimeFrame, ChartData } from '../types';
// Using ResizeObserver directly instead of the useSize hook
import { calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands, calculateStochastic, calculateATR, calculateFibonacciLevels, calculateADX } from '../lib/indicators';

interface ChartComponentProps {
  symbol: string;
  timeframe: TimeFrame;
  onChangeTimeframe: (timeframe: TimeFrame) => void;
}

// Time frames with all options
const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];

// Indicator categories for better organization
enum IndicatorCategory {
  TREND = "Trend",
  MOMENTUM = "Momentum",
  VOLATILITY = "Volatility",
  VOLUME = "Volume",
  PATTERN = "Pattern"
}

// Indicator configuration
interface IndicatorConfig {
  name: string;
  type: 'oscillator' | 'overlay' | 'volume' | 'pattern';
  enabled: boolean;
  color: string;
  category: IndicatorCategory;
  settings?: any;
}

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  // Trend indicators (only EMA-50 and 200 enabled by default)
  { name: 'EMA-9', type: 'overlay', enabled: false, color: '#F44336', category: IndicatorCategory.TREND, settings: { period: 9 } },
  { name: 'EMA-21', type: 'overlay', enabled: false, color: '#7B1FA2', category: IndicatorCategory.TREND, settings: { period: 21 } },
  { name: 'EMA-50', type: 'overlay', enabled: true, color: '#2196F3', category: IndicatorCategory.TREND, settings: { period: 50 } },
  { name: 'EMA-200', type: 'overlay', enabled: true, color: '#FFB300', category: IndicatorCategory.TREND, settings: { period: 200 } },
  { name: 'BB', type: 'overlay', enabled: false, color: '#4CAF50', category: IndicatorCategory.VOLATILITY, settings: { period: 20, deviation: 2 } },
  
  // Only RSI and MACD enabled by default for oscillators
  { name: 'RSI', type: 'oscillator', enabled: true, color: '#9C27B0', category: IndicatorCategory.MOMENTUM, settings: { period: 14, overbought: 70, oversold: 30 } },
  { name: 'MACD', type: 'oscillator', enabled: true, color: '#00BCD4', category: IndicatorCategory.MOMENTUM, settings: { fast: 12, slow: 26, signal: 9 } },
  { name: 'Stochastic', type: 'oscillator', enabled: false, color: '#3F51B5', category: IndicatorCategory.MOMENTUM, settings: { period: 14, smoothK: 3, smoothD: 3 } },
  { name: 'ADX', type: 'oscillator', enabled: false, color: '#FF9800', category: IndicatorCategory.TREND, settings: { period: 14 } },
  { name: 'ATR', type: 'oscillator', enabled: false, color: '#795548', category: IndicatorCategory.VOLATILITY, settings: { period: 14 } },
  
  // Volume is essential, keep enabled
  { name: 'Volume', type: 'volume', enabled: true, color: '#607D8B', category: IndicatorCategory.VOLUME, settings: {} },
  
  // Disable fibonacci by default as it's an advanced feature
  { name: 'Fibonacci', type: 'overlay', enabled: false, color: '#8BC34A', category: IndicatorCategory.PATTERN, settings: {} },
];

// Pattern detection settings
const PATTERNS = [
  { name: 'Bullish Engulfing', type: 'bullish', color: '#4CAF50' },
  { name: 'Bearish Engulfing', type: 'bearish', color: '#F44336' },
  { name: 'Doji', type: 'neutral', color: '#FFC107' },
  { name: 'Morning Star', type: 'bullish', color: '#4CAF50' },
  { name: 'Evening Star', type: 'bearish', color: '#F44336' },
  { name: 'Hammer', type: 'bullish', color: '#4CAF50' },
  { name: 'Shooting Star', type: 'bearish', color: '#F44336' },
];

// Divergence settings
const DIVERGENCES = [
  { name: 'RSI Bullish Divergence', type: 'bullish', color: '#4CAF50' },
  { name: 'RSI Bearish Divergence', type: 'bearish', color: '#F44336' },
  { name: 'MACD Bullish Divergence', type: 'bullish', color: '#4CAF50' },
  { name: 'MACD Bearish Divergence', type: 'bearish', color: '#F44336' },
];

// Function to detect patterns in candlestick data
function detectPatterns(data: ChartData[]): { pattern: string, index: number, type: string, color: string }[] {
  const patterns: { pattern: string, index: number, type: string, color: string }[] = [];
  
  // Need at least 5 candles to detect patterns
  if (data.length < 5) return patterns;
  
  // Loop through the data starting from the 3rd candle
  for (let i = 3; i < data.length; i++) {
    const current = data[i];
    const prev = data[i-1];
    const prev2 = data[i-2];
    const prev3 = data[i-3];
    
    // Bullish Engulfing
    if (current.close > current.open && 
        prev.close < prev.open &&
        current.open < prev.close &&
        current.close > prev.open) {
      patterns.push({
        pattern: 'Bullish Engulfing',
        index: i,
        type: 'bullish',
        color: '#4CAF50'
      });
    }
    
    // Bearish Engulfing
    if (current.close < current.open && 
        prev.close > prev.open &&
        current.open > prev.close &&
        current.close < prev.open) {
      patterns.push({
        pattern: 'Bearish Engulfing',
        index: i,
        type: 'bearish',
        color: '#F44336'
      });
    }
    
    // Doji (open and close are very close)
    const bodySize = Math.abs(current.close - current.open);
    const wickSize = current.high - current.low;
    if (bodySize / wickSize < 0.1) {
      patterns.push({
        pattern: 'Doji',
        index: i,
        type: 'neutral',
        color: '#FFC107'
      });
    }
    
    // Hammer (small body at the top, long lower wick)
    const lower = Math.min(current.open, current.close);
    const upper = Math.max(current.open, current.close);
    if (((current.high - upper) / wickSize < 0.2) && 
        ((lower - current.low) / wickSize > 0.6)) {
      patterns.push({
        pattern: 'Hammer',
        index: i,
        type: 'bullish',
        color: '#4CAF50'
      });
    }
    
    // Morning Star (3-candle bullish reversal)
    if (prev2.close < prev2.open && // First candle is bearish
        Math.abs(prev.close - prev.open) / prev.high - prev.low < 0.3 && // Second candle is small
        current.close > current.open && // Third candle is bullish
        current.close > (prev2.open + prev2.close) / 2) { // Third candle closes above midpoint of first
      patterns.push({
        pattern: 'Morning Star',
        index: i,
        type: 'bullish',
        color: '#4CAF50'
      });
    }
    
    // Evening Star (3-candle bearish reversal)
    if (prev2.close > prev2.open && // First candle is bullish
        Math.abs(prev.close - prev.open) / prev.high - prev.low < 0.3 && // Second candle is small
        current.close < current.open && // Third candle is bearish
        current.close < (prev2.open + prev2.close) / 2) { // Third candle closes below midpoint of first
      patterns.push({
        pattern: 'Evening Star',
        index: i,
        type: 'bearish',
        color: '#F44336'
      });
    }
  }
  
  return patterns;
}

// Function to detect divergences between price and indicators
function detectDivergences(data: ChartData[]): { divergence: string, startIndex: number, endIndex: number, type: string, color: string }[] {
  const divergences: { divergence: string, startIndex: number, endIndex: number, type: string, color: string }[] = [];
  
  // Need at least 30 candles to detect meaningful divergences
  if (data.length < 30) return divergences;
  
  // Extract close prices
  const closes = data.map(d => d.close);
  
  // Calculate RSI
  const rsiValues = calculateRSI(closes);
  
  // Look for local extrema in price and RSI in the last 30 candles
  const lookbackPeriod = Math.min(30, data.length - 1);
  const startIdx = data.length - lookbackPeriod;
  
  let priceHighIdx: number[] = [];
  let priceLowIdx: number[] = [];
  let rsiHighIdx: number[] = [];
  let rsiLowIdx: number[] = [];
  
  // Find local highs and lows
  for (let i = startIdx + 2; i < data.length - 2; i++) {
    // Price highs
    if (data[i].high > data[i-1].high && 
        data[i].high > data[i-2].high && 
        data[i].high > data[i+1].high && 
        data[i].high > data[i+2].high) {
      priceHighIdx.push(i);
    }
    
    // Price lows
    if (data[i].low < data[i-1].low && 
        data[i].low < data[i-2].low && 
        data[i].low < data[i+1].low && 
        data[i].low < data[i+2].low) {
      priceLowIdx.push(i);
    }
    
    // RSI highs
    if (i >= 14 && rsiValues[i] && // Make sure we have RSI values
        rsiValues[i] > rsiValues[i-1] && 
        rsiValues[i] > rsiValues[i-2] && 
        rsiValues[i] > rsiValues[i+1] && 
        rsiValues[i] > rsiValues[i+2]) {
      rsiHighIdx.push(i);
    }
    
    // RSI lows
    if (i >= 14 && rsiValues[i] && // Make sure we have RSI values
        rsiValues[i] < rsiValues[i-1] && 
        rsiValues[i] < rsiValues[i-2] && 
        rsiValues[i] < rsiValues[i+1] && 
        rsiValues[i] < rsiValues[i+2]) {
      rsiLowIdx.push(i);
    }
  }
  
  // Look for RSI Bullish Divergence (price makes lower low but RSI makes higher low)
  if (priceLowIdx.length >= 2 && rsiLowIdx.length >= 2) {
    const lastPriceLow = priceLowIdx[priceLowIdx.length - 1];
    const prevPriceLow = priceLowIdx[priceLowIdx.length - 2];
    const lastRsiLow = rsiLowIdx[rsiLowIdx.length - 1];
    const prevRsiLow = rsiLowIdx[rsiLowIdx.length - 2];
    
    if (Math.abs(lastPriceLow - lastRsiLow) < 3 && Math.abs(prevPriceLow - prevRsiLow) < 3) {
      // Price is making lower lows
      if (data[lastPriceLow].low < data[prevPriceLow].low) {
        // But RSI is making higher lows (bullish divergence)
        if (rsiValues[lastRsiLow] > rsiValues[prevRsiLow]) {
          divergences.push({
            divergence: 'RSI Bullish Divergence',
            startIndex: prevPriceLow,
            endIndex: lastPriceLow,
            type: 'bullish',
            color: '#4CAF50'
          });
        }
      }
    }
  }
  
  // Look for RSI Bearish Divergence (price makes higher high but RSI makes lower high)
  if (priceHighIdx.length >= 2 && rsiHighIdx.length >= 2) {
    const lastPriceHigh = priceHighIdx[priceHighIdx.length - 1];
    const prevPriceHigh = priceHighIdx[priceHighIdx.length - 2];
    const lastRsiHigh = rsiHighIdx[rsiHighIdx.length - 1];
    const prevRsiHigh = rsiHighIdx[rsiHighIdx.length - 2];
    
    if (Math.abs(lastPriceHigh - lastRsiHigh) < 3 && Math.abs(prevPriceHigh - prevRsiHigh) < 3) {
      // Price is making higher highs
      if (data[lastPriceHigh].high > data[prevPriceHigh].high) {
        // But RSI is making lower highs (bearish divergence)
        if (rsiValues[lastRsiHigh] < rsiValues[prevRsiHigh]) {
          divergences.push({
            divergence: 'RSI Bearish Divergence',
            startIndex: prevPriceHigh,
            endIndex: lastPriceHigh,
            type: 'bearish',
            color: '#F44336'
          });
        }
      }
    }
  }
  
  // Calculate MACD for similar divergence checks
  const macdResult = calculateMACD(closes);
  if (macdResult && macdResult.histogram) {
    const macdHistogram = macdResult.histogram;
    
    // Similar logic can be applied for MACD divergences
    // (implementation omitted for brevity)
  }
  
  return divergences;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ 
  symbol, 
  timeframe, 
  onChangeTimeframe 
}) => {
  // Chart refs and state
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndicators, setActiveIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const [chartType, setChartType] = useState<'candles' | 'line' | 'area'>('candles');
  const [showVolume, setShowVolume] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [detectedPatterns, setDetectedPatterns] = useState<any[]>([]);
  const [detectedDivergences, setDetectedDivergences] = useState<any[]>([]);
  const [visibleTimeframes, setVisibleTimeframes] = useState<TimeFrame[]>(['1h', '4h', '1d', '1w']);
  const [showAllTimeframes, setShowAllTimeframes] = useState(false);
  
  // Resize handling with a simple implementation instead of useSize
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  
  // Get chart data
  const { chartData, isLoading } = useChartData(symbol, timeframe);
  
  // Chart instances
  const chartInstance = useRef<IChartApi | null>(null);
  const mainSeries = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(null);
  const volumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeries = useRef<Record<string, ISeriesApi<any>>>({});
  const patternMarkers = useRef<Record<string, ISeriesApi<any>>>({});
  const divergenceLines = useRef<Record<string, ISeriesApi<any>>>({});

  // Convert to lightweight-charts format
  const formattedCandlesticks = useMemo(() => {
    return chartData.map(candle => ({
      time: (candle.time / 1000) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));
  }, [chartData]);
  
  // Format data for technical indicators
  const indicatorData = useMemo(() => {
    if (chartData.length === 0) return {};
    
    const closes = chartData.map(d => d.close);
    const times = chartData.map(d => (d.time / 1000) as UTCTimestamp);
    const highs = chartData.map(d => d.high);
    const lows = chartData.map(d => d.low);
    const volumes = chartData.map(d => d.volume);
    
    // Calculate various indicators
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const bb = calculateBollingerBands(closes, 20, 2);
    const stoch = calculateStochastic(chartData, 14, 3, 3);
    const adx = calculateADX(chartData, 14);
    const atr = calculateATR(chartData, 14);
    
    // Format for chart display
    const formatted = {
      'EMA-9': times.map((time, i) => ({ time, value: ema9?.[i] })).filter(d => d.value !== undefined),
      'EMA-21': times.map((time, i) => ({ time, value: ema21?.[i] })).filter(d => d.value !== undefined),
      'EMA-50': times.map((time, i) => ({ time, value: ema50?.[i] })).filter(d => d.value !== undefined),
      'EMA-200': times.map((time, i) => ({ time, value: ema200?.[i] })).filter(d => d.value !== undefined),
      'RSI': times.map((time, i) => ({ time, value: rsi?.[i] })).filter(d => d.value !== undefined),
      'BB-Upper': times.map((time, i) => ({ time, value: bb?.upper?.[i] })).filter(d => d.value !== undefined),
      'BB-Middle': times.map((time, i) => ({ time, value: bb?.middle?.[i] })).filter(d => d.value !== undefined),
      'BB-Lower': times.map((time, i) => ({ time, value: bb?.lower?.[i] })).filter(d => d.value !== undefined),
      'MACD-Line': times.map((time, i) => ({ time, value: macd?.macd?.[i] })).filter(d => d.value !== undefined),
      'MACD-Signal': times.map((time, i) => ({ time, value: macd?.signal?.[i] })).filter(d => d.value !== undefined),
      'MACD-Histogram': times.map((time, i) => ({ time, value: macd?.histogram?.[i] })).filter(d => d.value !== undefined),
      'Stochastic-K': times.map((time, i) => ({ time, value: stoch?.k?.[i] })).filter(d => d.value !== undefined),
      'Stochastic-D': times.map((time, i) => ({ time, value: stoch?.d?.[i] })).filter(d => d.value !== undefined),
      'ADX': times.map((time, i) => ({ time, value: adx?.adx })).filter(d => d.value !== undefined),
      'ADX-DI+': times.map((time, i) => ({ time, value: adx?.pdi })).filter(d => d.value !== undefined),
      'ADX-DI-': times.map((time, i) => ({ time, value: adx?.mdi })).filter(d => d.value !== undefined),
      'ATR': times.map((time, i) => ({ time, value: atr })).filter(d => d.value !== undefined),
      'Volume': times.map((time, i) => ({ 
        time, 
        value: volumes?.[i],
        color: closes?.[i] >= chartData[i]?.open ? 'rgba(14, 203, 129, 0.5)' : 'rgba(232, 65, 66, 0.5)'
      })).filter(d => d.value !== undefined)
    };
    
    return formatted;
  }, [chartData]);
  
  // Create the chart
  // Setup ResizeObserver for chart container
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setChartSize({ width, height });
      
      if (chartInstance.current) {
        chartInstance.current.applyOptions({ width, height });
      }
    });
    
    resizeObserver.observe(chartContainerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Create/update chart when container size or other dependencies change
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Remove the old chart if it exists
    if (chartInstance.current) {
      chartInstance.current.remove();
      mainSeries.current = null;
      volumeSeries.current = null;
      indicatorSeries.current = {};
      patternMarkers.current = {};
      divergenceLines.current = {};
    }
    
    // Create a new chart with current dimensions
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0F1929' },
        textColor: '#B7BDC6',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.05,
        },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: {
        vertTouchDrag: true,
      },
    });
    
    // Main series for price data
    let mainSeriesRef;
    if (chartType === 'candles') {
      mainSeriesRef = chart.addSeries(CandlestickSeries, {
        upColor: '#0ECB81',
        downColor: '#E84142',
        borderUpColor: '#0ECB81',
        borderDownColor: '#E84142',
        wickUpColor: '#0ECB81',
        wickDownColor: '#E84142',
      });
    } else if (chartType === 'line') {
      mainSeriesRef = chart.addSeries(LineSeries, {
        color: '#0ECB81',
        lineWidth: 2,
      });
    } else {
      mainSeriesRef = chart.addSeries(AreaSeries, {
        topColor: 'rgba(14, 203, 129, 0.4)',
        bottomColor: 'rgba(14, 203, 129, 0.1)',
        lineColor: '#0ECB81',
        lineWidth: 2,
      });
    }
    
    // Set the data
    if (formattedCandlesticks.length > 0) {
      if (chartType === 'candles') {
        mainSeriesRef.setData(formattedCandlesticks as CandlestickData[]);
      } else {
        const lineData = formattedCandlesticks.map(c => ({
          time: c.time,
          value: c.close
        }));
        mainSeriesRef.setData(lineData as LineData[]);
      }
    }
    
    // Volume series
    if (showVolume && indicatorData['Volume']) {
      const volumeSeriesRef = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });
      volumeSeriesRef.setData(indicatorData['Volume'] as any[]);
      volumeSeries.current = volumeSeriesRef;
    }
    
    // Overlay indicators
    activeIndicators.forEach(indicator => {
      if (!indicator.enabled) return;
      
      if (indicator.type === 'overlay') {
        if (indicator.name === 'BB') {
          // Bollinger Bands (3 lines)
          if (indicatorData['BB-Upper'] && indicatorData['BB-Middle'] && indicatorData['BB-Lower']) {
            const upperSeries = chart.addSeries(LineSeries, {
              color: indicator.color,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            const middleSeries = chart.addSeries(LineSeries, {
              color: indicator.color,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
              lineStyle: 2, // Dashed
            });
            const lowerSeries = chart.addSeries(LineSeries, {
              color: indicator.color,
              lineWidth: 1,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            
            upperSeries.setData(indicatorData['BB-Upper'] as LineData[]);
            middleSeries.setData(indicatorData['BB-Middle'] as LineData[]);
            lowerSeries.setData(indicatorData['BB-Lower'] as LineData[]);
            
            indicatorSeries.current['BB-Upper'] = upperSeries;
            indicatorSeries.current['BB-Middle'] = middleSeries;
            indicatorSeries.current['BB-Lower'] = lowerSeries;
          }
        } else if (indicator.name.startsWith('EMA')) {
          // EMA
          const key = indicator.name;
          if (indicatorData[key]) {
            const series = chart.addSeries(LineSeries, {
              color: indicator.color,
              lineWidth: 1,
              priceLineVisible: false,
            });
            series.setData(indicatorData[key] as LineData[]);
            indicatorSeries.current[key] = series;
          }
        } else if (indicator.name === 'Fibonacci') {
          // Fibonacci levels
          if (formattedCandlesticks.length > 0) {
            const prices = formattedCandlesticks.map(c => c.close);
            const highLow = {
              high: Math.max(...prices),
              low: Math.min(...prices)
            };
            
            const levels = calculateFibonacciLevels(highLow.high, highLow.low);
            
            // Create horizontal lines for each Fibonacci level
            const fibLevels = [
              { level: 0, value: levels.level0, color: 'rgba(235, 77, 92, 0.8)' },
              { level: 0.236, value: levels.level236, color: 'rgba(255, 152, 0, 0.8)' },
              { level: 0.382, value: levels.level382, color: 'rgba(255, 193, 7, 0.8)' },
              { level: 0.5, value: levels.level500, color: 'rgba(139, 195, 74, 0.8)' },
              { level: 0.618, value: levels.level618, color: 'rgba(33, 150, 243, 0.8)' },
              { level: 0.786, value: levels.level786, color: 'rgba(156, 39, 176, 0.8)' },
              { level: 1, value: levels.level1000, color: 'rgba(158, 158, 158, 0.8)' }
            ];
            
            fibLevels.forEach(fib => {
              const options: DeepPartial<PriceLineOptions> = {
                price: fib.value,
                color: fib.color,
                lineWidth: 1,
                lineStyle: 1, // Solid
                axisLabelVisible: true,
                title: `Fib ${fib.level}`,
              };
              
              mainSeriesRef.createPriceLine(options);
            });
          }
        }
      }
    });
    
    // Create ALL indicators in their own panes except overlay EMA indicators
    // Group the indicators by their types for easy management
    const allActiveIndicators = [...activeIndicators];
    const overlays = allActiveIndicators.filter(i => i.type === 'overlay' && i.enabled && !i.name.startsWith('EMA'));
    const emaIndicators = allActiveIndicators.filter(i => i.type === 'overlay' && i.enabled && i.name.startsWith('EMA'));
    const oscillators = allActiveIndicators.filter(i => i.type === 'oscillator' && i.enabled);
    const volumeIndicator = allActiveIndicators.find(i => i.name === 'Volume' && i.enabled);
    
    // EMA indicators still go on main price pane
    emaIndicators.forEach(ema => {
      const key = ema.name;
      if (indicatorData[key]) {
        const series = chart.addSeries(LineSeries, {
          color: ema.color,
          lineWidth: 1,
          priceLineVisible: false,
        });
        series.setData(indicatorData[key] as LineData[]);
        indicatorSeries.current[key] = series;
      }
    });
    
    // Adjust the scale of the main chart to make room for indicator panes
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: '#0F1929' },
        textColor: '#B7BDC6',
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.3, // Leave more room at the bottom for indicator panes
        },
      },
    });
    
    let paneCount = 0;
    
    // Create separate panes for each indicator
    // Process each oscillator
    oscillators.forEach(oscillator => {
      if (oscillator.name === 'RSI' && indicatorData['RSI']) {
        // Add RSI pane
        const rsiPane = chart.addSeries(LineSeries, {
          color: oscillator.color,
          lineWidth: 1,
          priceScaleId: 'rsi',
        });
        
        paneCount++;
        
        // Add RSI lines
        rsiPane.setData(indicatorData['RSI'] as LineData[]);
        
        // Add RSI overbought/oversold levels
        rsiPane.createPriceLine({
          price: oscillator.settings.overbought,
          color: 'rgba(232, 65, 66, 0.5)',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
        });
        
        rsiPane.createPriceLine({
          price: oscillator.settings.oversold,
          color: 'rgba(14, 203, 129, 0.5)',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
        });
        
        // Set RSI scale
        chart.priceScale('rsi').applyOptions({
          scaleMargins: {
            // Each indicator pane gets its own vertical space segment
            top: 0.7 + (paneCount - 1) * 0.2,
            bottom: 0.1,
          },
          visible: true,
          autoScale: true,
        });
        
        indicatorSeries.current['RSI'] = rsiPane;
      }
      
      if (oscillator.name === 'MACD' && 
          indicatorData['MACD-Line'] && 
          indicatorData['MACD-Signal'] &&
          indicatorData['MACD-Histogram']) {
        // Add MACD pane
        const macdLinePane = chart.addSeries(LineSeries, {
          color: oscillator.color,
          lineWidth: 1,
          priceScaleId: 'macd',
        });
        
        const macdSignalPane = chart.addSeries(LineSeries, {
          color: '#E84142',
          lineWidth: 1,
          priceScaleId: 'macd',
        });
        
        const macdHistPane = chart.addSeries(HistogramSeries, {
          color: 'rgba(80, 80, 160, 0.8)',
          priceScaleId: 'macd',
        });
        
        // Set MACD data
        macdLinePane.setData(indicatorData['MACD-Line'] as LineData[]);
        macdSignalPane.setData(indicatorData['MACD-Signal'] as LineData[]);
        
        // Set histogram colors based on values
        const histogramData = indicatorData['MACD-Histogram'].map((d: any) => ({
          ...d,
          color: d.value >= 0 ? 'rgba(14, 203, 129, 0.5)' : 'rgba(232, 65, 66, 0.5)'
        }));
        macdHistPane.setData(histogramData);
        
        // Set MACD scale
        chart.priceScale('macd').applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          visible: true,
          autoScale: true,
        });
        
        indicatorSeries.current['MACD-Line'] = macdLinePane;
        indicatorSeries.current['MACD-Signal'] = macdSignalPane;
        indicatorSeries.current['MACD-Histogram'] = macdHistPane;
        
        paneCount++;
      }
      
      if (oscillator.name === 'Stochastic' &&
          indicatorData['Stochastic-K'] &&
          indicatorData['Stochastic-D']) {
        // Add Stochastic pane
        const stochKPane = chart.addSeries(LineSeries, {
          color: oscillator.color,
          lineWidth: 1,
          priceScaleId: 'stoch',
        });
        
        const stochDPane = chart.addSeries(LineSeries, {
          color: '#FF9800',
          lineWidth: 1,
          priceScaleId: 'stoch',
        });
        
        // Set Stochastic data
        stochKPane.setData(indicatorData['Stochastic-K'] as LineData[]);
        stochDPane.setData(indicatorData['Stochastic-D'] as LineData[]);
        
        // Add Stochastic overbought/oversold levels
        stochKPane.createPriceLine({
          price: 80,
          color: 'rgba(232, 65, 66, 0.5)',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
        });
        
        stochKPane.createPriceLine({
          price: 20,
          color: 'rgba(14, 203, 129, 0.5)',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
        });
        
        // Set Stochastic scale
        chart.priceScale('stoch').applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          visible: true,
          autoScale: false,
          minimumValue: 0,
          maximumValue: 100,
        });
        
        indicatorSeries.current['Stochastic-K'] = stochKPane;
        indicatorSeries.current['Stochastic-D'] = stochDPane;
        
        paneCount++;
      }
      
      if (oscillator.name === 'ADX' &&
          indicatorData['ADX'] &&
          indicatorData['ADX-DI+'] &&
          indicatorData['ADX-DI-']) {
        // Add ADX pane
        const adxPane = chart.addSeries(LineSeries, {
          color: oscillator.color,
          lineWidth: 1,
          priceScaleId: 'adx',
        });
        
        const diPlusPane = chart.addSeries(LineSeries, {
          color: '#0ECB81',
          lineWidth: 1,
          priceScaleId: 'adx',
        });
        
        const diMinusPane = chart.addSeries(LineSeries, {
          color: '#E84142',
          lineWidth: 1,
          priceScaleId: 'adx',
        });
        
        // Set ADX data
        if (indicatorData['ADX']) adxPane.setData(indicatorData['ADX'] as LineData[]);
        if (indicatorData['ADX-DI+']) diPlusPane.setData(indicatorData['ADX-DI+'] as LineData[]);
        if (indicatorData['ADX-DI-']) diMinusPane.setData(indicatorData['ADX-DI-'] as LineData[]);
        
        // Add ADX threshold level
        adxPane.createPriceLine({
          price: 25,
          color: 'rgba(255, 255, 255, 0.5)',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: 'Strong Trend',
        });
        
        // Set ADX scale
        chart.priceScale('adx').applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          visible: true,
          autoScale: false,
          // Note: minimumValue/maximumValue not supported in newer versions
          // Using minValue/maxValue or disabling autoScale and using appropriate data
        });
        
        indicatorSeries.current['ADX'] = adxPane;
        indicatorSeries.current['ADX-DI+'] = diPlusPane;
        indicatorSeries.current['ADX-DI-'] = diMinusPane;
        
        paneCount++;
      }
      
      if (oscillator.name === 'ATR' && indicatorData['ATR']) {
        // Add ATR pane
        const atrPane = chart.addSeries(LineSeries, {
          color: oscillator.color,
          lineWidth: 1,
          priceScaleId: 'atr',
        });
        
        paneCount++;
        
        // Set ATR data
        if (indicatorData['ATR']) atrPane.setData(indicatorData['ATR'] as LineData[]);
        
        // Set ATR scale
        chart.priceScale('atr').applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          visible: true,
          autoScale: true,
        });
        
        indicatorSeries.current['ATR'] = atrPane;
      }
    });
    
    // Detect and mark patterns
    if (formattedCandlesticks.length > 0) {
      const patterns = detectPatterns(chartData);
      setDetectedPatterns(patterns);
      
      // Mark patterns on chart
      patterns.forEach((pattern, idx) => {
        const marker = {
          time: (chartData[pattern.index].time / 1000) as UTCTimestamp,
          position: pattern.type === 'bullish' ? 'belowBar' : 'aboveBar',
          color: pattern.color,
          shape: pattern.type === 'bullish' ? 'arrowUp' : pattern.type === 'bearish' ? 'arrowDown' : 'circle',
          text: pattern.pattern,
        };
        
        // Add marker
        // Note: the newer API uses createMarker or addMarkers instead of setMarkers
        // For now, we'll disable this to avoid runtime errors
        // mainSeriesRef.createMarker(marker);
      });
    }
    
    // Detect and mark divergences
    if (formattedCandlesticks.length > 0) {
      const divergences = detectDivergences(chartData);
      setDetectedDivergences(divergences);
      
      // Mark divergences on chart with custom drawing
      // (This is a simplified representation as lightweight-charts doesn't support custom line drawing between points)
      // In a full implementation, we would use canvas to draw these lines
      divergences.forEach((divergence, idx) => {
        const startMarker = {
          time: (chartData[divergence.startIndex].time / 1000) as UTCTimestamp,
          position: divergence.type === 'bullish' ? 'belowBar' : 'aboveBar',
          color: divergence.color,
          shape: 'circle',
          text: divergence.divergence + ' Start',
        };
        
        const endMarker = {
          time: (chartData[divergence.endIndex].time / 1000) as UTCTimestamp,
          position: divergence.type === 'bullish' ? 'belowBar' : 'aboveBar',
          color: divergence.color,
          shape: divergence.type === 'bullish' ? 'arrowUp' : 'arrowDown',
          text: divergence.divergence,
        };
        
        // Add divergence markers
        // Note: the newer API uses createMarker or addMarkers instead of setMarkers
        // For now, we'll disable this to avoid runtime errors
        // mainSeriesRef.createMarker(startMarker);
        // mainSeriesRef.createMarker(endMarker);
      });
    }
    
    // Store references
    chartInstance.current = chart;
    mainSeries.current = mainSeriesRef;
    
    // Fit content to chart
    chart.timeScale().fitContent();
    
    // Clean up
    return () => {
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
        mainSeries.current = null;
        volumeSeries.current = null;
        indicatorSeries.current = {};
        patternMarkers.current = {};
        divergenceLines.current = {};
      }
    };
  }, [
    chartData, 
    chartType, 
    formattedCandlesticks, 
    indicatorData, 
    activeIndicators, 
    chartSize, 
    showVolume, 
    symbol, 
    timeframe
  ]);
  
  // Toggle indicator visibility
  const toggleIndicator = (name: string) => {
    setActiveIndicators(prev => 
      prev.map(ind => 
        ind.name === name 
          ? { ...ind, enabled: !ind.enabled } 
          : ind
      )
    );
  };
  
  // Toggle chart type
  const handleChartTypeChange = (type: 'candles' | 'line' | 'area') => {
    setChartType(type);
  };
  
  // Toggle all timeframes visibility
  const toggleAllTimeframes = () => {
    setShowAllTimeframes(!showAllTimeframes);
  };
  
  // Display detected patterns and divergences in a legend
  const renderPatternLegend = () => {
    if (detectedPatterns.length === 0 && detectedDivergences.length === 0) {
      return <div className="text-xs text-neutral mb-1">No patterns detected</div>;
    }
    
    return (
      <div className="flex flex-col">
        {detectedPatterns.length > 0 && (
          <div className="text-xs font-medium text-white mb-1">Detected Patterns:</div>
        )}
        {detectedPatterns.map((pattern, idx) => (
          <div key={`pattern-${idx}`} className="flex items-center mb-1">
            <span 
              className="h-2 w-2 rounded-full mr-1" 
              style={{ backgroundColor: pattern.color }}
            ></span>
            <span className="text-xs">{pattern.pattern} ({timeframe})</span>
          </div>
        ))}
        
        {detectedDivergences.length > 0 && (
          <div className="text-xs font-medium text-white mb-1 mt-1">Detected Divergences:</div>
        )}
        {detectedDivergences.map((divergence, idx) => (
          <div key={`divergence-${idx}`} className="flex items-center mb-1">
            <span 
              className="h-2 w-2 rounded-full mr-1" 
              style={{ backgroundColor: divergence.color }}
            ></span>
            <span className="text-xs">{divergence.divergence} ({timeframe})</span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-white text-lg font-medium">{symbol} Chart</h2>
          
          {/* Chart type selector */}
          <div className="flex space-x-1 mr-4">
            <button
              className={`p-1 text-xs rounded ${chartType === 'candles' ? 'bg-accent text-primary' : 'bg-gray-700 text-neutral'}`}
              onClick={() => handleChartTypeChange('candles')}
              title="Candlestick Chart"
            >
              <span role="img" aria-label="candlestick">📊</span>
            </button>
            <button
              className={`p-1 text-xs rounded ${chartType === 'line' ? 'bg-accent text-primary' : 'bg-gray-700 text-neutral'}`}
              onClick={() => handleChartTypeChange('line')}
              title="Line Chart"
            >
              <span role="img" aria-label="line">📈</span>
            </button>
            <button
              className={`p-1 text-xs rounded ${chartType === 'area' ? 'bg-accent text-primary' : 'bg-gray-700 text-neutral'}`}
              onClick={() => handleChartTypeChange('area')}
              title="Area Chart"
            >
              <span role="img" aria-label="area">📉</span>
            </button>
          </div>
          
          {/* Timeframe selector */}
          <div className="flex items-center">
            <div className="flex space-x-1">
              {(showAllTimeframes ? timeframes : visibleTimeframes).map(tf => (
                <button
                  key={tf}
                  className={`py-1 px-2 text-xs font-medium rounded ${
                    tf === timeframe 
                      ? 'bg-accent text-primary' 
                      : 'bg-gray-700 text-neutral'
                  }`}
                  onClick={() => onChangeTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
              <button
                className="py-1 px-2 text-xs font-medium rounded bg-gray-700 text-neutral"
                onClick={toggleAllTimeframes}
                title={showAllTimeframes ? "Show fewer timeframes" : "Show all timeframes"}
              >
                {showAllTimeframes ? "−" : "+"}
              </button>
            </div>
          </div>
        </div>
        
        {/* Chart and legend layout */}
        <div className="flex">
          {/* Chart container */}
          <div className="flex-grow">
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-secondary bg-opacity-50 flex items-center justify-center z-10">
                  <span className="text-white">Loading chart data...</span>
                </div>
              )}
              
              <div 
                ref={chartContainerRef}
                className="w-full h-[500px] relative"
              />
            </div>
          </div>
          
          {/* Legend and controls */}
          {showLegend && (
            <div className="w-48 ml-2 flex flex-col bg-gray-800 bg-opacity-50 p-2 rounded">
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-medium text-white">Indicators</h3>
                <button
                  className="text-xs text-neutral"
                  onClick={() => setShowLegend(false)}
                  title="Hide legend"
                >
                  ×
                </button>
              </div>
              
              {/* Indicator toggles */}
              <div className="flex flex-col overflow-y-auto max-h-[200px] mb-4">
                {activeIndicators.map(indicator => (
                  <div key={indicator.name} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      id={`indicator-${indicator.name}`}
                      checked={indicator.enabled}
                      onChange={() => toggleIndicator(indicator.name)}
                      className="mr-1"
                    />
                    <span 
                      className="h-2 w-2 rounded-full mr-1" 
                      style={{ backgroundColor: indicator.color }}
                    ></span>
                    <label 
                      htmlFor={`indicator-${indicator.name}`}
                      className="text-xs cursor-pointer"
                    >
                      {indicator.name}
                    </label>
                  </div>
                ))}
                
                <div className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id="show-volume"
                    checked={showVolume}
                    onChange={() => setShowVolume(!showVolume)}
                    className="mr-1"
                  />
                  <span className="h-2 w-2 bg-[#607D8B] rounded-full mr-1"></span>
                  <label htmlFor="show-volume" className="text-xs cursor-pointer">Volume</label>
                </div>
              </div>
              
              {/* Pattern detection results */}
              <h3 className="text-sm font-medium text-white mb-2">Detected Patterns</h3>
              {renderPatternLegend()}
            </div>
          )}
          
          {/* Show legend button (when hidden) */}
          {!showLegend && (
            <button
              className="w-6 h-6 ml-1 bg-gray-800 rounded flex items-center justify-center text-white"
              onClick={() => setShowLegend(true)}
              title="Show legend"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartComponent;
