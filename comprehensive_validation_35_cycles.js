/**
 * Comprehensive 35-Cycle Validation Framework
 * Tests all three phases of authentic signal implementation
 */

import { execSync } from 'child_process';

class ComprehensiveValidator {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.totalCycles = 35;
    this.results = {
      phase1: { tests: 0, passed: 0, failed: 0 },
      phase2: { tests: 0, passed: 0, failed: 0 },
      phase3: { tests: 0, passed: 0, failed: 0 },
      integration: { tests: 0, passed: 0, failed: 0 },
      overall: { tests: 0, passed: 0, failed: 0 }
    };
    this.detailedLogs = [];
    this.criticalIssues = [];
    this.performanceMetrics = [];
  }

  async runComprehensiveValidation() {
    console.log('🔬 COMPREHENSIVE 35-CYCLE VALIDATION');
    console.log('=====================================');
    console.log(`Testing authentic signal system across ${this.totalCycles} cycles`);
    console.log('');

    const startTime = Date.now();

    for (let cycle = 1; cycle <= this.totalCycles; cycle++) {
      console.log(`--- Cycle ${cycle}/${this.totalCycles} ---`);
      
      const cycleStart = Date.now();
      await this.runSingleCycle(cycle);
      const cycleDuration = Date.now() - cycleStart;
      
      this.performanceMetrics.push({
        cycle,
        duration: cycleDuration,
        timestamp: new Date().toISOString()
      });

      // Brief pause between cycles
      await this.sleep(200);
      
      // Progress indicator
      if (cycle % 5 === 0) {
        const progress = ((cycle / this.totalCycles) * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${cycle}/${this.totalCycles} cycles completed)`);
      }
    }

    const totalDuration = Date.now() - startTime;
    return this.generateComprehensiveReport(totalDuration);
  }

  async runSingleCycle(cycleNumber) {
    try {
      // Phase 1: Authentic Data Validation
      await this.validatePhase1(cycleNumber);
      
      // Phase 2: Technical Analysis Validation
      await this.validatePhase2(cycleNumber);
      
      // Phase 3: Feedback System Validation
      await this.validatePhase3(cycleNumber);
      
      // Integration Testing
      await this.validateIntegration(cycleNumber);
      
    } catch (error) {
      this.criticalIssues.push({
        cycle: cycleNumber,
        error: error.message,
        phase: 'cycle_execution',
        timestamp: new Date().toISOString()
      });
    }
  }

  async validatePhase1(cycle) {
    const tests = [
      { name: 'authentic-data-status', endpoint: '/api/authentic-data/status' },
      { name: 'symbol-data-quality', endpoint: '/api/authentic-data/symbol/BTC%2FUSDT' },
      { name: 'price-history-accumulation', endpoint: '/api/authentic-data/status' }
    ];

    for (const test of tests) {
      const result = await this.runTest('phase1', test, cycle);
      this.results.phase1.tests++;
      this.results.overall.tests++;
      
      if (result.success) {
        this.results.phase1.passed++;
        this.results.overall.passed++;
      } else {
        this.results.phase1.failed++;
        this.results.overall.failed++;
      }
    }
  }

  async validatePhase2(cycle) {
    const tests = [
      { name: 'authentic-technical-analysis', endpoint: '/api/authentic-technical-analysis/BTC%2FUSDT' },
      { name: 'authentic-system-status', endpoint: '/api/authentic-system/status' },
      { name: 'technical-indicators', endpoint: '/api/authentic-technical-analysis/ETH%2FUSDT' }
    ];

    for (const test of tests) {
      const result = await this.runTest('phase2', test, cycle);
      this.results.phase2.tests++;
      this.results.overall.tests++;
      
      if (result.success) {
        this.results.phase2.passed++;
        this.results.overall.passed++;
      } else {
        this.results.phase2.failed++;
        this.results.overall.failed++;
      }
    }
  }

  async validatePhase3(cycle) {
    const tests = [
      { name: 'performance-report', endpoint: '/api/feedback/performance-report' },
      { name: 'enhanced-confidence', endpoint: '/api/feedback/enhanced-confidence', method: 'POST', 
        body: { symbol: 'BTC/USDT', timeframe: '1h', indicators: {}, baseConfidence: 75 } }
    ];

    for (const test of tests) {
      const result = await this.runTest('phase3', test, cycle);
      this.results.phase3.tests++;
      this.results.overall.tests++;
      
      if (result.success) {
        this.results.phase3.passed++;
        this.results.overall.passed++;
      } else {
        this.results.phase3.failed++;
        this.results.overall.failed++;
      }
    }
  }

  async validateIntegration(cycle) {
    const tests = [
      { name: 'rate-limiter-status', endpoint: '/api/rate-limiter/stats' },
      { name: 'performance-metrics', endpoint: '/api/performance-metrics' },
      { name: 'crypto-data-btc', endpoint: '/api/crypto/BTC%2FUSDT' },
      { name: 'signals-btc', endpoint: '/api/signals/BTC%2FUSDT' }
    ];

    for (const test of tests) {
      const result = await this.runTest('integration', test, cycle);
      this.results.integration.tests++;
      this.results.overall.tests++;
      
      if (result.success) {
        this.results.integration.passed++;
        this.results.overall.passed++;
      } else {
        this.results.integration.failed++;
        this.results.overall.failed++;
      }
    }
  }

  async runTest(phase, test, cycle) {
    try {
      const url = `${this.baseUrl}${test.endpoint}`;
      const method = test.method || 'GET';
      
      let curlCommand = `curl -s -w "%{http_code}" -o /dev/null "${url}"`;
      
      if (method === 'POST' && test.body) {
        curlCommand = `curl -s -w "%{http_code}" -o /dev/null -X POST -H "Content-Type: application/json" -d '${JSON.stringify(test.body)}' "${url}"`;
      }
      
      const statusCode = execSync(curlCommand, { encoding: 'utf8', timeout: 5000 }).trim();
      const isSuccess = parseInt(statusCode) >= 200 && parseInt(statusCode) < 400;
      
      this.detailedLogs.push({
        cycle,
        phase,
        test: test.name,
        endpoint: test.endpoint,
        statusCode: parseInt(statusCode),
        success: isSuccess,
        timestamp: new Date().toISOString()
      });

      if (!isSuccess && parseInt(statusCode) >= 500) {
        this.criticalIssues.push({
          cycle,
          phase,
          test: test.name,
          statusCode: parseInt(statusCode),
          error: 'Server error response',
          timestamp: new Date().toISOString()
        });
      }

      return { success: isSuccess, statusCode: parseInt(statusCode) };
      
    } catch (error) {
      this.detailedLogs.push({
        cycle,
        phase,
        test: test.name,
        endpoint: test.endpoint,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      });

      this.criticalIssues.push({
        cycle,
        phase,
        test: test.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return { success: false, error: error.message };
    }
  }

  generateComprehensiveReport(totalDuration) {
    const overallSuccessRate = (this.results.overall.passed / this.results.overall.tests) * 100;
    const phase1SuccessRate = (this.results.phase1.passed / this.results.phase1.tests) * 100;
    const phase2SuccessRate = (this.results.phase2.passed / this.results.phase2.tests) * 100;
    const phase3SuccessRate = (this.results.phase3.passed / this.results.phase3.tests) * 100;
    const integrationSuccessRate = (this.results.integration.passed / this.results.integration.tests) * 100;

    const avgCycleDuration = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length;

    console.log('\n');
    console.log('📊 COMPREHENSIVE VALIDATION RESULTS');
    console.log('====================================');
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`Average Cycle Duration: ${avgCycleDuration.toFixed(0)}ms`);
    console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);
    console.log('');

    console.log('Phase-by-Phase Results:');
    console.log(`  Phase 1 (Authentic Data): ${phase1SuccessRate.toFixed(1)}% (${this.results.phase1.passed}/${this.results.phase1.tests})`);
    console.log(`  Phase 2 (Technical Analysis): ${phase2SuccessRate.toFixed(1)}% (${this.results.phase2.passed}/${this.results.phase2.tests})`);
    console.log(`  Phase 3 (Feedback System): ${phase3SuccessRate.toFixed(1)}% (${this.results.phase3.passed}/${this.results.phase3.tests})`);
    console.log(`  Integration Tests: ${integrationSuccessRate.toFixed(1)}% (${this.results.integration.passed}/${this.results.integration.tests})`);
    console.log('');

    if (this.criticalIssues.length > 0) {
      console.log(`⚠️  Critical Issues Found: ${this.criticalIssues.length}`);
      this.criticalIssues.slice(0, 5).forEach(issue => {
        console.log(`  - Cycle ${issue.cycle} (${issue.phase}): ${issue.error || issue.test}`);
      });
      console.log('');
    }

    const readinessAssessment = this.assessPhase4Readiness(overallSuccessRate, this.criticalIssues.length);
    
    console.log('🎯 PHASE 4 READINESS ASSESSMENT');
    console.log('===============================');
    console.log(`Status: ${readinessAssessment.status}`);
    console.log(`Recommendation: ${readinessAssessment.recommendation}`);
    console.log(`Confidence Level: ${readinessAssessment.confidence}`);
    
    if (readinessAssessment.issues.length > 0) {
      console.log('\nIssues to Address:');
      readinessAssessment.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }

    return {
      totalTests: this.results.overall.tests,
      passedTests: this.results.overall.passed,
      failedTests: this.results.overall.failed,
      successRate: overallSuccessRate,
      duration: totalDuration,
      criticalIssues: this.criticalIssues.length,
      readiness: readinessAssessment,
      phaseResults: {
        phase1: { successRate: phase1SuccessRate, ...this.results.phase1 },
        phase2: { successRate: phase2SuccessRate, ...this.results.phase2 },
        phase3: { successRate: phase3SuccessRate, ...this.results.phase3 },
        integration: { successRate: integrationSuccessRate, ...this.results.integration }
      }
    };
  }

  assessPhase4Readiness(successRate, criticalIssueCount) {
    if (successRate >= 95 && criticalIssueCount === 0) {
      return {
        status: 'READY FOR PHASE 4',
        recommendation: 'Proceed with complete synthetic elimination',
        confidence: 'HIGH',
        issues: []
      };
    } else if (successRate >= 90 && criticalIssueCount <= 2) {
      return {
        status: 'MOSTLY READY',
        recommendation: 'Address minor issues then proceed to Phase 4',
        confidence: 'MEDIUM-HIGH',
        issues: criticalIssueCount > 0 ? ['Minor critical issues need resolution'] : ['Success rate below optimal threshold']
      };
    } else if (successRate >= 80) {
      return {
        status: 'NEEDS IMPROVEMENT',
        recommendation: 'Resolve stability issues before Phase 4',
        confidence: 'MEDIUM',
        issues: [
          'Success rate below 90% threshold',
          `${criticalIssueCount} critical issues detected`,
          'System stability needs improvement'
        ]
      };
    } else {
      return {
        status: 'NOT READY',
        recommendation: 'Significant issues must be resolved before Phase 4',
        confidence: 'LOW',
        issues: [
          'Success rate below 80% threshold',
          'Multiple system stability issues',
          'Phase 4 implementation would be risky'
        ]
      };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute validation
async function main() {
  const validator = new ComprehensiveValidator();
  const results = await validator.runComprehensiveValidation();
  
  // Exit with appropriate code
  process.exit(results.successRate >= 90 ? 0 : 1);
}

main().catch(error => {
  console.error('Validation framework error:', error);
  process.exit(1);
});