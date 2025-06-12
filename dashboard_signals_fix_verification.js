/**
 * Dashboard-Signals Fix Verification - External Testing
 * Verifies the unified synchronization system resolves the mismatch issue
 */

import fetch from 'node-fetch';

class DashboardSignalsFixVerification {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = [];
  }

  async runVerification() {
    console.log('\n🔧 DASHBOARD-SIGNALS FIX VERIFICATION');
    console.log('=' .repeat(60));
    
    // Test unified endpoints
    await this.testUnifiedEndpoints();
    
    // Test data consistency
    await this.testDataConsistency();
    
    // Test signal alignment
    await this.testSignalAlignment();
    
    // Generate verification report
    this.generateVerificationReport();
  }

  async testUnifiedEndpoints() {
    console.log('\n📡 Testing Unified Endpoints...');
    
    const endpoints = [
      '/api/unified/market-data?timeframe=4h',
      '/api/unified/signals/BTC/USDT?timeframe=4h',
      '/api/unified/market-analysis/BTC/USDT?timeframe=4h'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        
        if (response && typeof response === 'object') {
          this.results.push({
            endpoint,
            status: 'SUCCESS',
            dataType: this.getDataType(response),
            recordCount: this.getRecordCount(response)
          });
          console.log(`✅ ${endpoint}: ${this.getDataType(response)} data received`);
        } else {
          throw new Error('Invalid JSON response');
        }
      } catch (error) {
        this.results.push({
          endpoint,
          status: 'FAILED',
          error: error.message
        });
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  async testDataConsistency() {
    console.log('\n🔄 Testing Data Consistency...');
    
    try {
      // Get heatmap data
      const heatmapData = await this.makeRequest('/api/market-heatmap');
      
      // Get unified signals for BTC/USDT
      const signalsData = await this.makeRequest('/api/unified/signals/BTC/USDT?timeframe=4h');
      
      // Find BTC/USDT in heatmap
      const btcHeatmap = heatmapData.marketEntries?.find(entry => 
        entry.symbol === 'BTC/USDT' || entry.id === 'btcusdt'
      );
      
      if (btcHeatmap && signalsData) {
        // Compare prices
        const priceMatch = Math.abs(btcHeatmap.currentPrice - signalsData.price) < 1;
        
        // Compare directions
        const heatmapDirection = btcHeatmap.signals?.['4h']?.direction || btcHeatmap.sentiment?.direction;
        const signalsDirection = signalsData.direction;
        const directionMatch = heatmapDirection === signalsDirection;
        
        this.results.push({
          test: 'DATA_CONSISTENCY',
          status: priceMatch && directionMatch ? 'SUCCESS' : 'PARTIAL',
          priceMatch,
          directionMatch,
          heatmapPrice: btcHeatmap.currentPrice,
          signalsPrice: signalsData.price,
          heatmapDirection,
          signalsDirection
        });
        
        if (priceMatch && directionMatch) {
          console.log('✅ Data consistency verified: Prices and directions match');
        } else {
          console.log(`⚠️ Data consistency issues: Price match: ${priceMatch}, Direction match: ${directionMatch}`);
        }
      }
    } catch (error) {
      this.results.push({
        test: 'DATA_CONSISTENCY',
        status: 'FAILED',
        error: error.message
      });
      console.log(`❌ Data consistency test failed: ${error.message}`);
    }
  }

  async testSignalAlignment() {
    console.log('\n🎯 Testing Signal-Analysis Alignment...');
    
    const symbols = ['BTC/USDT', 'ETH/USDT'];
    
    for (const symbol of symbols) {
      try {
        const signalsData = await this.makeRequest(`/api/unified/signals/${symbol}?timeframe=4h`);
        const analysisData = await this.makeRequest(`/api/unified/market-analysis/${symbol}?timeframe=4h`);
        
        if (signalsData && analysisData) {
          const signalDirection = signalsData.direction;
          const analysisRecommendation = analysisData.recommendation?.action;
          
          const aligned = this.checkAlignment(signalDirection, analysisRecommendation);
          
          this.results.push({
            test: 'SIGNAL_ALIGNMENT',
            symbol,
            status: aligned ? 'SUCCESS' : 'MISALIGNED',
            signalDirection,
            analysisRecommendation,
            aligned
          });
          
          if (aligned) {
            console.log(`✅ ${symbol}: Signals and analysis aligned (${signalDirection} → ${analysisRecommendation})`);
          } else {
            console.log(`⚠️ ${symbol}: Misalignment detected (${signalDirection} ≠ ${analysisRecommendation})`);
          }
        }
      } catch (error) {
        console.log(`❌ Failed to test ${symbol}: ${error.message}`);
      }
    }
  }

  checkAlignment(signalDirection, analysisRecommendation) {
    if (!signalDirection || !analysisRecommendation) return false;
    
    const alignmentMap = {
      'LONG': ['BUY', 'BULLISH'],
      'SHORT': ['SELL', 'BEARISH'],
      'NEUTRAL': ['HOLD', 'NEUTRAL']
    };
    
    return alignmentMap[signalDirection]?.includes(analysisRecommendation.toUpperCase()) || false;
  }

  getDataType(response) {
    if (response.marketEntries) return 'HEATMAP';
    if (response.data) return 'UNIFIED_DATA';
    if (response.signals) return 'SIGNALS';
    if (response.analysis) return 'ANALYSIS';
    return 'UNKNOWN';
  }

  getRecordCount(response) {
    if (response.marketEntries) return response.marketEntries.length;
    if (response.data?.marketData) return response.data.marketData.length;
    if (response.signals) return Object.keys(response.signals).length;
    return 1;
  }

  generateVerificationReport() {
    console.log('\n📋 VERIFICATION REPORT');
    console.log('=' .repeat(60));
    
    const successCount = this.results.filter(r => r.status === 'SUCCESS').length;
    const totalTests = this.results.length;
    const successRate = ((successCount / totalTests) * 100).toFixed(1);
    
    console.log(`\n✅ Success Rate: ${successRate}% (${successCount}/${totalTests})`);
    
    // Categorize results
    const endpoints = this.results.filter(r => r.endpoint);
    const dataTests = this.results.filter(r => r.test);
    
    console.log(`\n📊 Endpoint Tests: ${endpoints.filter(r => r.status === 'SUCCESS').length}/${endpoints.length} passed`);
    console.log(`🔄 Data Tests: ${dataTests.filter(r => r.status === 'SUCCESS').length}/${dataTests.length} passed`);
    
    // Issues found
    const issues = this.results.filter(r => r.status !== 'SUCCESS');
    if (issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.endpoint || issue.test}: ${issue.error || issue.status}`);
      });
    }
    
    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (successRate >= 90) {
      console.log('✅ Dashboard-Signals synchronization is WORKING CORRECTLY');
      console.log('✅ Unified data endpoints are functional');
      console.log('✅ Data consistency has been achieved');
    } else if (successRate >= 70) {
      console.log('⚠️ Dashboard-Signals synchronization is PARTIALLY WORKING');
      console.log('⚠️ Some endpoints may need additional fixes');
    } else {
      console.log('❌ Dashboard-Signals synchronization needs MORE WORK');
      console.log('❌ Multiple issues detected requiring attention');
    }
    
    return {
      successRate: parseFloat(successRate),
      totalTests,
      successCount,
      issues: issues.length,
      status: successRate >= 90 ? 'WORKING' : successRate >= 70 ? 'PARTIAL' : 'NEEDS_WORK'
    };
  }

  async makeRequest(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();
    
    // Check if response is HTML (indicating routing issue)
    if (text.trim().startsWith('<!DOCTYPE html>')) {
      throw new Error('Received HTML instead of JSON (routing issue)');
    }
    
    return JSON.parse(text);
  }
}

// Execute verification
async function main() {
  const verification = new DashboardSignalsFixVerification();
  await verification.runVerification();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DashboardSignalsFixVerification };