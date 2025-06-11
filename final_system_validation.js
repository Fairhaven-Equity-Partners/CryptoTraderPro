/**
 * Final System Validation Summary
 * Quick verification of core functionality
 */

import http from 'http';

class FinalSystemValidation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async executeFinalValidation() {
    console.log('🔍 Final System Validation');
    
    const validationResults = {
      timeframes: await this.validateTimeframes(),
      pairs: await this.validatePairs(),
      performance: await this.validatePerformance(),
      apiCompliance: await this.validateAPICompliance()
    };

    this.generateFinalReport(validationResults);
  }

  async validateTimeframes() {
    const timeframes = ['1m', '1h', '1d', '1w'];
    const results = [];
    
    for (const tf of timeframes) {
      const result = await this.makeRequest(`/api/technical-analysis/BTC%2FUSDT?timeframe=${tf}`);
      results.push({
        timeframe: tf,
        working: result.success && result.data.indicators && result.data.indicators.rsi
      });
    }
    
    return results;
  }

  async validatePairs() {
    const pairs = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    const results = [];
    
    for (const pair of pairs) {
      const result = await this.makeRequest(`/api/crypto/${encodeURIComponent(pair)}`);
      results.push({
        pair,
        working: result.success && result.data.lastPrice
      });
    }
    
    return results;
  }

  async validatePerformance() {
    const result = await this.makeRequest('/api/performance-metrics');
    return {
      working: result.success && result.data.indicators,
      indicatorCount: result.success ? result.data.indicators?.length || 0 : 0
    };
  }

  async validateAPICompliance() {
    const startTime = Date.now();
    let successCount = 0;
    const totalTests = 5;
    
    for (let i = 0; i < totalTests; i++) {
      const result = await this.makeRequest('/api/crypto/BTC%2FUSDT');
      if (result.success) successCount++;
      await this.sleep(100);
    }
    
    return {
      successRate: (successCount / totalTests) * 100,
      totalDuration: Date.now() - startTime
    };
  }

  async makeRequest(endpoint) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = `${this.baseUrl}${endpoint}`;
      
      const req = http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve({
              success: res.statusCode === 200,
              data: parsedData,
              responseTime: Date.now() - startTime
            });
          } catch (error) {
            resolve({
              success: false,
              error: error.message,
              responseTime: Date.now() - startTime
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        });
      });
      
      req.setTimeout(3000, () => {
        req.destroy();
        resolve({ success: false, error: 'Timeout' });
      });
    });
  }

  generateFinalReport(results) {
    console.log('\n📊 FINAL VALIDATION REPORT');
    console.log('='.repeat(50));
    
    console.log('\n⏱️ TIMEFRAME FUNCTIONALITY:');
    const workingTimeframes = results.timeframes.filter(t => t.working).length;
    console.log(`Working Timeframes: ${workingTimeframes}/${results.timeframes.length}`);
    results.timeframes.forEach(t => {
      console.log(`  ${t.timeframe}: ${t.working ? '✅' : '❌'}`);
    });
    
    console.log('\n💰 PAIR OPERATIONS:');
    const workingPairs = results.pairs.filter(p => p.working).length;
    console.log(`Working Pairs: ${workingPairs}/${results.pairs.length}`);
    results.pairs.forEach(p => {
      console.log(`  ${p.pair}: ${p.working ? '✅' : '❌'}`);
    });
    
    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`Status: ${results.performance.working ? '✅ Operational' : '❌ Issues'}`);
    console.log(`Indicators Available: ${results.performance.indicatorCount}`);
    
    console.log('\n🌐 API COMPLIANCE:');
    console.log(`Success Rate: ${results.apiCompliance.successRate}%`);
    console.log(`Response Performance: ${results.apiCompliance.totalDuration}ms total`);
    
    console.log('\n✅ OVERALL SYSTEM STATUS:');
    const overallScore = (
      (workingTimeframes / results.timeframes.length) * 25 +
      (workingPairs / results.pairs.length) * 25 +
      (results.performance.working ? 25 : 0) +
      (results.apiCompliance.successRate / 100) * 25
    );
    
    console.log(`System Health Score: ${overallScore.toFixed(1)}/100`);
    
    if (overallScore >= 90) {
      console.log('🟢 SYSTEM STATUS: FULLY OPERATIONAL');
    } else if (overallScore >= 75) {
      console.log('🟡 SYSTEM STATUS: MOSTLY OPERATIONAL');
    } else {
      console.log('🔴 SYSTEM STATUS: REQUIRES ATTENTION');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const validator = new FinalSystemValidation();
  await validator.executeFinalValidation();
}

main().catch(console.error);