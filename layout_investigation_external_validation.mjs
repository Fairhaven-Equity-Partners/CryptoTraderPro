#!/usr/bin/env node

/**
 * LAYOUT INVESTIGATION - EXTERNAL SHELL VALIDATION
 * Investigating why market analysis repositioning is not visible
 * 
 * OBJECTIVE: Identify and fix layout positioning issues
 * PROTOCOL: Complete external shell testing with component visibility verification
 */

import fs from 'fs';
import fetch from 'node-fetch';

class LayoutInvestigationValidator {
  constructor() {
    this.baseUrl = 'http://localhost:5173';
    this.issues = [];
    this.findings = [];
    
    console.log('🔍 LAYOUT INVESTIGATION - EXTERNAL SHELL VALIDATION');
    console.log('📋 Investigating market analysis positioning visibility');
    console.log('⚡ Component rendering and layout analysis');
  }

  async runInvestigation() {
    try {
      console.log('\n=== STEP 1: VERIFY CURRENT FILE STRUCTURE ===');
      await this.verifyFileStructure();
      
      console.log('\n=== STEP 2: ANALYZE ANALYSIS.TSX CONTENT ===');
      await this.analyzeAnalysisFile();
      
      console.log('\n=== STEP 3: CHECK COMPONENT IMPORTS ===');
      await this.checkComponentImports();
      
      console.log('\n=== STEP 4: VERIFY CRITICALSIGNALANALYSIS COMPONENT ===');
      await this.verifyCriticalSignalComponent();
      
      console.log('\n=== STEP 5: TEST COMPONENT VISIBILITY ===');
      await this.testComponentVisibility();
      
      console.log('\n=== STEP 6: FIX IDENTIFIED ISSUES ===');
      await this.fixIdentifiedIssues();
      
      return await this.generateReport();
      
    } catch (error) {
      console.error('❌ Layout investigation failed:', error.message);
      this.issues.push(`Investigation Error: ${error.message}`);
    }
  }

