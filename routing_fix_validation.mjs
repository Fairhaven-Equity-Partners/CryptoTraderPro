/**
 * Routing Fix Validation - External Shell Test
 * Tests if the JSON header fixes resolved the HTML response issue
 */

class RoutingFixValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async validateRoutingFixes() {
    console.log('\n🎯 VALIDATING ROUTING FIXES');
    console.log('===========================');
    console.log('Testing JSON header fixes for technical analysis endpoints');
    
    const endpoints = [
      { name: 'Technical Analysis', url: '/api/technical-analysis/BTC/USDT' },
      { name: 'Pattern Analysis', url: '/api/pattern-analysis/BTC/USDT' },
      { name: 'Confluence Analysis', url: '/api/confluence-analysis/BTC/USDT' }
    ];
    
    let fixedEndpoints = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint.url}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        const contentType = response.headers.get('content-type');
        
        if (response.ok && contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            console.log(`✅ ${endpoint.name}: Fixed - returning JSON`);
            fixedEndpoints++;
          } catch (parseError) {
            console.log(`❌ ${endpoint.name}: Claims JSON but parsing failed`);
          }
        } else if (contentType && contentType.includes('text/html')) {
          console.log(`❌ ${endpoint.name}: Still returning HTML`);
        } else {
          console.log(`⚠️ ${endpoint.name}: Unexpected content type: ${contentType}`);
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Connection failed`);
      }
    }
    
    const fixSuccessRate = (fixedEndpoints / endpoints.length) * 100;
    console.log(`\n🎯 Routing Fix Success: ${fixSuccessRate}% (${fixedEndpoints}/${endpoints.length})`);
    
    return fixSuccessRate;
  }

  async runFinalSystemHealthCheck() {
    console.log('\n🏥 FINAL SYSTEM HEALTH CHECK');
    console.log('============================');
    
    const allEndpoints = [
      { name: 'Monte Carlo', url: '/api/monte-carlo-risk', method: 'POST', body: { symbol: 'BTC/USDT', timeframe: '1d' } },
      { name: 'Signals', url: '/api/signals/BTC/USDT' },
      { name: 'Performance Metrics', url: '/api/performance-metrics' },
      { name: 'Crypto Data', url: '/api/crypto/BTC/USDT' },
      { name: 'Technical Analysis', url: '/api/technical-analysis/BTC/USDT' },
      { name: 'Pattern Analysis', url: '/api/pattern-analysis/BTC/USDT' },
      { name: 'Confluence Analysis', url: '/api/confluence-analysis/BTC/USDT' }
    ];
    
    let healthyEndpoints = 0;
    
    for (const endpoint of allEndpoints) {
      try {
        let response;
        if (endpoint.method === 'POST') {
          response = await fetch(`${this.baseUrl}${endpoint.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(endpoint.body)
          });
        } else {
          response = await fetch(`${this.baseUrl}${endpoint.url}`);
        }
        
        const contentType = response.headers.get('content-type');
        
        if (response.ok && contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name}: Healthy`);
          healthyEndpoints++;
        } else {
          console.log(`❌ ${endpoint.name}: Issues (${response.status}, ${contentType})`);
        }
        
        await this.sleep(50);
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Failed`);
      }
    }
    
    const systemHealth = (healthyEndpoints / allEndpoints.length) * 100;
    console.log(`\n🎯 System Health: ${systemHealth}% (${healthyEndpoints}/${allEndpoints.length})`);
    
    return systemHealth;
  }

  async validateMonteCarloReliability() {
    console.log('\n✅ Monte Carlo Reliability Check');
    
    const tests = [
      { symbol: '', timeframe: '1d', expectFail: true },
      { symbol: 'BTC/USDT', timeframe: '', expectFail: true },
      { symbol: 'BTC/USDT', timeframe: 'invalid', expectFail: true },
      { symbol: 'BTC/USDT', timeframe: '1d', expectFail: false }
    ];
    
    let passing = 0;
    
    for (const test of tests) {
      try {
        const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: test.symbol, timeframe: test.timeframe })
        });
        
        const data = await response.json();
        
        if (test.expectFail && response.status === 400 && data.error) {
          passing++;
        } else if (!test.expectFail && response.status === 200 && data.success) {
          passing++;
        }
        
        await this.sleep(50);
        
      } catch (error) {
        // Test failed
      }
    }
    
    const reliability = (passing / tests.length) * 100;
    console.log(`   Monte Carlo Reliability: ${reliability}%`);
    
    return reliability;
  }

  async calculateFinalScore() {
    console.log('\n📊 CALCULATING FINAL SYSTEM SCORE');
    console.log('=================================');
    
    const routingFix = await this.validateRoutingFixes();
    const systemHealth = await this.runFinalSystemHealthCheck();
    const monteCarloReliability = await this.validateMonteCarloReliability();
    
    // Weighted final score
    const finalScore = (
      routingFix * 0.35 +              // 35% - Routing fixes
      systemHealth * 0.45 +            // 45% - Overall health
      monteCarloReliability * 0.20     // 20% - Monte Carlo reliability
    );
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log(`   Routing Fixes: ${routingFix.toFixed(1)}%`);
    console.log(`   System Health: ${systemHealth.toFixed(1)}%`);
    console.log(`   Monte Carlo: ${monteCarloReliability.toFixed(1)}%`);
    console.log(`   FINAL SCORE: ${finalScore.toFixed(1)}%`);
    
    if (finalScore >= 90) {
      console.log('\n🎉 PHASE 1 COMPLETE!');
      console.log('✅ System health exceeds 90% threshold');
      console.log('🎯 Ready for Phase 2: UI realignment design');
      console.log('\nNext Steps:');
      console.log('1. Design realigned main display UI in external shell');
      console.log('2. Focus on visual/layout improvements');
      console.log('3. Maintain all current functionality');
      console.log('4. Test UI design before implementation');
      return { ready: true, score: finalScore };
    } else if (finalScore >= 85) {
      console.log('\n🚧 PHASE 1 NEARLY COMPLETE');
      console.log(`⚠️ ${finalScore.toFixed(1)}% health (need 90%+)`);
      console.log('🔧 Minor optimizations needed');
      return { ready: false, score: finalScore };
    } else {
      console.log('\n🔧 PHASE 1 IN PROGRESS');
      console.log(`❌ ${finalScore.toFixed(1)}% health (need 90%+)`);
      console.log('🛠️ Additional fixes required');
      return { ready: false, score: finalScore };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute routing fix validation
async function main() {
  const validator = new RoutingFixValidator();
  const results = await validator.calculateFinalScore();
  
  console.log('\n🏁 ROUTING FIX VALIDATION COMPLETE');
  console.log(`Phase 1 Ready: ${results.ready}`);
  
  process.exit(results.ready ? 0 : 1);
}

main().catch(console.error);