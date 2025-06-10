/**
 * Simplified External Testing Framework for Phase 2 Validation
 * Uses curl for HTTP requests to validate system stability
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class SimpleExternalTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = [];
    this.cycles = 10; // Reduced for faster execution
  }

  async executeValidation() {
    console.log('🔬 EXTERNAL VALIDATION FRAMEWORK');
    console.log('================================');
    console.log(`Testing ${this.cycles} cycles before Phase 2 implementation`);
    console.log('');

    const startTime = Date.now();
    let totalTests = 0;
    let passedTests = 0;

    for (let cycle = 1; cycle <= this.cycles; cycle++) {
      console.log(`Cycle ${cycle}/${this.cycles}`);
      
      const cycleResults = await this.runCycle();
      totalTests += cycleResults.total;
      passedTests += cycleResults.passed;
      
      process.stdout.write(cycleResults.passed === cycleResults.total ? '✅ ' : '⚠️ ');
      
      // Brief pause
      await this.sleep(500);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`\n\n📊 VALIDATION RESULTS`);
    console.log('====================');
    console.log(`Duration: ${duration}s`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Tests: ${passedTests}/${totalTests}`);
    
    if (parseFloat(successRate) >= 80) {
      console.log('\n✅ SYSTEM STABLE - Phase 2 implementation approved');
      return true;
    } else {
      console.log('\n⚠️ SYSTEM UNSTABLE - Review issues before Phase 2');
      return false;
    }
  }

  async runCycle() {
    const tests = [
      { name: 'crypto', endpoint: '/api/crypto/BTC%2FUSDT' },
      { name: 'authentic-data', endpoint: '/api/authentic-data/status' },
      { name: 'rate-limiter', endpoint: '/api/rate-limiter/stats' },
      { name: 'performance', endpoint: '/api/performance-metrics' },
      { name: 'signals', endpoint: '/api/signals/BTC%2FUSDT' },
      { name: 'heatmap', endpoint: '/api/market-heatmap' }
    ];

    let passed = 0;
    
    for (const test of tests) {
      try {
        const result = await this.testEndpoint(test.endpoint);
        if (result.success) passed++;
      } catch (error) {
        // Test failed, continue
      }
    }

    return { total: tests.length, passed };
  }

  async testEndpoint(endpoint) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const { stdout, stderr } = await execAsync(`curl -s -w "%{http_code}" -o /dev/null "${url}"`);
      
      const statusCode = parseInt(stdout.trim());
      return { success: statusCode >= 200 && statusCode < 400 };
    } catch (error) {
      return { success: false };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute validation
async function main() {
  const tester = new SimpleExternalTester();
  const isStable = await tester.executeValidation();
  process.exit(isStable ? 0 : 1);
}

main().catch(error => {
  console.error('Validation failed:', error.message);
  process.exit(1);
});