  async verifyFileStructure() {
    console.log('📁 [STEP-1] Verifying file structure and component existence');
    
    const files = [
      './client/src/pages/Analysis.tsx',
      './client/src/components/CriticalSignalAnalysis.tsx',
      './client/src/components/LiveMarketOverview.tsx',
      './client/src/components/TechnicalAnalysisSummary.tsx',
      './client/src/components/RiskAssessmentDashboard.tsx',
      './client/src/components/AdvancedSignalDashboard.tsx'
    ];
    
    for (const file of files) {
      const exists = fs.existsSync(file);
      console.log(`   → ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
      if (!exists) {
        this.issues.push(`Missing file: ${file}`);
      }
    }
    
    this.findings.push({
      step: 'File Structure Verification',
      status: this.issues.length === 0 ? 'PASSED' : 'ISSUES_FOUND',
      details: `${files.filter(f => fs.existsSync(f)).length}/${files.length} files present`
    });
  }

  async analyzeAnalysisFile() {
    console.log('🔍 [STEP-2] Analyzing Analysis.tsx content and structure');
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    const content = fs.readFileSync(analysisPath, 'utf8');
    
    // Check component usage
    const componentUsage = {
      LiveMarketOverview: content.includes('<LiveMarketOverview'),
      TechnicalAnalysisSummary: content.includes('<TechnicalAnalysisSummary'),
      RiskAssessmentDashboard: content.includes('<RiskAssessmentDashboard'),
      CriticalSignalAnalysis: content.includes('<CriticalSignalAnalysis'),
      AdvancedSignalDashboard: content.includes('<AdvancedSignalDashboard')
    };
    
    console.log('   → Component usage in JSX:');
    Object.entries(componentUsage).forEach(([comp, used]) => {
      console.log(`     ${comp}: ${used ? 'USED' : 'NOT_USED'}`);
      if (!used && comp === 'CriticalSignalAnalysis') {
        this.issues.push('CriticalSignalAnalysis not found in JSX');
      }
    });
    
    // Check line positions
    const lines = content.split('\n');
    const componentLines = {};
    lines.forEach((line, index) => {
      if (line.includes('<LiveMarketOverview')) componentLines.LiveMarketOverview = index + 1;
      if (line.includes('<TechnicalAnalysisSummary')) componentLines.TechnicalAnalysisSummary = index + 1;
      if (line.includes('<RiskAssessmentDashboard')) componentLines.RiskAssessmentDashboard = index + 1;
      if (line.includes('<CriticalSignalAnalysis')) componentLines.CriticalSignalAnalysis = index + 1;
      if (line.includes('<AdvancedSignalDashboard')) componentLines.AdvancedSignalDashboard = index + 1;
    });
    
    console.log('   → Component line positions:');
    Object.entries(componentLines).forEach(([comp, line]) => {
      console.log(`     ${comp}: Line ${line}`);
    });
    
    this.findings.push({
      step: 'Analysis File Structure',
      status: componentUsage.CriticalSignalAnalysis ? 'PASSED' : 'FAILED',
      details: { componentUsage, componentLines }
    });
  }

  async checkComponentImports() {
    console.log('📦 [STEP-3] Checking component imports');
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    const content = fs.readFileSync(analysisPath, 'utf8');
    
    const requiredImports = [
      'LiveMarketOverview',
      'TechnicalAnalysisSummary', 
      'RiskAssessmentDashboard',
      'CriticalSignalAnalysis',
      'AdvancedSignalDashboard'
    ];
    
    const importChecks = {};
    requiredImports.forEach(comp => {
      const hasImport = content.includes(`import ${comp} from`) || content.includes(`import { ${comp} }`);
      importChecks[comp] = hasImport;
      console.log(`   → ${comp} import: ${hasImport ? 'PRESENT' : 'MISSING'}`);
      if (!hasImport) {
        this.issues.push(`Missing import: ${comp}`);
      }
    });
    
    this.findings.push({
      step: 'Component Imports',
      status: Object.values(importChecks).every(Boolean) ? 'PASSED' : 'FAILED',
      details: importChecks
    });
  }

  async verifyCriticalSignalComponent() {
    console.log('🎯 [STEP-4] Verifying CriticalSignalAnalysis component');
    
    const componentPath = './client/src/components/CriticalSignalAnalysis.tsx';
    
    if (fs.existsSync(componentPath)) {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // Check if component exports correctly
      const hasDefaultExport = componentContent.includes('export default');
      const hasComponentDefinition = componentContent.includes('const CriticalSignalAnalysis') || 
                                    componentContent.includes('function CriticalSignalAnalysis');
      
      console.log(`   → Component file exists: YES`);
      console.log(`   → Has default export: ${hasDefaultExport ? 'YES' : 'NO'}`);
      console.log(`   → Has component definition: ${hasComponentDefinition ? 'YES' : 'NO'}`);
      
      if (!hasDefaultExport) {
        this.issues.push('CriticalSignalAnalysis missing default export');
      }
      if (!hasComponentDefinition) {
        this.issues.push('CriticalSignalAnalysis missing component definition');
      }
      
      this.findings.push({
        step: 'CriticalSignalAnalysis Component Verification',
        status: hasDefaultExport && hasComponentDefinition ? 'PASSED' : 'FAILED',
        details: { hasDefaultExport, hasComponentDefinition }
      });
      
    } else {
      console.log(`   → Component file exists: NO`);
      this.issues.push('CriticalSignalAnalysis.tsx file missing');
      this.findings.push({
        step: 'CriticalSignalAnalysis Component Verification',
        status: 'FAILED',
        details: 'Component file does not exist'
      });
    }
  }

  async testComponentVisibility() {
    console.log('👀 [STEP-5] Testing component visibility in browser');
    
    try {
      // Test if the analysis page loads
      const response = await fetch(`${this.baseUrl}/`, { timeout: 5000 });
      const pageLoads = response.ok;
      
      console.log(`   → Analysis page loads: ${pageLoads ? 'YES' : 'NO'}`);
      
      if (pageLoads) {
        // Test API endpoints that components use
        const endpoints = [
          '/api/crypto/all-pairs',
          '/api/signals/BTC/USDT'
        ];
        
        for (const endpoint of endpoints) {
          try {
            const apiResponse = await fetch(`${this.baseUrl}${endpoint}`, { timeout: 3000 });
            console.log(`   → ${endpoint}: ${apiResponse.ok ? 'WORKING' : 'ERROR'}`);
          } catch (error) {
            console.log(`   → ${endpoint}: CONNECTION_ERROR`);
          }
        }
      }
      
      this.findings.push({
        step: 'Component Visibility Test',
        status: pageLoads ? 'PASSED' : 'FAILED',
        details: `Page loading: ${pageLoads}`
      });
      
    } catch (error) {
      console.log(`   → Page visibility test failed: ${error.message}`);
      this.findings.push({
        step: 'Component Visibility Test',
        status: 'FAILED',
        details: error.message
      });
    }
  }

  async fixIdentifiedIssues() {
    console.log('🔧 [STEP-6] Fixing identified issues');
    
    if (this.issues.length === 0) {
      console.log('   → No issues found to fix');
      return;
    }
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    let content = fs.readFileSync(analysisPath, 'utf8');
    let changesMade = false;
    
    // Fix missing CriticalSignalAnalysis import
    if (this.issues.some(issue => issue.includes('Missing import: CriticalSignalAnalysis'))) {
      if (!content.includes("import CriticalSignalAnalysis from '../components/CriticalSignalAnalysis';")) {
        // Find the import section and add the import
        const importRegex = /(import.*from.*['"]\.\.\/components\/.*['"];)/g;
        const matches = content.match(importRegex);
        if (matches && matches.length > 0) {
          const lastImport = matches[matches.length - 1];
          const newImport = "\nimport CriticalSignalAnalysis from '../components/CriticalSignalAnalysis';";
          content = content.replace(lastImport, lastImport + newImport);
          changesMade = true;
          console.log('   → Added CriticalSignalAnalysis import');
        }
      }
    }
    
    // Fix missing CriticalSignalAnalysis in JSX
    if (this.issues.some(issue => issue.includes('CriticalSignalAnalysis not found in JSX'))) {
      // Find the correct position and add the component
      const targetPattern = `        </div>
        {/* TERTIARY PRIORITY SECTION - Detailed Analysis */}`;
      
      const replacement = `        </div>
        {/* MARKET ANALYSIS SECTION - Above Advanced Signals */}
        <div className="mb-6">
          <CriticalSignalAnalysis />
        </div>
        {/* TERTIARY PRIORITY SECTION - Detailed Analysis */}`;
      
      if (content.includes(targetPattern)) {
        content = content.replace(targetPattern, replacement);
        changesMade = true;
        console.log('   → Added CriticalSignalAnalysis component to JSX');
      }
    }
    
    // Write changes if any were made
    if (changesMade) {
      fs.writeFileSync(analysisPath, content);
      console.log('   → Changes written to Analysis.tsx');
      
      // Verify the fixes
      const updatedContent = fs.readFileSync(analysisPath, 'utf8');
      const hasImport = updatedContent.includes("import CriticalSignalAnalysis");
      const hasComponent = updatedContent.includes("<CriticalSignalAnalysis");
      
      console.log('   → Import verification:', hasImport ? 'SUCCESS' : 'FAILED');
      console.log('   → Component verification:', hasComponent ? 'SUCCESS' : 'FAILED');
      
      this.findings.push({
        step: 'Issue Fixes Applied',
        status: hasImport && hasComponent ? 'SUCCESS' : 'PARTIAL',
        details: { hasImport, hasComponent, changesMade }
      });
    } else {
      console.log('   → No changes needed or unable to apply fixes');
      this.findings.push({
        step: 'Issue Fixes Applied',
        status: 'NO_CHANGES',
        details: 'No fixable issues found'
      });
    }
  }

  async generateReport() {
    console.log('\n📊 [REPORT] Layout investigation complete');
    
    const totalFindings = this.findings.length;
    const passedFindings = this.findings.filter(f => f.status === 'PASSED' || f.status === 'SUCCESS').length;
    const successRate = Math.round((passedFindings / totalFindings) * 100);
    
    const report = {
      timestamp: new Date().toISOString(),
      successRate,
      totalIssues: this.issues.length,
      findings: this.findings,
      issues: this.issues,
      overallStatus: this.issues.length === 0 ? 'RESOLVED' : 'ISSUES_FOUND'
    };
    
    console.log(`\n🎯 LAYOUT INVESTIGATION RESULTS:`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`🐛 Issues Found: ${this.issues.length}`);
    console.log(`⚕️ Overall Status: ${report.overallStatus}`);
    
    if (this.issues.length > 0) {
      console.log(`\n❌ ISSUES IDENTIFIED:`);
      this.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log(`\n📋 FINDINGS SUMMARY:`);
    this.findings.forEach(finding => {
      console.log(`   → ${finding.step}: ${finding.status}`);
    });
    
    const filename = `layout_investigation_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📋 Investigation report saved: ${filename}`);
    
    return report;
  }
}

// Execute layout investigation
async function main() {
  const investigator = new LayoutInvestigationValidator();
  await investigator.runInvestigation();
  process.exit(0);
}

main().catch(console.error);