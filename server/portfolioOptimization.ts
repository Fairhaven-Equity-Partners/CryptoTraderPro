/**
 * Portfolio Optimization Engine
 * Implements Modern Portfolio Theory, Kelly Criterion, and advanced risk management
 * Provides optimal allocation strategies based on signal confidence and historical performance
 */

import { AdvancedAnalyticsEngine, type AdvancedAccuracyMetrics } from './advancedAnalytics.js';

export interface AssetAllocation {
  symbol: string;
  weight: number;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  confidence: number;
  maxDrawdown: number;
  correlationToMarket: number;
}

export interface PortfolioMetrics {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  treynorRatio: number;
  diversificationRatio: number;
}

export interface OptimizationConstraints {
  maxWeight: number;
  minWeight: number;
  maxSectorConcentration: number;
  targetVolatility?: number;
  minSharpeRatio?: number;
  maxCorrelation: number;
  riskFreeRate: number;
}

export interface PortfolioOptimizationResult {
  allocations: AssetAllocation[];
  metrics: PortfolioMetrics;
  rebalanceFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  riskLevel: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  confidenceScore: number;
  backtestPeriods: {
    period: string;
    return: number;
    volatility: number;
    sharpe: number;
    maxDrawdown: number;
  }[];
}

export interface RiskManagementRules {
  stopLossPercent: number;
  takeProfitPercent: number;
  maxPositionSize: number;
  maxDrawdownStop: number;
  correlationLimit: number;
  volatilityLimit: number;
  concentrationLimit: number;
}

export class PortfolioOptimizationEngine {
  private readonly riskFreeRate = 0.02; // 2% annual risk-free rate
  private covarianceMatrix: Map<string, Map<string, number>> = new Map();
  private correlationMatrix: Map<string, Map<string, number>> = new Map();

  /**
   * Optimize portfolio allocation using Modern Portfolio Theory
   */
  async optimizePortfolio(
    assets: string[],
    historicalMetrics: Map<string, AdvancedAccuracyMetrics>,
    constraints: OptimizationConstraints,
    targetReturn?: number
  ): Promise<PortfolioOptimizationResult> {
    console.log(`[PortfolioOptimization] Optimizing portfolio for ${assets.length} assets`);

    // Calculate expected returns and risk metrics
    const assetMetrics = this.calculateAssetMetrics(assets, historicalMetrics);
    
    // Build covariance and correlation matrices
    this.buildCovarianceMatrix(assetMetrics);
    this.buildCorrelationMatrix(assetMetrics);
    
    // Apply optimization algorithm
    const allocations = targetReturn 
      ? this.optimizeForTargetReturn(assetMetrics, targetReturn, constraints)
      : this.optimizeForMaxSharpe(assetMetrics, constraints);
    
    // Calculate portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(allocations);
    
    // Determine risk level and rebalance frequency
    const riskLevel = this.determineRiskLevel(portfolioMetrics);
    const rebalanceFrequency = this.determineRebalanceFrequency(riskLevel, portfolioMetrics.volatility);
    
    // Calculate confidence score
    const confidenceScore = this.calculatePortfolioConfidence(allocations);
    
    // Generate backtest scenarios
    const backtestPeriods = this.generateBacktestScenarios(allocations);

    return {
      allocations,
      metrics: portfolioMetrics,
      rebalanceFrequency,
      riskLevel,
      confidenceScore,
      backtestPeriods
    };
  }

  /**
   * Calculate Kelly Criterion optimal position sizing
   */
  calculateKellyOptimal(
    winRate: number,
    avgWin: number,
    avgLoss: number,
    confidence: number
  ): number {
    if (avgLoss === 0 || winRate === 0) return 0;
    
    const winLossRatio = avgWin / avgLoss;
    const lossRate = 1 - (winRate / 100);
    
    // Kelly formula: f = (bp - q) / b
    // where b = win/loss ratio, p = win rate, q = loss rate
    const kellyFraction = ((winLossRatio * (winRate / 100)) - lossRate) / winLossRatio;
    
    // Apply confidence adjustment and safety factor
    const confidenceAdjustment = confidence / 100;
    const safetyFactor = 0.5; // Use half Kelly for safety
    
    return Math.max(0, Math.min(0.25, kellyFraction * confidenceAdjustment * safetyFactor));
  }

