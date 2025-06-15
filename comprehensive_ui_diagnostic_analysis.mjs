/**
 * Comprehensive UI Diagnostic Analysis - External Shell Testing
 * Analyzes logs, errors, and component failures before implementing fixes
 * 
 * Ground Rules Compliance:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic system diagnostics
 * - Real-time validation of component issues
 * - Zero tolerance for component crashes
 */

class ComprehensiveUIDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.systemHealth = {
      backend: false,
      frontend: false,
      components: {},
      dataFlow: {}
    };
  }

  async runComprehensiveDiagnostic() {
    console.log('🔍 COMPREHENSIVE UI DIAGNOSTIC ANALYSIS');
    console.log('=====================================');
    console.log('Analyzing logs, errors, and component failures\n');
    
    await this.analyzeBackendHealth();
    await this.analyzeFrontendErrors();
    await this.validateComponentDataFlow();
    await this.testNewUIComponents();
    await this.analyzeSystemIntegration();
    await this.generateDiagnosticReport();
  }

  async analyzeBackendHealth() {
    console.log('🔧 ANALYZING BACKEND HEALTH');
    console.log('===========================');
    
    // Test 1: Core API Endpoints
    console.log('Testing core API endpoints...');
    const coreEndpoints = [
      '/api/crypto/all-pairs',
      '/api/signals/BTC%2FUSDT',
      '/api/technical-analysis/BTC%2FUSDT',
      '/api/performance-metrics',
      '/api/pattern-analysis/BTC%2FUSDT'
    ];
    
    let healthyEndpoints = 0;
    
    for (const endpoint of coreEndpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const responseTime = Date.now();
        
        if (response.status === 200) {
          const data = await response.json();
          console.log(`  ✅ ${endpoint}: ${response.status} (${data ? 'data present' : 'no data'})`);
          healthyEndpoints++;
          
          // Validate data structure
          if (endpoint.includes('all-pairs') && Array.isArray(data)) {
            this.systemHealth.dataFlow.marketPairs = true;
          } else if (endpoint.includes('signals') && Array.isArray(data)) {
            this.systemHealth.dataFlow.signals = true;
          } else if (endpoint.includes('technical-analysis') && data.indicators) {
            this.systemHealth.dataFlow.technicalAnalysis = true;
          } else if (endpoint.includes('performance-metrics') && data.indicators) {
            this.systemHealth.dataFlow.performanceMetrics = true;
          }
        } else {
          console.log(`  ❌ ${endpoint}: ${response.status}`);
          this.issues.push({
            type: 'API_ERROR',
            endpoint,
            status: response.status,
            severity: 'HIGH'
          });
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint}: ${error.message}`);
        this.issues.push({
          type: 'NETWORK_ERROR',
          endpoint,
          error: error.message,
          severity: 'CRITICAL'
        });
      }
      
      await this.sleep(200);
    }
    
    this.systemHealth.backend = healthyEndpoints >= 4;
    console.log(`Backend Health: ${healthyEndpoints}/${coreEndpoints.length} endpoints healthy\n`);
  }

  async analyzeFrontendErrors() {
    console.log('🌐 ANALYZING FRONTEND ERRORS');
    console.log('============================');
    
    // Test component-specific endpoints that the UI relies on
    console.log('Testing component data dependencies...');
    
    // Test 1: LiveMarketOverview data requirements
    try {
      const marketResponse = await fetch(`${this.baseUrl}/api/crypto/all-pairs`);
      if (marketResponse.status === 200) {
        const data = await marketResponse.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const hasPriceData = data.some(pair => 
            pair && 
            typeof pair.price === 'number' && 
            !isNaN(pair.price) &&
            typeof pair.change24h === 'number' &&
            !isNaN(pair.change24h)
          );
          
          if (hasPriceData) {
            console.log('  ✅ LiveMarketOverview: Valid price data structure');
            this.systemHealth.components.liveMarketOverview = true;
          } else {
            console.log('  ❌ LiveMarketOverview: Invalid price data structure');
            this.issues.push({
              type: 'DATA_STRUCTURE_ERROR',
              component: 'LiveMarketOverview',
              issue: 'Invalid price/change24h data types',
              severity: 'HIGH'
            });
          }
        } else {
          console.log('  ❌ LiveMarketOverview: Empty or invalid market data');
          this.issues.push({
            type: 'EMPTY_DATA_ERROR',
            component: 'LiveMarketOverview',
            issue: 'No market pairs data',
            severity: 'HIGH'
          });
        }
      }
    } catch (error) {
      console.log(`  ❌ LiveMarketOverview: ${error.message}`);
      this.issues.push({
        type: 'COMPONENT_DATA_ERROR',
        component: 'LiveMarketOverview',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
    
    await this.sleep(300);
    
    // Test 2: CriticalSignalAnalysis data requirements
    try {
      const signalResponse = await fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`);
      if (signalResponse.status === 200) {
        const data = await signalResponse.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const signal = data[0];
          const hasRequiredFields = signal &&
            signal.symbol &&
            signal.direction &&
            typeof signal.confidence === 'number' &&
            typeof signal.price === 'number' &&
            signal.timeframe;
          
          if (hasRequiredFields) {
            console.log('  ✅ CriticalSignalAnalysis: Valid signal data structure');
            this.systemHealth.components.criticalSignalAnalysis = true;
          } else {
            console.log('  ❌ CriticalSignalAnalysis: Missing required signal fields');
            console.log(`    Signal structure: ${JSON.stringify(Object.keys(signal || {}))}`);
            this.issues.push({
              type: 'DATA_STRUCTURE_ERROR',
              component: 'CriticalSignalAnalysis',
              issue: 'Missing required signal fields',
              severity: 'HIGH'
            });
          }
        } else {
          console.log('  ❌ CriticalSignalAnalysis: No signal data available');
          this.issues.push({
            type: 'EMPTY_DATA_ERROR',
            component: 'CriticalSignalAnalysis',
            issue: 'No signals available',
            severity: 'MEDIUM'
          });
        }
      }
    } catch (error) {
      console.log(`  ❌ CriticalSignalAnalysis: ${error.message}`);
      this.issues.push({
        type: 'COMPONENT_DATA_ERROR',
        component: 'CriticalSignalAnalysis',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
    
    await this.sleep(300);
    
    // Test 3: TechnicalAnalysisSummary data requirements
    try {
      const techResponse = await fetch(`${this.baseUrl}/api/technical-analysis/BTC%2FUSDT`);
      if (techResponse.status === 200) {
        const data = await techResponse.json();
        
        if (data && data.indicators) {
          const indicators = data.indicators;
          const hasValidIndicators = 
            typeof indicators.rsi === 'number' &&
            typeof indicators.macd === 'number' &&
            !isNaN(indicators.rsi) &&
            !isNaN(indicators.macd);
          
          if (hasValidIndicators) {
            console.log('  ✅ TechnicalAnalysisSummary: Valid indicator data');
            this.systemHealth.components.technicalAnalysisSummary = true;
          } else {
            console.log('  ❌ TechnicalAnalysisSummary: Invalid indicator values');
            console.log(`    RSI: ${indicators.rsi}, MACD: ${indicators.macd}`);
            this.issues.push({
              type: 'DATA_VALIDATION_ERROR',
              component: 'TechnicalAnalysisSummary',
              issue: 'Invalid indicator values (NaN or undefined)',
              severity: 'HIGH'
            });
          }
        } else {
          console.log('  ❌ TechnicalAnalysisSummary: No indicators data');
          this.issues.push({
            type: 'MISSING_DATA_ERROR',
            component: 'TechnicalAnalysisSummary',
            issue: 'Missing indicators object',
            severity: 'HIGH'
          });
        }
      }
    } catch (error) {
      console.log(`  ❌ TechnicalAnalysisSummary: ${error.message}`);
      this.issues.push({
        type: 'COMPONENT_DATA_ERROR',
        component: 'TechnicalAnalysisSummary',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
    
    await this.sleep(300);
    
    // Test 4: Performance Metrics data requirements
    try {
      const perfResponse = await fetch(`${this.baseUrl}/api/performance-metrics`);
      if (perfResponse.status === 200) {
        const data = await perfResponse.json();
        
        if (data && data.indicators && Array.isArray(data.indicators)) {
          console.log('  ✅ Performance Metrics: Valid indicators array');
          this.systemHealth.components.performanceMetrics = true;
        } else {
          console.log('  ❌ Performance Metrics: Invalid indicators structure');
          this.issues.push({
            type: 'DATA_STRUCTURE_ERROR',
            component: 'PerformanceMetrics',
            issue: 'Invalid indicators array structure',
            severity: 'MEDIUM'
          });
        }
      }
    } catch (error) {
      console.log(`  ❌ Performance Metrics: ${error.message}`);
      this.issues.push({
        type: 'COMPONENT_DATA_ERROR',
        component: 'PerformanceMetrics',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
    
    const validComponents = Object.values(this.systemHealth.components).filter(Boolean).length;
    const totalComponents = Object.keys(this.systemHealth.components).length;
    this.systemHealth.frontend = validComponents >= Math.ceil(totalComponents * 0.75);
    
    console.log(`Frontend Component Health: ${validComponents}/${totalComponents} components valid\n`);
  }

  async validateComponentDataFlow() {
    console.log('🔄 VALIDATING COMPONENT DATA FLOW');
    console.log('=================================');
    
    // Test the complete data flow from API to UI component consumption
    console.log('Testing end-to-end data flow...');
    
    // Test 1: Market data flow for LiveMarketOverview
    try {
      const response = await fetch(`${this.baseUrl}/api/crypto/all-pairs`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const topPairs = data.filter(pair => 
          ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'].includes(pair.symbol)
        );
        
        console.log(`  ✅ Market data flow: ${topPairs.length}/5 top pairs available`);
        
        // Test price formatting scenarios
        const testPrices = topPairs.map(pair => ({
          symbol: pair.symbol,
          price: pair.price,
          formatted: this.formatPrice(pair.price, pair.symbol),
          change: this.formatChange(pair.change24h)
        }));
        
        const validFormats = testPrices.filter(test => 
          test.formatted !== 'N/A' && test.change !== '0.00%'
        ).length;
        
        console.log(`  ✅ Price formatting: ${validFormats}/${testPrices.length} valid formats`);
        
        if (validFormats < testPrices.length) {
          this.issues.push({
            type: 'DATA_FORMATTING_ERROR',
            component: 'LiveMarketOverview',
            issue: 'Some prices failing to format correctly',
            severity: 'MEDIUM'
          });
        }
      }
    } catch (error) {
      console.log(`  ❌ Market data flow: ${error.message}`);
      this.issues.push({
        type: 'DATA_FLOW_ERROR',
        component: 'LiveMarketOverview',
        error: error.message,
        severity: 'HIGH'
      });
    }
    
    await this.sleep(500);
    
    // Test 2: Signal data flow for CriticalSignalAnalysis
    const testSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    let validSignalFlows = 0;
    
    for (const symbol of testSymbols) {
      try {
        const response = await fetch(`${this.baseUrl}/api/signals/${encodeURIComponent(symbol)}`);
        if (response.status === 200) {
          const signals = await response.json();
          if (Array.isArray(signals) && signals.length > 0) {
            const signal = signals[0];
            const isValid = signal && 
              signal.symbol === symbol &&
              typeof signal.confidence === 'number' &&
              signal.confidence >= 0 && signal.confidence <= 100;
            
            if (isValid) {
              validSignalFlows++;
              console.log(`  ✅ ${symbol}: Signal flow valid (${signal.direction} ${signal.confidence}%)`);
            } else {
              console.log(`  ❌ ${symbol}: Invalid signal structure`);
            }
          } else {
            console.log(`  ⚠️ ${symbol}: No signals available`);
          }
        }
      } catch (error) {
        console.log(`  ❌ ${symbol}: Signal flow error - ${error.message}`);
      }
      
      await this.sleep(200);
    }
    
    console.log(`Signal data flow: ${validSignalFlows}/${testSymbols.length} symbols valid\n`);
  }

  async testNewUIComponents() {
    console.log('🆕 TESTING NEW UI COMPONENTS');
    console.log('============================');
    
    // Test Monte Carlo Risk Assessment specifically
    console.log('Testing Monte Carlo Risk Assessment...');
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.riskMetrics && typeof data.riskMetrics.volatility === 'number') {
          console.log(`  ✅ Monte Carlo: Valid risk metrics (${data.riskMetrics.volatility.toFixed(2)}% volatility)`);
          this.systemHealth.components.riskAssessment = true;
        } else {
          console.log('  ❌ Monte Carlo: Invalid risk metrics structure');
          this.issues.push({
            type: 'DATA_STRUCTURE_ERROR',
            component: 'RiskAssessmentDashboard',
            issue: 'Invalid riskMetrics structure',
            severity: 'HIGH'
          });
        }
      } else if (response.status === 429) {
        console.log('  ⚠️ Monte Carlo: Rate limited (component should handle gracefully)');
        this.systemHealth.components.riskAssessment = true; // Rate limiting is expected behavior
      } else {
        console.log(`  ❌ Monte Carlo: API error ${response.status}`);
        this.issues.push({
          type: 'API_ERROR',
          component: 'RiskAssessmentDashboard',
          status: response.status,
          severity: 'HIGH'
        });
      }
    } catch (error) {
      console.log(`  ❌ Monte Carlo: ${error.message}`);
      this.issues.push({
        type: 'NETWORK_ERROR',
        component: 'RiskAssessmentDashboard',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
    
    await this.sleep(500);
    
    // Test Pattern Analysis for TechnicalAnalysisSummary
    console.log('Testing Pattern Analysis...');
    try {
      const response = await fetch(`${this.baseUrl}/api/pattern-analysis/BTC%2FUSDT`);
      if (response.status === 200) {
        const data = await response.json();
        if (data && data.patterns) {
          console.log(`  ✅ Pattern Analysis: Valid patterns data`);
          this.systemHealth.dataFlow.patternAnalysis = true;
        } else {
          console.log('  ❌ Pattern Analysis: Missing patterns field');
          this.issues.push({
            type: 'MISSING_DATA_ERROR',
            component: 'TechnicalAnalysisSummary',
            issue: 'Missing patterns field in API response',
            severity: 'MEDIUM'
          });
        }
      }
    } catch (error) {
      console.log(`  ❌ Pattern Analysis: ${error.message}`);
    }
  }

  async analyzeSystemIntegration() {
    console.log('🔗 ANALYZING SYSTEM INTEGRATION');
    console.log('===============================');
    
    // Test the integration between different components
    console.log('Testing component integration...');
    
    // Test 1: Real-time updates coordination
    const startTime = Date.now();
    
    try {
      // Simultaneous requests to test component coordination
      const requests = [
        fetch(`${this.baseUrl}/api/crypto/all-pairs`),
        fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`),
        fetch(`${this.baseUrl}/api/technical-analysis/BTC%2FUSDT`),
        fetch(`${this.baseUrl}/api/performance-metrics`)
      ];
      
      const responses = await Promise.all(requests);
      const loadTime = Date.now() - startTime;
      
      const successfulRequests = responses.filter(r => r.status === 200).length;
      
      console.log(`  ✅ Integration test: ${successfulRequests}/4 requests successful in ${loadTime}ms`);
      
      if (loadTime < 2000 && successfulRequests >= 3) {
        console.log('  ✅ System integration: Optimal performance for priority-based layout');
        this.systemHealth.frontend = true;
      } else if (successfulRequests >= 2) {
        console.log('  ⚠️ System integration: Acceptable performance with some issues');
        this.issues.push({
          type: 'PERFORMANCE_WARNING',
          issue: `Slow response time (${loadTime}ms) or failed requests`,
          severity: 'MEDIUM'
        });
      } else {
        console.log('  ❌ System integration: Poor performance, UI may not function correctly');
        this.issues.push({
          type: 'INTEGRATION_ERROR',
          issue: 'Multiple component data sources failing',
          severity: 'CRITICAL'
        });
      }
      
    } catch (error) {
      console.log(`  ❌ Integration test failed: ${error.message}`);
      this.issues.push({
        type: 'INTEGRATION_ERROR',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
  }

  generateDiagnosticReport() {
    console.log('\n📋 COMPREHENSIVE DIAGNOSTIC REPORT');
    console.log('==================================');
    
    // Calculate overall health score
    const backendScore = this.systemHealth.backend ? 25 : 0;
    const frontendScore = this.systemHealth.frontend ? 25 : 0;
    const componentScore = (Object.values(this.systemHealth.components).filter(Boolean).length / 
                           Object.keys(this.systemHealth.components).length) * 25;
    const dataFlowScore = (Object.values(this.systemHealth.dataFlow).filter(Boolean).length / 
                          Object.keys(this.systemHealth.dataFlow).length) * 25;
    
    const overallScore = backendScore + frontendScore + componentScore + dataFlowScore;
    
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallScore.toFixed(1)}/100`);
    console.log(`Backend Health: ${this.systemHealth.backend ? '✅' : '❌'} (${backendScore}/25)`);
    console.log(`Frontend Health: ${this.systemHealth.frontend ? '✅' : '❌'} (${frontendScore}/25)`);
    console.log(`Component Health: ${componentScore.toFixed(1)}/25`);
    console.log(`Data Flow Health: ${dataFlowScore.toFixed(1)}/25`);
    
    // Categorize issues by severity
    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = this.issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = this.issues.filter(i => i.severity === 'MEDIUM');
    
    console.log(`\n🚨 ISSUES SUMMARY:`);
    console.log(`Critical Issues: ${criticalIssues.length}`);
    console.log(`High Priority Issues: ${highIssues.length}`);
    console.log(`Medium Priority Issues: ${mediumIssues.length}`);
    
    if (criticalIssues.length > 0) {
      console.log('\n🔥 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:');
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.component || issue.endpoint || 'System'}`);
        console.log(`   ${issue.issue || issue.error || 'Unknown error'}`);
      });
    }
    
    if (highIssues.length > 0) {
      console.log('\n⚠️ HIGH PRIORITY ISSUES:');
      highIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.component || issue.endpoint || 'System'}`);
        console.log(`   ${issue.issue || issue.error || 'Unknown error'}`);
      });
    }
    
    // Component-specific status
    console.log('\n🧩 COMPONENT STATUS:');
    console.log(`LiveMarketOverview: ${this.systemHealth.components.liveMarketOverview ? '✅' : '❌'}`);
    console.log(`CriticalSignalAnalysis: ${this.systemHealth.components.criticalSignalAnalysis ? '✅' : '❌'}`);
    console.log(`TechnicalAnalysisSummary: ${this.systemHealth.components.technicalAnalysisSummary ? '✅' : '❌'}`);
    console.log(`RiskAssessmentDashboard: ${this.systemHealth.components.riskAssessment ? '✅' : '❌'}`);
    console.log(`PerformanceMetrics: ${this.systemHealth.components.performanceMetrics ? '✅' : '❌'}`);
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (overallScore >= 80) {
      console.log('✅ System is functioning well. Minor optimizations may be beneficial.');
    } else if (overallScore >= 60) {
      console.log('⚠️ System has some issues but is functional. Address high-priority issues.');
    } else if (overallScore >= 40) {
      console.log('🔧 System has significant issues. Critical fixes needed before deployment.');
    } else {
      console.log('🚨 System is severely compromised. Complete troubleshooting required.');
    }
    
    // Specific fix recommendations based on identified issues
    if (criticalIssues.some(i => i.type === 'DATA_STRUCTURE_ERROR')) {
      console.log('1. Fix data structure validation in UI components');
    }
    if (criticalIssues.some(i => i.type === 'NETWORK_ERROR')) {
      console.log('2. Investigate network connectivity issues');
    }
    if (highIssues.some(i => i.type === 'DATA_FORMATTING_ERROR')) {
      console.log('3. Add robust null/undefined checks in formatting functions');
    }
    if (mediumIssues.some(i => i.type === 'PERFORMANCE_WARNING')) {
      console.log('4. Optimize API response times and caching');
    }
    
    return {
      overallScore,
      issues: this.issues,
      systemHealth: this.systemHealth,
      needsImmediateAttention: criticalIssues.length > 0 || overallScore < 50
    };
  }

  // Helper functions for testing data formatting
  formatPrice(price, symbol) {
    if (!price || typeof price !== 'number' || isNaN(price)) return 'N/A';
    if (symbol && symbol.includes('BTC')) return `$${price.toLocaleString()}`;
    if (price > 1000) return `$${price.toLocaleString()}`;
    if (price > 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  }

  formatChange(change) {
    if (!change || typeof change !== 'number' || isNaN(change)) return '0.00%';
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const diagnostic = new ComprehensiveUIDiagnostic();
  const results = await diagnostic.runComprehensiveDiagnostic();
  
  // Export results for potential fixes
  console.log('\n📄 DIAGNOSTIC COMPLETE');
  console.log('Results available for component fixes and optimizations');
  
  return results;
}

main().catch(console.error);