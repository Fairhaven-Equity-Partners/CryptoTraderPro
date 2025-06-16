#!/usr/bin/env node

/**
 * CORRECT LAYOUT REPOSITIONING - EXTERNAL SHELL VALIDATION
 * Removing MarketAnalysisDisplay and moving AdvancedSignalDashboard to correct position
 * 
 * GROUND RULES COMPLIANCE:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of all implementations
 * - Zero tolerance for system crashes
 */

import fs from 'fs';
import fetch from 'node-fetch';

class CorrectLayoutRepositioning {
  constructor() {
    this.baseUrl = 'http://localhost:5173';
    this.issues = [];
    this.findings = [];
    
    console.log('🔍 CORRECT LAYOUT REPOSITIONING - EXTERNAL SHELL VALIDATION');
    console.log('📋 Removing MarketAnalysisDisplay and repositioning AdvancedSignalDashboard');
    console.log('⚡ Moving large bottom box above its current position');
  }

  async runCorrectRepositioning() {
    try {
      console.log('\n=== STEP 1: ANALYZE CURRENT LAYOUT ===');
      await this.analyzeCurrentLayout();
      
      console.log('\n=== STEP 2: REMOVE MARKETANALYSISDISPLAY ===');
      await this.removeMarketAnalysisDisplay();
      
      console.log('\n=== STEP 3: REPOSITION ADVANCEDSIGNALDASHBOARD ===');
      await this.repositionAdvancedSignalDashboard();
      
      console.log('\n=== STEP 4: VALIDATE CORRECT POSITIONING ===');
      await this.validateCorrectPositioning();
      
      console.log('\n=== STEP 5: TEST SYSTEM FUNCTIONALITY ===');
      await this.testSystemFunctionality();
      
      return await this.generateReport();
      
    } catch (error) {
      console.error('❌ Correct repositioning failed:', error.message);
      this.issues.push(`Repositioning Error: ${error.message}`);
    }
  }

  async analyzeCurrentLayout() {
    console.log('📋 [STEP-1] Analyzing current layout structure');
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    const content = fs.readFileSync(analysisPath, 'utf8');
    
    // Find current component positions
    const lines = content.split('\n');
    const componentPositions = {};
    
    lines.forEach((line, index) => {
      if (line.includes('<LiveMarketOverview')) componentPositions.LiveMarketOverview = index + 1;
      if (line.includes('<TechnicalAnalysisSummary')) componentPositions.TechnicalAnalysisSummary = index + 1;
      if (line.includes('<RiskAssessmentDashboard')) componentPositions.RiskAssessmentDashboard = index + 1;
      if (line.includes('<MarketAnalysisDisplay')) componentPositions.MarketAnalysisDisplay = index + 1;
      if (line.includes('<AdvancedSignalDashboard')) componentPositions.AdvancedSignalDashboard = index + 1;
    });
    
    console.log('   → Current component positions:');
    Object.entries(componentPositions).forEach(([comp, line]) => {
      console.log(`     ${comp}: Line ${line}`);
    });
    
    // Check if MarketAnalysisDisplay exists
    const hasMarketAnalysisDisplay = componentPositions.MarketAnalysisDisplay !== undefined;
    console.log(`   → MarketAnalysisDisplay present: ${hasMarketAnalysisDisplay ? 'YES' : 'NO'}`);
    
    if (hasMarketAnalysisDisplay) {
      this.issues.push('MarketAnalysisDisplay needs to be removed');
    }
    
    this.findings.push({
      step: 'Current Layout Analysis',
      status: 'ANALYZED',
      details: { componentPositions, hasMarketAnalysisDisplay }
    });
  }

