#!/usr/bin/env node

/**
 * CRITICAL CONFLUENCE FIX - External Shell Implementation
 * Direct fix for Critical Signal Analysis confluence display issue
 * Ground Rules Compliance: External shell testing with authentic market data only
 */

import fetch from 'node-fetch';

class CriticalConfluenceFix {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      beforeFix: { confluenceFieldsPresent: 0, totalSignals: 0 },
      afterFix: { confluenceFieldsPresent: 0, totalSignals: 0 }
    };
  }

  async runComprehensiveFix() {
    console.log('🔧 CRITICAL CONFLUENCE FIX - External Shell Implementation');
    console.log('Following All 11 Ground Rules for Authentic Market Data');
    console.log('================================================================================\n');

    // Step 1: Analyze current state
    await this.analyzeCurrentState();

    // Step 2: Implement direct fix
    await this.implementDirectFix();

    // Step 3: Validate fix results
    await this.validateFixResults();

    // Step 4: Generate comprehensive report
    this.generateFixReport();
  }

  async analyzeCurrentState() {
    console.log('🔍 Step 1: Analyzing Current Confluence Field State');
    console.log('--------------------------------------------------\n');

    try {
      // Test primary endpoints
      const endpoints = [
        '/api/signals',
        '/api/signals/BTC/USDT', 
        '/api/signals/BTC%2FUSDT'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const hasConfluence = data[0].hasOwnProperty('confluence');
          const hasConfluenceAnalysis = data[0].hasOwnProperty('confluenceAnalysis');
          
          console.log(`📡 ${endpoint}:`);
          console.log(`   ✓ Returns ${data.length} signals`);
          console.log(`   ✓ Confluence field: ${hasConfluence ? 'PRESENT' : 'MISSING'}`);
          console.log(`   ✓ ConfluenceAnalysis field: ${hasConfluenceAnalysis ? 'PRESENT' : 'MISSING'}`);
          
          this.testResults.beforeFix.totalSignals += data.length;
          if (hasConfluence && hasConfluenceAnalysis) {
            this.testResults.beforeFix.confluenceFieldsPresent += data.length;
          }
        }
        console.log('');
      }
    } catch (error) {
      console.log(`❌ Error analyzing current state: ${error.message}`);
    }
  }

  async implementDirectFix() {
    console.log('🛠️ Step 2: Implementing Direct Confluence Fix');
    console.log('--------------------------------------------------\n');

    try {
      // Force signal cache regeneration
      console.log('🔄 Forcing signal cache regeneration...');
      const regenerateResponse = await fetch(`${this.baseUrl}/api/automation/force-regenerate`, {
        method: 'POST'
      });
      
      if (regenerateResponse.ok) {
        console.log('✅ Signal cache regeneration triggered successfully');
      } else {
        console.log('❌ Failed to trigger signal cache regeneration');
      }

      // Wait for regeneration to complete
      console.log('⏳ Waiting 5 seconds for signal regeneration...');
      await this.sleep(5000);

      // Test if confluence fields are now present
      console.log('🔍 Testing confluence field presence after regeneration...');
      
    } catch (error) {
      console.log(`❌ Error implementing fix: ${error.message}`);
    }
  }

  async validateFixResults() {
    console.log('✅ Step 3: Validating Fix Results');
    console.log('--------------------------------------------------\n');

    try {
      // Re-test all endpoints
      const endpoints = [
        '/api/signals/BTC/USDT',
        '/api/signals/BTC%2FUSDT',
        '/api/signals'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const hasConfluence = data[0].hasOwnProperty('confluence');
          const hasConfluenceAnalysis = data[0].hasOwnProperty('confluenceAnalysis');
          
          console.log(`📡 ${endpoint} (After Fix):`);
          console.log(`   ✓ Returns ${data.length} signals`);
          console.log(`   ✓ Confluence field: ${hasConfluence ? 'PRESENT ✅' : 'MISSING ❌'}`);
          console.log(`   ✓ ConfluenceAnalysis field: ${hasConfluenceAnalysis ? 'PRESENT ✅' : 'MISSING ❌'}`);
          
          this.testResults.afterFix.totalSignals += data.length;
          if (hasConfluence && hasConfluenceAnalysis) {
            this.testResults.afterFix.confluenceFieldsPresent += data.length;
          }

          // Show sample confluence data if present
          if (hasConfluence && hasConfluenceAnalysis) {
            console.log(`   📊 Sample confluence: ${data[0].confluence}`);
            console.log(`   📊 Sample analysis score: ${data[0].confluenceAnalysis?.score || 'N/A'}`);
          }
        }
        console.log('');
      }
    } catch (error) {
      console.log(`❌ Error validating fix results: ${error.message}`);
    }
  }

  generateFixReport() {
    console.log('================================================================================');
    console.log('📋 CRITICAL CONFLUENCE FIX REPORT');
    console.log('================================================================================\n');

    const beforePercentage = this.testResults.beforeFix.totalSignals > 0 ? 
      (this.testResults.beforeFix.confluenceFieldsPresent / this.testResults.beforeFix.totalSignals * 100).toFixed(1) : 0;
    
    const afterPercentage = this.testResults.afterFix.totalSignals > 0 ? 
      (this.testResults.afterFix.confluenceFieldsPresent / this.testResults.afterFix.totalSignals * 100).toFixed(1) : 0;

    const improvement = afterPercentage - beforePercentage;

    console.log(`🎯 OVERALL FIX SCORE: ${afterPercentage}%\n`);

    console.log('📊 FIX RESULTS:');
    console.log(`   Before Fix: ${beforePercentage}% confluence fields present`);
    console.log(`   After Fix: ${afterPercentage}% confluence fields present`);
    console.log(`   Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%\n`);

    console.log('🔍 DETAILED ANALYSIS:');
    console.log(`   Signals Before: ${this.testResults.beforeFix.totalSignals}`);
    console.log(`   Signals After: ${this.testResults.afterFix.totalSignals}`);
    console.log(`   Confluence Fields Before: ${this.testResults.beforeFix.confluenceFieldsPresent}`);
    console.log(`   Confluence Fields After: ${this.testResults.afterFix.confluenceFieldsPresent}\n`);

    if (afterPercentage >= 90) {
      console.log('🎉 FIX STATUS: SUCCESS - Critical Signal Analysis should now display confluence data');
    } else if (afterPercentage >= 50) {
      console.log('⚠️ FIX STATUS: PARTIAL - Some confluence fields present but not complete');
    } else {
      console.log('❌ FIX STATUS: INCOMPLETE - Additional work needed');
    }

    console.log('\n💡 NEXT STEPS:');
    if (afterPercentage < 90) {
      console.log('   🔧 Need to investigate signal cache structure');
      console.log('   🔧 May require modifications to automatedSignalCalculator.ts');
      console.log('   🔧 Consider direct route-level transformation');
    } else {
      console.log('   ✅ Critical Signal Analysis component should now function correctly');
      console.log('   ✅ Confluence data should be visible in the UI');
    }

    console.log('\n================================================================================');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute fix
async function main() {
  const fix = new CriticalConfluenceFix();
  await fix.runComprehensiveFix();
}

main().catch(error => {
  console.error('Critical confluence fix failed:', error);
  process.exit(1);
});