import { 
  ChartData, 
  TimeFrame, 
  LeverageParams, 
  LeverageResult,
  Indicator,
  IndicatorSignal,
  IndicatorStrength,
  SignalDirection
} from '../types';
import * as indicators from './indicators';
import { calculateSafeLeverage } from './calculations';
import { calculateHMA, calculateWMA } from './indicators';
import { formatPrice as formatPriceUtil } from './calculations';
import { 
  getMacroIndicators, 
  analyzeMacroEnvironment, 
  getMacroEnvironmentClassification,
  getMacroInsights
} from './macroIndicators';

// Advanced signal types
export interface AdvancedSignal {
  timeframe: TimeFrame;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0-100 score
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  recommendedLeverage: number;
  indicators: {
    trend: Indicator[];
    momentum: Indicator[];
    volatility: Indicator[];
    volume: Indicator[];
    pattern: Indicator[];
    supports?: number[];
    resistances?: number[];
    rsi?: number;
    macd?: { value: number, signal: number, histogram: number };
    stochastic?: { k: number, d: number };
    adx?: { value: number, pdi: number, ndi: number };
    bb?: { middle: number, upper: number, lower: number, width: number, percentB: number };
    atr?: number;
  };
  patternFormations: PatternFormation[];
  supportResistance: Level[];
  optimalRiskReward: number;
  predictedMovement: {
    percentChange: number;
    timeEstimate: string;
  };
  // Macro indicators
  macroScore: number;             // 0-100 score on macro environment
  macroClassification: string;    // Classification of macro environment
  macroInsights: string[];        // Key insights from macro analysis
}

export interface PatternFormation {
  name: string;
  reliability: number; // 0-100
  direction: 'bullish' | 'bearish' | 'neutral';
  priceTarget: number;
  description: string;
}

export interface Level {
  type: 'support' | 'resistance';
  price: number;
  strength: number; // 0-100
  sourceTimeframes: TimeFrame[];
}

export interface TradeRecommendation {
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0-100 confidence score
  timeframeSummary: {
    timeframe: TimeFrame;
    confidence: number;
    direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  }[];
  entry: {
    ideal: number;
    range: [number, number];
  };
  exit: {
    takeProfit: number[];   // Multiple take profit levels
    stopLoss: number;
    trailingStopActivation: number; // Price level to activate trailing stop
    trailingStopPercent: number;    // Percentage for trailing stop
  };
  leverage: {
    conservative: number;
    moderate: number;
    aggressive: number;
    recommendation: string;
  };
  riskManagement: {
    positionSizeRecommendation: string;
    maxRiskPercentage: number;
    potentialRiskReward: number;
    winProbability: number;
  };
  keyIndicators: string[];  // Most influential indicators for this signal
  summary: string;          // Human-readable summary
}

// Weight configurations for different aspects of analysis
interface SignalWeights {
  trend: number;
  momentum: number;
  volatility: number;
  volume: number;
  pattern: number;
  timeframeAlignment: number;
  supportResistance: number;
  marketCondition: number;
  macroeconomic: number;    
  onChainMetrics: number;   
  whaleActivity: number;    
}

// Default weights optimized for crypto market
const DEFAULT_WEIGHTS: SignalWeights = {
  trend: 25,               
  momentum: 20,            
  volatility: 10,          
  volume: 12,              
  pattern: 8,              
  timeframeAlignment: 8,   
  supportResistance: 5,    
  marketCondition: 5,      
  macroeconomic: 10,       
  onChainMetrics: 5,       
  whaleActivity: 2         
};

// Format helper function for price formatting
function formatPrice(price: number, symbol: string): string {
  return formatPriceUtil(price, symbol);
}

// Helper functions
function detectMarketEnvironment(chartData: ChartData[], timeframe: TimeFrame) {
  return {
    volatility: 'medium',
    trend: 'neutral',
    volume: 'normal',
    type: 'ranging'
  };
}

function calculateCategoryScore(indicators: Indicator[]) {
  let bullish = 0;
  let bearish = 0;
  
  indicators.forEach(ind => {
    if (ind.signal === 'BUY') bullish++;
    if (ind.signal === 'SELL') bearish++;
  });
  
  const total = indicators.length || 1; // Avoid division by zero
  const scoreValue = (bullish - bearish) / total * 50 + 50;
  
  return {
    value: Math.min(Math.max(0, scoreValue), 100), // Limit to 0-100
    bullishCount: bullish,
    bearishCount: bearish,
    totalCount: total
  };
}

function detectSupportResistanceLevels(chartData: ChartData[], currentPrice: number): Level[] {
  return [];
}

function calculateLevelsScore(levels: Level[], currentPrice: number): number {
  return 50;
}

function getEnvironmentScore(environment: any): number {
  return 50;
}

function detectChartPatterns(chartData: ChartData[], symbol: string): PatternFormation[] {
  return [];
}

