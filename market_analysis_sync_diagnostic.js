/**
 * Market Analysis Dashboard Sync Diagnostic
 * Identifies mismatches between dashboard display and underlying analysis data
 */

class MarketAnalysisSyncDiagnostic {
  constructor() {
    this.apiBase = 'http://localhost:5000';
    this.mismatches = [];
    this.testSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
  }

  async runSyncDiagnostic() {
    console.log('🔍 MARKET ANALYSIS DASHBOARD SYNC DIAGNOSTIC');
    console.log('═'.repeat(60));
    
    try {
      for (const symbol of this.testSymbols) {
        await this.compareMarketAnalysisData(symbol);
      }
      
      this.generateSyncReport();
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
    }
  }

  async compareMarketAnalysisData(symbol) {
    console.log(`\n📊 Analyzing ${symbol}...`);
    
    try {
      // Get data from different endpoints
      const [
        simpleMarketData,
        heatmapData,
        signalsData,
        accuracyData,
        advancedAnalytics
      ] = await Promise.all([
        this.fetchData(`/api/simple-market-data?timeframe=1h`),
        this.fetchData(`/api/market-heatmap?timeframe=1h`),
        this.fetchData(`/api/signals/${encodeURIComponent(symbol)}`),
        this.fetchData(`/api/accuracy/${encodeURIComponent(symbol)}`),
        this.fetchData(`/api/analytics/advanced/${encodeURIComponent(symbol)}`)
      ]);

      // Find symbol data in simple market data
      const simpleEntry = simpleMarketData?.data?.find(entry => entry.symbol === symbol);
      
      // Find symbol data in heatmap
      const heatmapEntry = heatmapData?.marketEntries?.find(entry => entry.symbol === symbol);
      
      // Get 1h signals
      const hourSignals = signalsData?.filter(signal => signal.timeframe === '1h') || [];
      
      console.log('📈 Data Sources Analysis:');
      console.log(`   Simple Market: ${simpleEntry ? 'Found' : 'Missing'}`);
      console.log(`   Heatmap: ${heatmapEntry ? 'Found' : 'Missing'}`);
      console.log(`   Signals (1h): ${hourSignals.length} found`);
      console.log(`   Accuracy: ${accuracyData ? 'Available' : 'Missing'}`);
      console.log(`   Analytics: ${advancedAnalytics?.success ? 'Available' : 'Missing'}`);

      // Compare signal directions
      if (simpleEntry && heatmapEntry && hourSignals.length > 0) {
        const simpleSignal = simpleEntry.signal;
        const heatmapSignal = heatmapEntry.signals?.['1h']?.direction || heatmapEntry.sentiment?.direction;
        const directSignal = hourSignals[0].direction;
        
        console.log('\n🎯 Signal Comparison:');
        console.log(`   Simple Market API: ${simpleSignal}`);
        console.log(`   Heatmap API: ${heatmapSignal}`);
        console.log(`   Direct Signals API: ${directSignal}`);
        
        if (simpleSignal !== heatmapSignal || simpleSignal !== directSignal || heatmapSignal !== directSignal) {
          const mismatch = {
            symbol,
            type: 'signal_direction_mismatch',
            simple: simpleSignal,
            heatmap: heatmapSignal,
            direct: directSignal
          };
          this.mismatches.push(mismatch);
          console.log('   ❌ MISMATCH DETECTED');
        } else {
          console.log('   ✅ Signals match');
        }
      }

      // Compare confidence levels
      if (simpleEntry && heatmapEntry && hourSignals.length > 0) {
        const simpleConfidence = simpleEntry.confidence;
        const heatmapConfidence = heatmapEntry.signals?.['1h']?.confidence;
        const directConfidence = hourSignals[0].confidence;
        
        console.log('\n📊 Confidence Comparison:');
        console.log(`   Simple Market API: ${simpleConfidence}`);
        console.log(`   Heatmap API: ${heatmapConfidence}`);
        console.log(`   Direct Signals API: ${directConfidence}`);
        
        const confidenceDiff = Math.max(
          Math.abs(simpleConfidence - heatmapConfidence || 0),
          Math.abs(simpleConfidence - directConfidence || 0),
          Math.abs((heatmapConfidence || 0) - directConfidence || 0)
        );
        
        if (confidenceDiff > 5) { // Allow 5% variance
          const mismatch = {
            symbol,
            type: 'confidence_mismatch',
            simple: simpleConfidence,
            heatmap: heatmapConfidence,
            direct: directConfidence,
            maxDifference: confidenceDiff
          };
          this.mismatches.push(mismatch);
          console.log(`   ❌ MISMATCH: ${confidenceDiff}% difference`);
        } else {
          console.log('   ✅ Confidence levels match');
        }
      }

      // Compare price data
      if (simpleEntry && heatmapEntry) {
        const simplePrice = simpleEntry.price;
        const heatmapPrice = heatmapEntry.currentPrice;
        
        console.log('\n💰 Price Comparison:');
        console.log(`   Simple Market API: $${simplePrice}`);
        console.log(`   Heatmap API: $${heatmapPrice}`);
        
        const priceDiff = Math.abs(simplePrice - heatmapPrice) / simplePrice * 100;
        
        if (priceDiff > 1) { // Allow 1% variance
          const mismatch = {
            symbol,
            type: 'price_mismatch',
            simple: simplePrice,
            heatmap: heatmapPrice,
            percentDifference: priceDiff
          };
          this.mismatches.push(mismatch);
          console.log(`   ❌ MISMATCH: ${priceDiff.toFixed(2)}% difference`);
        } else {
          console.log('   ✅ Prices match');
        }
      }

      // Check timestamp freshness
      const now = Date.now();
      const timestamps = [
        simpleEntry?.timestamp,
        heatmapEntry?.signals?.['1h']?.timestamp,
        hourSignals[0]?.timestamp
      ].filter(Boolean);

      if (timestamps.length > 0) {
        const oldestTimestamp = Math.min(...timestamps);
        const age = (now - oldestTimestamp) / 1000 / 60; // minutes
        
        console.log('\n⏰ Data Freshness:');
        console.log(`   Oldest data: ${age.toFixed(1)} minutes old`);
        
        if (age > 10) { // Older than 10 minutes
          const mismatch = {
            symbol,
            type: 'stale_data',
            ageMinutes: age
          };
          this.mismatches.push(mismatch);
          console.log('   ❌ STALE DATA detected');
        } else {
          console.log('   ✅ Data is fresh');
        }
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error.message);
      this.mismatches.push({
        symbol,
        type: 'analysis_error',
        error: error.message
      });
    }
  }

