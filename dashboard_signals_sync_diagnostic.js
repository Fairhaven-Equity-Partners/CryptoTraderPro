/**
 * Dashboard-Signals Synchronization Diagnostic - External Shell Analysis
 * Identifies and fixes data flow inconsistencies between market analysis dashboard and signals
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';

class DashboardSignalsSyncDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.solutions = [];
    this.testResults = [];
  }

  async runComprehensiveDiagnostic() {
    console.log('\n🔍 DASHBOARD-SIGNALS SYNC DIAGNOSTIC - External Shell Analysis');
    console.log('=' .repeat(80));
    
    // Test all data endpoints
    await this.testDataEndpoints();
    
    // Analyze data flow consistency
    await this.analyzeDataFlowConsistency();
    
    // Test signal generation vs dashboard display
    await this.testSignalDashboardAlignment();
    
    // Identify root causes
    await this.identifyRootCauses();
    
    // Implement fixes
    await this.implementSynchronizationFixes();
    
    // Generate report
    this.generateDiagnosticReport();
  }

  async testDataEndpoints() {
    console.log('\n📡 Testing Data Endpoints...');
    
    const endpoints = [
      '/api/market-heatmap',
      '/api/simple-market-data',
      '/api/crypto/BTC/USDT',
      '/api/signals/BTC/USDT',
      '/api/technical-analysis/BTC/USDT',
      '/api/market-analysis/BTC/USDT'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        const testResult = {
          endpoint,
          status: 'SUCCESS',
          dataStructure: this.analyzeDataStructure(response),
          timestamp: new Date().toISOString()
        };
        this.testResults.push(testResult);
        console.log(`✅ ${endpoint}: ${testResult.dataStructure.recordCount} records`);
      } catch (error) {
        const testResult = {
          endpoint,
          status: 'ERROR',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        this.testResults.push(testResult);
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  async analyzeDataFlowConsistency() {
    console.log('\n🔄 Analyzing Data Flow Consistency...');
    
    try {
      // Get heatmap data
      const heatmapData = await this.makeRequest('/api/market-heatmap');
      
      // Get simple market data
      const marketData = await this.makeRequest('/api/simple-market-data');
      
      // Get signals for BTC/USDT
      const signalsData = await this.makeRequest('/api/signals/BTC/USDT');
      
      // Compare data consistency
      this.compareDataSources(heatmapData, marketData, signalsData);
      
    } catch (error) {
      this.issues.push({
        type: 'DATA_FLOW_ERROR',
        description: 'Failed to analyze data flow consistency',
        error: error.message,
        severity: 'HIGH'
      });
    }
  }

  compareDataSources(heatmapData, marketData, signalsData) {
    console.log('\n📊 Comparing Data Sources...');
    
    // Find BTC/USDT in different data sources
    const heatmapBTC = heatmapData.marketEntries?.find(entry => 
      entry.symbol === 'BTC/USDT' || entry.id === 'btcusdt'
    );
    
    const marketBTC = marketData.data?.find(entry => 
      entry.symbol === 'BTC/USDT'
    );
    
    console.log('🔍 Heatmap BTC data:', JSON.stringify(heatmapBTC, null, 2));
    console.log('🔍 Market BTC data:', JSON.stringify(marketBTC, null, 2));
    console.log('🔍 Signals BTC data:', JSON.stringify(signalsData, null, 2));
    
    // Check price consistency
    if (heatmapBTC && marketBTC) {
      const priceDiff = Math.abs(heatmapBTC.price - marketBTC.price);
      const priceDiffPercent = (priceDiff / marketBTC.price) * 100;
      
      if (priceDiffPercent > 0.1) {
        this.issues.push({
          type: 'PRICE_MISMATCH',
          description: `Price mismatch between heatmap ($${heatmapBTC.price}) and market data ($${marketBTC.price})`,
          severity: 'HIGH',
          heatmapPrice: heatmapBTC.price,
          marketPrice: marketBTC.price,
          difference: priceDiffPercent.toFixed(2) + '%'
        });
      }
    }
    
    // Check signal consistency
    if (heatmapBTC && signalsData) {
      const signalDirection = signalsData.signals?.['4h']?.direction || signalsData.direction;
      const heatmapDirection = heatmapBTC.direction || heatmapBTC.signal;
      
      if (signalDirection && heatmapDirection && signalDirection !== heatmapDirection) {
        this.issues.push({
          type: 'SIGNAL_MISMATCH',
          description: `Signal direction mismatch: signals=${signalDirection}, heatmap=${heatmapDirection}`,
          severity: 'HIGH',
          signalsDirection: signalDirection,
          heatmapDirection: heatmapDirection
        });
      }
    }
  }

  async testSignalDashboardAlignment() {
    console.log('\n🎯 Testing Signal-Dashboard Alignment...');
    
    const symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT'];
    
    for (const symbol of symbols) {
      try {
        // Get signals
        const signals = await this.makeRequest(`/api/signals/${symbol}`);
        
        // Get market analysis
        const analysis = await this.makeRequest(`/api/market-analysis/${symbol}`);
        
        // Compare consistency
        this.validateSignalAnalysisAlignment(symbol, signals, analysis);
        
      } catch (error) {
        console.log(`❌ Failed to test ${symbol}: ${error.message}`);
      }
    }
  }

  validateSignalAnalysisAlignment(symbol, signals, analysis) {
    // Check if signals match analysis recommendations
    const signalDirection = signals.signals?.['4h']?.direction || signals.direction;
    const analysisRecommendation = analysis.recommendation?.action || analysis.action;
    
    if (signalDirection && analysisRecommendation) {
      const isAligned = this.checkDirectionAlignment(signalDirection, analysisRecommendation);
      
      if (!isAligned) {
        this.issues.push({
          type: 'ALIGNMENT_MISMATCH',
          symbol,
          description: `Signal direction (${signalDirection}) does not align with analysis recommendation (${analysisRecommendation})`,
          severity: 'HIGH',
          signalDirection,
          analysisRecommendation
        });
      } else {
        console.log(`✅ ${symbol}: Signals and analysis aligned`);
      }
    }
  }

  checkDirectionAlignment(signalDirection, analysisRecommendation) {
    const signalMap = {
      'LONG': ['BUY', 'BULLISH', 'LONG'],
      'SHORT': ['SELL', 'BEARISH', 'SHORT'],
      'NEUTRAL': ['HOLD', 'NEUTRAL', 'WAIT']
    };
    
    return signalMap[signalDirection]?.includes(analysisRecommendation.toUpperCase());
  }

  async identifyRootCauses() {
    console.log('\n🔍 Identifying Root Causes...');
    
    // Analyze code for synchronization issues
    try {
      const routesContent = readFileSync('./server/routes.ts', 'utf8');
      const heatmapContent = readFileSync('./client/src/lib/optimizedHeatMap.ts', 'utf8');
      
      // Check for data source inconsistencies
      this.analyzeCodeForSyncIssues(routesContent, heatmapContent);
      
    } catch (error) {
      console.log('⚠️ Could not analyze code files:', error.message);
    }
    
    // Categorize issues by root cause
    this.categorizeIssues();
  }

  analyzeCodeForSyncIssues(routesContent, heatmapContent) {
    // Check for different data sources
    if (routesContent.includes('optimizedCoinMarketCapService') && 
        heatmapContent.includes('centralizedPriceManager')) {
      this.issues.push({
        type: 'DATA_SOURCE_INCONSISTENCY',
        description: 'Different services used for price data: optimizedCoinMarketCapService vs centralizedPriceManager',
        severity: 'HIGH',
        solution: 'Standardize on single price data source'
      });
    }
    
    // Check for timing mismatches
    if (routesContent.includes('4h') && heatmapContent.includes('1m')) {
      this.issues.push({
        type: 'TIMEFRAME_MISMATCH',
        description: 'Different timeframes used in dashboard vs signals',
        severity: 'MEDIUM',
        solution: 'Synchronize timeframe selection'
      });
    }
  }

  categorizeIssues() {
    const categories = {
      'DATA_SOURCE': this.issues.filter(i => i.type.includes('SOURCE') || i.type.includes('PRICE')),
      'TIMING': this.issues.filter(i => i.type.includes('TIMING') || i.type.includes('TIMEFRAME')),
      'SIGNAL_LOGIC': this.issues.filter(i => i.type.includes('SIGNAL') || i.type.includes('ALIGNMENT')),
      'API_CONSISTENCY': this.issues.filter(i => i.type.includes('API') || i.type.includes('ENDPOINT'))
    };
    
    console.log('\n📋 Issue Categories:');
    Object.entries(categories).forEach(([category, issues]) => {
      if (issues.length > 0) {
        console.log(`${category}: ${issues.length} issues`);
        issues.forEach(issue => console.log(`  - ${issue.description}`));
      }
    });
  }

  async implementSynchronizationFixes() {
    console.log('\n🔧 Implementing Synchronization Fixes...');
    
    // Generate solutions for each issue type
    this.issues.forEach(issue => {
      const solution = this.generateSolution(issue);
      this.solutions.push(solution);
    });
    
    // Apply critical fixes
    await this.applyCriticalFixes();
  }

  generateSolution(issue) {
    switch (issue.type) {
      case 'PRICE_MISMATCH':
        return {
          issue: issue.type,
          solution: 'Implement centralized price manager for all components',
          implementation: 'Use single price source with real-time updates',
          priority: 'HIGH'
        };
        
      case 'SIGNAL_MISMATCH':
        return {
          issue: issue.type,
          solution: 'Synchronize signal generation timeframes',
          implementation: 'Use consistent timeframe (4h) across all components',
          priority: 'HIGH'
        };
        
      case 'DATA_SOURCE_INCONSISTENCY':
        return {
          issue: issue.type,
          solution: 'Standardize on optimizedCoinMarketCapService',
          implementation: 'Update all components to use same data service',
          priority: 'CRITICAL'
        };
        
      default:
        return {
          issue: issue.type,
          solution: 'Investigate and implement data consistency checks',
          implementation: 'Add validation layer for data synchronization',
          priority: 'MEDIUM'
        };
    }
  }

  async applyCriticalFixes() {
    console.log('\n⚡ Applying Critical Fixes...');
    
    try {
      // Test data synchronization endpoint
      const syncTest = await this.makeRequest('/api/system/health-status');
      console.log('✅ System health check passed');
      
      // Test comprehensive fix
      const fixResponse = await fetch(`${this.baseUrl}/api/system/comprehensive-fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (fixResponse.ok) {
        const fixResult = await fixResponse.json();
        console.log('✅ Comprehensive system fix applied');
        console.log(`System health: ${fixResult.healthPercentage}`);
      }
      
    } catch (error) {
      console.log('⚠️ Could not apply automatic fixes:', error.message);
    }
  }

  analyzeDataStructure(data) {
    if (!data) return { type: 'EMPTY', recordCount: 0 };
    
    if (Array.isArray(data)) {
      return { type: 'ARRAY', recordCount: data.length };
    }
    
    if (data.marketEntries) {
      return { type: 'HEATMAP', recordCount: data.marketEntries.length };
    }
    
    if (data.data) {
      return { type: 'MARKET_DATA', recordCount: data.data.length };
    }
    
    if (data.signals) {
      return { type: 'SIGNALS', recordCount: Object.keys(data.signals).length };
    }
    
    return { type: 'OBJECT', recordCount: Object.keys(data).length };
  }

  generateDiagnosticReport() {
    console.log('\n📋 DIAGNOSTIC REPORT');
    console.log('=' .repeat(80));
    
    console.log(`\n🔍 Issues Found: ${this.issues.length}`);
    this.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}: ${issue.description}`);
      console.log(`   Severity: ${issue.severity}`);
    });
    
    console.log(`\n🔧 Solutions Generated: ${this.solutions.length}`);
    this.solutions.forEach((solution, index) => {
      console.log(`${index + 1}. ${solution.issue}: ${solution.solution}`);
      console.log(`   Priority: ${solution.priority}`);
    });
    
    console.log(`\n📊 Endpoints Tested: ${this.testResults.length}`);
    const successCount = this.testResults.filter(r => r.status === 'SUCCESS').length;
    console.log(`Success Rate: ${((successCount / this.testResults.length) * 100).toFixed(1)}%`);
    
    // Recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Implement centralized data manager for price consistency');
    console.log('2. Standardize timeframe selection across components');
    console.log('3. Add real-time data validation between dashboard and signals');
    console.log('4. Implement WebSocket updates for instant synchronization');
    
    const overallHealth = this.calculateOverallHealth();
    console.log(`\n🏥 Overall System Health: ${overallHealth}%`);
    
    return {
      issues: this.issues,
      solutions: this.solutions,
      testResults: this.testResults,
      overallHealth,
      timestamp: new Date().toISOString()
    };
  }

  calculateOverallHealth() {
    const criticalIssues = this.issues.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL').length;
    const totalIssues = this.issues.length;
    
    if (totalIssues === 0) return 100;
    
    const healthScore = Math.max(0, 100 - (criticalIssues * 20) - (totalIssues * 5));
    return Math.round(healthScore);
  }

  async makeRequest(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute diagnostic
async function main() {
  const diagnostic = new DashboardSignalsSyncDiagnostic();
  await diagnostic.runComprehensiveDiagnostic();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DashboardSignalsSyncDiagnostic };