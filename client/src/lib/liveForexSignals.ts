// Live EUR/USD Trade Signals Generator
// Using TradingView data structure with real market analysis

import { forexAnalysisEngine } from './forexAnalysis';

interface LiveForexTrade {
  id: string;
  pair: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  leverage: number;
  positionSize: number;
  riskReward: string;
  reasoning: string;
  timestamp: number;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED';
}

class LiveForexTradeGenerator {
  private currentEurUsdPrice = 1.0520; // Current market price
  
  async generateLiveForexTrades(): Promise<LiveForexTrade[]> {
    const signals = forexAnalysisEngine.generateMultiTimeframeAnalysis();
    const trades: LiveForexTrade[] = [];
    
    signals.forEach((signal, index) => {
      // Generate trade based on signal analysis
      const leverage = this.calculateOptimalLeverage(signal.confidence, signal.timeframe);
      const positionSize = this.calculatePositionSize(signal.entryPrice, signal.stopLoss, leverage);
      const riskReward = this.calculateRiskReward(signal.entryPrice, signal.stopLoss, signal.takeProfit);
      
      const trade: LiveForexTrade = {
        id: `EUR_USD_${signal.timeframe}_${Date.now()}_${index}`,
        pair: 'EUR/USD',
        timeframe: signal.timeframe,
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        confidence: signal.confidence,
        leverage,
        positionSize,
        riskReward,
        reasoning: this.generateDetailedReasoning(signal),
        timestamp: Date.now(),
        status: signal.confidence > 70 ? 'ACTIVE' : 'PENDING'
      };
      
      trades.push(trade);
    });
    
    return trades.sort((a, b) => b.confidence - a.confidence);
  }
  
  private calculateOptimalLeverage(confidence: number, timeframe: string): number {
    // Conservative leverage based on confidence and timeframe
    let baseLeverage = 30; // EUR/USD typical max leverage
    
    // Adjust based on confidence
    if (confidence < 60) baseLeverage = 10;
    else if (confidence < 75) baseLeverage = 20;
    else if (confidence > 85) baseLeverage = 50;
    
    // Adjust based on timeframe (shorter timeframes = lower leverage)
    switch (timeframe) {
      case '15m': return Math.min(baseLeverage, 20);
      case '1h': return Math.min(baseLeverage, 30);
      case '4h': return Math.min(baseLeverage, 50);
      default: return baseLeverage;
    }
  }
  
  private calculatePositionSize(entryPrice: number, stopLoss: number, leverage: number): number {
    const accountBalance = 10000; // $10,000 account
    const riskPercent = 0.02; // 2% risk per trade
    const riskAmount = accountBalance * riskPercent;
    const pipValue = 10; // EUR/USD pip value for standard lot
    
    const stopLossPips = Math.abs(entryPrice - stopLoss) * 10000;
    const positionSize = (riskAmount / stopLossPips) * leverage;
    
    return Math.round(positionSize * 100) / 100; // Round to 2 decimal places
  }
  
  private calculateRiskReward(entryPrice: number, stopLoss: number, takeProfit: number): string {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const ratio = reward / risk;
    return `1:${ratio.toFixed(1)}`;
  }
  
  private generateDetailedReasoning(signal: any): string {
    let reasoning = `${signal.timeframe} Analysis: `;
    
    // VWAP reasoning
    if (signal.vwapAnalysis.position === 'above') {
      reasoning += 'Price above VWAP indicates bullish momentum. ';
    } else if (signal.vwapAnalysis.position === 'below') {
      reasoning += 'Price below VWAP suggests bearish pressure. ';
    }
    
    // Market structure
    if (signal.marketStructure.trend === 'bullish') {
      reasoning += 'Market structure shows higher highs and higher lows supporting uptrend. ';
    } else if (signal.marketStructure.trend === 'bearish') {
      reasoning += 'Market structure shows lower highs and lower lows confirming downtrend. ';
    }
    
    // Price action
    if (signal.priceAction.pattern !== 'Neutral') {
      reasoning += `${signal.priceAction.pattern} formation provides directional bias. `;
    }
    
    // Fibonacci analysis
    const nearFibLevel = signal.fibonacciLevels.find((fib: any) => 
      Math.abs(signal.entryPrice - fib.price) < 0.002
    );
    if (nearFibLevel) {
      reasoning += `Price near key Fibonacci ${(nearFibLevel.level * 100).toFixed(1)}% level provides confluence. `;
    }
    
    return reasoning.trim();
  }
}

export const liveForexTradeGenerator = new LiveForexTradeGenerator();
export type { LiveForexTrade };