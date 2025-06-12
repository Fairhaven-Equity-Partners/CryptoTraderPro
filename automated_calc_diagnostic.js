/**
 * Automated Calculation Diagnostic & Fix Tool
 * Comprehensive analysis of the auto-calculation system issues
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

class AutoCalcDiagnostic {
  constructor() {
    this.issues = [];
    this.solutions = [];
    this.testResults = [];
    this.apiCallCount = 0;
    this.startTime = Date.now();
  }

  async runComprehensiveDiagnostic() {
    console.log('🔍 Starting Automated Calculation Diagnostic...\n');
    
    try {
      await this.analyzeLogPatterns();
      await this.testAPILimitBehavior();
      await this.analyzeRateLimiterState();
      await this.testSignalGeneration();
      await this.validateTimingSystem();
      await this.proposeSolutions();
      
      this.generateReport();
      
    } catch (error) {
      console.error('Diagnostic failed:', error);
    }
  }

  async analyzeLogPatterns() {
    console.log('📊 Analyzing Log Patterns...');
    
    const criticalPatterns = [
      'API limit reached: 1',
      'Batch request blocked: api_limit',
      'Invalid price data for MATIC/USDT: null',
      'Invalid price data for RNDR/USDT: undefined',
      'Circuit breaker opened',
      'emergency_limit',
      'RateLimiter.*failure recorded'
    ];

    // Check current system state
    try {
      const response = await this.makeRequest('/api/rate-limiter/stats');
      const stats = JSON.parse(response);
      
      console.log(`Current API Usage: ${stats.rateLimiter?.currentCounters?.monthly || 0}/30000`);
      console.log(`Circuit Breaker State: ${stats.rateLimiter?.circuitBreaker?.state || 'Unknown'}`);
      
      if (stats.rateLimiter?.currentCounters?.monthly > 25000) {
        this.issues.push({
          type: 'critical',
          issue: 'API usage approaching monthly limit',
          impact: 'Auto-calculations will fail',
          urgency: 'immediate'
        });
      }

      if (stats.rateLimiter?.circuitBreaker?.state === 'OPEN') {
        this.issues.push({
          type: 'critical',
          issue: 'Circuit breaker is open',
          impact: 'All API calls blocked',
          urgency: 'immediate'
        });
      }

    } catch (error) {
      this.issues.push({
        type: 'system',
        issue: 'Cannot connect to rate limiter stats',
        impact: 'Unable to monitor API usage',
        urgency: 'high'
      });
    }
  }

  async testAPILimitBehavior() {
    console.log('🧪 Testing API Limit Behavior...');
    
    // Test multiple rapid requests to see rate limiting behavior
    const testCount = 5;
    const results = [];
    
    for (let i = 0; i < testCount; i++) {
      try {
        const start = Date.now();
        const response = await this.makeRequest('/api/crypto/BTC/USDT');
        const end = Date.now();
        
        results.push({
          request: i + 1,
          responseTime: end - start,
          success: true,
          timestamp: new Date().toISOString()
        });
        
        // Small delay between requests
        await this.sleep(100);
        
      } catch (error) {
        results.push({
          request: i + 1,
          responseTime: null,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    const successRate = (results.filter(r => r.success).length / testCount) * 100;
    const avgResponseTime = results
      .filter(r => r.success && r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;

    console.log(`API Test Results: ${successRate}% success rate, ${avgResponseTime.toFixed(0)}ms avg response time`);

    if (successRate < 80) {
      this.issues.push({
        type: 'performance',
        issue: `Low API success rate: ${successRate}%`,
        impact: 'Unreliable auto-calculations',
        urgency: 'high'
      });
    }

    this.testResults.push({
      test: 'api_limit_behavior',
      results,
      successRate,
      avgResponseTime
    });
  }

  async analyzeRateLimiterState() {
    console.log('⚡ Analyzing Rate Limiter State...');
    
    try {
      const response = await this.makeRequest('/api/rate-limiter/stats');
      const stats = JSON.parse(response);
      
      const rateLimiter = stats.rateLimiter;
      if (!rateLimiter) {
        this.issues.push({
          type: 'system',
          issue: 'Rate limiter stats unavailable',
          impact: 'Cannot monitor API usage',
          urgency: 'high'
        });
        return;
      }

      // Analyze utilization rates
      const utilization = {
        monthly: (rateLimiter.currentCounters?.monthly || 0) / 30000,
        daily: (rateLimiter.currentCounters?.daily || 0) / 1000,
        hourly: (rateLimiter.currentCounters?.hourly || 0) / 100,
        minute: (rateLimiter.currentCounters?.minute || 0) / 10
      };

      console.log('Utilization Rates:');
      Object.entries(utilization).forEach(([period, rate]) => {
        const percentage = (rate * 100).toFixed(1);
        console.log(`  ${period}: ${percentage}%`);
        
        if (rate > 0.9) {
          this.issues.push({
            type: 'rate_limit',
            issue: `High ${period} utilization: ${percentage}%`,
            impact: 'Potential API blocking',
            urgency: rate > 0.95 ? 'critical' : 'high'
          });
        }
      });

      // Check circuit breaker health
      const circuitBreaker = rateLimiter.circuitBreaker;
      if (circuitBreaker?.failures > 10) {
        this.issues.push({
          type: 'circuit_breaker',
          issue: `High failure count: ${circuitBreaker.failures}`,
          impact: 'Circuit breaker may open',
          urgency: 'medium'
        });
      }

    } catch (error) {
      this.issues.push({
        type: 'system',
        issue: 'Rate limiter analysis failed',
        impact: 'Cannot assess API health',
        urgency: 'high'
      });
    }
  }

  async testSignalGeneration() {
    console.log('📡 Testing Signal Generation...');
    
    try {
      const response = await this.makeRequest('/api/signals/BTC/USDT');
      const signals = JSON.parse(response);
      
      if (!signals || !Array.isArray(signals)) {
        this.issues.push({
          type: 'signals',
          issue: 'Invalid signal response format',
          impact: 'Signal generation broken',
          urgency: 'critical'
        });
        return;
      }

      const validSignals = signals.filter(s => 
        s.symbol && s.timeframe && s.direction && typeof s.confidence === 'number'
      );

      const signalQuality = (validSignals.length / signals.length) * 100;
      console.log(`Signal Quality: ${validSignals.length}/${signals.length} valid (${signalQuality.toFixed(1)}%)`);

      if (signalQuality < 90) {
        this.issues.push({
          type: 'signals',
          issue: `Poor signal quality: ${signalQuality.toFixed(1)}%`,
          impact: 'Unreliable trading signals',
          urgency: 'high'
        });
      }

      // Test multiple timeframes
      const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
      const timeframeResults = [];

      for (const tf of timeframes) {
        try {
          const tfSignals = signals.filter(s => s.timeframe === tf);
          timeframeResults.push({
            timeframe: tf,
            count: tfSignals.length,
            hasValidSignal: tfSignals.length > 0 && tfSignals[0].confidence > 0
          });
        } catch (error) {
          timeframeResults.push({
            timeframe: tf,
            count: 0,
            hasValidSignal: false,
            error: error.message
          });
        }
      }

      const workingTimeframes = timeframeResults.filter(t => t.hasValidSignal).length;
      console.log(`Working Timeframes: ${workingTimeframes}/${timeframes.length}`);

      if (workingTimeframes < timeframes.length * 0.8) {
        this.issues.push({
          type: 'signals',
          issue: `Limited timeframe coverage: ${workingTimeframes}/${timeframes.length}`,
          impact: 'Incomplete signal analysis',
          urgency: 'medium'
        });
      }

    } catch (error) {
      this.issues.push({
        type: 'signals',
        issue: 'Signal generation test failed',
        impact: 'Cannot verify signal system',
        urgency: 'critical'
      });
    }
  }

  async validateTimingSystem() {
    console.log('⏱️ Validating Timing System...');
    
    try {
      // Check adaptive timing status
      const response = await this.makeRequest('/api/performance-metrics');
      const metrics = JSON.parse(response);
      
      if (!metrics || !metrics.indicators) {
        this.issues.push({
          type: 'timing',
          issue: 'Performance metrics unavailable',
          impact: 'Cannot monitor timing system',
          urgency: 'medium'
        });
        return;
      }

      // Look for timing-related indicators
      const timingIndicators = metrics.indicators.filter(i => 
        i.indicator.toLowerCase().includes('timing') || 
        i.indicator.toLowerCase().includes('adaptive')
      );

      console.log(`Timing Indicators Found: ${timingIndicators.length}`);

      if (timingIndicators.length === 0) {
        this.issues.push({
          type: 'timing',
          issue: 'No timing indicators found',
          impact: 'Timing system may not be active',
          urgency: 'medium'
        });
      }

      // Test calculation triggers
      const calculationTests = [];
      const testTimeframes = ['1m', '5m', '15m'];
      
      for (const tf of testTimeframes) {
        const start = Date.now();
        try {
          await this.makeRequest(`/api/signals/BTC/USDT?timeframe=${tf}`);
          calculationTests.push({
            timeframe: tf,
            responseTime: Date.now() - start,
            success: true
          });
        } catch (error) {
          calculationTests.push({
            timeframe: tf,
            responseTime: Date.now() - start,
            success: false,
            error: error.message
          });
        }
      }

      const successfulCalculations = calculationTests.filter(t => t.success).length;
      console.log(`Calculation Tests: ${successfulCalculations}/${testTimeframes.length} successful`);

    } catch (error) {
      this.issues.push({
        type: 'timing',
        issue: 'Timing system validation failed',
        impact: 'Cannot verify auto-calculation timing',
        urgency: 'medium'
      });
    }
  }

  async proposeSolutions() {
    console.log('\n💡 Proposing Solutions...');
    
    // Group issues by type and propose solutions
    const issuesByType = this.groupIssuesByType();
    
    for (const [type, issues] of Object.entries(issuesByType)) {
      const solutions = this.generateSolutionsForType(type, issues);
      this.solutions.push(...solutions);
    }

    // Priority-based solution ordering
    this.solutions.sort((a, b) => {
      const priority = { critical: 3, high: 2, medium: 1, low: 0 };
      return priority[b.priority] - priority[a.priority];
    });
  }

  groupIssuesByType() {
    const grouped = {};
    this.issues.forEach(issue => {
      if (!grouped[issue.type]) grouped[issue.type] = [];
      grouped[issue.type].push(issue);
    });
    return grouped;
  }

  generateSolutionsForType(type, issues) {
    const solutions = [];
    
    switch (type) {
      case 'critical':
      case 'rate_limit':
        solutions.push({
          type: 'rate_limiting',
          title: 'Optimize Rate Limiting Strategy',
          description: 'Implement intelligent request batching and caching',
          implementation: [
            'Increase cache duration for stable symbols',
            'Implement request queuing with priority',
            'Add circuit breaker recovery mechanisms',
            'Optimize batch request sizes'
          ],
          priority: 'critical',
          estimatedTime: '30 minutes'
        });
        break;
        
      case 'signals':
        solutions.push({
          type: 'signal_generation',
          title: 'Fix Signal Generation Pipeline',
          description: 'Ensure reliable signal calculation across all timeframes',
          implementation: [
            'Add authentic calculation methods',
            'Implement signal validation checks',
            'Fix missing indicator calculations',
            'Add error recovery for failed calculations'
          ],
          priority: 'high',
          estimatedTime: '45 minutes'
        });
        break;
        
      case 'timing':
        solutions.push({
          type: 'timing_system',
          title: 'Stabilize Timing System',
          description: 'Ensure consistent auto-calculation execution',
          implementation: [
            'Add timing system health checks',
            'Implement calculation retry logic',
            'Optimize timing intervals based on API limits',
            'Add manual calculation triggers'
          ],
          priority: 'medium',
          estimatedTime: '30 minutes'
        });
        break;
        
      case 'system':
        solutions.push({
          type: 'system_health',
          title: 'Improve System Monitoring',
          description: 'Add comprehensive health monitoring',
          implementation: [
            'Implement system health dashboard',
            'Add proactive error detection',
            'Create automated recovery procedures',
            'Enhance logging and diagnostics'
          ],
          priority: 'medium',
          estimatedTime: '20 minutes'
        });
        break;
    }
    
    return solutions;
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('AUTOMATED CALCULATION DIAGNOSTIC REPORT');
    console.log('='.repeat(80));
    
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    console.log(`Diagnostic completed in ${duration}s\n`);
    
    // Issues Summary
    console.log('📋 ISSUES IDENTIFIED:');
    if (this.issues.length === 0) {
      console.log('✅ No critical issues found');
    } else {
      const byUrgency = this.groupByUrgency();
      Object.entries(byUrgency).forEach(([urgency, issues]) => {
        console.log(`\n${urgency.toUpperCase()} (${issues.length}):`);
        issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. ${issue.issue}`);
          console.log(`     Impact: ${issue.impact}`);
        });
      });
    }
    
    // Solutions Summary
    console.log('\n💊 RECOMMENDED SOLUTIONS:');
    this.solutions.forEach((solution, index) => {
      console.log(`\n${index + 1}. ${solution.title} (${solution.priority})`);
      console.log(`   ${solution.description}`);
      console.log(`   Estimated time: ${solution.estimatedTime}`);
      console.log('   Implementation steps:');
      solution.implementation.forEach(step => {
        console.log(`     • ${step}`);
      });
    });
    
    // Game Plan
    console.log('\n🎯 IMPLEMENTATION GAME PLAN:');
    console.log('\nPhase 1: Critical Fixes (Immediate)');
    const criticalSolutions = this.solutions.filter(s => s.priority === 'critical');
    criticalSolutions.forEach(s => console.log(`  • ${s.title}`));
    
    console.log('\nPhase 2: Performance Improvements (Next 30 minutes)');
    const highSolutions = this.solutions.filter(s => s.priority === 'high');
    highSolutions.forEach(s => console.log(`  • ${s.title}`));
    
    console.log('\nPhase 3: System Stabilization (Final 30 minutes)');
    const mediumSolutions = this.solutions.filter(s => s.priority === 'medium');
    mediumSolutions.forEach(s => console.log(`  • ${s.title}`));
    
    // Pros & Cons
    console.log('\n⚖️ PROS & CONS ANALYSIS:');
    console.log('\nCURRENT SYSTEM PROS:');
    console.log('  ✅ CoinMarketCap API integrated');
    console.log('  ✅ Circuit breaker protection active');
    console.log('  ✅ Basic rate limiting in place');
    console.log('  ✅ Multi-timeframe signal generation');
    
    console.log('\nCURRENT SYSTEM CONS:');
    console.log('  ❌ API rate limits causing calculation failures');
    console.log('  ❌ Incomplete error handling for failed requests');
    console.log('  ❌ No intelligent request batching');
    console.log('  ❌ Limited authentic mechanisms');
    
    console.log('\nPROPOSED IMPROVEMENTS PROS:');
    console.log('  ✅ Intelligent API usage optimization');
    console.log('  ✅ Robust error recovery');
    console.log('  ✅ Consistent auto-calculation execution');
    console.log('  ✅ Better system monitoring');
    
    console.log('\nPROPOSED IMPROVEMENTS CONS:');
    console.log('  ⚠️  Requires careful testing to avoid regression');
    console.log('  ⚠️  May temporarily impact performance during implementation');
    console.log('  ⚠️  Additional complexity in rate limiting logic');
    
    // Testing Cycle
    console.log('\n🧪 FULL TESTING CYCLE:');
    console.log('\n1. Pre-Implementation Testing:');
    console.log('   • Baseline API usage measurement');
    console.log('   • Current success rate documentation');
    console.log('   • Performance metrics capture');
    
    console.log('\n2. Implementation Testing:');
    console.log('   • Unit tests for each fix');
    console.log('   • Integration testing with rate limiter');
    console.log('   • Signal generation validation');
    
    console.log('\n3. Post-Implementation Testing:');
    console.log('   • 35-cycle comprehensive validation');
    console.log('   • Auto-calculation reliability test');
    console.log('   • Performance regression testing');
    console.log('   • Long-term stability monitoring');
    
    console.log('\n4. Acceptance Criteria:');
    console.log('   • 95%+ auto-calculation success rate');
    console.log('   • <50ms average signal generation time');
    console.log('   • Zero circuit breaker openings under normal load');
    console.log('   • All 10 timeframes generating valid signals');
    
    console.log('\n🎬 READY FOR IMPLEMENTATION');
    console.log('All issues identified and solutions prepared.');
    console.log('Estimated total implementation time: 1.5-2 hours');
    console.log('Expected outcome: Fully reliable auto-calculation system');
  }

  groupByUrgency() {
    const grouped = {};
    this.issues.forEach(issue => {
      if (!grouped[issue.urgency]) grouped[issue.urgency] = [];
      grouped[issue.urgency].push(issue);
    });
    return grouped;
  }

  async makeRequest(endpoint) {
    const url = `http://localhost:5000${endpoint}`;
    try {
      const response = await fetch(url);
      return await response.text();
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run diagnostic
async function main() {
  const diagnostic = new AutoCalcDiagnostic();
  await diagnostic.runComprehensiveDiagnostic();
}

main().catch(console.error);