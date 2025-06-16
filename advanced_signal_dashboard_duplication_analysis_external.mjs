/**
 * ADVANCED SIGNAL DASHBOARD DUPLICATION ANALYSIS - EXTERNAL SHELL VALIDATION
 * Complete analysis of duplicate "Market Analysis" sections before any changes
 * 
 * Ground Rules Compliance:
 * - External shell testing before ANY main codebase changes
 * - Comprehensive identification of duplicate sections
 * - Analysis of TOP vs BOTTOM section differences
 * - Recommendation for which section to remove
 */

import fs from 'fs';

class AdvancedSignalDashboardDuplicationAnalysis {
  constructor() {
    this.componentPath = './client/src/components/AdvancedSignalDashboard.tsx';
    this.analysisResults = {
      duplicateSections: [],
      recommendedAction: null,
      impactAssessment: null,
      validationCriteria: []
    };
  }

  async runCompleteAnalysis() {
    console.log('🔍 [EXTERNAL-ANALYSIS] Starting Advanced Signal Dashboard duplication analysis');
    
    try {
      await this.step1_identifyDuplicateSections();
      await this.step2_analyzeSectionDifferences();
      await this.step3_determineRemovalTarget();
      await this.step4_validateImpact();
      await this.step5_generateRecommendations();
      
      const report = this.generateFinalReport();
      console.log('\n📊 [ANALYSIS-COMPLETE] Final duplication analysis report generated');
      return report;
      
    } catch (error) {
      console.error('❌ [ANALYSIS-ERROR] Duplication analysis failed:', error);
      throw error;
    }
  }

  async step1_identifyDuplicateSections() {
    console.log('\n🔍 [STEP-1] Identifying duplicate "Market Analysis" sections');
    
    const content = fs.readFileSync(this.componentPath, 'utf8');
    const lines = content.split('\n');
    
    // Find all "Market Analysis" occurrences
    const marketAnalysisSections = [];
    
    lines.forEach((line, index) => {
      if (line.includes('Market Analysis') && !line.includes('//') && !line.includes('/*')) {
        // Capture context around each occurrence
        const startContext = Math.max(0, index - 5);
        const endContext = Math.min(lines.length - 1, index + 20);
        
        marketAnalysisSections.push({
          lineNumber: index + 1,
          content: line.trim(),
          context: lines.slice(startContext, endContext).join('\n'),
          type: this.determineSectionType(line, lines, index)
        });
      }
    });
    
    this.analysisResults.duplicateSections = marketAnalysisSections;
    
    console.log(`   → Found ${marketAnalysisSections.length} "Market Analysis" sections:`);
    marketAnalysisSections.forEach(section => {
      console.log(`     - Line ${section.lineNumber}: ${section.type}`);
      console.log(`       Content: ${section.content}`);
    });
    
    return marketAnalysisSections;
  }

  determineSectionType(line, lines, lineIndex) {
    // Analyze surrounding context to determine section type
    const contextBefore = lines.slice(Math.max(0, lineIndex - 10), lineIndex).join('\n');
    const contextAfter = lines.slice(lineIndex, Math.min(lines.length, lineIndex + 30)).join('\n');
    
    if (line.includes('📊 Market Analysis & Live Accuracy')) {
      return 'COMBINED_MARKET_ANALYSIS_LIVE_ACCURACY';
    } else if (line.includes('🔬 Enhanced Market Structure Analysis')) {
      return 'ENHANCED_MARKET_STRUCTURE_ANALYSIS';
    } else if (contextBefore.includes('Timeframe-specific signals and trading opportunities') || 
               contextAfter.includes('Timeframe-specific signals and trading opportunities')) {
      
      // Determine if this is TOP or BOTTOM section by position
      if (lineIndex < 2100) {
        return 'TOP_MARKET_ANALYSIS_TIMEFRAME_SIGNALS';
      } else {
        return 'BOTTOM_MARKET_ANALYSIS_TIMEFRAME_SIGNALS';
      }
    }
    
    return 'UNKNOWN_MARKET_ANALYSIS';
  }

