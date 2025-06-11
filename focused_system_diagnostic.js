/**
 * Focused System Diagnostic Tool
 * Lightweight analysis with rate limit protection
 */

import { execSync } from 'child_process';

class FocusedDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.issues = [];
    this.fixes = [];
  }

  async runDiagnostic() {
    console.log('🔍 FOCUSED SYSTEM DIAGNOSTIC');
    console.log('============================');

    await this.checkCoreSystem();
    await this.checkPerformanceMetrics();
    await this.checkDataFlow();
    await this.checkAPIHealth();

    return this.generateFixPlan();
  }

  async checkCoreSystem() {
    console.log('\n📊 Core System Health');
    console.log('---------------------');

    try {
      const result = await this.makeRequest('/api/automation/status');
      if (result && result.isRunning) {
        console.log('✓ Automation system active');
      } else {
        this.issues.push('Automation system not running properly');
      }
    } catch (error) {
      this.issues.push(`Core system error: ${error.message}`);
    }
  }

  async checkPerformanceMetrics() {
    console.log('\n📈 Performance Metrics Analysis');
    console.log('-------------------------------');

    try {
      const result = await this.makeRequest('/api/performance-metrics');
      
      if (!result || !result.indicators) {
        this.issues.push('Performance metrics endpoint returning no data');
        this.fixes.push('Fix performance metrics data structure');
        return;
      }

      // Check indicator completeness
      const expectedIndicators = ['MACD', 'RSI', 'Bollinger Bands', 'SMA Cross', 'EMA Cross'];
      const missingIndicators = [];

      for (const expected of expectedIndicators) {
        const found = result.indicators.find(ind => ind.indicator === expected);
        if (!found) {
          missingIndicators.push(expected);
        } else {
          // Check data quality
          if (!found.accuracyRate || found.accuracyRate < 0) {
            this.issues.push(`Invalid accuracy rate for ${expected}`);
          }
          if (!found.totalPredictions || found.totalPredictions < 0) {
            this.issues.push(`Invalid prediction count for ${expected}`);
          }
        }
      }

      if (missingIndicators.length > 0) {
        this.issues.push(`Missing indicators: ${missingIndicators.join(', ')}`);
        this.fixes.push('Complete indicator data population');
      }

      console.log(`✓ Found ${result.indicators.length} indicators`);
      console.log(`${missingIndicators.length > 0 ? '⚠' : '✓'} Indicator completeness: ${expectedIndicators.length - missingIndicators.length}/${expectedIndicators.length}`);

    } catch (error) {
      this.issues.push(`Performance metrics error: ${error.message}`);
      this.fixes.push('Repair performance metrics endpoint');
    }
  }

  async checkDataFlow() {
    console.log('\n🔄 Data Flow Validation');
    console.log('-----------------------');

    try {
      const authStatus = await this.makeRequest('/api/authentic-data/status');
      if (authStatus && authStatus.system) {
        console.log(`✓ Authentic data: ${authStatus.system.totalSymbols} symbols`);
      } else {
        this.issues.push('Authentic data system not responding');
      }

      const rateLimiter = await this.makeRequest('/api/rate-limiter/stats');
      if (rateLimiter) {
        console.log(`✓ Rate limiter active: ${rateLimiter.requestCount || 0} requests`);
      }

    } catch (error) {
      this.issues.push(`Data flow error: ${error.message}`);
    }
  }

  async checkAPIHealth() {
    console.log('\n🔗 API Health Check');
    console.log('-------------------');

    try {
      const timing = await this.makeRequest('/api/timing/metrics');
      if (timing && timing.adaptiveTiming) {
        console.log('✓ Adaptive timing operational');
      } else {
        this.issues.push('Timing system not operational');
      }
    } catch (error) {
      this.issues.push(`API health error: ${error.message}`);
    }
  }

  async makeRequest(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    const curlCommand = `curl -s --max-time 5 "${url}"`;

    try {
      const result = execSync(curlCommand, { encoding: 'utf8', timeout: 5000 });
      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  generateFixPlan() {
    console.log('\n🔧 DIAGNOSTIC RESULTS');
    console.log('=====================');
    console.log(`Issues Identified: ${this.issues.length}`);
    console.log(`Fixes Required: ${this.fixes.length}`);

    if (this.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    if (this.fixes.length > 0) {
      console.log('\n🛠️  Recommended Fixes:');
      this.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix}`);
      });
    }

    // Generate specific performance metrics fix
    const hasPerformanceIssues = this.issues.some(issue => 
      issue.includes('performance') || issue.includes('indicator')
    );

    if (hasPerformanceIssues) {
      console.log('\n🎯 PERFORMANCE METRICS FIX REQUIRED');
      console.log('===================================');
      console.log('The performance analysis box is not receiving complete data');
      console.log('This requires server-side fixes to the performance metrics endpoint');
    }

    return {
      issuesFound: this.issues.length,
      fixesNeeded: this.fixes.length,
      performanceIssue: hasPerformanceIssues,
      systemHealthy: this.issues.length < 3
    };
  }
}

// Execute diagnostic
async function main() {
  const diagnostic = new FocusedDiagnostic();
  const results = await diagnostic.runDiagnostic();
  
  console.log('\n✅ DIAGNOSTIC COMPLETE');
  console.log('======================');
  
  process.exit(0);
}

main().catch(error => {
  console.error('Diagnostic error:', error);
  process.exit(1);
});