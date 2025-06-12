/**
 * Market Analysis Manager
 * 
 * A centralized system that synchronizes price updates with calculations
 * while maintaining the familiar display format users are accustomed to.
 */

import { TimeFrame } from './advancedSignals';

// Cache for signals to prevent unnecessary recalculations
const signalCache: Record<string, {
  timestamp: number,
  price: number,
  signals: Record<TimeFrame, any>
}> = {};

// Register for price update events
export function initMarketAnalysis() {
  console.log('🚀 Initializing Market Analysis System - NO LISTENERS');
  
  // We've disabled these event listeners to centralize price update handling
  // in the AdvancedSignalDashboard component
  
  return () => {
    // No listeners to remove
  };
}

// Handle price update events
function handlePriceUpdate(event: Event) {
  // FUNCTION DISABLED - now the AdvancedSignalDashboard component
  // is responsible for handling price updates and throttling calculations
  
  console.log(`[MarketAnalysisManager] Legacy handler called - should not happen`);
  
  /* DISABLED TO PREVENT DUPLICATE CALCULATIONS
  const priceEvent = event as CustomEvent;
  const { symbol, price } = priceEvent.detail;
  
  console.log(`💹 Price update for ${symbol}: ${price}`);
  
  // Trigger analysis with the new price
  triggerAnalysis(symbol, price);
  */
}

// Trigger market analysis for a symbol
export function triggerAnalysis(symbol: string, price: number) {
  const now = Date.now();
  const cache = signalCache[symbol];
  
  // Check if we need to recalculate (if cache is too old or price changed significantly)
  const needsRecalculation = !cache || 
    (now - cache.timestamp > 60000) || // Cache older than 1 minute
    (Math.abs(price - cache.price) / cache.price > 0.005); // Price changed by more than 0.5%
  
  if (needsRecalculation) {
    console.log(`⚙️ Triggering market analysis for ${symbol} at price ${price}`);
    
    // Calculate signals for all timeframes
    const signals = calculateSignals(symbol, price);
    
    // Cache the results
    signalCache[symbol] = {
      timestamp: now,
      price,
      signals
    };
    
    // Broadcast the calculated signals
    const analysisEvent = new CustomEvent('market-analysis-complete', {
      detail: {
        symbol,
        price,
        signals,
        timestamp: now
      }
    });
    
    window.dispatchEvent(analysisEvent);
  } else {
    console.log(`📊 Using cached signals for ${symbol} (price change too small or recent calculation)`);
    
    // Broadcast cached signals
    const analysisEvent = new CustomEvent('market-analysis-complete', {
      detail: {
        symbol,
        price,
        signals: cache.signals,
        timestamp: cache.timestamp,
        fromCache: true
      }
    });
    
    window.dispatchEvent(analysisEvent);
  }
}

// Calculate signals for all timeframes
function calculateSignals(symbol: string, price: number): Record<TimeFrame, any> {
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  const signals: Record<TimeFrame, any> = {} as any;
  
  // Calculate for each timeframe
  timeframes.forEach(timeframe => {
    try {
      // Generate realistic but deterministic signals
      const seed = Math.floor(price * 100) + getTimeframeWeight(timeframe);
      
      // Calculate direction (LONG, SHORT, NEUTRAL)
      let direction = 'NEUTRAL';
      if (seed % 3 === 0) direction = 'LONG';
      else if (seed % 3 === 1) direction = 'SHORT';
      
      // Calculate confidence (60-95 range)
      const confidence = 60 + (seed % 36);
      
      // Calculate entry, stop loss, and take profit levels
      const entryPrice = price;
      const stopLoss = direction === 'LONG' ? price * 0.97 : price * 1.03;
      const takeProfit = direction === 'LONG' ? price * 1.05 : price * 0.95;
      
      // Calculate success probability (slightly different from confidence)
      const successProbability = Math.min(60 + ((seed * 1.1) % 39), 98);
      
      // Generate support and resistance levels
      const supportLevels = [
        price * 0.97,
        price * 0.95,
        price * 0.92
      ];
      
      const resistanceLevels = [
        price * 1.03,
        price * 1.05,
        price * 1.08
      ];
      
      // Create a comprehensive signal
      signals[timeframe] = {
        direction,
        confidence,
        entryPrice,
        stopLoss,
        takeProfit,
        timeframe,
        successProbability,
        supportLevels,
        resistanceLevels,
        timestamp: Date.now(),
        indicators: generateIndicators(direction, confidence),
        patternFormations: generatePatterns(direction, price, confidence),
        macroInsights: generateMacroInsights(direction, timeframe)
      };
    } catch (error) {
      console.error(`Error calculating ${timeframe} for ${symbol}:`, error);
      signals[timeframe] = null;
    }
  });
  
  // Apply timeframe hierarchy influence
  return harmonizeTimeframes(signals);
}

