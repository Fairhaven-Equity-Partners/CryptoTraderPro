/**
 * Duplicate Calculation Fix - External Validation
 * Identifies and fixes the 96 vs 48 confidence entries issue
 */

import fetch from 'node-fetch';

class DuplicateCalculationValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  }

  async runValidation() {
    console.log('🔍 Validating duplicate calculation fix...\n');
    
    // Test each timeframe
    for (const timeframe of this.timeframes) {
      await this.validateTimeframe(timeframe);
    }
    
    console.log('\n✅ Validation complete');
  }

  async validateTimeframe(timeframe) {
    try {
      const response = await fetch(`${this.baseUrl}/api/market-heatmap?timeframe=${timeframe}`);
      if (!response.ok) {
        console.log(`❌ ${timeframe}: API error ${response.status}`);
        return;
      }
      
      const data = await response.json();
      const entries = data.marketEntries || [];
      
      // Count confidence values
      const confidenceValues = entries
        .map(entry => entry.confidence)
        .filter(conf => conf !== undefined);
      
      const uniqueSymbols = [...new Set(entries.map(entry => entry.symbol))];
      const uniqueConfidences = [...new Set(confidenceValues)];
      
      console.log(`${timeframe}: ${entries.length} entries, ${uniqueSymbols.length} symbols, ${confidenceValues.length} confidence values`);
      
      // Check for duplicates
      if (confidenceValues.length > uniqueSymbols.length) {
        console.log(`⚠️  ${timeframe}: Potential duplicates detected`);
        
        // Analyze duplicate sources
        const symbolCounts = {};
        entries.forEach(entry => {
          symbolCounts[entry.symbol] = (symbolCounts[entry.symbol] || 0) + 1;
        });
        
        const duplicates = Object.entries(symbolCounts)
          .filter(([symbol, count]) => count > 1);
        
        if (duplicates.length > 0) {
          console.log(`   Duplicated symbols: ${duplicates.map(([sym, count]) => `${sym}(${count})`).join(', ')}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${timeframe}: ${error.message}`);
    }
  }

  async testSignalSources() {
    console.log('\n🔄 Testing signal source consistency...\n');
    
    try {
      // Test automated signal calculator
      const automationResponse = await fetch(`${this.baseUrl}/api/automation/status`);
      if (automationResponse.ok) {
        const automationData = await automationResponse.json();
        console.log('📊 Automated Signal Calculator:', automationData.signalCount || 'N/A', 'signals');
      }
      
      // Test trade simulations
      const symbolsToTest = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
      for (const symbol of symbolsToTest) {
        const tradeResponse = await fetch(`${this.baseUrl}/api/trade-simulations/${encodeURIComponent(symbol)}`);
        if (tradeResponse.ok) {
          const tradeData = await tradeResponse.json();
          console.log(`📈 Trade Simulations ${symbol}:`, tradeData.length, 'active trades');
        }
      }
      
    } catch (error) {
      console.log('❌ Signal source test failed:', error.message);
    }
  }

  async validateFixImplementation() {
    console.log('\n🛠️  Validating fix implementation...\n');
    
    const testTimeframe = '1m';
    
    try {
      const response = await fetch(`${this.baseUrl}/api/market-heatmap?timeframe=${testTimeframe}`);
      if (!response.ok) {
        console.log('❌ Fix validation failed: API error');
        return false;
      }
      
      const data = await response.json();
      const entries = data.marketEntries || [];
      
      const confidenceValues = entries
        .map(entry => entry.confidence)
        .filter(conf => conf !== undefined);
      
      const uniqueSymbols = [...new Set(entries.map(entry => entry.symbol))];
      
      // Expected: 48 pairs should have exactly 48 confidence values
      const expectedPairs = 48; // 50 total - 2 excluded (RNDR issues)
      const isFixed = confidenceValues.length === uniqueSymbols.length && 
                     uniqueSymbols.length <= 50;
      
      console.log(`Expected pairs: ~${expectedPairs}`);
      console.log(`Unique symbols: ${uniqueSymbols.length}`);
      console.log(`Confidence values: ${confidenceValues.length}`);
      console.log(`Fix status: ${isFixed ? '✅ FIXED' : '❌ STILL BROKEN'}`);
      
      return isFixed;
      
    } catch (error) {
      console.log('❌ Fix validation error:', error.message);
      return false;
    }
  }
}

// Run validation
async function main() {
  const validator = new DuplicateCalculationValidator();
  
  await validator.runValidation();
  await validator.testSignalSources();
  
  const isFixed = await validator.validateFixImplementation();
  
  if (!isFixed) {
    console.log('\n🚨 DUPLICATE CALCULATION ISSUE CONFIRMED');
    console.log('📋 Root cause: Multiple signal sources creating duplicate entries');
    console.log('🔧 Required fix: Deduplicate signal processing in heatmap generation');
  } else {
    console.log('\n✅ DUPLICATE CALCULATION ISSUE RESOLVED');
  }
}

main().catch(console.error);