  async removeMarketAnalysisDisplay() {
    console.log('🗑️ [STEP-2] Removing MarketAnalysisDisplay component');
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    let content = fs.readFileSync(analysisPath, 'utf8');
    let changesMade = false;
    
    // Remove import
    if (content.includes("import MarketAnalysisDisplay from '../components/MarketAnalysisDisplay';")) {
      content = content.replace(/import MarketAnalysisDisplay from '\.\.\/components\/MarketAnalysisDisplay';\n?/g, '');
      console.log('   → Removed MarketAnalysisDisplay import');
      changesMade = true;
    }
    
    // Remove the entire market analysis section
    const marketAnalysisSection = /\s*\/\* MARKET ANALYSIS SECTION \*\/\s*<div className="mb-6">\s*<MarketAnalysisDisplay \/>\s*<\/div>\s*/g;
    if (content.match(marketAnalysisSection)) {
      content = content.replace(marketAnalysisSection, '\n        ');
      console.log('   → Removed MarketAnalysisDisplay section');
      changesMade = true;
    }
    
    // Write changes
    if (changesMade) {
      fs.writeFileSync(analysisPath, content);
      console.log('   → Analysis.tsx updated');
    }
    
    // Delete component file
    const componentPath = './client/src/components/MarketAnalysisDisplay.tsx';
    if (fs.existsSync(componentPath)) {
      fs.unlinkSync(componentPath);
      console.log('   → Deleted MarketAnalysisDisplay.tsx file');
      changesMade = true;
    }
    
    this.findings.push({
      step: 'MarketAnalysisDisplay Removal',
      status: changesMade ? 'REMOVED' : 'NOT_NEEDED',
      details: { changesMade }
    });
  }

  async repositionAdvancedSignalDashboard() {
    console.log('📍 [STEP-3] Repositioning AdvancedSignalDashboard');
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    let content = fs.readFileSync(analysisPath, 'utf8');
    
    // Find the current AdvancedSignalDashboard section
    const advancedSignalRegex = /(\s*\/\* TERTIARY PRIORITY SECTION - Detailed Analysis \*\/\s*<div className="space-y-6">\s*\/\* Advanced Signal Dashboard - Enhanced Version \*\/\s*<AdvancedSignalDashboard[^>]*>[^<]*<\/AdvancedSignalDashboard>\s*<\/div>)/;
    
    const match = content.match(advancedSignalRegex);
    if (!match) {
      this.issues.push('Could not find AdvancedSignalDashboard section to move');
      return;
    }
    
    const advancedSignalSection = match[1];
    console.log('   → Found AdvancedSignalDashboard section');
    
    // Remove it from current position
    content = content.replace(advancedSignalRegex, '');
    console.log('   → Removed AdvancedSignalDashboard from current position');
    
    // Find insertion point (after TechnicalAnalysisSummary/RiskAssessmentDashboard grid)
    const insertionPoint = content.indexOf('        </div>\n        {/* TERTIARY PRIORITY SECTION');
    
    if (insertionPoint === -1) {
      this.issues.push('Could not find insertion point for AdvancedSignalDashboard');
      return;
    }
    
    // Create the new positioned section
    const repositionedSection = `        </div>
        {/* ADVANCED SIGNAL DASHBOARD - REPOSITIONED */}
        <div className="mb-6">
          <AdvancedSignalDashboard
            symbol={currentAsset}
            onTimeframeSelect={handleChangeTimeframe}
          />
        </div>
        {/* TERTIARY PRIORITY SECTION`;
    
    // Insert at the correct position
    const beforeSection = content.substring(0, insertionPoint + '        </div>\n'.length);
    const afterSection = content.substring(insertionPoint + '        </div>\n'.length);
    
    content = beforeSection + repositionedSection.substring('        </div>\n'.length) + afterSection;
    
    // Write the updated content
    fs.writeFileSync(analysisPath, content);
    console.log('   → AdvancedSignalDashboard repositioned successfully');
    
    this.findings.push({
      step: 'AdvancedSignalDashboard Repositioning',
      status: 'REPOSITIONED',
      details: 'Moved from bottom to between Technical Analysis and remaining sections'
    });
  }