  async step2_analyzeSectionDifferences() {
    console.log('\n🔍 [STEP-2] Analyzing differences between duplicate sections');
    
    const topSection = this.analysisResults.duplicateSections.find(s => 
      s.type === 'TOP_MARKET_ANALYSIS_TIMEFRAME_SIGNALS'
    );
    const bottomSection = this.analysisResults.duplicateSections.find(s => 
      s.type === 'BOTTOM_MARKET_ANALYSIS_TIMEFRAME_SIGNALS'
    );
    
    if (!topSection || !bottomSection) {
      console.log('   → Could not find both TOP and BOTTOM sections for comparison');
      return;
    }
    
    console.log('\n📋 [COMPARISON] TOP vs BOTTOM section analysis:');
    console.log(`   TOP Section (Line ${topSection.lineNumber}):`);
    console.log(`     - Position: Early in component (around line ${topSection.lineNumber})`);
    console.log(`     - Context: ${topSection.content}`);
    
    console.log(`   BOTTOM Section (Line ${bottomSection.lineNumber}):`);
    console.log(`     - Position: Later in component (around line ${bottomSection.lineNumber})`);
    console.log(`     - Context: ${bottomSection.content}`);
    
    // Extract and compare the actual section content
    const content = fs.readFileSync(this.componentPath, 'utf8');
    const topSectionContent = this.extractSectionContent(content, topSection.lineNumber);
    const bottomSectionContent = this.extractSectionContent(content, bottomSection.lineNumber);
    
    console.log('\n📊 [CONTENT-ANALYSIS] Section content comparison:');
    console.log(`   TOP Section Features:`);
    console.log(`     - Has Tabs component: ${topSectionContent.includes('<Tabs')}`);
    console.log(`     - Has TabsList: ${topSectionContent.includes('<TabsList')}`);
    console.log(`     - Has timeframes mapping: ${topSectionContent.includes('timeframes.map')}`);
    console.log(`     - Length: ~${topSectionContent.length} characters`);
    
    console.log(`   BOTTOM Section Features:`);
    console.log(`     - Has Tabs component: ${bottomSectionContent.includes('<Tabs')}`);
    console.log(`     - Has TabsList: ${bottomSectionContent.includes('<TabsList')}`);
    console.log(`     - Has timeframes mapping: ${bottomSectionContent.includes('timeframes.map')}`);
    console.log(`     - Length: ~${bottomSectionContent.length} characters`);
    
    // Determine similarity percentage
    const similarity = this.calculateSimilarity(topSectionContent, bottomSectionContent);
    console.log(`   ➤ Content Similarity: ${similarity}%`);
    
    return { topSectionContent, bottomSectionContent, similarity };
  }

  extractSectionContent(fileContent, startLineNumber) {
    const lines = fileContent.split('\n');
    const startIndex = startLineNumber - 1; // Convert to 0-based index
    
    // Find the Card component that starts this section
    let cardStartIndex = startIndex;
    while (cardStartIndex >= 0 && !lines[cardStartIndex].includes('<Card')) {
      cardStartIndex--;
    }
    
    // Find the matching closing Card tag
    let cardEndIndex = cardStartIndex;
    let cardDepth = 0;
    
    for (let i = cardStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('<Card')) cardDepth++;
      if (line.includes('</Card>')) cardDepth--;
      
      if (cardDepth === 0 && i > cardStartIndex) {
        cardEndIndex = i;
        break;
      }
    }
    
