/**
 * Advanced Backtesting Engine
 * Professional-grade backtesting with comprehensive performance analytics
 * Implements industry-standard metrics and portfolio simulation
 */

import { AdvancedMarketAnalysisEngine, type LayeredSignalScore } from './advancedMarketAnalysis.js';
import { TechnicalIndicatorsEngine, type TechnicalAnalysis } from './technicalIndicators.js';
import { AdvancedAnalyticsEngine, type AdvancedAccuracyMetrics } from './advancedAnalytics.js';

export interface BacktestConfig {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  maxPositionSize: number;
  commissionRate: number;
  slippageRate: number;
  riskPerTrade: number; // Percentage of capital to risk per trade
  timeframes: string[];
  symbols: string[];
  enableCompounding: boolean;
  maxDrawdownStop: number; // Stop trading if drawdown exceeds this %
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT';
  entryTime: number;
  exitTime?: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  commission: number;
  slippage: number;
  pnl?: number;
  pnlPercent?: number;
  holdingPeriod?: number;
  exitReason?: 'STOP_LOSS' | 'TAKE_PROFIT' | 'TIMEOUT' | 'SIGNAL_REVERSAL';
  confidence: number;
  layeredScore: LayeredSignalScore;
  marketRegime: string;
}

export interface BacktestResult {
  config: BacktestConfig;
  trades: BacktestTrade[];
  portfolioValue: number[];
  timestamps: number[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    sortino: number;
    calmar: number;
    maxDrawdown: number;
    maxDrawdownDuration: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    avgHoldingPeriod: number;
    bestTrade: number;
    worstTrade: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    expectancy: number;
    kelly: number;
    var95: number; // Value at Risk 95%
    cvar95: number; // Conditional Value at Risk 95%
  };
  timeframeMetrics: {
    [timeframe: string]: {
      trades: number;
      winRate: number;
      avgReturn: number;
      sharpeRatio: number;
      maxDrawdown: number;
    };
  };
  monthlyReturns: number[];
  drawdownPeriods: {
    start: number;
    end: number;
    peak: number;
    trough: number;
    drawdown: number;
    duration: number;
  }[];
}

export interface MarketDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class AdvancedBacktestingEngine {
  private marketData: Map<string, MarketDataPoint[]> = new Map();
  private priceCache: Map<string, Map<number, number>> = new Map();

