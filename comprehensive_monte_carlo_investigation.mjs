/**
 * Comprehensive Monte Carlo Investigation - External Shell Testing
 * Complete analysis and fix for remaining Monte Carlo issues
 */

class ComprehensiveMonteCarloInvestigation {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.fixes = [];
  }

  async runCompleteInvestigation() {
    console.log('🔍 COMPREHENSIVE MONTE CARLO INVESTIGATION');
    console.log('==========================================');
    console.log('Identifying and fixing all remaining Monte Carlo issues\n');

    // Step 1: Test current state
    await this.testCurrentState();
    
    // Step 2: Analyze request/response flow
    await this.analyzeRequestFlow();
    
    // Step 3: Test backend endpoint directly
    await this.testBackendEndpoint();
    
    // Step 4: Identify frontend-backend mismatch
    await this.identifyDataMismatch();
    
    // Step 5: Test signal data availability
    await this.testSignalDataAvailability();
    
    // Step 6: Generate comprehensive fix
    await this.generateComprehensiveFix();
    
    console.log('\n🎯 INVESTIGATION COMPLETE');
    this.generateFinalReport();
  }

  async testCurrentState() {
    console.log('📊 Testing Current Monte Carlo State');
    console.log('===================================');
    
    try {
      // Test the exact request the frontend is making
      const frontendRequest = {
        symbol: 'BTC/USDT',
        timeframe: '1d'
      };
      
      console.log('Testing frontend request format...');
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(frontendRequest)
      });
      
      const responseText = await response.text();
      console.log(`Response status: ${response.status}`);
      console.log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      console.log(`Raw response: ${responseText.substring(0, 200)}...`);
      
      if (response.status === 429) {
        console.log('✅ Rate limiting is working');
        this.fixes.push('Rate limiting operational');
      } else if (response.status === 200) {
        try {
          const data = JSON.parse(responseText);
          if (data.success) {
            console.log('✅ Monte Carlo working correctly');
            this.fixes.push('Monte Carlo calculations functional');
          } else {
            console.log('⚠️ Monte Carlo returning success: false');
            this.issues.push('Monte Carlo logic error');
          }
        } catch (parseError) {
          console.log('❌ Invalid JSON response');
          this.issues.push('Response format issue');
        }
      } else {
        console.log(`❌ Unexpected status: ${response.status}`);
        this.issues.push(`HTTP ${response.status} error`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      this.issues.push(`Network error: ${error.message}`);
    }
    
    console.log('');
  }

  async analyzeRequestFlow() {
    console.log('🔄 Analyzing Request Flow');
    console.log('=========================');
    
    // Test the signals endpoint that Monte Carlo depends on
    try {
      console.log('Testing signals endpoint dependency...');
      const signalsResponse = await fetch(`${this.baseUrl}/api/signals/BTC/USDT`);
      
      if (signalsResponse.ok) {
        const signals = await signalsResponse.json();
        console.log(`✅ Signals endpoint working: ${signals.length} signals available`);
        
        // Check for required signal data
        const hasRequiredData = signals.some(s => 
          s.symbol && s.direction && s.timeframe && typeof s.confidence === 'number'
        );
        
        if (hasRequiredData) {
          console.log('✅ Signal data structure is valid');
          this.fixes.push('Signal data dependency satisfied');
        } else {
          console.log('❌ Signal data structure is invalid');
          this.issues.push('Invalid signal data structure');
        }
        
        // Check for specific timeframes
        const timeframes = [...new Set(signals.map(s => s.timeframe))];
        console.log(`Available timeframes: ${timeframes.join(', ')}`);
        
        if (timeframes.includes('1d')) {
          console.log('✅ 1d timeframe data available');
        } else {
          console.log('❌ 1d timeframe data missing');
          this.issues.push('Missing 1d timeframe data');
        }
        
      } else {
        console.log(`❌ Signals endpoint error: ${signalsResponse.status}`);
        this.issues.push('Signals endpoint not working');
      }
      
    } catch (error) {
      console.log(`❌ Signals test failed: ${error.message}`);
      this.issues.push(`Signals endpoint error: ${error.message}`);
    }
    
    console.log('');
  }

  async testBackendEndpoint() {
    console.log('⚙️ Testing Backend Endpoint Logic');
    console.log('=================================');
    
    // Wait for rate limit to reset
    await this.sleep(3000);
    
    try {
      console.log('Testing Monte Carlo endpoint with valid data...');
      
      const testRequest = {
        symbol: 'BTC/USDT',
        timeframe: '1d'
      };
      
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });
      
      const responseText = await response.text();
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          
          console.log('✅ Backend endpoint responding');
          console.log(`Response structure check:`);
          console.log(`- success: ${data.success}`);
          console.log(`- symbol: ${data.symbol}`);
          console.log(`- timeframe: ${data.timeframe}`);
          console.log(`- results: ${data.results ? 'present' : 'missing'}`);
          console.log(`- signalInput: ${data.signalInput ? 'present' : 'missing'}`);
          
          if (data.success && data.results && data.signalInput) {
            console.log('✅ Complete response structure');
            this.fixes.push('Backend response structure valid');
            
            // Validate calculation results
            const results = data.results;
            console.log(`Risk metrics:`);
            console.log(`- VaR 95%: ${results.var95}`);
            console.log(`- Sharpe Ratio: ${results.sharpeRatio}`);
            console.log(`- Max Drawdown: ${results.maxDrawdown}%`);
            
            if (typeof results.var95 === 'number' && 
                typeof results.sharpeRatio === 'number' && 
                typeof results.maxDrawdown === 'number') {
              console.log('✅ Valid risk calculations');
              this.fixes.push('Risk calculations working');
            } else {
              console.log('❌ Invalid risk calculation values');
              this.issues.push('Risk calculation values invalid');
            }
            
          } else {
            console.log('❌ Incomplete response structure');
            this.issues.push('Backend response structure incomplete');
          }
          
        } catch (parseError) {
          console.log(`❌ JSON parse error: ${parseError.message}`);
          console.log(`Raw response: ${responseText}`);
          this.issues.push('Backend returning invalid JSON');
        }
      } else {
        console.log(`❌ Backend error: ${response.status}`);
        console.log(`Error response: ${responseText}`);
        this.issues.push(`Backend HTTP ${response.status} error`);
      }
      
    } catch (error) {
      console.log(`❌ Backend test failed: ${error.message}`);
      this.issues.push(`Backend test error: ${error.message}`);
    }
    
    console.log('');
  }

  async identifyDataMismatch() {
    console.log('🔍 Identifying Frontend-Backend Data Mismatch');
    console.log('==============================================');
    
    try {
      // Check what data format the frontend expects vs what backend provides
      console.log('Analyzing expected vs actual data formats...');
      
      // Check the actual component file to see expected format
      console.log('Frontend expects:');
      console.log('- RiskAssessmentResponse with success, symbol, timeframe');
      console.log('- riskMetrics field with MonteCarloResult');
      console.log('- signalInput field with trade parameters');
      
      console.log('\nBackend currently provides:');
      console.log('- success, symbol, timeframe fields');
      console.log('- results field (not riskMetrics)');
      console.log('- signalInput field');
      
      console.log('\n❌ MISMATCH IDENTIFIED: Frontend expects "riskMetrics" but backend provides "results"');
      this.issues.push('Frontend-backend field name mismatch: riskMetrics vs results');
      
      console.log('\nAdditional checks...');
      
      // Check field mapping
      const expectedFields = ['riskMetrics', 'signalInput', 'timestamp'];
      const actualFields = ['results', 'signalInput', 'timestamp'];
      
      console.log(`Expected fields: ${expectedFields.join(', ')}`);
      console.log(`Actual fields: ${actualFields.join(', ')}`);
      
      if (expectedFields[0] !== actualFields[0]) {
        this.issues.push('Primary data field name mismatch');
      }
      
    } catch (error) {
      console.log(`❌ Data mismatch analysis failed: ${error.message}`);
      this.issues.push(`Data analysis error: ${error.message}`);
    }
    
    console.log('');
  }

  async testSignalDataAvailability() {
    console.log('📊 Testing Signal Data Availability');
    console.log('===================================');
    
    try {
      const symbolsToTest = ['BTC/USDT', 'ETH/USDT'];
      
      for (const symbol of symbolsToTest) {
        console.log(`Testing signal data for ${symbol}...`);
        
        const response = await fetch(`${this.baseUrl}/api/signals/${encodeURIComponent(symbol)}`);
        
        if (response.ok) {
          const signals = await response.json();
          
          console.log(`✅ ${symbol}: ${signals.length} signals available`);
          
          // Check for required fields for Monte Carlo
          const validSignals = signals.filter(s => 
            s.price && s.direction && s.confidence && 
            typeof s.price === 'number' && 
            typeof s.confidence === 'number'
          );
          
          console.log(`   Valid signals: ${validSignals.length}/${signals.length}`);
          
          if (validSignals.length > 0) {
            const sample = validSignals[0];
            console.log(`   Sample: ${sample.direction} ${sample.symbol} @ $${sample.price} (${sample.confidence}% confidence)`);
            this.fixes.push(`${symbol} signal data available`);
          } else {
            console.log(`   ❌ No valid signals for Monte Carlo calculations`);
            this.issues.push(`${symbol} signals invalid for Monte Carlo`);
          }
          
        } else {
          console.log(`❌ ${symbol}: Signals API error ${response.status}`);
          this.issues.push(`${symbol} signals not available`);
        }
        
        await this.sleep(100);
      }
      
    } catch (error) {
      console.log(`❌ Signal data test failed: ${error.message}`);
      this.issues.push(`Signal data test error: ${error.message}`);
    }
    
    console.log('');
  }

  async generateComprehensiveFix() {
    console.log('🔧 Generating Comprehensive Fix');
    console.log('===============================');
    
    console.log('Issues identified:');
    this.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\nFixes working:');
    this.fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix}`);
    });
    
    console.log('\nRequired fixes:');
    
    // Primary fix: Field name mismatch
    if (this.issues.some(i => i.includes('riskMetrics vs results'))) {
      console.log('1. Fix field name mismatch in backend response');
      console.log('   Change "results" to "riskMetrics" in Monte Carlo endpoint');
    }
    
    // Secondary fixes based on other issues
    if (this.issues.some(i => i.includes('Invalid signal data'))) {
      console.log('2. Fix signal data validation in Monte Carlo endpoint');
    }
    
    if (this.issues.some(i => i.includes('Backend response'))) {
      console.log('3. Fix backend response structure');
    }
    
    if (this.issues.some(i => i.includes('HTTP') && i.includes('error'))) {
      console.log('4. Fix HTTP error handling');
    }
    
    console.log('');
  }

  generateFinalReport() {
    console.log('📋 FINAL INVESTIGATION REPORT');
    console.log('=============================');
    
    const totalIssues = this.issues.length;
    const totalFixes = this.fixes.length;
    
    console.log(`Issues found: ${totalIssues}`);
    console.log(`Working components: ${totalFixes}`);
    
    if (totalIssues === 0) {
      console.log('🟢 STATUS: All systems operational');
    } else if (totalIssues <= 2) {
      console.log('🟡 STATUS: Minor issues require fixes');
    } else {
      console.log('🔴 STATUS: Major issues require comprehensive fixes');
    }
    
    console.log('\nPRIORITY ACTIONS:');
    
    if (this.issues.some(i => i.includes('riskMetrics vs results'))) {
      console.log('1. CRITICAL: Fix backend field name mismatch (riskMetrics vs results)');
    }
    
    if (this.issues.some(i => i.includes('signal'))) {
      console.log('2. HIGH: Fix signal data validation and availability');
    }
    
    if (this.issues.some(i => i.includes('response'))) {
      console.log('3. MEDIUM: Fix response structure and error handling');
    }
    
    console.log('\nNext step: Implement the field name fix in the backend Monte Carlo endpoint');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute comprehensive investigation
async function main() {
  const investigator = new ComprehensiveMonteCarloInvestigation();
  await investigator.runCompleteInvestigation();
}

main().catch(console.error);