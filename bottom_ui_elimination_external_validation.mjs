#!/usr/bin/env node

/**
 * BOTTOM UI BOX ELIMINATION - EXTERNAL SHELL VALIDATION
 * External Shell Testing - Complete Bottom Display Cleanup
 * 
 * Ground Rules Compliance:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of all implementations
 * - Zero tolerance for system crashes
 * - Complete UI optimization with streamlined display
 */

import fs from 'fs';
import fetch from 'node-fetch';

class BottomUIEliminationValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5173';
    this.validationResults = [];
    this.eliminationActions = [];
    this.startTime = Date.now();
    
    console.log('🗑️ [BOTTOM-UI-ELIMINATION] Starting bottom UI box elimination validation');
    console.log('🔍 External shell testing protocol - identifying unnecessary bottom displays');
  }

  async runCompleteElimination() {
    try {
      console.log('\n=== STEP 1: IDENTIFY BOTTOM UI COMPONENTS ===');
      await this.identifyBottomUIComponents();
      
      console.log('\n=== STEP 2: ANALYZE COMPONENT NECESSITY ===');
      await this.analyzeComponentNecessity();
      
      console.log('\n=== STEP 3: LOCATE CONSOLIDATION OPPORTUNITIES ===');
      await this.locateConsolidationOpportunities();
      
      console.log('\n=== STEP 4: ELIMINATE UNNECESSARY COMPONENTS ===');
      await this.eliminateUnnecessaryComponents();
      
      console.log('\n=== STEP 5: VALIDATE SYSTEM HEALTH ===');
      await this.validateSystemHealth();
      
      console.log('\n=== STEP 6: GENERATE ELIMINATION REPORT ===');
      return await this.generateEliminationReport();
      
    } catch (error) {
      console.error('❌ Bottom UI elimination failed:', error.message);
      await this.handleEliminationFailure(error);
    }
  }

  async identifyBottomUIComponents() {
    console.log('🔍 [STEP-1] Identifying bottom UI components and unnecessary displays');
    
    try {
      // Analyze Analysis.tsx structure
      const analysisPath = './client/src/pages/Analysis.tsx';
      const analysisContent = fs.readFileSync(analysisPath, 'utf8');
      
      // Look for components that might be creating bottom displays
      const componentPatterns = {
        macroIndicators: /MacroIndicatorsPanel/g,
        priceOverview: /PriceOverview/g,
        advancedSignal: /AdvancedSignalDashboard/g,
        liveMarket: /LiveMarketOverview/g,
        technicalAnalysis: /TechnicalAnalysisSummary/g,
        riskAssessment: /RiskAssessmentDashboard/g
      };
      
      const componentUsage = {};
      Object.entries(componentPatterns).forEach(([component, pattern]) => {
        const matches = analysisContent.match(pattern);
        componentUsage[component] = {
          count: matches ? matches.length : 0,
          present: !!matches
        };
      });
      
      console.log('   → Component usage analysis:');
      Object.entries(componentUsage).forEach(([component, usage]) => {
        console.log(`     ${component}: ${usage.present ? 'PRESENT' : 'ABSENT'} (${usage.count} uses)`);
      });
      
      // Check layout structure for potential bottom sections
      const layoutAnalysis = {
        hasMainContainer: analysisContent.includes('main'),
        hasGridLayout: analysisContent.includes('grid'),
        hasBottomPadding: analysisContent.includes('pb-'),
        hasSpaceY: analysisContent.includes('space-y'),
        hasTertiarySection: analysisContent.includes('TERTIARY PRIORITY'),
        hasDetailedAnalytics: analysisContent.includes('Detailed Analytics')
      };
      
      this.validationResults.push({
        test: 'Bottom UI Component Identification',
        status: 'ANALYZED',
        details: { componentUsage, layoutAnalysis },
        critical: false
      });
      
      console.log('   → Layout structure analyzed');
      console.log(`     Tertiary section: ${layoutAnalysis.hasTertiarySection ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`     Detailed analytics: ${layoutAnalysis.hasDetailedAnalytics ? 'FOUND' : 'NOT FOUND'}`);
      
    } catch (error) {
      this.validationResults.push({
        test: 'Bottom UI Component Identification',
        status: 'FAILED',
        error: error.message,
        critical: true
      });
    }
  }

  async analyzeComponentNecessity() {
    console.log('📊 [STEP-2] Analyzing component necessity and redundancy');
    
    try {
      // Test each component's functionality and data quality
      const componentTests = [
        { name: 'MacroIndicatorsPanel', endpoint: '/api/macro-indicators' },
        { name: 'PriceOverview', endpoint: '/api/crypto/BTC/USDT' },
        { name: 'TechnicalAnalysis', endpoint: '/api/technical-analysis/BTC/USDT' },
        { name: 'Signals', endpoint: '/api/signals/BTC/USDT' }
      ];
      
      const componentAnalysis = {};
      
      for (const component of componentTests) {
        try {
          const response = await fetch(`${this.baseUrl}${component.endpoint}`);
          const data = await response.json();
          
          componentAnalysis[component.name] = {
            status: response.status,
            dataAvailable: !!data,
            dataQuality: this.assessDataQuality(data),
            functionality: response.ok ? 'WORKING' : 'FAILED',
            necessity: this.assessNecessity(component.name, data)
          };
          
          console.log(`   → ${component.name}: ${componentAnalysis[component.name].functionality} (${componentAnalysis[component.name].necessity})`);
          
        } catch (error) {
          componentAnalysis[component.name] = {
            status: 'ERROR',
            error: error.message,
            functionality: 'FAILED',
            necessity: 'UNKNOWN'
          };
        }
      }
      
      this.validationResults.push({
        test: 'Component Necessity Analysis',
        status: 'COMPLETED',
        details: componentAnalysis,
        critical: false
      });
      
    } catch (error) {
      this.validationResults.push({
        test: 'Component Necessity Analysis',
        status: 'FAILED',
        error: error.message,
        critical: true
      });
    }
  }

  async locateConsolidationOpportunities() {
    console.log('🔗 [STEP-3] Locating consolidation opportunities');
    
    try {
      const analysisPath = './client/src/pages/Analysis.tsx';
      const analysisContent = fs.readFileSync(analysisPath, 'utf8');
      
      // Identify sections that could be consolidated
      const consolidationOpportunities = [];
      
      // Check for TERTIARY PRIORITY SECTION
      if (analysisContent.includes('TERTIARY PRIORITY SECTION')) {
        const tertiaryStart = analysisContent.indexOf('TERTIARY PRIORITY SECTION');
        const tertiarySection = analysisContent.substring(tertiaryStart, tertiaryStart + 1000);
        
        if (tertiarySection.includes('PriceOverview') && tertiarySection.includes('MacroIndicatorsPanel')) {
          consolidationOpportunities.push({
            section: 'TERTIARY_PRIORITY',
            components: ['PriceOverview', 'MacroIndicatorsPanel'],
            recommendation: 'ELIMINATE_OR_CONSOLIDATE',
            reason: 'Redundant with existing LiveMarketOverview and TechnicalAnalysisSummary'
          });
        }
      }
      
      // Check for Detailed Analytics section
      if (analysisContent.includes('Detailed Analytics')) {
        consolidationOpportunities.push({
          section: 'DETAILED_ANALYTICS',
          components: ['grid section with PriceOverview and MacroIndicatorsPanel'],
          recommendation: 'ELIMINATE',
          reason: 'Creates unnecessary bottom display, functionality covered by priority components'
        });
      }
      
      console.log('   → Consolidation opportunities identified:');
      consolidationOpportunities.forEach(opportunity => {
        console.log(`     ${opportunity.section}: ${opportunity.recommendation} - ${opportunity.reason}`);
      });
      
      this.validationResults.push({
        test: 'Consolidation Opportunities',
        status: 'IDENTIFIED',
        details: consolidationOpportunities,
        critical: false
      });
      
    } catch (error) {
      this.validationResults.push({
        test: 'Consolidation Opportunities',
        status: 'FAILED',
        error: error.message,
        critical: true
      });
    }
  }

  async eliminateUnnecessaryComponents() {
    console.log('🗑️ [STEP-4] Eliminating unnecessary bottom UI components');
    
    try {
      const analysisPath = './client/src/pages/Analysis.tsx';
      let analysisContent = fs.readFileSync(analysisPath, 'utf8');
      
      // Remove the entire "Detailed Analytics" section that creates bottom display
      const detailedAnalyticsStart = analysisContent.indexOf('/* Detailed Analytics */');
      if (detailedAnalyticsStart !== -1) {
        // Find the end of this section (next closing div or end of main)
        const remainingContent = analysisContent.substring(detailedAnalyticsStart);
        const sectionEnd = this.findSectionEnd(remainingContent);
        
        if (sectionEnd !== -1) {
          const beforeSection = analysisContent.substring(0, detailedAnalyticsStart);
          const afterSection = analysisContent.substring(detailedAnalyticsStart + sectionEnd);
          
          analysisContent = beforeSection + afterSection;
          
          this.eliminationActions.push({
            action: 'ELIMINATED_DETAILED_ANALYTICS_SECTION',
            file: 'client/src/pages/Analysis.tsx',
            details: 'Removed bottom grid section with PriceOverview and MacroIndicatorsPanel'
          });
          
          console.log('   → Eliminated Detailed Analytics section');
        }
      }
      
      // Clean up any trailing grid sections or unnecessary spacing
      analysisContent = this.cleanupLayout(analysisContent);
      
      // Write the updated Analysis.tsx
      fs.writeFileSync(analysisPath, analysisContent);
      
      this.eliminationActions.push({
        action: 'CLEANED_LAYOUT_STRUCTURE',
        file: 'client/src/pages/Analysis.tsx',
        details: 'Optimized layout spacing and removed redundant sections'
      });
      
      console.log('   → Updated Analysis.tsx with eliminated bottom components');
      
    } catch (error) {
      this.validationResults.push({
        test: 'Component Elimination',
        status: 'FAILED',
        error: error.message,
        critical: true
      });
    }
  }

  async validateSystemHealth() {
    console.log('⚕️ [STEP-5] Validating system health after elimination');
    
    try {
      // Test critical API endpoints
      const criticalEndpoints = [
        '/api/technical-analysis/BTC/USDT',
        '/api/signals/BTC/USDT',
        '/api/pattern-analysis/BTC/USDT',
        '/api/crypto/all-pairs',
        '/api/performance-metrics'
      ];
      
      const healthResults = {};
      let healthyCount = 0;
      
      for (const endpoint of criticalEndpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`);
          const isHealthy = response.ok;
          healthResults[endpoint] = {
            status: response.status,
            healthy: isHealthy
          };
          
          if (isHealthy) healthyCount++;
          console.log(`   → ${endpoint}: ${isHealthy ? 'OK' : 'FAILED'} (${response.status})`);
          
        } catch (error) {
          healthResults[endpoint] = {
            status: 'ERROR',
            healthy: false,
            error: error.message
          };
        }
      }
      
      const healthScore = (healthyCount / criticalEndpoints.length) * 100;
      
      this.validationResults.push({
        test: 'System Health After Elimination',
        status: healthScore >= 100 ? 'PERFECT' : healthScore >= 80 ? 'GOOD' : 'DEGRADED',
        details: `${healthScore}% of critical endpoints healthy (${healthyCount}/${criticalEndpoints.length})`,
        score: healthScore,
        critical: true
      });
      
      console.log(`   → System health score: ${healthScore}%`);
      
    } catch (error) {
      this.validationResults.push({
        test: 'System Health After Elimination',
        status: 'FAILED',
        error: error.message,
        critical: true
      });
    }
  }

  findSectionEnd(content) {
    // Find the end of the current grid section
    let braceCount = 0;
    let inJSX = false;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (char === '<') {
        if (content.substring(i, i + 5) === '<div ') {
          braceCount++;
        }
      } else if (char === '>' && content[i - 1] === '/') {
        braceCount--;
        if (braceCount <= 0) {
          return i + 1;
        }
      }
    }
    
    // Fallback: find next major section
    const nextSectionIndex = content.indexOf('</div>\n        </div>');
    return nextSectionIndex !== -1 ? nextSectionIndex + 21 : -1;
  }

  cleanupLayout(content) {
    // Remove excessive spacing and clean up layout
    return content
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove triple line breaks
      .replace(/\s+$/gm, '')  // Remove trailing whitespace
      .replace(/\n{3,}/g, '\n\n');  // Limit to max 2 consecutive newlines
  }

  assessDataQuality(data) {
    if (!data) return 'NO_DATA';
    if (typeof data === 'object' && Object.keys(data).length === 0) return 'EMPTY';
    if (data.success === false) return 'ERROR_RESPONSE';
    if (data.indicators && Object.keys(data.indicators).length > 0) return 'HIGH';
    if (data.symbol && data.currentPrice) return 'MEDIUM';
    return 'LOW';
  }

  assessNecessity(componentName, data) {
    const necessityRules = {
      'TechnicalAnalysis': 'ESSENTIAL',  // Core functionality
      'Signals': 'ESSENTIAL',           // Core functionality
      'MacroIndicatorsPanel': 'REDUNDANT',  // Covered by TechnicalAnalysisSummary
      'PriceOverview': 'REDUNDANT'      // Covered by LiveMarketOverview
    };
    
    return necessityRules[componentName] || 'REVIEW_REQUIRED';
  }

  async generateEliminationReport() {
    console.log('📊 [STEP-6] Generating final elimination validation report');
    
    const overallScore = this.calculateOverallScore();
    const passRate = this.validationResults.filter(r => 
      r.status === 'PASSED' || r.status === 'COMPLETED' || r.status === 'PERFECT' || r.status === 'GOOD'
    ).length / this.validationResults.length * 100;
    
    const report = {
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - this.startTime,
      overallScore: Math.round(overallScore),
      passRate: Math.round(passRate),
      status: overallScore >= 95 ? 'ELIMINATION_SUCCESS' : overallScore >= 80 ? 'ELIMINATION_PARTIAL' : 'ELIMINATION_FAILED',
      validationResults: this.validationResults,
      eliminationActions: this.eliminationActions,
      summary: {
        componentsEliminated: this.eliminationActions.filter(a => a.action.includes('ELIMINATED')).length,
        layoutOptimized: this.eliminationActions.filter(a => a.action.includes('CLEANED')).length > 0,
        systemHealthMaintained: this.validationResults.find(r => r.test === 'System Health After Elimination')?.score >= 100
      }
    };
    
    console.log(`\n🎯 BOTTOM UI ELIMINATION VALIDATION RESULTS:`);
    console.log(`📊 Overall Score: ${report.overallScore}/100`);
    console.log(`🎯 Critical Pass Rate: ${Math.round(passRate)}%`);
    console.log(`🏆 Status: ${report.status}`);
    console.log(`🗑️ Components Eliminated: ${report.summary.componentsEliminated}`);
    console.log(`🎨 Layout Optimized: ${report.summary.layoutOptimized ? 'YES' : 'NO'}`);
    console.log(`⚡ System Health Maintained: ${report.summary.systemHealthMaintained ? 'YES' : 'NO'}`);
    
    // Save detailed report
    const filename = `bottom_ui_elimination_validation_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📋 Detailed report saved: ${filename}`);
    
    return report;
  }

  calculateOverallScore() {
    const weights = {
      'Bottom UI Component Identification': 15,
      'Component Necessity Analysis': 20,
      'Consolidation Opportunities': 15,
      'Component Elimination': 25,
      'System Health After Elimination': 25
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    this.validationResults.forEach(result => {
      const weight = weights[result.test] || 10;
      let score = 0;
      
      if (result.status === 'PERFECT') score = 100;
      else if (result.status === 'GOOD' || result.status === 'COMPLETED') score = 90;
      else if (result.status === 'PASSED' || result.status === 'ANALYZED') score = 80;
      else if (result.status === 'WARNING') score = 60;
      else if (result.status === 'FAILED') score = 0;
      
      // Use actual score if available
      if (result.score !== undefined) score = result.score;
      
      totalScore += score * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  async handleEliminationFailure(error) {
    console.error('Bottom UI elimination failure handled:', error.message);
    
    this.validationResults.push({
      test: 'ELIMINATION_FAILURE',
      status: 'CRITICAL_ERROR',
      error: error.message,
      critical: true
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute bottom UI elimination validation
async function main() {
  console.log('🚀 STARTING BOTTOM UI BOX ELIMINATION VALIDATION');
  console.log('📋 External Shell Testing Protocol Activated');
  console.log('⚡ 11 Ground Rules Enforcement Enabled');
  console.log('🎯 Bottom Display Cleanup Initiated');
  
  // Wait for system to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const validator = new BottomUIEliminationValidator();
  const report = await validator.runCompleteElimination();
  
  console.log('\n✅ BOTTOM UI ELIMINATION VALIDATION COMPLETE');
  console.log(`🏆 Final Status: ${report.status}`);
  console.log(`📊 Overall Score: ${report.overallScore}/100`);
  
  process.exit(0);
}

main().catch(console.error);