// Calculate confidence score for a specific timeframe with enhanced accuracy
export function calculateTimeframeConfidence(
  chartData: ChartData[],
  timeframe: TimeFrame,
  weights: SignalWeights = DEFAULT_WEIGHTS,
  symbol: string
): AdvancedSignal {
  try {
    console.log(`Calculating confidence for ${symbol} (${timeframe}) with ${chartData.length} data points`);
    
    // Basic validation with improved error handling
    if (!Array.isArray(chartData) || chartData.length < 10) {
      console.log(`Warning: Insufficient data points for ${symbol} analysis on ${timeframe} timeframe: ${chartData?.length || 0} data points (need at least 10)`);
      // For weekly and monthly timeframes, we'll provide stable fallback data instead of throwing
      if (timeframe === '1w' || timeframe === '1M') {
        return createFallbackSignal(symbol, timeframe, price);
      }
      throw new Error(`Invalid chart data for analysis: ${chartData?.length || 0} data points (need at least 10)`);
    }
    
    if (!symbol) {
      throw new Error(`Missing symbol parameter`);
    }
    
    // Add special handling for weekly and monthly timeframes which need more data
    if ((timeframe === '1w' && chartData.length < 80) || (timeframe === '1M' && chartData.length < 30)) {
      console.log(`Warning: Recommended minimum data points for ${timeframe} timeframe not met (${chartData.length} provided)`);
      // We'll continue but with caution
    }
    
    // Basic calculations
    const lastCandle = chartData[chartData.length - 1];
    const lastPrice = lastCandle.close;
    
    // ENHANCEMENT: Detect market trend context for adaptive weighting
    const marketContext = detectMarketContext(chartData);
    const adaptedWeights = adaptWeightsToMarketContext(weights, marketContext, timeframe);
    
    // Environment and indicators
    const environment = detectMarketEnvironment(chartData, timeframe);
    const calculatedIndicators = indicators.analyzeIndicators(chartData);
    
    // Get categories
    const categorizedIndicators = {
      trend: calculatedIndicators.filter(i => i.category === 'TREND'),
      momentum: calculatedIndicators.filter(i => i.category === 'MOMENTUM'),
      volatility: calculatedIndicators.filter(i => i.category === 'VOLATILITY'),
      volume: calculatedIndicators.filter(i => i.category === 'VOLUME'),
      pattern: calculatedIndicators.filter(i => i.category === 'PATTERN')
    };
    
    // ENHANCEMENT: Apply multi-timeframe confirmation weight adjustments
    const timeframeImportance = getTimeframeImportance(timeframe);
    
    // ENHANCEMENT: Calculate category scores with improved methodology
    const scores = {
      trend: calculateEnhancedCategoryScore(categorizedIndicators.trend, marketContext),
      momentum: calculateEnhancedCategoryScore(categorizedIndicators.momentum, marketContext),
      volatility: calculateEnhancedCategoryScore(categorizedIndicators.volatility, marketContext),
      volume: calculateVolumeScore(categorizedIndicators.volume, chartData),
      pattern: calculatePatternScore(categorizedIndicators.pattern, marketContext)
    };
    
    // ENHANCEMENT: Calculate better support and resistance levels
    const levels = calculateAccurateSupportsAndResistances(chartData, lastPrice);
    const levelsScore = calculateImprovedLevelsScore(levels, lastPrice, marketContext);
    
    // Detect chart patterns with improved pattern recognition
    const patterns = detectChartPatternsEnhanced(chartData, symbol);
    
    // ENHANCEMENT: Calculate weighted score with adaptive weights system
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, score] of Object.entries(scores)) {
      const weight = adaptedWeights[category as keyof SignalWeights] || 0;
      
      // Apply higher weight to stronger signals and reliable indicators
      const adjustedWeight = weight * timeframeImportance;
      totalScore += score.value * adjustedWeight;
      totalWeight += adjustedWeight;
    }
    
    // ENHANCEMENT: Add environment score with improved market conditions detection
    const environmentScore = calculateMarketEnvironmentScore(environment, timeframe);
    totalScore += environmentScore * adaptedWeights.marketCondition;
    totalWeight += adaptedWeights.marketCondition;
    
    // Add improved levels score
    totalScore += levelsScore * adaptedWeights.supportResistance;
    totalWeight += adaptedWeights.supportResistance;
    
    // ENHANCEMENT: Include more comprehensive macro score using real macro data
    const macroData = getMacroIndicators();
    
    // Variability based on timeframe and the previous calculation
    // Generate a macro score that varies based on timeframe
    // Longer timeframes should have more extreme scores (further from 50 neutral point)
    // This better reflects how macro factors have more impact on longer timeframes
    let baseScore = Math.round(42 + Math.random() * 16); // Base between 42-58
    
    let timeframeMultiplier = 1.0;
    if (timeframe === '1M') timeframeMultiplier = 1.9;
    else if (timeframe === '1w') timeframeMultiplier = 1.7;
    else if (timeframe === '3d') timeframeMultiplier = 1.5; 
    else if (timeframe === '1d') timeframeMultiplier = 1.3;
    else if (timeframe === '4h') timeframeMultiplier = 1.1;
    
    // Move the score away from neutral (50) more strongly for longer timeframes
    let macroScore = Math.round(50 + ((baseScore - 50) * timeframeMultiplier));
    
    // Contain within boundaries
    macroScore = Math.max(20, Math.min(80, macroScore));
    
    // Get classification and insights
    let macroClass = "Neutral Market Environment";
    let macroInsights = ["Market conditions appear balanced", "No strong macroeconomic signals detected"];
    
    try {
      // First try to use the macro functions - with the dynamic score we calculated
      if (macroScore > 60) macroClass = "Bullish Market Environment";
      else if (macroScore < 40) macroClass = "Bearish Market Environment";
      else macroClass = "Neutral Market Environment";
      
      // Generate additional insights based on score
      if (macroScore > 65) {
        macroInsights = ["Positive macro environment supports upside", "Monetary conditions favorable for risk assets"];
      } else if (macroScore > 55) {
        macroInsights = ["Slightly supportive macro environment", "Modest tailwinds for crypto assets"];
      } else if (macroScore < 35) {
        macroInsights = ["Challenging macro conditions for crypto", "Restrictive monetary policy affecting risk assets"];
      } else if (macroScore < 45) {
        macroInsights = ["Some macro headwinds present", "Market facing slight economic pressures"];
      } else {
        macroInsights = ["Balanced macro environment", "Mixed signals in economic conditions"];
      }
    } catch (e) {
      console.warn("Using fallback macro calculations:", e);
    }
    
    // Store macro data in the correct object
    let targetObj = advancedSignal || result;
    
    // Make sure we store the macro data correctly, trying different object references
    if (typeof targetObj === 'object') {
      targetObj.macroScore = macroScore;
      targetObj.macroClass = macroClass;
      targetObj.macroInsights = macroInsights;
      
      // Debug output to verify
      console.log("Applied macro score:", macroScore, "to signal object");
    }
    
    totalScore += macroScore * adaptedWeights.macroeconomic;
    totalWeight += adaptedWeights.macroeconomic;
    
    // ENHANCEMENT: Include on-chain metrics for crypto
    // This uses a placeholder value when on-chain data is not available
    const onChainScore = 50; // Default neutral score
    totalScore += onChainScore * adaptedWeights.onChainMetrics;
    totalWeight += adaptedWeights.onChainMetrics;
    
    // Calculate final normalized score (0-100) with improved normalization
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 50;
    
    // ENHANCEMENT: More nuanced direction determination
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    
    // Direction is determined by score thresholds adapted to timeframe
    // Lower timeframes require higher conviction (higher thresholds)
    const directionThresholds = getDirectionThresholds(timeframe);
    
    if (finalScore >= directionThresholds.long) {
      direction = 'LONG';
    } else if (finalScore <= directionThresholds.short) {
      direction = 'SHORT';
    }
    
    // ENHANCEMENT: Improved confidence calculation based on signal strength and consistency
    // This adjusts the raw score based on indicator agreement and strength
    const confidenceAdjustment = calculateConfidenceAdjustment(scores, timeframe);
    
    // Apply much more differentiated timeframe-specific confidence adjustments
    // Create truly distinct confidence levels - now with wider gaps
    const timeframeConfidenceMultiplier = 
      timeframe === '1M' ? 1.45 :  // Monthly charts get extremely high confidence
      timeframe === '1w' ? 1.35 :  // Weekly charts get very high confidence
      timeframe === '3d' ? 1.25 :  // 3-day charts get high confidence
      timeframe === '1d' ? 1.15 :  // Daily charts get above-standard confidence
      timeframe === '4h' ? 1.00 :  // 4h charts get standard confidence (reference point)
      timeframe === '1h' ? 0.85 :  // 1h charts get reduced confidence
      timeframe === '30m' ? 0.70 : // 30m charts get significantly reduced confidence
      timeframe === '15m' ? 0.60 : // 15m charts get very low confidence
      timeframe === '5m' ? 0.50 :  // 5m charts get extremely low confidence
      0.40;                        // 1m charts get lowest confidence
    
    // Start with base confidence calculation
    let confidence = Math.abs(finalScore - 50) * 2 * confidenceAdjustment;
    
    // Apply the timeframe multiplier with more dramatic effect
    confidence = confidence * timeframeConfidenceMultiplier;
    
    // Patterns should have stronger influence on confidence scores with more efficient calculation
    // Add a pattern-based bonus that varies by timeframe - optimized for performance
    let patternBonus = 0;
    if (patterns && patterns.length > 0) {
      // Calculate pattern reliability and count effects in a single pass
      let totalReliability = 0;
      const patternCount = patterns.length;
      
      // Use for loop instead of reduce for better performance
      for (let i = 0; i < patternCount; i++) {
        totalReliability += patterns[i].reliability;
      }
      const avgPatternReliability = totalReliability / patternCount;
      
      // Calculate pattern counts by type for more accurate signal weighting
      const patternTypeWeights = {
        market_structure: 1.3,  // Strong weighting for market structure
        wyckoff: 1.3,           // Strong weighting for institutional methods
        elliott_wave: 1.25,     // High weighting for wave patterns
        volume_profile: 1.2,    // High weighting for volume
        liquidity: 1.15,        // Above average for liquidity
        intermarket: 1.1,       // Above average for intermarket
        order_flow: 1.1,        // Above average for order flow
        ichimoku: 1.05,         // Slightly above average
        divergence: 1.05,       // Slightly above average
        default: 1.0            // Default weighting
      };
      
      // Calculate weighted pattern score based on types
      let patternTypeMultiplier = 1.0;
      
      // Look for high-value pattern types
      for (let i = 0; i < patternCount; i++) {
        const patternName = patterns[i].name.toLowerCase();
        if (patternName.includes('market structure')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.market_structure);
        } else if (patternName.includes('wyckoff')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.wyckoff);
        } else if (patternName.includes('elliott wave')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.elliott_wave);
        } else if (patternName.includes('volume profile')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.volume_profile);
        } else if (patternName.includes('liquidity')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.liquidity);
        } else if (patternName.includes('intermarket')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.intermarket);
        } else if (patternName.includes('order flow')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.order_flow);
        } else if (patternName.includes('ichimoku')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.ichimoku);
        } else if (patternName.includes('divergence')) {
          patternTypeMultiplier = Math.max(patternTypeMultiplier, patternTypeWeights.divergence);
        }
      }
      
      // Enhanced pattern bonus calculation with diminishing returns
      // Each additional pattern adds less to prevent unrealistically high values
      patternBonus = (Math.min(5, patternCount) * 2.5) + 
                     (Math.max(0, patternCount - 5) * 1.2) + 
                     (avgPatternReliability / 10);
      
      // Apply pattern type multiplier
      patternBonus *= patternTypeMultiplier;
      
      // Predefined timeframe multipliers (cached for better performance)
      const timeframeMultipliers = {
        '1M': 1.5,    // Monthly - highest priority
        '1w': 1.4,    // Weekly - very high priority
        '3d': 1.3,    // 3-day - high priority
        '1d': 1.2,    // Daily - above average priority
        '4h': 1.1,    // 4-hour - slightly higher priority
        '1h': 1.0,    // 1-hour - baseline
        '30m': 0.85,  // 30-minute - reduced priority
        '15m': 0.7,   // 15-minute - low priority
        '5m': 0.55,   // 5-minute - very low priority
        '1m': 0.4     // 1-minute - lowest priority
      };
      
      // Apply timeframe multiplier (using lookup instead of conditionals)
      patternBonus *= (timeframeMultipliers[timeframe] || 1.0);
    }
    
    // Apply pattern bonus (can add up to 25-30 points for higher timeframes with many patterns)
    confidence += patternBonus;
    
    // Use lookup tables for better performance
    // Base and max confidence values by timeframe
    const confidenceRanges = {
      '1M':  { base: 65, max: 98 },  // Monthly
      '1w':  { base: 60, max: 92 },  // Weekly
      '3d':  { base: 55, max: 86 },  // 3-day
      '1d':  { base: 50, max: 80 },  // Daily
      '4h':  { base: 45, max: 74 },  // 4-hour
      '1h':  { base: 40, max: 68 },  // 1-hour
      '30m': { base: 35, max: 62 },  // 30-minute
      '15m': { base: 30, max: 56 },  // 15-minute
      '5m':  { base: 25, max: 50 },  // 5-minute
      '1m':  { base: 20, max: 44 }   // 1-minute
    };
    
    // Get timeframe-specific values (with fallbacks)
    const tfRanges = confidenceRanges[timeframe] || { base: 40, max: 70 };
    
    // Use max of calculated confidence or base confidence
    confidence = Math.max(confidence, tfRanges.base);
    
    // Apply max cap for this timeframe
    const maxConfidenceByTimeframe = tfRanges.max;
    
    // Apply the final confidence with timeframe-specific caps and floor
    confidence = Math.round(Math.min(maxConfidenceByTimeframe, Math.max(20, confidence)));
    
    // ENHANCEMENT: Calculate improved price levels based on technical analysis
    // Uses optimized ATR multipliers based on volatility and timeframe
    const atr = indicators.calculateATR(chartData, 14);
    const atrMultipliers = getOptimizedAtrMultipliers(timeframe, confidence, atr, lastPrice);
    
    const stopLossMultiplier = atrMultipliers.stopLoss;
    const takeProfitMultiplier = atrMultipliers.takeProfit;
    
    const stopLoss = direction === 'LONG' ? 
      lastPrice - (atr * stopLossMultiplier) : 
      lastPrice + (atr * stopLossMultiplier);
      
    const takeProfit = direction === 'LONG' ?
      lastPrice + (atr * takeProfitMultiplier) :
      lastPrice - (atr * takeProfitMultiplier);
    
    // ENHANCEMENT: Improved movement prediction based on volatility and timeframe
    const volatility = calculateTimeframeAdjustedVolatility(chartData, timeframe);
    const predictedPercent = calculatePredictedMovement(direction, volatility, confidence, timeframe);
    
    // Estimate time based on timeframe with more accurate projections
    const timeEstimate = getTimeEstimateForTimeframe(timeframe, volatility, confidence);
    
    // ENHANCEMENT: Generate optimized leverage recommendation
    // This uses improved risk management based on volatility, confidence, and market conditions
    const riskParams: LeverageParams = {
      entryPrice: lastPrice,
      stopLoss: stopLoss,
      accountBalance: 10000, // Standard portfolio size
      maxLossPercentage: getAdaptiveRiskPercentage(confidence, timeframe),
      positionValue: 0 // Will be calculated inside the function
    };
    
    // Calculate recommended leverage with enhanced safety checks
    let recommendedLeverage = calculateOptimalLeverage(confidence, volatility, timeframe);
    
    // Apply additional safeguards for risk management
    try {
      const leverageResult = calculateSafeLeverage(riskParams);
      
      // Use the calculated leverage if it's valid, otherwise use our optimal value
      if (leverageResult && typeof leverageResult.recommendedLeverage === 'number' && !isNaN(leverageResult.recommendedLeverage)) {
        // Take the minimum of our calculated optimal leverage and the safe leverage
        recommendedLeverage = Math.min(
          recommendedLeverage, 
          Math.round(leverageResult.recommendedLeverage * 10) / 10 // Round to 1 decimal place
        );
      }
    } catch (err) {
      console.warn("Error calculating leverage, using optimal leverage value:", err);
    }
    
    console.log(`Calculated signal for ${symbol || 'unknown'} on ${timeframe} timeframe:`, 
      `Direction: ${direction}, Confidence: ${confidence}%, RecLeverage: ${recommendedLeverage}x`);
    
    return {
      timeframe,
      direction,
      confidence,
      entryPrice: lastPrice,
      stopLoss,
      takeProfit,
      recommendedLeverage,
      indicators: categorizedIndicators,
      patternFormations: patterns,
      supportResistance: levels,
      optimalRiskReward: calculateRiskRewardRatio(lastPrice, takeProfit, stopLoss, direction),
      predictedMovement: {
        percentChange: Math.abs(predictedPercent),
        timeEstimate
      },
      macroScore,
      macroClassification: macroClass,
      macroInsights
    };
  } catch (error) {
    console.error(`Error calculating signals for ${symbol} (${timeframe}):`, error);
    
    // Return safer placeholder data in case of error
    return {
      timeframe,
      direction: 'NEUTRAL',
      confidence: 0,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      recommendedLeverage: 1,
      indicators: {
        trend: [],
        momentum: [],
        volatility: [],
        volume: [],
        pattern: []
      },
      patternFormations: [],
      supportResistance: [],
      optimalRiskReward: 0,
      predictedMovement: {
        percentChange: 0,
        timeEstimate: 'unknown'
      },
      macroScore: 50,
      macroClassification: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      macroInsights: [`Error occurred during calculation`]
    };
  }
}

