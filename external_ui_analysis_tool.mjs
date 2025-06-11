/**
 * External UI Analysis Tool
 * Comprehensive analysis of performance analysis box issues
 * Tests API endpoints, data structures, and UI compatibility
 */

import { createRequire } from 'module';
import http from 'http';
import { URL } from 'url';

const require = createRequire(import.meta.url);

// Simple fetch implementation using Node.js http module
async function fetch(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'External-UI-Analyzer/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: {
            get: (name) => res.headers[name.toLowerCase()]
          },
          json: () => Promise.resolve(JSON.parse(data))
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

class ExternalUIAnalyzer {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      apiTests: {},
      dataStructureTests: {},
      uiCompatibilityTests: {},
      performanceTests: {},
      issues: [],
      recommendations: []
    };
  }

  async runCompleteAnalysis() {
    console.log('🔍 External UI Analysis - Performance Analysis Box Investigation\n');
    
    try {
      await this.testPerformanceMetricsAPI();
      await this.analyzeDataStructures();
      await this.testUICompatibility();
      await this.performLoadTesting();
      await this.identifyRootCauses();
      
      this.generateComprehensiveReport();
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      this.results.issues.push(`Critical analysis error: ${error.message}`);
    }
  }

  async testPerformanceMetricsAPI() {
    console.log('📊 Testing Performance Metrics API...');
    
    try {
      // Test 1: Basic endpoint availability
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      const data = await response.json();
      
      this.results.apiTests.basic = {
        status: response.status,
        contentType: response.headers.get('content-type'),
        responseTime: response.headers.get('response-time') || 'unknown',
        hasData: !!data
      };
      
      // Test 2: Response structure validation
      const structureValid = this.validateResponseStructure(data);
      this.results.apiTests.structure = structureValid;
      
      // Test 3: Cache behavior
      const cacheTest = await this.testCacheBehavior();
      this.results.apiTests.cache = cacheTest;
      
      // Test 4: Multiple rapid requests
      const concurrencyTest = await this.testConcurrency();
      this.results.apiTests.concurrency = concurrencyTest;
      
      console.log(`  ✅ API Status: ${response.status}`);
      console.log(`  📊 Data Structure: ${structureValid.isValid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`  🔄 Cache Test: ${cacheTest.working ? '✅ Working' : '❌ Problematic'}`);
      
    } catch (error) {
      this.results.issues.push(`Performance metrics API test failed: ${error.message}`);
      console.log('  ❌ API test failed');
    }
  }

  validateResponseStructure(data) {
    const requiredFields = ['indicators', 'timeframes', 'symbols'];
    const requiredIndicatorFields = ['indicator', 'value', 'status', 'change'];
    
    const validation = {
      isValid: true,
      missingFields: [],
      invalidIndicators: [],
      detailedAnalysis: {}
    };
    
    // Check top-level fields
    requiredFields.forEach(field => {
      if (!data.hasOwnProperty(field)) {
        validation.missingFields.push(field);
        validation.isValid = false;
      }
    });
    
    // Check indicators array
    if (Array.isArray(data.indicators)) {
      validation.detailedAnalysis.indicatorCount = data.indicators.length;
      
      data.indicators.forEach((indicator, index) => {
        const missing = requiredIndicatorFields.filter(field => !indicator.hasOwnProperty(field));
        if (missing.length > 0) {
          validation.invalidIndicators.push({
            index,
            indicator: indicator.indicator || `indicator_${index}`,
            missingFields: missing
          });
          validation.isValid = false;
        }
      });
    } else {
      validation.missingFields.push('indicators (not array)');
      validation.isValid = false;
    }
    
    return validation;
  }

  async testCacheBehavior() {
    try {
      // First request
      const start1 = Date.now();
      const response1 = await fetch(`${this.baseUrl}/api/performance-metrics`);
      const time1 = Date.now() - start1;
      const data1 = await response1.json();
      
      // Second request (should hit cache)
      const start2 = Date.now();
      const response2 = await fetch(`${this.baseUrl}/api/performance-metrics`);
      const time2 = Date.now() - start2;
      const data2 = await response2.json();
      
      // Third request with cache-control header
      const start3 = Date.now();
      const response3 = await fetch(`${this.baseUrl}/api/performance-metrics`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const time3 = Date.now() - start3;
      const data3 = await response3.json();
      
      return {
        working: true,
        times: { first: time1, second: time2, noCache: time3 },
        cacheHeaders: {
          first: response1.headers.get('cache-control'),
          second: response2.headers.get('cache-control'),
          noCache: response3.headers.get('cache-control')
        },
        dataConsistency: JSON.stringify(data1) === JSON.stringify(data2)
      };
    } catch (error) {
      return {
        working: false,
        error: error.message
      };
    }
  }

  async testConcurrency() {
    try {
      const concurrent = 5;
      const promises = Array(concurrent).fill().map(async (_, i) => {
        const start = Date.now();
        const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
        const time = Date.now() - start;
        const data = await response.json();
        return { index: i, status: response.status, time, hasData: !!data.indicators };
      });
      
      const results = await Promise.all(promises);
      
      return {
        working: results.every(r => r.status === 200 && r.hasData),
        results,
        averageTime: results.reduce((sum, r) => sum + r.time, 0) / results.length,
        maxTime: Math.max(...results.map(r => r.time)),
        minTime: Math.min(...results.map(r => r.time))
      };
    } catch (error) {
      return {
        working: false,
        error: error.message
      };
    }
  }

  async analyzeDataStructures() {
    console.log('🔍 Analyzing Data Structures...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      const data = await response.json();
      
      this.results.dataStructureTests = {
        rawData: this.analyzeRawData(data),
        indicatorAnalysis: this.analyzeIndicators(data.indicators || []),
        typeValidation: this.validateDataTypes(data),
        completeness: this.checkDataCompleteness(data)
      };
      
      console.log(`  📊 Indicators Found: ${data.indicators?.length || 0}`);
      console.log(`  🔍 Data Types: ${this.results.dataStructureTests.typeValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`  📋 Completeness: ${this.results.dataStructureTests.completeness.percentage}%`);
      
    } catch (error) {
      this.results.issues.push(`Data structure analysis failed: ${error.message}`);
      console.log('  ❌ Data structure analysis failed');
    }
  }

  analyzeRawData(data) {
    return {
      keys: Object.keys(data),
      sizes: {
        indicators: Array.isArray(data.indicators) ? data.indicators.length : 0,
        timeframes: Array.isArray(data.timeframes) ? data.timeframes.length : 0,
        symbols: Array.isArray(data.symbols) ? data.symbols.length : 0
      },
      hasTimestamp: !!data.lastUpdated,
      hasSummary: !!data.summary
    };
  }

  analyzeIndicators(indicators) {
    if (!Array.isArray(indicators)) {
      return { error: 'Indicators is not an array' };
    }
    
    const analysis = {
      count: indicators.length,
      uniqueIndicators: [...new Set(indicators.map(i => i.indicator))],
      valueTypes: {},
      statusTypes: {},
      changeTypes: {},
      completeness: {}
    };
    
    indicators.forEach(indicator => {
      // Analyze value types
      const valueType = typeof indicator.value;
      analysis.valueTypes[valueType] = (analysis.valueTypes[valueType] || 0) + 1;
      
      // Analyze status types
      if (indicator.status) {
        analysis.statusTypes[indicator.status] = (analysis.statusTypes[indicator.status] || 0) + 1;
      }
      
      // Analyze change format
      if (indicator.change) {
        const changeFormat = indicator.change.includes('%') ? 'percentage' : 'numeric';
        analysis.changeTypes[changeFormat] = (analysis.changeTypes[changeFormat] || 0) + 1;
      }
    });
    
    return analysis;
  }

  validateDataTypes(data) {
    const issues = [];
    
    if (data.indicators) {
      data.indicators.forEach((indicator, index) => {
        if (typeof indicator.indicator !== 'string') {
          issues.push(`Indicator ${index}: 'indicator' should be string, got ${typeof indicator.indicator}`);
        }
        if (!['string', 'number'].includes(typeof indicator.value)) {
          issues.push(`Indicator ${index}: 'value' should be string or number, got ${typeof indicator.value}`);
        }
        if (typeof indicator.status !== 'string') {
          issues.push(`Indicator ${index}: 'status' should be string, got ${typeof indicator.status}`);
        }
        if (typeof indicator.change !== 'string') {
          issues.push(`Indicator ${index}: 'change' should be string, got ${typeof indicator.change}`);
        }
      });
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  checkDataCompleteness(data) {
    const expectedFields = ['indicators', 'timeframes', 'symbols', 'lastUpdated'];
    const presentFields = expectedFields.filter(field => data.hasOwnProperty(field));
    
    let totalIndicatorFields = 0;
    let completeIndicatorFields = 0;
    
    if (Array.isArray(data.indicators)) {
      const requiredIndicatorFields = ['indicator', 'value', 'status', 'change'];
      data.indicators.forEach(indicator => {
        requiredIndicatorFields.forEach(field => {
          totalIndicatorFields++;
          if (indicator.hasOwnProperty(field) && indicator[field] !== null && indicator[field] !== undefined) {
            completeIndicatorFields++;
          }
        });
      });
    }
    
    const topLevelCompleteness = (presentFields.length / expectedFields.length) * 100;
    const indicatorCompleteness = totalIndicatorFields > 0 ? (completeIndicatorFields / totalIndicatorFields) * 100 : 100;
    
    return {
      percentage: Math.round((topLevelCompleteness + indicatorCompleteness) / 2),
      topLevel: {
        expected: expectedFields.length,
        present: presentFields.length,
        missing: expectedFields.filter(field => !data.hasOwnProperty(field))
      },
      indicators: {
        totalFields: totalIndicatorFields,
        completeFields: completeIndicatorFields,
        completeness: indicatorCompleteness
      }
    };
  }

  async testUICompatibility() {
    console.log('🎨 Testing UI Compatibility...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      const data = await response.json();
      
      const compatibility = {
        reactCompatible: this.testReactCompatibility(data),
        chartCompatible: this.testChartCompatibility(data),
        displayCompatible: this.testDisplayCompatibility(data),
        responsiveCompatible: this.testResponsiveCompatibility(data)
      };
      
      this.results.uiCompatibilityTests = compatibility;
      
      console.log(`  ⚛️  React Compatible: ${compatibility.reactCompatible.compatible ? '✅ Yes' : '❌ No'}`);
      console.log(`  📊 Chart Compatible: ${compatibility.chartCompatible.compatible ? '✅ Yes' : '❌ No'}`);
      console.log(`  🖥️  Display Compatible: ${compatibility.displayCompatible.compatible ? '✅ Yes' : '❌ No'}`);
      
    } catch (error) {
      this.results.issues.push(`UI compatibility test failed: ${error.message}`);
      console.log('  ❌ UI compatibility test failed');
    }
  }

  testReactCompatibility(data) {
    const issues = [];
    
    // Check for React-safe data types
    if (data.indicators) {
      data.indicators.forEach((indicator, index) => {
        if (indicator.value === null || indicator.value === undefined) {
          issues.push(`Indicator ${index}: null/undefined value not React-safe`);
        }
        if (typeof indicator.value === 'object' && !Array.isArray(indicator.value)) {
          issues.push(`Indicator ${index}: complex object value may cause React rendering issues`);
        }
      });
    }
    
    // Check for key uniqueness (React requires unique keys)
    if (Array.isArray(data.indicators)) {
      const indicatorNames = data.indicators.map(i => i.indicator);
      const uniqueNames = [...new Set(indicatorNames)];
      if (indicatorNames.length !== uniqueNames.length) {
        issues.push('Duplicate indicator names detected - React keys must be unique');
      }
    }
    
    return {
      compatible: issues.length === 0,
      issues
    };
  }

  testChartCompatibility(data) {
    const issues = [];
    
    if (data.indicators) {
      data.indicators.forEach((indicator, index) => {
        // Check if values are numeric or can be converted
        const numericValue = parseFloat(indicator.value);
        if (isNaN(numericValue)) {
          issues.push(`Indicator ${index}: value '${indicator.value}' cannot be converted to number for charts`);
        }
        
        // Check change format for chart deltas
        if (indicator.change && !indicator.change.match(/^[+-]?\d+(\.\d+)?%?$/)) {
          issues.push(`Indicator ${index}: change format '${indicator.change}' not chart-compatible`);
        }
      });
    }
    
    return {
      compatible: issues.length === 0,
      issues
    };
  }

  testDisplayCompatibility(data) {
    const issues = [];
    
    if (data.indicators) {
      data.indicators.forEach((indicator, index) => {
        // Check for display-ready strings
        if (typeof indicator.indicator !== 'string' || indicator.indicator.length === 0) {
          issues.push(`Indicator ${index}: indicator name not display-ready`);
        }
        
        // Check status values
        const validStatuses = ['active', 'inactive', 'warning', 'error', 'success'];
        if (indicator.status && !validStatuses.includes(indicator.status.toLowerCase())) {
          issues.push(`Indicator ${index}: status '${indicator.status}' not standard display value`);
        }
        
        // Check value format
        if (indicator.value && typeof indicator.value === 'string' && indicator.value.length > 20) {
          issues.push(`Indicator ${index}: value too long for standard display (${indicator.value.length} chars)`);
        }
      });
    }
    
    return {
      compatible: issues.length === 0,
      issues
    };
  }

  testResponsiveCompatibility(data) {
    const issues = [];
    
    // Check data size for mobile compatibility
    const dataSize = JSON.stringify(data).length;
    if (dataSize > 50000) { // 50KB threshold
      issues.push(`Data size ${dataSize} bytes may be too large for mobile devices`);
    }
    
    // Check indicator count for small screens
    if (data.indicators && data.indicators.length > 10) {
      issues.push(`${data.indicators.length} indicators may be too many for small screens`);
    }
    
    return {
      compatible: issues.length === 0,
      issues,
      dataSize
    };
  }

  async performLoadTesting() {
    console.log('⚡ Performing Load Testing...');
    
    try {
      const tests = {
        sequentialLoad: await this.testSequentialLoad(),
        concurrentLoad: await this.testConcurrentLoad(),
        sustainedLoad: await this.testSustainedLoad()
      };
      
      this.results.performanceTests = tests;
      
      console.log(`  📈 Sequential: ${tests.sequentialLoad.avgTime}ms avg`);
      console.log(`  🔀 Concurrent: ${tests.concurrentLoad.avgTime}ms avg`);
      console.log(`  ⏱️  Sustained: ${tests.sustainedLoad.successRate}% success rate`);
      
    } catch (error) {
      this.results.issues.push(`Load testing failed: ${error.message}`);
      console.log('  ❌ Load testing failed');
    }
  }

  async testSequentialLoad() {
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      await response.json();
      times.push(Date.now() - start);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return {
      iterations,
      times,
      avgTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }

  async testConcurrentLoad() {
    const concurrency = 8;
    const promises = Array(concurrency).fill().map(async () => {
      const start = Date.now();
      const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
      await response.json();
      return Date.now() - start;
    });
    
    const times = await Promise.all(promises);
    
    return {
      concurrency,
      times,
      avgTime: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }

  async testSustainedLoad() {
    const duration = 30000; // 30 seconds
    const interval = 1000; // 1 request per second
    const startTime = Date.now();
    const results = [];
    
    while (Date.now() - startTime < duration) {
      try {
        const start = Date.now();
        const response = await fetch(`${this.baseUrl}/api/performance-metrics`);
        const data = await response.json();
        const time = Date.now() - start;
        
        results.push({
          success: response.status === 200 && !!data.indicators,
          time,
          timestamp: Date.now()
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          timestamp: Date.now()
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    const successful = results.filter(r => r.success);
    
    return {
      duration,
      totalRequests: results.length,
      successful: successful.length,
      successRate: Math.round((successful.length / results.length) * 100),
      avgTime: successful.length > 0 ? Math.round(successful.reduce((sum, r) => sum + r.time, 0) / successful.length) : 0,
      errors: results.filter(r => !r.success).map(r => r.error)
    };
  }

  async identifyRootCauses() {
    console.log('🔍 Identifying Root Causes...');
    
    const issues = this.results.issues;
    const apiTests = this.results.apiTests;
    const structureTests = this.results.dataStructureTests;
    const uiTests = this.results.uiCompatibilityTests;
    
    // Analyze patterns in the issues
    if (apiTests.structure && !apiTests.structure.isValid) {
      this.results.recommendations.push('CRITICAL: Fix data structure validation issues');
    }
    
    if (uiTests.reactCompatible && !uiTests.reactCompatible.compatible) {
      this.results.recommendations.push('HIGH: Address React compatibility issues');
    }
    
    if (uiTests.chartCompatible && !uiTests.chartCompatible.compatible) {
      this.results.recommendations.push('MEDIUM: Fix chart compatibility for better visualization');
    }
    
    if (this.results.performanceTests.sustainedLoad && this.results.performanceTests.sustainedLoad.successRate < 95) {
      this.results.recommendations.push('MEDIUM: Improve API reliability under sustained load');
    }
    
    console.log(`  🎯 Issues Identified: ${issues.length}`);
    console.log(`  💡 Recommendations Generated: ${this.results.recommendations.length}`);
  }

  generateComprehensiveReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPREHENSIVE UI ANALYSIS REPORT');
    console.log('='.repeat(80));
    
    // Executive Summary
    console.log('\n🎯 EXECUTIVE SUMMARY:');
    const totalIssues = this.results.issues.length;
    const criticalIssues = this.results.recommendations.filter(r => r.startsWith('CRITICAL')).length;
    
    console.log(`  Total Issues Found: ${totalIssues}`);
    console.log(`  Critical Issues: ${criticalIssues}`);
    console.log(`  Overall Health: ${this.calculateOverallHealth()}`);
    
    // API Test Results
    console.log('\n📊 API TEST RESULTS:');
    if (this.results.apiTests.basic) {
      console.log(`  Status Code: ${this.results.apiTests.basic.status}`);
      console.log(`  Content Type: ${this.results.apiTests.basic.contentType}`);
      console.log(`  Has Data: ${this.results.apiTests.basic.hasData ? '✅' : '❌'}`);
    }
    
    if (this.results.apiTests.structure) {
      console.log(`  Structure Valid: ${this.results.apiTests.structure.isValid ? '✅' : '❌'}`);
      if (!this.results.apiTests.structure.isValid) {
        console.log(`  Missing Fields: ${this.results.apiTests.structure.missingFields.join(', ')}`);
        if (this.results.apiTests.structure.invalidIndicators.length > 0) {
          console.log(`  Invalid Indicators: ${this.results.apiTests.structure.invalidIndicators.length}`);
        }
      }
    }
    
    // Data Structure Analysis
    console.log('\n🔍 DATA STRUCTURE ANALYSIS:');
    if (this.results.dataStructureTests.rawData) {
      const raw = this.results.dataStructureTests.rawData;
      console.log(`  Indicators: ${raw.sizes.indicators}`);
      console.log(`  Timeframes: ${raw.sizes.timeframes}`);
      console.log(`  Symbols: ${raw.sizes.symbols}`);
    }
    
    if (this.results.dataStructureTests.completeness) {
      console.log(`  Data Completeness: ${this.results.dataStructureTests.completeness.percentage}%`);
    }
    
    // UI Compatibility
    console.log('\n🎨 UI COMPATIBILITY:');
    if (this.results.uiCompatibilityTests) {
      const ui = this.results.uiCompatibilityTests;
      console.log(`  React Compatible: ${ui.reactCompatible?.compatible ? '✅' : '❌'}`);
      console.log(`  Chart Compatible: ${ui.chartCompatible?.compatible ? '✅' : '❌'}`);
      console.log(`  Display Compatible: ${ui.displayCompatible?.compatible ? '✅' : '❌'}`);
      console.log(`  Responsive Compatible: ${ui.responsiveCompatible?.compatible ? '✅' : '❌'}`);
    }
    
    // Performance Results
    console.log('\n⚡ PERFORMANCE RESULTS:');
    if (this.results.performanceTests) {
      const perf = this.results.performanceTests;
      if (perf.sequentialLoad) {
        console.log(`  Sequential Load: ${perf.sequentialLoad.avgTime}ms avg (${perf.sequentialLoad.minTime}-${perf.sequentialLoad.maxTime}ms range)`);
      }
      if (perf.concurrentLoad) {
        console.log(`  Concurrent Load: ${perf.concurrentLoad.avgTime}ms avg (${perf.concurrentLoad.concurrency} concurrent)`);
      }
      if (perf.sustainedLoad) {
        console.log(`  Sustained Load: ${perf.sustainedLoad.successRate}% success rate over ${perf.sustainedLoad.duration/1000}s`);
      }
    }
    
    // Issues and Recommendations
    if (this.results.issues.length > 0) {
      console.log('\n⚠️  IDENTIFIED ISSUES:');
      this.results.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    // Specific Performance Analysis Box Issues
    this.analyzePerformanceBoxSpecifically();
    
    console.log('\n' + '='.repeat(80));
    console.log('🏁 ANALYSIS COMPLETE');
    console.log('='.repeat(80));
  }

  analyzePerformanceBoxSpecifically() {
    console.log('\n🎯 PERFORMANCE ANALYSIS BOX SPECIFIC ISSUES:');
    
    // Check if indicators have the exact fields needed for the performance box
    if (this.results.dataStructureTests.indicatorAnalysis) {
      const analysis = this.results.dataStructureTests.indicatorAnalysis;
      
      console.log(`  Indicator Count: ${analysis.count}`);
      console.log(`  Unique Indicators: ${analysis.uniqueIndicators.length}`);
      
      // Check value types
      console.log(`  Value Types: ${Object.keys(analysis.valueTypes).join(', ')}`);
      if (analysis.valueTypes.object || analysis.valueTypes.undefined) {
        console.log(`  ⚠️  WARNING: Non-string/number values detected - may cause display issues`);
      }
      
      // Check status types
      console.log(`  Status Types: ${Object.keys(analysis.statusTypes).join(', ')}`);
      
      // Check change formats
      console.log(`  Change Formats: ${Object.keys(analysis.changeTypes).join(', ')}`);
    }
    
    // UI-specific recommendations
    console.log('\n🎨 UI-SPECIFIC RECOMMENDATIONS:');
    
    if (this.results.uiCompatibilityTests.reactCompatible && !this.results.uiCompatibilityTests.reactCompatible.compatible) {
      console.log('  🔧 Fix React compatibility issues to prevent UI crashes');
    }
    
    if (this.results.uiCompatibilityTests.displayCompatible && !this.results.uiCompatibilityTests.displayCompatible.compatible) {
      console.log('  🖥️  Standardize display formats for consistent UI appearance');
    }
    
    if (this.results.performanceTests.sequentialLoad && this.results.performanceTests.sequentialLoad.avgTime > 200) {
      console.log('  ⚡ Optimize API response time (currently slow for UI updates)');
    }
  }

  calculateOverallHealth() {
    let score = 100;
    
    // Deduct for API issues
    if (this.results.apiTests.basic && this.results.apiTests.basic.status !== 200) {
      score -= 30;
    }
    
    if (this.results.apiTests.structure && !this.results.apiTests.structure.isValid) {
      score -= 25;
    }
    
    // Deduct for UI compatibility issues
    if (this.results.uiCompatibilityTests) {
      const ui = this.results.uiCompatibilityTests;
      if (ui.reactCompatible && !ui.reactCompatible.compatible) score -= 20;
      if (ui.chartCompatible && !ui.chartCompatible.compatible) score -= 10;
      if (ui.displayCompatible && !ui.displayCompatible.compatible) score -= 10;
      if (ui.responsiveCompatible && !ui.responsiveCompatible.compatible) score -= 5;
    }
    
    // Deduct for performance issues
    if (this.results.performanceTests.sustainedLoad && this.results.performanceTests.sustainedLoad.successRate < 95) {
      score -= 10;
    }
    
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'FAIR';
    if (score >= 40) return 'POOR';
    return 'CRITICAL';
  }
}

// Execute the analysis
const analyzer = new ExternalUIAnalyzer();
analyzer.runCompleteAnalysis().catch(console.error);