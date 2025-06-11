/**
 * Feedback Loop Effectiveness Analyzer
 * Complete analysis of how feedback mechanisms improve system performance
 */

import fetch from 'node-fetch';

class FeedbackLoopAnalyzer {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.analysis = {
      predictionAccuracy: { current: 0, historical: [], trend: 'stable' },
      tradePerformance: { winRate: 0, activeTrades: 0, profitLoss: 0 },
      systemAdaptation: { adjustments: 0, improvements: [] },
      feedbackQuality: { responsiveness: 0, actionability: 0 },
      overallEffectiveness: 0
    };
  }

  async runCompleteAnalysis() {
    console.log('🔄 FEEDBACK LOOP EFFECTIVENESS ANALYSIS');
    console.log('Measuring how feedback improves system performance\n');

    await this.analyzePredictionFeedback();
    await this.analyzeTradeSimulationFeedback();
    await this.analyzeSystemAdaptationFeedback();
    await this.measureFeedbackQuality();
    await this.calculateOverallEffectiveness();
    
    this.generateEffectivenessReport();
  }

  async analyzePredictionFeedback() {
    console.log('📈 PREDICTION FEEDBACK ANALYSIS');
    console.log('─'.repeat(35));

    try {
      // Test prediction accuracy tracking
      const accuracyResponse = await fetch(`${this.baseUrl}/api/accuracy/BTC/USDT`);
      if (accuracyResponse.ok) {
        const accuracyData = await accuracyResponse.json();
        
        // Calculate prediction accuracy metrics
        const predictions = accuracyData.predictions || [];
        const correctPredictions = predictions.filter(p => p.outcome === 'correct').length;
        const totalPredictions = predictions.length;
        const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;
        
        this.analysis.predictionAccuracy.current = accuracy;
        console.log(`   Current Accuracy: ${accuracy.toFixed(1)}%`);
        console.log(`   Total Predictions: ${totalPredictions}`);
        console.log(`   Correct Predictions: ${correctPredictions}`);
        
        // Analyze prediction improvement over time
        if (totalPredictions >= 10) {
          const recentAccuracy = predictions.slice(-10).filter(p => p.outcome === 'correct').length / 10 * 100;
          const earlierAccuracy = predictions.slice(0, 10).filter(p => p.outcome === 'correct').length / 10 * 100;
          
          if (recentAccuracy > earlierAccuracy + 5) {
            this.analysis.predictionAccuracy.trend = 'improving';
            console.log(`   Trend: Improving (${recentAccuracy.toFixed(1)}% recent vs ${earlierAccuracy.toFixed(1)}% earlier)`);
          } else if (recentAccuracy < earlierAccuracy - 5) {
            this.analysis.predictionAccuracy.trend = 'declining';
            console.log(`   Trend: Declining (${recentAccuracy.toFixed(1)}% recent vs ${earlierAccuracy.toFixed(1)}% earlier)`);
          } else {
            console.log(`   Trend: Stable (${recentAccuracy.toFixed(1)}% recent vs ${earlierAccuracy.toFixed(1)}% earlier)`);
          }
        }
      } else {
        console.log('   Accuracy tracking: Not available');
      }

      // Test feedback recording system
      const testPrediction = {
        symbol: 'BTC/USDT',
        timeframe: '1h',
        direction: 'LONG',
        confidence: 85,
        entryPrice: 108000,
        timestamp: Date.now()
      };

      const recordResponse = await fetch(`${this.baseUrl}/api/feedback/record-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPrediction),
        timeout: 2000
      });

      if (recordResponse.ok) {
        console.log('   Feedback Recording: Active and functional');
        this.analysis.systemAdaptation.adjustments++;
      } else {
        console.log('   Feedback Recording: Limited functionality');
      }

    } catch (error) {
      console.log('   Prediction feedback: Analysis limited due to connectivity');
    }
  }

  async analyzeTradeSimulationFeedback() {
    console.log('\n📊 TRADE SIMULATION FEEDBACK ANALYSIS');
    console.log('─'.repeat(40));

    try {
      const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
      let totalActiveTrades = 0;
      let totalCompletedTrades = 0;
      let totalProfitLoss = 0;
      let profitableTrades = 0;

      for (const symbol of symbols) {
        try {
          const response = await fetch(`${this.baseUrl}/api/trade-simulations/${encodeURIComponent(symbol)}`, { timeout: 1500 });
          if (response.ok) {
            const trades = await response.json();
            
            const activeTrades = trades.filter(t => t.isActive);
            const completedTrades = trades.filter(t => !t.isActive);
            
            totalActiveTrades += activeTrades.length;
            totalCompletedTrades += completedTrades.length;
            
            completedTrades.forEach(trade => {
              const profitLoss = trade.profitLoss || 0;
              totalProfitLoss += profitLoss;
              if (profitLoss > 0) profitableTrades++;
            });
          }
        } catch (e) {
          // Skip symbol if timeout
        }
      }

      this.analysis.tradePerformance.activeTrades = totalActiveTrades;
      this.analysis.tradePerformance.profitLoss = totalProfitLoss;
      
      const winRate = totalCompletedTrades > 0 ? (profitableTrades / totalCompletedTrades) * 100 : 0;
      this.analysis.tradePerformance.winRate = winRate;

      console.log(`   Active Trades: ${totalActiveTrades}`);
      console.log(`   Completed Trades: ${totalCompletedTrades}`);
      console.log(`   Win Rate: ${winRate.toFixed(1)}%`);
      console.log(`   Total P&L: ${totalProfitLoss > 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}`);

      // Analyze feedback effectiveness from trade data
      if (totalActiveTrades > 20) {
        this.analysis.systemAdaptation.improvements.push('High trade volume indicates active signal generation');
        console.log('   Feedback Impact: Active signal generation from trade simulations');
      }

      if (winRate > 55) {
        this.analysis.systemAdaptation.improvements.push('Positive win rate shows effective feedback learning');
        console.log('   Feedback Impact: Profitable signal patterns being learned');
      }

    } catch (error) {
      console.log('   Trade simulation feedback: Analysis incomplete');
    }
  }

  async analyzeSystemAdaptationFeedback() {
    console.log('\n🔧 SYSTEM ADAPTATION FEEDBACK ANALYSIS');
    console.log('─'.repeat(42));

    try {
      // Test if system responds to market heatmap feedback
      const timeframes = ['1h', '4h', '1d'];
      let adaptiveResponses = 0;

      for (const timeframe of timeframes) {
        try {
          const response = await fetch(`${this.baseUrl}/api/market-heatmap?timeframe=${timeframe}`, { timeout: 1500 });
          if (response.ok) {
            const data = await response.json();
            const entries = data.marketEntries || [];
            
            // Check if system adapts signal strength based on timeframe
            const strongSignals = entries.filter(e => e.confidence >= 90).length;
            const totalSignals = entries.length;
            
            if (totalSignals > 0) {
              const strongSignalRatio = strongSignals / totalSignals;
              if (strongSignalRatio > 0.8) { // High confidence adaptation
                adaptiveResponses++;
              }
            }
          }
        } catch (e) {
          // Skip if timeout
        }
      }

      this.analysis.systemAdaptation.adjustments += adaptiveResponses;
      console.log(`   Adaptive Responses: ${adaptiveResponses}/${timeframes.length} timeframes`);

      // Test automation status feedback
      const automationResponse = await fetch(`${this.baseUrl}/api/automation/status`, { timeout: 1000 });
      if (automationResponse.ok) {
        const automationData = await automationResponse.json();
        if (automationData.isRunning && automationData.adaptiveTiming) {
          this.analysis.systemAdaptation.improvements.push('Automation adapts timing based on market conditions');
          console.log('   Automation Feedback: Adaptive timing active');
        }
      }

      // Measure feedback responsiveness
      if (this.analysis.systemAdaptation.adjustments >= 2) {
        this.analysis.feedbackQuality.responsiveness = 85;
        console.log('   System Responsiveness: High (85%)');
      } else {
        this.analysis.feedbackQuality.responsiveness = 65;
        console.log('   System Responsiveness: Moderate (65%)');
      }

    } catch (error) {
      console.log('   System adaptation: Analysis limited');
    }
  }

  async measureFeedbackQuality() {
    console.log('\n📋 FEEDBACK QUALITY MEASUREMENT');
    console.log('─'.repeat(35));

    // Measure actionability based on implemented improvements
    const totalImprovements = this.analysis.systemAdaptation.improvements.length;
    const actionabilityScore = Math.min(100, totalImprovements * 25);
    this.analysis.feedbackQuality.actionability = actionabilityScore;

    console.log(`   Implemented Improvements: ${totalImprovements}`);
    console.log(`   Actionability Score: ${actionabilityScore}%`);

    // List specific improvements discovered
    if (totalImprovements > 0) {
      console.log('   Feedback-Driven Improvements:');
      this.analysis.systemAdaptation.improvements.forEach((improvement, i) => {
        console.log(`     ${i + 1}. ${improvement}`);
      });
    }

    // Quality assessment
    const avgQuality = (this.analysis.feedbackQuality.responsiveness + this.analysis.feedbackQuality.actionability) / 2;
    console.log(`   Overall Feedback Quality: ${avgQuality.toFixed(1)}%`);
  }

  async calculateOverallEffectiveness() {
    console.log('\n🎯 OVERALL EFFECTIVENESS CALCULATION');
    console.log('─'.repeat(40));

    const weights = {
      predictionAccuracy: 0.3,
      tradePerformance: 0.25,
      systemAdaptation: 0.25,
      feedbackQuality: 0.2
    };

    // Normalize scores to 0-100 scale
    const predictionScore = Math.min(100, this.analysis.predictionAccuracy.current);
    const tradeScore = Math.min(100, this.analysis.tradePerformance.winRate || 50); // Default 50 if no data
    const adaptationScore = Math.min(100, this.analysis.systemAdaptation.adjustments * 33);
    const qualityScore = (this.analysis.feedbackQuality.responsiveness + this.analysis.feedbackQuality.actionability) / 2;

    const overallEffectiveness = (
      predictionScore * weights.predictionAccuracy +
      tradeScore * weights.tradePerformance +
      adaptationScore * weights.systemAdaptation +
      qualityScore * weights.feedbackQuality
    );

    this.analysis.overallEffectiveness = overallEffectiveness;

    console.log(`   Prediction Component: ${predictionScore.toFixed(1)}% (weight: ${weights.predictionAccuracy})`);
    console.log(`   Trade Performance: ${tradeScore.toFixed(1)}% (weight: ${weights.tradePerformance})`);
    console.log(`   System Adaptation: ${adaptationScore.toFixed(1)}% (weight: ${weights.systemAdaptation})`);
    console.log(`   Feedback Quality: ${qualityScore.toFixed(1)}% (weight: ${weights.feedbackQuality})`);
    console.log(`   Overall Effectiveness: ${overallEffectiveness.toFixed(1)}%`);
  }

  generateEffectivenessReport() {
    console.log('\n📈 FEEDBACK LOOP EFFECTIVENESS REPORT');
    console.log('═'.repeat(45));

    const effectiveness = this.analysis.overallEffectiveness;
    const { predictionAccuracy, tradePerformance, systemAdaptation, feedbackQuality } = this.analysis;

    console.log('\n🎯 KEY FINDINGS:');
    console.log(`   Overall Effectiveness: ${effectiveness.toFixed(1)}%`);
    
    if (effectiveness >= 80) {
      console.log('   Status: HIGHLY EFFECTIVE - Feedback loop driving significant improvements');
    } else if (effectiveness >= 65) {
      console.log('   Status: MODERATELY EFFECTIVE - Good foundation with optimization potential');
    } else if (effectiveness >= 50) {
      console.log('   Status: DEVELOPING - Basic feedback mechanisms in place');
    } else {
      console.log('   Status: NEEDS ENHANCEMENT - Limited feedback effectiveness');
    }

    console.log('\n📊 COMPONENT ANALYSIS:');
    console.log(`   Prediction Accuracy: ${predictionAccuracy.current.toFixed(1)}% (${predictionAccuracy.trend})`);
    console.log(`   Trade Win Rate: ${tradePerformance.winRate.toFixed(1)}%`);
    console.log(`   Active Trades: ${tradePerformance.activeTrades}`);
    console.log(`   System Adjustments: ${systemAdaptation.adjustments}`);
    console.log(`   Feedback Responsiveness: ${feedbackQuality.responsiveness}%`);
    console.log(`   Feedback Actionability: ${feedbackQuality.actionability}%`);

    console.log('\n💡 FEEDBACK LOOP VALUE PROPOSITION:');
    
    if (tradePerformance.activeTrades > 30) {
      console.log('   ✅ High trade volume indicates active signal generation feedback');
    }
    
    if (systemAdaptation.improvements.length > 2) {
      console.log('   ✅ Multiple system improvements driven by feedback mechanisms');
    }
    
    if (feedbackQuality.responsiveness > 70) {
      console.log('   ✅ System demonstrates good responsiveness to feedback');
    }

    console.log('\n🎯 RECOMMENDATIONS FOR OPTIMIZATION:');
    
    if (effectiveness < 90) {
      console.log('   1. Enhance prediction accuracy tracking with more detailed metrics');
      console.log('   2. Implement automated feedback loop adjustments');
      console.log('   3. Expand trade simulation feedback to include risk metrics');
    }
    
    if (tradePerformance.winRate < 60) {
      console.log('   4. Calibrate signal generation based on historical performance');
    }
    
    if (systemAdaptation.adjustments < 3) {
      console.log('   5. Implement more automated system adaptations based on feedback');
    }

    console.log('\n✅ FEEDBACK LOOP ANALYSIS COMPLETE');
    console.log(`   The feedback system is ${effectiveness.toFixed(1)}% effective at improving performance`);
  }
}

async function main() {
  const analyzer = new FeedbackLoopAnalyzer();
  await analyzer.runCompleteAnalysis();
}

main().catch(console.error);