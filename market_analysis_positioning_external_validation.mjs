#!/usr/bin/env node

/**
 * MARKET ANALYSIS POSITIONING - EXTERNAL SHELL VALIDATION
 * Implementing market analysis box positioning between Technical Analysis and Advanced Signal Dashboard
 * 
 * GROUND RULES COMPLIANCE:
 * - External shell testing for all validations
 * - NO synthetic data, only authentic market calculations
 * - Real-time validation of all implementations
 * - Zero tolerance for system crashes
 * - Complete testing before and after implementation
 */

import fs from 'fs';
import fetch from 'node-fetch';

class MarketAnalysisPositioning {
  constructor() {
    this.baseUrl = 'http://localhost:5173';
    this.issues = [];
    this.findings = [];
    
    console.log('🔍 MARKET ANALYSIS POSITIONING - EXTERNAL SHELL VALIDATION');
    console.log('📋 Moving market analysis box above Advanced Signal Dashboard');
    console.log('⚡ Complete layout restructuring with validation');
  }

  async runCompletePositioning() {
    try {
      console.log('\n=== STEP 1: ANALYZE CURRENT LAYOUT STRUCTURE ===');
      await this.analyzeCurrentLayout();
      
      console.log('\n=== STEP 2: IDENTIFY MARKET ANALYSIS COMPONENTS ===');
      await this.identifyMarketAnalysisComponents();
      
      console.log('\n=== STEP 3: PLAN POSITIONING IMPLEMENTATION ===');
      await this.planPositioningImplementation();
      
      console.log('\n=== STEP 4: IMPLEMENT MARKET ANALYSIS POSITIONING ===');
      await this.implementMarketAnalysisPositioning();
      
      console.log('\n=== STEP 5: VALIDATE POST-IMPLEMENTATION ===');
      await this.validatePostImplementation();
      
      console.log('\n=== STEP 6: TEST SYSTEM FUNCTIONALITY ===');
      await this.testSystemFunctionality();
      
      return await this.generateReport();
      
    } catch (error) {
      console.error('❌ Market analysis positioning failed:', error.message);
      this.issues.push(`Positioning Error: ${error.message}`);
    }
  }

  async analyzeCurrentLayout() {
    console.log('📋 [STEP-1] Analyzing current layout structure');
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    const content = fs.readFileSync(analysisPath, 'utf8');
    
    // Find current component order
    const lines = content.split('\n');
    const componentOrder = [];
    
    lines.forEach((line, index) => {
      if (line.includes('<LiveMarketOverview')) {
        componentOrder.push({ component: 'LiveMarketOverview', line: index + 1 });
      }
      if (line.includes('<TechnicalAnalysisSummary')) {
        componentOrder.push({ component: 'TechnicalAnalysisSummary', line: index + 1 });
      }
      if (line.includes('<RiskAssessmentDashboard')) {
        componentOrder.push({ component: 'RiskAssessmentDashboard', line: index + 1 });
      }
      if (line.includes('<AdvancedSignalDashboard')) {
        componentOrder.push({ component: 'AdvancedSignalDashboard', line: index + 1 });
      }
    });
    
    console.log('   → Current component order:');
    componentOrder.forEach(comp => {
      console.log(`     ${comp.component}: Line ${comp.line}`);
    });
    
    // Check for any market analysis components
    const marketAnalysisComponents = [
      'CriticalSignalAnalysis',
      'MarketAnalysis',
      'MarketOverview',
      'ConfluenceAnalysis'
    ];
    
    let foundMarketComponents = [];
    marketAnalysisComponents.forEach(comp => {
      if (content.includes(`<${comp}`)) {
        foundMarketComponents.push(comp);
      }
    });
    
    console.log(`   → Market analysis components found: ${foundMarketComponents.length}`);
    foundMarketComponents.forEach(comp => console.log(`     - ${comp}`));
    
    this.findings.push({
      step: 'Current Layout Analysis',
      status: 'ANALYZED',
      details: { componentOrder, foundMarketComponents }
    });
  }

