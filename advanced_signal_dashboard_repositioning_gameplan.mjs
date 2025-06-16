#!/usr/bin/env node

/**
 * ADVANCED SIGNAL DASHBOARD REPOSITIONING - EXTERNAL SHELL TESTING
 * Move timeframe-specific signals to top, shift market analysis down
 * 
 * GROUND RULES COMPLIANCE:
 * - External shell testing for all validations
 * - Before/after UI display verification
 * - NO synthetic data, only authentic market calculations
 * - Complete component repositioning with validation
 */

import fs from 'fs';
import fetch from 'node-fetch';

class AdvancedSignalDashboardRepositioning {
  constructor() {
    this.baseUrl = 'http://localhost:5173';
    this.backupData = {};
    this.beforeState = {};
    this.afterState = {};
    
    console.log('🎯 ADVANCED SIGNAL DASHBOARD REPOSITIONING');
    console.log('📋 Moving timeframe signals to top, market analysis down');
    console.log('⚡ External shell testing with before/after validation');
  }

  async executeRepositioning() {
    try {
      console.log('\n=== STEP 1: CAPTURE BEFORE STATE ===');
      await this.captureBeforeState();
      
      console.log('\n=== STEP 2: CREATE BACKUP ===');
      await this.createBackup();
      
      console.log('\n=== STEP 3: ANALYZE CURRENT STRUCTURE ===');
      await this.analyzeCurrentStructure();
      
      console.log('\n=== STEP 4: PERFORM REPOSITIONING ===');
      await this.performRepositioning();
      
      console.log('\n=== STEP 5: CAPTURE AFTER STATE ===');
      await this.captureAfterState();
      
      console.log('\n=== STEP 6: VALIDATE REPOSITIONING ===');
      await this.validateRepositioning();
      
      return await this.generateRepositioningReport();
      
    } catch (error) {
      console.error('❌ Repositioning failed:', error.message);
      await this.executeRollback();
    }
  }

  async captureBeforeState() {
    console.log('📸 [STEP-1] Capturing before state');
    
    try {
      // Test application load
      const response = await fetch(`${this.baseUrl}/`, { timeout: 5000 });
      this.beforeState.applicationStatus = response.ok ? 'OPERATIONAL' : 'FAILED';
      console.log(`   → Application status: ${this.beforeState.applicationStatus}`);
      
      // Test component structure
      const componentPath = './client/src/components/AdvancedSignalDashboard.tsx';
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // Find current order of main sections
      const marketAnalysisIndex = componentContent.indexOf('Market Analysis');
      const timeframeSignalsIndex = componentContent.indexOf('Timeframe-specific signals');
      
      this.beforeState.currentOrder = marketAnalysisIndex < timeframeSignalsIndex ? 
        'MARKET_ANALYSIS_FIRST' : 'TIMEFRAME_SIGNALS_FIRST';
      
      console.log(`   → Current component order: ${this.beforeState.currentOrder}`);
      
      // Find the main card sections
      const marketAnalysisCardMatch = componentContent.match(/<Card[^>]*>[\s\S]*?<CardTitle[^>]*>[\s\S]*?Market Analysis[\s\S]*?<\/Card>/);
      const timeframeCardMatch = componentContent.match(/<Card[^>]*>[\s\S]*?<CardTitle[^>]*>[\s\S]*?Timeframe-specific signals[\s\S]*?<\/Card>/);
      
      this.beforeState.marketAnalysisFound = !!marketAnalysisCardMatch;
      this.beforeState.timeframeSignalsFound = !!timeframeCardMatch;
      
      console.log(`   → Market Analysis card found: ${this.beforeState.marketAnalysisFound}`);
      console.log(`   → Timeframe signals card found: ${this.beforeState.timeframeSignalsFound}`);
      
      // Test APIs
      const apiTests = ['/api/signals', '/api/technical-analysis/BTC%2FUSDT'];
      this.beforeState.apiStatus = {};
      
      for (const endpoint of apiTests) {
        try {
          const apiResponse = await fetch(`${this.baseUrl}${endpoint}`, { timeout: 3000 });
          this.beforeState.apiStatus[endpoint] = apiResponse.ok ? 'OK' : 'FAILED';
        } catch (error) {
          this.beforeState.apiStatus[endpoint] = 'ERROR';
        }
      }
      
      console.log(`   → API status: ${JSON.stringify(this.beforeState.apiStatus)}`);
      
    } catch (error) {
      console.log(`   → Before state capture failed: ${error.message}`);
      this.beforeState.captureStatus = 'FAILED';
    }
  }

  async createBackup() {
    console.log('💾 [STEP-2] Creating backup');
    
    const componentPath = './client/src/components/AdvancedSignalDashboard.tsx';
    this.backupData.componentContent = fs.readFileSync(componentPath, 'utf8');
    
    console.log(`   → Component backed up (${this.backupData.componentContent.length} chars)`);
    
    // Write backup to file
    const backupFilename = `AdvancedSignalDashboard_backup_${Date.now()}.tsx`;
    fs.writeFileSync(backupFilename, this.backupData.componentContent);
    console.log(`   → Backup saved to: ${backupFilename}`);
  }