  /**
   * Generate dynamic risk management rules based on market conditions
   */
  generateRiskManagementRules(
    marketVolatility: number,
    marketRegime: string,
    portfolioMetrics: PortfolioMetrics
  ): RiskManagementRules {
    let baseStopLoss = 0.02; // 2% base stop loss
    let baseTakeProfit = 0.04; // 4% base take profit
    let maxPosition = 0.1; // 10% max position
    
    // Adjust for market volatility
    if (marketVolatility > 0.05) { // High volatility
      baseStopLoss *= 1.5;
      baseTakeProfit *= 1.3;
      maxPosition *= 0.8;
    } else if (marketVolatility < 0.02) { // Low volatility
      baseStopLoss *= 0.8;
      baseTakeProfit *= 0.9;
      maxPosition *= 1.2;
    }
    
    // Adjust for market regime
    switch (marketRegime) {
      case 'BEAR':
        baseStopLoss *= 0.8; // Tighter stops in bear market
        maxPosition *= 0.7;
        break;
      case 'HIGH_VOLATILITY':
        baseStopLoss *= 1.3;
        baseTakeProfit *= 1.2;
        maxPosition *= 0.6;
        break;
      case 'LOW_VOLATILITY':
        maxPosition *= 1.1;
        break;
    }
    
    return {
      stopLossPercent: Math.min(0.05, Math.max(0.01, baseStopLoss)),
      takeProfitPercent: Math.min(0.08, Math.max(0.02, baseTakeProfit)),
      maxPositionSize: Math.min(0.2, Math.max(0.05, maxPosition)),
      maxDrawdownStop: 0.15, // 15% max portfolio drawdown
      correlationLimit: 0.7,
      volatilityLimit: 0.3,
      concentrationLimit: 0.3 // Max 30% in any single asset
    };
  }

  /**
   * Calculate asset metrics from historical performance
   */
  private calculateAssetMetrics(
    assets: string[],
    historicalMetrics: Map<string, AdvancedAccuracyMetrics>
  ): AssetAllocation[] {
    return assets.map(symbol => {
      const metrics = historicalMetrics.get(symbol);
      
      if (!metrics) {
        // Default metrics for assets without history
        return {
          symbol,
          weight: 0,
          expectedReturn: 0.05, // 5% default expected return
          volatility: 0.15, // 15% default volatility
          sharpeRatio: 0.33,
          confidence: 50,
          maxDrawdown: 0.1,
          correlationToMarket: 0.5
        };
      }
      
      // Calculate annualized metrics
      const annualizedReturn = metrics.totalPnLPercent / 100;
      const volatility = Math.sqrt(252) * (metrics.avgReturn / 100); // Annualized volatility
      const sharpeRatio = volatility > 0 ? annualizedReturn / volatility : 0;
      
      return {
        symbol,
        weight: 0, // Will be optimized
        expectedReturn: annualizedReturn,
        volatility: Math.max(0.05, volatility), // Minimum 5% volatility
        sharpeRatio: metrics.sharpeRatio,
        confidence: metrics.winRate,
        maxDrawdown: metrics.maxDrawdownPercent / 100,
        correlationToMarket: 0.6 // Estimated correlation
      };
    });
  }

  /**
   * Build covariance matrix for portfolio optimization
   */
  private buildCovarianceMatrix(assets: AssetAllocation[]): void {
    this.covarianceMatrix.clear();
    
    for (const asset1 of assets) {
      const row = new Map<string, number>();
      
      for (const asset2 of assets) {
        if (asset1.symbol === asset2.symbol) {
          // Variance on diagonal
          row.set(asset2.symbol, Math.pow(asset1.volatility, 2));
        } else {
          // Estimated covariance (simplified)
          const correlation = this.estimateCorrelation(asset1.symbol, asset2.symbol);
          const covariance = correlation * asset1.volatility * asset2.volatility;
          row.set(asset2.symbol, covariance);
        }
      }
      
      this.covarianceMatrix.set(asset1.symbol, row);
    }
  }

  /**
   * Build correlation matrix
   */
  private buildCorrelationMatrix(assets: AssetAllocation[]): void {
    this.correlationMatrix.clear();
    
    for (const asset1 of assets) {
      const row = new Map<string, number>();
      
      for (const asset2 of assets) {
        const correlation = asset1.symbol === asset2.symbol 
          ? 1.0 
          : this.estimateCorrelation(asset1.symbol, asset2.symbol);
        row.set(asset2.symbol, correlation);
      }
      
      this.correlationMatrix.set(asset1.symbol, row);
    }
  }

