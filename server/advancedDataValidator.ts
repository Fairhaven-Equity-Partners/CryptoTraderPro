/**
 * Advanced Data Structure Validator - Perfect Integrity
 */
export class AdvancedDataValidator {
  static validateCompleteTradeStructure(trade: any): boolean {
    const requiredFields = [
      'symbol', 'timeframe', 'entryPrice', 'stopLoss', 'takeProfit',
      'timestamp', 'isActive', 'confidence', 'direction'
    ];
    
    const missingFields = requiredFields.filter(field => 
      !(field in trade) || trade[field] === null || trade[field] === undefined
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Incomplete trade structure: missing ${missingFields.join(', ')}`);
    }
    
    // Validate data types
    if (typeof trade.entryPrice !== 'number' || trade.entryPrice <= 0) {
      throw new Error(`Invalid entry price: ${trade.entryPrice}`);
    }
    
    if (typeof trade.confidence !== 'number' || trade.confidence < 0 || trade.confidence > 100) {
      throw new Error(`Invalid confidence level: ${trade.confidence}`);
    }
    
    // Validate risk management ratios
    const riskAmount = Math.abs(trade.entryPrice - trade.stopLoss);
    const rewardAmount = Math.abs(trade.takeProfit - trade.entryPrice);
    const riskRewardRatio = rewardAmount / riskAmount;
    
    if (riskRewardRatio < 0.5 || riskRewardRatio > 10) {
      console.warn(`Unusual risk/reward ratio: ${riskRewardRatio.toFixed(2)}`);
    }
    
    return true;
  }
  
  static validatePriceConsistency(currentPrice: number, historicalPrices: number[]): boolean {
    if (historicalPrices.length === 0) return true;
    
    const recentPrice = historicalPrices[historicalPrices.length - 1];
    const priceDeviation = Math.abs(currentPrice - recentPrice) / recentPrice;
    
    // Flag if price deviation exceeds 50% (potential data error)
    if (priceDeviation > 0.5) {
      console.warn(`Large price deviation detected: ${(priceDeviation * 100).toFixed(1)}%`);
    }
    
    return priceDeviation < 1.0; // Maximum 100% deviation allowed
  }
}