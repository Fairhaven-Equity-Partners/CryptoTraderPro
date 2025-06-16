/**
 * SIGNAL DIRECTION CONFLICT ANALYSIS
 * Investigates why Monte Carlo and Market Analysis show opposite trading signals
 */

class SignalDirectionConflictAnalyzer {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.results = {
      conflicts: [],
      analysis: {},
      rootCause: null
    };
  }

  async runConflictAnalysis() {
    console.log('🔍 SIGNAL DIRECTION CONFLICT ANALYSIS');
    console.log('=====================================');
    
    await this.analyzeXRPConflict();
    await this.compareTechnicalAnalysisLogic();
    await this.analyzeMonteCarloLogic();
    await this.identifyRootCause();
    
    this.generateConflictReport();
  }

  async analyzeXRPConflict() {
    console.log('\n📊 Analyzing XRP Signal Conflict...');
    
    try {
      // Get technical analysis signal
      const techResponse = await fetch(`${this.baseURL}/api/technical-analysis/XRP%2FUSDT?timeframe=4h`);
      const techData = await techResponse.json();
      
      // Get signals API
      const signalsResponse = await fetch(`${this.baseURL}/api/signals/XRP%2FUSDT?timeframe=4h`);
      const signalsData = await signalsResponse.json();
      
      // Get Monte Carlo analysis
      const monteCarloResponse = await fetch(`${this.baseURL}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'XRP/USDT', timeframe: '4h' })
      });
      const monteCarloData = await monteCarloResponse.json();
      
      this.results.analysis = {
        technicalAnalysis: {
          direction: techData.data?.direction || 'UNKNOWN',
          confidence: techData.data?.confidence || 0,
          rsi: techData.data?.indicators?.rsi?.value,
          macd: techData.data?.indicators?.macd?.value,
          price: techData.data?.currentPrice
        },
        signalsAPI: {
          direction: signalsData[0]?.direction || 'UNKNOWN',
          confidence: signalsData[0]?.confidence || 0,
          price: signalsData[0]?.price
        },
        monteCarlo: {
          direction: monteCarloData.signalInput?.direction || 'UNKNOWN',
          confidence: monteCarloData.signalInput?.confidence || 0,
          entryPrice: monteCarloData.signalInput?.entryPrice,
          riskLevel: monteCarloData.riskMetrics?.riskLevel
        }
      };
      
      console.log('Technical Analysis Direction:', this.results.analysis.technicalAnalysis.direction);
      console.log('Signals API Direction:', this.results.analysis.signalsAPI.direction);
      console.log('Monte Carlo Direction:', this.results.analysis.monteCarlo.direction);
      
      // Identify conflicts
      const directions = [
        this.results.analysis.technicalAnalysis.direction,
        this.results.analysis.signalsAPI.direction,
        this.results.analysis.monteCarlo.direction
      ];
      
      const uniqueDirections = [...new Set(directions)];
      if (uniqueDirections.length > 1) {
        this.results.conflicts.push({
          type: 'Direction Conflict',
          directions: directions,
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log('❌ Error analyzing XRP conflict:', error.message);
    }
  }

  async compareTechnicalAnalysisLogic() {
    console.log('\n🔬 Comparing Technical Analysis Logic...');
    
    try {
      // Test with known RSI values
      const response = await fetch(`${this.baseURL}/api/technical-analysis/XRP%2FUSDT?timeframe=4h`);
      const data = await response.json();
      
      const rsi = data.data?.indicators?.rsi?.value;
      const macd = data.data?.indicators?.macd?.value;
      
      console.log(`RSI: ${rsi} (${rsi < 30 ? 'OVERSOLD/BUY' : rsi > 70 ? 'OVERBOUGHT/SELL' : 'NEUTRAL'})`);
      console.log(`MACD: ${macd} (${macd > 0 ? 'BULLISH' : 'BEARISH'})`);
      
      // Expected signal based on indicators
      let expectedSignal = 'NEUTRAL';
      if (rsi < 30 && macd > 0) expectedSignal = 'LONG';
      else if (rsi > 70 && macd < 0) expectedSignal = 'SHORT';
      else if (rsi < 40 && macd > 0) expectedSignal = 'LONG';
      else if (rsi > 60 && macd < 0) expectedSignal = 'SHORT';
      
      console.log(`Expected Signal: ${expectedSignal}`);
      console.log(`Actual Signal: ${data.data?.direction}`);
      
      if (expectedSignal !== data.data?.direction) {
        this.results.conflicts.push({
          type: 'Technical Analysis Logic Error',
          expected: expectedSignal,
          actual: data.data?.direction,
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log('❌ Error comparing technical analysis logic:', error.message);
    }
  }

  async analyzeMonteCarloLogic() {
    console.log('\n🎯 Analyzing Monte Carlo Signal Generation...');
    
    try {
      const response = await fetch(`${this.baseURL}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'XRP/USDT', timeframe: '4h' })
      });
      const data = await response.json();
      
      console.log('Monte Carlo Signal Input:');
      console.log(`  Direction: ${data.signalInput?.direction}`);
      console.log(`  Entry Price: ${data.signalInput?.entryPrice}`);
      console.log(`  Stop Loss: ${data.signalInput?.stopLoss}`);
      console.log(`  Take Profit: ${data.signalInput?.takeProfit}`);
      console.log(`  Confidence: ${data.signalInput?.confidence}%`);
      
      console.log('Risk Metrics:');
      console.log(`  Risk Level: ${data.riskMetrics?.riskLevel}`);
      console.log(`  Win Probability: ${data.riskMetrics?.winProbability}%`);
      console.log(`  Expected Return: ${data.riskMetrics?.expectedReturn}%`);
      
      // Check if Monte Carlo is using different signal source
      if (data.signalInput) {
        this.results.analysis.monteCarloDetails = {
          signalSource: 'Monte Carlo generates its own signals',
          riskBased: true,
          usesRiskMetrics: true
        };
      }
      
    } catch (error) {
      console.log('❌ Error analyzing Monte Carlo logic:', error.message);
    }
  }

  identifyRootCause() {
    console.log('\n🔍 Identifying Root Cause...');
    
    if (this.results.conflicts.length > 0) {
      // Check if different APIs use different calculation methods
      const techDirection = this.results.analysis.technicalAnalysis.direction;
      const monteCarloDirection = this.results.analysis.monteCarlo.direction;
      
      if (techDirection && monteCarloDirection && techDirection !== monteCarloDirection) {
        this.results.rootCause = {
          type: 'CALCULATION_METHOD_INCONSISTENCY',
          description: 'Technical Analysis and Monte Carlo use different signal calculation methods',
          impact: 'HIGH',
          solution: 'Standardize signal calculation across all components'
        };
      }
      
      console.log('Root Cause Identified:');
      console.log(`  Type: ${this.results.rootCause?.type}`);
      console.log(`  Description: ${this.results.rootCause?.description}`);
      console.log(`  Impact: ${this.results.rootCause?.impact}`);
    } else {
      console.log('No conflicts detected in current analysis');
    }
  }

  generateConflictReport() {
    console.log('\n📋 SIGNAL DIRECTION CONFLICT REPORT');
    console.log('===================================');
    
    console.log(`Total Conflicts: ${this.results.conflicts.length}`);
    
    if (this.results.conflicts.length > 0) {
      this.results.conflicts.forEach((conflict, index) => {
        console.log(`\nConflict ${index + 1}:`);
        console.log(`  Type: ${conflict.type}`);
        console.log(`  Severity: ${conflict.severity}`);
        if (conflict.directions) {
          console.log(`  Directions: ${conflict.directions.join(', ')}`);
        }
        if (conflict.expected && conflict.actual) {
          console.log(`  Expected: ${conflict.expected}, Actual: ${conflict.actual}`);
        }
      });
    }
    
    if (this.results.rootCause) {
      console.log('\n🎯 ROOT CAUSE:');
      console.log(`${this.results.rootCause.description}`);
      console.log(`Solution: ${this.results.rootCause.solution}`);
    }
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Standardize signal calculation method across all APIs');
    console.log('2. Ensure Monte Carlo uses same technical indicators as market analysis');
    console.log('3. Validate signal direction consistency before displaying to users');
    console.log('4. Implement unified signal generation engine');
  }
}

async function main() {
  const analyzer = new SignalDirectionConflictAnalyzer();
  await analyzer.runConflictAnalysis();
}

main().catch(console.error);