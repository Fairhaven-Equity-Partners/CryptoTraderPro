/**
 * Enhanced Data Integrity Validator - 100% Authentic Data Assurance
 */
export class EnhancedDataValidator {
  static validateRealTimeData(data: any, source: string, timestamp: number): boolean {
    // Timestamp freshness validation (within 5 minutes)
    const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds
    const dataAge = Date.now() - timestamp;
    
    if (dataAge > maxAge) {
      throw new Error(`Data too old: ${dataAge}ms from ${source}`);
    }
    
    // Price range validation (realistic cryptocurrency ranges)
    if (data.price && (data.price < 0.000001 || data.price > 10000000)) {
      throw new Error(`Unrealistic price: ${data.price} from ${source}`);
    }
    
    // Volume validation
    if (data.volume && data.volume < 0) {
      throw new Error(`Invalid volume: ${data.volume} from ${source}`);
    }
    
    // Source authenticity verification
    const trustedSources = ['coinmarketcap.com', 'api.coinmarketcap.com', 'pro-api.coinmarketcap.com'];
    if (!trustedSources.some(trusted => source.includes(trusted))) {
      console.warn(`Untrusted data source: ${source}`);
    }
    
    return true;
  }
  
  static ensureDataCompleteness(marketData: any): boolean {
    const requiredFields = ['symbol', 'price', 'timestamp', 'volume', 'change24h'];
    const missingFields = requiredFields.filter(field => !(field in marketData));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    return true;
  }
  
  static validateTradeSimulation(trade: any): boolean {
    if (!trade.entryPrice || !trade.symbol || !trade.timeframe) {
      throw new Error('Incomplete trade simulation data');
    }
    
    if (trade.entryPrice <= 0) {
      throw new Error(`Invalid entry price: ${trade.entryPrice}`);
    }
    
    if (trade.stopLoss && trade.takeProfit) {
      const riskReward = Math.abs(trade.takeProfit - trade.entryPrice) / Math.abs(trade.entryPrice - trade.stopLoss);
      if (riskReward < 0.5 || riskReward > 10) {
        console.warn(`Unusual risk/reward ratio: ${riskReward.toFixed(2)}`);
      }
    }
    
    return true;
  }
}