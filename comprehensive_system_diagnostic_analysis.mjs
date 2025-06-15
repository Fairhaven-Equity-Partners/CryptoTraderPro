/**
 * COMPREHENSIVE SYSTEM DIAGNOSTIC ANALYSIS
 * External Shell Testing - Complete Line-by-Line Error Analysis & Health Assessment
 * 
 * Ground Rules Compliance:
 * 1. External shell testing for all validations
 * 2. NO synthetic data, only authentic market calculations
 * 3. Real-time validation of all implementations
 * 4. Zero tolerance for system crashes
 * 5. Comprehensive error analysis and resolution
 * 6. UI integration analysis
 * 7. Performance metrics validation
 * 8. Accuracy measurement verification
 * 9. Efficiency optimization analysis
 * 10. Health status monitoring
 * 11. Complete system integration testing
 */

import fs from 'fs';
import fetch from 'node-fetch';

class ComprehensiveSystemDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.apiUrl = 'http://localhost:5000/api';
    this.criticalErrors = [];
    this.warningErrors = [];
    this.performanceIssues = [];
    this.uiIssues = [];
    this.integrationIssues = [];
    this.healthMetrics = {};
    this.accuracyMetrics = {};
    this.efficiencyMetrics = {};
    this.systemAnalysis = {};
  }

  async runComprehensiveAnalysis() {
    console.log('🔍 [COMPREHENSIVE-DIAGNOSTIC] Starting Complete System Analysis');
    console.log('═══════════════════════════════════════════════════════════════');
    
    try {
      // Phase 1: Critical Error Analysis
      await this.analyzeCriticalErrors();
      
      // Phase 2: Performance Analysis
      await this.analyzePerformanceMetrics();
      
      // Phase 3: UI Component Analysis
      await this.analyzeUIComponents();
      
      // Phase 4: Integration Analysis
      await this.analyzeSystemIntegration();
      
      // Phase 5: Health Status Analysis
      await this.analyzeSystemHealth();
      
      // Phase 6: Accuracy Analysis
      await this.analyzeAccuracyMetrics();
      
      // Phase 7: Efficiency Analysis
      await this.analyzeEfficiencyMetrics();
      
      // Phase 8: Pattern Integration Analysis
      await this.analyzePatternIntegration();
      
      // Phase 9: Performance UI Analysis
      await this.analyzePerformanceUIStructure();
      
      // Phase 10: Generate Integration Plan
      await this.generateIntegrationPlan();
      
      // Phase 11: Generate Complete Report
      await this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ [DIAGNOSTIC] Critical analysis failure:', error.message);
      this.criticalErrors.push({
        component: 'System Diagnostic',
        error: error.message,
        severity: 'CRITICAL',
        timestamp: new Date().toISOString()
      });
    }
  }

  async analyzeCriticalErrors() {
    console.log('🚨 [PHASE-1] Analyzing Critical System Errors');
    
    try {
      // Test core API endpoints for errors
      const coreEndpoints = [
        '/api/crypto/BTC/USDT',
        '/api/signals/BTC/USDT',
        '/api/technical-analysis/BTC/USDT',
        '/api/enhanced-pattern-recognition/BTC/USDT',
        '/api/confluence-analysis/BTC/USDT',
        '/api/performance-metrics',
        '/api/trade-simulations/BTC/USDT',
        '/api/accuracy/BTC/USDT'
      ];

      for (const endpoint of coreEndpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`);
          const data = await response.json();
          
          if (!response.ok) {
            this.criticalErrors.push({
              component: `API Endpoint: ${endpoint}`,
              error: `HTTP ${response.status}: ${data.error || 'Unknown error'}`,
              severity: 'HIGH',
              endpoint
            });
          } else if (data.error) {
            this.warningErrors.push({
              component: `API Response: ${endpoint}`,
              error: data.error,
              severity: 'MEDIUM',
              endpoint
            });
          }
        } catch (error) {
          this.criticalErrors.push({
            component: `API Connectivity: ${endpoint}`,
            error: error.message,
            severity: 'CRITICAL',
            endpoint
          });
        }
      }

      // Test Monte Carlo specifically (known issue)
      try {
        const monteCarloResponse = await fetch(`${this.apiUrl}/monte-carlo-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: 'BTC/USDT',
            timeframe: '4h',
            confidence: 0.85,
            iterations: 1000
          })
        });
        
        const monteCarloData = await monteCarloResponse.json();
        
        if (!monteCarloResponse.ok || monteCarloData.error) {
          this.criticalErrors.push({
            component: 'Monte Carlo Risk Assessment',
            error: monteCarloData.error || 'Parameter validation failure',
            severity: 'HIGH',
            fix: 'Fix symbol parameter handling or implement alternative'
          });
        }
      } catch (error) {
        this.criticalErrors.push({
          component: 'Monte Carlo Risk Assessment',
          error: error.message,
          severity: 'CRITICAL',
          fix: 'Complete Monte Carlo system overhaul required'
        });
      }

      console.log(`   → Critical errors found: ${this.criticalErrors.length}`);
      console.log(`   → Warning errors found: ${this.warningErrors.length}`);
      
    } catch (error) {
      this.criticalErrors.push({
        component: 'Error Analysis Phase',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
  }

  async analyzePerformanceMetrics() {
    console.log('📊 [PHASE-2] Analyzing Performance Metrics');
    
    try {
      // Test performance metrics endpoint
      const perfResponse = await fetch(`${this.apiUrl}/performance-metrics`);
      const perfData = await perfResponse.json();
      
      this.performanceIssues = [];
      
      if (!perfData.indicators || perfData.indicators.length === 0) {
        this.performanceIssues.push({
          component: 'Performance Metrics',
          issue: 'No performance indicators available',
          severity: 'HIGH',
          impact: 'Performance tracking disabled'
        });
      }
      
      // Test signal generation performance
      const signalStartTime = Date.now();
      const signalResponse = await fetch(`${this.apiUrl}/signals/BTC/USDT`);
      const signalEndTime = Date.now();
      const signalResponseTime = signalEndTime - signalStartTime;
      
      if (signalResponseTime > 5000) {
        this.performanceIssues.push({
          component: 'Signal Generation',
          issue: `Slow response time: ${signalResponseTime}ms`,
          severity: 'MEDIUM',
          impact: 'User experience degradation'
        });
      }
      
      this.efficiencyMetrics.signalResponseTime = signalResponseTime;
      
      // Test technical analysis performance
      const techStartTime = Date.now();
      const techResponse = await fetch(`${this.apiUrl}/technical-analysis/BTC/USDT`);
      const techEndTime = Date.now();
      const techResponseTime = techEndTime - techStartTime;
      
      this.efficiencyMetrics.technicalAnalysisResponseTime = techResponseTime;
      
      console.log(`   → Performance issues found: ${this.performanceIssues.length}`);
      console.log(`   → Signal response time: ${signalResponseTime}ms`);
      console.log(`   → Technical analysis response time: ${techResponseTime}ms`);
      
    } catch (error) {
      this.performanceIssues.push({
        component: 'Performance Analysis',
        issue: error.message,
        severity: 'HIGH'
      });
    }
  }

  async analyzeUIComponents() {
    console.log('🎨 [PHASE-3] Analyzing UI Components');
    
    try {
      // Check for UI component files and structure
      const uiComponents = [
        'client/src/pages/Analysis.tsx',
        'client/src/components/AdvancedSignalDashboard.tsx',
        'client/src/components/UnifiedPerformancePanel.tsx',
        'client/src/components/EnhancedMarketStructureAnalysis.tsx',
        'client/src/components/PatternAnalysisDisplay.tsx',
        'client/src/components/MonteCarloRiskDisplay.tsx'
      ];

      for (const componentPath of uiComponents) {
        try {
          if (fs.existsSync(componentPath)) {
            const content = fs.readFileSync(componentPath, 'utf8');
            
            // Check for common UI issues
            if (content.includes('TODO') || content.includes('FIXME')) {
              this.uiIssues.push({
                component: componentPath,
                issue: 'Contains TODO/FIXME comments',
                severity: 'LOW'
              });
            }
            
            if (content.includes('console.error') || content.includes('console.warn')) {
              this.uiIssues.push({
                component: componentPath,
                issue: 'Contains console error/warning statements',
                severity: 'MEDIUM'
              });
            }
            
            // Check for performance issues
            if (content.includes('useEffect(() => {') && !content.includes('[]')) {
              this.uiIssues.push({
                component: componentPath,
                issue: 'Potential infinite re-render in useEffect',
                severity: 'HIGH'
              });
            }
          } else {
            this.uiIssues.push({
              component: componentPath,
              issue: 'Component file missing',
              severity: 'HIGH'
            });
          }
        } catch (error) {
          this.uiIssues.push({
            component: componentPath,
            issue: `File read error: ${error.message}`,
            severity: 'MEDIUM'
          });
        }
      }
      
      console.log(`   → UI issues found: ${this.uiIssues.length}`);
      
    } catch (error) {
      this.uiIssues.push({
        component: 'UI Analysis',
        issue: error.message,
        severity: 'HIGH'
      });
    }
  }

  async analyzeSystemIntegration() {
    console.log('🔗 [PHASE-4] Analyzing System Integration');
    
    try {
      // Test integration between components
      const integrationTests = [
        {
          name: 'Pattern Recognition → Signal Generation',
          test: async () => {
            const patternResponse = await fetch(`${this.apiUrl}/enhanced-pattern-recognition/BTC/USDT?timeframe=4h`);
            const patternData = await patternResponse.json();
            
            const signalResponse = await fetch(`${this.apiUrl}/signals/BTC/USDT`);
            const signalData = await signalResponse.json();
            
            return {
              patternsDetected: patternData.patterns?.length || 0,
              signalsGenerated: Array.isArray(signalData) ? signalData.length : 0,
              integration: patternData.patterns?.length > 0 && Array.isArray(signalData) && signalData.length > 0
            };
          }
        },
        {
          name: 'Technical Analysis → Performance Metrics',
          test: async () => {
            const techResponse = await fetch(`${this.apiUrl}/technical-analysis/BTC/USDT`);
            const techData = await techResponse.json();
            
            const perfResponse = await fetch(`${this.apiUrl}/performance-metrics`);
            const perfData = await perfResponse.json();
            
            return {
              indicatorsActive: techData.indicators ? Object.keys(techData.indicators).length : 0,
              performanceTracked: perfData.indicators?.length || 0,
              integration: techData.success && perfData.indicators !== undefined
            };
          }
        }
      ];

      for (const test of integrationTests) {
        try {
          const result = await test.test();
          
          if (!result.integration) {
            this.integrationIssues.push({
              component: test.name,
              issue: 'Integration not functioning correctly',
              severity: 'HIGH',
              details: result
            });
          }
        } catch (error) {
          this.integrationIssues.push({
            component: test.name,
            issue: `Integration test failed: ${error.message}`,
            severity: 'CRITICAL'
          });
        }
      }
      
      console.log(`   → Integration issues found: ${this.integrationIssues.length}`);
      
    } catch (error) {
      this.integrationIssues.push({
        component: 'Integration Analysis',
        issue: error.message,
        severity: 'HIGH'
      });
    }
  }

  async analyzeSystemHealth() {
    console.log('❤️ [PHASE-5] Analyzing System Health');
    
    try {
      // Calculate overall system health metrics
      const healthChecks = {
        apiConnectivity: this.criticalErrors.filter(e => e.component.includes('API')).length === 0,
        performanceAcceptable: this.performanceIssues.filter(p => p.severity === 'HIGH').length === 0,
        uiStability: this.uiIssues.filter(u => u.severity === 'HIGH').length === 0,
        integrationWorking: this.integrationIssues.filter(i => i.severity === 'HIGH').length === 0
      };

      const healthScore = Object.values(healthChecks).filter(check => check).length / Object.keys(healthChecks).length * 100;
      
      this.healthMetrics = {
        overallHealth: healthScore,
        apiConnectivity: healthChecks.apiConnectivity,
        performanceStatus: healthChecks.performanceAcceptable ? 'GOOD' : 'NEEDS_ATTENTION',
        uiStability: healthChecks.uiStability ? 'STABLE' : 'UNSTABLE',
        integrationStatus: healthChecks.integrationWorking ? 'WORKING' : 'BROKEN',
        criticalErrorCount: this.criticalErrors.length,
        warningCount: this.warningErrors.length,
        timestamp: new Date().toISOString()
      };
      
      console.log(`   → Overall health score: ${healthScore.toFixed(1)}%`);
      console.log(`   → Critical errors: ${this.criticalErrors.length}`);
      console.log(`   → Performance issues: ${this.performanceIssues.length}`);
      
    } catch (error) {
      this.healthMetrics = {
        overallHealth: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeAccuracyMetrics() {
    console.log('🎯 [PHASE-6] Analyzing Accuracy Metrics');
    
    try {
      const accuracyResponse = await fetch(`${this.apiUrl}/accuracy/BTC/USDT`);
      const accuracyData = await accuracyResponse.json();
      
      // Test signal accuracy
      const signalResponse = await fetch(`${this.apiUrl}/signals/BTC/USDT`);
      const signalData = await signalResponse.json();
      
      this.accuracyMetrics = {
        signalAccuracy: accuracyData.accuracy || 0,
        signalCount: Array.isArray(signalData) ? signalData.length : 0,
        confidenceAverage: Array.isArray(signalData) ? 
          signalData.reduce((sum, s) => sum + (s.confidence || 0), 0) / signalData.length : 0,
        accuracyTrend: accuracyData.trend || 'UNKNOWN',
        lastUpdated: accuracyData.lastUpdated || new Date().toISOString()
      };
      
      console.log(`   → Signal accuracy: ${this.accuracyMetrics.signalAccuracy}%`);
      console.log(`   → Average confidence: ${this.accuracyMetrics.confidenceAverage.toFixed(1)}%`);
      
    } catch (error) {
      this.accuracyMetrics = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeEfficiencyMetrics() {
    console.log('⚡ [PHASE-7] Analyzing Efficiency Metrics');
    
    try {
      // Calculate API efficiency
      const startTime = Date.now();
      
      const endpoints = [
        '/api/crypto/BTC/USDT',
        '/api/signals/BTC/USDT',
        '/api/technical-analysis/BTC/USDT'
      ];
      
      const responseTimes = [];
      
      for (const endpoint of endpoints) {
        const endpointStartTime = Date.now();
        await fetch(`${this.baseUrl}${endpoint}`);
        const endpointEndTime = Date.now();
        responseTimes.push(endpointEndTime - endpointStartTime);
      }
      
      const totalTime = Date.now() - startTime;
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      this.efficiencyMetrics = {
        ...this.efficiencyMetrics,
        totalProcessingTime: totalTime,
        averageResponseTime,
        apiEfficiency: averageResponseTime < 1000 ? 'EXCELLENT' : averageResponseTime < 3000 ? 'GOOD' : 'POOR',
        throughput: responseTimes.length / (totalTime / 1000), // requests per second
        timestamp: new Date().toISOString()
      };
      
      console.log(`   → Average response time: ${averageResponseTime.toFixed(0)}ms`);
      console.log(`   → API efficiency: ${this.efficiencyMetrics.apiEfficiency}`);
      
    } catch (error) {
      this.efficiencyMetrics.error = error.message;
    }
  }

  async analyzePatternIntegration() {
    console.log('🧩 [PHASE-8] Analyzing Pattern Integration');
    
    try {
      // Check if pattern analysis is properly integrated
      const patternResponse = await fetch(`${this.apiUrl}/enhanced-pattern-recognition/BTC/USDT?timeframe=4h`);
      const patternData = await patternResponse.json();
      
      const confluenceResponse = await fetch(`${this.apiUrl}/confluence-analysis/BTC/USDT`);
      const confluenceData = await confluenceResponse.json();
      
      // Check Analysis.tsx integration
      const analysisContent = fs.readFileSync('client/src/pages/Analysis.tsx', 'utf8');
      const hasEnhancedMarketStructure = analysisContent.includes('EnhancedMarketStructureAnalysis');
      const hasPerformancePanel = analysisContent.includes('UnifiedPerformancePanel');
      
      this.systemAnalysis.patternIntegration = {
        patternsDetected: patternData.patterns?.length || 0,
        confluenceAnalysis: !!confluenceData.confluenceAnalysis,
        uiIntegration: hasEnhancedMarketStructure,
        performancePanelExists: hasPerformancePanel,
        integrationComplete: hasEnhancedMarketStructure && patternData.patterns?.length > 0
      };
      
      console.log(`   → Patterns detected: ${patternData.patterns?.length || 0}`);
      console.log(`   → UI integration: ${hasEnhancedMarketStructure ? 'YES' : 'NO'}`);
      console.log(`   → Integration complete: ${this.systemAnalysis.patternIntegration.integrationComplete ? 'YES' : 'NO'}`);
      
    } catch (error) {
      this.systemAnalysis.patternIntegration = {
        error: error.message
      };
    }
  }

  async analyzePerformanceUIStructure() {
    console.log('📱 [PHASE-9] Analyzing Performance UI Structure');
    
    try {
      // Analyze UnifiedPerformancePanel structure
      const performancePanelContent = fs.readFileSync('client/src/components/UnifiedPerformancePanel.tsx', 'utf8');
      
      this.systemAnalysis.performanceUI = {
        hasPerformancePanel: true,
        hasTabStructure: performancePanelContent.includes('TabsList') || performancePanelContent.includes('Tabs'),
        hasMetricsDisplay: performancePanelContent.includes('metrics') || performancePanelContent.includes('performance'),
        canIntegratePatterns: performancePanelContent.includes('TabsContent') || performancePanelContent.includes('Card'),
        fileSize: performancePanelContent.length,
        componentStructure: {
          usesTabs: performancePanelContent.includes('Tabs'),
          usesCards: performancePanelContent.includes('Card'),
          hasPropsInterface: performancePanelContent.includes('interface'),
          exportsComponent: performancePanelContent.includes('export')
        }
      };
      
      console.log(`   → Performance panel exists: YES`);
      console.log(`   → Has tab structure: ${this.systemAnalysis.performanceUI.hasTabStructure ? 'YES' : 'NO'}`);
      console.log(`   → Can integrate patterns: ${this.systemAnalysis.performanceUI.canIntegratePatterns ? 'YES' : 'NO'}`);
      
    } catch (error) {
      this.systemAnalysis.performanceUI = {
        error: error.message,
        hasPerformancePanel: false
      };
    }
  }

  async generateIntegrationPlan() {
    console.log('📋 [PHASE-10] Generating Integration Plan');
    
    const integrationPlan = {
      priority: 'HIGH',
      objective: 'Move Enhanced Market Structure Analysis into Performance Analysis UI box',
      requirements: [
        'Integrate pattern analysis into UnifiedPerformancePanel as new tab',
        'Remove separate EnhancedMarketStructureAnalysis component usage',
        'Maintain all pattern detection functionality',
        'Preserve existing performance metrics display',
        'Ensure responsive UI design'
      ],
      implementation: {
        step1: 'Modify UnifiedPerformancePanel to include Pattern Analysis tab',
        step2: 'Move pattern recognition components into performance panel',
        step3: 'Update Analysis.tsx to remove separate pattern component',
        step4: 'Test integration with external shell testing',
        step5: 'Validate all functionality works as expected'
      },
      estimatedComplexity: 'MEDIUM',
      riskLevel: 'LOW',
      testingRequired: true
    };

    this.systemAnalysis.integrationPlan = integrationPlan;
    
    console.log('   → Integration plan generated');
    console.log(`   → Complexity: ${integrationPlan.estimatedComplexity}`);
    console.log(`   → Risk level: ${integrationPlan.riskLevel}`);
  }

  async generateComprehensiveReport() {
    console.log('\n🎯 [COMPREHENSIVE-REPORT] Complete System Analysis Results');
    console.log('═══════════════════════════════════════════════════════════════');
    
    console.log('\n🚨 CRITICAL ERRORS:');
    if (this.criticalErrors.length === 0) {
      console.log('   ✅ No critical errors detected');
    } else {
      this.criticalErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.severity}] ${error.component}: ${error.error}`);
        if (error.fix) console.log(`      → Fix: ${error.fix}`);
      });
    }

    console.log('\n⚠️ WARNING ISSUES:');
    if (this.warningErrors.length === 0) {
      console.log('   ✅ No warning issues detected');
    } else {
      this.warningErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.severity}] ${error.component}: ${error.error}`);
      });
    }

    console.log('\n📊 PERFORMANCE ANALYSIS:');
    console.log(`   → Signal Response Time: ${this.efficiencyMetrics.signalResponseTime || 'N/A'}ms`);
    console.log(`   → Technical Analysis Time: ${this.efficiencyMetrics.technicalAnalysisResponseTime || 'N/A'}ms`);
    console.log(`   → API Efficiency: ${this.efficiencyMetrics.apiEfficiency || 'Unknown'}`);
    console.log(`   → Performance Issues: ${this.performanceIssues.length}`);

    console.log('\n🎨 UI COMPONENT ANALYSIS:');
    console.log(`   → UI Issues Found: ${this.uiIssues.length}`);
    console.log(`   → Performance Panel: ${this.systemAnalysis.performanceUI?.hasPerformancePanel ? 'EXISTS' : 'MISSING'}`);
    console.log(`   → Pattern Integration: ${this.systemAnalysis.patternIntegration?.integrationComplete ? 'COMPLETE' : 'INCOMPLETE'}`);

    console.log('\n🔗 INTEGRATION STATUS:');
    console.log(`   → Pattern → Signal Integration: ${this.systemAnalysis.patternIntegration?.patternsDetected > 0 ? 'WORKING' : 'BROKEN'}`);
    console.log(`   → UI Integration: ${this.systemAnalysis.patternIntegration?.uiIntegration ? 'ACTIVE' : 'MISSING'}`);
    console.log(`   → Integration Issues: ${this.integrationIssues.length}`);

    console.log('\n❤️ SYSTEM HEALTH:');
    console.log(`   → Overall Health Score: ${this.healthMetrics.overallHealth?.toFixed(1) || 'N/A'}%`);
    console.log(`   → API Connectivity: ${this.healthMetrics.apiConnectivity ? 'GOOD' : 'ISSUES'}`);
    console.log(`   → Performance Status: ${this.healthMetrics.performanceStatus || 'Unknown'}`);
    console.log(`   → UI Stability: ${this.healthMetrics.uiStability || 'Unknown'}`);

    console.log('\n🎯 ACCURACY METRICS:');
    console.log(`   → Signal Accuracy: ${this.accuracyMetrics.signalAccuracy || 'N/A'}%`);
    console.log(`   → Average Confidence: ${this.accuracyMetrics.confidenceAverage?.toFixed(1) || 'N/A'}%`);
    console.log(`   → Signal Count: ${this.accuracyMetrics.signalCount || 'N/A'}`);

    console.log('\n📋 INTEGRATION PLAN:');
    if (this.systemAnalysis.integrationPlan) {
      const plan = this.systemAnalysis.integrationPlan;
      console.log(`   → Objective: ${plan.objective}`);
      console.log(`   → Complexity: ${plan.estimatedComplexity}`);
      console.log(`   → Risk Level: ${plan.riskLevel}`);
      console.log('   → Implementation Steps:');
      Object.entries(plan.implementation).forEach(([step, description]) => {
        console.log(`     ${step}: ${description}`);
      });
    }

    console.log('\n🚀 NEXT ACTIONS REQUIRED:');
    console.log('   1. Fix critical errors if any exist');
    console.log('   2. Implement pattern integration into performance UI');
    console.log('   3. Test complete system with external shell testing');
    console.log('   4. Validate all functionality post-integration');
    console.log('   5. Monitor system health and performance');

    const overallSystemRating = this.calculateOverallSystemRating();
    console.log(`\n⭐ OVERALL SYSTEM RATING: ${overallSystemRating}/100`);
    
    return {
      criticalErrors: this.criticalErrors,
      warningErrors: this.warningErrors,
      performanceIssues: this.performanceIssues,
      uiIssues: this.uiIssues,
      integrationIssues: this.integrationIssues,
      healthMetrics: this.healthMetrics,
      accuracyMetrics: this.accuracyMetrics,
      efficiencyMetrics: this.efficiencyMetrics,
      systemAnalysis: this.systemAnalysis,
      overallRating: overallSystemRating
    };
  }

  calculateOverallSystemRating() {
    let rating = 100;

    // Deduct for critical errors
    rating -= this.criticalErrors.length * 15;

    // Deduct for warning errors
    rating -= this.warningErrors.length * 5;

    // Deduct for performance issues
    rating -= this.performanceIssues.filter(p => p.severity === 'HIGH').length * 10;
    rating -= this.performanceIssues.filter(p => p.severity === 'MEDIUM').length * 5;

    // Deduct for UI issues
    rating -= this.uiIssues.filter(u => u.severity === 'HIGH').length * 8;
    rating -= this.uiIssues.filter(u => u.severity === 'MEDIUM').length * 3;

    // Deduct for integration issues
    rating -= this.integrationIssues.filter(i => i.severity === 'HIGH').length * 12;
    rating -= this.integrationIssues.filter(i => i.severity === 'MEDIUM').length * 6;

    // Factor in health metrics
    if (this.healthMetrics.overallHealth) {
      rating = (rating * 0.7) + (this.healthMetrics.overallHealth * 0.3);
    }

    return Math.max(0, Math.min(100, Math.round(rating)));
  }
}

async function main() {
  const diagnostic = new ComprehensiveSystemDiagnostic();
  await diagnostic.runComprehensiveAnalysis();
}

main().catch(console.error);