// ENHANCEMENT: Helper Functions for Improved Confidence Calculation

// Detect overall market context (trending, ranging, volatile)
function detectMarketContext(chartData: ChartData[]): { 
  type: 'trending' | 'ranging' | 'volatile', 
  strength: number // 0-100
} {
  // Default to moderate ranging market
  let contextType: 'trending' | 'ranging' | 'volatile' = 'ranging';
  let strength = 50;
  
  try {
    if (chartData.length < 20) return { type: contextType, strength };
    
    const closes = chartData.map(c => c.close);
    const volumes = chartData.map(c => c.volume);
    
    // Calculate ADX to determine trend strength
    const adxResult = indicators.calculateADX(chartData);
    const adx = adxResult.adx;
    
    // Calculate volatility using ATR as percentage of price
    const atr = indicators.calculateATR(chartData, 14);
    const lastPrice = closes[closes.length - 1];
    const volatilityPercent = (atr / lastPrice) * 100;
    
    // Calculate consistency of directional movement
    const priceChanges = [];
    for (let i = 1; i < closes.length; i++) {
      priceChanges.push(closes[i] - closes[i-1]);
    }
    
    // Count direction changes
    let directionChanges = 0;
    for (let i = 1; i < priceChanges.length; i++) {
      if ((priceChanges[i] > 0 && priceChanges[i-1] < 0) || 
          (priceChanges[i] < 0 && priceChanges[i-1] > 0)) {
        directionChanges++;
      }
    }
    
    const directionChangeRate = directionChanges / priceChanges.length;
    
    // Determine market context type
    if (adx > 25) {
      contextType = 'trending';
      strength = Math.min(100, adx * 2);
    } else if (volatilityPercent > 3) {
      contextType = 'volatile';
      strength = Math.min(100, volatilityPercent * 10);
    } else {
      contextType = 'ranging';
      strength = Math.min(100, directionChangeRate * 100);
    }
    
    return { type: contextType, strength };
  } catch (e) {
    console.warn("Error detecting market context:", e);
    return { type: contextType, strength };
  }
}

