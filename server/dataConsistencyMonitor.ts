/**
 * Real-time Data Consistency Monitor
 */
export class DataConsistencyMonitor {
  private consistencyScores: Map<string, number> = new Map();
  
  updateConsistencyScore(symbol: string, dataPoint: any): number {
    let score = 100;
    
    // Check timestamp freshness (within 1 minute for perfect score)
    const age = Date.now() - dataPoint.timestamp;
    if (age > 60000) score -= Math.min(30, (age - 60000) / 10000);
    
    // Check price validity
    if (!dataPoint.price || dataPoint.price <= 0) score -= 50;
    
    // Check volume validity  
    if (!dataPoint.volume || dataPoint.volume < 0) score -= 20;
    
    this.consistencyScores.set(symbol, Math.max(0, score));
    return this.consistencyScores.get(symbol) || 0;
  }
  
  getOverallConsistency(): number {
    if (this.consistencyScores.size === 0) return 100;
    
    const scores = Array.from(this.consistencyScores.values());
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}