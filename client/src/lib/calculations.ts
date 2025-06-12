/**
 * Utility Functions for Calculations and Formatting
 * 
 * This file contains helper functions for common calculations
 * and formatting operations used across the application.
 */

/**
 * Format a number as a currency string with proper precision
 * 
 * @param price The price to format
 * @param currencySymbol Optional currency symbol (default: '$')
 * @param precision Optional decimal precision (default: 2 for values > 100, 4 for smaller values)
 * @returns Formatted currency string
 */
export function formatCurrency(price: number, currencySymbol = '$', precision?: number): string {
  if (price === 0 || isNaN(price)) {
    return `${currencySymbol}`0`;
  }
  
  // Determine appropriate precision based on price magnitude if not specified
  const calculatedPrecision = precision ?? (price >= 100 ? 2 : price >= 1 ? 4 : 6);
  
  // Format with thousands separators and appropriate decimal places
  const formattedPrice = price.toLocaleString('en-US', {
    minimumFractionDigits: calculatedPrecision,
    maximumFractionDigits: calculatedPrecision
  });
  
  return `${currencySymbol}${formattedPrice`}`;
}

/**
 * Format a number as a percentage string
 * 
 * @param value The percentage value (e.g., 0.15 for 15%)
 * @param convertFromDecimal Whether to convert from decimal (0.15) to percentage (15)
 * @param precision Number of decimal places to display
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, convertFromDecimal = false, precision = 2): string {
  if (isNaN(value)) {
    return '0%';
  }
  
  // Convert decimal to percentage value if needed
  const percentValue = convertFromDecimal ? value * 100 : value;
  
  // Format with specified precision
  return `${percentValue.toFixed(precision)}`%`;
}

/**
 * Calculate a reasonable take profit level based on entry and stop loss
 * 
 * @param entry Entry price
 * @param stopLoss Stop loss price
 * @param riskRewardRatio Desired risk-to-reward ratio (e.g., 2 means potential profit is 2x potential loss)
 * @returns Calculated take profit price
 */
export function calculateTakeProfit(entry: number, stopLoss: number, riskRewardRatio = 2): number {
  const riskAmount = Math.abs(entry - stopLoss);
  const rewardAmount = riskAmount * riskRewardRatio;
  
  return entry > stopLoss 
    ? entry + rewardAmount // Long position
    : entry - rewardAmount; // Short position
}

/**
 * Calculate risk/reward ratio given entry, stop loss, and take profit levels
 * 
 * @param entry Entry price
 * @param stopLoss Stop loss price
 * @param takeProfit Take profit price
 * @returns Risk/reward ratio (potential reward ÷ potential risk)
 */
export function calculateRiskRewardRatio(entry: number, stopLoss: number, takeProfit: number): number {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(entry - takeProfit);
  
  // Avoid division by zero
  if (risk === 0) return 0;
  
  return reward / risk;
}

/**
 * Calculate maximum recommended leverage based on volatility and risk tolerance
 * 
 * @param entry Entry price
 * @param stopLoss Stop loss price
 * @param marketVolatility Volatility measure (0-100)
 * @param riskTolerance Risk tolerance factor (0.5 = conservative, 1 = moderate, 2 = aggressive)
 * @returns Recommended leverage
 */
/**
 * Calculate safe leverage for a trade (alias for backward compatibility)
 * 
 * @param entry Entry price
 * @param stopLoss Stop loss price
 * @param volatility Market volatility index (0-100)
 * @returns Recommended safe leverage
 */
export function calculateSafeLeverage(
  entry: number,
  stopLoss: number,
  volatility = 50
): number {
  return calculateRecommendedLeverage(entry, stopLoss, volatility, 1);
}

/**
 * Calculate appropriate leverage based on timeframe
 * 
 * @param timeframe Trading timeframe
 * @param entry Entry price
 * @param stopLoss Stop loss price
 * @returns Recommended leverage for the timeframe
 */
export function calculateTimeframeLeverage(
  timeframe: string,
  entry: number,
  stopLoss: number
): number {
  // Timeframes have different risk profiles
  const timeframeRiskFactor: Record<string, number> = {
    '1m': 0.5,   // Very short timeframes are high risk
    '5m': 0.6,
    '15m': 0.7,
    '30m': 0.8,
    '1h': 0.9,
    '4h': 1.0,   // Base timeframe (moderate risk)
    '1d': 1.1,   // Longer timeframes can handle slightly higher leverage
    '3d': 1.2,
    '1w': 1.3,
    '1M': 1.4    // Monthly chart is most stable
  };
  
  // Get the risk factor, default to moderate (1.0)
  const riskFactor = timeframeRiskFactor[timeframe] || 1.0;
  
  // Calculate base leverage using the recommended formula
  const baseLeverage = calculateRecommendedLeverage(entry, stopLoss, 50, 1);
  
  // Apply the timeframe-specific risk factor
  return Math.min(Math.round(baseLeverage * riskFactor), 100);
}

export function calculateRecommendedLeverage(
  entry: number, 
  stopLoss: number, 
  marketVolatility = 50, 
  riskTolerance = 1
): number {
  // Calculate price difference percentage
  const priceDiffPercentage = Math.abs(entry - stopLoss) / entry * 100;
  
  // Inverse relationship between price movement and leverage
  // The smaller the stop distance, the higher leverage we can use
  let baseLeverage = 100 / priceDiffPercentage;
  
  // Adjust for market volatility (higher volatility = lower leverage)
  const volatilityFactor = 1 - (marketVolatility / 100) * 0.8;
  
  // Apply risk tolerance multiplier
  const adjustedLeverage = baseLeverage * volatilityFactor * riskTolerance;
  
  // Ensure reasonable bounds
  return Math.min(Math.max(Math.round(adjustedLeverage), 1), 100);
}

/**
 * Smooth out a signal to reduce noise
 * 
 * @param data Array of numeric values
 * @param factor Smoothing factor (0-1) - higher means more smoothing
 * @returns Smoothed data array
 */
export function smoothData(data: number[], factor = 0.5): number[] {
  const result: number[] = [];
  let previous = data[0];
  
  for (const value of data) {
    const smoothed = previous * factor + value * (1 - factor);
    result.push(smoothed);
    previous = smoothed;
  }
  
  return result;
}

/**
 * Convert timeframe string to milliseconds
 * 
 * @param timeframe Timeframe string (e.g., '1h', '4h', '1d')
 * @returns Milliseconds equivalent
 */
export function timeframeToMs(timeframe: string): number {
  const unitMap: Record<string, number> = {
    'm': 60 * 1000,               // minute
    'h': 60 * 60 * 1000,          // hour
    'd': 24 * 60 * 60 * 1000,     // day
    'w': 7 * 24 * 60 * 60 * 1000, // week
    'M': 30 * 24 * 60 * 60 * 1000 // month (approximate)
  };
  
  const matches = timeframe.match(/(\d+)([mhdwM])/);
  if (!matches) return 0;
  
  const [, amount, unit] = matches;
  return parseInt(amount) * unitMap[unit];
}

/**
 * Format price for display (alias for formatCurrency)
 * Used for backward compatibility
 * 
 * @param price The price to format
 * @param currencySymbol Optional currency symbol (default: '$')
 * @returns Formatted price string
 */
export function formatPrice(price: number, currencySymbol = '$'): string {
  return formatCurrency(price, currencySymbol);
}

/**
 * Get CSS class based on price change percentage
 * 
 * @param changePercent The percentage change
 * @returns CSS class for styling (text-green-500, text-red-500, or text-gray-400)
 */
export function getPriceChangeClass(changePercent: number): string {
  if (changePercent > 0) return 'text-green-500';
  if (changePercent < 0) return 'text-red-500';
  return 'text-gray-400';
}

/**
 * Get the current BTC price based on the hidden element in the page
 * @returns The current BTC price or null if not available
 */
export function getCurrentPrice(): number | null {
  const priceData = document.getElementById('live-price-data');
  if (!priceData) return null;
  
  try {
    return parseFloat(priceData.getAttribute('data-price') || '0');
  } catch (error) {return null;
  }
}