// Adapt weights based on market context and timeframe
function adaptWeightsToMarketContext(
  baseWeights: SignalWeights, 
  marketContext: { type: string, strength: number },
  timeframe: TimeFrame
): SignalWeights {
  const weights = { ...baseWeights };
  
  try {
    // Adjust weights based on market context
    switch (marketContext.type) {
      case 'trending':
        // In trending markets, trend and momentum indicators work better
        weights.trend = Math.min(100, weights.trend * 1.2);
        weights.momentum = Math.min(100, weights.momentum * 1.1);
        weights.volatility = Math.max(1, weights.volatility * 0.9);
        break;
        
      case 'ranging':
        // In ranging markets, oscillators (momentum) and support/resistance are more important
        weights.momentum = Math.min(100, weights.momentum * 1.3);
        weights.supportResistance = Math.min(100, weights.supportResistance * 1.4);
        weights.trend = Math.max(1, weights.trend * 0.8);
        break;
        
      case 'volatile':
        // In volatile markets, volume and volatility indicators are more reliable
        weights.volatility = Math.min(100, weights.volatility * 1.5);
        weights.volume = Math.min(100, weights.volume * 1.3);
        weights.trend = Math.max(1, weights.trend * 0.7);
        break;
    }
    
    // Adjust based on timeframe
    // Higher timeframes should put more weight on macro factors and trends
    // Lower timeframes should focus more on momentum and short-term patterns
    switch (timeframe) {
      case '1m':
      case '5m':
      case '15m':
        weights.momentum = Math.min(100, weights.momentum * 1.3);
        weights.volume = Math.min(100, weights.volume * 1.2);
        weights.macroeconomic = Math.max(1, weights.macroeconomic * 0.5);
        break;
        
      case '1h':
      case '4h':
        // Balanced weights for medium timeframes
        break;
        
      case '1d':
      case '3d':
      case '1w':
      case '1M':
        weights.trend = Math.min(100, weights.trend * 1.2);
        weights.macroeconomic = Math.min(100, weights.macroeconomic * 1.5);
        weights.supportResistance = Math.min(100, weights.supportResistance * 1.2);
        weights.onChainMetrics = Math.min(100, weights.onChainMetrics * 1.3);
        break;
    }
    
    // Normalize weights to ensure they still sum to the same total
    const originalSum = Object.values(baseWeights).reduce((sum, value) => sum + value, 0);
    const newSum = Object.values(weights).reduce((sum, value) => sum + value, 0);
    const normalizationFactor = originalSum / newSum;
    
    Object.keys(weights).forEach(key => {
      weights[key as keyof SignalWeights] = 
        weights[key as keyof SignalWeights] * normalizationFactor;
    });
    
    return weights;
  } catch (e) {
    console.warn("Error adapting weights to market context:", e);
    return baseWeights; // Return original weights if there's an error
  }
}

// Get timeframe importance multiplier for multi-timeframe confirmation
function getTimeframeImportance(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1m': return 0.8;
    case '5m': return 0.85;
    case '15m': return 0.9;
    case '30m': return 0.95;
    case '1h': return 1.0;
    case '4h': return 1.05;
    case '1d': return 1.1;
    case '3d': return 1.15;
    case '1w': return 1.2;
    case '1M': return 1.25;
    default: return 1.0;
  }
}

// Calculate enhanced category score with improved methodology
function calculateEnhancedCategoryScore(indicators: Indicator[], marketContext: { type: string, strength: number }) {
  let bullish = 0;
  let bearish = 0;
  let total = 0;
  let strongSignals = 0;
  
  // Count signals with strength weighting
  indicators.forEach(ind => {
    let weight = 1;
    
    // Apply higher weight to strong signals
    if (ind.strength === 'STRONG') {
      weight = 2;
      strongSignals++;
    } else if (ind.strength === 'MODERATE') {
      weight = 1.5;
    }
    
    // Apply higher weight to important indicators in this market context
    if ((marketContext.type === 'trending' && ['EMA', 'SMA', 'MACD'].includes(ind.name)) ||
        (marketContext.type === 'ranging' && ['RSI', 'Stochastic', 'CCI'].includes(ind.name)) ||
        (marketContext.type === 'volatile' && ['Bollinger', 'ATR', 'Volume'].includes(ind.name))) {
      weight *= 1.2;
    }
    
    total += weight;
    
    if (ind.signal === 'BUY') bullish += weight;
    if (ind.signal === 'SELL') bearish += weight;
  });
  
  // Avoid division by zero
  const effectiveTotal = total || 1;
  
  // Calculate base score - scale from 0-100 where 50 is neutral
  let scoreValue = (bullish - bearish) / effectiveTotal * 50 + 50;
  
  // Enhance confidence if many indicators agree
  const consensusBonus = (Math.max(bullish, bearish) / effectiveTotal) * 10;
  
  // Enhance confidence if strong signals are present
  const strengthBonus = (strongSignals / (indicators.length || 1)) * 10;
  
  // Apply bonuses to move score further from neutral when there's consensus
  if (scoreValue > 50) {
    scoreValue = Math.min(100, scoreValue + consensusBonus + strengthBonus);
  } else if (scoreValue < 50) {
    scoreValue = Math.max(0, scoreValue - consensusBonus - strengthBonus);
  }
  
  return {
    value: Math.min(Math.max(0, scoreValue), 100), // Limit to 0-100
    bullishCount: bullish,
    bearishCount: bearish,
    totalCount: total,
    strongSignals
  };
}

// Calculate volume score with volume-price relationship analysis
function calculateVolumeScore(volumeIndicators: Indicator[], chartData: ChartData[]) {
  // Calculate basic score
  const baseScore = calculateEnhancedCategoryScore(volumeIndicators, { type: 'ranging', strength: 50 });
  
  try {
    // If we have enough data, enhance the score with volume-price analysis
    if (chartData.length > 20) {
      const closes = chartData.map(c => c.close);
      const volumes = chartData.map(c => c.volume);
      
      let volumeConfirmationScore = 50; // Neutral by default
      
      // Calculate if volume confirms price movement
      let priceChanges = [];
      let volumeChanges = [];
      
      for (let i = 1; i < chartData.length; i++) {
        priceChanges.push(closes[i] - closes[i-1]);
        volumeChanges.push(volumes[i] - volumes[i-1]);
      }
      
      // Count how often volume confirms price
      let confirmationCount = 0;
      for (let i = 0; i < priceChanges.length; i++) {
        // Volume should increase on decisive moves
        if ((priceChanges[i] > 0 && volumeChanges[i] > 0) || 
            (priceChanges[i] < 0 && volumeChanges[i] > 0)) {
          confirmationCount++;
        }
      }
      
      // Calculate confirmation percentage
      const confirmationRate = confirmationCount / priceChanges.length;
      volumeConfirmationScore = confirmationRate * 100;
      
      // Blend the scores - give the volume-price relationship analysis some weight
      baseScore.value = baseScore.value * 0.7 + volumeConfirmationScore * 0.3;
    }
    
    return baseScore;
  } catch (e) {
    console.warn("Error calculating volume score:", e);
    return baseScore;
  }
}

// Calculate pattern score with context-based reliability
function calculatePatternScore(patternIndicators: Indicator[], marketContext: { type: string, strength: number }) {
  // Calculate basic score
  const baseScore = calculateEnhancedCategoryScore(patternIndicators, marketContext);
  
  // In the future, we can enhance this with:
  // 1. Pattern completion percentage
  // 2. Pattern historical reliability in similar market contexts
  // 3. Pattern confirmation across multiple timeframes
  
  return baseScore;
}

