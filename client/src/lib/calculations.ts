import { LeverageParams, LeverageResult } from '../types';

// Calculate safe leverage based on risk parameters
export function calculateSafeLeverage(params: LeverageParams): LeverageResult {
  const { positionSize, riskPercentage, entryPrice, stopLoss, takeProfit } = params;
  
  // Calculate price change percentage to stop loss
  const priceChangePercentage = Math.abs((stopLoss - entryPrice) / entryPrice * 100);
  
  // Calculate max leverage based on risk tolerance
  const maxLeverage = Math.floor(riskPercentage / priceChangePercentage * 100) / 10;
  
  // Ensure leverage is within reasonable bounds
  const safeLeverage = Math.min(Math.max(1, maxLeverage), 20);
  
  // Calculate risk amount
  const riskAmount = positionSize * (riskPercentage / 100);
  
  // Calculate potential profit if take profit is specified
  let potentialProfit = 0;
  let riskRewardRatio = '0';
  
  if (takeProfit) {
    const profitPercentage = Math.abs((takeProfit - entryPrice) / entryPrice * 100);
    potentialProfit = (positionSize * (profitPercentage / 100)) * safeLeverage;
    riskRewardRatio = (potentialProfit / riskAmount).toFixed(2);
  }
  
  // Calculate liquidation price
  let liquidationPrice = 0;
  
  // Simplified liquidation calculation (would be more complex in reality)
  if (stopLoss < entryPrice) { // LONG position
    liquidationPrice = entryPrice * (1 - (1 / safeLeverage));
  } else { // SHORT position
    liquidationPrice = entryPrice * (1 + (1 / safeLeverage));
  }
  
  return {
    recommendedLeverage: safeLeverage.toFixed(1),
    maxLoss: riskAmount.toFixed(2),
    potentialProfit: potentialProfit.toFixed(2),
    riskRewardRatio,
    liquidationPrice: liquidationPrice.toFixed(2)
  };
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
