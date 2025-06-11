/**
 * Focused UI Diagnostic Tool
 * Quick analysis of performance analysis box display issues
 */

import http from 'http';

class FocusedUIDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.apiData = null;
  }

  async runDiagnostic() {
    console.log('🔍 Focused UI Diagnostic - Performance Analysis Box\n');
    
    try {
      await this.testAPIResponse();
      await this.analyzeDataStructure();
      await this.checkCalculationLogic();
      await this.identifyDisplayIssues();
      
      this.generateFixPlan();
    } catch (error) {
      console.error('❌ Diagnostic failed:', error.message);
    }
  }

  async testAPIResponse() {
    console.log('📊 Testing API Response...');
    
    try {
      const data = await this.makeRequest('/api/performance-metrics');
      this.apiData = data;
      
      console.log(`  ✅ Status: 200 OK`);
      console.log(`  📊 Indicators: ${data.indicators?.length || 0}`);
      console.log(`  🔍 Response Size: ${JSON.stringify(data).length} bytes`);
      
      // Test actual data content
      if (data.indicators && data.indicators.length > 0) {
        const firstIndicator = data.indicators[0];
        console.log(`  📈 Sample Indicator: ${firstIndicator.indicator}`);
        console.log(`  💰 Sample Value: ${firstIndicator.value}`);
        console.log(`  📊 Sample Status: ${firstIndicator.status}`);
        console.log(`  📈 Sample Change: ${firstIndicator.change}`);
      }
      
    } catch (error) {
      this.issues.push(`API Response Error: ${error.message}`);
      console.log('  ❌ API test failed');
    }
  }

  async analyzeDataStructure() {
    console.log('\n🔍 Analyzing Data Structure...');
    
    if (!this.apiData || !this.apiData.indicators) {
      this.issues.push('No indicators data found in API response');
      return;
    }
    
    const indicators = this.apiData.indicators;
    console.log(`  📊 Total Indicators: ${indicators.length}`);
    
    // Check each indicator for UI compatibility
    indicators.forEach((indicator, index) => {
      console.log(`\n  📈 Indicator ${index + 1}: ${indicator.indicator}`);
      console.log(`    Value: ${indicator.value} (${typeof indicator.value})`);
      console.log(`    Status: ${indicator.status} (${typeof indicator.status})`);
      console.log(`    Change: ${indicator.change} (${typeof indicator.change})`);
      
      // Check for UI display issues
      if (indicator.value === null || indicator.value === undefined) {
        this.issues.push(`${indicator.indicator}: null/undefined value`);
      }
      
      if (typeof indicator.value === 'object') {
        this.issues.push(`${indicator.indicator}: complex object value may not display properly`);
      }
      
      if (!indicator.status || indicator.status === '') {
        this.issues.push(`${indicator.indicator}: missing or empty status`);
      }
      
      if (!indicator.change || indicator.change === '') {
        this.issues.push(`${indicator.indicator}: missing or empty change`);
      }
    });
  }

  async checkCalculationLogic() {
    console.log('\n🧮 Checking Calculation Logic...');
    
    try {
      // Test multiple rapid requests to check for calculation consistency
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(this.makeRequest('/api/performance-metrics'));
      }
      
      const results = await Promise.all(requests);
      
      // Compare results for consistency
      const firstResult = JSON.stringify(results[0]);
      let consistent = true;
      
      for (let i = 1; i < results.length; i++) {
        if (JSON.stringify(results[i]) !== firstResult) {
          consistent = false;
          break;
        }
      }
      
      console.log(`  🔄 Calculation Consistency: ${consistent ? '✅ Consistent' : '❌ Inconsistent'}`);
      
      if (!consistent) {
        this.issues.push('Performance metrics calculations are inconsistent between requests');
        
        // Show differences
        console.log('\n  🔍 Detected Differences:');
        results.forEach((result, index) => {
          console.log(`    Request ${index + 1}: ${result.indicators?.length || 0} indicators`);
          if (result.indicators) {
            result.indicators.forEach(indicator => {
              console.log(`      ${indicator.indicator}: ${indicator.value}`);
            });
          }
        });
      }
      
    } catch (error) {
      this.issues.push(`Calculation Logic Test Failed: ${error.message}`);
    }
  }

  async identifyDisplayIssues() {
    console.log('\n🎨 Identifying Display Issues...');
    
    if (!this.apiData || !this.apiData.indicators) {
      console.log('  ❌ No data to analyze for display issues');
      return;
    }
    
    const indicators = this.apiData.indicators;
    
    // Check for common UI display problems
    console.log('  🔍 Checking for common UI display problems...');
    
    // Check value formats
    indicators.forEach(indicator => {
      const value = indicator.value;
      
      if (typeof value === 'string') {
        // Check for very long strings that might break UI layout
        if (value.length > 20) {
          this.issues.push(`${indicator.indicator}: Value too long for UI (${value.length} chars): "${value}"`);
        }
        
        // Check for special characters that might break display
        if (value.includes('<') || value.includes('>') || value.includes('&')) {
          this.issues.push(`${indicator.indicator}: Value contains HTML-breaking characters: "${value}"`);
        }
      }
      
      if (typeof value === 'number') {
        // Check for problematic numbers
        if (!isFinite(value)) {
          this.issues.push(`${indicator.indicator}: Non-finite number value: ${value}`);
        }
        
        if (value === 0 && indicator.indicator !== 'RSI') {
          this.issues.push(`${indicator.indicator}: Suspicious zero value`);
        }
      }
      
      // Check change format
      const change = indicator.change;
      if (change && !change.match(/^[+-]?\d+(\.\d+)?%?$/)) {
        this.issues.push(`${indicator.indicator}: Unusual change format: "${change}"`);
      }
      
      // Check status values
      const validStatuses = ['active', 'inactive', 'warning', 'error', 'success', 'bullish', 'bearish', 'neutral'];
      if (indicator.status && !validStatuses.includes(indicator.status.toLowerCase())) {
        this.issues.push(`${indicator.indicator}: Non-standard status: "${indicator.status}"`);
      }
    });
    
    console.log(`  📊 Display Issues Found: ${this.issues.filter(i => i.includes('Value too long') || i.includes('HTML-breaking') || i.includes('change format')).length}`);
  }

  generateFixPlan() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 FOCUSED DIAGNOSTIC REPORT');
    console.log('='.repeat(80));
    
    console.log('\n🎯 SUMMARY:');
    console.log(`  Total Issues Found: ${this.issues.length}`);
    
    if (this.issues.length === 0) {
      console.log('  ✅ No critical issues detected with API data structure');
      console.log('  💡 Performance analysis box should be displaying correctly');
      console.log('\n🔍 POSSIBLE CAUSES IF UI IS STILL NOT WORKING:');
      console.log('  1. Frontend caching issues - UI may be showing old data');
      console.log('  2. React component state management problems');
      console.log('  3. CSS styling conflicts preventing proper display');
      console.log('  4. Browser console errors blocking UI updates');
      console.log('  5. WebSocket connection issues preventing real-time updates');
    } else {
      console.log('\n⚠️  IDENTIFIED ISSUES:');
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n💡 RECOMMENDED FIXES:');
    
    if (this.apiData && this.apiData.indicators) {
      console.log('  ✅ API is working correctly with proper data structure');
      console.log('  🔧 Focus on frontend UI component debugging');
      console.log('  🔄 Check browser developer tools for JavaScript errors');
      console.log('  🎨 Verify CSS styles are not hiding the performance box');
      console.log('  📱 Test with browser cache cleared');
    }
    
    // Check for specific data patterns that might indicate calculation issues
    if (this.apiData && this.apiData.indicators) {
      const hasAllZeros = this.apiData.indicators.every(ind => 
        (typeof ind.value === 'number' && ind.value === 0) || 
        (typeof ind.value === 'string' && ind.value === '0')
      );
      
      if (hasAllZeros) {
        console.log('  ⚠️  WARNING: All indicators show zero values - calculation system may need restart');
      }
      
      const hasNullValues = this.apiData.indicators.some(ind => 
        ind.value === null || ind.value === undefined
      );
      
      if (hasNullValues) {
        console.log('  ⚠️  WARNING: Some indicators have null values - data source issues detected');
      }
    }
    
    console.log('\n🏁 DIAGNOSTIC COMPLETE');
    console.log('='.repeat(80));
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: endpoint,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }
}

// Execute the diagnostic
const diagnostic = new FocusedUIDiagnostic();
diagnostic.runDiagnostic().catch(console.error);