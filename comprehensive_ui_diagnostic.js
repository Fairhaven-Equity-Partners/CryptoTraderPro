/**
 * Comprehensive UI Diagnostic & Analysis Tool
 * External shell testing for complete display UI validation
 * Focus: Performance analysis box and all UI components
 */

import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

class ComprehensiveUIDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      endpoints: {},
      uiComponents: {},
      performanceAnalysis: {},
      dataIntegrity: {},
      issues: [],
      solutions: []
    };
    this.startTime = Date.now();
  }

  async runFullDiagnostic() {
    console.log('🔍 COMPREHENSIVE UI DIAGNOSTIC & ANALYSIS');
    console.log('=' .repeat(70));
    console.log('External shell testing for display UI validation\n');

    try {
      await this.testCoreEndpoints();
      await this.analyzePerformanceAnalysisBox();
      await this.testUIDataFlow();
      await this.validateComponentIntegration();
      await this.identifyRootCauses();
      await this.generateImplementationPlan();
      
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      this.results.criticalError = error.message;
    }
  }

  async testCoreEndpoints() {
    console.log('📡 Testing Core Endpoints...');
    
    const endpoints = [
      '/api/performance-metrics',
      '/api/signals/BTC%2FUSDT',
      '/api/crypto/BTC/USDT',
      '/api/rate-limiter/stats',
      '/api/technical-analysis/BTC%2FUSDT',
      '/api/accuracy/BTC/USDT',
      '/api/trade-simulations/BTC%2FUSDT'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const { stdout, stderr } = await execAsync(`curl -s -w "%{http_code}" "${this.baseUrl}${endpoint}"`);
        const responseTime = Date.now() - start;
        
        // Extract HTTP status code (last 3 characters)
        const httpCode = stdout.slice(-3);
        const responseBody = stdout.slice(0, -3);
        
        let parsedData = null;
        let isValidJson = false;
        
        try {
          parsedData = JSON.parse(responseBody);
          isValidJson = true;
        } catch (e) {
          // Not JSON or malformed
        }
        
        this.results.endpoints[endpoint] = {
          httpCode: parseInt(httpCode),
          responseTime,
          isValidJson,
          dataSize: responseBody.length,
          hasError: parsedData?.error !== undefined,
          errorMessage: parsedData?.error || null,
          success: parseInt(httpCode) === 200 && isValidJson && !parsedData?.error
        };
        
        const status = this.results.endpoints[endpoint].success ? '✅' : '❌';
        console.log(`  ${status} ${endpoint}: ${httpCode} (${responseTime}ms)`);
        
        if (parsedData?.error) {
          console.log(`    Error: ${parsedData.error}`);
        }
        
      } catch (error) {
        this.results.endpoints[endpoint] = {
          httpCode: 0,
          responseTime: null,
          success: false,
          error: error.message
        };
        console.log(`  ❌ ${endpoint}: Connection failed`);
      }
    }
    
    console.log('');
  }

  async analyzePerformanceAnalysisBox() {
    console.log('📊 Analyzing Performance Analysis Box...');
    
    try {
      // Test performance metrics endpoint specifically
      const { stdout } = await execAsync(`curl -s "${this.baseUrl}/api/performance-metrics"`);
      
      let performanceData = null;
      try {
        performanceData = JSON.parse(stdout);
      } catch (e) {
        this.results.performanceAnalysis.parseError = 'Invalid JSON response';
        console.log('  ❌ Performance data: Invalid JSON');
        return;
      }
      
      // Analyze performance data structure
      const analysis = {
        hasIndicators: Array.isArray(performanceData?.indicators),
        indicatorCount: performanceData?.indicators?.length || 0,
        hasValidStructure: false,
        missingFields: [],
        dataQuality: 'unknown'
      };
      
      if (analysis.hasIndicators && analysis.indicatorCount > 0) {
        const firstIndicator = performanceData.indicators[0];
        const expectedFields = ['indicator', 'value', 'status', 'change'];
        
        analysis.hasValidStructure = expectedFields.every(field => 
          firstIndicator.hasOwnProperty(field)
        );
        
        analysis.missingFields = expectedFields.filter(field => 
          !firstIndicator.hasOwnProperty(field)
        );
        
        // Check data quality
        if (analysis.hasValidStructure) {
          const hasNumericValues = performanceData.indicators.some(ind => 
            typeof ind.value === 'number' && !isNaN(ind.value)
          );
          analysis.dataQuality = hasNumericValues ? 'good' : 'poor';
        }
      }
      
      this.results.performanceAnalysis = {
        ...analysis,
        rawData: performanceData,
        success: analysis.hasIndicators && analysis.hasValidStructure && analysis.dataQuality === 'good'
      };
      
      const status = this.results.performanceAnalysis.success ? '✅' : '❌';
      console.log(`  ${status} Performance Data Structure: ${analysis.indicatorCount} indicators`);
      
      if (analysis.missingFields.length > 0) {
        console.log(`    Missing fields: ${analysis.missingFields.join(', ')}`);
      }
      
      console.log(`    Data Quality: ${analysis.dataQuality}`);
      
    } catch (error) {
      this.results.performanceAnalysis = {
        success: false,
        error: error.message
      };
      console.log('  ❌ Performance analysis failed');
    }
    
    console.log('');
  }

  async testUIDataFlow() {
    console.log('🔄 Testing UI Data Flow...');
    
    // Test sequential requests to simulate UI behavior
    const testSequence = [
      '/api/crypto/BTC/USDT',
      '/api/signals/BTC%2FUSDT',
      '/api/performance-metrics',
      '/api/accuracy/BTC/USDT'
    ];
    
    const flowResults = [];
    
    for (let i = 0; i < testSequence.length; i++) {
      const endpoint = testSequence[i];
      
      try {
        const start = Date.now();
        const { stdout } = await execAsync(`curl -s "${this.baseUrl}${endpoint}"`);
        const responseTime = Date.now() - start;
        
        let data = null;
        try {
          data = JSON.parse(stdout);
        } catch (e) {
          // Invalid JSON
        }
        
        flowResults.push({
          step: i + 1,
          endpoint,
          responseTime,
          success: data !== null && !data.error,
          dataPresent: data !== null
        });
        
        // Small delay between requests
        await this.sleep(100);
        
      } catch (error) {
        flowResults.push({
          step: i + 1,
          endpoint,
          responseTime: null,
          success: false,
          error: error.message
        });
      }
    }
    
    const successfulSteps = flowResults.filter(r => r.success).length;
    const avgResponseTime = flowResults
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / flowResults.length;
    
    this.results.uiComponents.dataFlow = {
      steps: flowResults,
      successRate: (successfulSteps / testSequence.length) * 100,
      avgResponseTime,
      isFlowHealthy: successfulSteps >= testSequence.length * 0.8
    };
    
    console.log(`  Data Flow: ${successfulSteps}/${testSequence.length} steps successful`);
    console.log(`  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log('');
  }

  async validateComponentIntegration() {
    console.log('🧩 Validating Component Integration...');
    
    // Test multiple rapid requests to simulate UI updates
    const rapidTestResults = [];
    
    for (let i = 0; i < 5; i++) {
      try {
        const start = Date.now();
        const { stdout } = await execAsync(`curl -s "${this.baseUrl}/api/performance-metrics"`);
        const responseTime = Date.now() - start;
        
        let data = null;
        try {
          data = JSON.parse(stdout);
        } catch (e) {
          // Invalid JSON
        }
        
        rapidTestResults.push({
          iteration: i + 1,
          responseTime,
          success: data !== null && !data.error,
          cacheHit: responseTime < 50 // Likely cached if very fast
        });
        
        await this.sleep(50); // Quick succession
        
      } catch (error) {
        rapidTestResults.push({
          iteration: i + 1,
          responseTime: null,
          success: false,
          error: error.message
        });
      }
    }
    
    const rapidSuccessRate = rapidTestResults.filter(r => r.success).length / rapidTestResults.length * 100;
    const avgRapidResponseTime = rapidTestResults
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / rapidTestResults.length;
    
    this.results.uiComponents.integration = {
      rapidTestResults,
      rapidSuccessRate,
      avgRapidResponseTime,
      consistentPerformance: rapidSuccessRate >= 80
    };
    
    console.log(`  Rapid Updates: ${rapidSuccessRate}% success rate`);
    console.log(`  Rapid Response Time: ${avgRapidResponseTime.toFixed(0)}ms`);
    console.log('');
  }

  async identifyRootCauses() {
    console.log('🔍 Identifying Root Causes...');
    
    const issues = [];
    
    // Check endpoint failures
    Object.entries(this.results.endpoints).forEach(([endpoint, result]) => {
      if (!result.success) {
        if (result.hasError) {
          issues.push({
            type: 'API_ERROR',
            severity: 'HIGH',
            component: 'Backend API',
            description: `${endpoint} returns error: ${result.errorMessage}`,
            endpoint,
            recommendation: 'Fix backend API endpoint logic'
          });
        } else if (result.httpCode !== 200) {
          issues.push({
            type: 'HTTP_ERROR',
            severity: 'HIGH',
            component: 'HTTP Response',
            description: `${endpoint} returns HTTP ${result.httpCode}`,
            endpoint,
            recommendation: 'Check endpoint availability and routing'
          });
        }
      }
    });
    
    // Check performance analysis specific issues
    if (!this.results.performanceAnalysis.success) {
      if (this.results.performanceAnalysis.parseError) {
        issues.push({
          type: 'DATA_FORMAT',
          severity: 'HIGH',
          component: 'Performance Analysis',
          description: 'Performance metrics endpoint returns invalid JSON',
          recommendation: 'Fix JSON serialization in performance metrics endpoint'
        });
      } else if (this.results.performanceAnalysis.missingFields?.length > 0) {
        issues.push({
          type: 'DATA_STRUCTURE',
          severity: 'MEDIUM',
          component: 'Performance Analysis',
          description: `Missing required fields: ${this.results.performanceAnalysis.missingFields.join(', ')}`,
          recommendation: 'Update performance metrics data structure'
        });
      } else if (this.results.performanceAnalysis.dataQuality === 'poor') {
        issues.push({
          type: 'DATA_QUALITY',
          severity: 'MEDIUM',
          component: 'Performance Analysis',
          description: 'Performance metrics contain invalid or non-numeric values',
          recommendation: 'Validate data before sending to frontend'
        });
      }
    }
    
    // Check data flow issues
    if (this.results.uiComponents.dataFlow && !this.results.uiComponents.dataFlow.isFlowHealthy) {
      issues.push({
        type: 'DATA_FLOW',
        severity: 'MEDIUM',
        component: 'UI Data Flow',
        description: `Low success rate: ${this.results.uiComponents.dataFlow.successRate}%`,
        recommendation: 'Improve error handling and retry logic'
      });
    }
    
    this.results.issues = issues;
    
    console.log(`  Found ${issues.length} issues:`);
    issues.forEach((issue, index) => {
      const severityIcon = issue.severity === 'HIGH' ? '🔴' : issue.severity === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`    ${severityIcon} ${issue.type}: ${issue.description}`);
    });
    
    console.log('');
  }

  async generateImplementationPlan() {
    console.log('📋 Generating Implementation Plan...');
    
    const solutions = [];
    
    // Group issues by component and generate solutions
    const issuesByComponent = {};
    this.results.issues.forEach(issue => {
      if (!issuesByComponent[issue.component]) {
        issuesByComponent[issue.component] = [];
      }
      issuesByComponent[issue.component].push(issue);
    });
    
    Object.entries(issuesByComponent).forEach(([component, componentIssues]) => {
      const highSeverityIssues = componentIssues.filter(i => i.severity === 'HIGH');
      const mediumSeverityIssues = componentIssues.filter(i => i.severity === 'MEDIUM');
      
      if (component === 'Performance Analysis') {
        solutions.push({
          component,
          priority: highSeverityIssues.length > 0 ? 'HIGH' : 'MEDIUM',
          action: 'Fix Performance Metrics Endpoint',
          steps: [
            'Validate performance metrics data structure',
            'Ensure all required fields are present',
            'Add proper error handling for data generation',
            'Implement data validation before JSON serialization',
            'Add authentic values for missing indicators'
          ],
          files: [
            'server/routes.ts',
            'server/performanceMetricsManager.ts'
          ],
          testEndpoint: '/api/performance-metrics'
        });
      }
      
      if (component === 'Backend API') {
        const errorEndpoints = componentIssues.map(i => i.endpoint);
        solutions.push({
          component,
          priority: 'HIGH',
          action: 'Fix API Endpoint Errors',
          steps: [
            'Review error handling in affected endpoints',
            'Add proper authentication checks',
            'Implement graceful degradation for missing data',
            'Add comprehensive logging for debugging'
          ],
          affectedEndpoints: errorEndpoints,
          testRequired: true
        });
      }
    });
    
    // If no major issues, add optimization recommendations
    if (this.results.issues.length === 0) {
      solutions.push({
        component: 'Optimization',
        priority: 'LOW',
        action: 'Performance Optimization',
        steps: [
          'Add response caching for performance metrics',
          'Implement request batching for UI updates',
          'Add loading states for better user experience',
          'Optimize database queries for faster response times'
        ]
      });
    }
    
    this.results.solutions = solutions;
    
    console.log(`  Generated ${solutions.length} solutions:`);
    solutions.forEach((solution, index) => {
      const priorityIcon = solution.priority === 'HIGH' ? '🔴' : solution.priority === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`    ${priorityIcon} ${solution.action} (${solution.component})`);
      
      if (solution.steps) {
        solution.steps.forEach(step => {
          console.log(`      - ${step}`);
        });
      }
    });
    
    console.log('');
  }

  generateFinalReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('=' .repeat(70));
    console.log('COMPREHENSIVE UI DIAGNOSTIC REPORT');
    console.log('=' .repeat(70));
    console.log(`Analysis completed in ${duration}s\n`);
    
    // Summary statistics
    const totalEndpoints = Object.keys(this.results.endpoints).length;
    const successfulEndpoints = Object.values(this.results.endpoints).filter(e => e.success).length;
    const endpointSuccessRate = (successfulEndpoints / totalEndpoints) * 100;
    
    console.log('📊 SUMMARY STATISTICS:');
    console.log(`Endpoint Success Rate: ${successfulEndpoints}/${totalEndpoints} (${endpointSuccessRate.toFixed(1)}%)`);
    console.log(`Performance Analysis: ${this.results.performanceAnalysis.success ? 'WORKING' : 'BROKEN'}`);
    console.log(`UI Data Flow: ${this.results.uiComponents.dataFlow?.isFlowHealthy ? 'HEALTHY' : 'DEGRADED'}`);
    console.log(`Critical Issues: ${this.results.issues.filter(i => i.severity === 'HIGH').length}`);
    console.log(`Total Issues: ${this.results.issues.length}\n`);
    
    // Detailed findings
    console.log('🔍 DETAILED FINDINGS:');
    
    console.log('\nEndpoint Status:');
    Object.entries(this.results.endpoints).forEach(([endpoint, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${endpoint}: HTTP ${result.httpCode} (${result.responseTime || 'N/A'}ms)`);
      if (!result.success && result.errorMessage) {
        console.log(`    Error: ${result.errorMessage}`);
      }
    });
    
    if (this.results.performanceAnalysis) {
      console.log('\nPerformance Analysis Box:');
      const paStatus = this.results.performanceAnalysis.success ? '✅' : '❌';
      console.log(`  ${paStatus} Data Structure: ${this.results.performanceAnalysis.indicatorCount || 0} indicators`);
      console.log(`  Data Quality: ${this.results.performanceAnalysis.dataQuality || 'unknown'}`);
      
      if (this.results.performanceAnalysis.missingFields?.length > 0) {
        console.log(`  Missing Fields: ${this.results.performanceAnalysis.missingFields.join(', ')}`);
      }
    }
    
    // Implementation recommendations
    console.log('\n🎯 IMPLEMENTATION RECOMMENDATIONS:');
    
    if (this.results.issues.length === 0) {
      console.log('✅ No critical issues found - UI is functioning correctly');
      console.log('✅ Performance analysis box appears to be working');
      console.log('✅ All endpoints are responding properly');
      console.log('✅ Consider implementing performance optimizations');
    } else {
      console.log('Priority Actions Required:');
      
      const highPrioritySolutions = this.results.solutions.filter(s => s.priority === 'HIGH');
      const mediumPrioritySolutions = this.results.solutions.filter(s => s.priority === 'MEDIUM');
      
      if (highPrioritySolutions.length > 0) {
        console.log('\n🔴 HIGH PRIORITY:');
        highPrioritySolutions.forEach(solution => {
          console.log(`• ${solution.action}`);
          if (solution.files) {
            console.log(`  Files to modify: ${solution.files.join(', ')}`);
          }
        });
      }
      
      if (mediumPrioritySolutions.length > 0) {
        console.log('\n🟡 MEDIUM PRIORITY:');
        mediumPrioritySolutions.forEach(solution => {
          console.log(`• ${solution.action}`);
        });
      }
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Review endpoint errors and fix backend issues');
    console.log('2. Validate performance metrics data structure');
    console.log('3. Test UI components after fixes');
    console.log('4. Implement performance optimizations');
    console.log('5. Add comprehensive error handling');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run comprehensive diagnostic
async function main() {
  const diagnostic = new ComprehensiveUIDiagnostic();
  await diagnostic.runFullDiagnostic();
}

main().catch(console.error);