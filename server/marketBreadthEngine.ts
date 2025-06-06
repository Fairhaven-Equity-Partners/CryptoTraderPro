/**
 * Market Breadth Analytics Engine
 * Analyzes broader market conditions to filter and enhance signal quality
 * Tracks market-wide trends, momentum, and structural health
 */

import { TOP_50_SYMBOL_MAPPINGS } from './optimizedSymbolMapping.js';

interface MarketBreadthData {
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
}

interface BreadthMetrics {
  advanceDeclineRatio: number;
  upTrendPercentage: number;
  marketCapWeightedMomentum: number;
  volumeWeightedDirection: number;
  sectorialStrength: {
    [sector: string]: {
      avgChange: number;
      participationRate: number;
      dominance: number;
    };
  };
  marketRegime: 'RISK_ON' | 'RISK_OFF' | 'ROTATION' | 'CONSOLIDATION';
  breadthScore: number;
}

interface BreadthAnalysis {
  metrics: BreadthMetrics;
  signalFilter: 'ENHANCE' | 'NEUTRAL' | 'CAUTION' | 'SUPPRESS';
  confidenceAdjustment: number;
  reasoning: string[];
  marketContext: string;
}

export class MarketBreadthEngine {
  private breadthCache: BreadthAnalysis | null = null;
  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

