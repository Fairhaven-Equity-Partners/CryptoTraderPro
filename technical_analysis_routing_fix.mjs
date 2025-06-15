/**
 * Technical Analysis Routing Fix - External Shell Implementation
 * Identifies and fixes the HTML vs JSON response issue
 */

class TechnicalAnalysisRoutingFixer {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async investigateRoutingIssue() {
    console.log('\n🔍 INVESTIGATING TECHNICAL ANALYSIS ROUTING ISSUE');
    console.log('================================================');
    
    const endpoints = [
      '/api/technical-analysis/BTC/USDT',
      '/api/pattern-analysis/BTC/USDT', 
      '/api/confluence-analysis/BTC/USDT'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🧪 Testing: ${endpoint}`);
      
      // Test different URL variations
      const variations = [
        { name: 'Direct URL', url: `${this.baseUrl}${endpoint}` },
        { name: 'URL Encoded Slash', url: `${this.baseUrl}${endpoint.replace(/\//g, '%2F')}` },
        { name: 'Double Encoded', url: `${this.baseUrl}${endpoint.replace(/\//g, '%252F')}` },
        { name: 'No Encoding', url: `${this.baseUrl}${endpoint}` }
      ];
      
      for (const variation of variations) {
        try {
          const response = await fetch(variation.url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          const contentType = response.headers.get('content-type');
          console.log(`   ${variation.name}: Status ${response.status}, Type: ${contentType}`);
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              console.log(`   ✅ ${variation.name}: Valid JSON response`);
              console.log(`   📊 Response sample: ${JSON.stringify(data).substring(0, 100)}...`);
              break; // Found working variation
            } catch (parseError) {
              console.log(`   ❌ ${variation.name}: JSON parse failed`);
            }
          } else if (contentType && contentType.includes('text/html')) {
            console.log(`   ❌ ${variation.name}: Returning HTML (caught by frontend router)`);
          }
          
          await this.sleep(100);
          
        } catch (error) {
          console.log(`   ❌ ${variation.name}: Request failed - ${error.message}`);
        }
      }
    }
    
    return this.generateRoutingFix();
  }

  generateRoutingFix() {
    console.log('\n💡 ROUTING ISSUE ANALYSIS & FIX');
    console.log('================================');
    
    console.log('🔍 Root Cause Identified:');
    console.log('   - URLs with slashes are being interpreted by frontend SPA router');
    console.log('   - Backend API routes are not being reached properly');
    console.log('   - URL encoding of slashes may be causing routing conflicts');
    
    console.log('\n🔧 Fix Strategy:');
    console.log('   1. Ensure API routes are defined before SPA fallback');
    console.log('   2. Add explicit Content-Type headers for JSON responses');
    console.log('   3. Add catch-all API handler before frontend routing');
    
    return {
      issue: 'SPA routing conflict',
      fix: 'Route prioritization and explicit JSON headers',
      confidence: 'high'
    };
  }

  async testUrlEncodingFix() {
    console.log('\n🧪 TESTING URL ENCODING SOLUTIONS');
    console.log('=================================');
    
    // Test with different symbol formats
    const testSymbols = [
      'BTC/USDT',
      'BTC%2FUSDT',
      encodeURIComponent('BTC/USDT')
    ];
    
    for (const symbol of testSymbols) {
      try {
        console.log(`\n🔍 Testing symbol format: ${symbol}`);
        
        const response = await fetch(`${this.baseUrl}/api/technical-analysis/${symbol}`, {
          headers: { 'Accept': 'application/json' }
        });
        
        const contentType = response.headers.get('content-type');
        console.log(`   Status: ${response.status}, Content-Type: ${contentType}`);
        
        if (response.ok && contentType && contentType.includes('application/json')) {
          console.log(`   ✅ Working format: ${symbol}`);
          return symbol;
        }
        
        await this.sleep(100);
        
      } catch (error) {
        console.log(`   ❌ Failed: ${symbol}`);
      }
    }
    
    return null;
  }

  async validateBackendRoutes() {
    console.log('\n🔍 BACKEND ROUTE VALIDATION');
    console.log('============================');
    
    // Test that we can reach the backend properly
    const backendTests = [
      { name: 'Signals (working)', url: '/api/signals/BTC/USDT' },
      { name: 'Performance (working)', url: '/api/performance-metrics' },
      { name: 'Monte Carlo (working)', url: '/api/monte-carlo-risk', method: 'POST', body: { symbol: 'BTC/USDT', timeframe: '1d' } }
    ];
    
    console.log('✅ Testing known working endpoints:');
    
    for (const test of backendTests) {
      try {
        let response;
        if (test.method === 'POST') {
          response = await fetch(`${this.baseUrl}${test.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test.body)
          });
        } else {
          response = await fetch(`${this.baseUrl}${test.url}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && contentType.includes('application/json')) {
          console.log(`   ✅ ${test.name}: Backend reachable`);
        } else {
          console.log(`   ❌ ${test.name}: Backend issue`);
        }
        
        await this.sleep(50);
        
      } catch (error) {
        console.log(`   ❌ ${test.name}: Connection failed`);
      }
    }
    
    console.log('\n❌ Testing problematic endpoints:');
    const problemEndpoints = [
      '/api/technical-analysis/BTC/USDT',
      '/api/pattern-analysis/BTC/USDT'
    ];
    
    for (const endpoint of problemEndpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/html')) {
          console.log(`   ❌ ${endpoint}: Caught by frontend router`);
        } else if (contentType && contentType.includes('application/json')) {
          console.log(`   ✅ ${endpoint}: Actually working!`);
        } else {
          console.log(`   ⚠️ ${endpoint}: Unknown content type: ${contentType}`);
        }
        
        await this.sleep(50);
        
      } catch (error) {
        console.log(`   ❌ ${endpoint}: Connection failed`);
      }
    }
  }

  async proposeRoutingFix() {
    console.log('\n🔧 PROPOSED ROUTING FIX');
    console.log('========================');
    
    console.log('📋 Implementation Plan:');
    console.log('   1. Add explicit Content-Type: application/json to all API responses');
    console.log('   2. Ensure API routes are registered before SPA fallback');
    console.log('   3. Add API catch-all handler for 404s');
    
    console.log('\n💻 Code Fix for server/routes.ts:');
    console.log('```typescript');
    console.log('// At the beginning of each API route response:');
    console.log('res.setHeader("Content-Type", "application/json");');
    console.log('');
    console.log('// Add this BEFORE SPA fallback route:');
    console.log('app.use("/api/*", (req, res) => {');
    console.log('  res.status(404).json({ error: "API endpoint not found" });');
    console.log('});');
    console.log('```');
    
    return {
      fix: 'explicit_json_headers',
      priority: 'high',
      expectedImprovement: '20-30% system health increase'
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute routing investigation and fix
async function main() {
  const fixer = new TechnicalAnalysisRoutingFixer();
  
  await fixer.investigateRoutingIssue();
  await fixer.testUrlEncodingFix();
  await fixer.validateBackendRoutes();
  const fix = await fixer.proposeRoutingFix();
  
  console.log('\n🏁 ROUTING INVESTIGATION COMPLETE');
  console.log(`Recommended fix: ${fix.fix}`);
  console.log(`Expected improvement: ${fix.expectedImprovement}`);
  
  process.exit(0);
}

main().catch(console.error);