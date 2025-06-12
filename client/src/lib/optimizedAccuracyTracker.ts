import { apiRequest } from './queryClient';

interface OptimizedPrediction {
  id: string;
  symbol: string;
  timeframe: string;
  direction: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  timestamp: number;
}

interface AccuracyMetrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  profitLoss: number;
}

class OptimizedAccuracyTracker {
  private predictions: Map<string, OptimizedPrediction> = new Map();
  private metrics: Map<string, AccuracyMetrics> = new Map();

  async recordPrediction(signal: any): Promise<void> {
    const predictionId = `${signal.symbol}-${signal.timeframe}-${Date.now()}`;
    
    const prediction: OptimizedPrediction = {
      id: predictionId,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      direction: signal.direction,
      entryPrice: signal.entryPrice,
      targetPrice: signal.takeProfit,
      stopLoss: signal.stopLoss,
      confidence: signal.confidence,
      timestamp: Date.now()
    };

    this.predictions.set(predictionId, prediction);
    
    try {
      const tradeData = {
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        confidence: signal.confidence,
        signalData: JSON.stringify(signal)
      };

      await apiRequest('/api/trade-simulations', tradeData);} catch (error) {}
  }

  async updateAccuracy(symbol: string, timeframe: string): Promise<void> {
    try {
      const accuracyData = await apiRequest(`/api/accuracy/${symbol}?timeframe=${timeframe}`);
      
      if (accuracyData && accuracyData.length > 0) {
        const metric = accuracyData[0];
        const key = `${symbol}-${timeframe}`;
        
        this.metrics.set(key, {
          totalPredictions: metric.totalTrades || 0,
          correctPredictions: metric.winningTrades || 0,
          accuracy: metric.winRate || 0,
          profitLoss: metric.totalProfit || 0
        });
      }
    } catch (error) {}
  }

  getMetrics(symbol: string, timeframe: string): AccuracyMetrics | null {
    const key = `${symbol}-${timeframe}`;
    return this.metrics.get(key) || null;
  }

  getAllPredictions(): OptimizedPrediction[] {
    return Array.from(this.predictions.values());
  }

  getPredictionCount(): number {
    return this.predictions.size;
  }
}

export const optimizedAccuracyTracker = new OptimizedAccuracyTracker();