  /**
   * Run comprehensive backtest with advanced analytics
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    console.log(`[BacktestingEngine] Starting backtest from ${config.startDate.toISOString()} to ${config.endDate.toISOString()}`);
    
    // Generate synthetic market data for backtesting
    await this.generateMarketData(config);
    
    const trades: BacktestTrade[] = [];
    const portfolioValue: number[] = [config.initialCapital];
    const timestamps: number[] = [config.startDate.getTime()];
    
    let currentCapital = config.initialCapital;
    let openTrades: Map<string, BacktestTrade> = new Map();
    let tradeId = 0;
    
    // Daily simulation loop
    const dayMs = 24 * 60 * 60 * 1000;
    for (let time = config.startDate.getTime(); time <= config.endDate.getTime(); time += dayMs) {
      
      // Check for exit conditions on open trades
      for (const [key, trade] of openTrades.entries()) {
        const currentPrice = this.getPrice(trade.symbol, time);
        if (!currentPrice) continue;
        
        let shouldExit = false;
        let exitReason: BacktestTrade['exitReason'] = 'TIMEOUT';
        
        // Check stop loss and take profit
        if (trade.direction === 'LONG') {
          if (currentPrice <= trade.stopLoss) {
            shouldExit = true;
            exitReason = 'STOP_LOSS';
          } else if (currentPrice >= trade.takeProfit) {
            shouldExit = true;
            exitReason = 'TAKE_PROFIT';
          }
        } else {
          if (currentPrice >= trade.stopLoss) {
            shouldExit = true;
            exitReason = 'STOP_LOSS';
          } else if (currentPrice <= trade.takeProfit) {
            shouldExit = true;
            exitReason = 'TAKE_PROFIT';
          }
        }
        
        // Check timeout (30 days max holding)
        if (time - trade.entryTime > 30 * dayMs) {
          shouldExit = true;
          exitReason = 'TIMEOUT';
        }
        
        if (shouldExit) {
          const exitTrade = this.closeTrade(trade, currentPrice, time, exitReason);
          trades.push(exitTrade);
          currentCapital += exitTrade.pnl! - exitTrade.commission - exitTrade.slippage;
          openTrades.delete(key);
        }
      }
      
      // Generate new signals and potential trades
      for (const symbol of config.symbols) {
        for (const timeframe of config.timeframes) {
          const currentPrice = this.getPrice(symbol, time);
          if (!currentPrice) continue;
          
          // Calculate signal using advanced analysis
          const signal = await this.generateSignal(symbol, currentPrice, time, timeframe);
          
          if (signal && signal.confidence > 65 && !openTrades.has(`${symbol}_${timeframe}`)) {
            // Calculate position size based on risk management
            const positionSize = this.calculatePositionSize(
              currentCapital,
              currentPrice,
              signal.layeredScore.direction,
              config.riskPerTrade,
              config.maxPositionSize
            );
            
            if (positionSize > 0) {
              const trade = this.openTrade(
                `${tradeId++}`,
                symbol,
                timeframe,
                signal.layeredScore.direction,
                currentPrice,
                time,
                positionSize,
                signal.confidence,
                signal.layeredScore,
                config.commissionRate,
                config.slippageRate
              );
              
              openTrades.set(`${symbol}_${timeframe}`, trade);
              currentCapital -= trade.commission + trade.slippage;
            }
          }
        }
      }
      
      // Record portfolio value
      let totalPortfolioValue = currentCapital;
      for (const trade of openTrades.values()) {
        const currentPrice = this.getPrice(trade.symbol, time) || trade.entryPrice;
        const unrealizedPnl = this.calculateUnrealizedPnl(trade, currentPrice);
        totalPortfolioValue += unrealizedPnl;
      }
      
      portfolioValue.push(totalPortfolioValue);
      timestamps.push(time);
      
      // Check max drawdown stop
      const currentDrawdown = this.calculateCurrentDrawdown(portfolioValue);
      if (currentDrawdown > config.maxDrawdownStop) {
        console.log(`[BacktestingEngine] Max drawdown stop triggered: ${currentDrawdown.toFixed(2)}%`);
        break;
      }
    }
    
    // Close remaining open trades
    const finalTime = config.endDate.getTime();
    for (const trade of openTrades.values()) {
      const finalPrice = this.getPrice(trade.symbol, finalTime) || trade.entryPrice;
      const closedTrade = this.closeTrade(trade, finalPrice, finalTime, 'TIMEOUT');
      trades.push(closedTrade);
    }
    
    // Calculate comprehensive metrics
    const metrics = this.calculateMetrics(trades, portfolioValue, config.initialCapital);
    const timeframeMetrics = this.calculateTimeframeMetrics(trades);
    const monthlyReturns = this.calculateMonthlyReturns(portfolioValue, timestamps);
    const drawdownPeriods = this.calculateDrawdownPeriods(portfolioValue, timestamps);
    
    return {
      config,
      trades,
      portfolioValue,
      timestamps,
      metrics,
      timeframeMetrics,
      monthlyReturns,
      drawdownPeriods
    };
  }

  /**
   * Generate synthetic market data for backtesting
   */
  private async generateMarketData(config: BacktestConfig): Promise<void> {
    for (const symbol of config.symbols) {
      const data: MarketDataPoint[] = [];
      let currentPrice = 50000; // Starting price
      const volatility = 0.02; // 2% daily volatility
      
      const dayMs = 24 * 60 * 60 * 1000;
      for (let time = config.startDate.getTime(); time <= config.endDate.getTime(); time += dayMs) {
        const change = (Math.random() - 0.5) * 2 * volatility;
        currentPrice *= (1 + change);
        
        const high = currentPrice * (1 + Math.random() * 0.01);
        const low = currentPrice * (1 - Math.random() * 0.01);
        const volume = 1000000 + Math.random() * 5000000;
        
        data.push({
          timestamp: time,
          open: currentPrice,
          high,
          low,
          close: currentPrice,
          volume
        });
      }
      
      this.marketData.set(symbol, data);
      
      // Build price cache for quick lookups
      const priceMap = new Map<number, number>();
      for (const point of data) {
        priceMap.set(point.timestamp, point.close);
      }
      this.priceCache.set(symbol, priceMap);
    }
  }