  async identifyMarketAnalysisComponents() {
    console.log('🔍 [STEP-2] Identifying available market analysis components');
    
    const componentDir = './client/src/components/';
    const files = fs.readdirSync(componentDir);
    
    const marketAnalysisFiles = files.filter(file => 
      file.includes('Market') || 
      file.includes('Confluence') || 
      file.includes('Signal') ||
      file.includes('Analysis')
    );
    
    console.log('   → Available market analysis components:');
    marketAnalysisFiles.forEach(file => {
      console.log(`     - ${file}`);
    });
    
    // Check if we need to create a dedicated market analysis component
    const hasMarketAnalysisComponent = marketAnalysisFiles.some(file => 
      file === 'MarketAnalysis.tsx' || file === 'MarketAnalysisDisplay.tsx'
    );
    
    if (!hasMarketAnalysisComponent) {
      console.log('   → No dedicated market analysis component found');
      console.log('   → Will need to create or repurpose existing component');
      this.issues.push('No dedicated market analysis component available');
    } else {
      console.log('   → Dedicated market analysis component available');
    }
    
    this.findings.push({
      step: 'Market Analysis Component Identification',
      status: hasMarketAnalysisComponent ? 'COMPONENT_AVAILABLE' : 'COMPONENT_NEEDED',
      details: { marketAnalysisFiles, hasMarketAnalysisComponent }
    });
  }

  async planPositioningImplementation() {
    console.log('📝 [STEP-3] Planning positioning implementation strategy');
    
    // Since CriticalSignalAnalysis was eliminated, we need to either:
    // 1. Create a new MarketAnalysisDisplay component
    // 2. Repurpose an existing component
    // 3. Use LiveMarketOverview in a different position
    
    console.log('   → Implementation options:');
    console.log('     1. Create new MarketAnalysisDisplay component');
    console.log('     2. Duplicate LiveMarketOverview as market analysis');
    console.log('     3. Create market analysis section within existing structure');
    
    // Check what market data is available
    const availableEndpoints = [
      '/api/crypto/all-pairs',
      '/api/signals/BTC/USDT',
      '/api/technical-analysis/BTC/USDT',
      '/api/pattern-analysis/BTC/USDT'
    ];
    
    console.log('   → Available data endpoints for market analysis:');
    availableEndpoints.forEach(endpoint => {
      console.log(`     - ${endpoint}`);
    });
    
    // Recommended approach: Create a focused MarketAnalysisDisplay component
    const implementationPlan = {
      approach: 'Create new MarketAnalysisDisplay component',
      positioning: 'Between TechnicalAnalysisSummary/RiskAssessmentDashboard and AdvancedSignalDashboard',
      dataSource: 'Pattern analysis and confluence data',
      displayContent: 'Key market insights, pattern recognition, confluence analysis'
    };
    
    console.log('   → Selected implementation plan:');
    Object.entries(implementationPlan).forEach(([key, value]) => {
      console.log(`     ${key}: ${value}`);
    });
    
    this.findings.push({
      step: 'Implementation Planning',
      status: 'PLAN_CREATED',
      details: implementationPlan
    });
  }

