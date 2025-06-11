/**
 * Unified Risk Management System
 * Mathematically correct and consistent take profit/stop loss calculations
 * Eliminates inconsistencies across all calculation engines
 */

export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';
export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '12h' | '1d' | '3d' | '1w' | '1M';

export interface RiskParameters {
  stopLossPercent: number;
  takeProfitPercent: number;
  riskRewardRatio: number;
  maxRiskPercent: number;
}

export interface CalculatedLevels {
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  riskPercent: number;
  rewardPercent: number;
}

/**
 * Timeframe-based risk parameters with realistic market percentages
 * Based on historical volatility and typical trading ranges
 */
const TIMEFRAME_RISK_PARAMETERS: Record<TimeFrame, RiskParameters> = {
  '1m': { stopLossPercent: 0.15, takeProfitPercent: 0.30, riskRewardRatio: 2.0, maxRiskPercent: 0.5 },
  '5m': { stopLossPercent: 0.25, takeProfitPercent: 0.50, riskRewardRatio: 2.0, maxRiskPercent: 0.8 },
  '15m': { stopLossPercent: 0.40, takeProfitPercent: 0.80, riskRewardRatio: 2.0, maxRiskPercent: 1.2 },
  '30m': { stopLossPercent: 0.60, takeProfitPercent: 1.20, riskRewardRatio: 2.0, maxRiskPercent: 1.8 },
  '1h': { stopLossPercent: 0.80, takeProfitPercent: 1.60, riskRewardRatio: 2.0, maxRiskPercent: 2.5 },
  '4h': { stopLossPercent: 1.50, takeProfitPercent: 3.75, riskRewardRatio: 2.5, maxRiskPercent: 4.0 },
  '12h': { stopLossPercent: 2.20, takeProfitPercent: 5.50, riskRewardRatio: 2.5, maxRiskPercent: 6.0 },
  '1d': { stopLossPercent: 3.00, takeProfitPercent: 7.50, riskRewardRatio: 2.5, maxRiskPercent: 8.0 },
  '3d': { stopLossPercent: 4.50, takeProfitPercent: 13.50, riskRewardRatio: 3.0, maxRiskPercent: 12.0 },
  '1w': { stopLossPercent: 6.00, takeProfitPercent: 18.00, riskRewardRatio: 3.0, maxRiskPercent: 15.0 },
  '1M': { stopLossPercent: 8.00, takeProfitPercent: 24.00, riskRewardRatio: 3.0, maxRiskPercent: 20.0 }
};

/**
 * Calculate mathematically correct stop loss and take profit levels
 * Ensures consistent risk/reward ratios across all timeframes and directions
 */
export function calculateUnifiedRiskLevels(
  entryPrice: number,
  direction: SignalDirection,
  timeframe: TimeFrame,
  customRiskReward?: number
): CalculatedLevels {
  if (entryPrice <= 0) {
    throw new Error('Entry price must be positive');
  }

  const params = TIMEFRAME_RISK_PARAMETERS[timeframe];
  if (!params) {
    throw new Error(`Invalid timeframe: ${timeframe}`);
  }

  const riskRewardRatio = customRiskReward || params.riskRewardRatio;
  let stopLoss: number;
  let takeProfit: number;

  if (direction === 'LONG') {
    // LONG position: Stop loss below entry, take profit above entry
    stopLoss = entryPrice * (1 - params.stopLossPercent / 100);
    takeProfit = entryPrice * (1 + params.takeProfitPercent / 100);
  } else if (direction === 'SHORT') {
    // SHORT position: Stop loss above entry, take profit below entry
    stopLoss = entryPrice * (1 + params.stopLossPercent / 100);
    takeProfit = entryPrice * (1 - params.takeProfitPercent / 100);
  } else {
    // NEUTRAL position: Conservative symmetric levels
    const neutralRisk = params.stopLossPercent * 0.5; // Half the normal risk
    stopLoss = entryPrice * (1 - neutralRisk / 100);
    takeProfit = entryPrice * (1 + neutralRisk / 100);
  }

  // Calculate actual percentages for validation
  const actualRiskPercent = Math.abs((stopLoss - entryPrice) / entryPrice) * 100;
  const actualRewardPercent = Math.abs((takeProfit - entryPrice) / entryPrice) * 100;
  const actualRiskReward = actualRewardPercent / actualRiskPercent;

  // Validate calculations
  if (direction === 'LONG') {
    if (stopLoss >= entryPrice) {
      throw new Error('LONG stop loss must be below entry price');
    }
    if (takeProfit <= entryPrice) {
      throw new Error('LONG take profit must be above entry price');
    }
  } else if (direction === 'SHORT') {
    if (stopLoss <= entryPrice) {
      throw new Error('SHORT stop loss must be above entry price');
    }
    if (takeProfit >= entryPrice) {
      throw new Error('SHORT take profit must be below entry price');
    }
  }

  return {
    stopLoss: Number(stopLoss.toFixed(2)),
    takeProfit: Number(takeProfit.toFixed(2)),
    riskRewardRatio: Number(actualRiskReward.toFixed(2)),
    riskPercent: Number(actualRiskPercent.toFixed(2)),
    rewardPercent: Number(actualRewardPercent.toFixed(2))
  };
}

/**
 * Validate risk levels are mathematically sound
 */
export function validateRiskLevels(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  direction: SignalDirection
): boolean {
  try {
    if (direction === 'LONG') {
      return stopLoss < entryPrice && takeProfit > entryPrice;
    } else if (direction === 'SHORT') {
      return stopLoss > entryPrice && takeProfit < entryPrice;
    }
    return true; // NEUTRAL positions are flexible
  } catch {
    return false;
  }
}

/**
 * Get risk parameters for a specific timeframe
 */
export function getRiskParameters(timeframe: TimeFrame): RiskParameters {
  return TIMEFRAME_RISK_PARAMETERS[timeframe] || TIMEFRAME_RISK_PARAMETERS['1h'];
}

/**
 * Calculate position size based on risk percentage
 */
export function calculatePositionSize(
  accountBalance: number,
  entryPrice: number,
  stopLoss: number,
  riskPercentage: number = 2
): number {
  const riskAmount = accountBalance * (riskPercentage / 100);
  const priceRisk = Math.abs(entryPrice - stopLoss);
  const positionSize = riskAmount / priceRisk;
  
  return Number(positionSize.toFixed(8));
}

/**
 * Format risk levels for display
 */
export function formatRiskLevels(levels: CalculatedLevels): string {
  return `SL: ${levels.stopLoss} (${levels.riskPercent}%) | TP: ${levels.takeProfit} (${levels.rewardPercent}%) | R:R ${levels.riskRewardRatio}:1`;
}