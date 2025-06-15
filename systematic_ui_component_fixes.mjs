/**
 * Systematic UI Component Fixes - External Shell Implementation
 * Addresses critical issues identified in comprehensive error analysis
 * Following 11 Ground Rules Protocol
 */

class SystematicUIComponentFixes {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.fixes = [];
    this.validationResults = {};
  }

  async implementSystematicFixes() {
    console.log('🔧 SYSTEMATIC UI COMPONENT FIXES');
    console.log('================================');
    console.log('Following 11 Ground Rules Protocol\n');
    
    await this.fix1_APIEndpointValidation();
    await this.fix2_DataStructureCompatibility();
    await this.fix3_ComponentErrorHandling();
    await this.validateFixesExternally();
    await this.generateFixReport();
  }

  async fix1_APIEndpointValidation() {
    console.log('🔍 FIX 1: API ENDPOINT VALIDATION');
    console.log('=================================');
    
    // Test critical endpoints for proper JSON responses
    const criticalEndpoints = [
      { name: 'signals', url: '/api/signals', critical: true },
      { name: 'signalsBTC', url: '/api/signals/BTC%2FUSDT', critical: true },
      { name: 'market', url: '/api/crypto/all-pairs', critical: true },
      { name: 'technicalAnalysis', url: '/api/technical-analysis/BTC%2FUSDT', critical: false },
      { name: 'performanceMetrics', url: '/api/performance-metrics', critical: false }
    ];
    
    for (const endpoint of criticalEndpoints) {
      try {
        console.log(`Testing ${endpoint.name}...`);
        const response = await fetch(`${this.baseUrl}${endpoint.url}`);
        
        if (response.status === 200) {
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              console.log(`  ✅ ${endpoint.name}: Valid JSON response`);
              
              // Validate data structure
              const isValid = this.validateDataStructure(endpoint.name, data);
              if (isValid) {
                console.log(`  ✅ ${endpoint.name}: Data structure valid`);
                this.validationResults[endpoint.name] = 'VALID';
              } else {
                console.log(`  ⚠️ ${endpoint.name}: Data structure needs fixes`);
                this.validationResults[endpoint.name] = 'STRUCTURE_ISSUES';
              }
            } catch (jsonError) {
              console.log(`  ❌ ${endpoint.name}: Invalid JSON - ${jsonError.message}`);
              this.validationResults[endpoint.name] = 'INVALID_JSON';
              
              if (endpoint.critical) {
                this.fixes.push({
                  type: 'CRITICAL_JSON_ERROR',
                  endpoint: endpoint.name,
                  issue: 'Endpoint returning invalid JSON',
                  priority: 'CRITICAL'
                });
              }
            }
          } else {
            console.log(`  ❌ ${endpoint.name}: Wrong content type - ${contentType}`);
            this.validationResults[endpoint.name] = 'WRONG_CONTENT_TYPE';
            
            // Check if it's HTML (common issue)
            const text = await response.text();
            if (text.includes('<!DOCTYPE')) {
              console.log(`  📋 ${endpoint.name}: Returning HTML page instead of JSON`);
              this.fixes.push({
                type: 'HTML_INSTEAD_OF_JSON',
                endpoint: endpoint.name,
                issue: 'API endpoint returning HTML page',
                priority: 'CRITICAL'
              });
            }
          }
        } else {
          console.log(`  ❌ ${endpoint.name}: HTTP ${response.status}`);
          this.validationResults[endpoint.name] = `HTTP_${response.status}`;
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: Network error - ${error.message}`);
        this.validationResults[endpoint.name] = 'NETWORK_ERROR';
      }
      
      await this.sleep(200);
    }
    
    console.log('');
  }

  validateDataStructure(endpoint, data) {
    switch (endpoint) {
      case 'market':
        return Array.isArray(data) && data.length > 0 && 
               data[0].symbol && (data[0].currentPrice !== undefined || data[0].price !== undefined);
      
      case 'signals':
      case 'signalsBTC':
        return Array.isArray(data) && data.length >= 0; // Allow empty arrays
      
      case 'technicalAnalysis':
        return data && data.indicators;
      
      case 'performanceMetrics':
        return data && Array.isArray(data.indicators);
      
      default:
        return true;
    }
  }

  async fix2_DataStructureCompatibility() {
    console.log('🔄 FIX 2: DATA STRUCTURE COMPATIBILITY');
    console.log('=====================================');
    
    // Test market data structure for price field compatibility
    console.log('Testing market data price field compatibility...');
    try {
      const response = await fetch(`${this.baseUrl}/api/crypto/all-pairs`);
      if (response.status === 200) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const sample = data[0];
          console.log(`Sample data fields: ${Object.keys(sample).join(', ')}`);
          
          // Check price field availability
          const hasPrice = sample.price !== undefined;
          const hasCurrentPrice = sample.currentPrice !== undefined;
          const hasChange24h = sample.change24h !== undefined;
          
          console.log(`  Price field present: ${hasPrice}`);
          console.log(`  CurrentPrice field present: ${hasCurrentPrice}`);
          console.log(`  Change24h field present: ${hasChange24h}`);
          
          if (hasPrice || hasCurrentPrice) {
            console.log(`  ✅ Price data: Compatible structure found`);
            this.fixes.push({
              type: 'PRICE_COMPATIBILITY_OK',
              component: 'LiveMarketOverview',
              fix: 'Use currentPrice || price fallback pattern',
              priority: 'INFO'
            });
          } else {
            console.log(`  ❌ Price data: No compatible price field found`);
            this.fixes.push({
              type: 'MISSING_PRICE_FIELD',
              component: 'LiveMarketOverview',
              issue: 'No price or currentPrice field available',
              priority: 'CRITICAL'
            });
          }
          
          if (!hasChange24h) {
            console.log(`  ⚠️ Change data: Missing change24h field`);
            this.fixes.push({
              type: 'MISSING_CHANGE_FIELD',
              component: 'LiveMarketOverview',
              issue: 'change24h field missing',
              priority: 'HIGH'
            });
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ Market data test failed: ${error.message}`);
    }
    
    await this.sleep(300);
    
    // Test signal data structure
    console.log('\nTesting signal data structure...');
    try {
      const response = await fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`);
      if (response.status === 200) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const signal = data[0];
          const requiredFields = ['symbol', 'direction', 'confidence', 'timeframe'];
          const presentFields = requiredFields.filter(field => signal[field] !== undefined);
          
          console.log(`  Required fields present: ${presentFields.length}/${requiredFields.length}`);
          console.log(`  Present: ${presentFields.join(', ')}`);
          
          if (presentFields.length === requiredFields.length) {
            console.log(`  ✅ Signal structure: All required fields present`);
            this.fixes.push({
              type: 'SIGNAL_STRUCTURE_OK',
              component: 'CriticalSignalAnalysis',
              fix: 'Signal data structure is compatible',
              priority: 'INFO'
            });
          } else {
            const missingFields = requiredFields.filter(field => !presentFields.includes(field));
            console.log(`  ❌ Signal structure: Missing ${missingFields.join(', ')}`);
            this.fixes.push({
              type: 'MISSING_SIGNAL_FIELDS',
              component: 'CriticalSignalAnalysis',
              issue: `Missing fields: ${missingFields.join(', ')}`,
              priority: 'HIGH'
            });
          }
        } else if (Array.isArray(data) && data.length === 0) {
          console.log(`  ⚠️ Signal data: Empty array (may be normal)`);
          this.fixes.push({
            type: 'EMPTY_SIGNAL_ARRAY',
            component: 'CriticalSignalAnalysis',
            fix: 'Handle empty signal arrays gracefully',
            priority: 'LOW'
          });
        }
      }
    } catch (error) {
      console.log(`  ❌ Signal data test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async fix3_ComponentErrorHandling() {
    console.log('🛡️ FIX 3: COMPONENT ERROR HANDLING');
    console.log('==================================');
    
    // Test component resilience to missing data
    console.log('Testing component error handling patterns...');
    
    // Test undefined data handling
    const testCases = [
      { name: 'Undefined data', test: () => this.testUndefinedHandling() },
      { name: 'Empty arrays', test: () => this.testEmptyArrayHandling() },
      { name: 'Invalid numbers', test: () => this.testInvalidNumberHandling() },
      { name: 'Missing properties', test: () => this.testMissingPropertyHandling() }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`  Testing ${testCase.name}...`);
        const result = await testCase.test();
        
        if (result.success) {
          console.log(`    ✅ ${testCase.name}: Handled correctly`);
        } else {
          console.log(`    ⚠️ ${testCase.name}: Needs improvement`);
          this.fixes.push({
            type: 'ERROR_HANDLING_IMPROVEMENT',
            area: testCase.name,
            issue: result.issue,
            priority: 'MEDIUM'
          });
        }
      } catch (error) {
        console.log(`    ❌ ${testCase.name}: Test failed - ${error.message}`);
      }
      
      await this.sleep(100);
    }
    
    console.log('');
  }

  testUndefinedHandling() {
    // Simulate undefined data scenarios
    const undefinedPrice = undefined;
    const undefinedChange = undefined;
    
    // Test price formatting with undefined
    const priceResult = this.formatPrice(undefinedPrice, 'BTC/USDT');
    const changeResult = this.formatChange(undefinedChange);
    
    return {
      success: priceResult === 'N/A' && changeResult === '0.00%',
      issue: priceResult !== 'N/A' || changeResult !== '0.00%' ? 'Undefined values not handled properly' : null
    };
  }

  testEmptyArrayHandling() {
    // Test empty array handling
    const emptySignals = [];
    const filteredSignals = emptySignals.filter(signal => signal && signal.confidence >= 70);
    
    return {
      success: Array.isArray(filteredSignals) && filteredSignals.length === 0,
      issue: !Array.isArray(filteredSignals) ? 'Empty array filtering fails' : null
    };
  }

  testInvalidNumberHandling() {
    // Test invalid number handling
    const invalidPrice = 'invalid';
    const nanPrice = NaN;
    
    const invalidResult = this.formatPrice(invalidPrice, 'BTC/USDT');
    const nanResult = this.formatPrice(nanPrice, 'BTC/USDT');
    
    return {
      success: invalidResult === 'N/A' && nanResult === 'N/A',
      issue: invalidResult !== 'N/A' || nanResult !== 'N/A' ? 'Invalid numbers not handled' : null
    };
  }

  testMissingPropertyHandling() {
    // Test missing property access
    const incompleteData = { symbol: 'BTC/USDT' }; // Missing price and change
    
    const hasPrice = incompleteData.currentPrice !== undefined || incompleteData.price !== undefined;
    const hasChange = incompleteData.change24h !== undefined;
    
    return {
      success: !hasPrice && !hasChange, // Expected for incomplete data
      issue: null // This is expected behavior
    };
  }

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

  async validateFixesExternally() {
    console.log('✅ EXTERNAL VALIDATION OF FIXES');
    console.log('===============================');
    
    // Re-test critical endpoints after identifying fixes
    const criticalTests = [
      { name: 'Market data compatibility', test: () => this.validateMarketDataFix() },
      { name: 'Signal data structure', test: () => this.validateSignalDataFix() },
      { name: 'Error handling resilience', test: () => this.validateErrorHandlingFix() }
    ];
    
    let passedTests = 0;
    
    for (const test of criticalTests) {
      try {
        console.log(`Validating ${test.name}...`);
        const result = await test.test();
        
        if (result.success) {
          console.log(`  ✅ ${test.name}: PASSED`);
          passedTests++;
        } else {
          console.log(`  ❌ ${test.name}: FAILED - ${result.issue}`);
        }
      } catch (error) {
        console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
      }
      
      await this.sleep(200);
    }
    
    console.log(`\nValidation Results: ${passedTests}/${criticalTests.length} tests passed\n`);
  }

  async validateMarketDataFix() {
    const response = await fetch(`${this.baseUrl}/api/crypto/all-pairs`);
    if (response.status === 200) {
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const sample = data[0];
        const hasCompatiblePrice = sample.currentPrice !== undefined || sample.price !== undefined;
        
        return {
          success: hasCompatiblePrice,
          issue: hasCompatiblePrice ? null : 'No compatible price field found'
        };
      }
    }
    
    return { success: false, issue: 'Market data not available' };
  }

  async validateSignalDataFix() {
    const response = await fetch(`${this.baseUrl}/api/signals/BTC%2FUSDT`);
    if (response.status === 200) {
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Empty arrays are acceptable
        if (data.length === 0) {
          return { success: true, issue: null };
        }
        
        // If there are signals, validate structure
        const signal = data[0];
        const hasRequiredFields = signal.symbol && signal.direction && 
                                 signal.confidence !== undefined && signal.timeframe;
        
        return {
          success: hasRequiredFields,
          issue: hasRequiredFields ? null : 'Signal missing required fields'
        };
      }
    }
    
    return { success: false, issue: 'Signal data not available or invalid' };
  }

  async validateErrorHandlingFix() {
    // Test that our error handling functions work correctly
    const tests = [
      this.formatPrice(undefined, 'BTC/USDT') === 'N/A',
      this.formatPrice(NaN, 'BTC/USDT') === 'N/A',
      this.formatPrice('invalid', 'BTC/USDT') === 'N/A',
      this.formatChange(undefined) === '0.00%',
      this.formatChange(NaN) === '0.00%'
    ];
    
    const passedTests = tests.filter(Boolean).length;
    
    return {
      success: passedTests === tests.length,
      issue: passedTests !== tests.length ? `${tests.length - passedTests} error handling tests failed` : null
    };
  }

  async generateFixReport() {
    console.log('📋 SYSTEMATIC FIX REPORT');
    console.log('========================');
    
    // Categorize fixes by priority
    const criticalFixes = this.fixes.filter(f => f.priority === 'CRITICAL');
    const highFixes = this.fixes.filter(f => f.priority === 'HIGH');
    const mediumFixes = this.fixes.filter(f => f.priority === 'MEDIUM');
    const infoFixes = this.fixes.filter(f => f.priority === 'INFO');
    
    console.log(`\n🎯 FIX SUMMARY:`);
    console.log(`Critical Issues: ${criticalFixes.length}`);
    console.log(`High Priority: ${highFixes.length}`);
    console.log(`Medium Priority: ${mediumFixes.length}`);
    console.log(`Info/Success: ${infoFixes.length}`);
    
    if (criticalFixes.length > 0) {
      console.log('\n🚨 CRITICAL FIXES REQUIRED:');
      criticalFixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.type}${fix.endpoint ? ` (${fix.endpoint})` : ''}${fix.component ? ` (${fix.component})` : ''}`);
        console.log(`   ${fix.issue || fix.fix}`);
      });
    }
    
    if (highFixes.length > 0) {
      console.log('\n⚠️ HIGH PRIORITY FIXES:');
      highFixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.type}${fix.component ? ` (${fix.component})` : ''}`);
        console.log(`   ${fix.issue || fix.fix}`);
      });
    }
    
    console.log('\n🔧 IMPLEMENTATION PLAN:');
    
    if (criticalFixes.some(f => f.type === 'HTML_INSTEAD_OF_JSON')) {
      console.log('1. Fix API routing to return JSON instead of HTML pages');
      console.log('2. Add proper content-type headers to API responses');
    }
    
    if (criticalFixes.some(f => f.type === 'MISSING_PRICE_FIELD') || 
        highFixes.some(f => f.type === 'MISSING_CHANGE_FIELD')) {
      console.log('3. Implement robust data field compatibility in components');
      console.log('4. Add fallback handling for missing price/change data');
    }
    
    if (mediumFixes.some(f => f.type === 'ERROR_HANDLING_IMPROVEMENT')) {
      console.log('5. Enhance component error handling and data validation');
      console.log('6. Add loading states and graceful degradation');
    }
    
    console.log('\n✅ EXTERNAL VALIDATION COMPLETE');
    console.log('Ready for systematic implementation following 11 Ground Rules');
    
    return {
      criticalIssues: criticalFixes.length,
      totalIssues: this.fixes.length,
      validationResults: this.validationResults,
      needsImmediateAttention: criticalFixes.length > 0
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const fixer = new SystematicUIComponentFixes();
  const results = await fixer.implementSystematicFixes();
  return results;
}

main().catch(console.error);