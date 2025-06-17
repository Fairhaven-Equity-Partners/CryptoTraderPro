/**
 * QUICK 100% VALIDATION - TARGETED FIX IMPLEMENTATION
 * External Shell Testing - Identify and fix specific gaps to achieve 100%
 */

import fetch from 'node-fetch';

const baseURL = 'http://localhost:5000';

async function makeRequest(endpoint) {
  const url = `${baseURL}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const text = await response.text();
  if (!text.trim()) {
    throw new Error('Empty response');
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.log('Raw response:', text.substring(0, 200));
    throw new Error('Invalid JSON response');
  }
}

async function quickValidation() {
  console.log('🎯 QUICK 100% VALIDATION - TARGETED FIXES');
  console.log('========================================');
  
  // 1. Test Pattern Recognition (Target: 100%)
  console.log('\n📊 1. PATTERN RECOGNITION TEST');
  try {
    const patterns = await makeRequest('/api/pattern-analysis?symbol=BTC/USDT');
    console.log(`   Response keys: ${Object.keys(patterns).join(', ')}`);
    console.log(`   Patterns array: ${patterns.patterns ? patterns.patterns.length : 'MISSING'}`);
    console.log(`   Summary: ${patterns.summary ? 'PRESENT' : 'MISSING'}`);
    
    if (patterns.patterns && Array.isArray(patterns.patterns) && patterns.patterns.length >= 5) {
      console.log(`   ✅ PATTERN SUCCESS: ${patterns.patterns.length} patterns`);
    } else {
      console.log(`   ❌ PATTERN FAIL: Array missing or insufficient patterns`);
    }
  } catch (error) {
    console.log(`   ❌ PATTERN ERROR: ${error.message}`);
  }
  
  // 2. Test Signal Generation (Target: 100%)
  console.log('\n📊 2. SIGNAL GENERATION TEST');
  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  let signalSuccess = 0;
  
  for (const tf of timeframes) {
    try {
      const signals = await makeRequest(`/api/signals?symbol=BTC/USDT&timeframe=${tf}`);
      if (Array.isArray(signals) && signals.length > 0) {
        console.log(`   ✅ ${tf}: ${signals.length} signals`);
        signalSuccess++;
      } else {
        console.log(`   ❌ ${tf}: No signals`);
      }
    } catch (error) {
      console.log(`   ❌ ${tf}: ${error.message}`);
    }
  }
  console.log(`   Signal Success Rate: ${signalSuccess}/${timeframes.length} (${(signalSuccess/timeframes.length*100).toFixed(1)}%)`);
  
  // 3. Test Technical Analysis (Target: 100%)
  console.log('\n📊 3. TECHNICAL ANALYSIS TEST');
  try {
    const analysis = await makeRequest('/api/technical-analysis?symbol=BTC/USDT&timeframe=4h');
    console.log(`   Response type: ${typeof analysis}`);
    console.log(`   Keys: ${Object.keys(analysis).join(', ')}`);
    console.log(`   Success: ${analysis.success ? 'YES' : 'NO'}`);
    console.log(`   Data: ${analysis.data ? 'PRESENT' : 'MISSING'}`);
    console.log(`   Indicators: ${analysis.indicators ? Object.keys(analysis.indicators).length : 'MISSING'}`);
    
    if (analysis.success && analysis.indicators && analysis.data) {
      console.log(`   ✅ TECHNICAL SUCCESS: Complete data structure`);
    } else {
      console.log(`   ❌ TECHNICAL FAIL: Missing data structure`);
    }
  } catch (error) {
    console.log(`   ❌ TECHNICAL ERROR: ${error.message}`);
  }
  
  // 4. Test UI Components (Target: 100%)
  console.log('\n📊 4. UI COMPONENTS TEST');
  try {
    const performance = await makeRequest('/api/performance-metrics?symbol=BTC/USDT');
    console.log(`   Performance indicators: ${performance.indicators ? performance.indicators.length : 'MISSING'}`);
    
    if (performance.indicators && Array.isArray(performance.indicators) && performance.indicators.length >= 5) {
      console.log(`   ✅ UI SUCCESS: ${performance.indicators.length} indicators`);
    } else {
      console.log(`   ❌ UI FAIL: Insufficient indicators`);
    }
  } catch (error) {
    console.log(`   ❌ UI ERROR: ${error.message}`);
  }
  
  // 5. Test Monte Carlo Risk (Target: 100%)
  console.log('\n📊 5. MONTE CARLO RISK TEST');
  try {
    const response = await fetch(`${baseURL}/api/monte-carlo-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '4h' })
    });
    
    if (response.ok) {
      const risk = await response.json();
      console.log(`   Risk Level: ${risk.riskMetrics?.riskLevel || 'MISSING'}`);
      console.log(`   Volatility: ${risk.riskMetrics?.volatility || 'MISSING'}`);
      console.log(`   Signal Input: ${risk.signalInput ? 'PRESENT' : 'MISSING'}`);
      
      if (risk.riskMetrics?.riskLevel && risk.riskMetrics?.volatility) {
        console.log(`   ✅ MONTE CARLO SUCCESS: Complete risk assessment`);
      } else {
        console.log(`   ❌ MONTE CARLO FAIL: Missing components`);
      }
    } else {
      console.log(`   ❌ MONTE CARLO ERROR: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ MONTE CARLO ERROR: ${error.message}`);
  }
  
  console.log('\n🎯 QUICK VALIDATION COMPLETE');
  console.log('Identified specific issues for targeted fixes.');
}

quickValidation();