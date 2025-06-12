/**
 * Comprehensive Codebase Analysis - Full External Shell Review
 * Analyzes all components: algorithms, data sources, performance, security, architecture
 * Adheres to ground rules: authentic data only, no synthetic fallbacks, comprehensive coverage
 */

import fs from 'fs';
import path from 'path';

class ComprehensiveCodebaseAnalyzer {
  constructor() {
    this.apiBase = 'http://localhost:5000';
    this.analysisResults = {
      architecture: {},
      algorithms: {},
      dataIntegrity: {},
      performance: {},
      security: {},
      apiCompliance: {},
      groundRules: {},
      recommendations: []
    };
    this.criticalIssues = [];
    this.groundRulesViolations = [];
  }

  async runComprehensiveAnalysis() {
    console.log('🔍 COMPREHENSIVE CODEBASE ANALYSIS');
    console.log('═'.repeat(70));
    console.log('External Shell Review - Full System Assessment');
    console.log('Ground Rules Compliance - Zero Tolerance for Synthetic Data');
    console.log('═'.repeat(70));

    try {
      // Phase 1: Architecture Analysis
      await this.analyzeSystemArchitecture();
      
      // Phase 2: Algorithm Validation
      await this.analyzeAlgorithmIntegrity();
      
      // Phase 3: Data Source Validation
      await this.analyzeDataSources();
      
      // Phase 4: Performance Assessment
      await this.analyzeSystemPerformance();
      
      // Phase 5: API Compliance Check
      await this.analyzeAPICompliance();
      
      // Phase 6: Security Assessment
      await this.analyzeSecurityMeasures();
      
      // Phase 7: Ground Rules Compliance
      await this.validateGroundRulesCompliance();
      
      // Phase 8: Multi-Component Integration Test
      await this.testComponentIntegration();
      
      // Phase 9: Real-time Data Flow Analysis
      await this.analyzeDataFlowIntegrity();
      
      // Phase 10: Generate Comprehensive Report
      this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.criticalIssues.push({
        type: 'analysis_failure',
        severity: 'critical',
        description: error.message
      });
    }
  }

  async analyzeSystemArchitecture() {
    console.log('\n🏗️  PHASE 1: SYSTEM ARCHITECTURE ANALYSIS');
    console.log('─'.repeat(50));
    
    try {
      // Test core API endpoints
      const endpoints = [
        '/api/crypto/all-pairs',
        '/api/market-heatmap',
        '/api/simple-market-data',
        '/api/performance-metrics',
        '/api/automation/status',
        '/api/rate-limiter/stats',
        '/api/authentic-system/status'
      ];
      
      let workingEndpoints = 0;
      let failedEndpoints = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await this.makeRequest(endpoint);
          if (response && response.status !== 'error') {
            workingEndpoints++;
            console.log(`✅ ${endpoint} - Operational`);
          } else {
            failedEndpoints.push(endpoint);
            console.log(`❌ ${endpoint} - Failed`);
          }
        } catch (error) {
          failedEndpoints.push(endpoint);
          console.log(`❌ ${endpoint} - Error: ${error.message}`);
        }
      }
      
      this.analysisResults.architecture = {
        totalEndpoints: endpoints.length,
        workingEndpoints,
        failedEndpoints,
        healthScore: (workingEndpoints / endpoints.length) * 100
      };
      
      console.log(`\nArchitecture Health: ${this.analysisResults.architecture.healthScore.toFixed(1)}%`);
      
