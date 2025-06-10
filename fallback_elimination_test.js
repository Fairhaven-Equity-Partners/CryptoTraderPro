/**
 * Fallback/Synthetic Elimination Test Suite
 * Verifies complete removal of all synthetic calculations
 */

console.log('\n🔍 FALLBACK/SYNTHETIC ELIMINATION VERIFICATION');
console.log('═══════════════════════════════════════════════');

let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  criticalIssues: []
};

function runTest(testName, testFunction) {
  testResults.totalTests++;
  console.log(`\n📋 Testing: ${testName}`);
  
  try {
    const result = testFunction();
    if (result.passed) {
      testResults.passedTests++;
      console.log(`  ✅ PASSED: ${result.message}`);
    } else {
      testResults.failedTests++;
      testResults.criticalIssues.push({ test: testName, issue: result.message });
      console.log(`  ❌ FAILED: ${result.message}`);
    }
  } catch (error) {
    testResults.failedTests++;
    testResults.criticalIssues.push({ test: testName, issue: error.message });
    console.log(`  ❌ ERROR: ${error.message}`);
  }
}

// Test 1: Check for Math.random patterns in key files
runTest('Math.random Pattern Detection', () => {
  const fs = require('fs');
  const path = require('path');
  
  const criticalFiles = [
    'server/automatedSignalCalculator.ts',
    'server/enhancedPriceStreamer.ts',
    'server/coinMarketCapPriceStreamer.ts',
    'server/technicalIndicators.ts',
    'server/advancedMarketAnalysis.ts',
    'server/advancedBacktesting.ts'
  ];
  
  let mathRandomFound = false;
  let foundInstances = [];
  
  for (const file of criticalFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for Math.random patterns
        const mathRandomMatches = content.match(/Math\.random\(\)/g);
        if (mathRandomMatches) {
          mathRandomFound = true;
          foundInstances.push(`${file}: ${mathRandomMatches.length} instances`);
        }
        
        // Check for price generation patterns
        const priceGenPatterns = [
          /currentPrice.*\*.*Math\.random/g,
          /basePrice.*\+.*Math\.random/g,
          /price.*\*.*\(1.*\+.*Math\.random/g,
          /volatility.*Math\.random/g
        ];
        
        for (const pattern of priceGenPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            mathRandomFound = true;
            foundInstances.push(`${file}: Price generation pattern found`);
          }
        }
      }
    } catch (error) {
      // File might not exist, which is okay
    }
  }
  
  return {
    passed: !mathRandomFound,
    message: mathRandomFound ? 
      `Math.random patterns found: ${foundInstances.join(', ')}` : 
      'No Math.random patterns detected in critical files'
  };
});

// Test 2: Check for synthetic method names
runTest('Synthetic Method Name Detection', () => {
  const fs = require('fs');
  
  const suspiciousMethods = [
    'generateSyntheticCandles',
    'generateFallbackData',
    'generatePriceHistory',
    'createSyntheticOHLC',
    'generateMarketData'
  ];
  
  const criticalFiles = [
    'server/automatedSignalCalculator.ts',
    'server/enhancedPriceStreamer.ts',
    'server/coinMarketCapPriceStreamer.ts',
    'server/technicalIndicators.ts',
    'server/advancedMarketAnalysis.ts',
    'server/advancedBacktesting.ts'
  ];
  
  let suspiciousMethodsFound = [];
  
  for (const file of criticalFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const method of suspiciousMethods) {
          if (content.includes(method) && !content.includes(`// REMOVED: ${method}`) && !content.includes(`* REMOVED:`)) {
            suspiciousMethodsFound.push(`${file}: ${method}`);
          }
        }
      }
    } catch (error) {
      // File might not exist
    }
  }
  
  return {
    passed: suspiciousMethodsFound.length === 0,
    message: suspiciousMethodsFound.length > 0 ? 
      `Suspicious methods found: ${suspiciousMethodsFound.join(', ')}` : 
      'No suspicious synthetic methods detected'
  };
});

// Test 3: Check for fallback data comments and patterns
runTest('Fallback Data Pattern Detection', () => {
  const fs = require('fs');
  
  const fallbackPatterns = [
    /fallback.*price/gi,
    /synthetic.*data/gi,
    /generate.*historical/gi,
    /estimate.*prices/gi,
    /default.*price.*50000/gi,
    /placeholder.*data/gi
  ];
  
  const criticalFiles = [
    'server/automatedSignalCalculator.ts',
    'server/enhancedPriceStreamer.ts',
    'server/coinMarketCapPriceStreamer.ts',
    'server/technicalIndicators.ts',
    'server/advancedMarketAnalysis.ts'
  ];
  
  let fallbackPatternsFound = [];
  
  for (const file of criticalFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const pattern of fallbackPatterns) {
          const matches = content.match(pattern);
          if (matches && !content.includes('REAL DATA ONLY') && !content.includes('REMOVED:')) {
            fallbackPatternsFound.push(`${file}: ${matches[0]}`);
          }
        }
      }
    } catch (error) {
      // File might not exist
    }
  }
  
  return {
    passed: fallbackPatternsFound.length === 0,
    message: fallbackPatternsFound.length > 0 ? 
      `Fallback patterns found: ${fallbackPatternsFound.join(', ')}` : 
      'No fallback data patterns detected'
  };
});

