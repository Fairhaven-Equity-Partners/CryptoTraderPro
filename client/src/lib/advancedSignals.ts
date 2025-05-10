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

// Helper functions that might be needed by the simplified version
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

// Generate a trade recommendation based on signals from multiple timeframes
export function generateTradeRecommendation(
  symbol: string,
  signals: AdvancedSignal[]
): TradeRecommendation {
  // Basic validation
  if (!signals || signals.length === 0) {
    throw new Error('No signals provided for recommendation');
  }
  
  console.log(`Generating trade recommendation for ${symbol} with ${signals.length} signals`);
  
  // Calculate overall direction and confidence
  let longCount = 0;
  let shortCount = 0;
  let totalConfidence = 0;
  
  // Get the last signal for entry price
  const lastSignal = signals[signals.length - 1];
  const entryPrice = lastSignal.entryPrice;
  
  signals.forEach(signal => {
    if (signal.direction === 'LONG') longCount++;
    if (signal.direction === 'SHORT') shortCount++;
    totalConfidence += signal.confidence;
  });
  
  const avgConfidence = totalConfidence / signals.length;
  
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
  if (longCount > shortCount) {
    direction = 'LONG';
  } else if (shortCount > longCount) {
    direction = 'SHORT';
  }
  
  // Calculate risk range
  const atr = lastSignal.stopLoss ? Math.abs(lastSignal.entryPrice - lastSignal.stopLoss) : entryPrice * 0.02;
  
  // Generate the recommendation
  return {
    symbol,
    direction,
    confidence: avgConfidence,
    timeframeSummary: signals.map(s => ({
      timeframe: s.timeframe,
      confidence: s.confidence,
      direction: s.direction
    })),
    entry: {
      ideal: entryPrice,
      range: [entryPrice * 0.98, entryPrice * 1.02] // 2% range
    },
    exit: {
      takeProfit: [
        direction === 'LONG' ? entryPrice * 1.05 : entryPrice * 0.95,
        direction === 'LONG' ? entryPrice * 1.1 : entryPrice * 0.9
      ],
      stopLoss: direction === 'LONG' ? entryPrice * 0.97 : entryPrice * 1.03,
      trailingStopActivation: direction === 'LONG' ? entryPrice * 1.03 : entryPrice * 0.97,
      trailingStopPercent: 1.5
    },
    leverage: {
      conservative: 2,
      moderate: 5,
      aggressive: 10,
      recommendation: 'Start with conservative leverage for better risk management.'
    },
    riskManagement: {
      positionSizeRecommendation: '1-2% of total capital',
      maxRiskPercentage: 1,
      potentialRiskReward: 2.5,
      winProbability: avgConfidence / 100
    },
    keyIndicators: ['Simplified trade recommendation for debugging'],
    summary: `${direction} signal with ${avgConfidence.toFixed(1)}% confidence across ${signals.length} timeframes.`
  };
}

// A very simplified version of the calculate function for debugging
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
    const calculatedIndicators = indicators.analyzeIndicators(chartData);
    
    // Get categories
    const categorizedIndicators = {
      trend: calculatedIndicators.filter(i => i.category === 'TREND'),
      momentum: calculatedIndicators.filter(i => i.category === 'MOMENTUM'),
      volatility: calculatedIndicators.filter(i => i.category === 'VOLATILITY'),
      volume: calculatedIndicators.filter(i => i.category === 'VOLUME'),
      pattern: calculatedIndicators.filter(i => i.category === 'PATTERN')
    };
    
    // Simple direction calculation
    let buys = 0;
    let sells = 0;
    
    calculatedIndicators.forEach(indicator => {
      if (indicator.signal === 'BUY') buys++;
      if (indicator.signal === 'SELL') sells++;
    });
    
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;
    
    if (buys > sells && buys > calculatedIndicators.length / 3) {
      direction = 'LONG';
      confidence = Math.min(100, 50 + buys * 5);
    } else if (sells > buys && sells > calculatedIndicators.length / 3) {
      direction = 'SHORT';
      confidence = Math.min(100, 50 + sells * 5);
    }
    
    // Simple price levels
    const atr = indicators.calculateATR(chartData, 14);
    
    const stopLoss = direction === 'LONG' ? 
      lastPrice - (atr * 2) : 
      lastPrice + (atr * 2);
      
    const takeProfit = direction === 'LONG' ?
      lastPrice + (atr * 3) :
      lastPrice - (atr * 3);
    
    return {
      timeframe,
      direction,
      confidence,
      entryPrice: lastPrice,
      stopLoss,
      takeProfit,
      recommendedLeverage: 2,
      indicators: categorizedIndicators,
      patternFormations: [],
      supportResistance: [],
      optimalRiskReward: 1.5,
      predictedMovement: {
        percentChange: 5,
        timeEstimate: '1-7 days'
      },
      macroScore: 50,
      macroClassification: 'Neutral',
      macroInsights: ['Simplified calculation for debugging']
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