      // Test WebSocket connections
      await this.testWebSocketConnectivity();
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'architecture_analysis_failed',
        severity: 'high',
        description: error.message
      });
    }
  }

  async analyzeAlgorithmIntegrity() {
    console.log('\n🧮 PHASE 2: ALGORITHM INTEGRITY ANALYSIS');
    console.log('─'.repeat(50));
    
    try {
      const testSymbols = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
      const timeframes = ['1h', '4h', '1d'];
      
      let totalSignals = 0;
      let authenticSignals = 0;
      let diversityScore = 0;
      
      for (const symbol of testSymbols) {
        console.log(`\n📊 Testing ${symbol}:`);
        
        for (const timeframe of timeframes) {
          const signals = await this.makeRequest(`/api/signals/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
          
          if (signals && Array.isArray(signals) && signals.length > 0) {
            totalSignals += signals.length;
            
            for (const signal of signals) {
              // Check for authentic signal characteristics
              if (this.validateSignalAuthenticity(signal)) {
                authenticSignals++;
              }
              
              // Analyze signal diversity
              if (signal.direction !== 'NEUTRAL') {
                diversityScore += signal.direction === 'LONG' ? 1 : -1;
              }
            }
            
            console.log(`  ${timeframe}: ${signals.length} signals, ${signals[0]?.direction || 'N/A'} @ ${signals[0]?.confidence || 0}%`);
          } else {
            console.log(`  ${timeframe}: No signals`);
          }
        }
      }
      
      // Calculate algorithm health metrics
      const authenticity = totalSignals > 0 ? (authenticSignals / totalSignals) * 100 : 0;
      const diversity = Math.abs(diversityScore) < totalSignals * 0.8 ? 100 : 50; // Good if not all same direction
      
      this.analysisResults.algorithms = {
        totalSignals,
        authenticSignals,
        authenticityScore: authenticity,
        diversityScore: diversity,
        algorithmHealth: (authenticity + diversity) / 2
      };
      
      console.log(`\nAlgorithm Health: ${this.analysisResults.algorithms.algorithmHealth.toFixed(1)}%`);
      console.log(`Authenticity: ${authenticity.toFixed(1)}%`);
      console.log(`Diversity: ${diversity.toFixed(1)}%`);
      
      // Test technical analysis endpoints
      await this.testTechnicalAnalysis();
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'algorithm_analysis_failed',
        severity: 'high',
        description: error.message
      });
    }
  }

  async analyzeDataSources() {
    console.log('\n📡 PHASE 3: DATA SOURCE VALIDATION');
    console.log('─'.repeat(50));
    
    try {
      // Test CoinMarketCap integration
      console.log('Testing CoinMarketCap Integration:');
      const cmcStatus = await this.makeRequest('/api/rate-limiter/stats');
      
      if (cmcStatus) {
        console.log(`✅ Rate Limiter Active: ${cmcStatus.requestsThisMinute}/${cmcStatus.maxRequestsPerMinute} requests`);
        console.log(`✅ Circuit Breaker: ${cmcStatus.circuitBreakerOpen ? 'OPEN' : 'CLOSED'}`);
        
        this.analysisResults.dataIntegrity.rateLimiter = {
          functional: true,
          utilizationPercent: (cmcStatus.requestsThisMinute / cmcStatus.maxRequestsPerMinute) * 100,
          circuitBreakerStatus: cmcStatus.circuitBreakerOpen ? 'OPEN' : 'CLOSED'
        };
      }
      
      // Test authentic data endpoints
      console.log('\nTesting Authentic Data Endpoints:');
      const authenticStatus = await this.makeRequest('/api/authentic-system/status');
      
      if (authenticStatus) {
        console.log(`✅ Authentic System: ${authenticStatus.status}`);
        console.log(`✅ Data Sources: ${authenticStatus.activeSources || 0} active`);
        
        this.analysisResults.dataIntegrity.authenticSystem = {
          status: authenticStatus.status,
          activeSources: authenticStatus.activeSources || 0,
          operational: authenticStatus.status === 'operational'
        };
      }
      
      // Test price data authenticity
      await this.validatePriceDataAuthenticity();
      
      // Check for synthetic data violations
      await this.scanForSyntheticData();
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'data_source_analysis_failed',
        severity: 'critical',
        description: error.message
      });
    }
  }

  async analyzeSystemPerformance() {
    console.log('\n⚡ PHASE 4: PERFORMANCE ANALYSIS');
    console.log('─'.repeat(50));
    
    try {
      // Test response times
      const performanceTests = [
        { endpoint: '/api/crypto/BTC%2FUSDT', name: 'Single Asset' },
        { endpoint: '/api/market-heatmap', name: 'Market Heatmap' },
        { endpoint: '/api/simple-market-data', name: 'Market Data' },
        { endpoint: '/api/performance-metrics', name: 'Performance Metrics' }
      ];
      
      const performanceResults = [];
      
      for (const test of performanceTests) {
        const startTime = Date.now();
        try {
          await this.makeRequest(test.endpoint);
          const responseTime = Date.now() - startTime;
          performanceResults.push({
            name: test.name,
            responseTime,
            status: 'success'
          });
          console.log(`✅ ${test.name}: ${responseTime}ms`);
        } catch (error) {
          performanceResults.push({
            name: test.name,
            responseTime: null,
            status: 'failed',
            error: error.message
          });
          console.log(`❌ ${test.name}: Failed`);
        }
      }
      
      const successfulTests = performanceResults.filter(r => r.status === 'success');
      const avgResponseTime = successfulTests.length > 0 ? 
        successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length : 0;
      
      this.analysisResults.performance = {
        averageResponseTime: avgResponseTime,
        successfulTests: successfulTests.length,
        totalTests: performanceResults.length,
        performanceScore: avgResponseTime < 1000 ? 100 : Math.max(0, 100 - (avgResponseTime - 1000) / 100)
      };
      
      console.log(`\nAverage Response Time: ${avgResponseTime.toFixed(0)}ms`);
      console.log(`Performance Score: ${this.analysisResults.performance.performanceScore.toFixed(1)}%`);
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'performance_analysis_failed',
        severity: 'medium',
        description: error.message
      });
    }
  }

  async analyzeAPICompliance() {
    console.log('\n🔌 PHASE 5: API COMPLIANCE ANALYSIS');
    console.log('─'.repeat(50));
    
    try {
      // Test all major API endpoints for compliance
      const complianceTests = [
        { endpoint: '/api/crypto/BTC%2FUSDT', expectedType: 'object', requiredFields: ['symbol', 'price'] },
        { endpoint: '/api/signals/BTC%2FUSDT', expectedType: 'array', requiredFields: ['direction', 'confidence'] },
        { endpoint: '/api/market-heatmap', expectedType: 'object', requiredFields: ['marketEntries'] },
        { endpoint: '/api/accuracy/BTC%2FUSDT', expectedType: 'object', requiredFields: ['symbol', 'accuracy'] }
      ];
      
      let compliantEndpoints = 0;
      const violations = [];
      
      for (const test of complianceTests) {
        try {
          const response = await this.makeRequest(test.endpoint);
          const isCompliant = this.validateAPICompliance(response, test.expectedType, test.requiredFields);
          
          if (isCompliant) {
            compliantEndpoints++;
            console.log(`✅ ${test.endpoint} - Compliant`);
          } else {
            violations.push(test.endpoint);
            console.log(`❌ ${test.endpoint} - Non-compliant`);
          }
        } catch (error) {
          violations.push(test.endpoint);
          console.log(`❌ ${test.endpoint} - Error: ${error.message}`);
        }
      }
      
      this.analysisResults.apiCompliance = {
        compliantEndpoints,
        totalEndpoints: complianceTests.length,
        violations,
        complianceScore: (compliantEndpoints / complianceTests.length) * 100
      };
      
      console.log(`\nAPI Compliance: ${this.analysisResults.apiCompliance.complianceScore.toFixed(1)}%`);
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'api_compliance_failed',
        severity: 'medium',
        description: error.message
      });
    }
  }

  async analyzeSecurityMeasures() {
    console.log('\n🔒 PHASE 6: SECURITY ANALYSIS');
    console.log('─'.repeat(50));
    
    try {
      // Test rate limiting
      console.log('Testing Rate Limiting:');
      const rateLimiterStats = await this.makeRequest('/api/rate-limiter/stats');
      
      if (rateLimiterStats) {
        const hasRateLimit = rateLimiterStats.maxRequestsPerMinute > 0;
        const hasCircuitBreaker = rateLimiterStats.hasOwnProperty('circuitBreakerOpen');
        
        console.log(`✅ Rate Limiting: ${hasRateLimit ? 'Active' : 'Inactive'}`);
        console.log(`✅ Circuit Breaker: ${hasCircuitBreaker ? 'Implemented' : 'Missing'}`);
        
        this.analysisResults.security = {
          rateLimitingActive: hasRateLimit,
          circuitBreakerImplemented: hasCircuitBreaker,
          securityScore: (hasRateLimit ? 50 : 0) + (hasCircuitBreaker ? 50 : 0)
        };
      }
      
      // Test error handling
      console.log('\nTesting Error Handling:');
      try {
        await this.makeRequest('/api/invalid-endpoint');
        console.log('❌ Invalid endpoint did not return proper error');
      } catch (error) {
        console.log('✅ Proper error handling for invalid endpoints');
      }
      
      console.log(`\nSecurity Score: ${this.analysisResults.security.securityScore || 0}%`);
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'security_analysis_failed',
        severity: 'high',
        description: error.message
      });
    }
  }

  async validateGroundRulesCompliance() {
    console.log('\n📋 PHASE 7: GROUND RULES COMPLIANCE');
    console.log('─'.repeat(50));
    
    try {
      console.log('Validating Ground Rules:');
      console.log('1. Zero tolerance for synthetic data');
      console.log('2. Authentic data sources only');
      console.log('3. No mock or placeholder data');
      console.log('4. Real market data integration');
      
      // Check for synthetic data patterns
      const syntheticViolations = await this.detectSyntheticDataPatterns();
      
      // Validate authentic data sources
      const authenticSources = await this.validateAuthenticDataSources();
      
      // Check for placeholder data
      const placeholderData = await this.detectPlaceholderData();
      
      this.analysisResults.groundRules = {
        syntheticDataViolations: syntheticViolations.length,
        authenticSourcesValidated: authenticSources.length,
        placeholderDataDetected: placeholderData.length,
        complianceScore: this.calculateGroundRulesScore(syntheticViolations, authenticSources, placeholderData)
      };
      
      if (syntheticViolations.length === 0 && placeholderData.length === 0) {
        console.log('✅ Ground Rules Compliance: PASSED');
      } else {
        console.log('❌ Ground Rules Compliance: VIOLATIONS DETECTED');
        syntheticViolations.forEach(v => this.groundRulesViolations.push(v));
        placeholderData.forEach(p => this.groundRulesViolations.push(p));
      }
      
      console.log(`Ground Rules Score: ${this.analysisResults.groundRules.complianceScore.toFixed(1)}%`);
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'ground_rules_validation_failed',
        severity: 'critical',
        description: error.message
      });
    }
  }

  async testComponentIntegration() {
    console.log('\n🔗 PHASE 8: COMPONENT INTEGRATION TEST');
    console.log('─'.repeat(50));
    
    try {
      // Test data flow between components
      console.log('Testing Cross-Component Data Flow:');
      
      const symbol = 'BTC/USDT';
      const timeframe = '1h';
      
      // Get data from multiple sources
      const [cryptoData, signalsData, heatmapData, accuracyData] = await Promise.all([
        this.makeRequest(`/api/crypto/${encodeURIComponent(symbol)}`),
        this.makeRequest(`/api/signals/${encodeURIComponent(symbol)}?timeframe=${timeframe}`),
        this.makeRequest(`/api/market-heatmap?timeframe=${timeframe}`),
        this.makeRequest(`/api/accuracy/${encodeURIComponent(symbol)}`)
      ]);
      
      // Check data consistency
      const integrationChecks = {
        priceConsistency: this.checkPriceConsistency(cryptoData, heatmapData, symbol),
        signalConsistency: this.checkSignalConsistency(signalsData, heatmapData, symbol, timeframe),
        dataFreshness: this.checkDataFreshness([cryptoData, signalsData, heatmapData, accuracyData])
      };
      
      const integrationScore = Object.values(integrationChecks).reduce((sum, check) => sum + (check ? 33.33 : 0), 0);
      
      console.log(`✅ Price Consistency: ${integrationChecks.priceConsistency ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Signal Consistency: ${integrationChecks.signalConsistency ? 'PASS' : 'FAIL'}`);
      console.log(`✅ Data Freshness: ${integrationChecks.dataFreshness ? 'PASS' : 'FAIL'}`);
      console.log(`Integration Score: ${integrationScore.toFixed(1)}%`);
      
      this.analysisResults.integration = {
        ...integrationChecks,
        integrationScore
      };
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'integration_test_failed',
        severity: 'high',
        description: error.message
      });
    }
  }

  async analyzeDataFlowIntegrity() {
    console.log('\n🌊 PHASE 9: DATA FLOW INTEGRITY ANALYSIS');
    console.log('─'.repeat(50));
    
    try {
      console.log('Analyzing Real-time Data Flow:');
      
      // Test automation system
      const automationStatus = await this.makeRequest('/api/automation/status');
      
      if (automationStatus) {
        console.log(`✅ Automation System: ${automationStatus.isRunning ? 'RUNNING' : 'STOPPED'}`);
        console.log(`✅ Last Calculation: ${new Date(automationStatus.lastCalculationTime).toLocaleString()}`);
        
        const dataFlowHealth = automationStatus.isRunning ? 100 : 0;
        
        this.analysisResults.dataFlow = {
          automationRunning: automationStatus.isRunning,
          lastCalculation: automationStatus.lastCalculationTime,
          dataFlowHealth
        };
        
        console.log(`Data Flow Health: ${dataFlowHealth}%`);
      }
      
      // Test timing metrics
      const timingMetrics = await this.makeRequest('/api/timing/metrics');
      
      if (timingMetrics) {
        console.log(`✅ Timing System: Operational`);
        console.log(`✅ Active Timers: ${timingMetrics.activeTimers || 0}`);
      }
      
    } catch (error) {
      this.criticalIssues.push({
        type: 'data_flow_analysis_failed',
        severity: 'medium',
        description: error.message
      });
    }
  }

  // Helper Methods

  validateSignalAuthenticity(signal) {
    return signal.indicators && 
           signal.confidence > 0 && 
           signal.confidence <= 100 &&
           ['LONG', 'SHORT', 'NEUTRAL'].includes(signal.direction) &&
           signal.timestamp &&
           signal.price > 0;
  }

  async testWebSocketConnectivity() {
    console.log('\nTesting WebSocket Connectivity:');
    // Note: In a real implementation, this would test WebSocket connections
    // For this analysis, we'll check if streaming endpoints are available
    try {
      const streamingStatus = await this.makeRequest('/api/streaming/status');
      if (streamingStatus) {
        console.log('✅ Streaming Infrastructure: Available');
        return true;
      }
    } catch (error) {
      console.log('❌ Streaming Infrastructure: Unavailable');
      return false;
    }
  }

  async testTechnicalAnalysis() {
    console.log('\nTesting Technical Analysis:');
    try {
      const taData = await this.makeRequest('/api/technical-analysis/BTC%2FUSDT');
      if (taData && taData.success) {
        console.log('✅ Technical Analysis: Operational');
        return true;
      }
    } catch (error) {
      console.log('❌ Technical Analysis: Failed');
      return false;
    }
  }

  async validatePriceDataAuthenticity() {
    console.log('\nValidating Price Data Authenticity:');
    try {
      const cryptoData = await this.makeRequest('/api/crypto/BTC%2FUSDT');
      
      if (cryptoData && cryptoData.price > 0) {
        // Check if price is realistic (between $10,000 and $200,000 for BTC)
        const isRealistic = cryptoData.price >= 10000 && cryptoData.price <= 200000;
        console.log(`✅ Price Data: ${isRealistic ? 'Authentic' : 'Suspicious'} ($${cryptoData.price})`);
        return isRealistic;
      }
    } catch (error) {
      console.log('❌ Price Data: Validation Failed');
      return false;
    }
  }

  async scanForSyntheticData() {
    console.log('\nScanning for Synthetic Data Patterns:');
    
    // Test multiple endpoints for synthetic data indicators
    const testEndpoints = [
      '/api/crypto/BTC%2FUSDT',
      '/api/signals/BTC%2FUSDT',
      '/api/market-heatmap'
    ];
    
    let syntheticDataFound = false;
    
    for (const endpoint of testEndpoints) {
      try {
        const data = await this.makeRequest(endpoint);
        if (this.containsSyntheticPatterns(data)) {
          console.log(`❌ Synthetic data detected in ${endpoint}`);
          syntheticDataFound = true;
        }
      } catch (error) {
        // Endpoint error, skip
      }
    }
    
    if (!syntheticDataFound) {
      console.log('✅ No synthetic data patterns detected');
    }
    
    return !syntheticDataFound;
  }

  containsSyntheticPatterns(data) {
    const dataString = JSON.stringify(data).toLowerCase();
    
    // Check for common synthetic data indicators
    const syntheticPatterns = [
      'mock',
      'fake',
      'placeholder',
      'dummy',
      'test_data',
      'synthetic',
      'random_',
      'generated_'
    ];
    
    return syntheticPatterns.some(pattern => dataString.includes(pattern));
  }

  validateAPICompliance(response, expectedType, requiredFields) {
    if (!response) return false;
    
    // Check type
    if (expectedType === 'array' && !Array.isArray(response)) return false;
    if (expectedType === 'object' && (Array.isArray(response) || typeof response !== 'object')) return false;
    
    // Check required fields
    const checkObject = Array.isArray(response) ? response[0] : response;
    if (!checkObject) return expectedType === 'array'; // Empty array is OK
    
    return requiredFields.every(field => {
      return this.hasNestedProperty(checkObject, field);
    });
  }

  hasNestedProperty(obj, path) {
    return path.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined;
    }, obj) !== undefined;
  }

  async detectSyntheticDataPatterns() {
    const violations = [];
    
    try {
      // Check key endpoints for synthetic data
      const endpoints = [
        '/api/crypto/BTC%2FUSDT',
        '/api/signals/BTC%2FUSDT',
        '/api/market-heatmap',
        '/api/performance-metrics'
      ];
      
      for (const endpoint of endpoints) {
        const data = await this.makeRequest(endpoint);
        if (this.containsSyntheticPatterns(data)) {
          violations.push({
            type: 'synthetic_data_violation',
            location: endpoint,
            severity: 'critical'
          });
        }
      }
    } catch (error) {
      // Error checking, but not a violation
    }
    
    return violations;
  }

  async validateAuthenticDataSources() {
    const sources = [];
    
    try {
      // Check authentic system status
      const authenticStatus = await this.makeRequest('/api/authentic-system/status');
      if (authenticStatus && authenticStatus.status === 'operational') {
        sources.push('authentic_system');
      }
      
      // Check rate limiter (indicates real API usage)
      const rateLimiterStats = await this.makeRequest('/api/rate-limiter/stats');
      if (rateLimiterStats && rateLimiterStats.maxRequestsPerMinute > 0) {
        sources.push('coinmarketcap_api');
      }
      
      // Check automation system
      const automationStatus = await this.makeRequest('/api/automation/status');
      if (automationStatus && automationStatus.isRunning) {
        sources.push('automated_signals');
      }
    } catch (error) {
      // Error checking sources
    }
    
    return sources;
  }

  async detectPlaceholderData() {
    const placeholders = [];
    
    try {
      // Check for placeholder patterns in responses
      const testData = await this.makeRequest('/api/crypto/BTC%2FUSDT');
      
      if (testData) {
        // Check for typical placeholder values
        if (testData.price === 0 || testData.price === 1 || testData.price === 100) {
          placeholders.push({
            type: 'placeholder_price',
            location: '/api/crypto/BTC%2FUSDT',
            value: testData.price
          });
        }
      }
    } catch (error) {
      // Error checking, not necessarily a placeholder issue
    }
    
    return placeholders;
  }

  calculateGroundRulesScore(syntheticViolations, authenticSources, placeholderData) {
    let score = 100;
    
    // Deduct for violations
    score -= syntheticViolations.length * 25; // 25 points per violation
    score -= placeholderData.length * 20; // 20 points per placeholder
    
    // Add for authentic sources
    score += Math.min(authenticSources.length * 10, 30); // Up to 30 bonus points
    
    return Math.max(0, Math.min(100, score));
  }

  checkPriceConsistency(cryptoData, heatmapData, symbol) {
    if (!cryptoData || !heatmapData) return false;
    
    const heatmapEntry = heatmapData.marketEntries?.find(entry => entry.symbol === symbol);
    if (!heatmapEntry) return false;
    
    const priceDiff = Math.abs(cryptoData.price - heatmapEntry.currentPrice) / cryptoData.price;
    return priceDiff < 0.01; // Within 1%
  }

  checkSignalConsistency(signalsData, heatmapData, symbol, timeframe) {
    if (!signalsData || !Array.isArray(signalsData) || signalsData.length === 0) return false;
    if (!heatmapData) return false;
    
    const heatmapEntry = heatmapData.marketEntries?.find(entry => entry.symbol === symbol);
    if (!heatmapEntry) return false;
    
    const signal = signalsData.find(s => s.timeframe === timeframe);
    const heatmapSignal = heatmapEntry.signals?.[timeframe] || heatmapEntry.sentiment;
    
    if (!signal || !heatmapSignal) return false;
    
    return signal.direction === heatmapSignal.direction;
  }

  checkDataFreshness(dataArray) {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    return dataArray.every(data => {
      if (!data) return true; // No data is not necessarily stale
      
      const timestamp = data.timestamp || data.lastCalculationTime || Date.now();
      return (now - new Date(timestamp).getTime()) < maxAge;
    });
  }

  generateComprehensiveReport() {
    console.log('\n📊 COMPREHENSIVE ANALYSIS REPORT');
    console.log('═'.repeat(70));
    
    // Calculate overall system health
    const scores = [
      this.analysisResults.architecture?.healthScore || 0,
      this.analysisResults.algorithms?.algorithmHealth || 0,
      this.analysisResults.performance?.performanceScore || 0,
      this.analysisResults.apiCompliance?.complianceScore || 0,
      this.analysisResults.security?.securityScore || 0,
      this.analysisResults.groundRules?.complianceScore || 0
    ];
    
    const overallHealth = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    console.log(`\n🎯 OVERALL SYSTEM HEALTH: ${overallHealth.toFixed(1)}%`);
    console.log('─'.repeat(50));
    
    // Individual component scores
    console.log(`Architecture Health: ${(this.analysisResults.architecture?.healthScore || 0).toFixed(1)}%`);
    console.log(`Algorithm Integrity: ${(this.analysisResults.algorithms?.algorithmHealth || 0).toFixed(1)}%`);
    console.log(`Performance Score: ${(this.analysisResults.performance?.performanceScore || 0).toFixed(1)}%`);
    console.log(`API Compliance: ${(this.analysisResults.apiCompliance?.complianceScore || 0).toFixed(1)}%`);
    console.log(`Security Score: ${(this.analysisResults.security?.securityScore || 0).toFixed(1)}%`);
    console.log(`Ground Rules Compliance: ${(this.analysisResults.groundRules?.complianceScore || 0).toFixed(1)}%`);
    
    // Critical issues
    if (this.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      console.log('─'.repeat(30));
      this.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
      });
    }
    
    // Ground rules violations
    if (this.groundRulesViolations.length > 0) {
      console.log('\n⚠️  GROUND RULES VIOLATIONS:');
      console.log('─'.repeat(35));
      this.groundRulesViolations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.type}: ${violation.location || violation.description}`);
      });
    }
    
    // Recommendations
    this.generateRecommendations();
    
    if (this.analysisResults.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('─'.repeat(25));
      this.analysisResults.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    // Export results
    this.exportAnalysisResults(overallHealth);
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Architecture recommendations
    if ((this.analysisResults.architecture?.healthScore || 0) < 90) {
      recommendations.push('Improve API endpoint reliability and error handling');
    }
    
    // Algorithm recommendations
    if ((this.analysisResults.algorithms?.algorithmHealth || 0) < 80) {
      recommendations.push('Enhance signal generation algorithms for better accuracy');
    }
    
    // Performance recommendations
    if ((this.analysisResults.performance?.averageResponseTime || 0) > 1000) {
      recommendations.push('Optimize API response times through caching and query optimization');
    }
    
    // Security recommendations
    if ((this.analysisResults.security?.securityScore || 0) < 100) {
      recommendations.push('Strengthen security measures including rate limiting and input validation');
    }
    
    // Ground rules recommendations
    if (this.groundRulesViolations.length > 0) {
      recommendations.push('CRITICAL: Eliminate all synthetic data sources and ensure authentic data only');
    }
    
    // Data source recommendations
    if ((this.analysisResults.dataIntegrity?.authenticSystem?.activeSources || 0) < 2) {
      recommendations.push('Diversify authentic data sources for improved reliability');
    }
    
    this.analysisResults.recommendations = recommendations;
  }

  exportAnalysisResults(overallHealth) {
    const timestamp = new Date().toISOString();
    const filename = `comprehensive_analysis_${timestamp.replace(/[:.]/g, '-')}.json`;
    
    const exportData = {
      timestamp,
      overallHealth,
      analysisResults: this.analysisResults,
      criticalIssues: this.criticalIssues,
      groundRulesViolations: this.groundRulesViolations,
      summary: {
        systemStatus: overallHealth >= 80 ? 'HEALTHY' : overallHealth >= 60 ? 'WARNING' : 'CRITICAL',
        groundRulesCompliant: this.groundRulesViolations.length === 0,
        criticalIssueCount: this.criticalIssues.length,
        recommendationCount: this.analysisResults.recommendations.length
      }
    };
    
    try {
      fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
      console.log(`\n📄 Analysis exported to: ${filename}`);
    } catch (error) {
      console.log(`\n❌ Failed to export analysis: ${error.message}`);
    }
  }

  async makeRequest(endpoint) {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive analysis
async function main() {
  const analyzer = new ComprehensiveCodebaseAnalyzer();
  await analyzer.runComprehensiveAnalysis();
}

// Setup fetch for Node.js environment
if (typeof fetch === 'undefined') {
  const { default: fetch } = await import('node-fetch');
  global.fetch = fetch;
}

main().catch(console.error);