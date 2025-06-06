/**
 * Multi-Timeframe Confluence Engine
 * Implements advanced cross-timeframe signal validation
 * Replaces simple timeframe weighting with consensus-based scoring
 */

interface TimeframeSignal {
  timeframe: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  strength: number;
  technicalScore: number;
}

interface ConfluenceResult {
  confluenceScore: number;
  dominantDirection: 'LONG' | 'SHORT' | 'NEUTRAL';
  agreementLevel: 'STRONG' | 'MODERATE' | 'WEAK' | 'CONFLICTED';
  timeframeClusters: {
    short: TimeframeSignal[];
    medium: TimeframeSignal[];
    long: TimeframeSignal[];
  };
  conflictPenalty: number;
  consensusBonus: number;
}

export class MultiTimeframeConfluenceEngine {
  private readonly timeframeClusters = {
    short: ['1m', '5m', '15m'],
    medium: ['30m', '1h', '4h'],
    long: ['1d', '3d', '1w', '1M']
  };

  /**
   * Calculate multi-timeframe confluence score
   */
  calculateConfluence(timeframeSignals: TimeframeSignal[]): ConfluenceResult {
    // Group signals by timeframe clusters
    const clusters = this.groupSignalsByClusters(timeframeSignals);
    
    // Calculate cluster consensus
    const clusterConsensus = this.calculateClusterConsensus(clusters);
    
    // Determine dominant direction across all timeframes
    const dominantDirection = this.determineDominantDirection(timeframeSignals);
    
    // Calculate agreement metrics
    const agreementMetrics = this.calculateAgreementMetrics(timeframeSignals, dominantDirection);
    
    // Calculate conflict penalty
    const conflictPenalty = this.calculateConflictPenalty(clusters, dominantDirection);
    
    // Calculate consensus bonus
    const consensusBonus = this.calculateConsensusBonus(clusterConsensus);
    
    // Final confluence score
    const baseScore = this.calculateBaseConfluenceScore(timeframeSignals);
    const confluenceScore = Math.max(0, Math.min(100, 
      baseScore + consensusBonus - conflictPenalty
    ));

    return {
      confluenceScore,
      dominantDirection,
      agreementLevel: agreementMetrics.level,
      timeframeClusters: clusters,
      conflictPenalty,
      consensusBonus
    };
  }

  /**
   * Group signals by timeframe clusters
   */
  private groupSignalsByClusters(signals: TimeframeSignal[]): ConfluenceResult['timeframeClusters'] {
    const clusters = {
      short: [] as TimeframeSignal[],
      medium: [] as TimeframeSignal[],
      long: [] as TimeframeSignal[]
    };

    signals.forEach(signal => {
      if (this.timeframeClusters.short.includes(signal.timeframe)) {
        clusters.short.push(signal);
      } else if (this.timeframeClusters.medium.includes(signal.timeframe)) {
        clusters.medium.push(signal);
      } else if (this.timeframeClusters.long.includes(signal.timeframe)) {
        clusters.long.push(signal);
      }
    });

    return clusters;
  }

  /**
   * Calculate consensus within each cluster
   */
  private calculateClusterConsensus(clusters: ConfluenceResult['timeframeClusters']): {
    short: { direction: string; consensus: number };
    medium: { direction: string; consensus: number };
    long: { direction: string; consensus: number };
  } {
    return {
      short: this.getClusterConsensus(clusters.short),
      medium: this.getClusterConsensus(clusters.medium),
      long: this.getClusterConsensus(clusters.long)
    };
  }