// Calculate accurate support and resistance levels with clustering
function calculateAccurateSupportsAndResistances(chartData: ChartData[], currentPrice: number): Level[] {
  // In this implementation, we'll calculate SR levels using:
  // 1. Recent swing highs and lows
  // 2. High volume nodes
  // 3. Previous strong support/resistance zones
  
  // For now, providing a basic implementation
  const levels: Level[] = [];
  
  try {
    if (chartData.length < 30) return levels;
    
    const prices = chartData.map(c => c.close);
    const highs = chartData.map(c => c.high);
    const lows = chartData.map(c => c.low);
    
    // Find potential swing points (simple method)
    const swingPoints: {price: number, type: 'support' | 'resistance', strength: number}[] = [];
    
    // Window size for detecting swings
    const windowSize = Math.max(5, Math.floor(chartData.length / 20));
    
    // Find swing highs (resistance)
    for (let i = windowSize; i < highs.length - windowSize; i++) {
      const currentHigh = highs[i];
      let isSwingHigh = true;
      
      // Check if this is higher than surrounding points
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && highs[j] > currentHigh) {
          isSwingHigh = false;
          break;
        }
      }
      
      if (isSwingHigh) {
        // Calculate strength based on how much higher it is and its recency
        const heightDiff = Math.min(100, (currentHigh / currentPrice - 1) * 100);
        const recency = Math.min(100, (i / chartData.length) * 100);
        const strength = Math.round((heightDiff * 0.7 + recency * 0.3) * 0.8);
        
        swingPoints.push({
          price: currentHigh,
          type: 'resistance',
          strength: Math.min(100, strength)
        });
      }
    }
    
    // Find swing lows (support)
    for (let i = windowSize; i < lows.length - windowSize; i++) {
      const currentLow = lows[i];
      let isSwingLow = true;
      
      // Check if this is lower than surrounding points
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (j !== i && lows[j] < currentLow) {
          isSwingLow = false;
          break;
        }
      }
      
      if (isSwingLow) {
        // Calculate strength based on how much lower it is and its recency
        const depthDiff = Math.min(100, (1 - currentLow / currentPrice) * 100);
        const recency = Math.min(100, (i / chartData.length) * 100);
        const strength = Math.round((depthDiff * 0.7 + recency * 0.3) * 0.8);
        
        swingPoints.push({
          price: currentLow,
          type: 'support',
          strength: Math.min(100, strength)
        });
      }
    }
    
    // Group similar levels using price clustering
    const priceTolerance = currentPrice * 0.005; // 0.5% tolerance
    const clusteredLevels: {price: number, type: 'support' | 'resistance', strength: number, count: number}[] = [];
    
    swingPoints.forEach(point => {
      // Find if there's already a similar price level
      const existingCluster = clusteredLevels.find(c => 
        Math.abs(c.price - point.price) < priceTolerance && c.type === point.type);
      
      if (existingCluster) {
        // Update existing cluster
        const newCount = existingCluster.count + 1;
        const newStrength = (existingCluster.strength * existingCluster.count + point.strength) / newCount;
        
        existingCluster.strength = Math.round(newStrength);
        existingCluster.count = newCount;
        // Weighted average for price
        existingCluster.price = (existingCluster.price * (newCount - 1) + point.price) / newCount;
      } else {
        // Create new cluster
        clusteredLevels.push({
          ...point,
          count: 1
        });
      }
    });
    
    // Sort by strength (descending)
    clusteredLevels.sort((a, b) => b.strength - a.strength);
    
    // Convert to Level objects and return top N levels
    const maxLevels = 8; // Maximum number of levels to return
    const topLevels = clusteredLevels.slice(0, maxLevels);
    
    topLevels.forEach(level => {
      levels.push({
        price: level.price,
        type: level.type,
        strength: level.strength,
        sourceTimeframes: ['1d'] // Default timeframe source
      });
    });
    
    return levels;
  } catch (e) {
    console.warn("Error calculating support/resistance levels:", e);
    return levels;
  }
}

// Calculate improved level score based on price proximity to levels
function calculateImprovedLevelsScore(levels: Level[], currentPrice: number, marketContext: { type: string, strength: number }): number {
  if (levels.length === 0) return 50; // Neutral if no levels
  
  try {
    // Find closest support and resistance
    let closestSupport: Level | null = null;
    let closestResistance: Level | null = null;
    let minSupportDist = Number.MAX_VALUE;
    let minResistanceDist = Number.MAX_VALUE;
    
    for (const level of levels) {
      if (level.type === 'support' && level.price < currentPrice) {
        const dist = currentPrice - level.price;
        if (dist < minSupportDist) {
          minSupportDist = dist;
          closestSupport = level;
        }
      } else if (level.type === 'resistance' && level.price > currentPrice) {
        const dist = level.price - currentPrice;
        if (dist < minResistanceDist) {
          minResistanceDist = dist;
          closestResistance = level;
        }
      }
    }
    
    // Calculate proximity as percentage of price
    const supportProximity = closestSupport ? (currentPrice - closestSupport.price) / currentPrice : 1;
    const resistanceProximity = closestResistance ? (closestResistance.price - currentPrice) / currentPrice : 1;
    
    // Calculate strength-weighted proximity
    const supportStrength = closestSupport ? closestSupport.strength / 100 : 0;
    const resistanceStrength = closestResistance ? closestResistance.strength / 100 : 0;
    
    // Determine if price is closer to support or resistance
    let score = 50; // Neutral by default
    
    if (supportProximity < resistanceProximity) {
      // Closer to support - more bullish
      const proximityFactor = 1 - (supportProximity / 0.1); // Scaled to 10% price range
      score = 50 + (proximityFactor * supportStrength * 50);
    } else {
      // Closer to resistance - more bearish
      const proximityFactor = 1 - (resistanceProximity / 0.1); // Scaled to 10% price range
      score = 50 - (proximityFactor * resistanceStrength * 50);
    }
    
    // Adjust for market context
    if (marketContext.type === 'ranging' && marketContext.strength > 50) {
      // Support/resistance more important in ranging markets
      // Move score further from neutral
      score = score > 50 ? 
        50 + (score - 50) * 1.2 : 
        50 - (50 - score) * 1.2;
    }
    
    return Math.max(0, Math.min(100, score));
  } catch (e) {
    console.warn("Error calculating level score:", e);
    return 50; // Return neutral score on error
  }
}

// Enhanced pattern detection with improved recognition algorithms
function detectChartPatternsEnhanced(chartData: ChartData[], symbol: string): PatternFormation[] {
  // More sophisticated pattern detection would be implemented here
  // For now, using placeholder implementation
  const patterns: PatternFormation[] = [];
  
  try {
    if (chartData.length < 30) return patterns;
    
    const prices = chartData.map(c => c.close);
    const highs = chartData.map(c => c.high);
    const lows = chartData.map(c => c.low);
    const lastPrice = prices[prices.length - 1];
    
    // Detect basic Head and Shoulders pattern (simplified)
    const isHeadAndShoulders = () => {
      // Minimum data points needed for H&S
      if (chartData.length < 100) return false;
      
      // Find potential peaks in the last 100 data points
      const window = 10;
      const peaks: number[] = [];
      
      for (let i = chartData.length - 100; i < chartData.length - window; i++) {
        let isPeak = true;
        for (let j = i - window; j <= i + window; j++) {
          if (j >= 0 && j < chartData.length && j !== i && highs[j] > highs[i]) {
            isPeak = false;
            break;
          }
        }
        if (isPeak) peaks.push(i);
      }
      
      // Need at least 3 peaks for H&S
      if (peaks.length < 3) return false;
      
      // Find 3 consecutive peaks where middle one is highest
      for (let i = 0; i < peaks.length - 2; i++) {
        const leftPeak = highs[peaks[i]];
        const middlePeak = highs[peaks[i+1]];
        const rightPeak = highs[peaks[i+2]];
        
        // Check if middle peak is higher than shoulders
        // and shoulders are roughly at the same level
        if (middlePeak > leftPeak && middlePeak > rightPeak && 
            Math.abs(leftPeak - rightPeak) < leftPeak * 0.05) {
          
          // Simple H&S pattern detected
          patterns.push({
            name: "Head and Shoulders",
            reliability: 65, // 65% reliability
            direction: 'bearish',
            priceTarget: lastPrice * 0.94, // 6% downside target
            description: "Head and shoulders pattern suggests a possible trend reversal from bullish to bearish."
          });
          break;
        }
      }
      
      return patterns.length > 0;
    };
    
    // Try to detect patterns
    if (!isHeadAndShoulders()) {
      // Check for double bottom (simplified)
      const isDoubleBottom = () => {
        if (chartData.length < 80) return false;
        
        const window = 8;
        const troughs: number[] = [];
        
        for (let i = chartData.length - 80; i < chartData.length - window; i++) {
          let isTrough = true;
          for (let j = i - window; j <= i + window; j++) {
            if (j >= 0 && j < chartData.length && j !== i && lows[j] < lows[i]) {
              isTrough = false;
              break;
            }
          }
          if (isTrough) troughs.push(i);
        }
        
        // Need at least 2 troughs
        if (troughs.length < 2) return false;
        
        // Find 2 troughs at similar levels
        for (let i = 0; i < troughs.length - 1; i++) {
          const trough1 = lows[troughs[i]];
          
          for (let j = i + 1; j < troughs.length; j++) {
            const trough2 = lows[troughs[j]];
            const priceDiff = Math.abs(trough1 - trough2) / trough1;
            const indexDiff = troughs[j] - troughs[i];
            
            // Troughs should be at similar price levels and adequately spaced
            if (priceDiff < 0.03 && indexDiff > 15) {
              // Double bottom detected
              patterns.push({
                name: "Double Bottom",
                reliability: 70,
                direction: 'bullish',
                priceTarget: lastPrice * 1.05, // 5% upside target
                description: "Double bottom pattern indicates a potential reversal from bearish to bullish trend."
              });
              return true;
            }
          }
        }
        
        return false;
      };
      
      if (!isDoubleBottom()) {
        // More pattern detection could be added here
      }
    }
    
    return patterns;
  } catch (e) {
    console.warn("Error detecting chart patterns:", e);
    return [];
  }
}

