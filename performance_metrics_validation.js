/**
 * Performance Metrics Validation - UI Data Structure Test
 * Validates the fixed performance metrics endpoint
 */

async function validatePerformanceMetrics() {
  console.log('🔍 Validating Performance Metrics UI Transformation...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/performance-metrics');
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('🔄 Content-Type:', response.headers.get('content-type'));
    
    // Validate overall structure
    const hasIndicators = Array.isArray(data.indicators);
    const hasTimeframes = Array.isArray(data.timeframes);
    const hasSymbols = Array.isArray(data.symbols);
    
    console.log('\n✅ Data Structure Validation:');
    console.log('  - Indicators array:', hasIndicators);
    console.log('  - Timeframes array:', hasTimeframes);
    console.log('  - Symbols array:', hasSymbols);
    
    if (!hasIndicators) {
      console.log('❌ CRITICAL: Missing indicators array');
      return;
    }
    
    // Validate first indicator structure
    const firstIndicator = data.indicators[0];
    const requiredFields = ['indicator', 'value', 'status', 'change'];
    
    console.log('\n🎯 UI Field Validation (First Indicator):');
    requiredFields.forEach(field => {
      const hasField = firstIndicator.hasOwnProperty(field);
      console.log(`  - ${field}: ${hasField ? '✅' : '❌'} ${hasField ? `(${firstIndicator[field]})` : 'MISSING'}`);
    });
    
    // Additional field validation
    const additionalFields = ['accuracyRate', 'totalPredictions', 'successfulPredictions', 'signalQuality', 'hitRate'];
    console.log('\n📈 Additional Performance Fields:');
    additionalFields.forEach(field => {
      const hasField = firstIndicator.hasOwnProperty(field);
      console.log(`  - ${field}: ${hasField ? '✅' : '❌'} ${hasField ? `(${firstIndicator[field]})` : 'MISSING'}`);
    });
    
    // Sample all indicators
    console.log('\n📋 All Indicators Summary:');
    data.indicators.forEach((indicator, index) => {
      const hasRequiredFields = requiredFields.every(field => indicator.hasOwnProperty(field));
      console.log(`  ${index + 1}. ${indicator.indicator}: ${hasRequiredFields ? '✅' : '❌'} (${indicator.value} ${indicator.change})`);
    });
    
    // Performance validation
    const totalIndicators = data.indicators.length;
    const validIndicators = data.indicators.filter(ind => 
      requiredFields.every(field => ind.hasOwnProperty(field))
    ).length;
    
    console.log('\n🎯 Performance Analysis Box Compatibility:');
    console.log(`  - Total indicators: ${totalIndicators}`);
    console.log(`  - Valid UI structure: ${validIndicators}/${totalIndicators}`);
    console.log(`  - Success rate: ${((validIndicators/totalIndicators)*100).toFixed(1)}%`);
    
    if (validIndicators === totalIndicators) {
      console.log('\n🎉 SUCCESS: Performance metrics endpoint fully compatible with UI!');
      console.log('✅ All indicators contain required value/status/change fields');
      console.log('✅ Performance analysis box data structure issue RESOLVED');
    } else {
      console.log('\n⚠️  WARNING: Some indicators missing required UI fields');
    }
    
    // Test cache behavior
    console.log('\n🔄 Testing Cache Behavior...');
    const start = Date.now();
    const response2 = await fetch('http://localhost:5000/api/performance-metrics');
    const responseTime = Date.now() - start;
    console.log(`  - Second request: ${response2.status} in ${responseTime}ms`);
    console.log(`  - Cache headers: ${response2.headers.get('cache-control')}`);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

// Execute validation
validatePerformanceMetrics();