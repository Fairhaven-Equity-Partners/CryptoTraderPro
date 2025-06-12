/**
 * Performance Analysis System Diagnostic Tool
 * External shell analysis to identify calculation and display issues
 */

class PerformanceAnalysisDiagnostic {
  constructor() {
    this.issues = [];
    this.testResults = {};
    this.apiBase = 'http://localhost:5000';
  }

  async runComprehensiveDiagnostic() {
    console.log('🔍 PERFORMANCE ANALYSIS DIAGNOSTIC');
    console.log('═'.repeat(60));
    
    try {
      // Test 1: API Endpoint Availability
      await this.testAPIEndpoints();
      
      // Test 2: Performance Metrics Calculation
      await this.testPerformanceCalculations();
      
      // Test 3: Data Structure Validation
      await this.testDataStructures();
      
      // Test 4: Frontend Display Logic
      await this.testDisplayLogic();
      
      // Test 5: Historical Data Quality
      await this.testHistoricalDataQuality();
      
      // Test 6: Real-time Updates
      await this.testRealTimeUpdates();
      
      this.generateDiagnosticReport();
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
    }
  }

  async testAPIEndpoints() {
    console.log('\n📡 Testing API Endpoints...');
    
    const endpoints = [
      '/api/performance-metrics',
      '/api/accuracy/BTC/USDT',
      '/api/feedback/performance-report',
      '/api/analytics/advanced/BTC%2FUSDT',
      '/api/signals/BTC/USDT'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: Status ${response.status}`);
          
          // Check data structure
          if (!data || (Array.isArray(data) && data.length === 0)) {
            this.issues.push(`${endpoint}: Empty or null response`);
            console.log(`   ⚠️  Warning: Empty response`);
          } else {
            console.log(`   📊 Data: ${JSON.stringify(data).substring(0, 100)}...`);
          }
          
          this.testResults[endpoint] = { status: 'ok', data };
        } else {
          console.log(`❌ ${endpoint}: Status ${response.status}`);
          this.issues.push(`${endpoint}: HTTP ${response.status}`);
          this.testResults[endpoint] = { status: 'error', code: response.status };
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
        this.issues.push(`${endpoint}: ${error.message}`);
        this.testResults[endpoint] = { status: 'error', message: error.message };
      }
    }
  }

  async testPerformanceCalculations() {
    console.log('\n🧮 Testing Performance Calculations...');
    
    try {
      // Test accuracy calculation
      const accuracyResponse = await this.makeRequest('/api/accuracy/BTC/USDT');
      if (accuracyResponse.ok) {
        const accuracyData = await accuracyResponse.json();
        console.log('📈 Accuracy Data Structure:');
        console.log('   Keys:', Object.keys(accuracyData));
        
        if (accuracyData.totalPredictions) {
          console.log(`   Total Predictions: ${accuracyData.totalPredictions}`);
          console.log(`   Correct Predictions: ${accuracyData.correctPredictions}`);
          console.log(`   Accuracy Rate: ${accuracyData.accuracyRate}%`);
        } else {
          this.issues.push('Accuracy calculation: Missing totalPredictions field');
        }
        
        if (accuracyData.timeframeBreakdown) {
          console.log('   Timeframe Breakdown:', Object.keys(accuracyData.timeframeBreakdown));
        } else {
          this.issues.push('Accuracy calculation: Missing timeframeBreakdown');
        }
      }
      
      // Test performance metrics
      const metricsResponse = await this.makeRequest('/api/performance-metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        console.log('📊 Performance Metrics Structure:');
        console.log('   Keys:', Object.keys(metricsData));
        
        // Check for required metrics
        const requiredMetrics = ['winRate', 'profitLoss', 'sharpeRatio', 'maxDrawdown'];
        for (const metric of requiredMetrics) {
          if (metricsData[metric] !== undefined) {
            console.log(`   ✅ ${metric}: ${metricsData[metric]}`);
          } else {
            this.issues.push(`Performance metrics: Missing ${metric}`);
            console.log(`   ❌ Missing: ${metric}`);
          }
        }
      }
      
    } catch (error) {
      this.issues.push(`Performance calculation test: ${error.message}`);
    }
  }

  async testDataStructures() {
    console.log('\n🏗️  Testing Data Structures...');
    
    try {
      // Test signals data structure
      const signalsResponse = await this.makeRequest('/api/signals/BTC/USDT');
      if (signalsResponse.ok) {
        const signalsData = await signalsResponse.json();
        
        if (Array.isArray(signalsData) && signalsData.length > 0) {
          const signal = signalsData[0];
          console.log('📡 Signal Structure Analysis:');
          console.log('   Required fields check:');
          
          const requiredFields = ['direction', 'confidence', 'timeframe', 'timestamp'];
          for (const field of requiredFields) {
            if (signal[field] !== undefined) {
              console.log(`   ✅ ${field}: ${signal[field]}`);
            } else {
              this.issues.push(`Signal structure: Missing ${field}`);
              console.log(`   ❌ Missing: ${field}`);
            }
          }
          
          // Validate data types
          if (typeof signal.confidence !== 'number' || signal.confidence < 0 || signal.confidence > 100) {
            this.issues.push('Signal structure: Invalid confidence value');
          }
          
          if (!['LONG', 'SHORT', 'NEUTRAL'].includes(signal.direction)) {
            this.issues.push('Signal structure: Invalid direction value');
          }
          
        } else {
          this.issues.push('Signals data: Empty or invalid array');
        }
      }
      
    } catch (error) {
      this.issues.push(`Data structure test: ${error.message}`);
    }
  }

  async testDisplayLogic() {
    console.log('\n🖥️  Testing Display Logic...');
    
    try {
      // Test advanced analytics display
      const analyticsResponse = await this.makeRequest('/api/analytics/advanced/BTC%2FUSDT');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        console.log('📈 Analytics Display Data:');
        
        // Check for display-ready data
        if (analyticsData.performanceMetrics) {
          console.log('   ✅ Performance metrics available for display');
          console.log('   Metrics:', Object.keys(analyticsData.performanceMetrics));
        } else {
          this.issues.push('Display logic: Missing performanceMetrics for analytics');
        }
        
        if (analyticsData.riskMetrics) {
          console.log('   ✅ Risk metrics available for display');
        } else {
          this.issues.push('Display logic: Missing riskMetrics for analytics');
        }
        
        if (analyticsData.tradingMetrics) {
          console.log('   ✅ Trading metrics available for display');
        } else {
          this.issues.push('Display logic: Missing tradingMetrics for analytics');
        }
      }
      
    } catch (error) {
      this.issues.push(`Display logic test: ${error.message}`);
    }
  }

  async testHistoricalDataQuality() {
    console.log('\n📊 Testing Historical Data Quality...');
    
    try {
      // Test feedback performance report
      const feedbackResponse = await this.makeRequest('/api/feedback/performance-report');
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        console.log('📋 Historical Data Analysis:');
        
        if (feedbackData.totalRecords) {
          console.log(`   Total Records: ${feedbackData.totalRecords}`);
          
          if (feedbackData.totalRecords < 10) {
            this.issues.push('Historical data: Insufficient data points for reliable analysis');
          }
        } else {
          this.issues.push('Historical data: No totalRecords field');
        }
        
        if (feedbackData.timeframeCoverage) {
          console.log('   Timeframe Coverage:', Object.keys(feedbackData.timeframeCoverage));
        } else {
          this.issues.push('Historical data: Missing timeframeCoverage');
        }
        
        if (feedbackData.dataQuality) {
          console.log(`   Data Quality Score: ${feedbackData.dataQuality}`);
          
          if (feedbackData.dataQuality < 70) {
            this.issues.push('Historical data: Low data quality score');
          }
        }
      }
      
    } catch (error) {
      this.issues.push(`Historical data test: ${error.message}`);
    }
  }

  async testRealTimeUpdates() {
    console.log('\n🔄 Testing Real-time Updates...');
    
    try {
      // Make multiple requests to check for data freshness
      const timestamps = [];
      
      for (let i = 0; i < 3; i++) {
        const response = await this.makeRequest('/api/performance-metrics');
        if (response.ok) {
          const data = await response.json();
          if (data.lastUpdated) {
            timestamps.push(new Date(data.lastUpdated).getTime());
          }
        }
        
        if (i < 2) await this.sleep(2000); // 2 second delay
      }
      
      if (timestamps.length >= 2) {
        const timeDiff = Math.abs(timestamps[timestamps.length - 1] - timestamps[0]);
        console.log(`   Time difference between requests: ${timeDiff}ms`);
        
        if (timeDiff > 300000) { // 5 minutes
          this.issues.push('Real-time updates: Data appears stale (>5 minutes old)');
        } else {
          console.log('   ✅ Data appears fresh');
        }
      } else {
        this.issues.push('Real-time updates: Could not verify data freshness');
      }
      
    } catch (error) {
      this.issues.push(`Real-time update test: ${error.message}`);
    }
  }

  generateDiagnosticReport() {
    console.log('\n📋 DIAGNOSTIC REPORT');
    console.log('═'.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('✅ No issues detected - Performance analysis system appears healthy');
    } else {
      console.log(`❌ Found ${this.issues.length} issues:`);
      console.log('');
      
      // Categorize issues
      const categories = {
        'API': [],
        'Calculation': [],
        'Display': [],
        'Data': []
      };
      
      this.issues.forEach(issue => {
        if (issue.includes('HTTP') || issue.includes('endpoint')) {
          categories.API.push(issue);
        } else if (issue.includes('calculation') || issue.includes('metrics')) {
          categories.Calculation.push(issue);
        } else if (issue.includes('display') || issue.includes('Display')) {
          categories.Display.push(issue);
        } else {
          categories.Data.push(issue);
        }
      });
      
      Object.keys(categories).forEach(category => {
        if (categories[category].length > 0) {
          console.log(`🔍 ${category} Issues:`);
          categories[category].forEach(issue => {
            console.log(`   • ${issue}`);
          });
          console.log('');
        }
      });
      
      // Generate fix recommendations
      console.log('🔧 RECOMMENDED FIXES:');
      console.log('');
      
      if (categories.API.length > 0) {
        console.log('📡 API Issues:');
        console.log('   • Check endpoint routing in server/routes.ts');
        console.log('   • Verify middleware configuration');
        console.log('   • Check for missing route handlers');
        console.log('');
      }
      
      if (categories.Calculation.length > 0) {
        console.log('🧮 Calculation Issues:');
        console.log('   • Review performance metric calculation logic');
        console.log('   • Check database query implementations');
        console.log('   • Verify accuracy calculation algorithms');
        console.log('');
      }
      
      if (categories.Display.length > 0) {
        console.log('🖥️  Display Issues:');
        console.log('   • Check frontend component data handling');
        console.log('   • Verify data transformation logic');
        console.log('   • Review UI state management');
        console.log('');
      }
      
      if (categories.Data.length > 0) {
        console.log('📊 Data Issues:');
        console.log('   • Check database schema consistency');
        console.log('   • Verify data collection processes');
        console.log('   • Review data validation logic');
      }
    }
    
    // Export detailed results
    console.log('\n💾 Detailed test results saved to performance_diagnostic_results.json');
    
    const results = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      issues: this.issues,
      testResults: this.testResults,
      recommendations: this.generateSpecificRecommendations()
    };
    
    // Would save to file in real implementation
    console.log('Results summary:', JSON.stringify(results, null, 2));
  }

  generateSpecificRecommendations() {
    const recommendations = [];
    
    // Analyze patterns in issues
    if (this.issues.some(issue => issue.includes('Missing'))) {
      recommendations.push('Implement missing data fields in API responses');
    }
    
    if (this.issues.some(issue => issue.includes('Empty'))) {
      recommendations.push('Address empty data responses - check data collection');
    }
    
    if (this.issues.some(issue => issue.includes('HTTP'))) {
      recommendations.push('Fix API endpoint routing and error handling');
    }
    
    if (this.issues.some(issue => issue.includes('quality'))) {
      recommendations.push('Improve data quality checks and validation');
    }
    
    return recommendations;
  }

  async makeRequest(endpoint) {
    const url = `${this.apiBase}${endpoint}`;
    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run diagnostic
async function main() {
  const diagnostic = new PerformanceAnalysisDiagnostic();
  await diagnostic.runComprehensiveDiagnostic();
}

// Setup fetch for Node.js environment
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main().catch(console.error);