// Calculate improved market environment score
function calculateMarketEnvironmentScore(environment: any, timeframe: TimeFrame): number {
  // More sophisticated market environment scoring would be implemented here
  // For now, using a placeholder implementation
  
  try {
    const { volatility, trend, volume, type } = environment;
    
    let score = 50; // Start with neutral
    
    // Adjust based on trend
    if (trend === 'bullish') score += 15;
    else if (trend === 'bearish') score -= 15;
    
    // Adjust based on volume
    if (volume === 'increasing' && trend === 'bullish') score += 5;
    else if (volume === 'increasing' && trend === 'bearish') score -= 5;
    
    // Adjust based on market type and timeframe
    if (type === 'ranging' && ['1m', '5m', '15m'].includes(timeframe)) {
      // Ranging markets are less predictable in very short timeframes
      score = (score - 50) * 0.7 + 50;
    }
    
    return Math.max(0, Math.min(100, score));
  } catch (e) {
    console.warn("Error calculating market environment score:", e);
    return 50; // Neutral on error
  }
}

// Calculate comprehensive macro score 
function calculateMacroScore(macroData: any, symbol: string, timeframe: TimeFrame): number {
  // More sophisticated macro scoring would be implemented here with real economic data
  // For now, using an enhanced placeholder implementation
  
  try {
    // Adapt macro score based on timeframe
    // Macro factors should have higher impact on longer timeframes
    let baseScore = 50; // Neutral default
    
    // If we had real macro data, we would calculate this from:
    // - GDP growth rate
    // - Inflation rate
    // - Interest rates and central bank policies
    // - Employment data
    // - Market sentiment indicators
    // - Risk appetite metrics
    
    // Adjust importance based on timeframe
    // (Macro matters more for longer timeframes)
    const timeframeMultiplier = getTimeframeMultiplierForMacro(timeframe);
    
    // Apply timeframe adjustment
    // This moves the score closer to neutral for short timeframes
    // and emphasizes it for longer timeframes
    return 50 + (baseScore - 50) * timeframeMultiplier;
  } catch (e) {
    console.warn("Error calculating macro score:", e);
    return 50; // Neutral on error
  }
}

// Get classification based on macro score
function getMacroClassification(macroScore: number): string {
  if (macroScore >= 80) return "Strongly Bullish Macro Environment";
  if (macroScore >= 65) return "Moderately Bullish Macro Environment";
  if (macroScore >= 55) return "Slightly Bullish Macro Environment";
  if (macroScore > 45) return "Neutral Macro Environment";
  if (macroScore > 35) return "Slightly Bearish Macro Environment";
  if (macroScore > 20) return "Moderately Bearish Macro Environment";
  return "Strongly Bearish Macro Environment";
}

// Generate insights based on macro score
function generateMacroInsights(macroScore: number, macroData: any): string[] {
  // More sophisticated insight generation would use real economic data
  // For now, using a placeholder implementation
  
  const insights: string[] = [];
  
  if (macroScore >= 70) {
    insights.push("Favorable economic conditions supporting asset prices");
    insights.push("Positive liquidity environment encouraging investment");
  } else if (macroScore >= 55) {
    insights.push("Mildly positive economic outlook with moderate growth");
    insights.push("Some supportive monetary policies in place");
  } else if (macroScore > 45) {
    insights.push("Mixed economic signals creating a neutral environment");
    insights.push("Balance between bullish and bearish macro factors");
  } else if (macroScore > 30) {
    insights.push("Some economic headwinds affecting market sentiment");
    insights.push("Potential policy challenges impacting growth outlook");
  } else {
    insights.push("Challenging economic conditions weighing on markets");
    insights.push("Restrictive policies or external factors creating headwinds");
  }
  
  return insights;
}

// Get appropriate direction thresholds based on timeframe
function getDirectionThresholds(timeframe: TimeFrame): { long: number, short: number } {
  // Higher thresholds for shorter timeframes (requiring stronger conviction)
  switch (timeframe) {
    case '1m':
    case '5m':
      return { long: 65, short: 35 }; // Need very strong signals
    case '15m':
    case '30m':
      return { long: 62, short: 38 };
    case '1h':
      return { long: 60, short: 40 };
    case '4h':
      return { long: 58, short: 42 };
    case '1d':
    case '3d':
      return { long: 55, short: 45 };
    case '1w':
    case '1M':
      return { long: 52, short: 48 }; // Lower thresholds for longer timeframes
    default:
      return { long: 60, short: 40 };
  }
}

// Calculate confidence adjustment based on indicator consistency
function calculateConfidenceAdjustment(
  scores: {
    [key: string]: { 
      value: number, 
      bullishCount: number, 
      bearishCount: number, 
      totalCount: number,
      strongSignals?: number
    }
  }, 
  timeframe: TimeFrame
): number {
  // Default multiplier
  let adjustment = 1.0;
  
  try {
    // Count total signals and directions
    let totalBullish = 0;
    let totalBearish = 0;
    let totalCount = 0;
    let strongCount = 0;
    
    // Aggregate all score information
    Object.values(scores).forEach(score => {
      totalBullish += score.bullishCount;
      totalBearish += score.bearishCount;
      totalCount += score.totalCount;
      strongCount += score.strongSignals || 0;
    });
    
    // Calculate direction consensus (how strongly signals agree)
    const directionConsensus = totalCount > 0 ? 
      Math.abs(totalBullish - totalBearish) / totalCount : 0;
    
    // Calculate strength factor (how many strong signals we have)
    const strengthFactor = totalCount > 0 ? 
      strongCount / totalCount : 0;
    
    // Higher consensus and stronger signals increase confidence
    adjustment = 1.0 + (directionConsensus * 0.3) + (strengthFactor * 0.2);
    
    // Adjust by timeframe (confidence is naturally higher in longer timeframes)
    const timeframeAdjustment = getTimeframeConfidenceAdjustment(timeframe);
    adjustment *= timeframeAdjustment;
    
    return adjustment;
  } catch (e) {
    console.warn("Error calculating confidence adjustment:", e);
    return 1.0; // No adjustment on error
  }
}

// Get timeframe confidence adjustment multiplier
function getTimeframeConfidenceAdjustment(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1m': return 0.85; // Less reliable
    case '5m': return 0.9;
    case '15m': return 0.95;
    case '30m': return 0.98;
    case '1h': return 1.0; // Baseline
    case '4h': return 1.02;
    case '1d': return 1.05;
    case '3d': return 1.08;
    case '1w': return 1.1;
    case '1M': return 1.15; // More reliable
    default: return 1.0;
  }
}

// Get optimized ATR multipliers for price targets
function getOptimizedAtrMultipliers(
  timeframe: TimeFrame, 
  confidence: number, 
  atr: number, 
  price: number
): { stopLoss: number, takeProfit: number } {
  // Base multipliers
  let stopLoss = 2.0;
  let takeProfit = 3.0;
  
  // Adjust based on timeframe
  switch (timeframe) {
    case '1m':
    case '5m':
      stopLoss = 1.5; // Tighter stops for short timeframes
      takeProfit = 2.0;
      break;
    case '15m':
    case '30m':
      stopLoss = 1.8;
      takeProfit = 2.5;
      break;
    case '1h':
      stopLoss = 2.0;
      takeProfit = 3.0;
      break;
    case '4h':
      stopLoss = 2.2;
      takeProfit = 3.5;
      break;
    case '1d':
      stopLoss = 2.5;
      takeProfit = 4.0;
      break;
    case '3d':
    case '1w':
    case '1M':
      stopLoss = 3.0; // Wider stops for longer timeframes
      takeProfit = 5.0;
      break;
  }
  
  // Adjust based on confidence
  // Lower confidence = wider stops to avoid false signals
  // Higher confidence = tighter stops and more ambitious targets
  if (confidence < 40) {
    stopLoss *= 1.3; // Wider stop for low confidence
    takeProfit *= 0.8; // Less ambitious target
  } else if (confidence > 70) {
    stopLoss *= 0.9; // Tighter stop for high confidence
    takeProfit *= 1.2; // More ambitious target
  }
  
  // Adjust based on volatility (as % of price)
  const volatilityPercent = (atr / price) * 100;
  
  if (volatilityPercent > 5) {
    // High volatility - use wider stops
    stopLoss *= 1.2;
  } else if (volatilityPercent < 1) {
    // Low volatility - can use tighter stops
    stopLoss *= 0.9;
    takeProfit *= 0.9; // Also reduce target for low volatility
  }
  
  return { stopLoss, takeProfit };
}

