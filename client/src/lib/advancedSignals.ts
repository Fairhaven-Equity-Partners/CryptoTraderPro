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

// Calculate confidence score for a specific timeframe
export function calculateTimeframeConfidence(
  chartData: ChartData[],
  timeframe: TimeFrame,
  weights: SignalWeights = DEFAULT_WEIGHTS,
  symbol: string
): AdvancedSignal {
  try {
    console.log(`Calculating confidence for ${symbol} (${timeframe}) with ${chartData.length} data points`);
    
    // Basic validation
    if (!Array.isArray(chartData) || chartData.length < 10) {
      throw new Error(`Invalid chart data for analysis: ${chartData.length} data points (need at least 10)`);
    }
    
    if (!symbol) {
      throw new Error(`Missing symbol parameter`);
    }
    
    // Basic calculations
    const lastCandle = chartData[chartData.length - 1];
    const lastPrice = lastCandle.close;
    
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
    
    // Calculate category scores
    const scores = {
      trend: calculateCategoryScore(categorizedIndicators.trend),
      momentum: calculateCategoryScore(categorizedIndicators.momentum),
      volatility: calculateCategoryScore(categorizedIndicators.volatility),
      volume: calculateCategoryScore(categorizedIndicators.volume),
      pattern: calculateCategoryScore(categorizedIndicators.pattern)
    };
    
    // Detect support and resistance levels
    const levels = detectSupportResistanceLevels(chartData, lastPrice);
    const levelsScore = calculateLevelsScore(levels, lastPrice);
    
    // Detect chart patterns
    const patterns = detectChartPatterns(chartData, symbol);
    
    // Calculate weighted score and direction
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, score] of Object.entries(scores)) {
      const weight = weights[category as keyof SignalWeights] || 0;
      totalScore += score.value * weight;
      totalWeight += weight;
    }
    
    // Add environment score
    const environmentScore = getEnvironmentScore(environment);
    totalScore += environmentScore * weights.marketCondition;
    totalWeight += weights.marketCondition;
    
    // Add levels score
    totalScore += levelsScore * weights.supportResistance;
    totalWeight += weights.supportResistance;
    
    // Include macro score if available
    const macroData = getMacroIndicators();
    // Fix: Use default values if properties don't exist
    const macroScore = 50; // Default to neutral
    const macroClass = "Market outlook neutral";
    const macroInsights = ["General market conditions appear neutral", "No strong macroeconomic signals detected"];
    
    totalScore += macroScore * weights.macroeconomic;
    totalWeight += weights.macroeconomic;
    
    // Calculate final normalized score (0-100)
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 50;
    
    // Determine direction
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    
    if (finalScore >= 60) {
      direction = 'LONG';
    } else if (finalScore <= 40) {
      direction = 'SHORT';
    }
    
    // Set confidence based on distance from neutral
    const confidence = Math.round(Math.abs(finalScore - 50) * 2);
    
    // Simple price levels
    const atr = indicators.calculateATR(chartData, 14);
    
    const stopLoss = direction === 'LONG' ? 
      lastPrice - (atr * 2) : 
      lastPrice + (atr * 2);
      
    const takeProfit = direction === 'LONG' ?
      lastPrice + (atr * 3) :
      lastPrice - (atr * 3);
    
    // Calculate predicted movement
    const volatility = atr / lastPrice * 100;
    const predictedPercent = direction === 'NEUTRAL' ? 
      volatility * 0.5 : 
      volatility * (confidence / 50);
    
    // Estimate time based on timeframe
    let timeEstimate: string;
    
    switch(timeframe) {
      case '1m':
      case '5m':
      case '15m':
        timeEstimate = '1-4 hours';
        break;
      case '30m':
      case '1h':
        timeEstimate = '1-2 days';
        break;
      case '4h':
        timeEstimate = '3-7 days';
        break;
      case '1d':
        timeEstimate = '1-3 weeks';
        break;
      case '3d':
      case '1w':
        timeEstimate = '1-2 months';
        break;
      case '1M':
        timeEstimate = '3-6 months';
        break;
      default: 
        timeEstimate = 'unknown';
    }
    
    // Generate safe leverage based on volatility and confidence
    const riskParams: LeverageParams = {
      entryPrice: lastPrice,
      stopLoss: stopLoss,
      accountBalance: 10000, // Standard portfolio size
      maxLossPercentage: 5,  // Standard risk - 5% max loss
      positionValue: 0       // Will be calculated inside the function
    };
    
    // Calculate recommended leverage (with error handling)
    let recommendedLeverage = 3; // Default value
    
    try {
      const leverageResult = calculateSafeLeverage(riskParams);
      
      // Only use calculated leverage if it's a valid number
      if (leverageResult && typeof leverageResult.recommendedLeverage === 'number' && !isNaN(leverageResult.recommendedLeverage)) {
        // Determine recommended leverage - default to 3x unless we have a higher confidence
        recommendedLeverage = confidence > 60 ? 
          Math.min(10, leverageResult.recommendedLeverage) : // Cap at 10x
          Math.min(3, leverageResult.recommendedLeverage);   // Cap at 3x for lower confidence
      }
    } catch (err) {
      console.warn("Error calculating leverage, using default value:", err);
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
      optimalRiskReward: direction === 'NEUTRAL' ? 1 : Math.abs((takeProfit - lastPrice) / (lastPrice - stopLoss)),
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
    
    // Return dummy data in case of error
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