  async validateCorrectPositioning() {
    console.log('✅ [STEP-4] Validating correct positioning');
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    const content = fs.readFileSync(analysisPath, 'utf8');
    
    // Check final component order
    const lines = content.split('\n');
    const finalPositions = {};
    
    lines.forEach((line, index) => {
      if (line.includes('<LiveMarketOverview')) finalPositions.LiveMarketOverview = index + 1;
      if (line.includes('<TechnicalAnalysisSummary')) finalPositions.TechnicalAnalysisSummary = index + 1;
      if (line.includes('<RiskAssessmentDashboard')) finalPositions.RiskAssessmentDashboard = index + 1;
      if (line.includes('<AdvancedSignalDashboard')) finalPositions.AdvancedSignalDashboard = index + 1;
      if (line.includes('<MarketAnalysisDisplay')) finalPositions.MarketAnalysisDisplay = index + 1;
    });
    
    console.log('   → Final component positions:');
    Object.entries(finalPositions).forEach(([comp, line]) => {
      console.log(`     ${comp}: Line ${line}`);
    });
    
    // Verify correct order
    const correctOrder = 
      finalPositions.LiveMarketOverview < finalPositions.TechnicalAnalysisSummary &&
      finalPositions.TechnicalAnalysisSummary < finalPositions.AdvancedSignalDashboard &&
      !finalPositions.MarketAnalysisDisplay; // Should not exist
    
    console.log(`   → Component order correct: ${correctOrder ? 'YES' : 'NO'}`);
    console.log(`   → MarketAnalysisDisplay removed: ${!finalPositions.MarketAnalysisDisplay ? 'YES' : 'NO'}`);
    
    // Check import removal
    const hasMarketAnalysisImport = content.includes('MarketAnalysisDisplay');
    console.log(`   → MarketAnalysisDisplay import removed: ${!hasMarketAnalysisImport ? 'YES' : 'NO'}`);
    
    if (!correctOrder) this.issues.push('Component order is incorrect');
    if (finalPositions.MarketAnalysisDisplay) this.issues.push('MarketAnalysisDisplay still present');
    if (hasMarketAnalysisImport) this.issues.push('MarketAnalysisDisplay import still present');
    
    this.findings.push({
      step: 'Positioning Validation',
      status: correctOrder && !finalPositions.MarketAnalysisDisplay && !hasMarketAnalysisImport ? 'VALIDATED' : 'ISSUES_FOUND',
      details: { finalPositions, correctOrder, marketAnalysisRemoved: !finalPositions.MarketAnalysisDisplay }
    });
  }

  async testSystemFunctionality() {
    console.log('🧪 [STEP-5] Testing system functionality');
    
    try {
      const response = await fetch(`${this.baseUrl}/`, { timeout: 5000 });
      const pageLoads = response.ok;
      
      console.log(`   → Analysis page loads: ${pageLoads ? 'YES' : 'NO'}`);
      
      if (!pageLoads) {
        this.issues.push('Analysis page failed to load');
      }
      
      this.findings.push({
        step: 'System Functionality Test',
        status: pageLoads ? 'FUNCTIONAL' : 'NON_FUNCTIONAL',
        details: `Page loading status: ${pageLoads}`
      });
      
    } catch (error) {
      console.log(`   → System functionality test failed: ${error.message}`);
      this.issues.push(`System functionality test failed: ${error.message}`);
      
      this.findings.push({
        step: 'System Functionality Test',
        status: 'FAILED',
        details: error.message
      });
    }
  }

  async generateReport() {
    console.log('\n📊 [REPORT] Correct layout repositioning complete');
    
    const totalFindings = this.findings.length;
    const successfulFindings = this.findings.filter(f => 
      f.status === 'ANALYZED' || f.status === 'REMOVED' || f.status === 'REPOSITIONED' || f.status === 'VALIDATED' || f.status === 'FUNCTIONAL'
    ).length;
    const successRate = Math.round((successfulFindings / totalFindings) * 100);
    
    const report = {
      timestamp: new Date().toISOString(),
      successRate,
      totalIssues: this.issues.length,
      findings: this.findings,
      issues: this.issues,
      repositioningStatus: this.issues.length === 0 ? 'COMPLETED_SUCCESSFULLY' : 'COMPLETED_WITH_ISSUES'
    };
    
    console.log(`\n🎯 CORRECT REPOSITIONING RESULTS:`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`🐛 Issues Found: ${this.issues.length}`);
    console.log(`⚕️ Repositioning Status: ${report.repositioningStatus}`);
    
    if (this.issues.length > 0) {
      console.log(`\n❌ ISSUES IDENTIFIED:`);
      this.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log(`\n📋 IMPLEMENTATION SUMMARY:`);
    this.findings.forEach(finding => {
      console.log(`   → ${finding.step}: ${finding.status}`);
    });
    
    const filename = `correct_layout_repositioning_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📋 Repositioning report saved: ${filename}`);
    
    return report;
  }
}

// Execute correct repositioning
async function main() {
  const repositioner = new CorrectLayoutRepositioning();
  await repositioner.runCorrectRepositioning();
  process.exit(0);
}

main().catch(console.error);