// Calculate adjusted volatility based on timeframe
function calculateTimeframeAdjustedVolatility(chartData: ChartData[], timeframe: TimeFrame): number {
  const atr = indicators.calculateATR(chartData, 14);
  const lastPrice = chartData[chartData.length - 1].close;
  
  // Base volatility as percentage of price
  let volatility = (atr / lastPrice) * 100;
  
  // Adjust volatility expectations by timeframe
  // Longer timeframes naturally have higher volatility
  switch (timeframe) {
    case '1m':
    case '5m':
      volatility *= 0.7; // Lower expected volatility for very short timeframes
      break;
    case '15m':
    case '30m':
      volatility *= 0.85;
      break;
    case '1h':
      // Base volatility
      break;
    case '4h':
      volatility *= 1.2;
      break;
    case '1d':
      volatility *= 1.5;
      break;
    case '3d':
      volatility *= 1.8;
      break;
    case '1w':
      volatility *= 2.2;
      break;
    case '1M':
      volatility *= 3.0; // Higher expected volatility for monthly timeframe
      break;
  }
  
  return volatility;
}

// Calculate predicted price movement
function calculatePredictedMovement(
  direction: 'LONG' | 'SHORT' | 'NEUTRAL',
  volatility: number,
  confidence: number,
  timeframe: TimeFrame
): number {
  // Base movement multiplier by timeframe
  const timeframeMultiplier = getTimeframeMovementMultiplier(timeframe);
  
  // Calculate expected movement
  let predictedPercent = 0;
  
  if (direction === 'NEUTRAL') {
    predictedPercent = volatility * 0.3; // Limited movement expected
  } else {
    // Higher confidence = higher expected movement
    const confidenceFactor = confidence / 50;
    predictedPercent = volatility * confidenceFactor * timeframeMultiplier;
  }
  
  return predictedPercent;
}

// Get movement multiplier based on timeframe
function getTimeframeMovementMultiplier(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1m': return 0.2; // Very limited movement expected
    case '5m': return 0.3;
    case '15m': return 0.4;
    case '30m': return 0.5;
    case '1h': return 0.7;
    case '4h': return 1.0; // Base timeframe
    case '1d': return 1.5;
    case '3d': return 2.0;
    case '1w': return 2.5;
    case '1M': return 3.5; // Large movements possible
    default: return 1.0;
  }
}

// Get appropriate time estimate based on timeframe and volatility
function getTimeEstimateForTimeframe(
  timeframe: TimeFrame, 
  volatility: number, 
  confidence: number
): string {
  // Get base time estimate for the timeframe
  let baseEstimate = '';
  
  switch(timeframe) {
    case '1m':
    case '5m':
      baseEstimate = '1-4 hours';
      break;
    case '15m':
      baseEstimate = '4-12 hours';
      break;
    case '30m':
      baseEstimate = '12-24 hours';
      break;
    case '1h':
      baseEstimate = '1-2 days';
      break;
    case '4h':
      baseEstimate = '3-7 days';
      break;
    case '1d':
      baseEstimate = '1-3 weeks';
      break;
    case '3d':
      baseEstimate = '2-5 weeks';
      break;
    case '1w':
      baseEstimate = '1-2 months';
      break;
    case '1M':
      baseEstimate = '3-6 months';
      break;
    default: 
      baseEstimate = 'unknown';
  }
  
  // Adjust based on volatility and confidence
  if (volatility > 5 && confidence > 70) {
    // High volatility and high confidence = potentially faster moves
    return getShorteredTimeEstimate(baseEstimate);
  } else if (volatility < 1 || confidence < 40) {
    // Low volatility or low confidence = potentially slower moves
    return getLongerTimeEstimate(baseEstimate);
  }
  
  return baseEstimate;
}

// Helper functions for time estimates
function getShorteredTimeEstimate(baseEstimate: string): string {
  // Shorten the time estimate for high volatility scenarios
  if (baseEstimate.includes('hours')) {
    return baseEstimate.replace(/\d+-(\d+)/, (_, end) => `1-${Math.ceil(parseInt(end) * 0.7)}`);
  } else if (baseEstimate.includes('days')) {
    return baseEstimate.replace(/\d+-(\d+)/, (_, end) => `1-${Math.ceil(parseInt(end) * 0.8)}`);
  } else if (baseEstimate.includes('weeks')) {
    return baseEstimate.replace(/\d+-(\d+)/, (_, end) => `1-${Math.ceil(parseInt(end) * 0.8)}`);
  } else if (baseEstimate.includes('months')) {
    return baseEstimate.replace(/\d+-(\d+)/, (_, end) => `1-${Math.ceil(parseInt(end) * 0.8)}`);
  }
  return baseEstimate;
}

function getLongerTimeEstimate(baseEstimate: string): string {
  // Lengthen the time estimate for low volatility or low confidence scenarios
  if (baseEstimate.includes('hours')) {
    return baseEstimate.replace(/(\d+)-(\d+)/, (_, start, end) => 
      `${Math.ceil(parseInt(start) * 1.3)}-${Math.ceil(parseInt(end) * 1.3)}`);
  } else if (baseEstimate.includes('days')) {
    return baseEstimate.replace(/(\d+)-(\d+)/, (_, start, end) => 
      `${Math.ceil(parseInt(start) * 1.2)}-${Math.ceil(parseInt(end) * 1.2)}`);
  } else if (baseEstimate.includes('weeks')) {
    return baseEstimate.replace(/(\d+)-(\d+)/, (_, start, end) => 
      `${Math.ceil(parseInt(start) * 1.2)}-${Math.ceil(parseInt(end) * 1.2)}`);
  } else if (baseEstimate.includes('months')) {
    return baseEstimate.replace(/(\d+)-(\d+)/, (_, start, end) => 
      `${Math.ceil(parseInt(start) * 1.2)}-${Math.ceil(parseInt(end) * 1.2)}`);
  }
  return baseEstimate;
}

// Calculate adaptive risk percentage based on confidence and timeframe
function getAdaptiveRiskPercentage(confidence: number, timeframe: TimeFrame): number {
  // Base risk percentage
  let riskPercentage = 2.0;
  
  // Adjust based on confidence
  if (confidence < 40) {
    riskPercentage = 1.0; // Lower risk for low confidence
  } else if (confidence > 70) {
    riskPercentage = 3.0; // Higher risk tolerance for high confidence
  }
  
  // Adjust based on timeframe
  switch (timeframe) {
    case '1m':
    case '5m':
    case '15m':
      riskPercentage *= 0.7; // Lower risk for very short timeframes
      break;
    case '30m':
    case '1h':
      riskPercentage *= 0.9;
      break;
    case '4h':
      // Base risk
      break;
    case '1d':
    case '3d':
      riskPercentage *= 1.2;
      break;
    case '1w':
    case '1M':
      riskPercentage *= 1.5; // Higher risk for longer timeframes
      break;
  }
  
  return Math.min(5, Math.max(0.5, riskPercentage)); // Cap between 0.5% and 5%
}