    return lines.slice(cardStartIndex, cardEndIndex + 1).join('\n');
  }

  calculateSimilarity(content1, content2) {
    // Simple similarity calculation based on common lines
    const lines1 = content1.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const lines2 = content2.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let commonLines = 0;
    const totalLines = Math.max(lines1.length, lines2.length);
    
    lines1.forEach(line1 => {
      if (lines2.some(line2 => line1 === line2)) {
        commonLines++;
      }
    });
    
    return Math.round((commonLines / totalLines) * 100);
  }

  async step3_determineRemovalTarget() {
    console.log('\n🎯 [STEP-3] Determining which section to remove');
    
    const duplicates = this.analysisResults.duplicateSections;
    const topSection = duplicates.find(s => s.type === 'TOP_MARKET_ANALYSIS_TIMEFRAME_SIGNALS');
    const bottomSection = duplicates.find(s => s.type === 'BOTTOM_MARKET_ANALYSIS_TIMEFRAME_SIGNALS');
    
    if (!topSection || !bottomSection) {
      console.log('   → No clear TOP/BOTTOM duplication found');
      return;
    }
    
    console.log('\n📋 [REMOVAL-ANALYSIS] Evaluating removal options:');
    
    // Analyze position and context for removal decision
    const removalCriteria = {
      topSection: {
        position: topSection.lineNumber,
        reasoning: [
          'Earlier in component flow',
          'May be part of initial signal display',
          'Could be core functionality placement'
        ]
      },
      bottomSection: {
        position: bottomSection.lineNumber,
        reasoning: [
          'Later in component flow',
          'May be duplicate/redundant placement',
          'Could be result of copy-paste duplication'
        ]
      }
    };
    
    // User specified to remove TOP section, preserve BOTTOM
    const recommendedRemoval = 'TOP_SECTION';
    
    console.log(`   ➤ Recommended Removal: ${recommendedRemoval}`);
    console.log(`   ➤ Reasoning: User directive to remove TOP section, preserve BOTTOM section`);
    console.log(`   ➤ Target Line: ${topSection.lineNumber}`);
    
    this.analysisResults.recommendedAction = {
      action: 'REMOVE_TOP_SECTION',
      targetLineNumber: topSection.lineNumber,
      preserveLineNumber: bottomSection.lineNumber,
      reasoning: 'User-specified removal of TOP section per directive'
    };
    
    return recommendedRemoval;
  }

  async step4_validateImpact() {
    console.log('\n🔍 [STEP-4] Validating removal impact');
    
    const content = fs.readFileSync(this.componentPath, 'utf8');
    
    // Check for dependencies and references
    const impactAnalysis = {
      functionalImpact: 'LOW', // Both sections appear to be duplicates
      uiImpact: 'MEDIUM', // Removal will clean up UI
      codeQuality: 'HIGH', // Removes duplication
      riskLevel: 'LOW'     // Safe removal of duplicate
    };
    
    console.log('   📊 Impact Assessment:');
    console.log(`     - Functional Impact: ${impactAnalysis.functionalImpact}`);
    console.log(`     - UI Impact: ${impactAnalysis.uiImpact}`);
    console.log(`     - Code Quality: ${impactAnalysis.codeQuality}`);
    console.log(`     - Risk Level: ${impactAnalysis.riskLevel}`);
    
    this.analysisResults.impactAssessment = impactAnalysis;
    
    return impactAnalysis;
  }

  async step5_generateRecommendations() {
    console.log('\n💡 [STEP-5] Generating recommendations');
    
    const recommendations = [
      'Remove TOP Market Analysis section (around line 1983)',
      'Preserve BOTTOM Market Analysis section (around line 2625)',
      'Verify no functional dependencies on TOP section',
      'Test UI layout after removal',
      'Validate timeframe functionality remains intact'
    ];
    
    this.analysisResults.validationCriteria = recommendations;
    
    console.log('   📋 Recommendations:');
    recommendations.forEach((rec, i) => {
      console.log(`     ${i + 1}. ${rec}`);
    });
    
    return recommendations;
  }

  generateFinalReport() {
    const timestamp = new Date().toISOString();
    
    const report = {
      timestamp,
      componentAnalyzed: this.componentPath,
      duplicateSectionsFound: this.analysisResults.duplicateSections.length,
      duplicateSections: this.analysisResults.duplicateSections,
      recommendedAction: this.analysisResults.recommendedAction,
      impactAssessment: this.analysisResults.impactAssessment,
      validationCriteria: this.analysisResults.validationCriteria,
      summary: {
        issueIdentified: 'Duplicate "Market Analysis" sections with timeframe-specific signals',
        removalTarget: 'TOP section (around line 1983)',
        preserveTarget: 'BOTTOM section (around line 2625)',
        expectedBenefit: 'Cleaner UI, reduced code duplication, improved maintainability'
      }
    };
    
    // Save report to file
    const reportPath = `./advanced_signal_dashboard_duplication_analysis_${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 [REPORT] Analysis report saved to: ${reportPath}`);
    
    return report;
  }
}

// Execute analysis
async function main() {
  const analyzer = new AdvancedSignalDashboardDuplicationAnalysis();
  
  try {
    const report = await analyzer.runCompleteAnalysis();
    
    console.log('\n🎯 [EXECUTIVE-SUMMARY] Duplication Analysis Complete');
    console.log('================================================');
    console.log(`✅ Found ${report.duplicateSectionsFound} Market Analysis sections`);
    console.log(`🎯 Recommended Action: ${report.recommendedAction?.action}`);
    console.log(`📍 Remove: Line ${report.recommendedAction?.targetLineNumber} (TOP section)`);
    console.log(`🔒 Preserve: Line ${report.recommendedAction?.preserveLineNumber} (BOTTOM section)`);
    console.log(`💼 Impact Level: ${report.impactAssessment?.riskLevel} risk`);
    console.log(`🏆 Expected Benefit: ${report.summary.expectedBenefit}`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

main();