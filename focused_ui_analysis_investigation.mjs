/**
 * FOCUSED UI ANALYSIS INVESTIGATION - EXTERNAL SHELL TESTING
 * Critical investigation of BTC signal bias and value consistency across timeframes
 */

import fetch from 'node-fetch';

class FocusedUIAnalysis {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.criticalFindings = {
      btcSignalBias: [],
      valueConsistency: {},
      technicalAnalysisIssues: [],
      monteCarloConsistency: [],
      riskAssessmentVariation: []
    };
  }

  async runFocusedInvestigation() {
    console.log('🔍 FOCUSED UI ANALYSIS INVESTIGATION');
    
    // Phase 1: BTC Signal Direction Investigation
    await this.investigateBTCSignalBias();
    
    // Phase 2: Cross-Timeframe Value Consistency
    await this.investigateValueConsistency();
    
    // Phase 3: Technical Analysis Data Validation
    await this.investigateTechnicalAnalysisData();
    
    // Phase 4: Monte Carlo Consistency Check
    await this.investigateMonteCarloConsistency();
    
    // Phase 5: Risk Assessment Variation Analysis
    await this.investigateRiskAssessmentVariation();
    
    // Generate critical findings report
    await this.generateCriticalFindings();
  }

  async investigateBTCSignalBias() {
    console.log('🔍 Investigating BTC Signal Direction Bias...');
    
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    const signalDirections = {};
    
    for (let cycle = 1; cycle <= 10; cycle++) {
      console.log(`Cycle ${cycle}/10: Testing BTC signals...`);
      
      for (const timeframe of timeframes) {
        try {
          const response = await fetch(`${this.baseUrl}/api/signals?symbol=BTC%2FUSDT&timeframe=${timeframe}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const direction = data[0].direction;
              if (!signalDirections[timeframe]) signalDirections[timeframe] = {};
              if (!signalDirections[timeframe][direction]) signalDirections[timeframe][direction] = 0;
              signalDirections[timeframe][direction]++;
              
              console.log(`  ${timeframe}: ${direction} (confidence: ${data[0].confidence}%)`);
            }
          }
        } catch (error) {
          console.log(`  Error testing ${timeframe}: ${error.message}`);
        }
      }
      
      await this.sleep(500);
    }
    
    // Analyze bias
    const biasAnalysis = this.analyzeBias(signalDirections);
    this.criticalFindings.btcSignalBias = biasAnalysis;
    
    console.log('BTC Signal Analysis:');
    Object.entries(signalDirections).forEach(([timeframe, directions]) => {
      const total = Object.values(directions).reduce((a, b) => a + b, 0);
      const shortPct = ((directions.SHORT || 0) / total * 100).toFixed(1);
      console.log(`  ${timeframe}: ${shortPct}% SHORT signals`);
    });
  }

  async investigateValueConsistency() {
    console.log('📊 Investigating Value Consistency Across Timeframes...');
    
    const pairs = ['BTC/USDT', 'ETH/USDT'];
    const timeframes = ['1h', '4h', '1d'];
    
    for (const pair of pairs) {
      console.log(`Testing ${pair}...`);
      
      const pairData = {};
      
      for (const timeframe of timeframes) {
        try {
          // Test Monte Carlo
          const mcResponse = await fetch(`${this.baseUrl}/api/monte-carlo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: pair, timeframe })
          });
          
          if (mcResponse.ok) {
            const mcData = await mcResponse.json();
            pairData[timeframe] = {
              monteCarlo: {
                volatility: mcData.volatility,
                expectedReturn: mcData.expectedReturn,
                winProbability: mcData.winProbability
              }
            };
          }
          
          // Test Technical Analysis
          const techResponse = await fetch(`${this.baseUrl}/api/technical-analysis?symbol=${encodeURIComponent(pair)}&timeframe=${timeframe}`);
          if (techResponse.ok) {
            const techData = await techResponse.json();
            pairData[timeframe].technical = techData;
          }
          
          console.log(`  ${timeframe}: Monte Carlo volatility: ${mcData?.volatility?.toFixed(2)}%`);
          
        } catch (error) {
          console.log(`  Error testing ${pair} ${timeframe}: ${error.message}`);
        }
        
        await this.sleep(300);
      }
      
      this.criticalFindings.valueConsistency[pair] = pairData;
    }
  }

  async investigateTechnicalAnalysisData() {
    console.log('📈 Investigating Technical Analysis Data...');
    
    const pairs = ['BTC/USDT', 'ETH/USDT'];
    const timeframes = ['1h', '4h', '1d'];
    
    for (const pair of pairs) {
      for (const timeframe of timeframes) {
        try {
          const response = await fetch(`${this.baseUrl}/api/technical-analysis?symbol=${encodeURIComponent(pair)}&timeframe=${timeframe}`);
          if (response.ok) {
            const data = await response.json();
            
            const analysis = {
              pair,
              timeframe,
              hasData: !!data,
              indicatorsPresent: data?.indicators ? Object.keys(data.indicators).length : 0,
              timestamp: new Date().toISOString()
            };
            
            this.criticalFindings.technicalAnalysisIssues.push(analysis);
            
            console.log(`${pair} ${timeframe}: ${analysis.indicatorsPresent} indicator categories`);
          }
        } catch (error) {
          console.log(`Technical Analysis error for ${pair} ${timeframe}: ${error.message}`);
        }
      }
    }
  }

  async investigateMonteCarloConsistency() {
    console.log('🎲 Investigating Monte Carlo Consistency...');
    
    const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    const timeframes = ['1h', '4h', '1d'];
    
    for (const pair of pairs) {
      const volatilityValues = [];
      
      for (const timeframe of timeframes) {
        try {
          const response = await fetch(`${this.baseUrl}/api/monte-carlo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: pair, timeframe })
          });
          
          if (response.ok) {
            const data = await response.json();
            volatilityValues.push({
              timeframe,
              volatility: data.volatility,
              expectedReturn: data.expectedReturn,
              winProbability: data.winProbability
            });
            
            console.log(`${pair} ${timeframe}: Vol: ${data.volatility?.toFixed(2)}%, Return: ${data.expectedReturn?.toFixed(3)}%`);
          }
        } catch (error) {
          console.log(`Monte Carlo error for ${pair} ${timeframe}: ${error.message}`);
        }
        
        await this.sleep(2100); // Respect rate limiting
      }
      
      // Check for suspicious identical values
      const uniqueVolatilities = [...new Set(volatilityValues.map(v => v.volatility))];
      if (volatilityValues.length > 2 && uniqueVolatilities.length === 1) {
        this.criticalFindings.monteCarloConsistency.push({
          pair,
          issue: 'IDENTICAL_VOLATILITY_ACROSS_TIMEFRAMES',
          value: uniqueVolatilities[0],
          timeframes: volatilityValues.map(v => v.timeframe)
        });
      }
    }
  }

  async investigateRiskAssessmentVariation() {
    console.log('⚠️ Investigating Risk Assessment Variation...');
    
    const pairs = ['BTC/USDT', 'ETH/USDT'];
    const timeframes = ['1h', '4h', '1d'];
    
    for (const pair of pairs) {
      const riskValues = [];
      
      for (const timeframe of timeframes) {
        try {
          const response = await fetch(`${this.baseUrl}/api/risk-assessment?symbol=${encodeURIComponent(pair)}&timeframe=${timeframe}`);
          if (response.ok) {
            const data = await response.json();
            riskValues.push({
              timeframe,
              stopLoss: data.stopLoss,
              takeProfit: data.takeProfit,
              riskReward: data.riskReward
            });
            
            console.log(`${pair} ${timeframe}: R:R ${data.riskReward?.toFixed(2)}, SL: ${data.stopLoss?.toFixed(2)}`);
          }
        } catch (error) {
          console.log(`Risk Assessment error for ${pair} ${timeframe}: ${error.message}`);
        }
      }
      
      this.criticalFindings.riskAssessmentVariation.push({
        pair,
        values: riskValues
      });
    }
  }

  analyzeBias(signalDirections) {
    const biasAnalysis = {
      overallBias: 'NONE',
      timeframeBias: {},
      suspiciousTimeframes: [],
      recommendations: []
    };
    
    let totalShorts = 0;
    let totalSignals = 0;
    
    Object.entries(signalDirections).forEach(([timeframe, directions]) => {
      const total = Object.values(directions).reduce((a, b) => a + b, 0);
      const shortPct = (directions.SHORT || 0) / total * 100;
      
      totalShorts += (directions.SHORT || 0);
      totalSignals += total;
      
      biasAnalysis.timeframeBias[timeframe] = {
        shortPercentage: shortPct,
        totalSignals: total,
        isSuspicious: shortPct > 80
      };
      
      if (shortPct > 80) {
        biasAnalysis.suspiciousTimeframes.push(timeframe);
      }
    });
    
    const overallShortPct = (totalShorts / totalSignals) * 100;
    
    if (overallShortPct > 75) {
      biasAnalysis.overallBias = 'CRITICAL_SHORT_BIAS';
      biasAnalysis.recommendations.push('URGENT: Review signal generation algorithm for SHORT bias');
    } else if (overallShortPct > 60) {
      biasAnalysis.overallBias = 'MODERATE_SHORT_BIAS';
      biasAnalysis.recommendations.push('Review signal generation for potential bias');
    }
    
    return biasAnalysis;
  }

  async generateCriticalFindings() {
    console.log('\n🎯 CRITICAL FINDINGS REPORT');
    console.log('=' * 50);
    
    // BTC Signal Bias Analysis
    const btcBias = this.criticalFindings.btcSignalBias;
    console.log('\n1. BTC SIGNAL DIRECTION ANALYSIS:');
    console.log(`   Overall Bias: ${btcBias.overallBias}`);
    console.log(`   Suspicious Timeframes: ${btcBias.suspiciousTimeframes.join(', ') || 'None'}`);
    btcBias.recommendations.forEach(rec => {
      console.log(`   ⚠️ ${rec}`);
    });
    
    // Value Consistency Analysis
    console.log('\n2. VALUE CONSISTENCY ANALYSIS:');
    Object.entries(this.criticalFindings.valueConsistency).forEach(([pair, data]) => {
      console.log(`   ${pair}:`);
      Object.entries(data).forEach(([timeframe, values]) => {
        if (values.monteCarlo) {
          console.log(`     ${timeframe}: Volatility ${values.monteCarlo.volatility?.toFixed(2)}%`);
        }
      });
    });
    
    // Monte Carlo Consistency Issues
    console.log('\n3. MONTE CARLO CONSISTENCY ISSUES:');
    if (this.criticalFindings.monteCarloConsistency.length === 0) {
      console.log('   ✅ No suspicious identical values detected');
    } else {
      this.criticalFindings.monteCarloConsistency.forEach(issue => {
        console.log(`   ⚠️ ${issue.pair}: ${issue.issue}`);
        console.log(`      Value: ${issue.value}, Timeframes: ${issue.timeframes.join(', ')}`);
      });
    }
    
    // Technical Analysis Status
    console.log('\n4. TECHNICAL ANALYSIS STATUS:');
    const techIssues = this.criticalFindings.technicalAnalysisIssues;
    const noDataCount = techIssues.filter(t => !t.hasData).length;
    console.log(`   ${techIssues.length - noDataCount}/${techIssues.length} endpoints returning data`);
    if (noDataCount > 0) {
      console.log(`   ⚠️ ${noDataCount} endpoints returning null/empty data`);
    }
    
    console.log('\n5. KEY ANSWERS TO USER QUESTIONS:');
    console.log('   Q: Should Monte Carlo, Technical Analysis, and Risk values be same across timeframes?');
    console.log('   A: NO - Values should vary significantly by timeframe due to:');
    console.log('      - Different volatility periods (1h vs 1d vs 1w)');
    console.log('      - Timeframe-specific risk calculations');
    console.log('      - Varying market dynamics per timeframe');
    
    console.log('\n   Q: Are all BTC timeframes being SHORT signals correct?');
    if (btcBias.overallBias.includes('BIAS')) {
      console.log('   A: SUSPICIOUS - High percentage of SHORT signals detected');
      console.log('      This suggests potential issues in signal generation algorithm');
    } else {
      console.log('   A: Within normal range - Signal distribution appears balanced');
    }
    
    console.log('\n📋 IMMEDIATE ACTION ITEMS:');
    console.log('   1. Investigate Technical Analysis API returning null data');
    console.log('   2. Verify timeframe-specific calculations in Monte Carlo');
    console.log('   3. Review signal generation algorithm for directional bias');
    console.log('   4. Implement timeframe-appropriate risk calculations');
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      criticalFindings: this.criticalFindings,
      summary: {
        btcSignalBias: btcBias.overallBias,
        technicalAnalysisDataIssues: noDataCount > 0,
        monteCarloConsistencyIssues: this.criticalFindings.monteCarloConsistency.length > 0,
        recommendedActions: [
          'Fix Technical Analysis API null responses',
          'Implement timeframe-specific value calculations',
          'Review signal generation for bias',
          'Add validation for cross-timeframe value variation'
        ]
      }
    };
    
    console.log('\n✅ FOCUSED ANALYSIS COMPLETE');
    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute focused analysis
async function main() {
  const analyzer = new FocusedUIAnalysis();
  
  try {
    await analyzer.runFocusedInvestigation();
  } catch (error) {
    console.error('❌ Analysis error:', error);
  }
}

main().catch(console.error);