  generateSyncReport() {
    console.log('\n📋 SYNC DIAGNOSTIC REPORT');
    console.log('═'.repeat(60));
    
    if (this.mismatches.length === 0) {
      console.log('✅ No mismatches detected - Market analysis dashboard appears synchronized');
      return;
    }

    console.log(`❌ Found ${this.mismatches.length} mismatches:`);
    console.log('');

    // Group by type
    const byType = {};
    this.mismatches.forEach(mismatch => {
      if (!byType[mismatch.type]) byType[mismatch.type] = [];
      byType[mismatch.type].push(mismatch);
    });

    Object.keys(byType).forEach(type => {
      console.log(`🔍 ${type.toUpperCase().replace(/_/g, ' ')}:`);
      byType[type].forEach(mismatch => {
        console.log(`   • ${mismatch.symbol}:`);
        
        switch (mismatch.type) {
          case 'signal_direction_mismatch':
            console.log(`     Simple: ${mismatch.simple}, Heatmap: ${mismatch.heatmap}, Direct: ${mismatch.direct}`);
            break;
          case 'confidence_mismatch':
            console.log(`     Simple: ${mismatch.simple}%, Heatmap: ${mismatch.heatmap}%, Direct: ${mismatch.direct}%`);
            console.log(`     Max difference: ${mismatch.maxDifference}%`);
            break;
          case 'price_mismatch':
            console.log(`     Simple: $${mismatch.simple}, Heatmap: $${mismatch.heatmap}`);
            console.log(`     Difference: ${mismatch.percentDifference.toFixed(2)}%`);
            break;
          case 'stale_data':
            console.log(`     Data age: ${mismatch.ageMinutes.toFixed(1)} minutes`);
            break;
          case 'analysis_error':
            console.log(`     Error: ${mismatch.error}`);
            break;
        }
      });
      console.log('');
    });

    console.log('🔧 RECOMMENDED FIXES:');
    console.log('');

    if (byType.signal_direction_mismatch) {
      console.log('📡 Signal Direction Mismatches:');
      console.log('   • Check if different APIs use different signal generation logic');
      console.log('   • Verify all endpoints use the same automated signal calculator');
      console.log('   • Clear signal caches and restart signal generation');
      console.log('');
    }

    if (byType.confidence_mismatch) {
      console.log('📊 Confidence Level Mismatches:');
      console.log('   • Verify confidence calculation consistency across APIs');
      console.log('   • Check for different timeframe adjustments in each endpoint');
      console.log('   • Synchronize confidence calculation algorithms');
      console.log('');
    }

    if (byType.price_mismatch) {
      console.log('💰 Price Data Mismatches:');
      console.log('   • Check if price sources are synchronized');
      console.log('   • Verify price caching mechanisms consistency');
      console.log('   • Ensure all APIs use the same price data source');
      console.log('');
    }

    if (byType.stale_data) {
      console.log('⏰ Stale Data Issues:');
      console.log('   • Check real-time update mechanisms');
      console.log('   • Verify cache invalidation strategies');
      console.log('   • Review data refresh intervals');
      console.log('');
    }
  }

  async fetchData(endpoint) {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to fetch ${endpoint}:`, error.message);
      return null;
    }
  }
}

// Run diagnostic
async function main() {
  const diagnostic = new MarketAnalysisSyncDiagnostic();
  await diagnostic.runSyncDiagnostic();
}

// Setup fetch for Node.js environment
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main().catch(console.error);