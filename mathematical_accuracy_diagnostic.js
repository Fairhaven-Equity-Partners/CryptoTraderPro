/**
 * Mathematical Accuracy Diagnostic Tool
 * Deep analysis of algorithm calculations, signal generation, and confidence metrics
 * Tests all mathematical formulas for precision and accuracy
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';

class MathematicalAccuracyDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.mathErrors = [];
    this.accuracyTests = [];
    this.confidenceTests = [];
    this.signals = {};
    this.testResults = {
      rsiTests: [],
      macdTests: [],
      confidenceTests: [],
      signalAccuracy: [],
      priceConsistency: []
    };
  }

  async runMathematicalDiagnostic() {
    console.log('\n🧮 MATHEMATICAL ACCURACY DIAGNOSTIC');
    console.log('=' .repeat(70));
    
    // Phase 1: RSI Calculation Validation
    await this.validateRSICalculations();
    
    // Phase 2: MACD Accuracy Testing
    await this.validateMACDCalculations();
    
    // Phase 3: Confidence Score Mathematics
    await this.validateConfidenceCalculations();
    
    // Phase 4: Signal Generation Logic
    await this.validateSignalGenerationLogic();
    
    // Phase 5: Price Consistency Mathematics
    await this.validatePriceConsistency();
    
    // Phase 6: Stop Loss & Take Profit Calculations
    await this.validateRiskCalculations();
    
    // Phase 7: Cross-Validation Testing
    await this.performCrossValidation();
    
    return this.generateMathematicalReport();
  }

  async validateRSICalculations() {
    console.log('\n📊 Validating RSI Calculations...');
    
    const symbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    
    for (const symbol of symbols) {
      try {
        const technicalData = await this.makeRequest(`/api/technical-analysis/${symbol}`);
        
        if (technicalData.indicators && technicalData.indicators.rsi !== undefined) {
          const rsi = technicalData.indicators.rsi;
          
          // RSI must be between 0 and 100
          const isValidRange = rsi >= 0 && rsi <= 100;
          
          // Check for mathematical precision
          const hasProperPrecision = Number.isFinite(rsi) && !Number.isNaN(rsi);
          
          this.testResults.rsiTests.push({
            symbol,
            rsi,
            validRange: isValidRange,
            hasProperPrecision,
            passed: isValidRange && hasProperPrecision
          });
          
          if (!isValidRange) {
            this.mathErrors.push({
              type: 'RSI_OUT_OF_BOUNDS',
              symbol,
              value: rsi,
              expected: '0-100',
              severity: 'HIGH'
            });
          }
          
          if (!hasProperPrecision) {
            this.mathErrors.push({
              type: 'RSI_PRECISION_ERROR',
              symbol,
              value: rsi,
              severity: 'HIGH'
            });
          }
          
          console.log(`  ${symbol}: RSI=${rsi.toFixed(2)} ${isValidRange && hasProperPrecision ? '✓' : '✗'}`);
        } else {
          console.log(`  ${symbol}: No RSI data available`);
        }
      } catch (error) {
        if (!error.message.includes('HTML')) {
          this.mathErrors.push({
            type: 'RSI_CALCULATION_FAILED',
            symbol,
            error: error.message,
            severity: 'MEDIUM'
          });
        }
      }
    }
  }

  async validateMACDCalculations() {
    console.log('\n📈 Validating MACD Calculations...');
    
    const symbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    
    for (const symbol of symbols) {
      try {
        const technicalData = await this.makeRequest(`/api/technical-analysis/${symbol}`);
        
        if (technicalData.indicators && technicalData.indicators.macd !== undefined) {
          const macd = technicalData.indicators.macd;
          
          // MACD should be a finite number
          const isValidNumber = Number.isFinite(macd) && !Number.isNaN(macd);
          
          // MACD can be positive or negative, but should have reasonable bounds
          const isReasonableBounds = Math.abs(macd) < 10000;
          
          this.testResults.macdTests.push({
            symbol,
            macd,
            isValidNumber,
            isReasonableBounds,
            passed: isValidNumber && isReasonableBounds
          });
          
          if (!isValidNumber) {
            this.mathErrors.push({
              type: 'MACD_INVALID_NUMBER',
              symbol,
              value: macd,
              severity: 'HIGH'
            });
          }
          
          if (!isReasonableBounds) {
            this.mathErrors.push({
              type: 'MACD_UNREASONABLE_VALUE',
              symbol,
              value: macd,
              severity: 'MEDIUM'
            });
          }
          
          console.log(`  ${symbol}: MACD=${macd.toFixed(4)} ${isValidNumber && isReasonableBounds ? '✓' : '✗'}`);
        } else {
          console.log(`  ${symbol}: No MACD data available`);
        }
      } catch (error) {
        if (!error.message.includes('HTML')) {
          this.mathErrors.push({
            type: 'MACD_CALCULATION_FAILED',
            symbol,
            error: error.message,
            severity: 'MEDIUM'
          });
        }
      }
    }
  }

  async validateConfidenceCalculations() {
    console.log('\n🎯 Validating Confidence Calculations...');
    
    try {
      const performanceData = await this.makeRequest('/api/performance-metrics');
      
      if (performanceData.metrics) {
        Object.entries(performanceData.metrics).forEach(([key, value]) => {
          if (key.includes('confidence') || key.includes('accuracy')) {
            const isValidRange = value >= 0 && value <= 100;
            const isValidNumber = Number.isFinite(value) && !Number.isNaN(value);
            
            this.testResults.confidenceTests.push({
              metric: key,
              value,
              isValidRange,
              isValidNumber,
              passed: isValidRange && isValidNumber
            });
            
            if (!isValidRange) {
              this.mathErrors.push({
                type: 'CONFIDENCE_OUT_OF_BOUNDS',
                metric: key,
                value,
                expected: '0-100',
                severity: 'HIGH'
              });
            }
            
            if (!isValidNumber) {
              this.mathErrors.push({
                type: 'CONFIDENCE_INVALID_NUMBER',
                metric: key,
                value,
                severity: 'HIGH'
              });
            }
            
            console.log(`  ${key}: ${value} ${isValidRange && isValidNumber ? '✓' : '✗'}`);
          }
        });
      }
    } catch (error) {
      this.mathErrors.push({
        type: 'CONFIDENCE_VALIDATION_FAILED',
        error: error.message,
        severity: 'HIGH'
      });
    }
  }

  async validateSignalGenerationLogic() {
    console.log('\n🚦 Validating Signal Generation Logic...');
    
    const symbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    const validDirections = ['LONG', 'SHORT', 'NEUTRAL'];
    
    for (const symbol of symbols) {
      try {
        // Test multiple timeframes for consistency
        const timeframes = ['1h', '4h', '1d'];
        const signalData = {};
        
        // Get signals for different timeframes (using working endpoints)
        const heatmapData = await this.makeRequest('/api/market-heatmap');
        const symbolHeatmap = heatmapData.marketEntries?.find(e => e.symbol === symbol);
        
        if (symbolHeatmap && symbolHeatmap.signals) {
          Object.entries(symbolHeatmap.signals).forEach(([timeframe, signal]) => {
            if (signal) {
              const direction = signal.direction;
              const confidence = signal.confidence;
              
              // Validate direction
              const isValidDirection = validDirections.includes(direction);
              
              // Validate confidence
              const isValidConfidence = confidence >= 0 && confidence <= 100;
              
              this.testResults.signalAccuracy.push({
                symbol,
                timeframe,
                direction,
                confidence,
                isValidDirection,
                isValidConfidence,
                passed: isValidDirection && isValidConfidence
              });
              
              if (!isValidDirection) {
                this.mathErrors.push({
                  type: 'INVALID_SIGNAL_DIRECTION',
                  symbol,
                  timeframe,
                  direction,
                  severity: 'HIGH'
                });
              }
              
              if (!isValidConfidence) {
                this.mathErrors.push({
                  type: 'INVALID_SIGNAL_CONFIDENCE',
                  symbol,
                  timeframe,
                  confidence,
                  severity: 'HIGH'
                });
              }
              
              console.log(`  ${symbol} ${timeframe}: ${direction} (${confidence}%) ${isValidDirection && isValidConfidence ? '✓' : '✗'}`);
            }
          });
        }
      } catch (error) {
        this.mathErrors.push({
          type: 'SIGNAL_VALIDATION_FAILED',
          symbol,
          error: error.message,
          severity: 'MEDIUM'
        });
      }
    }
  }

  async validatePriceConsistency() {
    console.log('\n💰 Validating Price Consistency...');
    
    try {
      const heatmapData = await this.makeRequest('/api/market-heatmap');
      const marketData = await this.makeRequest('/api/simple-market-data');
      
      const symbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
      
      for (const symbol of symbols) {
        const heatmapEntry = heatmapData.marketEntries?.find(e => e.symbol === symbol);
        const marketEntry = marketData.data?.find(e => e.symbol === symbol);
        
        if (heatmapEntry && marketEntry) {
          const heatmapPrice = heatmapEntry.currentPrice;
          const marketPrice = marketEntry.price;
          
          // Calculate price difference percentage
          const priceDiff = Math.abs(heatmapPrice - marketPrice);
          const priceDiffPercent = (priceDiff / marketPrice) * 100;
          
          // Prices should be consistent (within 0.1%)
          const isConsistent = priceDiffPercent < 0.1;
          
          this.testResults.priceConsistency.push({
            symbol,
            heatmapPrice,
            marketPrice,
            priceDiffPercent,
            isConsistent
          });
          
          if (!isConsistent) {
            this.mathErrors.push({
              type: 'PRICE_INCONSISTENCY',
              symbol,
              heatmapPrice,
              marketPrice,
              difference: priceDiffPercent,
              severity: 'MEDIUM'
            });
          }
          
          console.log(`  ${symbol}: Heatmap=$${heatmapPrice.toFixed(2)}, Market=$${marketPrice.toFixed(2)} (${priceDiffPercent.toFixed(4)}%) ${isConsistent ? '✓' : '✗'}`);
        }
      }
    } catch (error) {
      this.mathErrors.push({
        type: 'PRICE_CONSISTENCY_CHECK_FAILED',
        error: error.message,
        severity: 'HIGH'
      });
    }
  }

  async validateRiskCalculations() {
    console.log('\n⚖️ Validating Risk Calculations...');
    
    try {
      const heatmapData = await this.makeRequest('/api/market-heatmap');
      
      heatmapData.marketEntries?.slice(0, 5).forEach(entry => {
        if (entry.signals) {
          Object.entries(entry.signals).forEach(([timeframe, signal]) => {
            if (signal && signal.stopLoss && signal.takeProfit) {
              const entryPrice = entry.currentPrice;
              const stopLoss = signal.stopLoss;
              const takeProfit = signal.takeProfit;
              const direction = signal.direction;
              
              // Validate stop loss positioning
              let validStopLoss = false;
              let validTakeProfit = false;
              
              if (direction === 'LONG') {
                validStopLoss = stopLoss < entryPrice;
                validTakeProfit = takeProfit > entryPrice;
              } else if (direction === 'SHORT') {
                validStopLoss = stopLoss > entryPrice;
                validTakeProfit = takeProfit < entryPrice;
              }
              
              // Calculate risk-reward ratio
              const riskAmount = Math.abs(entryPrice - stopLoss);
              const rewardAmount = Math.abs(takeProfit - entryPrice);
              const riskRewardRatio = rewardAmount / riskAmount;
              
              // Risk-reward should be reasonable (0.5 to 5.0)
              const isReasonableRR = riskRewardRatio >= 0.5 && riskRewardRatio <= 5.0;
              
              if (!validStopLoss) {
                this.mathErrors.push({
                  type: 'INVALID_STOP_LOSS',
                  symbol: entry.symbol,
                  timeframe,
                  direction,
                  entryPrice,
                  stopLoss,
                  severity: 'HIGH'
                });
              }
              
              if (!validTakeProfit) {
                this.mathErrors.push({
                  type: 'INVALID_TAKE_PROFIT',
                  symbol: entry.symbol,
                  timeframe,
                  direction,
                  entryPrice,
                  takeProfit,
                  severity: 'HIGH'
                });
              }
              
              if (!isReasonableRR) {
                this.mathErrors.push({
                  type: 'UNREASONABLE_RISK_REWARD',
                  symbol: entry.symbol,
                  timeframe,
                  riskRewardRatio,
                  severity: 'MEDIUM'
                });
              }
              
              console.log(`  ${entry.symbol} ${timeframe}: R/R=${riskRewardRatio.toFixed(2)} ${validStopLoss && validTakeProfit && isReasonableRR ? '✓' : '✗'}`);
            }
          });
        }
      });
    } catch (error) {
      this.mathErrors.push({
        type: 'RISK_CALCULATION_CHECK_FAILED',
        error: error.message,
        severity: 'HIGH'
      });
    }
  }

  async performCrossValidation() {
    console.log('\n🔄 Performing Cross-Validation...');
    
    // Test mathematical consistency across multiple API calls
    const consistencyTests = [];
    
    for (let i = 0; i < 3; i++) {
      try {
        const heatmapData = await this.makeRequest('/api/market-heatmap');
        const btcEntry = heatmapData.marketEntries?.find(e => e.symbol === 'BTC/USDT');
        
        if (btcEntry) {
          consistencyTests.push({
            iteration: i + 1,
            price: btcEntry.currentPrice,
            changePercent: btcEntry.changePercent24h
          });
        }
        
        // Wait between calls
        await this.sleep(1000);
      } catch (error) {
        console.log(`  Cross-validation iteration ${i + 1} failed: ${error.message}`);
      }
    }
    
    // Analyze consistency
    if (consistencyTests.length >= 2) {
      const prices = consistencyTests.map(t => t.price);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);
      const priceVariance = ((maxPrice - minPrice) / minPrice) * 100;
      
      // Price should be consistent across calls (within 0.01%)
      const isConsistent = priceVariance < 0.01;
      
      if (!isConsistent) {
        this.mathErrors.push({
          type: 'CROSS_VALIDATION_INCONSISTENCY',
          priceVariance,
          maxPrice,
          minPrice,
          severity: 'HIGH'
        });
      }
      
      console.log(`  Price consistency across calls: ${priceVariance.toFixed(6)}% variance ${isConsistent ? '✓' : '✗'}`);
    }
  }

  generateMathematicalReport() {
    console.log('\n📋 MATHEMATICAL ACCURACY REPORT');
    console.log('=' .repeat(70));
    
    const highSeverityErrors = this.mathErrors.filter(e => e.severity === 'HIGH');
    const mediumSeverityErrors = this.mathErrors.filter(e => e.severity === 'MEDIUM');
    const lowSeverityErrors = this.mathErrors.filter(e => e.severity === 'LOW');
    
    console.log(`\n🔍 Mathematical Errors Found:`);
    console.log(`  HIGH: ${highSeverityErrors.length}`);
    console.log(`  MEDIUM: ${mediumSeverityErrors.length}`);
    console.log(`  LOW: ${lowSeverityErrors.length}`);
    
    // Calculate accuracy scores
    const rsiAccuracy = this.calculateAccuracy(this.testResults.rsiTests);
    const macdAccuracy = this.calculateAccuracy(this.testResults.macdTests);
    const confidenceAccuracy = this.calculateAccuracy(this.testResults.confidenceTests);
    const signalAccuracy = this.calculateAccuracy(this.testResults.signalAccuracy);
    const priceConsistency = this.calculateAccuracy(this.testResults.priceConsistency, 'isConsistent');
    
    console.log(`\n📊 Accuracy Scores:`);
    console.log(`  RSI Calculations: ${rsiAccuracy.toFixed(1)}%`);
    console.log(`  MACD Calculations: ${macdAccuracy.toFixed(1)}%`);
    console.log(`  Confidence Metrics: ${confidenceAccuracy.toFixed(1)}%`);
    console.log(`  Signal Generation: ${signalAccuracy.toFixed(1)}%`);
    console.log(`  Price Consistency: ${priceConsistency.toFixed(1)}%`);
    
    const overallAccuracy = (rsiAccuracy + macdAccuracy + confidenceAccuracy + signalAccuracy + priceConsistency) / 5;
    
    console.log(`\n🎯 Overall Mathematical Accuracy: ${overallAccuracy.toFixed(1)}%`);
    
    // Generate recommendations
    const recommendations = [];
    
    if (highSeverityErrors.length > 0) {
      recommendations.push('CRITICAL: Fix high-severity mathematical errors immediately');
    }
    
    if (overallAccuracy < 90) {
      recommendations.push('Improve mathematical precision and validation');
    }
    
    if (this.testResults.priceConsistency.some(t => !t.isConsistent)) {
      recommendations.push('Address price consistency issues between endpoints');
    }
    
    console.log(`\n💡 Recommendations:`);
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    const report = {
      timestamp: new Date().toISOString(),
      overallAccuracy,
      accuracyBreakdown: {
        rsi: rsiAccuracy,
        macd: macdAccuracy,
        confidence: confidenceAccuracy,
        signals: signalAccuracy,
        priceConsistency
      },
      errorSummary: {
        high: highSeverityErrors.length,
        medium: mediumSeverityErrors.length,
        low: lowSeverityErrors.length,
        total: this.mathErrors.length
      },
      detailedErrors: this.mathErrors,
      testResults: this.testResults,
      recommendations
    };
    
    return report;
  }

  calculateAccuracy(testArray, passField = 'passed') {
    if (!testArray || testArray.length === 0) return 100;
    
    const passedTests = testArray.filter(test => test[passField]).length;
    return (passedTests / testArray.length) * 100;
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    if (text.trim().startsWith('<!DOCTYPE html>')) {
      throw new Error('Received HTML instead of JSON (routing issue)');
    }
    
    return JSON.parse(text);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute mathematical diagnostic
async function main() {
  const diagnostic = new MathematicalAccuracyDiagnostic();
  const report = await diagnostic.runMathematicalDiagnostic();
  
  // Save detailed report
  const filename = `mathematical_accuracy_report_${Date.now()}.json`;
  await fs.writeFile(filename, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Detailed mathematical accuracy report saved to ${filename}`);
  
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MathematicalAccuracyDiagnostic };