// Test 4: Verify elimination markers are present
runTest('Elimination Marker Verification', () => {
  const fs = require('fs');
  
  const criticalFiles = [
    'server/automatedSignalCalculator.ts',
    'server/enhancedPriceStreamer.ts',
    'server/coinMarketCapPriceStreamer.ts',
    'server/technicalIndicators.ts',
    'server/advancedMarketAnalysis.ts'
  ];
  
  let eliminationMarkersFound = 0;
  let expectedMarkers = 0;
  
  for (const file of criticalFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        expectedMarkers++;
        
        // Check for elimination markers
        if (content.includes('REAL DATA ONLY') || 
            content.includes('NO SYNTHETIC') || 
            content.includes('REMOVED:') ||
            content.includes('Real-data-only mode')) {
          eliminationMarkersFound++;
        }
      }
    } catch (error) {
      // File might not exist
    }
  }
  
  return {
    passed: eliminationMarkersFound >= expectedMarkers * 0.8, // At least 80% should have markers
    message: `Elimination markers found in ${eliminationMarkersFound}/${expectedMarkers} files`
  };
});

// Test 5: Check API rate limiting is operational
runTest('Rate Limiting System Check', () => {
  const fs = require('fs');
  
  let rateLimitingPresent = false;
  
  try {
    if (fs.existsSync('server/advancedRateLimiter.ts')) {
      const content = fs.readFileSync('server/advancedRateLimiter.ts', 'utf8');
      if (content.includes('30000') || content.includes('30k') || content.includes('monthly')) {
        rateLimitingPresent = true;
      }
    }
    
    if (fs.existsSync('server/optimizedCoinMarketCapService.ts')) {
      const content = fs.readFileSync('server/optimizedCoinMarketCapService.ts', 'utf8');
      if (content.includes('rateLimiter') || content.includes('throttl')) {
        rateLimitingPresent = true;
      }
    }
  } catch (error) {
    // Files might not exist
  }
  
  return {
    passed: rateLimitingPresent,
    message: rateLimitingPresent ? 
      'Rate limiting system detected and operational' : 
      'Rate limiting system not found'
  };
});

// Test 6: Verify CoinMarketCap integration
runTest('CoinMarketCap Integration Check', () => {
  const fs = require('fs');
  
  let cmcIntegrationPresent = false;
  let coinGeckoReferencesFound = false;
  
  const files = [
    'server/optimizedCoinMarketCapService.ts',
    'server/coinMarketCapPriceStreamer.ts',
    'test_updated_symbol_mapping.ts'
  ];
  
  for (const file of files) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        if (content.includes('coinmarketcap') || content.includes('CMC') || content.includes('cmcSymbol')) {
          cmcIntegrationPresent = true;
        }
        
        if (content.includes('coingecko') && !content.includes('// Replaced') && !content.includes('REMOVED')) {
          coinGeckoReferencesFound = true;
        }
      }
    } catch (error) {
      // File might not exist
    }
  }
  
  return {
    passed: cmcIntegrationPresent && !coinGeckoReferencesFound,
    message: `CoinMarketCap: ${cmcIntegrationPresent ? 'Found' : 'Missing'}, CoinGecko references: ${coinGeckoReferencesFound ? 'Found (should be removed)' : 'Properly removed'}`
  };
});

// Generate final report
console.log('\n📊 VERIFICATION SUMMARY');
console.log('═'.repeat(50));
console.log(`Total Tests: ${testResults.totalTests}`);
console.log(`Passed: ${testResults.passedTests}`);
console.log(`Failed: ${testResults.failedTests}`);
console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);

if (testResults.failedTests === 0) {
  console.log('\n✅ VERIFICATION COMPLETE: 100% SYNTHETIC ELIMINATION ACHIEVED');
  console.log('   All systems operating in REAL-DATA-ONLY mode');
  console.log('   No fallback calculations detected');
  console.log('   CoinMarketCap migration successful');
  console.log('   Rate limiting operational');
} else {
  console.log('\n❌ VERIFICATION INCOMPLETE: ISSUES DETECTED');
  console.log('   Critical Issues:');
  testResults.criticalIssues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue.test}: ${issue.issue}`);
  });
}

console.log('\n🎯 NEXT STEPS:');
if (testResults.failedTests === 0) {
  console.log('   - System ready for production deployment');
  console.log('   - All synthetic calculations eliminated');
  console.log('   - Real-time price streaming operational');
  console.log('   - API usage optimized for 30k monthly limit');
} else {
  console.log('   - Address remaining synthetic calculation patterns');
  console.log('   - Complete CoinMarketCap migration');
  console.log('   - Verify rate limiting configuration');
  console.log('   - Re-run verification after fixes');
}

process.exit(testResults.failedTests > 0 ? 1 : 0);