  /**
   * Estimate correlation between two assets
   */
  private estimateCorrelation(symbol1: string, symbol2: string): number {
    // Simplified correlation estimation
    if (symbol1 === symbol2) return 1.0;
    
    // Major crypto pairs have higher correlation
    const majorCryptos = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
    const isMajor1 = majorCryptos.includes(symbol1);
    const isMajor2 = majorCryptos.includes(symbol2);
    
    if (isMajor1 && isMajor2) return 0.8; // High correlation between majors
    if (isMajor1 || isMajor2) return 0.6; // Medium correlation with majors
    
    return 0.4; // Lower correlation for altcoins
  }

  /**
   * Optimize portfolio for maximum Sharpe ratio
   */
  private optimizeForMaxSharpe(
    assets: AssetAllocation[],
    constraints: OptimizationConstraints
  ): AssetAllocation[] {
    const n = assets.length;
    let bestWeights = new Array(n).fill(1 / n); // Equal weights as starting point
    let bestSharpe = this.calculatePortfolioSharpe(assets, bestWeights);
    
    // Simple optimization using random search with constraints
    const iterations = 10000;
    
    for (let i = 0; i < iterations; i++) {
      const weights = this.generateRandomWeights(n, constraints);
      const sharpe = this.calculatePortfolioSharpe(assets, weights);
      
      if (sharpe > bestSharpe) {
        bestSharpe = sharpe;
        bestWeights = weights.slice();
      }
    }
    
    // Apply weights to assets
    return assets.map((asset, index) => ({
      ...asset,
      weight: bestWeights[index]
    }));
  }

  /**
   * Optimize portfolio for target return
   */
  private optimizeForTargetReturn(
    assets: AssetAllocation[],
    targetReturn: number,
    constraints: OptimizationConstraints
  ): AssetAllocation[] {
    const n = assets.length;
    let bestWeights = new Array(n).fill(1 / n);
    let bestVariance = Infinity;
    
    const iterations = 10000;
    
    for (let i = 0; i < iterations; i++) {
      const weights = this.generateRandomWeights(n, constraints);
      const portfolioReturn = this.calculatePortfolioReturn(assets, weights);
      
      // Check if weights achieve target return (with tolerance)
      if (Math.abs(portfolioReturn - targetReturn) < 0.01) {
        const variance = this.calculatePortfolioVariance(assets, weights);
        
        if (variance < bestVariance) {
          bestVariance = variance;
          bestWeights = weights.slice();
        }
      }
    }
    
    return assets.map((asset, index) => ({
      ...asset,
      weight: bestWeights[index]
    }));
  }

  /**
   * Generate random weights with constraints
   */
  private generateRandomWeights(n: number, constraints: OptimizationConstraints): number[] {
    const weights = new Array(n);
    
    // Generate random weights
    for (let i = 0; i < n; i++) {
      weights[i] = Math.sin(Date.now() / 4000) * 0.4 + 0.5;
    }
    
    // Normalize to sum to 1
    const sum = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) {
      weights[i] /= sum;
    }
    
    // Apply constraints
    for (let i = 0; i < n; i++) {
      weights[i] = Math.max(constraints.minWeight, Math.min(constraints.maxWeight, weights[i]));
    }
    
