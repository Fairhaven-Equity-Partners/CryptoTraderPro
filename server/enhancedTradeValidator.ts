/**
 * Enhanced Trade Structure Validator - Perfect Integrity
 */
export class EnhancedTradeValidator {
  static validateCompleteTradeData(trade: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required field validation
    const requiredFields = {
      symbol: 'string',
      timeframe: 'string', 
      direction: 'string',
      entryPrice: 'number',
      stopLoss: 'number',
      takeProfit: 'number',
      confidence: 'number',
      timestamp: 'number',
      isActive: 'boolean'
    };
    
    Object.entries(requiredFields).forEach(([field, type]) => {
      if (!(field in trade)) {
        errors.push(`Missing required field: ${field}`);
      } else if (typeof trade[field] !== type) {
        errors.push(`Invalid type for ${field}: expected ${type}, got ${typeof trade[field]}`);
      }
    });
    
    // Price validation
    if (trade.entryPrice && trade.entryPrice <= 0) {
      errors.push(`Invalid entry price: ${trade.entryPrice}`);
    }
    
    // Confidence validation  
    if (trade.confidence && (trade.confidence < 0 || trade.confidence > 100)) {
      errors.push(`Invalid confidence: ${trade.confidence} (must be 0-100)`);
    }
    
    // Risk management validation
    if (trade.entryPrice && trade.stopLoss && trade.takeProfit) {
      const riskAmount = Math.abs(trade.entryPrice - trade.stopLoss);
      const rewardAmount = Math.abs(trade.takeProfit - trade.entryPrice);
      
      if (riskAmount <= 0) {
        errors.push('Invalid risk management: stop loss equals entry price');
      }
      
      if (rewardAmount <= 0) {
        errors.push('Invalid risk management: take profit equals entry price');
      }
      
      const riskRewardRatio = rewardAmount / riskAmount;
      if (riskRewardRatio < 0.1 || riskRewardRatio > 20) {
        errors.push(`Extreme risk/reward ratio: ${riskRewardRatio.toFixed(2)}`);
      }
    }
    
    // Timestamp validation
    if (trade.timestamp) {
      const age = Date.now() - trade.timestamp;
      if (age < 0) {
        errors.push('Invalid timestamp: future date');
      }
      if (age > 86400000) { // 24 hours
        errors.push('Stale timestamp: older than 24 hours');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  static sanitizeTradeData(trade: any): any {
    return {
      ...trade,
      entryPrice: Number(trade.entryPrice) || 0,
      stopLoss: Number(trade.stopLoss) || 0,
      takeProfit: Number(trade.takeProfit) || 0,
      confidence: Math.max(0, Math.min(100, Number(trade.confidence) || 0)),
      timestamp: Number(trade.timestamp) || Date.now(),
      isActive: Boolean(trade.isActive)
    };
  }
}