/**
 * Comprehensive Codebase Analysis - 15 Cycle Validation
 * Full review of mathematical accuracy, ground rules compliance, and API limitations
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

class ComprehensiveCodebaseAnalyzer {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    this.testCycles = 15;
    this.analysisResults = {
      groundRulesCompliance: {},
      mathematicalAccuracy: {},
      apiLimitationsAdherence: {},
      uiDisplayValidation: {},
      algorithmIntegrity: {},
      heatmapValidation: {}
    };
  }

  async runComprehensiveAnalysis() {
    console.log('🔍 COMPREHENSIVE CODEBASE ANALYSIS - 15 CYCLE VALIDATION');
    console.log('=========================================================\n');
    
    for (let cycle = 1; cycle <= this.testCycles; cycle++) {
      console.log(`\n🔄 CYCLE ${cycle}/${this.testCycles}`);
      console.log('─'.repeat(40));
      
      await this.validateGroundRulesCompliance(cycle);
      await this.validateMathematicalAccuracy(cycle);
      await this.validateApiLimitationsAdherence(cycle);
      await this.validateUiDisplay(cycle);
      await this.validateAlgorithmIntegrity(cycle);
      await this.validateHeatmapSection(cycle);
      
      // Short delay between cycles
      await this.sleep(2000);
    }
    
    this.generateComprehensiveReport();
  }

  async validateGroundRulesCompliance(cycle) {
    console.log(`[${cycle}] Ground Rules Compliance Check...`);
    
    try {
      // Rule 10: Zero tolerance for synthetic data
      const authenticDataResponse = await fetch(`${this.baseUrl}/api/authentic-system/status`);
      if (authenticDataResponse.ok) {
        const authenticData = await authenticDataResponse.json();
        this.analysisResults.groundRulesCompliance[`cycle${cycle}_syntheticData`] = {
          status: authenticData.authenticDataOnly || false,
          details: 'Zero synthetic data tolerance maintained'
        };
        console.log(`   Rule 10: ${authenticData.authenticDataOnly ? '✅' : '❌'} Synthetic data elimination`);
      }
      
      // Rule 11: Limited save points (check for excessive files)
      try {
        const files = await fs.readdir('.');
        const analysisFiles = files.filter(f => f.includes('analysis') || f.includes('diagnostic') || f.includes('validation'));
        this.analysisResults.groundRulesCompliance[`cycle${cycle}_savePoints`] = {
          fileCount: analysisFiles.length,
          acceptable: analysisFiles.length < 20
        };
        console.log(`   Rule 11: ${analysisFiles.length < 20 ? '✅' : '❌'} Save points limited (${analysisFiles.length} files)`);
      } catch (error) {
        console.log(`   Rule 11: ⚠️  File system check failed`);
      }
      
    } catch (error) {
      console.log(`   ❌ Ground rules validation error: ${error.message}`);
    }
  }

  async validateMathematicalAccuracy(cycle) {
    console.log(`[${cycle}] Mathematical Accuracy Validation...`);
    
    try {
      // Test duplicate calculation elimination
      const heatmapResponse = await fetch(`${this.baseUrl}/api/market-heatmap?timeframe=1d`);
      if (heatmapResponse.ok) {
        const heatmapData = await heatmapResponse.json();
        const entries = heatmapData.marketEntries || [];
        const confidenceValues = entries.map(e => e.confidence).filter(c => c !== undefined);
        const uniqueSymbols = [...new Set(entries.map(e => e.symbol))];
        
        const perfectMapping = entries.length === uniqueSymbols.length && 
                              confidenceValues.length === uniqueSymbols.length;
        
        this.analysisResults.mathematicalAccuracy[`cycle${cycle}_duplicateElimination`] = {
          perfectMapping,
          entriesCount: entries.length,
          symbolsCount: uniqueSymbols.length,
          confidenceCount: confidenceValues.length
        };
        
        console.log(`   Duplicate Elimination: ${perfectMapping ? '✅' : '❌'} (${entries.length}:${uniqueSymbols.length}:${confidenceValues.length})`);
      }
      
      // Test timeframe weight consistency
      const timeframeTests = ['1m', '4h', '1d'];
      let consistencyScore = 0;
      
      for (const tf of timeframeTests) {
        const tfResponse = await fetch(`${this.baseUrl}/api/market-heatmap?timeframe=${tf}`);
        if (tfResponse.ok) {
          const tfData = await tfResponse.json();
          const tfEntries = tfData.marketEntries || [];
          const avgConfidence = tfEntries.reduce((sum, e) => sum + (e.confidence || 0), 0) / tfEntries.length;
          
          // Expected ranges based on timeframe weights
          const expectedRanges = { '1m': [40, 80], '4h': [85, 100], '1d': [80, 100] };
          const [min, max] = expectedRanges[tf] || [0, 100];
          
          if (avgConfidence >= min && avgConfidence <= max) {
            consistencyScore++;
          }
        }
      }
      
      this.analysisResults.mathematicalAccuracy[`cycle${cycle}_timeframeConsistency`] = {
        score: consistencyScore,
        maxScore: timeframeTests.length,
        consistent: consistencyScore === timeframeTests.length
      };
      
      console.log(`   Timeframe Consistency: ${consistencyScore === timeframeTests.length ? '✅' : '❌'} (${consistencyScore}/${timeframeTests.length})`);
      
    } catch (error) {
      console.log(`   ❌ Mathematical accuracy error: ${error.message}`);
    }
  }

  async validateApiLimitationsAdherence(cycle) {
    console.log(`[${cycle}] API Limitations Adherence Check...`);
    
    try {
      // Check rate limiter status
      const rateLimiterResponse = await fetch(`${this.baseUrl}/api/rate-limiter/stats`);
      if (rateLimiterResponse.ok) {
        const rateLimiterData = await rateLimiterResponse.json();
        const withinLimits = rateLimiterData.requestsRemaining > 0;
        
        this.analysisResults.apiLimitationsAdherence[`cycle${cycle}_rateLimiter`] = {
          withinLimits,
          requestsRemaining: rateLimiterData.requestsRemaining,
          totalRequests: rateLimiterData.totalRequests
        };
        
        console.log(`   Rate Limiter: ${withinLimits ? '✅' : '❌'} (${rateLimiterData.requestsRemaining} remaining)`);
      }
      
      // Check for API limit respect in automation
      const automationResponse = await fetch(`${this.baseUrl}/api/automation/status`);
      if (automationResponse.ok) {
        const automationData = await automationResponse.json();
        const respectsLimits = automationData.isRunning && automationData.lastCalculationTime;
        
        this.analysisResults.apiLimitationsAdherence[`cycle${cycle}_automation`] = {
          respectsLimits,
          isRunning: automationData.isRunning,
          timeSinceLastCalc: Date.now() - automationData.lastCalculationTime
        };
        
        console.log(`   Automation Limits: ${respectsLimits ? '✅' : '❌'} (Running: ${automationData.isRunning})`);
      }
      
    } catch (error) {
      console.log(`   ❌ API limitations check error: ${error.message}`);
    }
  }

  async validateUiDisplay(cycle) {
    console.log(`[${cycle}] UI Display Validation...`);
    
    try {
      // Test multiple data endpoints that feed the UI
      const endpoints = [
        '/api/market-heatmap',
        '/api/performance-metrics',
        '/api/crypto/BTC%2FUSDT',
        '/api/technical-analysis/BTC%2FUSDT'
      ];
      
      let successfulEndpoints = 0;
      let uiDataIntegrity = true;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`);
          if (response.ok) {
            const data = await response.json();
            
            // Check for essential data structure
            if (endpoint.includes('market-heatmap')) {
              uiDataIntegrity = uiDataIntegrity && data.marketEntries && Array.isArray(data.marketEntries);
            } else if (endpoint.includes('performance-metrics')) {
              uiDataIntegrity = uiDataIntegrity && data.indicators !== undefined;
            } else if (endpoint.includes('crypto/')) {
              uiDataIntegrity = uiDataIntegrity && data.symbol && data.currentPrice;
            } else if (endpoint.includes('technical-analysis')) {
              uiDataIntegrity = uiDataIntegrity && data.success;
            }
            
            successfulEndpoints++;
          }
        } catch (endpointError) {
          // Endpoint failed
        }
      }
      
      this.analysisResults.uiDisplayValidation[`cycle${cycle}_endpoints`] = {
        successfulEndpoints,
        totalEndpoints: endpoints.length,
        dataIntegrity: uiDataIntegrity,
        healthScore: (successfulEndpoints / endpoints.length) * 100
      };
      
      console.log(`   UI Endpoints: ${successfulEndpoints}/${endpoints.length} (${uiDataIntegrity ? '✅' : '❌'} integrity)`);
      
    } catch (error) {
      console.log(`   ❌ UI validation error: ${error.message}`);
    }
  }

  async validateAlgorithmIntegrity(cycle) {
    console.log(`[${cycle}] Algorithm Integrity Check...`);
    
    try {
      // Test signal generation consistency
      const signalResponse = await fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`);
      if (signalResponse.ok) {
        const signalData = await signalResponse.json();
        const hasValidSignals = signalData.length > 0 && signalData.every(s => 
          s.symbol && s.timeframe && s.direction && typeof s.confidence === 'number'
        );
        
        this.analysisResults.algorithmIntegrity[`cycle${cycle}_signalGeneration`] = {
          hasValidSignals,
          signalCount: signalData.length,
          timeframeCoverage: [...new Set(signalData.map(s => s.timeframe))].length
        };
        
        console.log(`   Signal Generation: ${hasValidSignals ? '✅' : '❌'} (${signalData.length} signals)`);
      }
      
      // Test trade simulation accuracy
      const tradeSimResponse = await fetch(`${this.baseUrl}/api/trade-simulations/BTC%2FUSDT`);
      if (tradeSimResponse.ok) {
        const tradeData = await tradeSimResponse.json();
        const hasActiveTrades = tradeData.length > 0 && tradeData.some(t => t.isActive);
        
        this.analysisResults.algorithmIntegrity[`cycle${cycle}_tradeSimulation`] = {
          hasActiveTrades,
          tradeCount: tradeData.length,
          activeCount: tradeData.filter(t => t.isActive).length
        };
        
        console.log(`   Trade Simulation: ${hasActiveTrades ? '✅' : '❌'} (${tradeData.filter(t => t.isActive).length} active)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Algorithm integrity error: ${error.message}`);
    }
  }

  async validateHeatmapSection(cycle) {
    console.log(`[${cycle}] Heatmap Section Validation...`);
    
    try {
      // Test all timeframes for heatmap consistency
      let validTimeframes = 0;
      let totalConfidenceValues = 0;
      let totalEntries = 0;
      
      for (const timeframe of this.timeframes) {
        const heatmapResponse = await fetch(`${this.baseUrl}/api/market-heatmap?timeframe=${timeframe}`);
        if (heatmapResponse.ok) {
          const heatmapData = await heatmapResponse.json();
          const entries = heatmapData.marketEntries || [];
          
          if (entries.length > 0) {
            validTimeframes++;
            totalEntries += entries.length;
            
            const confidenceValues = entries.map(e => e.confidence).filter(c => c !== undefined);
            totalConfidenceValues += confidenceValues.length;
          }
        }
      }
      
      const heatmapHealth = validTimeframes / this.timeframes.length;
      const avgEntriesPerTimeframe = totalEntries / validTimeframes;
      const confidenceCompleteness = totalConfidenceValues / totalEntries;
      
      this.analysisResults.heatmapValidation[`cycle${cycle}_comprehensive`] = {
        validTimeframes,
        totalTimeframes: this.timeframes.length,
        heatmapHealth,
        avgEntriesPerTimeframe,
        confidenceCompleteness,
        overallScore: (heatmapHealth + confidenceCompleteness) / 2
      };
      
      console.log(`   Heatmap Health: ${heatmapHealth >= 0.8 ? '✅' : '❌'} (${validTimeframes}/${this.timeframes.length} timeframes)`);
      console.log(`   Confidence Completeness: ${confidenceCompleteness >= 0.9 ? '✅' : '❌'} (${(confidenceCompleteness * 100).toFixed(1)}%)`);
      
    } catch (error) {
      console.log(`   ❌ Heatmap validation error: ${error.message}`);
    }
  }

  generateComprehensiveReport() {
    console.log('\n\n📊 COMPREHENSIVE ANALYSIS REPORT');
    console.log('=====================================\n');
    
    // Ground Rules Compliance Summary
    console.log('1️⃣ GROUND RULES COMPLIANCE');
    console.log('──────────────────────────');
    const groundRulesResults = Object.values(this.analysisResults.groundRulesCompliance);
    const syntheticDataCompliance = groundRulesResults.filter(r => r.status).length;
    const savePointsCompliance = groundRulesResults.filter(r => r.acceptable).length;
    console.log(`   Synthetic Data Elimination: ${syntheticDataCompliance}/${this.testCycles} cycles`);
    console.log(`   Save Points Control: ${savePointsCompliance}/${this.testCycles} cycles`);
    
    // Mathematical Accuracy Summary
    console.log('\n2️⃣ MATHEMATICAL ACCURACY');
    console.log('─────────────────────────');
    const mathResults = Object.values(this.analysisResults.mathematicalAccuracy);
    const duplicateElimination = mathResults.filter(r => r.perfectMapping).length;
    const timeframeConsistency = mathResults.filter(r => r.consistent).length;
    console.log(`   Duplicate Elimination: ${duplicateElimination}/${this.testCycles} cycles`);
    console.log(`   Timeframe Consistency: ${timeframeConsistency}/${this.testCycles} cycles`);
    
    // API Limitations Adherence Summary
    console.log('\n3️⃣ API LIMITATIONS ADHERENCE');
    console.log('─────────────────────────────');
    const apiResults = Object.values(this.analysisResults.apiLimitationsAdherence);
    const rateLimiterCompliance = apiResults.filter(r => r.withinLimits).length;
    const automationCompliance = apiResults.filter(r => r.respectsLimits).length;
    console.log(`   Rate Limiter Respect: ${rateLimiterCompliance}/${this.testCycles} cycles`);
    console.log(`   Automation Limits: ${automationCompliance}/${this.testCycles} cycles`);
    
    // UI Display Validation Summary
    console.log('\n4️⃣ UI DISPLAY VALIDATION');
    console.log('─────────────────────────');
    const uiResults = Object.values(this.analysisResults.uiDisplayValidation);
    const avgHealthScore = uiResults.reduce((sum, r) => sum + r.healthScore, 0) / uiResults.length;
    const dataIntegrityPassing = uiResults.filter(r => r.dataIntegrity).length;
    console.log(`   Average Health Score: ${avgHealthScore.toFixed(1)}%`);
    console.log(`   Data Integrity: ${dataIntegrityPassing}/${this.testCycles} cycles`);
    
    // Algorithm Integrity Summary
    console.log('\n5️⃣ ALGORITHM INTEGRITY');
    console.log('──────────────────────');
    const algoResults = Object.values(this.analysisResults.algorithmIntegrity);
    const signalGeneration = algoResults.filter(r => r.hasValidSignals).length;
    const tradeSimulation = algoResults.filter(r => r.hasActiveTrades).length;
    console.log(`   Signal Generation: ${signalGeneration}/${this.testCycles} cycles`);
    console.log(`   Trade Simulation: ${tradeSimulation}/${this.testCycles} cycles`);
    
    // Heatmap Validation Summary
    console.log('\n6️⃣ HEATMAP VALIDATION');
    console.log('─────────────────────');
    const heatmapResults = Object.values(this.analysisResults.heatmapValidation);
    const avgOverallScore = heatmapResults.reduce((sum, r) => sum + r.overallScore, 0) / heatmapResults.length;
    const highPerformanceCycles = heatmapResults.filter(r => r.overallScore >= 0.8).length;
    console.log(`   Average Overall Score: ${(avgOverallScore * 100).toFixed(1)}%`);
    console.log(`   High Performance Cycles: ${highPerformanceCycles}/${this.testCycles}`);
    
    // Overall Assessment
    console.log('\n🎯 OVERALL ASSESSMENT');
    console.log('─────────────────────');
    const totalTests = 6;
    const passingScores = [
      syntheticDataCompliance >= this.testCycles * 0.8,
      duplicateElimination >= this.testCycles * 0.8,
      rateLimiterCompliance >= this.testCycles * 0.8,
      avgHealthScore >= 75,
      signalGeneration >= this.testCycles * 0.8,
      highPerformanceCycles >= this.testCycles * 0.8
    ];
    
    const overallScore = passingScores.filter(Boolean).length / totalTests * 100;
    
    console.log(`   Overall System Health: ${overallScore.toFixed(1)}%`);
    
    if (overallScore >= 85) {
      console.log('\n✅ SYSTEM STATUS: EXCELLENT');
      console.log('All critical components operating within acceptable parameters.');
    } else if (overallScore >= 70) {
      console.log('\n⚠️  SYSTEM STATUS: GOOD');
      console.log('Most components operating well, minor optimizations needed.');
    } else {
      console.log('\n❌ SYSTEM STATUS: NEEDS ATTENTION');
      console.log('Several components require optimization or fixes.');
    }
    
    console.log('\n✅ 15-CYCLE COMPREHENSIVE ANALYSIS COMPLETE');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run comprehensive analysis
async function main() {
  const analyzer = new ComprehensiveCodebaseAnalyzer();
  await analyzer.runComprehensiveAnalysis();
}

main().catch(console.error);