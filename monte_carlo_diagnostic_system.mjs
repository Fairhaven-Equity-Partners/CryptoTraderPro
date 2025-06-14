/**
 * MONTE CARLO DIAGNOSTIC SYSTEM
 * External Shell Testing - Comprehensive Analysis of Monte Carlo Issues
 * 
 * Ground Rules Compliance:
 * - External shell testing for all diagnostics
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of all implementations
 * - Zero tolerance for system crashes
 */

class MonteCarloSystemDiagnostic {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.issues = [];
    this.solutions = [];
  }

  async runCompleteDiagnostic() {
    console.log('🔍 MONTE CARLO SYSTEM DIAGNOSTIC');
    console.log('='.repeat(50));
    
    // Step 1: Test Frontend Error (Symbol Required)
    await this.diagnoseFrontendIssue();
    
    // Step 2: Test Backend Route
    await this.diagnoseBackendRoute();
    
    // Step 3: Test Signal Data Structure
    await this.diagnoseSignalDataStructure();
    
    // Step 4: Test Component Integration
    await this.diagnoseComponentIntegration();
    
    // Step 5: Generate Solutions
    this.generateSolutions();
    
    return this.generateDiagnosticReport();
  }

  async diagnoseFrontendIssue() {
    console.log('\n🎯 Testing Frontend Error: "Symbol required"');
    
    try {
      // Test 1: Direct API call with no symbol
      const response1 = await fetch(`${this.baseURL}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data1 = await response1.json();
      console.log('❌ Empty body response:', data1);
      this.issues.push({
        type: 'frontend_validation',
        issue: 'Frontend not sending symbol in request body',
        severity: 'HIGH'
      });
      
      // Test 2: Direct API call with symbol
      const response2 = await fetch(`${this.baseURL}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      const data2 = await response2.json();
      console.log('✅ With symbol response:', data2.success ? 'SUCCESS' : 'FAILED');
      
      if (!data2.success) {
        this.issues.push({
          type: 'backend_processing',
          issue: 'Backend failing even with valid symbol',
          severity: 'CRITICAL',
          details: data2
        });
      }
      
    } catch (error) {
      console.log('❌ Frontend diagnostic error:', error.message);
      this.issues.push({
        type: 'network_error',
        issue: 'Network connectivity issues',
        severity: 'CRITICAL',
        details: error.message
      });
    }
  }

  async diagnoseBackendRoute() {
    console.log('\n🔧 Testing Backend Route Structure');
    
    try {
      // Test signals endpoint first
      const signalsResponse = await fetch(`${this.baseURL}/api/signals/BTC%2FUSDT`);
      const signalsData = await signalsResponse.json();
      
      console.log('📊 Signals data structure:', {
        count: signalsData?.length || 0,
        hasEntryPrice: signalsData?.[0]?.entryPrice !== undefined,
        hasStopLoss: signalsData?.[0]?.stopLoss !== undefined,
        hasTakeProfit: signalsData?.[0]?.takeProfit !== undefined,
        sampleSignal: signalsData?.[0] || 'NO_DATA'
      });
      
      if (!signalsData || signalsData.length === 0) {
        this.issues.push({
          type: 'data_dependency',
          issue: 'No signals available for Monte Carlo processing',
          severity: 'CRITICAL'
        });
      } else if (!signalsData[0]?.entryPrice) {
        this.issues.push({
          type: 'data_structure',
          issue: 'Signals missing entryPrice field required by Monte Carlo',
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log('❌ Backend route diagnostic error:', error.message);
      this.issues.push({
        type: 'backend_error',
        issue: 'Backend route processing failure',
        severity: 'CRITICAL',
        details: error.message
      });
    }
  }

  async diagnoseSignalDataStructure() {
    console.log('\n📋 Analyzing Signal Data Structure');
    
    try {
      const response = await fetch(`${this.baseURL}/api/signals/BTC%2FUSDT`);
      const signals = await response.json();
      
      if (signals && signals.length > 0) {
        const signal = signals[0];
        const requiredFields = ['entryPrice', 'stopLoss', 'takeProfit', 'direction', 'confidence'];
        const missingFields = requiredFields.filter(field => 
          signal[field] === undefined || signal[field] === null
        );
        
        console.log('🔍 Signal field analysis:', {
          availableFields: Object.keys(signal),
          requiredFields,
          missingFields,
          hasPrice: signal.price !== undefined,
          canUsePrice: signal.price && !signal.entryPrice
        });
        
        if (missingFields.length > 0) {
          this.issues.push({
            type: 'field_mapping',
            issue: `Missing required fields: ${missingFields.join(', ')}`,
            severity: 'HIGH',
            missingFields
          });
        }
      }
      
    } catch (error) {
      console.log('❌ Signal structure diagnostic error:', error.message);
    }
  }

  async diagnoseComponentIntegration() {
    console.log('\n🔗 Testing Component Integration');
    
    // Test the complete flow
    try {
      const testPayload = {
        symbol: 'BTC/USDT',
        timeframe: '1d'
      };
      
      console.log('📤 Testing complete Monte Carlo flow with:', testPayload);
      
      const response = await fetch(`${this.baseURL}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Complete flow successful:', {
          hasRiskAssessment: !!data.riskAssessment,
          hasSignalInput: !!data.signalInput,
          riskScore: data.riskAssessment?.riskScore,
          expectedReturn: data.riskAssessment?.expectedReturn
        });
      } else {
        const errorData = await response.json();
        console.log('❌ Complete flow failed:', errorData);
        this.issues.push({
          type: 'integration_failure',
          issue: `HTTP ${response.status}: ${errorData.error}`,
          severity: 'CRITICAL'
        });
      }
      
    } catch (error) {
      console.log('❌ Integration test error:', error.message);
    }
  }

  generateSolutions() {
    console.log('\n💡 Generating Solutions');
    
    this.issues.forEach(issue => {
      switch (issue.type) {
        case 'frontend_validation':
          this.solutions.push({
            issue: issue.type,
            solution: 'Fix frontend component to properly send symbol in request body',
            code: 'Update MonteCarloRiskDisplay.tsx mutation to include symbol from props'
          });
          break;
          
        case 'field_mapping':
          this.solutions.push({
            issue: issue.type,
            solution: 'Update signal data mapping to use available fields',
            code: 'Map signal.price to entryPrice if entryPrice is missing'
          });
          break;
          
        case 'data_dependency':
          this.solutions.push({
            issue: issue.type,
            solution: 'Ensure signals are generated before Monte Carlo processing',
            code: 'Add signal generation trigger or dependency check'
          });
          break;
          
        case 'backend_processing':
          this.solutions.push({
            issue: issue.type,
            solution: 'Fix backend route error handling and signal processing',
            code: 'Update route validation and error responses'
          });
          break;
      }
    });
  }

  generateDiagnosticReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 DIAGNOSTIC REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🔍 Issues Found: ${this.issues.length}`);
    this.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.type.toUpperCase()}`);
      console.log(`   Severity: ${issue.severity}`);
      console.log(`   Issue: ${issue.issue}`);
      if (issue.details) {
        console.log(`   Details: ${JSON.stringify(issue.details, null, 2)}`);
      }
    });
    
    console.log(`\n💡 Solutions Generated: ${this.solutions.length}`);
    this.solutions.forEach((solution, index) => {
      console.log(`\n${index + 1}. ${solution.issue.toUpperCase()}`);
      console.log(`   Solution: ${solution.solution}`);
      console.log(`   Implementation: ${solution.code}`);
    });
    
    const criticalIssues = this.issues.filter(i => i.severity === 'CRITICAL').length;
    const priority = criticalIssues > 0 ? 'CRITICAL' : 'HIGH';
    
    console.log(`\n🎯 Priority Level: ${priority}`);
    console.log('✅ Diagnostic Complete');
    
    return {
      issues: this.issues,
      solutions: this.solutions,
      priority,
      criticalIssues
    };
  }
}

// Execute diagnostic
const diagnostic = new MonteCarloSystemDiagnostic();
diagnostic.runCompleteDiagnostic().then(report => {
  console.log('\n🎯 DIAGNOSTIC SUMMARY:');
  console.log(`- Critical Issues: ${report.criticalIssues}`);
  console.log(`- Total Issues: ${report.issues.length}`);
  console.log(`- Solutions Ready: ${report.solutions.length}`);
  
  process.exit(report.criticalIssues > 0 ? 1 : 0);
}).catch(error => {
  console.error('Diagnostic system error:', error);
  process.exit(1);
});