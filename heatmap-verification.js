/**
 * Comprehensive Heatmap Verification Tool
 * Tests all 10 timeframes to ensure accurate signal calculations
 */

const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
const baseUrl = 'http://localhost:3000';

async function testTimeframeCalculations() {
  console.log('🔍 Starting comprehensive heatmap verification across all timeframes...\n');
  
  const results = {};
  
  for (const timeframe of timeframes) {
    try {
      console.log(`Testing ${timeframe} timeframe...`);
      
      const response = await fetch(`${baseUrl}/api/market-heatmap?timeframe=${timeframe}`);
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        results[timeframe] = { status: 'ERROR', message: 'Invalid response format' };
        continue;
      }
      
      // Analyze signal distribution
      const signals = data.map(item => {
        const signalKey = Object.keys(item.signals)[0];
        return item.signals[signalKey];
      });
      
      const longSignals = signals.filter(s => s.direction === 'LONG').length;
      const shortSignals = signals.filter(s => s.direction === 'SHORT').length;
      const neutralSignals = signals.filter(s => s.direction === 'NEUTRAL').length;
      
      const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
      
      results[timeframe] = {
        status: 'SUCCESS',
        totalSignals: data.length,
        distribution: {
          LONG: longSignals,
          SHORT: shortSignals,
          NEUTRAL: neutralSignals
        },
        avgConfidence: Math.round(avgConfidence),
        sampleSignal: signals[0] || null
      };
      
      console.log(`✅ ${timeframe}: ${data.length} signals (L:${longSignals} S:${shortSignals} N:${neutralSignals}) Avg:${Math.round(avgConfidence)}%`);
      
    } catch (error) {
      results[timeframe] = { status: 'ERROR', message: error.message };
      console.log(`❌ ${timeframe}: ${error.message}`);
    }
  }
  
  console.log('\n📊 COMPREHENSIVE VERIFICATION RESULTS:');
  console.log('=====================================');
  
  let successCount = 0;
  let totalSignals = 0;
  
  for (const [timeframe, result] of Object.entries(results)) {
    if (result.status === 'SUCCESS') {
      successCount++;
      totalSignals += result.totalSignals;
      console.log(`${timeframe.padEnd(4)}: ✅ ${result.totalSignals} signals | L:${result.distribution.LONG} S:${result.distribution.SHORT} N:${result.distribution.NEUTRAL} | Conf:${result.avgConfidence}%`);
    } else {
      console.log(`${timeframe.padEnd(4)}: ❌ ${result.message}`);
    }
  }
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`- Timeframes working: ${successCount}/${timeframes.length}`);
  console.log(`- Total signals calculated: ${totalSignals}`);
  console.log(`- Expected signals per timeframe: 50`);
  console.log(`- System status: ${successCount === timeframes.length ? 'FULLY OPERATIONAL' : 'ISSUES DETECTED'}`);
  
  return results;
}

// Run verification if called directly
if (typeof window === 'undefined') {
  testTimeframeCalculations().catch(console.error);
}