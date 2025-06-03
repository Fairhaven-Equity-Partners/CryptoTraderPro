/**
 * Optimized Dashboard Controller
 * 
 * Streamlined logic for the main signal dashboard
 * Eliminates redundant calculations and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeFrame, AdvancedSignal, TradeRecommendation } from '../types';
import { initPriceManager, subscribeToPrice, subscribeToCalculations, updateChartData } from './streamlinedPriceManager';
import { calculateUnifiedSignal } from './unifiedCalculationCore';

// Simplified timeframes (removed 12h as it's causing indexing errors)
export const OPTIMIZED_TIMEFRAMES: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

// Performance tracking
let lastUpdateTime = 0;
let calculationCount = 0;

/**
 * Main dashboard hook - optimized version
 */
export function useOptimizedDashboard(symbol: string) {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({} as any);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [tradeRecommendation, setTradeRecommendation] = useState<TradeRecommendation | null>(null);
  
  // Data storage
  const chartDataRef = useRef<Record<TimeFrame, any[]>>({} as any);
  const priceSubscriptionRef = useRef<(() => void) | null>(null);
  const calculationSubscriptionRef = useRef<(() => void) | null>(null);
  
  // Initialize price manager
  useEffect(() => {
    initPriceManager();
    
    // Subscribe to price updates
    priceSubscriptionRef.current = subscribeToPrice((price: number) => {
      setCurrentPrice(price);
      lastUpdateTime = Date.now();
    });
    
    // Subscribe to calculation results
    calculationSubscriptionRef.current = subscribeToCalculations((results: Record<TimeFrame, AdvancedSignal>) => {
      setSignals(results);
      setIsCalculating(false);
      calculationCount++;
      
      // Update trade recommendation for selected timeframe
      if (results[selectedTimeframe]) {
        updateTradeRecommendation(results[selectedTimeframe]);
      }
    });
    
    return () => {
      priceSubscriptionRef.current?.();
      calculationSubscriptionRef.current?.();
    };
  }, []);
  
  // Handle chart data updates
  const handleChartDataUpdate = useCallback((timeframe: TimeFrame, data: any[]) => {
    chartDataRef.current[timeframe] = data;
    updateChartData(timeframe, data);
  }, []);
  
  // Generate trade recommendation
  const updateTradeRecommendation = useCallback((signal: AdvancedSignal) => {
    if (!signal) return;
    
    const recommendation: TradeRecommendation = {
      direction: signal.direction,
      confidence: signal.confidence,
      entry: signal.entryPrice,
      stopLoss: signal.stopLoss || signal.entryPrice * 0.98,
      takeProfits: [signal.takeProfit || signal.entryPrice * 1.02],
      leverage: 2, // Conservative default
      timeframe: signal.timeframe,
      summary: `${signal.direction} signal with ${signal.confidence.toFixed(1)}% confidence`,
      keyIndicators: ['RSI', 'MACD', 'Bollinger Bands']
    };
    
    setTradeRecommendation(recommendation);
  }, []);
  
  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    
    // Update recommendation for new timeframe
    if (signals[timeframe]) {
      updateTradeRecommendation(signals[timeframe]);
    }
  }, [signals]);
  
  // Format currency
  const formatCurrency = useCallback((price: number): string => {
    if (!price || isNaN(price)) return '$0.00';
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);
  
  // Get signal background class
  const getSignalBgClass = useCallback((direction: string): string => {
    switch (direction) {
      case 'LONG': return 'bg-green-900/50 border-green-500';
      case 'SHORT': return 'bg-red-900/50 border-red-500';
      default: return 'bg-gray-900/50 border-gray-500';
    }
  }, []);
  
  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const timeSinceLastUpdate = Date.now() - lastUpdateTime;
    return {
      calculationCount,
      timeSinceLastUpdate,
      isRealTime: timeSinceLastUpdate < 30000 // Within 30 seconds
    };
  }, []);
  
  return {
    // State
    currentPrice,
    signals,
    isCalculating,
    selectedTimeframe,
    tradeRecommendation,
    
    // Actions
    handleChartDataUpdate,
    handleTimeframeSelect,
    
    // Utilities
    formatCurrency,
    getSignalBgClass,
    getPerformanceMetrics,
    
    // Constants
    timeframes: OPTIMIZED_TIMEFRAMES
  };
}