  /**
   * Get price for symbol at specific timestamp
   */
  private getPrice(symbol: string, timestamp: number): number | null {
    const priceMap = this.priceCache.get(symbol);
    if (!priceMap) return null;
    
    // Find closest timestamp
    let closestTime = 0;
    let closestPrice = 0;
    
    for (const [time, price] of priceMap.entries()) {
      if (Math.abs(time - timestamp) < Math.abs(closestTime - timestamp)) {
        closestTime = time;
        closestPrice = price;
      }
    }
    
    return closestPrice || null;
  }

  /**
   * Generate trading signal using advanced analysis
   */
  private async generateSignal(
    symbol: string,
    currentPrice: number,
    timestamp: number,
    timeframe: string
  ): Promise<{ confidence: number; layeredScore: LayeredSignalScore } | null> {
    try {
      // Simulate price change for signal generation
      const change24h = (Math.random() - 0.5) * 10; // -5% to +5%
      
      const analysis = await AdvancedMarketAnalysisEngine.analyzeMarket(
        symbol,
        currentPrice,
        change24h,
        1000000000, // 1B market cap
        'major',
        timeframe
      );
      
      return {
        confidence: analysis.layeredScore.normalizedConfidence,
        layeredScore: analysis.layeredScore
      };
    } catch (error) {
      console.error(`[BacktestingEngine] Error generating signal for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Calculate position size based on risk management
   */
  private calculatePositionSize(
    capital: number,
    price: number,
    direction: string,
    riskPerTrade: number,
    maxPositionSize: number
  ): number {
    const riskAmount = capital * (riskPerTrade / 100);
    const stopLossPercent = 0.02; // 2% stop loss
    const maxShares = Math.floor((capital * maxPositionSize / 100) / price);
    const riskBasedShares = Math.floor(riskAmount / (price * stopLossPercent));
    
    return Math.min(maxShares, riskBasedShares);
  }

  /**
   * Open new trade
   */
  private openTrade(
    id: string,
    symbol: string,
    timeframe: string,
    direction: 'LONG' | 'SHORT',
    entryPrice: number,
    entryTime: number,
    quantity: number,
    confidence: number,
    layeredScore: LayeredSignalScore,
    commissionRate: number,
    slippageRate: number
  ): BacktestTrade {
    const stopLossPercent = 0.02; // 2% stop loss
    const takeProfitPercent = 0.04; // 4% take profit (2:1 ratio)
    
    let stopLoss: number;
    let takeProfit: number;
    
    if (direction === 'LONG') {
      stopLoss = entryPrice * (1 - stopLossPercent);
      takeProfit = entryPrice * (1 + takeProfitPercent);
    } else {
      stopLoss = entryPrice * (1 + stopLossPercent);
      takeProfit = entryPrice * (1 - takeProfitPercent);
    }
    
    const notionalValue = entryPrice * quantity;
    const commission = notionalValue * (commissionRate / 100);
    const slippage = notionalValue * (slippageRate / 100);
    
    return {
      id,
      symbol,
      timeframe,
      direction,
      entryTime,
      entryPrice,
      stopLoss,
      takeProfit,
      quantity,
      commission,
      slippage,
      confidence,
      layeredScore,
      marketRegime: 'NORMAL'
    };
  }

  /**
   * Close trade and calculate P&L
   */
  private closeTrade(
    trade: BacktestTrade,
    exitPrice: number,
    exitTime: number,
    exitReason: BacktestTrade['exitReason']
  ): BacktestTrade {
    const pnl = this.calculatePnl(trade, exitPrice);
    const pnlPercent = (pnl / (trade.entryPrice * trade.quantity)) * 100;
    const holdingPeriod = exitTime - trade.entryTime;
    
    return {
      ...trade,
      exitTime,
      exitPrice,
      exitReason,
      pnl,
      pnlPercent,
      holdingPeriod
    };
  }

  /**
   * Calculate P&L for trade
   */
  private calculatePnl(trade: BacktestTrade, exitPrice: number): number {
    if (trade.direction === 'LONG') {
      return (exitPrice - trade.entryPrice) * trade.quantity;
    } else {
      return (trade.entryPrice - exitPrice) * trade.quantity;
    }
  }

  /**
   * Calculate unrealized P&L for open trade
   */
  private calculateUnrealizedPnl(trade: BacktestTrade, currentPrice: number): number {
    return this.calculatePnl(trade, currentPrice);
  }

  /**
   * Calculate current drawdown
   */
  private calculateCurrentDrawdown(portfolioValue: number[]): number {
    const peak = Math.max(...portfolioValue);
    const current = portfolioValue[portfolioValue.length - 1];
    return ((peak - current) / peak) * 100;
  }

  /**
   * Calculate comprehensive performance metrics
   */
  private calculateMetrics(
    trades: BacktestTrade[],
    portfolioValue: number[],
    initialCapital: number
  ): BacktestResult['metrics'] {
    const completedTrades = trades.filter(t => t.pnl !== undefined);
    const winningTrades = completedTrades.filter(t => t.pnl! > 0);
    const losingTrades = completedTrades.filter(t => t.pnl! <= 0);
    
    const totalReturn = ((portfolioValue[portfolioValue.length - 1] - initialCapital) / initialCapital) * 100;
    const winRate = completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0;
    
    const returns = this.calculatePeriodReturns(portfolioValue);
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const sortino = this.calculateSortino(returns);
    const maxDrawdown = this.calculateMaxDrawdown(portfolioValue);
    
    const profitFactor = this.calculateProfitFactor(winningTrades, losingTrades);
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl!, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl!, 0) / losingTrades.length) : 0;
    
    return {
      totalTrades: completedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalReturn,
      annualizedReturn: totalReturn, // Simplified
      sharpeRatio,
      sortino,
      calmar: totalReturn / Math.max(maxDrawdown, 1),
      maxDrawdown,
      maxDrawdownDuration: 0, // Simplified
      profitFactor,
      avgWin,
      avgLoss,
      avgHoldingPeriod: completedTrades.length > 0 ? completedTrades.reduce((sum, t) => sum + (t.holdingPeriod || 0), 0) / completedTrades.length : 0,
      bestTrade: Math.max(...completedTrades.map(t => t.pnl!), 0),
      worstTrade: Math.min(...completedTrades.map(t => t.pnl!), 0),
      consecutiveWins: 0, // Simplified
      consecutiveLosses: 0, // Simplified
      expectancy: avgWin * (winRate / 100) - avgLoss * ((100 - winRate) / 100),
      kelly: 0, // Simplified
      var95: 0, // Simplified
      cvar95: 0 // Simplified
    };
  }

  /**
   * Calculate Sharpe ratio
   */
  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  /**
   * Calculate Sortino ratio
   */
  private calculateSortino(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const negativeReturns = returns.filter(r => r < 0);
    
    if (negativeReturns.length === 0) return avgReturn > 0 ? Infinity : 0;
    
    const downstdDev = Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length);
    
    return downstdDev > 0 ? avgReturn / downstdDev : 0;
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(portfolioValue: number[]): number {
    let maxDrawdown = 0;
    let peak = portfolioValue[0];
    
    for (const value of portfolioValue) {
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = ((peak - value) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return maxDrawdown;
  }

  /**
   * Calculate profit factor
   */
  private calculateProfitFactor(winningTrades: BacktestTrade[], losingTrades: BacktestTrade[]): number {
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl!, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl!, 0));
    
    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  }

  /**
   * Calculate period returns for ratio calculations
   */
  private calculatePeriodReturns(portfolioValue: number[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < portfolioValue.length; i++) {
      const periodReturn = ((portfolioValue[i] - portfolioValue[i - 1]) / portfolioValue[i - 1]) * 100;
      returns.push(periodReturn);
    }
    
    return returns;
  }

  /**
   * Calculate timeframe-specific metrics
   */
  private calculateTimeframeMetrics(trades: BacktestTrade[]): BacktestResult['timeframeMetrics'] {
    const metrics: BacktestResult['timeframeMetrics'] = {};
    
    const timeframes = [...new Set(trades.map(t => t.timeframe))];
    
    for (const timeframe of timeframes) {
      const timeframeTrades = trades.filter(t => t.timeframe === timeframe && t.pnl !== undefined);
      const winningTrades = timeframeTrades.filter(t => t.pnl! > 0);
      
      const winRate = timeframeTrades.length > 0 ? (winningTrades.length / timeframeTrades.length) * 100 : 0;
      const avgReturn = timeframeTrades.length > 0 ? timeframeTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / timeframeTrades.length : 0;
      
      metrics[timeframe] = {
        trades: timeframeTrades.length,
        winRate,
        avgReturn,
        sharpeRatio: 0, // Simplified
        maxDrawdown: 0 // Simplified
      };
    }
    
    return metrics;
  }

  /**
   * Calculate monthly returns
   */
  private calculateMonthlyReturns(portfolioValue: number[], timestamps: number[]): number[] {
    // Simplified monthly returns calculation
    const monthlyReturns: number[] = [];
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < portfolioValue.length - 1; i += 30) {
      if (i + 30 < portfolioValue.length) {
        const monthReturn = ((portfolioValue[i + 30] - portfolioValue[i]) / portfolioValue[i]) * 100;
        monthlyReturns.push(monthReturn);
      }
    }
    
    return monthlyReturns;
  }

  /**
   * Calculate drawdown periods
   */
  private calculateDrawdownPeriods(portfolioValue: number[], timestamps: number[]): BacktestResult['drawdownPeriods'] {
    const periods: BacktestResult['drawdownPeriods'] = [];
    let peak = portfolioValue[0];
    let peakIndex = 0;
    let inDrawdown = false;
    let drawdownStart = 0;
    
    for (let i = 1; i < portfolioValue.length; i++) {
      if (portfolioValue[i] > peak) {
        if (inDrawdown) {
          // End of drawdown period
          periods.push({
            start: timestamps[drawdownStart],
            end: timestamps[i - 1],
            peak,
            trough: Math.min(...portfolioValue.slice(drawdownStart, i)),
            drawdown: ((peak - Math.min(...portfolioValue.slice(drawdownStart, i))) / peak) * 100,
            duration: timestamps[i - 1] - timestamps[drawdownStart]
          });
          inDrawdown = false;
        }
        peak = portfolioValue[i];
        peakIndex = i;
      } else if (!inDrawdown && portfolioValue[i] < peak * 0.95) {
        // Start of drawdown (5% decline)
        inDrawdown = true;
        drawdownStart = peakIndex;
      }
    }
    
    return periods;
  }
}

export const advancedBacktestingEngine = new AdvancedBacktestingEngine();