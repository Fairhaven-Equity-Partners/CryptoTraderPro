
/**
 * Historical Performance Tracker - AI Platform Enhancement
 * Tracks indicator accuracy and adapts weights based on historical performance
 */

import { indicatorPerformance, signalReasoningLogs } from '../shared/schema';

export class HistoricalPerformanceTracker {
  constructor() {
    this.performanceCache = new Map();
    this.updateThreshold = 10; // Update weights after 10 new signals
  }

  async trackSignalPerformance(signalData, actualOutcome) {
    const { symbol, timeframe, indicators, reasoning, confidenceBreakdown } = signalData;
    
    // Log detailed reasoning for analysis
    await this.logSignalReasoning(signalData);
    
    // Update indicator performance metrics
    for (const [indicator, value] of Object.entries(indicators)) {
      await this.updateIndicatorPerformance(
        indicator, 
        symbol, 
        timeframe, 
        actualOutcome.successful
      );
    }
    
    // Trigger weight adaptation if threshold reached
    await this.checkWeightAdaptation(symbol, timeframe);
  }

  async logSignalReasoning(signalData) {
    try {
      await db.insert(signalReasoningLogs).values({
        signalId: signalData.id,
        reasoning: signalData.reasoning,
        confidenceBreakdown: signalData.confidenceBreakdown,
        indicatorContributions: signalData.indicatorContributions,
        patternInfluence: signalData.patternInfluence,
        marketRegime: signalData.marketRegime
      });
    } catch (error) {
      console.error('Error logging signal reasoning:', error);
    }
  }

  async updateIndicatorPerformance(indicator, symbol, timeframe, successful) {
    const key = `${indicator}_${symbol}_${timeframe}`;
    
    try {
      // Get current performance data
      const current = await db.select()
        .from(indicatorPerformance)
        .where(and(
          eq(indicatorPerformance.indicator, indicator),
          eq(indicatorPerformance.symbol, symbol),
          eq(indicatorPerformance.timeframe, timeframe)
        ))
        .limit(1);

      if (current.length > 0) {
        // Update existing record
        const record = current[0];
        const newTotal = record.totalSignals + 1;
        const newSuccessful = record.successfulSignals + (successful ? 1 : 0);
        const newAccuracy = newSuccessful / newTotal;

        await db.update(indicatorPerformance)
          .set({
            totalSignals: newTotal,
            successfulSignals: newSuccessful,
            accuracy: newAccuracy,
            lastUpdated: new Date()
          })
          .where(eq(indicatorPerformance.id, record.id));
      } else {
        // Create new record
        await db.insert(indicatorPerformance).values({
          indicator,
          symbol,
          timeframe,
          accuracy: successful ? 1.0 : 0.0,
          weight: this.getDefaultWeight(indicator),
          totalSignals: 1,
          successfulSignals: successful ? 1 : 0
        });
      }
    } catch (error) {
      console.error('Error updating indicator performance:', error);
    }
  }

  async getHistoricalAccuracy(indicator, symbol, timeframe, period = '30d') {
    try {
      const performance = await db.select()
        .from(indicatorPerformance)
        .where(and(
          eq(indicatorPerformance.indicator, indicator),
          eq(indicatorPerformance.symbol, symbol),
          eq(indicatorPerformance.timeframe, timeframe),
          eq(indicatorPerformance.performancePeriod, period)
        ))
        .limit(1);

      return performance.length > 0 ? performance[0].accuracy : 0.7; // Default accuracy
    } catch (error) {
      console.error('Error getting historical accuracy:', error);
      return 0.7;
    }
  }

  async adaptWeightsBasedOnPerformance(symbol, timeframe) {
    try {
      const performances = await db.select()
        .from(indicatorPerformance)
        .where(and(
          eq(indicatorPerformance.symbol, symbol),
          eq(indicatorPerformance.timeframe, timeframe)
        ));

      const weightAdjustments = {};
      
      for (const perf of performances) {
        if (perf.totalSignals >= this.updateThreshold) {
          // Adapt weight based on performance
          const performanceRatio = perf.accuracy / 0.7; // Target 70% accuracy
          const newWeight = Math.max(0.01, Math.min(0.5, perf.weight * performanceRatio));
          
          weightAdjustments[perf.indicator] = newWeight;
          
          // Update weight in database
          await db.update(indicatorPerformance)
            .set({ weight: newWeight })
            .where(eq(indicatorPerformance.id, perf.id));
        }
      }
      
      return weightAdjustments;
    } catch (error) {
      console.error('Error adapting weights:', error);
      return {};
    }
  }

  getDefaultWeight(indicator) {
    const weights = {
      'macd': 0.24,
      'rsi': 0.18,
      'bollinger_bands': 0.16,
      'stochastic': 0.12,
      'atr': 0.08,
      'volume': 0.05,
      'ema': 0.20
    };
    return weights[indicator] || 0.1;
  }
}

export const historicalTracker = new HistoricalPerformanceTracker();