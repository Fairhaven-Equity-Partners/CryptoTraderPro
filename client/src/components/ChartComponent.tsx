import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  TimeScaleOptions,
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
  
  // All oscillators enabled by default for better demonstration of expandable panels
  { name: 'RSI', type: 'oscillator', enabled: true, color: '#9C27B0', category: IndicatorCategory.MOMENTUM, settings: { period: 14, overbought: 70, oversold: 30 } },
  { name: 'MACD', type: 'oscillator', enabled: true, color: '#00BCD4', category: IndicatorCategory.MOMENTUM, settings: { fast: 12, slow: 26, signal: 9 } },
  { name: 'Stochastic', type: 'oscillator', enabled: true, color: '#3F51B5', category: IndicatorCategory.MOMENTUM, settings: { period: 14, smoothK: 3, smoothD: 3 } },
  { name: 'ADX', type: 'oscillator', enabled: true, color: '#FF9800', category: IndicatorCategory.TREND, settings: { period: 14 } },
  { name: 'ATR', type: 'oscillator', enabled: true, color: '#795548', category: IndicatorCategory.VOLATILITY, settings: { period: 14 } },
  
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
    if (i >= 14 && rsiValues[i] !== undefined && // Make sure we have RSI values
        rsiValues[i-1] !== undefined &&
        rsiValues[i-2] !== undefined &&
        rsiValues[i+1] !== undefined &&
        rsiValues[i+2] !== undefined &&
        rsiValues[i] > rsiValues[i-1] && 
        rsiValues[i] > rsiValues[i-2] && 
        rsiValues[i] > rsiValues[i+1] && 
        rsiValues[i] > rsiValues[i+2]) {
      rsiHighIdx.push(i);
    }
    
    // RSI lows
    if (i >= 14 && rsiValues[i] !== undefined && // Make sure we have RSI values
        rsiValues[i-1] !== undefined &&
        rsiValues[i-2] !== undefined &&
        rsiValues[i+1] !== undefined &&
        rsiValues[i+2] !== undefined &&
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
  
  // State for expanded/collapsed indicator panels
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
    'RSI': true,
    'MACD': true,
    'Stochastic': true,
    'ADX': true,
    'ATR': true
  });
  
  // Resize handling with a simple implementation instead of useSize
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  
  // Get chart data
  const { chartData, isLoading } = useChartData(symbol, timeframe);
  
  // Chart instances
  const chartInstance = useRef<IChartApi | null>(null);
  const mainSeries = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(null);
  const volumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  // Properly type indicator series with string key index
  const indicatorSeries = useRef<{[key: string]: ISeriesApi<'Line' | 'Histogram' | 'Area'>}>({});
  const patternMarkers = useRef<{[key: string]: any}>({});
  const divergenceLines = useRef<{[key: string]: any}>({});
  
  // Save chart state (visible range, etc.) to restore when re-creating chart
  const chartState = useRef<{
    timeRange?: {from: number, to: number},
    priceRange?: {min: number, max: number}
  }>({});
  
  // Save the chart state when the chart is updated
  const saveChartState = useCallback(() => {
    if (chartInstance.current) {
      try {
        const visibleLogicalRange = chartInstance.current.timeScale().getVisibleLogicalRange();
        if (visibleLogicalRange) {
          chartState.current.timeRange = {
            from: visibleLogicalRange.from,
            to: visibleLogicalRange.to
          };
        }
        
        // Note: Save price range logic commented out due to API compatibility issues
        // The getVisiblePriceRange method isn't available in the current version
        // We'll rely on auto-scaling instead
        /*
        if (mainSeries.current) {
          const priceRange = mainSeries.current.priceScale().getVisiblePriceRange();
          if (priceRange) {
            chartState.current.priceRange = {
              min: priceRange.minValue,
              max: priceRange.maxValue
            };
          }
        }
        */
      } catch (error) {
        console.error('Error saving chart state:', error);
      }
    }
  }, []);

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
  
  // Define indicator data type
  type IndicatorDataType = {
    [key: string]: Array<{ time: UTCTimestamp, value: number, color?: string }>
  };
  
  // Format data for technical indicators
  const indicatorData = useMemo<IndicatorDataType>(() => {
    if (chartData.length === 0) return {} as IndicatorDataType;
    
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
      'MACD-Line': times.map((time, i) => ({ time, value: macd?.macd?.[i] ?? 0 })),
      'MACD-Signal': times.map((time, i) => ({ time, value: macd?.signal?.[i] ?? 0 })),
      'MACD-Histogram': times.map((time, i) => ({ 
        time, 
        value: macd?.histogram?.[i] ?? 0,
        color: macd?.histogram?.[i] && macd.histogram[i] >= 0 ? 'rgba(14, 203, 129, 0.5)' : 'rgba(232, 65, 66, 0.5)'
      })),
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
    
    // Log the number of data points for debugging
    if (formattedCandlesticks) {
      console.log(`Loading chart with ${formattedCandlesticks.length} data points for ${symbol} (${timeframe})`);
    }
    
    // Save chart view state before removing old chart
    if (chartInstance.current) {
      // Use the saveChartState utility function to save the current state
      saveChartState();
      
      // Remove the old chart
      chartInstance.current.remove();
      mainSeries.current = null;
      volumeSeries.current = null;
      indicatorSeries.current = {};
      patternMarkers.current = {};
      divergenceLines.current = {};
    }
    
    // Create a new chart with current dimensions and improved interactivity
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0F1929' },
        textColor: '#B7BDC6',
        fontSize: 12, // Slightly larger text for better readability
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.15 : 0.05, // Smaller volume area
        },
        // Make price scale more user-friendly
        mode: 0, // Normal auto-scale
        autoScale: true,
        alignLabels: true,
        borderVisible: true,
        entireTextOnly: false,
        ticksVisible: true,
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        // Enhance time scale interactivity
        rightOffset: 12,
        barSpacing: 6, // Reasonable default spacing
        minBarSpacing: 2, // Allow zooming in quite far
        lockVisibleTimeRangeOnResize: false, // Allow resize to show all available data
        rightBarStaysOnScroll: true,
        borderVisible: true,
        visible: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          labelBackgroundColor: '#2a2e39',
        },
        horzLine: {
          labelBackgroundColor: '#2a2e39',
        },
      },
      handleScroll: {
        vertTouchDrag: true,
        // Better scrolling behavior
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        mouseWheel: true,
        pinch: true,
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
    
    // Volume series with reduced size
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
      
      // Configure the volume scale to be much smaller
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.9,  // This places volume in just the bottom 10% of the chart
          bottom: 0.05,
        },
        visible: true,
      });
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
              // Use the correct CreatePriceLineOptions type that requires a price field
              mainSeriesRef.createPriceLine({
                price: fib.value,
                color: fib.color,
                lineWidth: 1,
                lineStyle: 1, // Solid
                axisLabelVisible: true,
                title: `Fib ${fib.level}`,
              });
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
    // Keep the main chart at 60% of the total height to give more space to indicators
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: '#0F1929' },
        textColor: '#B7BDC6',
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.05, // Almost to the top
          bottom: 0.40, // Main chart takes 60% of the space now
        },
      },
    });
    
    let paneCount = 0;
    
    // Create separate panes for each indicator
    // Process each oscillator
    oscillators.forEach(oscillator => {
      if (oscillator.name === 'RSI' && indicatorData['RSI']) {
        // Add RSI pane only if it's expanded
        if (expandedPanels['RSI']) {
          const rsiPane = chart.addSeries(LineSeries, {
            color: oscillator.color,
            lineWidth: 1,
            priceScaleId: 'rsi',
          });
          
          paneCount++;
          
          // Add RSI lines
          rsiPane.setData(indicatorData['RSI'] as LineData[]);
          
          // Add RSI overbought/oversold levels with the correct number values
          rsiPane.createPriceLine({
            price: Number(oscillator.settings.overbought), // Ensure it's a number
            color: 'rgba(232, 65, 66, 0.5)',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: 'Overbought'
          });
          
          rsiPane.createPriceLine({
            price: Number(oscillator.settings.oversold), // Ensure it's a number
            color: 'rgba(14, 203, 129, 0.5)',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: 'Oversold'
          });
          
          // Set RSI scale with improved spacing
          chart.priceScale('rsi').applyOptions({
            scaleMargins: {
              // Give RSI more vertical space (positioned at the top of the indicator area)
              top: 0.62,
              bottom: 0.23,
            },
            visible: true,
            autoScale: true,
          });
          
          indicatorSeries.current['RSI'] = rsiPane;
        }
      }
      
      if (oscillator.name === 'MACD' && 
          indicatorData['MACD-Line'] && 
          indicatorData['MACD-Signal'] &&
          indicatorData['MACD-Histogram']) {
        // Add MACD pane only if it's expanded
        if (expandedPanels['MACD']) {
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
          
          // Set histogram data directly with proper null check
          // The colors are already set in the indicatorData setup
          if (indicatorData['MACD-Histogram'] && Array.isArray(indicatorData['MACD-Histogram'])) {
            macdHistPane.setData(indicatorData['MACD-Histogram'] as any[]);
          } else {
            // authentic - create an empty array if MACD-Histogram doesn't exist
            macdHistPane.setData([]);
          }
          
          // Set MACD scale with better spacing
          chart.priceScale('macd').applyOptions({
            scaleMargins: {
              // Position MACD below RSI with good spacing
              top: 0.80,
              bottom: 0.12,
            },
            visible: true,
            autoScale: true,
          });
          
          indicatorSeries.current['MACD-Line'] = macdLinePane;
          indicatorSeries.current['MACD-Signal'] = macdSignalPane;
          indicatorSeries.current['MACD-Histogram'] = macdHistPane;
          
          paneCount++;
        }
      }
      
      if (oscillator.name === 'Stochastic' &&
          indicatorData['Stochastic-K'] &&
          indicatorData['Stochastic-D']) {
        // Add Stochastic pane only if it's expanded
        if (expandedPanels['Stochastic']) {
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
            title: 'Overbought'
          });
          
          stochKPane.createPriceLine({
            price: 20,
            color: 'rgba(14, 203, 129, 0.5)',
            lineWidth: 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: 'Oversold'
          });
          
          // Set Stochastic scale with better spacing
          chart.priceScale('stoch').applyOptions({
            scaleMargins: {
              // Place Stochastic at the bottom with good spacing from MACD
              top: 0.90,
              bottom: 0.05,
            },
            visible: true,
            autoScale: false,
            // Fixed mode with specific range (0-100 for Stochastic)
            mode: 2, // PriceScaleMode.Fixed = 2
          });
          
          indicatorSeries.current['Stochastic-K'] = stochKPane;
          indicatorSeries.current['Stochastic-D'] = stochDPane;
          
          paneCount++;
        }
      }
      
      if (oscillator.name === 'ADX' &&
          indicatorData['ADX'] &&
          indicatorData['ADX-DI+'] &&
          indicatorData['ADX-DI-']) {
        // Add ADX pane only if it's expanded
        if (expandedPanels['ADX']) {
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
          
          // Set ADX scale with better spacing
          chart.priceScale('adx').applyOptions({
            scaleMargins: {
              top: 0.85,
              bottom: 0.05,
            },
            visible: true,
            autoScale: false,
            // Using fixed range for ADX (0-100)
            mode: 2, // PriceScaleMode.Fixed = 2
          });
          
          indicatorSeries.current['ADX'] = adxPane;
          indicatorSeries.current['ADX-DI+'] = diPlusPane;
          indicatorSeries.current['ADX-DI-'] = diMinusPane;
          
          paneCount++;
        }
      }
      
      if (oscillator.name === 'ATR' && indicatorData['ATR']) {
        // Add ATR pane only if it's expanded
        if (expandedPanels['ATR']) {
          const atrPane = chart.addSeries(LineSeries, {
            color: oscillator.color,
            lineWidth: 1,
            priceScaleId: 'atr',
          });
          
          paneCount++;
          
          // Set ATR data
          if (indicatorData['ATR']) atrPane.setData(indicatorData['ATR'] as LineData[]);
          
          // Set ATR scale with better spacing
          chart.priceScale('atr').applyOptions({
            scaleMargins: {
              top: 0.9,
              bottom: 0.05,
            },
            visible: true,
            autoScale: true,
          });
          
          indicatorSeries.current['ATR'] = atrPane;
        }
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
    
    // Add event listeners to track chart state changes when user interacts with the chart
    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (range) {
        console.log('Chart timeRange changed:', range);
        chartState.current.timeRange = {
          from: range.from,
          to: range.to
        };
      }
    });
    
    // Add listener for price scale changes too
    if (mainSeriesRef) {
      const priceScale = mainSeriesRef.priceScale();
      if (priceScale) {
        // Store options when they change
        const options = priceScale.options();
        console.log('Current price scale options:', options);
      }
    }
    
    // Restore the previous view state if available
    if (chartState.current.timeRange) {
      try {
        console.log('Restoring chart timeRange:', chartState.current.timeRange);
        // Restore time range
        chart.timeScale().setVisibleLogicalRange(chartState.current.timeRange);
      } catch (error) {
        console.log('Error restoring time range:', error);
        // If restoring fails, fit content
        chart.timeScale().fitContent();
      }
    } else {
      // If no saved state, fit content
      chart.timeScale().fitContent();
    }
    
    // Restore price range if available
    if (chartState.current.priceRange && mainSeriesRef) {
      try {
        // First turn off auto-scaling
        mainSeriesRef.priceScale().applyOptions({
          autoScale: false
        });
        
        // Wait a bit to let the chart initialize properly
        setTimeout(() => {
          // Since the specific minimumValue/maximumValue properties aren't available
          // in the PriceScaleOptions type, we'll use a different approach
          if (mainSeries.current && chartInstance.current) {
            // First fit content to get a baseline
            chartInstance.current.timeScale().fitContent();
            
            // Then manually zoom to a specific price range by applying a scale factor
            const currentRange = mainSeries.current.priceScale().options();
            
            // Ensure autoScale is off
            mainSeries.current.priceScale().applyOptions({
              autoScale: false
            });
            
            // Use coordinateToPrice to set the visible range
            // Note: Since we can't directly set the range,
            // we'll make the chart show this area by updating chart options
            chartInstance.current.applyOptions({
              rightPriceScale: {
                autoScale: false
              }
            });
          }
        }, 100);
      } catch (error) {
        console.log('Error restoring price range:', error);
        // If restoring manual price range fails, use auto scale
        if (mainSeriesRef) {
          mainSeriesRef.priceScale().applyOptions({
            autoScale: true
          });
        }
      }
    }
    
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
    timeframe,
    expandedPanels
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
  
  // Toggle panel expansion/collapse
  const togglePanelExpansion = (panelName: string) => {
    console.log('Toggling panel:', panelName, 'Current state:', expandedPanels[panelName]);
    setExpandedPanels(prev => {
      const newState = {
        ...prev,
        [panelName]: !prev[panelName]
      };
      console.log('New panel state:', newState);
      return newState;
    });
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
    <div className="mb-3 bg-[#0F1929] rounded-lg overflow-hidden shadow-lg mx-2">
      {/* Chart header with DexScreener style */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center p-3 bg-[#121926] border-b border-[#1E2C3E]">
          <h2 className="text-white text-base font-medium">{symbol} Chart</h2>
          
          <div className="flex space-x-3">
            {/* Chart type selector - DexScreener style */}
            <div className="flex rounded-md bg-[#1E2C3E] p-0.5">
              <button
                className={`px-3 py-1 text-xs rounded-md ${
                  chartType === 'candles' 
                    ? 'bg-gradient-to-r from-[#3772FF] to-[#2359F9] text-white font-medium' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => handleChartTypeChange('candles')}
                title="Candlestick Chart"
              >
                Candles
              </button>
              <button
                className={`px-3 py-1 text-xs rounded-md ${
                  chartType === 'line' 
                    ? 'bg-gradient-to-r from-[#3772FF] to-[#2359F9] text-white font-medium' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => handleChartTypeChange('line')}
                title="Line Chart"
              >
                Line
              </button>
              <button
                className={`px-3 py-1 text-xs rounded-md ${
                  chartType === 'area' 
                    ? 'bg-gradient-to-r from-[#3772FF] to-[#2359F9] text-white font-medium' 
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => handleChartTypeChange('area')}
                title="Area Chart"
              >
                Area
              </button>
            </div>
            
            {/* Timeframe selector - DexScreener style */}
            <div className="flex items-center">
              <div className="flex space-x-1">
                {(showAllTimeframes ? timeframes : visibleTimeframes).map((tf: string) => (
                  <button
                    key={tf}
                    className={`py-1 px-2 text-xs font-medium rounded-md ${
                      tf === timeframe 
                        ? 'bg-gradient-to-r from-[#3772FF] to-[#2359F9] text-white' 
                        : 'bg-[#1E2C3E] text-gray-300 hover:bg-[#2A3A50]'
                    }`}
                    onClick={() => onChangeTimeframe(tf as TimeFrame)}
                  >
                    {tf}
                  </button>
                ))}
                <button
                  className="py-1 px-2 text-xs font-medium rounded-md bg-[#1E2C3E] text-gray-300 hover:bg-[#2A3A50]"
                  onClick={toggleAllTimeframes}
                  title={showAllTimeframes ? "Show fewer timeframes" : "Show all timeframes"}
                >
                  {showAllTimeframes ? "−" : "+"}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chart and legend layout */}
        <div className="flex">
          {/* Chart container - DexScreener style */}
          <div className="flex-grow">
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-[#0F1929] bg-opacity-80 flex items-center justify-center z-10">
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-white font-medium">Loading chart...</span>
                  </div>
                </div>
              )}
              
              <div 
                ref={chartContainerRef}
                className="w-full h-[500px] relative bg-[#0F1929]"
              />
            </div>
          </div>
          
          {/* Legend and controls - DexScreener style */}
          {showLegend && (
            <div className="w-56 flex flex-col bg-[#121926] border-l border-[#1E2C3E]">
              <div className="p-3">
                <div className="flex justify-between items-center mb-3 border-b border-[#1E2C3E] pb-2">
                  <h3 className="text-[13px] font-medium text-white">Indicator Settings</h3>
                  <button
                    className="text-xs text-gray-400 hover:text-white"
                    onClick={() => setShowLegend(false)}
                    title="Hide settings"
                  >
                    ×
                  </button>
                </div>
                
                {/* Group indicators by category - DexScreener style */}
                {Object.values(IndicatorCategory).map(category => {
                  const categoryIndicators = activeIndicators.filter(i => i.category === category);
                  if (categoryIndicators.length === 0) return null;
                  
                  return (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-medium text-blue-400 mb-2">{category}</h4>
                      {categoryIndicators.map(indicator => {
                        const canExpand = ['RSI', 'MACD', 'Stochastic', 'ADX', 'ATR'].includes(indicator.name);
                        
                        return (
                          <div 
                            key={indicator.name} 
                            className="flex items-center mb-2 py-1.5 px-2 rounded-md hover:bg-[#1E2C3E]"
                          >
                            <input
                              type="checkbox"
                              id={`indicator-${indicator.name}`}
                              checked={indicator.enabled}
                              onChange={() => toggleIndicator(indicator.name)}
                              className="mr-2 h-3.5 w-3.5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                            />
                            <span 
                              className="h-3 w-3 rounded-full mr-2" 
                              style={{ backgroundColor: indicator.color }}
                            ></span>
                            <label 
                              htmlFor={`indicator-${indicator.name}`}
                              className="text-xs text-gray-200 cursor-pointer"
                            >
                              {indicator.name}
                            </label>
                            
                            {canExpand && indicator.enabled && (
                              <button
                                className="ml-auto flex items-center justify-center w-6 h-6 text-xs bg-[#1E2C3E] text-gray-300 hover:bg-[#2A3A50] rounded-md"
                                onClick={() => togglePanelExpansion(indicator.name)}
                                title={expandedPanels[indicator.name] ? "Collapse" : "Expand"}
                              >
                                {expandedPanels[indicator.name] ? "▼" : "▶"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                
                {/* Volume toggle - DexScreener style */}
                <div className="py-1.5 px-2 rounded-md hover:bg-[#1E2C3E] mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show-volume"
                      checked={showVolume}
                      onChange={() => setShowVolume(!showVolume)}
                      className="mr-2 h-3.5 w-3.5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="h-3 w-3 bg-[#607D8B] rounded-full mr-2"></span>
                    <label htmlFor="show-volume" className="text-xs text-gray-200 cursor-pointer">
                      Volume
                    </label>
                  </div>
                </div>
                
                {/* Pattern detection section - DexScreener style */}
                <div className="border-t border-[#1E2C3E] pt-3 mt-2">
                  <h3 className="text-[13px] font-medium text-white mb-2">
                    Detected Patterns
                  </h3>
                  {renderPatternLegend()}
                </div>
              </div>
            </div>
          )}
          
          {/* Show legend button (when hidden) - DexScreener style */}
          {!showLegend && (
            <button
              className="w-8 h-8 bg-[#121926] border-l border-[#1E2C3E] flex items-center justify-center text-gray-300 hover:text-white"
              onClick={() => setShowLegend(true)}
              title="Show settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartComponent;