    // Renormalize after constraints
    const newSum = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) {
      weights[i] /= newSum;
    }
    
    return weights;
  }

  /**
   * Calculate portfolio Sharpe ratio
   */
  private calculatePortfolioSharpe(assets: AssetAllocation[], weights: number[]): number {
    const portfolioReturn = this.calculatePortfolioReturn(assets, weights);
    const portfolioVariance = this.calculatePortfolioVariance(assets, weights);
    const portfolioStdDev = Math.sqrt(portfolioVariance);
    
    return portfolioStdDev > 0 ? (portfolioReturn - this.riskFreeRate) / portfolioStdDev : 0;
  }

  /**
   * Calculate portfolio expected return
   */
  private calculatePortfolioReturn(assets: AssetAllocation[], weights: number[]): number {
    return assets.reduce((sum, asset, index) => 
      sum + weights[index] * asset.expectedReturn, 0
    );
  }

  /**
   * Calculate portfolio variance
   */
  private calculatePortfolioVariance(assets: AssetAllocation[], weights: number[]): number {
    let variance = 0;
    
    for (let i = 0; i < assets.length; i++) {
      for (let j = 0; j < assets.length; j++) {
        const covariance = this.covarianceMatrix.get(assets[i].symbol)?.get(assets[j].symbol) || 0;
        variance += weights[i] * weights[j] * covariance;
      }
    }
    
    return variance;
  }

  /**
   * Calculate comprehensive portfolio metrics
   */
  private calculatePortfolioMetrics(allocations: AssetAllocation[]): PortfolioMetrics {
    const weights = allocations.map(a => a.weight);
    const expectedReturn = this.calculatePortfolioReturn(allocations, weights);
    const variance = this.calculatePortfolioVariance(allocations, weights);
    const volatility = Math.sqrt(variance);
    const sharpeRatio = volatility > 0 ? (expectedReturn - this.riskFreeRate) / volatility : 0;
    
    // Simplified calculations for other metrics
    const maxDrawdown = Math.max(...allocations.map(a => a.maxDrawdown * a.weight));
    const beta = allocations.reduce((sum, asset) => sum + asset.weight * asset.correlationToMarket, 0);
    const alpha = expectedReturn - (this.riskFreeRate + beta * (0.08 - this.riskFreeRate)); // Assuming 8% market return
    
    return {
      expectedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      var95: volatility * 1.645, // 95% VaR assuming normal distribution
      beta,
      alpha,
      informationRatio: alpha / volatility,
      treynorRatio: beta > 0 ? (expectedReturn - this.riskFreeRate) / beta : 0,
      diversificationRatio: this.calculateDiversificationRatio(allocations)
    };
  }

  /**
   * Calculate diversification ratio
   */
  private calculateDiversificationRatio(allocations: AssetAllocation[]): number {
    const weightedAvgVol = allocations.reduce((sum, asset) => 
      sum + asset.weight * asset.volatility, 0
    );
    
    const portfolioVol = Math.sqrt(this.calculatePortfolioVariance(
      allocations, 
      allocations.map(a => a.weight)
    ));
    
    return portfolioVol > 0 ? weightedAvgVol / portfolioVol : 1;
  }

  /**
   * Determine risk level based on portfolio metrics
   */
  private determineRiskLevel(metrics: PortfolioMetrics): 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' {
    if (metrics.volatility < 0.1 && metrics.maxDrawdown < 0.05) {
      return 'CONSERVATIVE';
    } else if (metrics.volatility < 0.2 && metrics.maxDrawdown < 0.15) {
      return 'MODERATE';
    } else {
      return 'AGGRESSIVE';
    }
  }

  /**
   * Determine optimal rebalance frequency
   */
  private determineRebalanceFrequency(
    riskLevel: string, 
    volatility: number
  ): 'DAILY' | 'WEEKLY' | 'MONTHLY' {
    if (riskLevel === 'AGGRESSIVE' || volatility > 0.25) {
      return 'DAILY';
    } else if (riskLevel === 'MODERATE' || volatility > 0.15) {
      return 'WEEKLY';
    } else {
      return 'MONTHLY';
    }
  }

  /**
   * Calculate portfolio confidence score
   */
  private calculatePortfolioConfidence(allocations: AssetAllocation[]): number {
    const weightedConfidence = allocations.reduce((sum, asset) => 
      sum + asset.weight * asset.confidence, 0
    );
    
    // Adjust for diversification
    const diversificationBonus = allocations.length > 1 ? 5 : 0;
    
    return Math.min(95, Math.max(25, weightedConfidence + diversificationBonus));
  }

  /**
   * Generate backtest scenarios
   */
  private generateBacktestScenarios(allocations: AssetAllocation[]): {
    period: string;
    return: number;
    volatility: number;
    sharpe: number;
    maxDrawdown: number;
  }[] {
    const scenarios = ['1M', '3M', '6M', '1Y'];
    
    return scenarios.map(period => {
      // Simplified scenario generation
      const baseReturn = allocations.reduce((sum, asset) => 
        sum + asset.weight * asset.expectedReturn, 0
      );
      
      const timeMultiplier = this.getTimeMultiplier(period);
      const volatility = Math.sqrt(this.calculatePortfolioVariance(
        allocations, 
        allocations.map(a => a.weight)
      )) * Math.sqrt(timeMultiplier);
      
      return {
        period,
        return: baseReturn * timeMultiplier,
        volatility,
        sharpe: volatility > 0 ? (baseReturn * timeMultiplier) / volatility : 0,
        maxDrawdown: volatility * 0.5 // Simplified max drawdown estimate
      };
    });
  }

  /**
   * Get time multiplier for annualized calculations
   */
  private getTimeMultiplier(period: string): number {
    switch (period) {
      case '1M': return 1/12;
      case '3M': return 1/4;
      case '6M': return 1/2;
      case '1Y': return 1;
      default: return 1;
    }
  }
}

export const portfolioOptimizationEngine = new PortfolioOptimizationEngine();