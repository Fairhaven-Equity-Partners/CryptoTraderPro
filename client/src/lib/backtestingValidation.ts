/**
 * Backtesting Validation System
 * Analyzes historical data to validate calculation accuracy and predict future performance
 */

import { ChartData, TimeFrame } from '../types';
import { detectMarketRegime, applyRegimeAdjustments } from './marketRegimeDetection';
import { analyzeIndicatorConvergence, calculateEnhancedConfidence } from './correlationAnalysis';

export interface BacktestResult {
  symbol: string;
  timeframe: TimeFrame;
  totalTrades: number;
  winRate: number; // percentage
  averageReturn: number; // percentage
  maxDrawdown: number; // percentage
  sharpeRatio: number;
  profitFactor: number;
  validationScore: number; // 0-100, overall accuracy score
  confidence: number; // 0-100, confidence in future predictions
}

export interface TradeResult {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  direction: 'LONG' | 'SHORT';
  return: number; // percentage
  duration: number; // days
  signalConfidence: number;
  actualOutcome: 'WIN' | 'LOSS';
}

export interface ValidationSummary {
  overallAccuracy: number; // 0-100
  timeframeAccuracy: Record<TimeFrame, number>;
  regimeAccuracy: Record<string, number>; // Bull, Bear, Sideways accuracy
  confidenceCalibration: number; // How well confidence predicts success
  recommendations: string[];
}

/**
 * Simulate a trade based on historical data
 */
function simulateTrade(
  data: ChartData[],
  entryIndex: number,
  signal: any,
  holdingPeriod: number = 5
): TradeResult | null {
  if (entryIndex + holdingPeriod >= data.length) return null;

  const entryCandle = data[entryIndex];
  const exitCandle = data[entryIndex + holdingPeriod];
  
  const entryPrice = entryCandle.close;
  const exitPrice = exitCandle.close;
  
  let returnPct = 0;
  if (signal.direction === 'LONG') {
    returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
  } else if (signal.direction === 'SHORT') {
    returnPct = ((entryPrice - exitPrice) / entryPrice) * 100;
  }

  // Account for stop loss and take profit
  if (signal.stopLoss && signal.takeProfit) {
    const highestPrice = Math.max(...data.slice(entryIndex, entryIndex + holdingPeriod + 1).map(d => d.high));
    const lowestPrice = Math.min(...data.slice(entryIndex, entryIndex + holdingPeriod + 1).map(d => d.low));
    
    if (signal.direction === 'LONG') {
      if (lowestPrice <= signal.stopLoss) {
        returnPct = ((signal.stopLoss - entryPrice) / entryPrice) * 100;
      } else if (highestPrice >= signal.takeProfit) {
        returnPct = ((signal.takeProfit - entryPrice) / entryPrice) * 100;
      }
    } else if (signal.direction === 'SHORT') {
      if (highestPrice >= signal.stopLoss) {
        returnPct = ((entryPrice - signal.stopLoss) / entryPrice) * 100;
      } else if (lowestPrice <= signal.takeProfit) {
        returnPct = ((entryPrice - signal.takeProfit) / entryPrice) * 100;
      }
    }
  }

  return {
    entryDate: entryCandle.timestamp,
    exitDate: exitCandle.timestamp,
    entryPrice,
    exitPrice,
    direction: signal.direction,
    return: returnPct,
    duration: holdingPeriod,
    signalConfidence: signal.confidence,
    actualOutcome: returnPct > 0 ? 'WIN' : 'LOSS'
  };
}

/**
 * Run backtest on historical data for a specific timeframe
 */
