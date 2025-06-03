import { apiRequest } from './queryClient';
import type { TradeSimulation, AccuracyMetrics, InsertTradeSimulation } from '@shared/schema';

// Define AdvancedSignal type locally since it's not in schema
interface AdvancedSignal {
  symbol: string;
  timeframe: string;
  direction: string;
  confidence: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp?: number;
  indicators?: any;
  successProbability?: number;
}

/**
 * Live Accuracy Tracking System
 * 
 * This system automatically creates trade simulations when predictions are made,
 * monitors them against actual market outcomes, and calculates real accuracy.
 */

interface PredictionRecord {
  id: string;
  symbol: string;
  timeframe: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timestamp: number;
  signalData: string;
  actualOutcome?: 'WIN' | 'LOSS' | 'PENDING';
  exitPrice?: number;
  exitReason?: string;
  accuracyScore?: number;
}

class LiveAccuracyTracker {
  private activePredictions = new Map<string, PredictionRecord>();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds
  private readonly TIMEFRAME_DURATIONS = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000,
  };

  constructor() {
    this.startMonitoring();
    console.log('🎯 Live Accuracy Tracker initialized - tracking real market outcomes');
  }

  /**
   * Record a new prediction for accuracy tracking
   */
  async recordPrediction(signal: AdvancedSignal, currentPrice: number): Promise<void> {
    try {
      const predictionId = `${signal.symbol}_${signal.timeframe}_${Date.now()}`;
      
      // Create trade simulation in backend
      const tradeData: InsertTradeSimulation = {
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        direction: signal.direction,
        entryPrice: currentPrice,
        stopLoss: signal.stopLoss || (currentPrice * (signal.direction === 'LONG' ? 0.95 : 1.05)),
        takeProfit: signal.takeProfit || (currentPrice * (signal.direction === 'LONG' ? 1.05 : 0.95)),
        confidence: signal.confidence,
        signalData: JSON.stringify(signal),
      };

      const tradeSimulation = await apiRequest('/api/trade-simulations', tradeData);

      // Store prediction record locally for monitoring
      const prediction: PredictionRecord = {
        id: predictionId,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        direction: signal.direction,
        entryPrice: currentPrice,
        stopLoss: tradeData.stopLoss,
        takeProfit: tradeData.takeProfit,
        confidence: signal.confidence,
        timestamp: Date.now(),
        signalData: JSON.stringify(signal),
        actualOutcome: 'PENDING',
      };

      this.activePredictions.set(predictionId, prediction);
      
      console.log(`📈 Prediction recorded: ${signal.symbol} ${signal.timeframe} ${signal.direction} @ ${currentPrice}`);
      console.log(`🎯 Stop Loss: ${tradeData.stopLoss.toFixed(2)}, Take Profit: ${tradeData.takeProfit.toFixed(2)}`);
      
      // Set up automatic closure based on timeframe duration
      this.scheduleAutomaticClosure(predictionId, signal.timeframe);
      
    } catch (error) {
      console.error('Error recording prediction:', error);
    }
  }

  /**
   * Monitor active predictions against live market data
   */
  private async monitorPredictions(currentPrice: number, symbol: string): Promise<void> {
    const symbolPredictions = Array.from(this.activePredictions.values())
      .filter(p => p.symbol === symbol && p.actualOutcome === 'PENDING');

    for (const prediction of symbolPredictions) {
      const hasHitStopLoss = this.checkStopLoss(prediction, currentPrice);
      const hasHitTakeProfit = this.checkTakeProfit(prediction, currentPrice);
      
      if (hasHitStopLoss) {
        await this.closePrediction(prediction.id, currentPrice, 'SL', 'LOSS');
      } else if (hasHitTakeProfit) {
        await this.closePrediction(prediction.id, currentPrice, 'TP', 'WIN');
      }
    }
  }

  /**
   * Check if stop loss has been hit
   */
  private checkStopLoss(prediction: PredictionRecord, currentPrice: number): boolean {
    if (prediction.direction === 'LONG') {
      return currentPrice <= prediction.stopLoss;
    } else {
      return currentPrice >= prediction.stopLoss;
    }
  }

  /**
   * Check if take profit has been hit
   */
  private checkTakeProfit(prediction: PredictionRecord, currentPrice: number): boolean {
    if (prediction.direction === 'LONG') {
      return currentPrice >= prediction.takeProfit;
    } else {
      return currentPrice <= prediction.takeProfit;
    }
  }

  /**
   * Close a prediction and calculate accuracy
   */
  private async closePrediction(
    predictionId: string, 
    exitPrice: number, 
    exitReason: string, 
    outcome: 'WIN' | 'LOSS'
  ): Promise<void> {
    try {
      const prediction = this.activePredictions.get(predictionId);
      if (!prediction) return;

      // Calculate accuracy score based on outcome and confidence
      const accuracyScore = this.calculateAccuracyScore(prediction, outcome);
      
      // Update prediction record
      prediction.actualOutcome = outcome;
      prediction.exitPrice = exitPrice;
      prediction.exitReason = exitReason;
      prediction.accuracyScore = accuracyScore;

      // Close trade simulation in backend
      const tradeSimulations = await apiRequest(`/api/trade-simulations/${prediction.symbol}`);
      const activeTrade = tradeSimulations.find((t: TradeSimulation) => 
        t.isActive && 
        Math.abs(t.entryPrice - prediction.entryPrice) < 1 &&
        t.timeframe === prediction.timeframe
      );

      if (activeTrade) {
        await apiRequest(`/api/trade-simulations/${activeTrade.id}/close`, { 
          exitPrice, 
          exitReason 
        });
      }

      console.log(`📊 Prediction closed: ${prediction.symbol} ${prediction.timeframe} ${outcome}`);
      console.log(`🎯 Entry: ${prediction.entryPrice}, Exit: ${exitPrice}, Accuracy: ${accuracyScore.toFixed(2)}%`);
      
      // Remove from active tracking
      this.activePredictions.delete(predictionId);
      
      // Trigger accuracy metrics recalculation
      await this.updateAccuracyMetrics(prediction.symbol, prediction.timeframe);
      
    } catch (error) {
      // Silently handle prediction closure errors to prevent console spam
    }
  }

  /**
   * Calculate accuracy score based on outcome and prediction confidence
   */
  private calculateAccuracyScore(prediction: PredictionRecord, outcome: 'WIN' | 'LOSS'): number {
    const baseScore = outcome === 'WIN' ? 100 : 0;
    const confidenceWeight = prediction.confidence / 100;
    
    // Higher confidence predictions get weighted more heavily
    if (outcome === 'WIN') {
      return Math.min(100, baseScore * confidenceWeight + (confidenceWeight * 20));
    } else {
      // Penalize high-confidence wrong predictions more
      return Math.max(0, baseScore - (confidenceWeight * 50));
    }
  }

  /**
   * Schedule automatic closure of prediction based on timeframe
   */
  private scheduleAutomaticClosure(predictionId: string, timeframe: string): void {
    const duration = this.TIMEFRAME_DURATIONS[timeframe as keyof typeof this.TIMEFRAME_DURATIONS] || 60000;
    
    setTimeout(async () => {
      const prediction = this.activePredictions.get(predictionId);
      if (prediction && prediction.actualOutcome === 'PENDING') {
        // Fetch current price to determine outcome
        try {
          const response = await fetch(`/api/crypto/${prediction.symbol}`);
          const data = await response.json();
          const currentPrice = data.lastPrice;
          
          // Determine outcome based on final price vs entry
          const pnl = prediction.direction === 'LONG' 
            ? (currentPrice - prediction.entryPrice) / prediction.entryPrice
            : (prediction.entryPrice - currentPrice) / prediction.entryPrice;
          
          const outcome = pnl > 0 ? 'WIN' : 'LOSS';
          await this.closePrediction(predictionId, currentPrice, 'TIMEOUT', outcome);
        } catch (error) {
          // Silently handle automatic closure errors to prevent console spam
        }
      }
    }, duration);
  }

  /**
   * Update accuracy metrics for a symbol/timeframe combination
   */
  private async updateAccuracyMetrics(symbol: string, timeframe: string): Promise<void> {
    try {
      await apiRequest(`/api/accuracy/${symbol}/${timeframe}/calculate`, {
        method: 'POST',
      });
      console.log(`📈 Accuracy metrics updated for ${symbol} ${timeframe}`);
    } catch (error) {
      console.error('Error updating accuracy metrics:', error);
    }
  }

  /**
   * Get current accuracy statistics
   */
  async getAccuracyStats(symbol: string, timeframe?: string): Promise<AccuracyMetrics[]> {
    try {
      const params = timeframe ? `?timeframe=${timeframe}` : '';
      return await apiRequest(`/api/accuracy/${symbol}${params}`);
    } catch (error) {
      console.error('Error fetching accuracy stats:', error);
      return [];
    }
  }

  /**
   * Start monitoring system
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      // This will be called by the price update system
      // when new live prices are received
    }, this.MONITORING_INTERVAL);
  }

  /**
   * Update monitoring with new live price data
   */
  async updateWithLivePrice(price: number, symbol: string): Promise<void> {
    await this.monitorPredictions(price, symbol);
  }

  /**
   * Get summary of active predictions
   */
  getActivePredictions(symbol?: string): PredictionRecord[] {
    const predictions = Array.from(this.activePredictions.values());
    return symbol ? predictions.filter(p => p.symbol === symbol) : predictions;
  }

  /**
   * Stop monitoring system
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Global instance
export const liveAccuracyTracker = new LiveAccuracyTracker();

// Export helper functions
export const recordPrediction = (signal: AdvancedSignal, currentPrice: number) => 
  liveAccuracyTracker.recordPrediction(signal, currentPrice);

export const updateWithLivePrice = (price: number, symbol: string) => 
  liveAccuracyTracker.updateWithLivePrice(price, symbol);

export const getAccuracyStats = (symbol: string, timeframe?: string) => 
  liveAccuracyTracker.getAccuracyStats(symbol, timeframe);

export const getActivePredictions = (symbol?: string) => 
  liveAccuracyTracker.getActivePredictions(symbol);