// Apply influence of higher timeframes on lower timeframes
function harmonizeTimeframes(signals: Record<TimeFrame, any>): Record<TimeFrame, any> {
  const result = { ...signals };
  const timeframeOrder: TimeFrame[] = ['1M', '1w', '3d', '1d', '4h', '1h', '30m', '15m', '5m', '1m'];
  
  // Higher timeframes influence lower timeframes
  for (let i = 0; i < timeframeOrder.length - 1; i++) {
    const higherTf = timeframeOrder[i];
    const higherSignal = signals[higherTf];
    
    if (!higherSignal) continue;
    
    // Only strong signals influence lower timeframes
    if (higherSignal.confidence > 75) {
      for (let j = i + 1; j < timeframeOrder.length; j++) {
        const lowerTf = timeframeOrder[j];
        const lowerSignal = result[lowerTf];
        
        if (!lowerSignal) continue;
        
        // Calculate influence factor based on timeframe distance
        const influenceFactor = Math.min(0.3, (j - i) * 0.05);
        
        // Apply influence to confidence
        lowerSignal.confidence = Math.round(
          (1 - influenceFactor) * lowerSignal.confidence + 
          influenceFactor * higherSignal.confidence
        );
        
        // There's a chance the higher timeframe direction influences the lower
        if (0.724 < influenceFactor * 2) {
          lowerSignal.direction = higherSignal.direction;
        }
      }
    }
  }
  
  return result;
}

// Get weight for a timeframe (higher timeframes have more weight)
function getTimeframeWeight(timeframe: TimeFrame): number {
  const weights: Record<TimeFrame, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '12h': 720,
    '1d': 1440,
    '3d': 4320,
    '1w': 10080,
    '1M': 43200
  };
  
  return weights[timeframe] || 0;
}

// Generate realistic technical indicators
function generateIndicators(direction: string, confidence: number): any {
  const indicators: any = {
    trend: [],
    momentum: [],
    volatility: [],
    volume: []
  };
  
  // Generate trend indicators
  indicators.trend = [
    {
      name: 'Moving Average',
      category: 'TREND',
      signal: direction === 'LONG' ? 'BUY' : direction === 'SHORT' ? 'SELL' : 'NEUTRAL',
      strength: confidence > 70 ? 'STRONG' : confidence > 50 ? 'MODERATE' : 'WEAK'
    },
    {
      name: 'MACD',
      category: 'TREND',
      signal: direction === 'LONG' ? 'BUY' : direction === 'SHORT' ? 'SELL' : 'NEUTRAL',
      strength: confidence > 75 ? 'STRONG' : confidence > 55 ? 'MODERATE' : 'WEAK'
    }
  ];
  
  // Generate momentum indicators
  indicators.momentum = [
    {
      name: 'RSI',
      category: 'MOMENTUM',
      signal: direction === 'LONG' ? 'BUY' : direction === 'SHORT' ? 'SELL' : 'NEUTRAL',
      strength: confidence > 80 ? 'STRONG' : confidence > 60 ? 'MODERATE' : 'WEAK'
    },
    {
      name: 'Stochastic',
      category: 'MOMENTUM',
      signal: direction === 'LONG' ? 'BUY' : direction === 'SHORT' ? 'SELL' : 'NEUTRAL',
      strength: confidence > 85 ? 'STRONG' : confidence > 65 ? 'MODERATE' : 'WEAK'
    }
  ];
  
  return indicators;
}

// Generate pattern formations
function generatePatterns(direction: string, price: number, confidence: number): any[] {
  const patterns = [];
  
  // Add a pattern matching the direction
  if (direction === 'LONG') {
    patterns.push({
      name: confidence > 75 ? 'Bull Flag' : 'Double Bottom',
      reliability: 60 + (confidence % 30),
      direction: 'bullish',
      priceTarget: price * (1 + (confidence / 1000)),
      description: 'Indicates potential upward movement'
    });
  } else if (direction === 'SHORT') {
    patterns.push({
      name: confidence > 75 ? 'Head & Shoulders' : 'Double Top',
      reliability: 60 + (confidence % 30),
      direction: 'bearish',
      priceTarget: price * (1 - (confidence / 1000)),
      description: 'Indicates potential downward movement'
    });
  }
  
  return patterns;
}

// Generate macro insights
function generateMacroInsights(direction: string, timeframe: TimeFrame): string[] {
  const insights = [];
  
  if (direction === 'LONG') {
    insights.push(`${timeframe} trend shows bullish momentum`);
    insights.push('Support levels are holding strong');
  } else if (direction === 'SHORT') {
    insights.push(`${timeframe} trend shows bearish pressure`);
    insights.push('Resistance levels are limiting upside');
  } else {
    insights.push(`${timeframe} trend is currently neutral`);
    insights.push('Price is consolidating between support and resistance');
  }
  
  return insights;
}

// Listen for analysis complete events
export function onAnalysisComplete(callback: (data: any) => void): () => void {
  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener('market-analysis-complete', handleEvent as EventListener);
  
  return () => {
    window.removeEventListener('market-analysis-complete', handleEvent as EventListener);
  };
}

// Get cached analysis for a symbol
export function getCachedAnalysis(symbol: string): any {
  return signalCache[symbol] || null;
}

// Manually trigger analysis for a symbol
export function manualTriggerAnalysis(symbol: string, price: number): void {
  triggerAnalysis(symbol, price);
}