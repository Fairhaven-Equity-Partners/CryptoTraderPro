/**
 * Quick Routing Diagnostic - External Shell Test
 * Fast diagnosis of HTML vs JSON response issues
 */

class QuickRoutingDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async runQuickDiagnostic() {
    console.log('🔍 QUICK ROUTING DIAGNOSTIC');
    console.log('===========================');
    
    const tests = [
      { name: 'Working API', url: '/api/signals/BTC%2FUSDT' },
      { name: 'Technical (encoded)', url: '/api/technical-analysis/BTC%2FUSDT' },
      { name: 'Technical (direct)', url: '/api/technical-analysis/BTC/USDT' },
      { name: 'Pattern (encoded)', url: '/api/pattern-analysis/BTC%2FUSDT' },
      { name: 'Pattern (direct)', url: '/api/pattern-analysis/BTC/USDT' }
    ];
    
    let jsonResponses = 0;
    let htmlResponses = 0;
    
    for (const test of tests) {
      try {
        const response = await fetch(`${this.baseUrl}${test.url}`);
        const contentType = response.headers.get('content-type') || 'unknown';
        
        if (contentType.includes('application/json')) {
          jsonResponses++;
          console.log(`✅ ${test.name}: JSON`);
        } else if (contentType.includes('text/html')) {
          htmlResponses++;
          console.log(`❌ ${test.name}: HTML`);
        } else {
          console.log(`⚠️ ${test.name}: ${contentType}`);
        }
        
      } catch (error) {
        console.log(`❌ ${test.name}: Failed`);
      }
    }
    
    console.log(`\nResults: ${jsonResponses} JSON, ${htmlResponses} HTML`);
    
    if (htmlResponses > 0) {
      console.log('\n🔧 ROUTING ISSUE CONFIRMED');
      console.log('Problem: Frontend SPA router intercepting API routes');
      console.log('Solution: Use URL encoding for all symbol parameters');
      
      return { issue: true, jsonResponses, htmlResponses };
    } else {
      console.log('\n✅ ROUTING WORKING CORRECTLY');
      return { issue: false, jsonResponses, htmlResponses };
    }
  }
}

// Execute quick diagnostic
async function main() {
  const diagnostic = new QuickRoutingDiagnostic();
  const result = await diagnostic.runQuickDiagnostic();
  
  process.exit(result.issue ? 1 : 0);
}

main().catch(console.error);