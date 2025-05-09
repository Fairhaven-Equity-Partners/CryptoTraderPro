import { LeverageParams, LeverageResult } from '../types';

/**
 * Calculates safe leverage based on risk parameters and includes comprehensive
 * position sizing recommendations with take profit and stop loss levels
 */
export function calculateSafeLeverage(params: LeverageParams): LeverageResult {
  const { positionSize, riskPercentage, entryPrice, stopLoss, takeProfit } = params;
  
  // Calculate price change percentage to stop loss
  const priceChangePercentage = Math.abs((stopLoss - entryPrice) / entryPrice * 100);
  
  // Calculate max leverage based on risk tolerance
  const maxLeverage = Math.floor(riskPercentage / priceChangePercentage * 100) / 10;
  
  // Ensure leverage is within reasonable bounds (adjusted based on volatility)
  // More volatile assets should use lower leverage
  let maxAllowedLeverage = 20;
  
  // Provide different leverage recommendations based on price change percentage
  // Higher volatility should have lower max leverage
  if (priceChangePercentage < 0.5) {
    maxAllowedLeverage = 20; // Low volatility can use higher leverage
  } else if (priceChangePercentage < 1) {
    maxAllowedLeverage = 15;
  } else if (priceChangePercentage < 1.5) {
    maxAllowedLeverage = 10;
  } else if (priceChangePercentage < 2) {
    maxAllowedLeverage = 7;
  } else if (priceChangePercentage < 3) {
    maxAllowedLeverage = 5;
  } else if (priceChangePercentage < 5) {
    maxAllowedLeverage = 3;
  } else {
    maxAllowedLeverage = 2; // Very volatile assets should use very low leverage
  }
  
  const safeLeverage = Math.min(Math.max(1, maxLeverage), maxAllowedLeverage);
  
  // Calculate risk amount in currency
  const riskAmount = positionSize * (riskPercentage / 100);
  
  // Calculate potential profit if take profit is specified
  let potentialProfit = 0;
  let riskRewardRatio = '0';
  
  if (takeProfit) {
    // Calculate profit based on percentage change and actual position size
    const profitPercentage = Math.abs((takeProfit - entryPrice) / entryPrice * 100);
    // Calculate profit based on the actual position size in crypto, not just USDT amount
    const positionSizeInCrypto = positionSize / entryPrice;
    potentialProfit = positionSizeInCrypto * (takeProfit - entryPrice) * safeLeverage;
    riskRewardRatio = (potentialProfit / riskAmount).toFixed(2);
  }
  
  // Calculate liquidation price (more precise formula)
  let liquidationPrice = 0;
  const maintenanceMargin = 0.005; // 0.5% typical maintenance margin
  
  if (stopLoss < entryPrice) { // LONG position
    liquidationPrice = entryPrice * (1 - (1 / safeLeverage) + maintenanceMargin);
  } else { // SHORT position
    liquidationPrice = entryPrice * (1 + (1 / safeLeverage) - maintenanceMargin);
  }
  
  // Calculate multiple take profit levels
  const tp1 = stopLoss < entryPrice ? 
    entryPrice * (1 + (priceChangePercentage / 100)) : 
    entryPrice * (1 - (priceChangePercentage / 100));
    
  const tp2 = stopLoss < entryPrice ? 
    entryPrice * (1 + (priceChangePercentage / 100) * 2) : 
    entryPrice * (1 - (priceChangePercentage / 100) * 2);
    
  const tp3 = stopLoss < entryPrice ? 
    entryPrice * (1 + (priceChangePercentage / 100) * 3) : 
    entryPrice * (1 - (priceChangePercentage / 100) * 3);
  
  // Calculate position size based on risk and current price
  const recommendedPositionSize = (riskAmount / (priceChangePercentage / 100)) / entryPrice;
  
  return {
    recommendedLeverage: safeLeverage.toFixed(1),
    maxLoss: riskAmount.toFixed(2),
    potentialProfit: potentialProfit.toFixed(2),
    riskRewardRatio,
    liquidationPrice: liquidationPrice.toFixed(2),
    takeProfitLevels: {
      tp1: tp1.toFixed(2),
      tp2: tp2.toFixed(2),
      tp3: tp3.toFixed(2)
    },
    recommendedPositionSize: recommendedPositionSize.toFixed(4),
    maxPositionSize: (recommendedPositionSize * safeLeverage).toFixed(4)
  };
}

