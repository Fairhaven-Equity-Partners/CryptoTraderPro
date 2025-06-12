/**
 * Signal Algorithm Diagnostic - External Shell Analysis
 * Comprehensive analysis of signal generation bias and mathematical logic
 * Adherence to 11 ground rules: authentic data only, no synthetic fallbacks
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';

class SignalAlgorithmDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.analysisResults = {
      signalDistribution: {},
      algorithmBias: {},
      mathematicalIssues: [],
      recommendations: []
    };
  }

  async runComprehensiveDiagnostic() {
    console.log('\n🔍 SIGNAL ALGORITHM DIAGNOSTIC - EXTERNAL SHELL ANALYSIS');
    console.log('======================================================================');
    
    await this.analyzeSignalDistribution();
    await this.analyzeAlgorithmLogic();
    await this.testRandomnessAndBias();
    await this.analyzeCalculationMethods();
    await this.validateGroundRulesCompliance();
    
    this.generateFinalReport();
  }

  async analyzeSignalDistribution() {
    console.log('\n📊 PHASE 1: Signal Distribution Analysis');
    console.log('------------------------------------------------------------');
    
    try {
      // Analyze heatmap signals across all pairs
      const heatmapResponse = await this.makeRequest('/api/market-heatmap?timeframe=4h');
      if (heatmapResponse.marketEntries) {
        const signals = heatmapResponse.marketEntries;
        const distribution = { LONG: 0, SHORT: 0, NEUTRAL: 0 };
        
        signals.forEach(entry => {
          const direction = entry.signals?.['4h']?.direction;
          if (direction) distribution[direction]++;
        });
        
        console.log(`  Total Signals Analyzed: ${signals.length}`);
        console.log(`  LONG Signals: ${distribution.LONG} (${(distribution.LONG/signals.length*100).toFixed(1)}%)`);
        console.log(`  SHORT Signals: ${distribution.SHORT} (${(distribution.SHORT/signals.length*100).toFixed(1)}%)`);
        console.log(`  NEUTRAL Signals: ${distribution.NEUTRAL} (${(distribution.NEUTRAL/signals.length*100).toFixed(1)}%)`);
        
        this.analysisResults.signalDistribution['4h'] = distribution;
        
        // Check for extreme bias (>80% in one direction)
        const longPercentage = distribution.LONG / signals.length;
        const shortPercentage = distribution.SHORT / signals.length;
        
        if (longPercentage > 0.8) {
          console.log(`  🚨 CRITICAL BIAS DETECTED: ${(longPercentage*100).toFixed(1)}% LONG bias`);
          this.analysisResults.algorithmBias.extremeLongBias = true;
        } else if (shortPercentage > 0.8) {
          console.log(`  🚨 CRITICAL BIAS DETECTED: ${(shortPercentage*100).toFixed(1)}% SHORT bias`);
          this.analysisResults.algorithmBias.extremeShortBias = true;
        }
      }
      
      // Test multiple timeframes for bias patterns
      const timeframes = ['1h', '1d', '1w'];
      for (const timeframe of timeframes) {
        const response = await this.makeRequest(`/api/market-heatmap?timeframe=${timeframe}`);
        if (response.marketEntries) {
          const distribution = { LONG: 0, SHORT: 0, NEUTRAL: 0 };
          response.marketEntries.forEach(entry => {
            const direction = entry.signals?.[timeframe]?.direction;
            if (direction) distribution[direction]++;
          });
          
          console.log(`  ${timeframe}: LONG ${distribution.LONG}, SHORT ${distribution.SHORT}, NEUTRAL ${distribution.NEUTRAL}`);
          this.analysisResults.signalDistribution[timeframe] = distribution;
        }
      }
      
    } catch (error) {
      console.log(`  Error analyzing signal distribution: ${error.message}`);
    }
  }

  async analyzeAlgorithmLogic() {
    console.log('\n🔍 PHASE 2: Algorithm Logic Analysis');
    console.log('------------------------------------------------------------');
    
    try {
      // Analyze the main signal generation files
      const filesToAnalyze = [
        'server/automatedSignalCalculator.ts',
        'client/src/lib/advancedSignalsNew.ts',
        'server/routes.ts'
      ];
      
      for (const file of filesToAnalyze) {
        try {
          const content = await fs.readFile(file, 'utf8');
          console.log(`\n  Analyzing ${file}:`);
          
          // Look for signal direction logic
          const directionLogicMatches = content.match(/direction\s*=\s*['"](LONG|SHORT|NEUTRAL)['"]|if.*LONG|if.*SHORT/gi) || [];
          console.log(`    Direction assignments found: ${directionLogicMatches.length}`);
          
          // Look for threshold logic
          const thresholdMatches = content.match(/signalScore\s*[<>]\s*\d+|confidence\s*[<>]\s*\d+/gi) || [];
          console.log(`    Threshold comparisons: ${thresholdMatches.length}`);
          
          // Check for hardcoded biases
          const hardcodedLong = content.match(/direction\s*=\s*['"]LONG['"]/gi) || [];
          const hardcodedShort = content.match(/direction\s*=\s*['"]SHORT['"]/gi) || [];
          
          if (hardcodedLong.length > hardcodedShort.length * 2) {
            console.log(`    🚨 POTENTIAL LONG BIAS: ${hardcodedLong.length} hardcoded LONG vs ${hardcodedShort.length} SHORT`);
            this.analysisResults.algorithmBias.hardcodedLongBias = true;
          }
          
          // Look for mathematical issues in thresholds
          thresholdMatches.forEach(match => {
            console.log(`    Threshold: ${match}`);
          });
          
        } catch (fileError) {
          console.log(`    Could not analyze ${file}: ${fileError.message}`);
        }
      }
    } catch (error) {
      console.log(`  Error in algorithm logic analysis: ${error.message}`);
    }
  }

  async testRandomnessAndBias() {
    console.log('\n🎲 PHASE 3: Randomness and Bias Testing');
    console.log('------------------------------------------------------------');
    
    try {
      // Test signal generation for the same symbol multiple times
      const testSymbol = 'BTC/USDT';
      const signals = [];
      
      console.log(`  Testing signal consistency for ${testSymbol}:`);
      
      for (let i = 0; i < 5; i++) {
        const response = await this.makeRequest(`/api/signals/${encodeURIComponent(testSymbol)}`);
        if (response.signals && response.signals.length > 0) {
          const signal = response.signals[0];
          signals.push({
            direction: signal.direction,
            confidence: signal.confidence,
            timeframe: signal.timeframe
          });
          console.log(`    Test ${i+1}: ${signal.direction} (${signal.confidence}% confidence)`);
        }
        
        // Small delay to avoid rate limiting
        await this.sleep(100);
      }
      
      // Analyze consistency
      const directions = signals.map(s => s.direction);
      const uniqueDirections = [...new Set(directions)];
      
      if (uniqueDirections.length === 1) {
        console.log(`  🚨 ZERO RANDOMNESS: All ${signals.length} tests returned ${uniqueDirections[0]}`);
        this.analysisResults.algorithmBias.zeroRandomness = true;
      } else {
        console.log(`  ✓ Some variability detected: ${uniqueDirections.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`  Error in randomness testing: ${error.message}`);
    }
  }

  async analyzeCalculationMethods() {
    console.log('\n🧮 PHASE 4: Calculation Method Analysis');
    console.log('------------------------------------------------------------');
    
    try {
      // Look for specific calculation patterns in the codebase
      const calculationFile = 'client/src/lib/advancedSignalsNew.ts';
      const content = await fs.readFile(calculationFile, 'utf8');
      
      // Extract signal score calculation logic
      const signalScoreMatches = content.match(/signalScore\s*=.*?;/g) || [];
      console.log(`  Signal score calculations found: ${signalScoreMatches.length}`);
      
      signalScoreMatches.forEach((match, index) => {
        console.log(`    Calc ${index + 1}: ${match.trim()}`);
      });
      
      // Look for threshold ranges
      const thresholdRanges = content.match(/signalScore\s*[<>]\s*\d+.*?direction\s*=\s*['"][^'"]+['"]/gs) || [];
      console.log(`\n  Direction assignment logic:`);
      
      thresholdRanges.forEach((range, index) => {
        console.log(`    Range ${index + 1}: ${range.replace(/\s+/g, ' ').trim()}`);
      });
      
      // Check for mathematical errors in thresholds
      const numbers = content.match(/signalScore\s*[<>]\s*(\d+)/g) || [];
      const thresholdValues = numbers.map(n => parseInt(n.match(/\d+/)[0]));
      
      console.log(`\n  Threshold values detected: ${thresholdValues.join(', ')}`);
      
      // Analyze threshold distribution
      if (thresholdValues.length >= 2) {
        const sorted = thresholdValues.sort((a, b) => a - b);
        const ranges = [];
        
        ranges.push(`0-${sorted[0]}: Direction A`);
        for (let i = 1; i < sorted.length; i++) {
          ranges.push(`${sorted[i-1]}-${sorted[i]}: Direction B`);
        }
        ranges.push(`${sorted[sorted.length-1]}+: Direction C`);
        
        console.log(`  Implied ranges:`);
        ranges.forEach(range => console.log(`    ${range}`));
        
        // Check for unbalanced ranges
        const range1 = sorted[0];
        const range2 = sorted[1] - sorted[0];
        const range3 = 100 - sorted[1];
        
        console.log(`\n  Range sizes: ${range1}, ${range2}, ${range3}`);
        
        if (Math.max(range1, range2, range3) > Math.min(range1, range2, range3) * 3) {
          console.log(`  🚨 UNBALANCED RANGES: Potential bias in threshold distribution`);
          this.analysisResults.mathematicalIssues.push('Unbalanced threshold ranges');
        }
      }
      
    } catch (error) {
      console.log(`  Error in calculation analysis: ${error.message}`);
    }
  }

  async validateGroundRulesCompliance() {
    console.log('\n📋 PHASE 5: Ground Rules Compliance Check');
    console.log('------------------------------------------------------------');
    
    try {
      // Check for synthetic data usage in signal generation
      const files = [
        'server/automatedSignalCalculator.ts',
        'client/src/lib/advancedSignalsNew.ts'
      ];
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Look for synthetic data patterns
        const syntheticPatterns = [
          /Math\.random/gi,
          /dummy|placeholder|mock|fake|synthetic/gi,
          /default.*price|fallback.*data/gi
        ];
        
        console.log(`\n  Checking ${file} for synthetic data:`);
        
        syntheticPatterns.forEach((pattern, index) => {
          const matches = content.match(pattern) || [];
          if (matches.length > 0) {
            console.log(`    🚨 Pattern ${index + 1}: ${matches.length} occurrences of ${pattern.source}`);
            this.analysisResults.mathematicalIssues.push(`Synthetic data pattern in ${file}`);
          } else {
            console.log(`    ✓ Pattern ${index + 1}: Clean`);
          }
        });
      }
      
    } catch (error) {
      console.log(`  Error in ground rules compliance: ${error.message}`);
    }
  }

  generateFinalReport() {
    console.log('\n📋 FINAL DIAGNOSTIC REPORT');
    console.log('======================================================================');
    
    console.log('\n📊 SIGNAL DISTRIBUTION SUMMARY:');
    Object.entries(this.analysisResults.signalDistribution).forEach(([timeframe, dist]) => {
      const total = dist.LONG + dist.SHORT + dist.NEUTRAL;
      if (total > 0) {
        console.log(`  ${timeframe}: LONG ${(dist.LONG/total*100).toFixed(1)}%, SHORT ${(dist.SHORT/total*100).toFixed(1)}%, NEUTRAL ${(dist.NEUTRAL/total*100).toFixed(1)}%`);
      }
    });
    
    console.log('\n🚨 IDENTIFIED ISSUES:');
    if (this.analysisResults.algorithmBias.extremeLongBias) {
      console.log('  - Extreme LONG bias detected (>80%)');
    }
    if (this.analysisResults.algorithmBias.hardcodedLongBias) {
      console.log('  - Hardcoded LONG bias in algorithm logic');
    }
    if (this.analysisResults.algorithmBias.zeroRandomness) {
      console.log('  - Zero randomness in signal generation');
    }
    if (this.analysisResults.mathematicalIssues.length > 0) {
      this.analysisResults.mathematicalIssues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.analysisResults.algorithmBias.extremeLongBias || this.analysisResults.algorithmBias.hardcodedLongBias) {
      console.log('  1. Review threshold ranges in signal generation logic');
      console.log('  2. Ensure balanced probability distribution across LONG/SHORT/NEUTRAL');
      console.log('  3. Validate that market conditions properly influence direction');
    }
    
    if (this.analysisResults.algorithmBias.zeroRandomness) {
      console.log('  4. Introduce proper market-based variability in signal calculations');
      console.log('  5. Ensure signals reflect real market dynamics, not static logic');
    }
    
    if (this.analysisResults.mathematicalIssues.length > 0) {
      console.log('  6. Remove any synthetic data generation patterns');
      console.log('  7. Ensure all calculations use authentic market data');
    }
    
    console.log('\n✅ DIAGNOSTIC COMPLETE');
    
    // Export results
    const timestamp = Date.now();
    const reportData = {
      timestamp,
      analysisResults: this.analysisResults,
      summary: {
        extremeBias: this.analysisResults.algorithmBias.extremeLongBias || this.analysisResults.algorithmBias.extremeShortBias,
        issuesFound: this.analysisResults.mathematicalIssues.length,
        complianceStatus: this.analysisResults.mathematicalIssues.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT'
      }
    };
    
    fs.writeFile(`signal_algorithm_diagnostic_${timestamp}.json`, JSON.stringify(reportData, null, 2))
      .then(() => console.log(`\n📄 Detailed report saved to signal_algorithm_diagnostic_${timestamp}.json`))
      .catch(err => console.log(`Failed to save report: ${err.message}`));
  }

  async makeRequest(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.log(`Request failed for ${endpoint}: ${error.message}`);
      return {};
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const diagnostic = new SignalAlgorithmDiagnostic();
  await diagnostic.runComprehensiveDiagnostic();
}

main().catch(console.error);