/**
 * EXTERNAL SHELL TESTING - Pattern Integration Fix & Analysis
 * Fixed API connectivity and proper endpoint testing
 */

import fetch, { Headers } from 'node-fetch';

class PatternIntegrationFixer {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.results = [];
    this.issues = [];
    this.recommendations = [];
  }

  async runCompleteAnalysis() {
    console.log('🔍 [EXTERNAL-SHELL] Pattern Integration Analysis - Fixed Version');
    console.log('═══════════════════════════════════════════════════════════');
    
    try {
      // Test server connectivity first
      await this.testServerConnectivity();
      
      // Analyze current components
      await this.analyzeExistingComponents();
      
      // Test Monte Carlo specifically
      await this.testMonteCarloFix();
      
      // Plan integration strategy
      await this.planIntegrationStrategy();
      
      await this.generateFixedIntegrationPlan();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  async testServerConnectivity() {
    console.log('🔌 [CONNECTIVITY] Testing server connectivity');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/crypto/BTC/USDT`);
      const data = await response.json();
      
      if (data && data.symbol) {
        console.log('✅ Server connectivity verified');
        this.results.push({
          component: 'Server Connectivity',
          status: 'operational',
          details: 'API server responding correctly'
        });
      }
    } catch (error) {
      this.issues.push({
        component: 'Server Connectivity',
        error: error.message,
        severity: 'critical'
      });
    }
  }

  async analyzeExistingComponents() {
    console.log('📊 [COMPONENTS] Analyzing existing Analysis tab components');
    
    try {
      // Test technical analysis endpoint
      const techResponse = await fetch(`${this.baseUrl}/api/technical-analysis/BTC/USDT`);
      const techData = await techResponse.json();
      
      if (techData && techData.indicators) {
        console.log('✅ Technical analysis operational');
        console.log(`📈 Indicators: ${Object.keys(techData.indicators).join(', ')}`);
        
        this.results.push({
          component: 'Technical Analysis',
          status: 'operational',
          details: `${Object.keys(techData.indicators).length} indicators active`,
          indicators: Object.keys(techData.indicators)
        });
      }
      
      // Test pattern recognition endpoint  
      const patternResponse = await fetch(`${this.baseUrl}/api/enhanced-pattern-recognition/BTC/USDT?timeframe=4h`);
      const patternData = await patternResponse.json();
      
      if (patternData && patternData.patterns) {
        console.log('✅ Pattern recognition operational');
        console.log(`🔍 Patterns detected: ${patternData.patterns.length}`);
        
        this.results.push({
          component: 'Pattern Recognition',
          status: 'operational',
          details: `${patternData.patterns.length} pattern types detected`,
          patterns: patternData.patterns.map(p => p.type)
        });
      }
      
      // Test signals integration
      const signalsResponse = await fetch(`${this.baseUrl}/api/signals/BTC/USDT`);
      const signalsData = await signalsResponse.json();
      
      if (signalsData && Array.isArray(signalsData)) {
        console.log('✅ Signal generation operational');
        console.log(`📡 Active signals: ${signalsData.length}`);
        
        this.results.push({
          component: 'Signal Generation',
          status: 'operational',
          details: `${signalsData.length} signals generated`,
          signalTypes: signalsData.map(s => `${s.timeframe} ${s.direction}`)
        });
      }
      
    } catch (error) {
      this.issues.push({
        component: 'Component Analysis',
        error: error.message,
        severity: 'medium'
      });
    }
  }

  async testMonteCarloFix() {
    console.log('🎯 [MONTE-CARLO] Testing Monte Carlo fixes');
    
    try {
      const monteCarloData = {
        symbol: 'BTC/USDT',
        timeframe: '4h',
        confidence: 0.85,
        iterations: 1000
      };
      
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monteCarloData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Monte Carlo operational');
        console.log(`📊 Risk metrics: VaR ${result.valueAtRisk?.toFixed(2)}%, Sharpe ${result.sharpeRatio?.toFixed(2)}`);
        
        this.results.push({
          component: 'Monte Carlo Risk Assessment',
          status: 'operational',
          details: 'Risk calculations working correctly',
          metrics: {
            valueAtRisk: result.valueAtRisk,
            sharpeRatio: result.sharpeRatio,
            maxDrawdown: result.maxDrawdown
          }
        });
      } else {
        console.log('⚠️ Monte Carlo issues detected');
        
        this.issues.push({
          component: 'Monte Carlo Risk Assessment',
          error: result.error || 'Parameter validation issues',
          severity: 'high',
          fix: 'Fix symbol parameter handling in frontend components'
        });
      }
      
    } catch (error) {
      console.log('❌ Monte Carlo critical error');
      
      this.issues.push({
        component: 'Monte Carlo Risk Assessment',
        error: error.message,
        severity: 'critical',
        fix: 'Complete Monte Carlo component overhaul needed'
      });
    }
  }

  async planIntegrationStrategy() {
    console.log('⚙️ [STRATEGY] Planning integration strategy');
    
    // High priority recommendations
    this.recommendations.push({
      priority: 'CRITICAL',
      action: 'Integrate PatternAnalysisDisplay into Analysis tab',
      implementation: 'Move pattern analysis component into enhanced market structure analysis box',
      files: ['client/src/pages/Analysis.tsx', 'client/src/components/PatternAnalysisDisplay.tsx']
    });
    
    this.recommendations.push({
      priority: 'HIGH',
      action: 'Consolidate technical analysis in auto-calculations',
      implementation: 'Ensure pattern recognition feeds into signal confidence scoring',
      files: ['server/routes.ts', 'server/enhancedPatternRecognition.ts']
    });
    
    this.recommendations.push({
      priority: 'HIGH',
      action: 'Remove separate Patterns tab navigation',
      implementation: 'Update navigation to remove patterns tab, keep all analysis in main tab',
      files: ['client/src/App.tsx', 'client/src/components/NavigationBar.tsx', 'client/src/types.ts']
    });
    
    // Monte Carlo fix or replacement
    if (this.issues.find(i => i.component === 'Monte Carlo Risk Assessment')) {
      this.recommendations.push({
        priority: 'HIGH',
        action: 'Fix Monte Carlo or implement alternative',
        implementation: 'Either fix parameter validation or replace with simplified risk metrics',
        files: ['client/src/components/MonteCarloRiskDisplay.tsx']
      });
    }
    
    console.log('📋 Integration strategy developed');
  }

  async generateFixedIntegrationPlan() {
    console.log('\n🎯 [INTEGRATION-PLAN] Fixed Integration Analysis Report');
    console.log('═══════════════════════════════════════════════════════════');
    
    console.log('\n✅ OPERATIONAL COMPONENTS:');
    this.results.forEach(result => {
      console.log(`  ✓ ${result.component}: ${result.details}`);
      if (result.indicators) {
        console.log(`    → Indicators: ${result.indicators.join(', ')}`);
      }
      if (result.patterns) {
        console.log(`    → Patterns: ${result.patterns.join(', ')}`);
      }
    });
    
    console.log('\n❌ ISSUES TO RESOLVE:');
    this.issues.forEach(issue => {
      console.log(`  ⚠️  ${issue.component}: ${issue.error}`);
      if (issue.fix) {
        console.log(`     → Fix: ${issue.fix}`);
      }
    });
    
    console.log('\n🚀 INTEGRATION IMPLEMENTATION PLAN:');
    this.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.action}`);
      console.log(`     → ${rec.implementation}`);
      if (rec.files) {
        console.log(`     → Files: ${rec.files.join(', ')}`);
      }
    });
    
    const operationalCount = this.results.filter(r => r.status === 'operational').length;
    const totalComponents = this.results.length + this.issues.length;
    const healthScore = Math.round((operationalCount / Math.max(totalComponents, 1)) * 100);
    
    console.log('\n📊 INTEGRATION READINESS:');
    console.log(`     Operational Components: ${operationalCount}/${totalComponents}`);
    console.log(`     System Health: ${healthScore}/100`);
    console.log(`     Ready for Integration: ${healthScore >= 60 ? 'YES' : 'PARTIAL'}`);
    
    if (healthScore >= 60) {
      console.log('\n🟢 PROCEEDING WITH INTEGRATION');
      console.log('     System ready for pattern analysis integration');
    } else {
      console.log('\n🟡 PROCEEDING WITH CAUTION');
      console.log('     Will fix issues during integration process');
    }
    
    return {
      results: this.results,
      issues: this.issues,
      recommendations: this.recommendations,
      healthScore,
      readyForIntegration: healthScore >= 60
    };
  }
}

async function main() {
  const fixer = new PatternIntegrationFixer();
  await fixer.runCompleteAnalysis();
}

main().catch(console.error);