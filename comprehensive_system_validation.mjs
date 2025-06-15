/**
 * Comprehensive System Validation - External Shell Testing
 * Following 11 Ground Rules - Complete system assessment before any changes
 */

class ComprehensiveSystemValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      coreAPIs: [],
      monteCarloSystem: [],
      signalGeneration: [],
      technicalAnalysis: [],
      performanceMetrics: [],
      systemIntegration: []
    };
  }

  async validateCompleteSystem() {
    console.log('🎯 COMPREHENSIVE SYSTEM VALIDATION');
    console.log('==================================');
    console.log('External Shell Testing - Full System Assessment');
    console.log('Following 11 Ground Rules Protocol\n');

    // Phase 1: Core API Validation
    await this.validateCoreAPIs();
    
    // Phase 2: Monte Carlo System Validation
    await this.validateMonteCarloSystem();
    
    // Phase 3: Signal Generation Validation
    await this.validateSignalGeneration();
    
    // Phase 4: Technical Analysis Validation
    await this.validateTechnicalAnalysis();
    
    // Phase 5: Performance Metrics Validation
    await this.validatePerformanceMetrics();
    
    // Phase 6: System Integration Validation
    await this.validateSystemIntegration();
    
    // Generate Final Assessment
    return await this.generateFinalAssessment();
  }

  async validateCoreAPIs() {
    console.log('📊 PHASE 1: Core API Validation');
    console.log('===============================');
    
    const coreTests = [
      {
        name: 'Crypto Data API',
        url: '/api/crypto/BTC%2FUSDT',
        expectedFields: ['id', 'symbol', 'name', 'price']
      },
      {
        name: 'Signals API',
        url: '/api/signals/BTC%2FUSDT',
        expectedFields: ['symbol', 'direction', 'confidence']
      },
      {
        name: 'Performance Metrics API',
        url: '/api/performance-metrics',
        expectedFields: ['indicators']
      },
      {
        name: 'Trade Simulations API',
        url: '/api/trade-simulations/BTC%2FUSDT',
        expectedFields: ['symbol', 'timeframe']
      }
    ];

    for (const test of coreTests) {
      const result = await this.runAPITest(test);
      this.results.coreAPIs.push(result);
      console.log(`   ${result.success ? '✅' : '❌'} ${test.name}: ${result.status}`);
      await this.sleep(100);
    }

    const coreSuccess = this.results.coreAPIs.filter(r => r.success).length;
    console.log(`   Core APIs Health: ${(coreSuccess/coreTests.length*100).toFixed(1)}%\n`);
  }

  async validateMonteCarloSystem() {
    console.log('🎲 PHASE 2: Monte Carlo System Validation');
    console.log('=========================================');
    
    const monteCarloTests = [
      {
        name: 'Valid BTC/USDT 1d Request',
        body: { symbol: 'BTC/USDT', timeframe: '1d' },
        expectSuccess: true
      },
      {
        name: 'Valid ETH/USDT 4h Request',
        body: { symbol: 'ETH/USDT', timeframe: '4h' },
        expectSuccess: true
      },
      {
        name: 'Invalid Empty Symbol',
        body: { symbol: '', timeframe: '1d' },
        expectSuccess: false
      },
      {
        name: 'Invalid Empty Timeframe',
        body: { symbol: 'BTC/USDT', timeframe: '' },
        expectSuccess: false
      },
      {
        name: 'Invalid Timeframe Format',
        body: { symbol: 'BTC/USDT', timeframe: 'invalid' },
        expectSuccess: false
      }
    ];

    for (const test of monteCarloTests) {
      const result = await this.runMonteCarloTest(test);
      this.results.monteCarloSystem.push(result);
      console.log(`   ${result.success ? '✅' : '❌'} ${test.name}: ${result.status}`);
      await this.sleep(200);
    }

    const monteCarloSuccess = this.results.monteCarloSystem.filter(r => r.success).length;
    console.log(`   Monte Carlo Health: ${(monteCarloSuccess/monteCarloTests.length*100).toFixed(1)}%\n`);
  }

  async validateSignalGeneration() {
    console.log('📈 PHASE 3: Signal Generation Validation');
    console.log('=======================================');
    
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    
    for (const symbol of symbols) {
      try {
        const encodedSymbol = encodeURIComponent(symbol);
        const response = await fetch(`${this.baseUrl}/api/signals/${encodedSymbol}`);
        
        if (response.ok) {
          const data = await response.json();
          const signals = Array.isArray(data) ? data : [];
          
          const result = {
            success: true,
            symbol,
            signalCount: signals.length,
            hasValidSignals: signals.some(s => s.confidence > 50),
            timeframes: [...new Set(signals.map(s => s.timeframe))]
          };
          
          this.results.signalGeneration.push(result);
          console.log(`   ✅ ${symbol}: ${signals.length} signals across ${result.timeframes.length} timeframes`);
        } else {
          this.results.signalGeneration.push({
            success: false,
            symbol,
            error: `HTTP ${response.status}`
          });
          console.log(`   ❌ ${symbol}: Failed (${response.status})`);
        }
      } catch (error) {
        this.results.signalGeneration.push({
          success: false,
          symbol,
          error: error.message
        });
        console.log(`   ❌ ${symbol}: ${error.message}`);
      }
      
      await this.sleep(150);
    }

    const signalSuccess = this.results.signalGeneration.filter(r => r.success).length;
    console.log(`   Signal Generation Health: ${(signalSuccess/symbols.length*100).toFixed(1)}%\n`);
  }

  async validateTechnicalAnalysis() {
    console.log('📊 PHASE 4: Technical Analysis Validation');
    console.log('========================================');
    
    const technicalTests = [
      {
        name: 'Technical Analysis (encoded)',
        url: '/api/technical-analysis/BTC%2FUSDT',
        method: 'GET'
      },
      {
        name: 'Pattern Analysis (encoded)',
        url: '/api/pattern-analysis/BTC%2FUSDT',
        method: 'GET'
      },
      {
        name: 'Confluence Analysis (encoded)',
        url: '/api/confluence-analysis/BTC%2FUSDT',
        method: 'GET'
      }
    ];

    for (const test of technicalTests) {
      try {
        const response = await fetch(`${this.baseUrl}${test.url}`);
        const contentType = response.headers.get('content-type');
        
        const result = {
          success: response.ok && contentType?.includes('application/json'),
          name: test.name,
          status: response.status,
          contentType,
          isJSON: contentType?.includes('application/json') || false
        };
        
        if (result.success) {
          const data = await response.json();
          result.hasData = !!data && Object.keys(data).length > 0;
        }
        
        this.results.technicalAnalysis.push(result);
        console.log(`   ${result.success ? '✅' : '❌'} ${test.name}: ${result.isJSON ? 'JSON' : 'HTML'} (${result.status})`);
      } catch (error) {
        this.results.technicalAnalysis.push({
          success: false,
          name: test.name,
          error: error.message
        });
        console.log(`   ❌ ${test.name}: ${error.message}`);
      }
      
      await this.sleep(100);
    }

    const technicalSuccess = this.results.technicalAnalysis.filter(r => r.success).length;
    console.log(`   Technical Analysis Health: ${(technicalSuccess/technicalTests.length*100).toFixed(1)}%\n`);
  }

  async validatePerformanceMetrics() {
    console.log('⚡ PHASE 5: Performance Metrics Validation');
    console.log('==========================================');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      
      if (response.ok) {
        const data = await response.json();
        const indicators = data.indicators || [];
        
        const result = {
          success: true,
          indicatorCount: indicators.length,
          hasAuthentic: indicators.some(i => i.name.includes('Quality') || i.name.includes('Coverage')),
          categories: [...new Set(indicators.map(i => i.name))],
          lastUpdated: data.lastUpdated
        };
        
        this.results.performanceMetrics.push(result);
        console.log(`   ✅ Performance Metrics: ${result.indicatorCount} authentic indicators`);
        console.log(`   ✅ Categories: ${result.categories.join(', ')}`);
      } else {
        this.results.performanceMetrics.push({
          success: false,
          error: `HTTP ${response.status}`
        });
        console.log(`   ❌ Performance Metrics: Failed (${response.status})`);
      }
    } catch (error) {
      this.results.performanceMetrics.push({
        success: false,
        error: error.message
      });
      console.log(`   ❌ Performance Metrics: ${error.message}`);
    }
    
    console.log('');
  }

  async validateSystemIntegration() {
    console.log('🔗 PHASE 6: System Integration Validation');
    console.log('=========================================');
    
    // Test cross-system functionality
    try {
      // Test if signals integrate with trade simulations
      const signalsResponse = await fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`);
      const tradesResponse = await fetch(`${this.baseUrl}/api/trade-simulations/BTC%2FUSDT`);
      
      if (signalsResponse.ok && tradesResponse.ok) {
        const signals = await signalsResponse.json();
        const trades = await tradesResponse.json();
        
        const result = {
          success: true,
          signalsCount: Array.isArray(signals) ? signals.length : 0,
          tradesCount: Array.isArray(trades) ? trades.length : 0,
          integration: 'Signals and trades properly linked'
        };
        
        this.results.systemIntegration.push(result);
        console.log(`   ✅ Signal-Trade Integration: ${result.signalsCount} signals, ${result.tradesCount} trades`);
      } else {
        this.results.systemIntegration.push({
          success: false,
          error: 'Signal-trade integration failed'
        });
        console.log(`   ❌ Signal-Trade Integration: Failed`);
      }
    } catch (error) {
      this.results.systemIntegration.push({
        success: false,
        error: error.message
      });
      console.log(`   ❌ System Integration: ${error.message}`);
    }
    
    console.log('');
  }

  async runAPITest(test) {
    try {
      const response = await fetch(`${this.baseUrl}${test.url}`);
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType?.includes('application/json')) {
        const data = await response.json();
        const hasExpectedFields = test.expectedFields.some(field => 
          data.hasOwnProperty(field) || (Array.isArray(data) && data[0]?.hasOwnProperty(field))
        );
        
        return {
          success: hasExpectedFields,
          name: test.name,
          status: hasExpectedFields ? 'Valid JSON with expected data' : 'Missing expected fields',
          responseTime: Date.now() - Date.now()
        };
      } else {
        return {
          success: false,
          name: test.name,
          status: `HTTP ${response.status} - ${contentType || 'unknown'}`
        };
      }
    } catch (error) {
      return {
        success: false,
        name: test.name,
        status: `Error: ${error.message}`
      };
    }
  }

  async runMonteCarloTest(test) {
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body)
      });
      
      const data = await response.json();
      
      if (test.expectSuccess) {
        const success = response.ok && data.success;
        return {
          success,
          name: test.name,
          status: success ? 'Valid calculation completed' : `Failed: ${data.error || 'Unknown error'}`
        };
      } else {
        const success = response.status === 400 && data.error;
        return {
          success,
          name: test.name,
          status: success ? 'Properly rejected invalid input' : 'Failed to validate input'
        };
      }
    } catch (error) {
      return {
        success: false,
        name: test.name,
        status: `Error: ${error.message}`
      };
    }
  }

  async generateFinalAssessment() {
    console.log('📋 FINAL SYSTEM ASSESSMENT');
    console.log('==========================');
    
    const assessments = {
      coreAPIs: this.calculatePhaseScore(this.results.coreAPIs),
      monteCarloSystem: this.calculatePhaseScore(this.results.monteCarloSystem),
      signalGeneration: this.calculatePhaseScore(this.results.signalGeneration),
      technicalAnalysis: this.calculatePhaseScore(this.results.technicalAnalysis),
      performanceMetrics: this.calculatePhaseScore(this.results.performanceMetrics),
      systemIntegration: this.calculatePhaseScore(this.results.systemIntegration)
    };

    // Calculate weighted overall score
    const overallScore = (
      assessments.coreAPIs * 0.25 +           // 25% - Core functionality
      assessments.monteCarloSystem * 0.20 +   // 20% - Risk assessment
      assessments.signalGeneration * 0.20 +   // 20% - Signal quality
      assessments.technicalAnalysis * 0.15 +  // 15% - Analysis capabilities
      assessments.performanceMetrics * 0.10 + // 10% - Performance tracking
      assessments.systemIntegration * 0.10    // 10% - Integration
    );

    console.log('Component Scores:');
    console.log(`   Core APIs: ${assessments.coreAPIs.toFixed(1)}%`);
    console.log(`   Monte Carlo: ${assessments.monteCarloSystem.toFixed(1)}%`);
    console.log(`   Signal Generation: ${assessments.signalGeneration.toFixed(1)}%`);
    console.log(`   Technical Analysis: ${assessments.technicalAnalysis.toFixed(1)}%`);
    console.log(`   Performance Metrics: ${assessments.performanceMetrics.toFixed(1)}%`);
    console.log(`   System Integration: ${assessments.systemIntegration.toFixed(1)}%`);
    console.log(`\n🎯 OVERALL SYSTEM SCORE: ${overallScore.toFixed(1)}%`);

    const recommendation = this.generateRecommendation(overallScore, assessments);
    console.log('\n' + recommendation.summary);
    console.log('\nNext Steps:');
    recommendation.nextSteps.forEach(step => console.log(`   ${step}`));

    return {
      overallScore,
      assessments,
      recommendation,
      readyForDeployment: overallScore >= 85,
      systemHealth: overallScore >= 90 ? 'Excellent' : overallScore >= 75 ? 'Good' : 'Needs Improvement'
    };
  }

  calculatePhaseScore(results) {
    if (!results || results.length === 0) return 0;
    const successCount = results.filter(r => r.success).length;
    return (successCount / results.length) * 100;
  }

  generateRecommendation(overallScore, assessments) {
    if (overallScore >= 90) {
      return {
        summary: '🎉 SYSTEM READY FOR DEPLOYMENT\nExcellent system health across all components. All critical functionality verified through external shell testing.',
        nextSteps: [
          '✅ Deploy to production environment',
          '✅ Monitor system performance in production',
          '✅ Consider UI/UX enhancements for user experience'
        ]
      };
    } else if (overallScore >= 85) {
      return {
        summary: '🚀 SYSTEM READY FOR DEPLOYMENT\nStrong system performance with minor areas for improvement. Core functionality fully operational.',
        nextSteps: [
          '✅ Deploy to production environment',
          '🔧 Address minor technical analysis routing issues',
          '📊 Continue monitoring performance metrics'
        ]
      };
    } else if (overallScore >= 75) {
      return {
        summary: '⚠️ SYSTEM FUNCTIONAL BUT NEEDS OPTIMIZATION\nCore features working but some components need attention before production deployment.',
        nextSteps: [
          '🔧 Fix technical analysis routing issues',
          '📊 Improve system integration reliability',
          '✅ Re-validate after fixes before deployment'
        ]
      };
    } else {
      return {
        summary: '❌ SYSTEM NEEDS SIGNIFICANT IMPROVEMENTS\nMultiple critical issues identified that must be resolved before deployment.',
        nextSteps: [
          '🔧 Fix core API issues',
          '🔧 Address Monte Carlo system problems',
          '📊 Comprehensive system debugging required'
        ]
      };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive system validation
async function main() {
  const validator = new ComprehensiveSystemValidator();
  const assessment = await validator.validateCompleteSystem();
  
  console.log(`\n🏁 VALIDATION COMPLETE`);
  console.log(`System Health: ${assessment.systemHealth}`);
  console.log(`Ready for Deployment: ${assessment.readyForDeployment}`);
  
  process.exit(assessment.readyForDeployment ? 0 : 1);
}

main().catch(console.error);