/**
 * Calculate leverage recommendations for different timeframes
 * @param baseParams Base parameters for calculation
 * @param volatilityAdjustment Whether to adjust for timeframe volatility
 */
export function calculateTimeframeLeverage(
  baseParams: LeverageParams, 
  timeframe: string,
  volatilityAdjustment = true
): LeverageResult {
  // Clone the base params to avoid modifying the original
  const params = { ...baseParams };
  
  // Adjust risk parameters based on timeframe volatility
  if (volatilityAdjustment) {
    switch (timeframe) {
      case '1m':
        // Scalping timeframe - highest volatility, lowest leverage
        params.riskPercentage = Math.min(params.riskPercentage, 0.5);
        break;
      case '5m':
        params.riskPercentage = Math.min(params.riskPercentage, 0.75);
        break;
      case '15m':
        params.riskPercentage = Math.min(params.riskPercentage, 1);
        break;
      case '30m':
        params.riskPercentage = Math.min(params.riskPercentage, 1.25);
        break;
      case '1h':
        params.riskPercentage = Math.min(params.riskPercentage, 1.5);
        break;
      case '4h':
        params.riskPercentage = Math.min(params.riskPercentage, 2);
        break;
      case '1d':
        // Daily timeframe - lower volatility, can use higher leverage
        params.riskPercentage = Math.min(params.riskPercentage, 3);
        break;
      case '1w':
        params.riskPercentage = Math.min(params.riskPercentage, 5);
        break;
      default:
        // No adjustment
        break;
    }
  }
  
  // Calculate leverage with adjusted parameters
  return calculateSafeLeverage(params);
}

// Format currency values
export function formatCurrency(value: number | string, currency = 'USD', minimumFractionDigits = 2): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return `$0.00`;
  }
  
  const absValue = Math.abs(numValue);
  
  // For cryptocurrency values with decimal places
  if (currency === 'USD') {
    if (absValue >= 1000) {
      return `$${numValue.toLocaleString('en-US', { minimumFractionDigits, maximumFractionDigits: minimumFractionDigits })}`;
    } else if (absValue >= 1) {
      return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (absValue >= 0.01) {
      return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
    } else {
      return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })}`;
    }
  }
  
  // For crypto assets
  if (absValue >= 1000) {
    return `${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (absValue >= 1) {
    return `${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  } else {
    return `${numValue.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 })}`;
  }
}

// Format percentage values
export function formatPercentage(value: number | string, includeSign = true): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0.00%';
  }
  
  const sign = includeSign && numValue > 0 ? '+' : '';
  return `${sign}${numValue.toFixed(2)}%`;
}

// Determine if the price movement is positive or negative
export function getPriceChangeClass(change: number | string): string {
  const numChange = typeof change === 'string' ? parseFloat(change) : change;
  
  if (isNaN(numChange)) {
    return 'text-neutral';
  }
  
  return numChange > 0 ? 'text-success' : numChange < 0 ? 'text-danger' : 'text-neutral';
}

// Format price based on the asset type and value
export function formatPrice(price: number | string, symbol: string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '$0.00';
  }
  
  // Handle different price scales based on the asset
  if (symbol.includes('BTC') || symbol.includes('ETH')) {
    if (numPrice >= 1000) {
      return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  } else if (numPrice < 0.01) {
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`;
  } else if (numPrice < 1) {
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  } else {
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
