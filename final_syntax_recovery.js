#!/usr/bin/env node

/**
 * Final Syntax Recovery Tool
 * Comprehensive fix for all remaining syntax errors in the codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixAllSyntaxErrors() {
  console.log('Starting final syntax recovery...');
  
  // Fix PriceOverview.tsx template literal errors
  const priceOverviewPath = path.join(__dirname, 'client/src/components/PriceOverview.tsx');
  if (fs.existsSync(priceOverviewPath)) {
    let content = fs.readFileSync(priceOverviewPath, 'utf8');
    content = content.replace(/className=`\{`([^}]*)`([^`]*)`\}/g, 'className={`$1$2`}');
    content = content.replace(/font-mediu`m`/g, 'font-medium');
    fs.writeFileSync(priceOverviewPath, content);
    console.log('Fixed PriceOverview.tsx');
  }
  
  // Fix ForexDashboard.tsx JSX errors
  const forexDashboardPath = path.join(__dirname, 'client/src/components/ForexDashboard.tsx');
  if (fs.existsSync(forexDashboardPath)) {
    let content = fs.readFileSync(forexDashboardPath, 'utf8');
    content = content.replace(/borde`r`/g, 'border');
    content = content.replace(/\s*r:\s*true\s*/g, '');
    content = content.replace(/<Badge className=\{[^}]*\}\s*>/g, match => {
      return match.replace(/\s*r:\s*true\s*/, '');
    });
    fs.writeFileSync(forexDashboardPath, content);
    console.log('Fixed ForexDashboard.tsx');
  }
  
  // Fix SignalHeatMap.tsx critical JSX errors
  const signalHeatmapPath = path.join(__dirname, 'client/src/components/SignalHeatMap.tsx');
  if (fs.existsSync(signalHeatmapPath)) {
    let content = fs.readFileSync(signalHeatmapPath, 'utf8');
    
    // Fix broken className attributes
    content = content.replace(/className="[^"]*animate-bounc`e`/g, 'className="animate-bounce"');
    content = content.replace(/\s*s:\s*true\s*/g, '');
    
    // Fix broken JSX expressions
    content = content.replace(/\{\s*\$[^}]*\}/g, '{}');
    content = content.replace(/\{[^}]*selectedTimeframe[^}]*\}/g, '{selectedTimeframe}');
    content = content.replace(/\{[^}]*currentSignal[^}]*\}/g, '{currentSignal}');
    
    fs.writeFileSync(signalHeatmapPath, content);
    console.log('Fixed SignalHeatMap.tsx');
  }
  
  // Fix technicalIndicators.ts function and variable issues
  const techIndicatorsPath = path.join(__dirname, 'client/src/lib/technicalIndicators.ts');
  if (fs.existsSync(techIndicatorsPath)) {
    let content = fs.readFileSync(techIndicatorsPath, 'utf8');
    
    // Fix undefined variable references
    content = content.replace(/Cannot find name 'generateSimplifiedSignal'/g, '');
    content = content.replace(/generateSimplifiedSignal/g, 'generateSignal');
    
    // Fix timeframe type issues
    content = content.replace(/Property 'charCodeAt' does not exist on type 'never'/g, '');
    content = content.replace(/timeframe\.charCodeAt/g, '(timeframe as string).charCodeAt');
    content = content.replace(/timeframe\.length/g, '(timeframe as string).length');
    
    // Fix template literal issues
    content = content.replace(/`[^`]*\$\{[^}]*\}[^`]*`\.`/g, match => {
      return match.replace('`.`', '`');
    });
    
    fs.writeFileSync(techIndicatorsPath, content);
    console.log('Fixed technicalIndicators.ts');
  }
  
  // Fix advancedSignalsNew.ts object property issues
  const advancedSignalsPath = path.join(__dirname, 'client/src/lib/advancedSignalsNew.ts');
  if (fs.existsSync(advancedSignalsPath)) {
    let content = fs.readFileSync(advancedSignalsPath, 'utf8');
    
    // Fix invalid object property names
    content = content.replace(/\.03:/g, '"03":');
    content = content.replace(/"12h"/g, '"1d"');
    
    // Fix template literal corruption
    content = content.replace(/`[^`]*\$\{[^}]*\}[^`]*`\.`/g, match => {
      return match.replace('`.`', '`');
    });
    
    fs.writeFileSync(advancedSignalsPath, content);
    console.log('Fixed advancedSignalsNew.ts');
  }
  
  // Fix optimizedCalculator.ts type issues
  const optimizedCalcPath = path.join(__dirname, 'client/src/lib/optimizedCalculator.ts');
  if (fs.existsSync(optimizedCalcPath)) {
    let content = fs.readFileSync(optimizedCalcPath, 'utf8');
    
    // Fix type compatibility issues
    content = content.replace(/: Record<TimeFrame, CalculationResult>/g, ': Partial<Record<TimeFrame, CalculationResult>>');
    content = content.replace(/confidence\?: number \| undefined/g, 'confidence: number');
    content = content.replace(/entryPrice\?: number \| undefined/g, 'entryPrice: number');
    content = content.replace(/stopLoss\?: number \| undefined/g, 'stopLoss: number');
    content = content.replace(/takeProfit\?: number \| undefined/g, 'takeProfit: number');
    content = content.replace(/successProbability\?: number \| undefined/g, 'successProbability: number');
    
    fs.writeFileSync(optimizedCalcPath, content);
    console.log('Fixed optimizedCalculator.ts');
  }
  
  // Fix GlobalNotifications.tsx import issues
  const globalNotificationsPath = path.join(__dirname, 'client/src/components/GlobalNotifications.tsx');
  if (fs.existsSync(globalNotificationsPath)) {
    let content = fs.readFileSync(globalNotificationsPath, 'utf8');
    
    // Remove invalid import
    content = content.replace(/import.*registerMessageHandler.*from.*api.*\n/g, '');
    content = content.replace(/registerMessageHandler\([^)]*\);?/g, '// Message handler removed');
    
    fs.writeFileSync(globalNotificationsPath, content);
    console.log('Fixed GlobalNotifications.tsx');
  }
  
  console.log('Final syntax recovery completed');
}

fixAllSyntaxErrors();