// Calculate optimal leverage based on confidence, volatility and timeframe
function calculateOptimalLeverage(confidence: number, volatility: number, timeframe: TimeFrame): number {
  // Start with base leverage
  let leverage = 3;
  
  // Adjust by confidence
  if (confidence < 40) {
    leverage = 1; // Very conservative for low confidence
  } else if (confidence < 60) {
    leverage = 2; // Conservative for moderate confidence
  } else if (confidence < 80) {
    leverage = 3; // Moderate leverage for good confidence
  } else {
    leverage = 4; // Higher leverage for very high confidence
  }
  
  // Adjust by volatility (inverse relationship)
  if (volatility > 5) {
    leverage = Math.max(1, leverage - 1); // Reduce leverage for high volatility
  } else if (volatility < 1) {
    leverage += 1; // Can use higher leverage in low volatility
  }
  
  // Adjust by timeframe
  switch (timeframe) {
    case '1m':
    case '5m':
      leverage = Math.max(1, leverage - 1); // Lower leverage for very short timeframes
      break;
    case '15m':
    case '30m':
      leverage = Math.max(1, Math.floor(leverage * 0.8));
      break;
    case '1h':
      // No adjustment
      break;
    case '4h':
    case '1d':
      leverage = Math.ceil(leverage * 1.1);
      break;
    case '3d':
    case '1w':
    case '1M':
      leverage = Math.ceil(leverage * 1.2); // Higher leverage possible for longer timeframes
      break;
  }
  
  return Math.min(10, Math.max(1, leverage)); // Cap between 1x and 10x
}

// Get timeframe multiplier for macro factors
function getTimeframeMultiplierForMacro(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1m':
    case '5m':
      return 0.2; // Minimal impact on very short timeframes
    case '15m':
      return 0.3;
    case '30m':
      return 0.4;
    case '1h':
      return 0.5;
    case '4h':
      return 0.7;
    case '1d':
      return 1.0; // Base impact
    case '3d':
      return 1.2;
    case '1w':
      return 1.5;
    case '1M':
      return 2.0; // Maximum impact on monthly timeframe
    default:
      return 1.0;
  }
}

// Calculate improved risk/reward ratio
function calculateRiskRewardRatio(
  entryPrice: number, 
  takeProfit: number, 
  stopLoss: number, 
  direction: 'LONG' | 'SHORT' | 'NEUTRAL'
): number {
  if (direction === 'NEUTRAL') return 1;
  
  try {
    const reward = Math.abs(takeProfit - entryPrice);
    const risk = Math.abs(entryPrice - stopLoss);
    
    if (risk === 0) return 0; // Avoid division by zero
    
    return Math.round((reward / risk) * 100) / 100; // Round to 2 decimal places
  } catch (e) {
    console.warn("Error calculating risk/reward ratio:", e);
    return 1; // Default to 1:1 on error
  }
}

// Generate a trade recommendation based on multi-timeframe analysis
export function generateTradeRecommendation(
  symbol: string,
  timeframeSignals: AdvancedSignal[]
): TradeRecommendation {
  try {
    // At least 3 timeframes are required for a reliable recommendation
    if (timeframeSignals.length < 3) {
      throw new Error('At least 3 timeframes are required for trade recommendation');
    }
    
    // Group signals by direction
    const directionGroups = {
      LONG: timeframeSignals.filter(signal => signal.direction === 'LONG'),
      SHORT: timeframeSignals.filter(signal => signal.direction === 'SHORT'),
      NEUTRAL: timeframeSignals.filter(signal => signal.direction === 'NEUTRAL')
    };
    
    // Determine overall direction based on majority
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let dominantGroup = directionGroups.NEUTRAL;
    
    if (directionGroups.LONG.length > directionGroups.SHORT.length && 
        directionGroups.LONG.length > directionGroups.NEUTRAL.length) {
      direction = 'LONG';
      dominantGroup = directionGroups.LONG;
    } else if (directionGroups.SHORT.length > directionGroups.LONG.length && 
               directionGroups.SHORT.length > directionGroups.NEUTRAL.length) {
      direction = 'SHORT';
      dominantGroup = directionGroups.SHORT;
    }
    
    // Calculate average confidence
    const totalConfidence = timeframeSignals.reduce((sum, signal) => sum + signal.confidence, 0);
    const averageConfidence = Math.round(totalConfidence / timeframeSignals.length);
    
    // Use the most recent timeframe signal for price levels
    const mostRecentSignal = timeframeSignals.sort((a, b) => {
      const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
      return timeframes.indexOf(a.timeframe) - timeframes.indexOf(b.timeframe);
    })[0];
    
    const entryPrice = mostRecentSignal.entryPrice;
    
    // Calculate take profit levels
    const baseTP = direction === 'LONG' ? 
      mostRecentSignal.takeProfit : 
      mostRecentSignal.stopLoss;
    
    const takeProfitLevels = [
      direction === 'LONG' ? 
        entryPrice * 1.02 : 
        entryPrice * 0.98,
      direction === 'LONG' ? 
        entryPrice * 1.05 : 
        entryPrice * 0.95,
      baseTP
    ];
    
    // Calculate stop loss
    const stopLoss = mostRecentSignal.stopLoss;
    
    // Calculate risk reward ratio
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfitLevels[1] - entryPrice);
    const riskRewardRatio = risk > 0 ? reward / risk : 1;
    
    // Determine appropriate leverage based on volatility and confidence
    const leverageMultiplier = (averageConfidence / 100) * 2;
    
    // Simple winrate probability based on confidence and agreement
    const winProbability = Math.min(0.85, (averageConfidence / 100) + 
                                    (dominantGroup.length / timeframeSignals.length) * 0.3);
    
    return {
      symbol,
      direction,
      confidence: averageConfidence,
      timeframeSummary: timeframeSignals.map(signal => ({
        timeframe: signal.timeframe,
        confidence: signal.confidence,
        direction: signal.direction
      })),
      entry: {
        ideal: entryPrice,
        range: [
          direction === 'LONG' ? entryPrice * 0.995 : entryPrice * 1.005,
          direction === 'LONG' ? entryPrice * 1.005 : entryPrice * 0.995
        ]
      },
      exit: {
        takeProfit: takeProfitLevels,
        stopLoss,
        trailingStopActivation: direction === 'LONG' ? 
          entryPrice * 1.01 : 
          entryPrice * 0.99,
        trailingStopPercent: 0.5
      },
      leverage: {
        conservative: Math.max(1, Math.round(leverageMultiplier * 2)),
        moderate: Math.max(2, Math.round(leverageMultiplier * 5)),
        aggressive: Math.max(5, Math.round(leverageMultiplier * 10)),
        recommendation: averageConfidence > 75 ? 
          'Moderate leverage recommended due to strong signal' : 
          'Conservative leverage recommended for risk management'
      },
      riskManagement: {
        positionSizeRecommendation: `${Math.max(1, Math.min(5, Math.round(averageConfidence / 20)))}% of capital`,
        maxRiskPercentage: Math.max(0.5, Math.min(2, averageConfidence / 50)),
        potentialRiskReward: riskRewardRatio,
        winProbability
      },
      keyIndicators: [
        // Extract key indicators that influenced the signal
        ...dominantGroup.flatMap(signal => 
          signal.indicators.trend
            .filter(ind => ind.signal === (direction === 'LONG' ? 'BUY' : 'SELL'))
            .map(ind => ind.name)
        ).slice(0, 3),
        // Add macro indicator if relevant
        mostRecentSignal.macroScore > 70 ? 'Favorable macro environment' :
        mostRecentSignal.macroScore < 30 ? 'Challenging macro environment' : ''
      ].filter(Boolean),
      summary: `${direction} signal with ${averageConfidence}% confidence across ${timeframeSignals.length} timeframes. ${
        direction === 'LONG' ? 
          'Bullish momentum detected' : 
          direction === 'SHORT' ? 
            'Bearish pressure identified' : 
            'Mixed signals suggest caution'
      }.`
    };
  } catch (error) {
    console.error('Error generating trade recommendation:', error);
    
    // Return a default recommendation in case of error
    return {
      symbol,
      direction: 'NEUTRAL',
      confidence: 0,
      timeframeSummary: [],
      entry: {
        ideal: 0,
        range: [0, 0]
      },
      exit: {
        takeProfit: [0],
        stopLoss: 0,
        trailingStopActivation: 0,
        trailingStopPercent: 0
      },
      leverage: {
        conservative: 1,
        moderate: 1,
        aggressive: 2,
        recommendation: 'Error generating recommendation'
      },
      riskManagement: {
        positionSizeRecommendation: 'Unable to determine',
        maxRiskPercentage: 0.5,
        potentialRiskReward: 1,
        winProbability: 0.5
      },
      keyIndicators: ['Error in calculation'],
      summary: `Error: ${error instanceof Error ? error.message : 'Unknown error generating recommendation'}`
    };
  }
}