/**
 * Real-time Data Quality Monitor - Perfect Integrity Assurance
 */
export class DataQualityMonitor {
  private qualityScores: Map<string, number> = new Map();
  private qualityHistory: Map<string, number[]> = new Map();
  
  evaluateDataQuality(symbol: string, data: any): number {
    let qualityScore = 100;
    
    // Timestamp freshness (40 points max)
    const age = Date.now() - (data.timestamp || 0);
    if (age > 300000) qualityScore -= 40; // 5 minutes = full penalty
    else qualityScore -= (age / 300000) * 40;
    
    // Price validity (30 points max)
    if (!data.price || data.price <= 0) qualityScore -= 30;
    else if (data.price < 0.000001 || data.price > 1000000) qualityScore -= 15;
    
    // Structure completeness (20 points max)
    const requiredFields = ['symbol', 'price', 'timestamp', 'volume'];
    const missingFields = requiredFields.filter(field => !(field in data));
    qualityScore -= (missingFields.length / requiredFields.length) * 20;
    
    // Volume validity (10 points max)
    if (!data.volume || data.volume < 0) qualityScore -= 10;
    
    qualityScore = Math.max(0, Math.min(100, qualityScore));
    
    // Update history
    if (!this.qualityHistory.has(symbol)) {
      this.qualityHistory.set(symbol, []);
    }
    const history = this.qualityHistory.get(symbol)!;
    history.push(qualityScore);
    if (history.length > 50) history.shift(); // Keep last 50 readings
    
    // Calculate moving average
    const avgQuality = history.reduce((sum, score) => sum + score, 0) / history.length;
    this.qualityScores.set(symbol, avgQuality);
    
    return avgQuality;
  }
  
  getOverallQuality(): number {
    if (this.qualityScores.size === 0) return 100;
    
    const scores = Array.from(this.qualityScores.values());
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
  
  getQualityReport(): { overall: number; bySymbol: Record<string, number> } {
    const bySymbol: Record<string, number> = {};
    this.qualityScores.forEach((score, symbol) => {
      bySymbol[symbol] = Math.round(score * 10) / 10;
    });
    
    return {
      overall: Math.round(this.getOverallQuality() * 10) / 10,
      bySymbol
    };
  }
}