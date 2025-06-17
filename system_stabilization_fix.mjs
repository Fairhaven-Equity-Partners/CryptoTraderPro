/**
 * SYSTEM STABILIZATION & WEBSOCKET CONNECTION FIX
 * External validation and server stabilization protocol
 */

import fetch from 'node-fetch';

class SystemStabilizer {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.maxRetries = 5;
    this.retryDelay = 2000;
  }

  async stabilizeSystem() {
    console.log('🔧 SYSTEM STABILIZATION PROTOCOL');
    console.log('================================');
    
    // Step 1: Wait for server initialization
    await this.waitForServerReady();
    
    // Step 2: Test core endpoints
    await this.testCoreEndpoints();
    
    // Step 3: Validate signal generation
    await this.validateSignalGeneration();
    
    // Step 4: Final health check
    await this.performHealthCheck();
  }

  async waitForServerReady() {
    console.log('📡 Waiting for server initialization...');
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/performance-metrics`, {
          timeout: 5000
        });
        
        if (response.ok) {
          console.log(`   ✅ Server ready on attempt ${attempt}`);
          return true;
        }
      } catch (error) {
        console.log(`   ⏳ Attempt ${attempt}/${this.maxRetries}: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay);
        }
      }
    }
    
    console.log('   ❌ Server failed to initialize after maximum retries');
    return false;
  }

  async testCoreEndpoints() {
    console.log('\n🧪 Testing core endpoints...');
    
    const endpoints = [
      '/api/performance-metrics',
      '/api/signals?symbol=BTC%2FUSDT&timeframe=4h',
      '/api/technical-analysis?symbol=BTC%2FUSDT&timeframe=4h'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          timeout: 10000
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${endpoint}: ${response.status}`);
        } else {
          console.log(`   ❌ ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint}: ${error.message}`);
      }
      
      await this.sleep(500);
    }
  }

  async validateSignalGeneration() {
    console.log('\n📊 Validating signal generation...');
    
    const symbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    const timeframes = ['1h', '4h', '1d'];
    
    let successCount = 0;
    let totalTests = symbols.length * timeframes.length;
    
    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        try {
          const encodedSymbol = encodeURIComponent(symbol);
          const response = await fetch(
            `${this.baseUrl}/api/signals?symbol=${encodedSymbol}&timeframe=${timeframe}`,
            { timeout: 8000 }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              successCount++;
              console.log(`   ✅ ${symbol} ${timeframe}: ${data[0].direction} ${data[0].confidence}%`);
            }
          }
        } catch (error) {
          console.log(`   ❌ ${symbol} ${timeframe}: ${error.message}`);
        }
        
        await this.sleep(300);
      }
    }
    
    const successRate = ((successCount / totalTests) * 100).toFixed(1);
    console.log(`\n📈 Signal Generation Success Rate: ${successCount}/${totalTests} (${successRate}%)`);
    
    return successRate >= 80;
  }

  async performHealthCheck() {
    console.log('\n🎯 FINAL SYSTEM HEALTH CHECK');
    console.log('============================');
    
    const checks = {
      serverConnectivity: false,
      signalGeneration: false,
      technicalAnalysis: false,
      patternRecognition: false
    };
    
    // Test server connectivity
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      checks.serverConnectivity = response.ok;
    } catch (error) {
      console.log(`❌ Server connectivity failed: ${error.message}`);
    }
    
    // Test signal generation
    try {
      const response = await fetch(`${this.baseUrl}/api/signals?symbol=BTC%2FUSDT&timeframe=4h`);
      if (response.ok) {
        const data = await response.json();
        checks.signalGeneration = data && data.length > 0;
      }
    } catch (error) {
      console.log(`❌ Signal generation failed: ${error.message}`);
    }
    
    // Test technical analysis
    try {
      const response = await fetch(`${this.baseUrl}/api/technical-analysis?symbol=BTC%2FUSDT&timeframe=4h`);
      if (response.ok) {
        const data = await response.json();
        checks.technicalAnalysis = data && data.success;
      }
    } catch (error) {
      console.log(`❌ Technical analysis failed: ${error.message}`);
    }
    
    // Test pattern recognition
    try {
      const response = await fetch(`${this.baseUrl}/api/pattern-analysis/BTC%2FUSDT`);
      if (response.ok) {
        const data = await response.json();
        checks.patternRecognition = data && data.success;
      }
    } catch (error) {
      console.log(`❌ Pattern recognition failed: ${error.message}`);
    }
    
    // Calculate overall health
    const passedChecks = Object.values(checks).filter(check => check).length;
    const totalChecks = Object.keys(checks).length;
    const healthScore = ((passedChecks / totalChecks) * 100).toFixed(1);
    
    console.log('\n📊 SYSTEM COMPONENT STATUS:');
    console.log(`📡 Server Connectivity: ${checks.serverConnectivity ? '✅ OPERATIONAL' : '❌ FAILED'}`);
    console.log(`📊 Signal Generation: ${checks.signalGeneration ? '✅ OPERATIONAL' : '❌ FAILED'}`);
    console.log(`📈 Technical Analysis: ${checks.technicalAnalysis ? '✅ OPERATIONAL' : '❌ FAILED'}`);
    console.log(`🔍 Pattern Recognition: ${checks.patternRecognition ? '✅ OPERATIONAL' : '❌ FAILED'}`);
    
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${healthScore}%`);
    
    if (healthScore >= 75) {
      console.log('✅ SYSTEM STABLE - Ready for optimization implementation');
    } else {
      console.log('⚠️  SYSTEM UNSTABLE - Requires further stabilization');
    }
    
    return { healthScore, checks };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute stabilization
async function main() {
  const stabilizer = new SystemStabilizer();
  await stabilizer.stabilizeSystem();
}

main().catch(console.error);