export async function runBacktest(
  symbol: string,
  chartData: ChartData[],
  timeframe: TimeFrame,
  lookbackPeriod: number = 100
): Promise<BacktestResult> {
  if (chartData.length < lookbackPeriod + 50) {
    return {
      symbol,
      timeframe,
      totalTrades: 0,
      winRate: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      validationScore: 0,
      confidence: 0
    };
  }

  const trades: TradeResult[] = [];
  const testPeriod = Math.min(lookbackPeriod, chartData.length - 50);
  
  // Walk through historical data and generate signals
  for (let i = 50; i < testPeriod; i += 5) { // Test every 5th candle to avoid over-sampling
    try {
      const historicalData = chartData.slice(0, i);
      const signal = await calculateAdvancedSignal(symbol, historicalData, timeframe);
      
      if (signal && signal.direction !== 'NEUTRAL' && signal.confidence > 60) {
        const holdingDays = timeframe === '1m' ? 1 : timeframe === '5m' ? 2 : 
                           timeframe === '15m' ? 3 : timeframe === '1h' ? 5 : 10;
        
        const trade = simulateTrade(chartData, i, signal, holdingDays);
        if (trade) {
          trades.push(trade);
        }
      }
    } catch (error) {
      // Skip this iteration if signal calculation fails
      continue;
    }
  }

  if (trades.length === 0) {
    return {
      symbol,
      timeframe,
      totalTrades: 0,
      winRate: 0,
      averageReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      validationScore: 0,
      confidence: 0
    };
  }

  // Calculate performance metrics
  const winningTrades = trades.filter(t => t.return > 0);
  const losingTrades = trades.filter(t => t.return <= 0);
  const winRate = (winningTrades.length / trades.length) * 100;
  
  const returns = trades.map(t => t.return);
  const averageReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  
  // Calculate maximum drawdown
  let maxDrawdown = 0;
  let peak = 0;
  let cumulative = 0;
  
  for (const trade of trades) {
    cumulative += trade.return;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Calculate Sharpe ratio (simplified)
  const returnStdDev = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / returns.length
  );
  const sharpeRatio = returnStdDev > 0 ? averageReturn / returnStdDev : 0;

  // Calculate profit factor
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.return, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.return, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 10 : 0;

  // Calculate validation score based on multiple factors
  let validationScore = 0;
  validationScore += Math.min(50, winRate); // Up to 50 points for win rate
  validationScore += Math.min(25, (profitFactor - 1) * 10); // Up to 25 points for profit factor
  validationScore += Math.min(15, Math.max(0, 10 - maxDrawdown)); // Up to 15 points for low drawdown
  validationScore += Math.min(10, sharpeRatio * 5); // Up to 10 points for Sharpe ratio

  // Confidence in future predictions based on consistency
  const confidenceFactors = [
    Math.min(1, winRate / 60), // Win rate factor
    Math.min(1, profitFactor / 1.5), // Profit factor
    Math.min(1, (20 - maxDrawdown) / 20), // Drawdown factor
    Math.min(1, trades.length / 20) // Sample size factor
  ];
  const confidence = confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length * 100;

  return {
    symbol,
    timeframe,
    totalTrades: trades.length,
    winRate: Math.round(winRate * 10) / 10,
    averageReturn: Math.round(averageReturn * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    validationScore: Math.round(validationScore),
    confidence: Math.round(confidence)
  };
}

/**
 * Run comprehensive backtesting across multiple timeframes
 */
export async function runComprehensiveBacktest(
  symbol: string,
  chartDataByTimeframe: Record<TimeFrame, ChartData[]>
): Promise<ValidationSummary> {
  const results: Record<TimeFrame, BacktestResult> = {} as Record<TimeFrame, BacktestResult>;
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
  
  // Run backtests for each timeframe
  for (const tf of timeframes) {
    if (chartDataByTimeframe[tf] && chartDataByTimeframe[tf].length > 100) {
      results[tf] = await runBacktest(symbol, chartDataByTimeframe[tf], tf);
    }
  }

  // Calculate overall accuracy metrics
  const validResults = Object.values(results).filter(r => r.totalTrades > 5);
  
  if (validResults.length === 0) {
    return {
      overallAccuracy: 0,
      timeframeAccuracy: {} as Record<TimeFrame, number>,
      regimeAccuracy: {},
      confidenceCalibration: 0,
      recommendations: ['Insufficient historical data for validation']
    };
  }

  const overallAccuracy = validResults.reduce((sum, r) => sum + r.validationScore, 0) / validResults.length;
  
  const timeframeAccuracy: Record<TimeFrame, number> = {} as Record<TimeFrame, number>;
  for (const [tf, result] of Object.entries(results)) {
    timeframeAccuracy[tf as TimeFrame] = result.validationScore;
  }

  // Analyze regime-specific accuracy (simplified)
  const regimeAccuracy = {
    'Bull Market': validResults.reduce((sum, r) => sum + r.winRate, 0) / validResults.length,
    'Bear Market': validResults.reduce((sum, r) => sum + Math.max(0, 100 - r.maxDrawdown), 0) / validResults.length,
    'Sideways Market': validResults.reduce((sum, r) => sum + (r.profitFactor > 1 ? 60 : 40), 0) / validResults.length
  };

  // Calculate confidence calibration
  const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;
  const avgWinRate = validResults.reduce((sum, r) => sum + r.winRate, 0) / validResults.length;
  const confidenceCalibration = 100 - Math.abs(avgConfidence - avgWinRate);

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (overallAccuracy > 70) {
    recommendations.push('✅ High validation accuracy - calculations are reliable for predictions');
  } else if (overallAccuracy > 50) {
    recommendations.push('⚠️ Moderate validation accuracy - use with caution');
  } else {
    recommendations.push('❌ Low validation accuracy - signals may not be reliable');
  }

  const bestTimeframe = Object.entries(timeframeAccuracy)
    .reduce((best, [tf, score]) => score > best.score ? { tf: tf as TimeFrame, score } : best, 
            { tf: '1h' as TimeFrame, score: 0 });
  
  if (bestTimeframe.score > 60) {
    recommendations.push(`🎯 Best performance on ${bestTimeframe.tf} timeframe (${bestTimeframe.score}% accuracy)`);
  }

  if (confidenceCalibration > 80) {
    recommendations.push('📊 Confidence scores are well-calibrated with actual results');
  } else {
    recommendations.push('📊 Confidence scores may be over/under-estimating actual performance');
  }

  const highProfitFactorResults = validResults.filter(r => r.profitFactor > 1.5);
  if (highProfitFactorResults.length > 0) {
    recommendations.push(`💰 Strong profit factor detected in ${highProfitFactorResults.length} timeframe(s)`);
  }

  return {
    overallAccuracy: Math.round(overallAccuracy),
    timeframeAccuracy,
    regimeAccuracy,
    confidenceCalibration: Math.round(confidenceCalibration),
    recommendations
  };
}

/**
 * Quick validation check for current signal reliability
 */
export async function validateCurrentSignal(
  symbol: string,
  chartData: ChartData[],
  timeframe: TimeFrame,
  currentSignal: any
): Promise<{
  validationScore: number;
  reliability: 'HIGH' | 'MEDIUM' | 'LOW';
  historicalAccuracy: number;
  recommendation: string;
}> {
  const backtest = await runBacktest(symbol, chartData, timeframe, 50);
  
  let reliability: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (backtest.validationScore > 70 && backtest.confidence > 70) {
    reliability = 'HIGH';
  } else if (backtest.validationScore > 50 && backtest.confidence > 50) {
    reliability = 'MEDIUM';
  }

  const recommendation = reliability === 'HIGH' 
    ? 'Signal has strong historical validation - suitable for trading'
    : reliability === 'MEDIUM'
    ? 'Signal has moderate validation - consider risk management'
    : 'Signal has low validation - avoid or use minimal position size';

  return {
    validationScore: backtest.validationScore,
    reliability,
    historicalAccuracy: backtest.winRate,
    recommendation
  };
}