  async analyzeCurrentStructure() {
    console.log('🔍 [STEP-3] Analyzing current structure');
    
    const componentPath = './client/src/components/AdvancedSignalDashboard.tsx';
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Find the main container structure
    const returnMatch = content.match(/return\s*\(\s*<div[^>]*>([\s\S]*?)<\/div>\s*\)/);
    if (!returnMatch) {
      throw new Error('Could not find main return structure');
    }
    
    // Look for the two main Card components
    const cards = [];
    let searchContent = returnMatch[1];
    let cardMatches = searchContent.match(/<Card[^>]*>[\s\S]*?<\/Card>/g);
    
    if (cardMatches) {
      cardMatches.forEach((card, index) => {
        if (card.includes('Market Analysis')) {
          cards.push({ type: 'MARKET_ANALYSIS', index, content: card });
        } else if (card.includes('Timeframe-specific signals')) {
          cards.push({ type: 'TIMEFRAME_SIGNALS', index, content: card });
        }
      });
    }
    
    console.log(`   → Found ${cards.length} main cards`);
    cards.forEach(card => {
      console.log(`     - ${card.type} at position ${card.index}`);
    });
    
    this.beforeState.cardStructure = cards;
  }

  async performRepositioning() {
    console.log('🔄 [STEP-4] Performing repositioning');
    
    const componentPath = './client/src/components/AdvancedSignalDashboard.tsx';
    let content = fs.readFileSync(componentPath, 'utf8');
    
    // Find the two main Card sections that need to be swapped
    // Market Analysis card (should go second)
    const marketAnalysisCardRegex = /(<Card className="border border-gray-700 bg-gradient-to-b from-gray-900\/80 to-gray-950\/90 shadow-lg">\s*<CardHeader className="pb-2">\s*<CardTitle className="text-lg font-bold text-white flex items-center">\s*Market Analysis[\s\S]*?<\/Card>)/;
    
    // Find the timeframe signals card (should go first) - looking for the second Card
    const timeframeSignalsCardRegex = /(<Card className="border border-gray-700 bg-gradient-to-b from-gray-900\/80 to-gray-950\/90 shadow-lg">\s*<CardHeader className="pb-2">\s*<CardTitle className="text-lg font-bold text-white flex items-center">\s*(?!Market Analysis)[\s\S]*?Timeframe-specific signals[\s\S]*?<\/Card>)/;
    
    const marketAnalysisMatch = content.match(marketAnalysisCardRegex);
    const timeframeSignalsMatch = content.match(timeframeSignalsCardRegex);
    
    if (!marketAnalysisMatch || !timeframeSignalsMatch) {
      console.log('   → Could not find both card sections, trying alternative approach');
      
      // Alternative approach: Find all Cards and identify by content
      const allCardMatches = content.match(/<Card className="border border-gray-700 bg-gradient-to-b from-gray-900\/80 to-gray-950\/90 shadow-lg">[\s\S]*?<\/Card>/g);
      
      if (allCardMatches && allCardMatches.length >= 2) {
        let marketCard = null;
        let timeframeCard = null;
        
        allCardMatches.forEach(card => {
          if (card.includes('Market Analysis') && card.includes('Timeframe-specific signals')) {
            timeframeCard = card;
          } else if (card.includes('Market Analysis')) {
            marketCard = card;
          }
        });
        
        if (marketCard && timeframeCard) {
          // Swap the cards
          content = content.replace(marketCard, '___TIMEFRAME_PLACEHOLDER___');
          content = content.replace(timeframeCard, marketCard);
          content = content.replace('___TIMEFRAME_PLACEHOLDER___', timeframeCard);
          
          console.log('   → Cards repositioned using alternative method');
        } else {
          throw new Error('Could not identify both cards for repositioning');
        }
      } else {
        throw new Error('Could not find sufficient card elements');
      }
    } else {
      // Original method: swap the matched cards
      const marketCard = marketAnalysisMatch[1];
      const timeframeCard = timeframeSignalsMatch[1];
      
      // Replace market analysis card with placeholder
      content = content.replace(marketCard, '___MARKET_PLACEHOLDER___');
      // Replace timeframe card with market card
      content = content.replace(timeframeCard, marketCard);
      // Replace placeholder with timeframe card
      content = content.replace('___MARKET_PLACEHOLDER___', timeframeCard);
      
      console.log('   → Cards repositioned successfully');
    }
    
    // Write the updated content
    fs.writeFileSync(componentPath, content);
    console.log('   → Component file updated');
    
    // Wait for hot reload
    await this.sleep(2000);
  }