  /**
   * Get consensus for a single cluster
   */
  private getClusterConsensus(signals: TimeframeSignal[]): { direction: string; consensus: number } {
    if (signals.length === 0) {
      return { direction: 'NEUTRAL', consensus: 0 };
    }

    const directionCounts = signals.reduce((counts, signal) => {
      counts[signal.direction] = (counts[signal.direction] || 0) + signal.confidence;
      return counts;
    }, {} as Record<string, number>);

    const totalWeight = Object.values(directionCounts).reduce((sum, weight) => sum + weight, 0);
    const dominantDirection = Object.entries(directionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    const consensus = totalWeight > 0 ? (directionCounts[dominantDirection] / totalWeight) * 100 : 0;

    return { direction: dominantDirection, consensus };
  }

  /**
   * Determine dominant direction across all timeframes
   */
  private determineDominantDirection(signals: TimeframeSignal[]): 'LONG' | 'SHORT' | 'NEUTRAL' {
    const weightedScores = signals.reduce((scores, signal) => {
      const weight = this.getTimeframeWeight(signal.timeframe);
      const adjustedScore = signal.confidence * weight * (signal.direction === 'LONG' ? 1 : signal.direction === 'SHORT' ? -1 : 0);
      
      scores.total += adjustedScore;
      scores.count += weight;
      return scores;
    }, { total: 0, count: 0 });

    if (weightedScores.count === 0) return 'NEUTRAL';
    
    const averageScore = weightedScores.total / weightedScores.count;
    
    if (averageScore > 15) return 'LONG';
    if (averageScore < -15) return 'SHORT';
    return 'NEUTRAL';
  }

  /**
   * Calculate agreement level between timeframes
   */
  private calculateAgreementMetrics(signals: TimeframeSignal[], dominantDirection: string): {
    level: 'STRONG' | 'MODERATE' | 'WEAK' | 'CONFLICTED';
    percentage: number;
  } {
    if (signals.length === 0) {
      return { level: 'WEAK', percentage: 0 };
    }

    const agreementSignals = signals.filter(signal => signal.direction === dominantDirection);
    const agreementPercentage = (agreementSignals.length / signals.length) * 100;

    let level: 'STRONG' | 'MODERATE' | 'WEAK' | 'CONFLICTED';
    
    if (agreementPercentage >= 80) level = 'STRONG';
    else if (agreementPercentage >= 60) level = 'MODERATE';
    else if (agreementPercentage >= 40) level = 'WEAK';
    else level = 'CONFLICTED';

    return { level, percentage: agreementPercentage };
  }

  /**
   * Calculate penalty for conflicting signals
   */
  private calculateConflictPenalty(
    clusters: ConfluenceResult['timeframeClusters'], 
    dominantDirection: string
  ): number {
    let penalty = 0;

    // Heavy penalty for opposing long-term signals
    const longTermOpposition = clusters.long.filter(signal => 
      signal.direction !== dominantDirection && signal.direction !== 'NEUTRAL'
    );
    penalty += longTermOpposition.length * 15; // 15 points per opposing long-term signal

    // Medium penalty for opposing medium-term signals
    const mediumTermOpposition = clusters.medium.filter(signal => 
      signal.direction !== dominantDirection && signal.direction !== 'NEUTRAL'
    );
    penalty += mediumTermOpposition.length * 8; // 8 points per opposing medium-term signal

    // Light penalty for opposing short-term signals
    const shortTermOpposition = clusters.short.filter(signal => 
      signal.direction !== dominantDirection && signal.direction !== 'NEUTRAL'
    );
    penalty += shortTermOpposition.length * 3; // 3 points per opposing short-term signal

    // Additional penalty for complete cluster disagreement
    const clusterDirections = [
      this.getClusterConsensus(clusters.long).direction,
      this.getClusterConsensus(clusters.medium).direction,
      this.getClusterConsensus(clusters.short).direction
    ];

    const uniqueDirections = new Set(clusterDirections.filter(dir => dir !== 'NEUTRAL')).size;
    if (uniqueDirections >= 2) {
      penalty += 10; // Cluster disagreement penalty
    }

    return Math.min(penalty, 50); // Cap penalty at 50 points
  }

  /**
   * Calculate bonus for strong consensus
   */
  private calculateConsensusBonus(clusterConsensus: any): number {
    let bonus = 0;

    // Bonus for strong cluster alignment
    Object.values(clusterConsensus).forEach((cluster: any) => {
      if (cluster.consensus >= 80) bonus += 8;
      else if (cluster.consensus >= 60) bonus += 4;
    });

    // Additional bonus if all clusters agree
    const clusterDirections = Object.values(clusterConsensus)
      .map((cluster: any) => cluster.direction)
      .filter(dir => dir !== 'NEUTRAL');
    
    const uniqueDirections = new Set(clusterDirections).size;
    if (uniqueDirections === 1 && clusterDirections.length >= 2) {
      bonus += 15; // Strong cross-timeframe consensus
    }

    return Math.min(bonus, 35); // Cap bonus at 35 points
  }

  /**
   * Calculate base confluence score
   */
  private calculateBaseConfluenceScore(signals: TimeframeSignal[]): number {
    if (signals.length === 0) return 0;

    const weightedSum = signals.reduce((sum, signal) => {
      const weight = this.getTimeframeWeight(signal.timeframe);
      return sum + (signal.confidence * weight);
    }, 0);

    const totalWeight = signals.reduce((sum, signal) => {
      return sum + this.getTimeframeWeight(signal.timeframe);
    }, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Get importance weight for timeframe
   */
  private getTimeframeWeight(timeframe: string): number {
    const weights: { [key: string]: number } = {
      '1m': 0.5,
      '5m': 0.7,
      '15m': 0.8,
      '30m': 1.0,
      '1h': 1.3,
      '4h': 1.6,
      '1d': 2.0,
      '3d': 1.8,
      '1w': 1.5,
      '1M': 1.2
    };

    return weights[timeframe] || 1.0;
  }

  /**
   * Generate confluence reasoning
   */
  generateConfluenceReasoning(result: ConfluenceResult): string[] {
    const reasoning: string[] = [];

    // Agreement level reasoning
    reasoning.push(`${result.agreementLevel.toLowerCase()} cross-timeframe agreement (${result.confluenceScore.toFixed(1)}% confluence)`);

    // Cluster consensus reasoning
    const { short, medium, long } = result.timeframeClusters;
    
    if (long.length > 0) {
      const longConsensus = this.getClusterConsensus(long);
      reasoning.push(`Long-term trend: ${longConsensus.direction} (${longConsensus.consensus.toFixed(1)}% consensus)`);
    }

    if (medium.length > 0) {
      const mediumConsensus = this.getClusterConsensus(medium);
      reasoning.push(`Medium-term momentum: ${mediumConsensus.direction} (${mediumConsensus.consensus.toFixed(1)}% consensus)`);
    }

    // Conflict warnings
    if (result.conflictPenalty > 10) {
      reasoning.push(`Timeframe conflicts detected (${result.conflictPenalty} point penalty)`);
    }

    // Consensus bonuses
    if (result.consensusBonus > 10) {
      reasoning.push(`Strong timeframe alignment (+${result.consensusBonus} bonus points)`);
    }

    return reasoning;
  }
}

export const multiTimeframeConfluenceEngine = new MultiTimeframeConfluenceEngine();