  async implementMarketAnalysisPositioning() {
    console.log('🔧 [STEP-4] Implementing market analysis positioning');
    
    // Create MarketAnalysisDisplay component
    const marketAnalysisComponent = `import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';

const MarketAnalysisDisplay: React.FC = () => {
  const { data: patternData, isLoading: patternLoading } = useQuery({
    queryKey: ['/api/pattern-analysis/BTC/USDT'],
    refetchInterval: 30000,
  });

  const { data: confluenceData, isLoading: confluenceLoading } = useQuery({
    queryKey: ['/api/confluence-analysis/BTC/USDT'],
    refetchInterval: 30000,
  });

  const isLoading = patternLoading || confluenceLoading;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const patterns = patternData?.patternAnalysis?.patterns || [];
  const primaryPattern = patterns[0];
  const confluenceScore = confluenceData?.confluenceScore || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Market Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confluence Analysis */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Confluence Score</span>
          <Badge variant={confluenceScore > 70 ? "default" : confluenceScore > 40 ? "secondary" : "destructive"}>
            {confluenceScore}%
          </Badge>
        </div>

        {/* Primary Pattern */}
        {primaryPattern && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Primary Pattern</span>
              <Badge variant="outline">
                {primaryPattern.type?.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {primaryPattern.signal === 'bullish' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : primaryPattern.signal === 'bearish' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm text-muted-foreground">
                {primaryPattern.description}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Confidence</span>
              <span className="text-xs font-medium">
                {Math.round((primaryPattern.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Market Insights */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Patterns Found</span>
              <div className="font-medium">{patterns.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Confidence</span>
              <div className="font-medium">
                {patterns.length > 0 
                  ? Math.round(patterns.reduce((acc, p) => acc + (p.confidence || 0), 0) / patterns.length * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketAnalysisDisplay;`;

    // Write the component file
    const componentPath = './client/src/components/MarketAnalysisDisplay.tsx';
    fs.writeFileSync(componentPath, marketAnalysisComponent);
    console.log('   → Created MarketAnalysisDisplay component');

    // Update Analysis.tsx to include the component
    const analysisPath = './client/src/pages/Analysis.tsx';
    let content = fs.readFileSync(analysisPath, 'utf8');

    // Add import
    if (!content.includes("import MarketAnalysisDisplay from '../components/MarketAnalysisDisplay';")) {
      const importRegex = /(import.*from.*['"]\.\.\/components\/.*['"];)/g;
      const matches = content.match(importRegex);
      if (matches && matches.length > 0) {
        const lastImport = matches[matches.length - 1];
        const newImport = "\nimport MarketAnalysisDisplay from '../components/MarketAnalysisDisplay';";
        content = content.replace(lastImport, lastImport + newImport);
        console.log('   → Added MarketAnalysisDisplay import');
      }
    }

    // Find the position after TechnicalAnalysisSummary/RiskAssessmentDashboard section
    // and before AdvancedSignalDashboard
    const targetPosition = content.indexOf('        {/* TERTIARY PRIORITY SECTION - Detailed Analysis */}');
    
    if (targetPosition !== -1) {
      const marketAnalysisSection = `        {/* MARKET ANALYSIS SECTION */}
        <div className="mb-6">
          <MarketAnalysisDisplay />
        </div>
        `;
      
      const beforeSection = content.substring(0, targetPosition);
      const afterSection = content.substring(targetPosition);
      
      content = beforeSection + marketAnalysisSection + afterSection;
      console.log('   → Added MarketAnalysisDisplay to correct position');
    } else {
      this.issues.push('Could not find correct insertion position');
    }

    // Write updated Analysis.tsx
    fs.writeFileSync(analysisPath, content);
    console.log('   → Updated Analysis.tsx with market analysis positioning');

    this.findings.push({
      step: 'Market Analysis Implementation',
      status: 'IMPLEMENTED',
      details: { componentCreated: true, positioningComplete: true }
    });
  }

  async validatePostImplementation() {
    console.log('✅ [STEP-5] Validating post-implementation structure');
    
    const analysisPath = './client/src/pages/Analysis.tsx';
    const content = fs.readFileSync(analysisPath, 'utf8');
    
    // Check component order
    const lines = content.split('\n');
    const componentPositions = {};
    
    lines.forEach((line, index) => {
      if (line.includes('<LiveMarketOverview')) componentPositions.LiveMarketOverview = index + 1;
      if (line.includes('<TechnicalAnalysisSummary')) componentPositions.TechnicalAnalysisSummary = index + 1;
      if (line.includes('<RiskAssessmentDashboard')) componentPositions.RiskAssessmentDashboard = index + 1;
      if (line.includes('<MarketAnalysisDisplay')) componentPositions.MarketAnalysisDisplay = index + 1;
      if (line.includes('<AdvancedSignalDashboard')) componentPositions.AdvancedSignalDashboard = index + 1;
    });
    
    console.log('   → Post-implementation component order:');
    Object.entries(componentPositions).forEach(([comp, line]) => {
      console.log(`     ${comp}: Line ${line}`);
    });
    
    // Verify correct positioning
    const correctOrder = 
      componentPositions.LiveMarketOverview < componentPositions.TechnicalAnalysisSummary &&
      componentPositions.TechnicalAnalysisSummary < componentPositions.MarketAnalysisDisplay &&
      componentPositions.MarketAnalysisDisplay < componentPositions.AdvancedSignalDashboard;
    
    console.log(`   → Component order correct: ${correctOrder ? 'YES' : 'NO'}`);
    
    // Check import
    const hasImport = content.includes("import MarketAnalysisDisplay from '../components/MarketAnalysisDisplay';");
    console.log(`   → MarketAnalysisDisplay import present: ${hasImport ? 'YES' : 'NO'}`);
    
    // Check component file exists
    const componentExists = fs.existsSync('./client/src/components/MarketAnalysisDisplay.tsx');
    console.log(`   → MarketAnalysisDisplay component file exists: ${componentExists ? 'YES' : 'NO'}`);
    
    if (!correctOrder) this.issues.push('Component order is incorrect');
    if (!hasImport) this.issues.push('MarketAnalysisDisplay import missing');
    if (!componentExists) this.issues.push('MarketAnalysisDisplay component file missing');
    
    this.findings.push({
      step: 'Post-Implementation Validation',
      status: correctOrder && hasImport && componentExists ? 'VALIDATED' : 'ISSUES_FOUND',
      details: { componentPositions, correctOrder, hasImport, componentExists }
    });
  }

  async testSystemFunctionality() {
    console.log('🧪 [STEP-6] Testing system functionality');
    
    try {
      // Test if the page loads
      const response = await fetch(`${this.baseUrl}/`, { timeout: 5000 });
      const pageLoads = response.ok;
      
      console.log(`   → Analysis page loads: ${pageLoads ? 'YES' : 'NO'}`);
      
      if (pageLoads) {
        // Test the required API endpoints
        const endpoints = [
          '/api/pattern-analysis/BTC/USDT',
          '/api/confluence-analysis/BTC/USDT'
        ];
        
        for (const endpoint of endpoints) {
          try {
            const apiResponse = await fetch(`${this.baseUrl}${endpoint}`, { timeout: 3000 });
            console.log(`   → ${endpoint}: ${apiResponse.ok ? 'WORKING' : 'ERROR'}`);
            
            if (!apiResponse.ok) {
              this.issues.push(`API endpoint ${endpoint} not working`);
            }
          } catch (error) {
            console.log(`   → ${endpoint}: CONNECTION_ERROR`);
            this.issues.push(`API endpoint ${endpoint} connection error`);
          }
        }
      } else {
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
    console.log('\n📊 [REPORT] Market analysis positioning complete');
    
    const totalFindings = this.findings.length;
    const successfulFindings = this.findings.filter(f => 
      f.status === 'ANALYZED' || f.status === 'IMPLEMENTED' || f.status === 'VALIDATED' || f.status === 'FUNCTIONAL'
    ).length;
    const successRate = Math.round((successfulFindings / totalFindings) * 100);
    
    const report = {
      timestamp: new Date().toISOString(),
      successRate,
      totalIssues: this.issues.length,
      findings: this.findings,
      issues: this.issues,
      positioningStatus: this.issues.length === 0 ? 'COMPLETED_SUCCESSFULLY' : 'COMPLETED_WITH_ISSUES'
    };
    
    console.log(`\n🎯 MARKET ANALYSIS POSITIONING RESULTS:`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`🐛 Issues Found: ${this.issues.length}`);
    console.log(`⚕️ Positioning Status: ${report.positioningStatus}`);
    
    if (this.issues.length > 0) {
      console.log(`\n❌ ISSUES IDENTIFIED:`);
      this.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log(`\n📋 IMPLEMENTATION SUMMARY:`);
    this.findings.forEach(finding => {
      console.log(`   → ${finding.step}: ${finding.status}`);
    });
    
    const filename = `market_analysis_positioning_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📋 Positioning report saved: ${filename}`);
    
    return report;
  }
}

// Execute market analysis positioning
async function main() {
  const positioner = new MarketAnalysisPositioning();
  await positioner.runCompletePositioning();
  process.exit(0);
}

main().catch(console.error);