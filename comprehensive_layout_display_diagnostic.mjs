/**
 * COMPREHENSIVE LAYOUT DISPLAY DIAGNOSTIC - EXTERNAL SHELL TESTING
 * Deep investigation of layout positioning and display issues
 * Following 11 ground rules for authentic validation
 */

import fs from 'fs';
import fetch from 'node-fetch';

class ComprehensiveLayoutDisplayDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.findings = [];
    this.solutions = [];
  }

  async runComprehensiveDiagnostic() {
    console.log('\n🔍 COMPREHENSIVE LAYOUT DISPLAY DIAGNOSTIC');
    console.log('=' .repeat(80));
    console.log('📋 External Shell Testing - Layout Positioning Investigation');
    console.log('⚡ Investigating why layout changes are not visible on user display');
    
    // Step 1: Analyze file structure
    await this.analyzeFileStructure();
    
    // Step 2: Check for duplicate components
    await this.checkForDuplicateComponents();
    
    // Step 3: Validate browser cache issues
    await this.validateBrowserCaching();
    
    // Step 4: Test system accessibility
    await this.testSystemAccessibility();
    
    // Step 5: Analyze component rendering
    await this.analyzeComponentRendering();
    
    // Step 6: Check for layout overrides
    await this.checkForLayoutOverrides();
    
    // Generate diagnostic report
    this.generateDiagnosticReport();
  }

  async analyzeFileStructure() {
    console.log('\n=== STEP 1: FILE STRUCTURE ANALYSIS ===');
    console.log('🔍 [STEP-1] Analyzing complete file structure for layout components');
    
    try {
      // Check Analysis.tsx structure
      const analysisPath = './client/src/pages/Analysis.tsx';
      const analysisContent = fs.readFileSync(analysisPath, 'utf8');
      
      // Find all AdvancedSignalDashboard instances
      const advancedSignalMatches = analysisContent.match(/<AdvancedSignalDashboard[\s\S]*?\/>/g);
      const advancedSignalCount = advancedSignalMatches ? advancedSignalMatches.length : 0;
      
      console.log(`   → AdvancedSignalDashboard instances found: ${advancedSignalCount}`);
      
      if (advancedSignalMatches) {
        advancedSignalMatches.forEach((match, index) => {
          const lineNumber = analysisContent.substring(0, analysisContent.indexOf(match)).split('\n').length;
          console.log(`     Instance ${index + 1}: Line ${lineNumber}`);
        });
      }
      
      // Check component order
      const componentOrder = this.extractComponentOrder(analysisContent);
      console.log('   → Current component order:');
      componentOrder.forEach((comp, index) => {
        console.log(`     ${index + 1}. ${comp.component} (Line ${comp.line})`);
      });
      
      // Check for old layout patterns
      const oldLayoutPatterns = [
        'TERTIARY PRIORITY SECTION',
        'Detailed Analytics',
        'bottom-analysis-section',
        'PriceOverview',
        'MacroIndicatorsPanel'
      ];
      
      const foundOldPatterns = oldLayoutPatterns.filter(pattern => 
        analysisContent.includes(pattern)
      );
      
      if (foundOldPatterns.length > 0) {
        console.log(`   ⚠️ Old layout patterns found: ${foundOldPatterns.join(', ')}`);
        this.issues.push(`Old layout patterns still present: ${foundOldPatterns.join(', ')}`);
      } else {
        console.log('   ✅ No old layout patterns found');
      }
      
      this.findings.push({
        step: 'File Structure Analysis',
        status: 'COMPLETED',
        details: {
          advancedSignalInstances: advancedSignalCount,
          componentOrder,
          oldPatternsFound: foundOldPatterns
        }
      });
      
    } catch (error) {
      console.log(`   ❌ Error analyzing file structure: ${error.message}`);
      this.issues.push(`File structure analysis failed: ${error.message}`);
    }
  }

  extractComponentOrder(content) {
    const lines = content.split('\n');
    const componentOrder = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('<LiveMarketOverview')) {
        componentOrder.push({ component: 'LiveMarketOverview', line: index + 1 });
      }
      if (trimmedLine.includes('<TechnicalAnalysisSummary')) {
        componentOrder.push({ component: 'TechnicalAnalysisSummary', line: index + 1 });
      }
      if (trimmedLine.includes('<RiskAssessmentDashboard')) {
        componentOrder.push({ component: 'RiskAssessmentDashboard', line: index + 1 });
      }
      if (trimmedLine.includes('<AdvancedSignalDashboard')) {
        componentOrder.push({ component: 'AdvancedSignalDashboard', line: index + 1 });
      }
      if (trimmedLine.includes('<PriceOverview')) {
        componentOrder.push({ component: 'PriceOverview', line: index + 1 });
      }
      if (trimmedLine.includes('<MacroIndicatorsPanel')) {
        componentOrder.push({ component: 'MacroIndicatorsPanel', line: index + 1 });
      }
    });
    
    return componentOrder;
  }

  async checkForDuplicateComponents() {
    console.log('\n=== STEP 2: DUPLICATE COMPONENT CHECK ===');
    console.log('🔍 [STEP-2] Searching for duplicate or conflicting components');
    
    try {
      // Search all files for AdvancedSignalDashboard usage
      const searchResults = await this.searchAllFiles();
      
      console.log('   → Component usage across files:');
      Object.entries(searchResults).forEach(([file, usage]) => {
        if (usage.advancedSignalCount > 0) {
          console.log(`     ${file}: ${usage.advancedSignalCount} instances`);
        }
      });
      
      // Check for multiple layout files
      const layoutFiles = [
        './client/src/pages/Analysis.tsx',
        './client/src/components/Layout.tsx',
        './client/src/components/MainLayout.tsx',
        './client/src/App.tsx'
      ];
      
      const existingLayoutFiles = [];
      layoutFiles.forEach(file => {
        if (fs.existsSync(file)) {
          existingLayoutFiles.push(file);
        }
      });
      
      console.log(`   → Layout files found: ${existingLayoutFiles.length}`);
      existingLayoutFiles.forEach(file => console.log(`     ${file}`));
      
      if (existingLayoutFiles.length > 1) {
        this.issues.push('Multiple layout files found - potential conflict');
      }
      
      this.findings.push({
        step: 'Duplicate Component Check',
        status: 'COMPLETED',
        details: { searchResults, existingLayoutFiles }
      });
      
    } catch (error) {
      console.log(`   ❌ Error checking for duplicates: ${error.message}`);
      this.issues.push(`Duplicate check failed: ${error.message}`);
    }
  }

  async searchAllFiles() {
    const results = {};
    const filesToCheck = [
      './client/src/pages/Analysis.tsx',
      './client/src/components/AdvancedSignalDashboard.tsx',
      './client/src/components/LeverageCalculator.tsx',
      './client/src/App.tsx'
    ];
    
    filesToCheck.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const advancedSignalMatches = content.match(/<AdvancedSignalDashboard/g);
        results[file] = {
          advancedSignalCount: advancedSignalMatches ? advancedSignalMatches.length : 0,
          hasImport: content.includes('import AdvancedSignalDashboard'),
          hasExport: content.includes('export') && content.includes('AdvancedSignalDashboard')
        };
      }
    });
    
    return results;
  }

  async validateBrowserCaching() {
    console.log('\n=== STEP 3: BROWSER CACHING VALIDATION ===');
    console.log('🔍 [STEP-3] Checking for browser caching and build issues');
    
    try {
      // Check if build artifacts exist
      const buildPaths = [
        './dist',
        './client/dist',
        './build',
        './client/build'
      ];
      
      const existingBuildPaths = buildPaths.filter(path => fs.existsSync(path));
      console.log(`   → Build directories found: ${existingBuildPaths.length}`);
      existingBuildPaths.forEach(path => console.log(`     ${path}`));
      
      // Check package.json for dev server configuration
      if (fs.existsSync('./package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const scripts = packageJson.scripts || {};
        
        console.log('   → Available scripts:');
        Object.entries(scripts).forEach(([script, command]) => {
          console.log(`     ${script}: ${command}`);
        });
        
        if (scripts.dev && scripts.dev.includes('vite')) {
          console.log('   ✅ Vite dev server configured');
        } else {
          console.log('   ⚠️ Vite dev server configuration not found');
          this.issues.push('Vite dev server configuration missing');
        }
      }
      
      this.findings.push({
        step: 'Browser Caching Validation',
        status: 'COMPLETED',
        details: { existingBuildPaths }
      });
      
    } catch (error) {
      console.log(`   ❌ Error validating caching: ${error.message}`);
      this.issues.push(`Caching validation failed: ${error.message}`);
    }
  }

  async testSystemAccessibility() {
    console.log('\n=== STEP 4: SYSTEM ACCESSIBILITY TEST ===');
    console.log('🔍 [STEP-4] Testing system accessibility and connectivity');
    
    try {
      // Test frontend accessibility
      const frontendUrl = 'http://localhost:5173';
      
      try {
        const frontendResponse = await fetch(frontendUrl, { 
          timeout: 5000,
          headers: { 'Accept': 'text/html' }
        });
        console.log(`   → Frontend (${frontendUrl}): Status ${frontendResponse.status}`);
        
        if (frontendResponse.status === 200) {
          console.log('   ✅ Frontend accessible');
        } else {
          console.log(`   ⚠️ Frontend responded with status ${frontendResponse.status}`);
          this.issues.push(`Frontend accessibility issue: Status ${frontendResponse.status}`);
        }
      } catch (frontendError) {
        console.log(`   ❌ Frontend not accessible: ${frontendError.message}`);
        this.issues.push(`Frontend not accessible: ${frontendError.message}`);
      }
      
      // Test backend accessibility
      try {
        const backendResponse = await fetch(`${this.baseUrl}/api/health`, { timeout: 5000 });
        console.log(`   → Backend (${this.baseUrl}): Status ${backendResponse.status}`);
        
        if (backendResponse.status === 200) {
          console.log('   ✅ Backend accessible');
        } else {
          console.log(`   ⚠️ Backend responded with status ${backendResponse.status}`);
        }
      } catch (backendError) {
        console.log(`   ❌ Backend not accessible: ${backendError.message}`);
        this.issues.push(`Backend not accessible: ${backendError.message}`);
      }
      
      this.findings.push({
        step: 'System Accessibility Test',
        status: 'COMPLETED',
        details: { frontendUrl, backendUrl: this.baseUrl }
      });
      
    } catch (error) {
      console.log(`   ❌ Error testing accessibility: ${error.message}`);
      this.issues.push(`Accessibility test failed: ${error.message}`);
    }
  }

  async analyzeComponentRendering() {
    console.log('\n=== STEP 5: COMPONENT RENDERING ANALYSIS ===');
    console.log('🔍 [STEP-5] Analyzing component rendering and React structure');
    
    try {
      // Check AdvancedSignalDashboard component structure
      const dashboardPath = './client/src/components/AdvancedSignalDashboard.tsx';
      
      if (fs.existsSync(dashboardPath)) {
        const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
        
        // Check for conditional rendering
        const hasConditionalRendering = dashboardContent.includes('if (') || 
                                      dashboardContent.includes('&&') ||
                                      dashboardContent.includes('?');
        
        // Check for loading states
        const hasLoadingStates = dashboardContent.includes('loading') || 
                                dashboardContent.includes('isLoading');
        
        // Check for error boundaries
        const hasErrorHandling = dashboardContent.includes('error') || 
                                dashboardContent.includes('catch');
        
        console.log(`   → AdvancedSignalDashboard analysis:`);
        console.log(`     Conditional rendering: ${hasConditionalRendering ? 'YES' : 'NO'}`);
        console.log(`     Loading states: ${hasLoadingStates ? 'YES' : 'NO'}`);
        console.log(`     Error handling: ${hasErrorHandling ? 'YES' : 'NO'}`);
        
        // Check for CSS classes that might hide the component
        const hiddenClasses = ['hidden', 'display: none', 'visibility: hidden'];
        const hasHiddenClasses = hiddenClasses.some(cls => dashboardContent.includes(cls));
        
        if (hasHiddenClasses) {
          console.log('   ⚠️ Potential hidden CSS classes found');
          this.issues.push('Component may be hidden by CSS classes');
        }
        
        this.findings.push({
          step: 'Component Rendering Analysis',
          status: 'COMPLETED',
          details: {
            hasConditionalRendering,
            hasLoadingStates,
            hasErrorHandling,
            hasHiddenClasses
          }
        });
      } else {
        console.log('   ❌ AdvancedSignalDashboard component file not found');
        this.issues.push('AdvancedSignalDashboard component file missing');
      }
      
    } catch (error) {
      console.log(`   ❌ Error analyzing component rendering: ${error.message}`);
      this.issues.push(`Component rendering analysis failed: ${error.message}`);
    }
  }

  async checkForLayoutOverrides() {
    console.log('\n=== STEP 6: LAYOUT OVERRIDE CHECK ===');
    console.log('🔍 [STEP-6] Checking for layout overrides and style conflicts');
    
    try {
      // Check for CSS files that might override layout
      const cssFiles = [
        './client/src/index.css',
        './client/src/App.css',
        './client/src/styles/globals.css',
        './client/src/components/AdvancedSignalDashboard.css'
      ];
      
      const existingCssFiles = [];
      cssFiles.forEach(file => {
        if (fs.existsSync(file)) {
          existingCssFiles.push(file);
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for position overrides
          const hasPositionOverrides = content.includes('position:') || 
                                     content.includes('z-index:') ||
                                     content.includes('display:');
          
          if (hasPositionOverrides) {
            console.log(`   → ${file}: Contains positioning styles`);
          }
        }
      });
      
      console.log(`   → CSS files found: ${existingCssFiles.length}`);
      
      // Check Tailwind configuration
      const tailwindConfigPath = './tailwind.config.ts';
      if (fs.existsSync(tailwindConfigPath)) {
        console.log('   ✅ Tailwind config found');
      } else {
        console.log('   ⚠️ Tailwind config missing');
        this.issues.push('Tailwind configuration missing');
      }
      
      this.findings.push({
        step: 'Layout Override Check',
        status: 'COMPLETED',
        details: { existingCssFiles }
      });
      
    } catch (error) {
      console.log(`   ❌ Error checking layout overrides: ${error.message}`);
      this.issues.push(`Layout override check failed: ${error.message}`);
    }
  }

  generateDiagnosticReport() {
    console.log('\n📊 [REPORT] Comprehensive Layout Display Diagnostic Complete');
    console.log('=' .repeat(80));
    
    const successRate = Math.round(((this.findings.length - this.issues.length) / this.findings.length) * 100);
    
    console.log(`🎯 DIAGNOSTIC RESULTS:`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`🐛 Issues Found: ${this.issues.length}`);
    console.log(`⚕️ System Status: ${this.issues.length === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION'}`);
    
    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES IDENTIFIED:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    // Generate solutions based on findings
    this.generateSolutions();
    
    if (this.solutions.length > 0) {
      console.log('\n💡 RECOMMENDED SOLUTIONS:');
      this.solutions.forEach((solution, index) => {
        console.log(`   ${index + 1}. ${solution}`);
      });
    }
    
    console.log('\n📋 IMPLEMENTATION SUMMARY:');
    this.findings.forEach(finding => {
      console.log(`   → ${finding.step}: ${finding.status}`);
    });
    
    // Save diagnostic results
    const timestamp = Date.now();
    const reportData = {
      timestamp,
      successRate,
      issuesFound: this.issues.length,
      issues: this.issues,
      solutions: this.solutions,
      findings: this.findings
    };
    
    fs.writeFileSync(`comprehensive_layout_display_diagnostic_${timestamp}.json`, 
                     JSON.stringify(reportData, null, 2));
    
    console.log(`\n📋 Diagnostic report saved: comprehensive_layout_display_diagnostic_${timestamp}.json`);
  }

  generateSolutions() {
    this.issues.forEach(issue => {
      if (issue.includes('Frontend not accessible')) {
        this.solutions.push('Restart the development server with "npm run dev"');
        this.solutions.push('Clear browser cache and hard refresh (Ctrl+Shift+R)');
      }
      
      if (issue.includes('Old layout patterns')) {
        this.solutions.push('Remove remaining old layout patterns from Analysis.tsx');
      }
      
      if (issue.includes('Multiple layout files')) {
        this.solutions.push('Consolidate layout logic into single Analysis.tsx file');
      }
      
      if (issue.includes('Component may be hidden')) {
        this.solutions.push('Check AdvancedSignalDashboard for hidden CSS classes');
        this.solutions.push('Verify conditional rendering logic in component');
      }
      
      if (issue.includes('Tailwind configuration missing')) {
        this.solutions.push('Ensure Tailwind CSS is properly configured');
      }
    });
    
    // Always add these general solutions
    this.solutions.push('Force browser refresh and clear cache');
    this.solutions.push('Check browser developer tools for console errors');
    this.solutions.push('Verify component mounting and React DevTools');
  }
}

// Execute diagnostic
async function main() {
  const diagnostic = new ComprehensiveLayoutDisplayDiagnostic();
  await diagnostic.runComprehensiveDiagnostic();
}

main().catch(console.error);