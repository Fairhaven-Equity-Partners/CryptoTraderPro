/**
 * Advanced Analytics Engine
 * Provides enhanced accuracy tracking with Sharpe ratio, drawdown analysis, and risk metrics
 * Implements professional trading performance measurement standards
 */

import type { TradeSimulation } from '@shared/schema';

export interface AdvancedAccuracyMetrics {
  symbol: string;
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  activeTrades: number;
  winRate: number;
  avgReturn: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  avgRiskReward: number;
  bestTrade: number;
  worstTrade: number;
  totalPnL: number;
  totalPnLPercent: number;
  consistencyScore: number;
  volatilityAdjustedReturn: number;
  timeframes: {
    [timeframe: string]: {
      winRate: number;
      totalTrades: number;
      avgReturn: number;
      sharpeRatio: number;
    };
  };
}

export interface BacktestResult {
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  totalSignals: number;
  executedTrades: number;
  winRate: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  avgHoldingPeriod: number;
  bestMonth: number;
  worstMonth: number;
  monthlyReturns: number[];
  yearlyReturn: number;
}

export class AdvancedAnalyticsEngine {
  /**
   * Calculate comprehensive accuracy metrics with professional trading statistics
   */
  static calculateAdvancedMetrics(simulations: TradeSimulation[]): AdvancedAccuracyMetrics {
    const completedTrades = simulations.filter(sim => !sim.isActive && sim.profitLossPercent !== null);
    const activeTrades = simulations.filter(sim => sim.isActive);
    const successfulTrades = completedTrades.filter(sim => (sim.profitLossPercent || 0) > 0);
    const failedTrades = completedTrades.filter(sim => (sim.profitLossPercent || 0) <= 0);

    if (completedTrades.length === 0) {
      return this.getEmptyMetrics(simulations[0]?.symbol || 'Unknown');
    }

    // Basic metrics
    const winRate = (successfulTrades.length / completedTrades.length) * 100;
    const returns = completedTrades.map(t => t.profitLossPercent || 0);
    const wins = successfulTrades.map(t => t.profitLossPercent || 0);
    const losses = failedTrades.map(t => Math.abs(t.profitLossPercent || 0));

    // Calculate averages
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const avgWin = wins.length > 0 ? wins.reduce((sum, win) => sum + win, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / losses.length : 0;

    // Profit factor
    const totalWins = wins.reduce((sum, win) => sum + win, 0);
    const totalLosses = losses.reduce((sum, loss) => sum + loss, 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

    // Sharpe ratio calculation
    const riskFreeRate = 0.02; // 2% annual risk-free rate
    const annualizedReturn = avgReturn * 365; // Assuming daily returns
    const returnVolatility = this.calculateStandardDeviation(returns);
    const annualizedVolatility = returnVolatility * Math.sqrt(365);
    const sharpeRatio = annualizedVolatility > 0 ? 
      (annualizedReturn - riskFreeRate) / annualizedVolatility : 0;

    // Drawdown analysis
    const { maxDrawdown, maxDrawdownPercent } = this.calculateDrawdown(completedTrades);

    // Risk-reward ratios
    const riskRewardRatios = completedTrades
      .filter(t => t.profitLossPercent !== null)
      .map(t => {
        const return_ = t.profitLossPercent || 0;
        const risk = Math.abs(return_) || 1;
        return return_ > 0 ? return_ / risk : 0;
      });
    const avgRiskReward = riskRewardRatios.length > 0 ? 
      riskRewardRatios.reduce((sum, rr) => sum + rr, 0) / riskRewardRatios.length : 0;

    // Best and worst trades
    const bestTrade = Math.max(...returns);
    const worstTrade = Math.min(...returns);

    // Total PnL
    const totalPnL = completedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const totalPnLPercent = returns.reduce((sum, ret) => sum + ret, 0);

    // Consistency score (lower volatility of returns = higher consistency)
    const consistencyScore = returnVolatility > 0 ? 
      Math.max(0, 100 - (returnVolatility * 10)) : 50;

    // Volatility-adjusted return
    const volatilityAdjustedReturn = returnVolatility > 0 ? avgReturn / returnVolatility : avgReturn;

    // Timeframe breakdown
    const timeframes = this.calculateTimeframeMetrics(simulations);

    return {
      symbol: simulations[0]?.symbol || 'Unknown',
      totalTrades: completedTrades.length,
      successfulTrades: successfulTrades.length,
      failedTrades: failedTrades.length,
      activeTrades: activeTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      avgReturn: Math.round(avgReturn * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      maxDrawdown,
      maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
      avgRiskReward: Math.round(avgRiskReward * 100) / 100,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      totalPnLPercent: Math.round(totalPnLPercent * 100) / 100,
      consistencyScore: Math.round(consistencyScore),
      volatilityAdjustedReturn: Math.round(volatilityAdjustedReturn * 100) / 100,
      timeframes
    };
  }

  /**
   * Calculate standard deviation of returns
   */
  private static calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (values.length - 1);
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate maximum drawdown from trade history
   */
  private static calculateDrawdown(trades: TradeSimulation[]): { 
    maxDrawdown: number; 
    maxDrawdownPercent: number 
  } {
    if (trades.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: 0 };

    // Sort trades by entry time
    const sortedTrades = [...trades]
      .filter(t => t.entryTime && t.profitLoss !== null)
      .sort((a, b) => new Date(a.entryTime!).getTime() - new Date(b.entryTime!).getTime());

    let runningPnL = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    for (const trade of sortedTrades) {
      runningPnL += trade.profitLoss || 0;
      
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      
      const currentDrawdown = peak - runningPnL;
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
        maxDrawdownPercent = peak > 0 ? (currentDrawdown / peak) * 100 : 0;
      }
    }

    return { 
      maxDrawdown: Math.round(maxDrawdown * 100) / 100, 
      maxDrawdownPercent 
    };
  }

  /**
   * Calculate metrics broken down by timeframe
   */
  private static calculateTimeframeMetrics(simulations: TradeSimulation[]): {
    [timeframe: string]: {
      winRate: number;
      totalTrades: number;
      avgReturn: number;
      sharpeRatio: number;
    };
  } {
    const timeframes: { [key: string]: TradeSimulation[] } = {};
    
    // Group simulations by timeframe
    simulations.forEach(sim => {
      if (!timeframes[sim.timeframe]) {
        timeframes[sim.timeframe] = [];
      }
      timeframes[sim.timeframe].push(sim);
    });

    const result: { [timeframe: string]: any } = {};

    Object.entries(timeframes).forEach(([timeframe, trades]) => {
      const completedTrades = trades.filter(t => !t.isActive && t.profitLossPercent !== null);
      const successfulTrades = completedTrades.filter(t => (t.profitLossPercent || 0) > 0);
      
      if (completedTrades.length > 0) {
        const winRate = (successfulTrades.length / completedTrades.length) * 100;
        const returns = completedTrades.map(t => t.profitLossPercent || 0);
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        
        // Calculate Sharpe ratio for this timeframe
        const returnVolatility = this.calculateStandardDeviation(returns);
        const sharpeRatio = returnVolatility > 0 ? avgReturn / returnVolatility : 0;

        result[timeframe] = {
          winRate: Math.round(winRate * 100) / 100,
          totalTrades: completedTrades.length,
          avgReturn: Math.round(avgReturn * 100) / 100,
          sharpeRatio: Math.round(sharpeRatio * 100) / 100
        };
      }
    });

    return result;
  }

  /**
   * Get empty metrics structure
   */
  private static getEmptyMetrics(symbol: string): AdvancedAccuracyMetrics {
    return {
      symbol,
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      activeTrades: 0,
      winRate: 0,
      avgReturn: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      avgRiskReward: 0,
      bestTrade: 0,
      worstTrade: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      consistencyScore: 50,
      volatilityAdjustedReturn: 0,
      timeframes: {}
    };
  }

  /**
   * Generate performance summary report
   */
  static generatePerformanceReport(metrics: AdvancedAccuracyMetrics): string {
    const { symbol, winRate, totalTrades, sharpeRatio, maxDrawdownPercent, profitFactor } = metrics;
    
    let rating = 'Poor';
    if (winRate >= 70 && sharpeRatio >= 1.5 && maxDrawdownPercent <= 10) {
      rating = 'Excellent';
    } else if (winRate >= 60 && sharpeRatio >= 1.0 && maxDrawdownPercent <= 20) {
      rating = 'Good';
    } else if (winRate >= 50 && sharpeRatio >= 0.5 && maxDrawdownPercent <= 30) {
      rating = 'Average';
    } else if (winRate >= 40 && maxDrawdownPercent <= 40) {
      rating = 'Below Average';
    }

    return `
Performance Report for ${symbol}
========================================
Overall Rating: ${rating}
Win Rate: ${winRate}% (${metrics.successfulTrades}/${totalTrades} trades)
Sharpe Ratio: ${sharpeRatio}
Max Drawdown: ${maxDrawdownPercent}%
Profit Factor: ${profitFactor}
Avg Risk/Reward: ${metrics.avgRiskReward}:1
Consistency Score: ${metrics.consistencyScore}/100

Key Insights:
- ${winRate >= 60 ? 'Strong' : winRate >= 50 ? 'Moderate' : 'Weak'} win rate performance
- ${sharpeRatio >= 1.5 ? 'Excellent' : sharpeRatio >= 1.0 ? 'Good' : sharpeRatio >= 0.5 ? 'Moderate' : 'Poor'} risk-adjusted returns
- ${maxDrawdownPercent <= 10 ? 'Low' : maxDrawdownPercent <= 20 ? 'Moderate' : 'High'} drawdown risk
- ${profitFactor >= 2.0 ? 'Strong' : profitFactor >= 1.5 ? 'Good' : profitFactor >= 1.0 ? 'Breakeven+' : 'Losing'} profit generation
    `.trim();
  }

  /**
   * Calculate signal confidence adjustment based on historical performance
   */
  static calculatePerformanceAdjustment(
    metrics: AdvancedAccuracyMetrics, 
    timeframe: string, 
    currentConfidence: number
  ): number {
    const timeframeMetrics = metrics.timeframes[timeframe];
    
    if (!timeframeMetrics || timeframeMetrics.totalTrades < 5) {
      return currentConfidence; // Not enough data for adjustment
    }

    const { winRate, sharpeRatio } = timeframeMetrics;
    
    // Performance-based multiplier
    let adjustment = 1.0;
    
    // Win rate adjustment
    if (winRate >= 70) {
      adjustment *= 1.15;
    } else if (winRate >= 60) {
      adjustment *= 1.08;
    } else if (winRate >= 50) {
      adjustment *= 1.0;
    } else if (winRate >= 40) {
      adjustment *= 0.92;
    } else {
      adjustment *= 0.85;
    }
    
    // Sharpe ratio adjustment
    if (sharpeRatio >= 1.5) {
      adjustment *= 1.1;
    } else if (sharpeRatio >= 1.0) {
      adjustment *= 1.05;
    } else if (sharpeRatio >= 0.5) {
      adjustment *= 1.0;
    } else {
      adjustment *= 0.9;
    }
    
    // Apply adjustment with bounds
    const adjustedConfidence = currentConfidence * adjustment;
    return Math.max(20, Math.min(95, adjustedConfidence));
  }
}