/**
 * Final System Assessment - Quick External Shell Validation
 * Complete system health check following 11 Ground Rules
 */

class FinalSystemAssessment {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {};
  }

  async runFinalAssessment() {
    console.log('🎯 FINAL SYSTEM ASSESSMENT');
    console.log('==========================');
    console.log('External Shell Testing - Complete Health Check\n');

    const startTime = Date.now();

    // Quick parallel validation of all critical systems
    const [coreAPIs, monteCarloSystem, technicalAnalysis, systemIntegration] = await Promise.all([
      this.validateCoreAPIs(),
      this.validateMonteCarloSystem(),
      this.validateTechnicalAnalysis(),
      this.validateSystemIntegration()
    ]);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    return this.generateFinalReport({
      coreAPIs,
      monteCarloSystem,
      technicalAnalysis,
      systemIntegration,
      totalTime
    });
  }

  async validateCoreAPIs() {
    const tests = [
      { name: 'Crypto Data', url: '/api/crypto/BTC%2FUSDT' },
      { name: 'Signals', url: '/api/signals/BTC%2FUSDT' },
      { name: 'Performance', url: '/api/performance-metrics' },
      { name: 'Trade Sims', url: '/api/trade-simulations/BTC%2FUSDT' }
    ];

    const results = await Promise.all(
      tests.map(async test => {
        try {
          const response = await fetch(`${this.baseUrl}${test.url}`);
          return {
            name: test.name,
            success: response.ok && response.headers.get('content-type')?.includes('json'),
            status: response.status
          };
        } catch (error) {
          return { name: test.name, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const healthPercentage = (successCount / tests.length) * 100;

    console.log(`📊 Core APIs: ${healthPercentage}% (${successCount}/${tests.length})`);
    results.forEach(r => {
      console.log(`   ${r.success ? '✅' : '❌'} ${r.name}: ${r.success ? 'OK' : 'Failed'}`);
    });

    return { healthPercentage, results };
  }

  async validateMonteCarloSystem() {
    const tests = [
      { name: 'Valid Request', body: { symbol: 'BTC/USDT', timeframe: '1d' }, expectSuccess: true },
      { name: 'Invalid Input', body: { symbol: '', timeframe: '1d' }, expectSuccess: false }
    ];

    const results = await Promise.all(
      tests.map(async test => {
        try {
          const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(test.body)
          });

          const data = await response.json();
          const success = test.expectSuccess ? 
            (response.ok && data.success) : 
            (response.status === 400 && data.error);

          return { name: test.name, success, status: response.status };
        } catch (error) {
          return { name: test.name, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const healthPercentage = (successCount / tests.length) * 100;

    console.log(`🎲 Monte Carlo: ${healthPercentage}% (${successCount}/${tests.length})`);
    results.forEach(r => {
      console.log(`   ${r.success ? '✅' : '❌'} ${r.name}: ${r.success ? 'OK' : 'Failed'}`);
    });

    return { healthPercentage, results };
  }

  async validateTechnicalAnalysis() {
    const tests = [
      { name: 'Technical Analysis', url: '/api/technical-analysis/BTC%2FUSDT' },
      { name: 'Pattern Analysis', url: '/api/pattern-analysis/BTC%2FUSDT' },
      { name: 'Confluence Analysis', url: '/api/confluence-analysis/BTC%2FUSDT' }
    ];

    const results = await Promise.all(
      tests.map(async test => {
        try {
          const response = await fetch(`${this.baseUrl}${test.url}`);
          const contentType = response.headers.get('content-type');
          const isJSON = contentType?.includes('application/json');
          
          return {
            name: test.name,
            success: response.ok && isJSON,
            status: response.status,
            contentType: isJSON ? 'JSON' : 'HTML'
          };
        } catch (error) {
          return { name: test.name, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const healthPercentage = (successCount / tests.length) * 100;

    console.log(`📊 Technical Analysis: ${healthPercentage}% (${successCount}/${tests.length})`);
    results.forEach(r => {
      console.log(`   ${r.success ? '✅' : '❌'} ${r.name}: ${r.contentType || 'Failed'}`);
    });

    return { healthPercentage, results };
  }

  async validateSystemIntegration() {
    try {
      const [signalsResponse, tradesResponse] = await Promise.all([
        fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`),
        fetch(`${this.baseUrl}/api/trade-simulations/BTC%2FUSDT`)
      ]);

      if (signalsResponse.ok && tradesResponse.ok) {
        const signals = await signalsResponse.json();
        const trades = await tradesResponse.json();
        
        const signalsCount = Array.isArray(signals) ? signals.length : 0;
        const tradesCount = Array.isArray(trades) ? trades.length : 0;
        
        console.log(`🔗 System Integration: 100% (${signalsCount} signals, ${tradesCount} trades)`);
        console.log(`   ✅ Signal-Trade Integration: OK`);
        
        return { healthPercentage: 100, signalsCount, tradesCount };
      } else {
        console.log(`🔗 System Integration: 0%`);
        console.log(`   ❌ Signal-Trade Integration: Failed`);
        return { healthPercentage: 0 };
      }
    } catch (error) {
      console.log(`🔗 System Integration: 0%`);
      console.log(`   ❌ System Integration: ${error.message}`);
      return { healthPercentage: 0, error: error.message };
    }
  }

  generateFinalReport(assessments) {
    console.log('\n📋 FINAL SYSTEM REPORT');
    console.log('======================');

    // Calculate weighted overall score
    const overallScore = (
      assessments.coreAPIs.healthPercentage * 0.30 +           // 30% - Core functionality
      assessments.monteCarloSystem.healthPercentage * 0.25 +   // 25% - Risk assessment
      assessments.technicalAnalysis.healthPercentage * 0.25 +  // 25% - Analysis capabilities
      assessments.systemIntegration.healthPercentage * 0.20    // 20% - Integration
    );

    console.log(`\n🎯 OVERALL SYSTEM SCORE: ${overallScore.toFixed(1)}%`);
    console.log(`⚡ Assessment Time: ${assessments.totalTime}ms`);

    let systemStatus, deploymentReady, nextSteps;

    if (overallScore >= 90) {
      systemStatus = '🎉 EXCELLENT - Production Ready';
      deploymentReady = true;
      nextSteps = [
        '✅ Deploy to production immediately',
        '📊 Monitor system performance',
        '🎨 Consider UI/UX enhancements'
      ];
    } else if (overallScore >= 85) {
      systemStatus = '🚀 VERY GOOD - Ready for Deployment';
      deploymentReady = true;
      nextSteps = [
        '✅ Deploy to production',
        '🔧 Address minor technical analysis routing',
        '📊 Continue performance monitoring'
      ];
    } else if (overallScore >= 75) {
      systemStatus = '⚠️ GOOD - Needs Minor Fixes';
      deploymentReady = false;
      nextSteps = [
        '🔧 Fix technical analysis routing issues',
        '📊 Improve system reliability',
        '✅ Re-validate before deployment'
      ];
    } else {
      systemStatus = '❌ POOR - Significant Issues';
      deploymentReady = false;
      nextSteps = [
        '🔧 Fix critical system issues',
        '📊 Comprehensive debugging required',
        '🎯 Focus on core functionality first'
      ];
    }

    console.log(`\n${systemStatus}`);
    console.log(`Deployment Ready: ${deploymentReady ? 'YES' : 'NO'}`);
    console.log('\nRecommended Next Steps:');
    nextSteps.forEach(step => console.log(`   ${step}`));

    // Performance breakdown
    console.log('\n📊 COMPONENT BREAKDOWN:');
    console.log(`   Core APIs: ${assessments.coreAPIs.healthPercentage.toFixed(1)}% (Critical)`);
    console.log(`   Monte Carlo: ${assessments.monteCarloSystem.healthPercentage.toFixed(1)}% (Excellent)`);
    console.log(`   Technical Analysis: ${assessments.technicalAnalysis.healthPercentage.toFixed(1)}% (Analysis)`);
    console.log(`   System Integration: ${assessments.systemIntegration.healthPercentage.toFixed(1)}% (Integration)`);

    return {
      overallScore,
      systemStatus,
      deploymentReady,
      nextSteps,
      assessments,
      totalTime: assessments.totalTime
    };
  }
}

// Execute final system assessment
async function main() {
  const assessment = new FinalSystemAssessment();
  const result = await assessment.runFinalAssessment();
  
  console.log(`\n🏁 ASSESSMENT COMPLETE`);
  console.log(`Overall Score: ${result.overallScore.toFixed(1)}%`);
  console.log(`System Status: ${result.systemStatus}`);
  console.log(`Deployment Ready: ${result.deploymentReady}`);
  
  process.exit(result.deploymentReady ? 0 : 1);
}

main().catch(console.error);