  /**
   * Analyze market breadth and return signal filtering recommendations
   */
  async analyzeMarketBreadth(marketData: Map<string, any>): Promise<BreadthAnalysis> {
    const now = Date.now();
    
    // Return cached analysis if recent
    if (this.breadthCache && (now - this.lastUpdateTime) < this.UPDATE_INTERVAL) {
      return this.breadthCache;
    }

    try {
      // Convert market data to breadth format
      const breadthData = this.convertToBreadthData(marketData);
      
      // Calculate breadth metrics
      const metrics = this.calculateBreadthMetrics(breadthData);
      
      // Determine signal filtering approach
      const signalFilter = this.determineSignalFilter(metrics);
      
      // Calculate confidence adjustment
      const confidenceAdjustment = this.calculateConfidenceAdjustment(metrics);
      
      // Generate reasoning
      const reasoning = this.generateBreadthReasoning(metrics);
      
      // Create market context
      const marketContext = this.generateMarketContext(metrics);

      const analysis: BreadthAnalysis = {
        metrics,
        signalFilter,
        confidenceAdjustment,
        reasoning,
        marketContext
      };

      this.breadthCache = analysis;
      this.lastUpdateTime = now;
      
      return analysis;
    } catch (error) {
      console.error('[MarketBreadth] Analysis error:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Convert market data to breadth analysis format
   */
  private convertToBreadthData(marketData: Map<string, any>): MarketBreadthData[] {
    const breadthData: MarketBreadthData[] = [];

    for (const mapping of TOP_50_SYMBOL_MAPPINGS) {
      const data = marketData.get(mapping.symbol);
      if (!data) continue;

      // Determine trend based on technical indicators
      let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      let strength = 50;

      if (data.change24h > 2) {
        trend = 'BULLISH';
        strength = Math.min(90, 50 + (data.change24h * 2));
      } else if (data.change24h < -2) {
        trend = 'BEARISH';
        strength = Math.min(90, 50 + (Math.abs(data.change24h) * 2));
      } else {
        strength = 50 + (Math.abs(data.change24h) * 5);
      }

      breadthData.push({
        symbol: mapping.symbol,
        price: data.currentPrice || 0,
        change24h: data.change24h || 0,
        marketCap: data.marketCap || 0,
        volume24h: data.marketCap * 0.1, // Estimate volume
        trend,
        strength
      });
    }

    return breadthData;
  }

  /**
   * Calculate comprehensive breadth metrics
   */
  private calculateBreadthMetrics(data: MarketBreadthData[]): BreadthMetrics {
    if (data.length === 0) {
      return this.getEmptyMetrics();
    }

    // Advance/Decline Ratio
    const advancing = data.filter(d => d.change24h > 0).length;
    const declining = data.filter(d => d.change24h < 0).length;
    const advanceDeclineRatio = declining > 0 ? advancing / declining : advancing;

    // Up Trend Percentage
    const upTrending = data.filter(d => d.trend === 'BULLISH').length;
    const upTrendPercentage = (upTrending / data.length) * 100;

    // Market Cap Weighted Momentum
    const totalMarketCap = data.reduce((sum, d) => sum + d.marketCap, 0);
    const marketCapWeightedMomentum = data.reduce((sum, d) => {
      const weight = d.marketCap / totalMarketCap;
      return sum + (d.change24h * weight);
    }, 0);

    // Volume Weighted Direction
    const totalVolume = data.reduce((sum, d) => sum + d.volume24h, 0);
    const volumeWeightedDirection = data.reduce((sum, d) => {
      const weight = d.volume24h / totalVolume;
      const direction = d.change24h > 0 ? 1 : d.change24h < 0 ? -1 : 0;
      return sum + (direction * weight);
    }, 0);

    // Sectorial Strength Analysis
    const sectorialStrength = this.calculateSectorialStrength(data);

    // Market Regime Classification
    const marketRegime = this.classifyMarketRegime({
      advanceDeclineRatio,
      upTrendPercentage,
      marketCapWeightedMomentum,
      volumeWeightedDirection
    });

    // Overall Breadth Score
    const breadthScore = this.calculateBreadthScore({
      advanceDeclineRatio,
      upTrendPercentage,
      marketCapWeightedMomentum,
      volumeWeightedDirection
    });

    return {
      advanceDeclineRatio,
      upTrendPercentage,
      marketCapWeightedMomentum,
      volumeWeightedDirection,
      sectorialStrength,
      marketRegime,
      breadthScore
    };
  }

  /**
   * Calculate sectorial strength metrics
   */
  private calculateSectorialStrength(data: MarketBreadthData[]): BreadthMetrics['sectorialStrength'] {
    const sectors: { [key: string]: MarketBreadthData[] } = {
      'major': [],
      'defi': [],
      'layer1': [],
      'gaming': [],
      'infrastructure': [],
      'other': []
    };

    // Group assets by sector
    data.forEach(asset => {
      const mapping = TOP_50_SYMBOL_MAPPINGS.find(m => m.symbol === asset.symbol);
      const category = mapping?.category || 'other';
      
      if (sectors[category]) {
        sectors[category].push(asset);
      } else {
        sectors.other.push(asset);
      }
    });

    const sectorialStrength: BreadthMetrics['sectorialStrength'] = {};
    const totalMarketCap = data.reduce((sum, d) => sum + d.marketCap, 0);

    Object.entries(sectors).forEach(([sector, assets]) => {
      if (assets.length === 0) return;

      const avgChange = assets.reduce((sum, a) => sum + a.change24h, 0) / assets.length;
      const participationRate = (assets.filter(a => Math.abs(a.change24h) > 1).length / assets.length) * 100;
      const sectorMarketCap = assets.reduce((sum, a) => sum + a.marketCap, 0);
      const dominance = (sectorMarketCap / totalMarketCap) * 100;

      sectorialStrength[sector] = {
        avgChange,
        participationRate,
        dominance
      };
    });

    return sectorialStrength;
  }

  /**
   * Classify overall market regime
   */
  private classifyMarketRegime(metrics: {
    advanceDeclineRatio: number;
    upTrendPercentage: number;
    marketCapWeightedMomentum: number;
    volumeWeightedDirection: number;
  }): BreadthMetrics['marketRegime'] {
    const { advanceDeclineRatio, upTrendPercentage, marketCapWeightedMomentum } = metrics;

    // Risk-on conditions
    if (advanceDeclineRatio > 2 && upTrendPercentage > 70 && marketCapWeightedMomentum > 2) {
      return 'RISK_ON';
    }

    // Risk-off conditions
    if (advanceDeclineRatio < 0.5 && upTrendPercentage < 30 && marketCapWeightedMomentum < -2) {
      return 'RISK_OFF';
    }

    // Rotation conditions
    if (Math.abs(marketCapWeightedMomentum) < 1 && upTrendPercentage > 40 && upTrendPercentage < 60) {
      return 'ROTATION';
    }

    // Default to consolidation
    return 'CONSOLIDATION';
  }

  /**
   * Calculate overall breadth score
   */
  private calculateBreadthScore(metrics: {
    advanceDeclineRatio: number;
    upTrendPercentage: number;
    marketCapWeightedMomentum: number;
    volumeWeightedDirection: number;
  }): number {
    let score = 50; // Base neutral score

    // Advance/Decline contribution
    if (metrics.advanceDeclineRatio > 1.5) score += 15;
    else if (metrics.advanceDeclineRatio > 1) score += 8;
    else if (metrics.advanceDeclineRatio < 0.7) score -= 15;
    else if (metrics.advanceDeclineRatio < 0.9) score -= 8;

    // Trend percentage contribution
    score += (metrics.upTrendPercentage - 50) * 0.5;

    // Momentum contribution
    score += metrics.marketCapWeightedMomentum * 3;

    // Volume direction contribution
    score += metrics.volumeWeightedDirection * 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine signal filtering approach
   */
  private determineSignalFilter(metrics: BreadthMetrics): BreadthAnalysis['signalFilter'] {
    if (metrics.breadthScore >= 75 && metrics.marketRegime === 'RISK_ON') {
      return 'ENHANCE';
    } else if (metrics.breadthScore <= 25 && metrics.marketRegime === 'RISK_OFF') {
      return 'SUPPRESS';
    } else if (metrics.breadthScore <= 35 || metrics.upTrendPercentage < 25) {
      return 'CAUTION';
    } else {
      return 'NEUTRAL';
    }
  }

  /**
   * Calculate confidence adjustment based on breadth
   */
  private calculateConfidenceAdjustment(metrics: BreadthMetrics): number {
    let adjustment = 0;

    // Strong breadth enhances confidence
    if (metrics.breadthScore >= 80) adjustment += 12;
    else if (metrics.breadthScore >= 65) adjustment += 6;
    else if (metrics.breadthScore <= 20) adjustment -= 15;
    else if (metrics.breadthScore <= 35) adjustment -= 8;

    // Market regime adjustments
    switch (metrics.marketRegime) {
      case 'RISK_ON':
        adjustment += 5;
        break;
      case 'RISK_OFF':
        adjustment -= 10;
        break;
      case 'ROTATION':
        adjustment -= 3;
        break;
    }

    // Sectorial participation bonus
    const majorSectorParticipation = metrics.sectorialStrength.major?.participationRate || 0;
    if (majorSectorParticipation > 80) adjustment += 4;
    else if (majorSectorParticipation < 30) adjustment -= 6;

    return Math.max(-20, Math.min(15, adjustment));
  }

  /**
   * Generate breadth analysis reasoning
   */
  private generateBreadthReasoning(metrics: BreadthMetrics): string[] {
    const reasoning: string[] = [];

    // Market regime
    reasoning.push(`Market regime: ${metrics.marketRegime.toLowerCase().replace('_', ' ')}`);

    // Breadth strength
    if (metrics.breadthScore >= 70) {
      reasoning.push(`Strong market breadth (${metrics.breadthScore.toFixed(0)}/100)`);
    } else if (metrics.breadthScore <= 30) {
      reasoning.push(`Weak market breadth (${metrics.breadthScore.toFixed(0)}/100)`);
    }

    // Advance/decline analysis
    if (metrics.advanceDeclineRatio > 2) {
      reasoning.push(`Strong advancing issues (${metrics.advanceDeclineRatio.toFixed(1)}:1 ratio)`);
    } else if (metrics.advanceDeclineRatio < 0.5) {
      reasoning.push(`Declining issues dominate (${metrics.advanceDeclineRatio.toFixed(1)}:1 ratio)`);
    }

    // Trend participation
    if (metrics.upTrendPercentage > 70) {
      reasoning.push(`High trend participation (${metrics.upTrendPercentage.toFixed(0)}% uptrending)`);
    } else if (metrics.upTrendPercentage < 30) {
      reasoning.push(`Low trend participation (${metrics.upTrendPercentage.toFixed(0)}% uptrending)`);
    }

    return reasoning;
  }

  /**
   * Generate market context description
   */
  private generateMarketContext(metrics: BreadthMetrics): string {
    const regime = metrics.marketRegime.toLowerCase().replace('_', '-');
    const breadthLevel = metrics.breadthScore >= 60 ? 'strong' : metrics.breadthScore >= 40 ? 'moderate' : 'weak';
    
    return `Market showing ${regime} conditions with ${breadthLevel} breadth (${metrics.upTrendPercentage.toFixed(0)}% assets uptrending, ${metrics.advanceDeclineRatio.toFixed(1)}:1 A/D ratio)`;
  }

  /**
   * Get empty metrics for error cases
   */
  private getEmptyMetrics(): BreadthMetrics {
    return {
      advanceDeclineRatio: 1,
      upTrendPercentage: 50,
      marketCapWeightedMomentum: 0,
      volumeWeightedDirection: 0,
      sectorialStrength: {},
      marketRegime: 'CONSOLIDATION',
      breadthScore: 50
    };
  }

  /**
   * Get default analysis for error cases
   */
  private getDefaultAnalysis(): BreadthAnalysis {
    return {
      metrics: this.getEmptyMetrics(),
      signalFilter: 'NEUTRAL',
      confidenceAdjustment: 0,
      reasoning: ['Market breadth analysis unavailable'],
      marketContext: 'Market conditions uncertain - using neutral breadth assumptions'
    };
  }

  /**
   * Apply breadth filter to signal confidence
   */
  applyBreadthFilter(
    originalConfidence: number, 
    signalDirection: 'LONG' | 'SHORT' | 'NEUTRAL',
    analysis: BreadthAnalysis
  ): { adjustedConfidence: number; breadthReason: string[] } {
    let adjustedConfidence = originalConfidence;
    const breadthReason: string[] = [];

    // Apply base confidence adjustment
    adjustedConfidence += analysis.confidenceAdjustment;

    // Apply signal filter logic
    switch (analysis.signalFilter) {
      case 'ENHANCE':
        if (signalDirection === 'LONG') {
          adjustedConfidence += 8;
          breadthReason.push('Strong market breadth supports long signals');
        }
        break;
      
      case 'SUPPRESS':
        if (signalDirection === 'LONG') {
          adjustedConfidence -= 12;
          breadthReason.push('Weak market breadth undermines long signals');
        } else if (signalDirection === 'SHORT') {
          adjustedConfidence += 6;
          breadthReason.push('Risk-off environment supports short signals');
        }
        break;
      
      case 'CAUTION':
        adjustedConfidence -= 5;
        breadthReason.push('Mixed market breadth warrants caution');
        break;
    }

    // Ensure confidence stays within bounds
    adjustedConfidence = Math.max(25, Math.min(95, adjustedConfidence));

    return { adjustedConfidence, breadthReason };
  }
}

export const marketBreadthEngine = new MarketBreadthEngine();