  async captureAfterState() {
    console.log('📸 [STEP-5] Capturing after state');
    
    try {
      // Test application load
      const response = await fetch(`${this.baseUrl}/`, { timeout: 5000 });
      this.afterState.applicationStatus = response.ok ? 'OPERATIONAL' : 'FAILED';
      console.log(`   → Application status: ${this.afterState.applicationStatus}`);
      
      // Test component structure
      const componentPath = './client/src/components/AdvancedSignalDashboard.tsx';
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // Find new order of main sections
      const marketAnalysisIndex = componentContent.indexOf('Market Analysis');
      const timeframeSignalsIndex = componentContent.indexOf('Timeframe-specific signals');
      
      this.afterState.currentOrder = marketAnalysisIndex < timeframeSignalsIndex ? 
        'MARKET_ANALYSIS_FIRST' : 'TIMEFRAME_SIGNALS_FIRST';
      
      console.log(`   → New component order: ${this.afterState.currentOrder}`);
      
      // Test APIs
      this.afterState.apiStatus = {};
      const apiTests = ['/api/signals', '/api/technical-analysis/BTC%2FUSDT'];
      
      for (const endpoint of apiTests) {
        try {
          const apiResponse = await fetch(`${this.baseUrl}${endpoint}`, { timeout: 3000 });
          this.afterState.apiStatus[endpoint] = apiResponse.ok ? 'OK' : 'FAILED';
        } catch (error) {
          this.afterState.apiStatus[endpoint] = 'ERROR';
        }
      }
      
      console.log(`   → API status: ${JSON.stringify(this.afterState.apiStatus)}`);
      
    } catch (error) {
      console.log(`   → After state capture failed: ${error.message}`);
      this.afterState.captureStatus = 'FAILED';
    }
  }

  async validateRepositioning() {
    console.log('✅ [STEP-6] Validating repositioning');
    
    const validations = [];
    
    // 1. Validate order change
    const orderChanged = this.beforeState.currentOrder !== this.afterState.currentOrder;
    const correctOrder = this.afterState.currentOrder === 'TIMEFRAME_SIGNALS_FIRST';
    
    validations.push({
      test: 'Component Order Changed',
      result: orderChanged ? 'PASS' : 'FAIL',
      details: `Before: ${this.beforeState.currentOrder}, After: ${this.afterState.currentOrder}`
    });
    
    validations.push({
      test: 'Correct New Order',
      result: correctOrder ? 'PASS' : 'FAIL',
      details: `Timeframe signals now first: ${correctOrder}`
    });
    
    // 2. Validate application still works
    validations.push({
      test: 'Application Still Operational',
      result: this.afterState.applicationStatus === 'OPERATIONAL' ? 'PASS' : 'FAIL',
      details: `Status: ${this.afterState.applicationStatus}`
    });
    
    // 3. Validate APIs still work
    const apiWorking = Object.values(this.afterState.apiStatus).every(status => status === 'OK');
    validations.push({
      test: 'APIs Still Functional',
      result: apiWorking ? 'PASS' : 'FAIL',
      details: `API status: ${JSON.stringify(this.afterState.apiStatus)}`
    });
    
    console.log(`   → Validations completed: ${validations.length}`);
    validations.forEach(v => {
      console.log(`     ${v.test}: ${v.result} - ${v.details}`);
    });
    
    const allPassed = validations.every(v => v.result === 'PASS');
    this.repositioningStatus = allPassed ? 'SUCCESS' : 'FAILED';
    
    return validations;
  }

  async executeRollback() {
    console.log('🔙 [ROLLBACK] Executing rollback procedures');
    
    try {
      const componentPath = './client/src/components/AdvancedSignalDashboard.tsx';
      fs.writeFileSync(componentPath, this.backupData.componentContent);
      console.log('   → Component restored from backup');
      
      this.repositioningStatus = 'ROLLED_BACK';
      
    } catch (error) {
      console.error('   → Rollback failed:', error.message);
      this.repositioningStatus = 'ROLLBACK_FAILED';
    }
  }

  async generateRepositioningReport() {
    console.log('\n📊 [REPORT] Repositioning execution complete');
    
    const report = {
      timestamp: new Date().toISOString(),
      operation: 'AdvancedSignalDashboard_Repositioning',
      execution_status: this.repositioningStatus,
      before_state: this.beforeState,
      after_state: this.afterState,
      changes_made: {
        timeframe_signals_moved_to_top: true,
        market_analysis_moved_down: true,
        component_order_swapped: true
      },
      backup_created: Object.keys(this.backupData).length > 0
    };
    
    console.log(`\n🎯 REPOSITIONING RESULTS:`);
    console.log(`⚕️ Execution Status: ${this.repositioningStatus}`);
    console.log(`🔄 Order Changed: ${this.beforeState.currentOrder} → ${this.afterState.currentOrder}`);
    console.log(`✅ Application Status: ${this.afterState.applicationStatus}`);
    console.log(`💾 Backup Created: ${report.backup_created}`);
    
    const filename = `advanced_signal_dashboard_repositioning_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n📋 Repositioning report saved: ${filename}`);
    
    return report;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute repositioning
async function main() {
  const repositioner = new AdvancedSignalDashboardRepositioning();
  await repositioner.executeRepositioning();
  process.exit(0);
}

main().catch(console.error);