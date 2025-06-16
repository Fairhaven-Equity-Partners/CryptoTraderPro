/**
 * MARKET ANALYSIS REPOSITIONING ABOVE LIVE ACCURACY - EXTERNAL SHELL TESTING
 * Moving Market Analysis section above Live Market Overview and accuracy components
 * Following 11 ground rules for authentic validation
 */

import fs from 'fs';
import fetch from 'node-fetch';

class MarketAnalysisRepositioningAboveLive {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.issues = [];
    this.findings = [];
    this.changes = [];
  }

  async runRepositioning() {
    console.log('\n🔍 MARKET ANALYSIS REPOSITIONING ABOVE LIVE ACCURACY');
    console.log('=' .repeat(80));
    console.log('📋 External Shell Testing - Moving Market Analysis above Live components');
    console.log('⚡ Target: Position Market Analysis above LiveMarketOverview and accuracy');
    
    // Step 1: Analyze current layout structure
    await this.analyzeCurrentLayoutStructure();
    
    // Step 2: Identify Market Analysis components
    await this.identifyMarketAnalysisComponents();
    
    // Step 3: Implement repositioning
    await this.implementRepositioning();
    
    // Step 4: Validate new layout
    await this.validateNewLayout();
    
    // Step 5: Test system functionality
    await this.testSystemFunctionality();
    
    // Generate report
    this.generateRepositioningReport();
  }

  async analyzeCurrentLayoutStructure() {
    console.log('\n=== STEP 1: CURRENT LAYOUT ANALYSIS ===');
    console.log('🔍 [STEP-1] Analyzing current layout structure and component order');
    
    try {
      const analysisPath = './client/src/pages/Analysis.tsx';
      const analysisContent = fs.readFileSync(analysisPath, 'utf8');
      
      // Extract current component order
      const lines = analysisContent.split('\n');
      const componentOrder = [];
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('<LiveMarketOverview')) {
          componentOrder.push({ component: 'LiveMarketOverview', line: index + 1, section: 'TOP_PRIORITY' });
        }
        if (trimmedLine.includes('<TechnicalAnalysisSummary')) {
          componentOrder.push({ component: 'TechnicalAnalysisSummary', line: index + 1, section: 'SECONDARY_PRIORITY' });
        }
        if (trimmedLine.includes('<RiskAssessmentDashboard')) {
          componentOrder.push({ component: 'RiskAssessmentDashboard', line: index + 1, section: 'SECONDARY_PRIORITY' });
        }
        if (trimmedLine.includes('<AdvancedSignalDashboard')) {
          componentOrder.push({ component: 'AdvancedSignalDashboard', line: index + 1, section: 'REPOSITIONED' });
        }
      });
      
      console.log('   → Current component order:');
      componentOrder.forEach((comp, index) => {
        console.log(`     ${index + 1}. ${comp.component} (Line ${comp.line}) - ${comp.section}`);
      });
      
      // Check for Market Analysis sections
      const marketAnalysisSections = this.findMarketAnalysisSections(analysisContent);
      console.log(`   → Market Analysis sections found: ${marketAnalysisSections.length}`);
      marketAnalysisSections.forEach(section => {
        console.log(`     - ${section.type} at line ${section.line}`);
      });
      
      this.findings.push({
        step: 'Current Layout Analysis',
        status: 'COMPLETED',
        details: { componentOrder, marketAnalysisSections }
      });
      
    } catch (error) {
      console.log(`   ❌ Error analyzing layout: ${error.message}`);
      this.issues.push(`Layout analysis failed: ${error.message}`);
    }
  }

  findMarketAnalysisSections(content) {
    const sections = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim().toLowerCase();
      if (trimmedLine.includes('market analysis') || 
          trimmedLine.includes('marketanalysis') ||
          trimmedLine.includes('market-analysis')) {
        sections.push({
          type: 'Market Analysis Comment/Section',
          line: index + 1,
          content: line.trim()
        });
      }
    });
    
    return sections;
  }

  async identifyMarketAnalysisComponents() {
    console.log('\n=== STEP 2: MARKET ANALYSIS COMPONENT IDENTIFICATION ===');
    console.log('🔍 [STEP-2] Identifying which components contain Market Analysis functionality');
    
    try {
      // Check AdvancedSignalDashboard for Market Analysis content
      const dashboardPath = './client/src/components/AdvancedSignalDashboard.tsx';
      
      if (fs.existsSync(dashboardPath)) {
        const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
        
        // Look for Market Analysis indicators
        const marketAnalysisIndicators = [
          'market analysis',
          'Market Analysis',
          'confluence',
          'signal quality',
          'market intelligence',
          'pattern analysis'
        ];
        
        const foundIndicators = marketAnalysisIndicators.filter(indicator => 
          dashboardContent.toLowerCase().includes(indicator.toLowerCase())
        );
        
        console.log(`   → AdvancedSignalDashboard Market Analysis features: ${foundIndicators.length}`);
        foundIndicators.forEach(indicator => {
          console.log(`     - ${indicator}`);
        });
        
        // Check for specific Market Analysis sections within the component
        const hasMarketAnalysisSection = dashboardContent.includes('Market Analysis') || 
                                        dashboardContent.includes('market-analysis') ||
                                        dashboardContent.includes('confluence-analysis');
        
        console.log(`   → Has dedicated Market Analysis section: ${hasMarketAnalysisSection ? 'YES' : 'NO'}`);
        
        this.findings.push({
          step: 'Market Analysis Component Identification',
          status: 'COMPLETED',
          details: { foundIndicators, hasMarketAnalysisSection }
        });
      } else {
        console.log('   ❌ AdvancedSignalDashboard component not found');
        this.issues.push('AdvancedSignalDashboard component file missing');
      }
      
    } catch (error) {
      console.log(`   ❌ Error identifying components: ${error.message}`);
      this.issues.push(`Component identification failed: ${error.message}`);
    }
  }

  async implementRepositioning() {
    console.log('\n=== STEP 3: IMPLEMENT REPOSITIONING ===');
    console.log('🔧 [STEP-3] Moving Market Analysis (AdvancedSignalDashboard) above LiveMarketOverview');
    
    try {
      const analysisPath = './client/src/pages/Analysis.tsx';
      let analysisContent = fs.readFileSync(analysisPath, 'utf8');
      
      // Target new layout order:
      // 1. AdvancedSignalDashboard (Market Analysis) - MOVED TO TOP
      // 2. LiveMarketOverview - MOVED BELOW
      // 3. TechnicalAnalysisSummary/RiskAssessmentDashboard - UNCHANGED
      
      const newLayoutStructure = `      <main className="flex-1 overflow-y-auto pb-16 px-4">
        {/* MARKET ANALYSIS SECTION - TOP PRIORITY */}
        <div className="mb-6">
          <AdvancedSignalDashboard
            symbol={currentAsset}
            onTimeframeSelect={handleChangeTimeframe}
          />
        </div>
        
        {/* LIVE MARKET OVERVIEW - SECOND PRIORITY */}
        <div className="space-y-4 mb-6">
          <LiveMarketOverview />
        </div>
        
        {/* TECHNICAL ANALYSIS SECTION - THIRD PRIORITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TechnicalAnalysisSummary />
          <RiskAssessmentDashboard />
        </div>
      </main>`;
      
      // Find and replace the main section
      const mainSectionRegex = /<main className="flex-1 overflow-y-auto pb-16 px-4">[\s\S]*?<\/main>/;
      
      if (mainSectionRegex.test(analysisContent)) {
        analysisContent = analysisContent.replace(mainSectionRegex, newLayoutStructure);
        console.log('   ✅ Successfully repositioned Market Analysis above Live components');
        
        // Write the updated content
        fs.writeFileSync(analysisPath, analysisContent);
        
        this.changes.push({
          action: 'REPOSITIONED_MARKET_ANALYSIS',
          file: 'client/src/pages/Analysis.tsx',
          details: 'Moved AdvancedSignalDashboard (Market Analysis) above LiveMarketOverview'
        });
        
        console.log('   → New layout order implemented:');
        console.log('     1. AdvancedSignalDashboard (Market Analysis) - TOP');
        console.log('     2. LiveMarketOverview - SECOND');
        console.log('     3. TechnicalAnalysisSummary/RiskAssessmentDashboard - THIRD');
        
      } else {
        console.log('   ⚠️ Could not find main section pattern, using alternative approach');
        this.issues.push('Main section pattern not found for replacement');
      }
      
    } catch (error) {
      console.log(`   ❌ Error implementing repositioning: ${error.message}`);
      this.issues.push(`Repositioning implementation failed: ${error.message}`);
    }
  }

  async validateNewLayout() {
    console.log('\n=== STEP 4: VALIDATE NEW LAYOUT ===');
    console.log('✅ [STEP-4] Validating new layout structure and component order');
    
    try {
      const analysisPath = './client/src/pages/Analysis.tsx';
      const updatedContent = fs.readFileSync(analysisPath, 'utf8');
      
      // Extract new component order
      const lines = updatedContent.split('\n');
      const newComponentOrder = [];
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('<AdvancedSignalDashboard')) {
          newComponentOrder.push({ component: 'AdvancedSignalDashboard', line: index + 1, priority: 1 });
        }
        if (trimmedLine.includes('<LiveMarketOverview')) {
          newComponentOrder.push({ component: 'LiveMarketOverview', line: index + 1, priority: 2 });
        }
        if (trimmedLine.includes('<TechnicalAnalysisSummary')) {
          newComponentOrder.push({ component: 'TechnicalAnalysisSummary', line: index + 1, priority: 3 });
        }
        if (trimmedLine.includes('<RiskAssessmentDashboard')) {
          newComponentOrder.push({ component: 'RiskAssessmentDashboard', line: index + 1, priority: 3 });
        }
      });
      
      console.log('   → New component order validation:');
      newComponentOrder.forEach(comp => {
        console.log(`     ${comp.component}: Line ${comp.line} (Priority ${comp.priority})`);
      });
      
      // Validate correct order
      const advancedSignalLine = newComponentOrder.find(c => c.component === 'AdvancedSignalDashboard')?.line;
      const liveMarketLine = newComponentOrder.find(c => c.component === 'LiveMarketOverview')?.line;
      
      const correctOrder = advancedSignalLine && liveMarketLine && advancedSignalLine < liveMarketLine;
      
      console.log(`   → Market Analysis above Live Market: ${correctOrder ? 'YES' : 'NO'}`);
      
      if (correctOrder) {
        console.log('   ✅ Layout repositioning validated successfully');
      } else {
        console.log('   ❌ Layout order validation failed');
        this.issues.push('Component order validation failed');
      }
      
      this.findings.push({
        step: 'New Layout Validation',
        status: correctOrder ? 'PASSED' : 'FAILED',
        details: { newComponentOrder, correctOrder }
      });
      
    } catch (error) {
      console.log(`   ❌ Error validating layout: ${error.message}`);
      this.issues.push(`Layout validation failed: ${error.message}`);
    }
  }

  async testSystemFunctionality() {
    console.log('\n=== STEP 5: SYSTEM FUNCTIONALITY TEST ===');
    console.log('🧪 [STEP-5] Testing system functionality after repositioning');
    
    try {
      // Test backend health
      const healthResponse = await fetch(`${this.baseUrl}/api/health`, { timeout: 5000 });
      console.log(`   → Backend health: Status ${healthResponse.status}`);
      
      // Test signals endpoint
      const signalsResponse = await fetch(`${this.baseUrl}/api/signals/BTC/USDT`, { timeout: 5000 });
      console.log(`   → Signals API: Status ${signalsResponse.status}`);
      
      if (signalsResponse.status === 200) {
        const signalsData = await signalsResponse.json();
        console.log(`   → Signals data: ${Array.isArray(signalsData) ? signalsData.length : 0} signals`);
      }
      
      // Test technical analysis endpoint
      const techResponse = await fetch(`${this.baseUrl}/api/technical-analysis/BTC%2FUSDT`, { timeout: 5000 });
      console.log(`   → Technical Analysis API: Status ${techResponse.status}`);
      
      const allEndpointsWorking = healthResponse.status === 200 && 
                                signalsResponse.status === 200 && 
                                techResponse.status === 200;
      
      console.log(`   → System functionality: ${allEndpointsWorking ? 'WORKING' : 'ISSUES_DETECTED'}`);
      
      this.findings.push({
        step: 'System Functionality Test',
        status: allEndpointsWorking ? 'PASSED' : 'ISSUES_DETECTED',
        details: {
          healthStatus: healthResponse.status,
          signalsStatus: signalsResponse.status,
          techAnalysisStatus: techResponse.status
        }
      });
      
    } catch (error) {
      console.log(`   ❌ Error testing functionality: ${error.message}`);
      this.issues.push(`System functionality test failed: ${error.message}`);
    }
  }

  generateRepositioningReport() {
    console.log('\n📊 [REPORT] Market Analysis Repositioning Above Live Accuracy Complete');
    console.log('=' .repeat(80));
    
    const successRate = Math.round(((this.findings.length - this.issues.length) / this.findings.length) * 100);
    
    console.log(`🎯 REPOSITIONING RESULTS:`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`🐛 Issues Found: ${this.issues.length}`);
    console.log(`⚕️ Repositioning Status: ${this.issues.length === 0 ? 'SUCCESSFUL' : 'COMPLETED_WITH_ISSUES'}`);
    
    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES IDENTIFIED:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    if (this.changes.length > 0) {
      console.log('\n✅ CHANGES IMPLEMENTED:');
      this.changes.forEach((change, index) => {
        console.log(`   ${index + 1}. ${change.action}: ${change.details}`);
      });
    }
    
    console.log('\n📋 IMPLEMENTATION SUMMARY:');
    this.findings.forEach(finding => {
      console.log(`   → ${finding.step}: ${finding.status}`);
    });
    
    // Save repositioning results
    const timestamp = Date.now();
    const reportData = {
      timestamp,
      successRate,
      issuesFound: this.issues.length,
      issues: this.issues,
      changes: this.changes,
      findings: this.findings
    };
    
    fs.writeFileSync(`market_analysis_repositioning_above_live_${timestamp}.json`, 
                     JSON.stringify(reportData, null, 2));
    
    console.log(`\n📋 Repositioning report saved: market_analysis_repositioning_above_live_${timestamp}.json`);
  }
}

// Execute repositioning
async function main() {
  const repositioning = new MarketAnalysisRepositioningAboveLive();
  await repositioning.runRepositioning();
}

main().catch(console.error);