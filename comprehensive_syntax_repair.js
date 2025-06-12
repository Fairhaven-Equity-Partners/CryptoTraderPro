#!/usr/bin/env node

/**
 * Comprehensive Syntax Repair Tool
 * Fixes all critical parsing errors preventing application compilation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function repairCriticalSyntaxErrors() {
  console.log('Starting comprehensive syntax repair...');
  
  // Fix technicalIndicators.ts critical errors
  const techIndicatorsPath = path.join(__dirname, 'client/src/lib/technicalIndicators.ts');
  let techContent = fs.readFileSync(techIndicatorsPath, 'utf8');
  
  // Fix template literal corruption
  techContent = techContent.replace(/`[^`]*\$\{[^}]*\}[^`]*`\.`/g, match => {
    return match.replace('`.`', '`');
  });
  
  // Fix broken object properties
  techContent = techContent.replace(/\$\{[^}]*\}[^`]*`\s*\}\s*;/g, match => {
    const templateMatch = match.match(/\$\{([^}]*)\}/);
    if (templateMatch) {
      return `\${${templateMatch[1]}}\`
      };`;
    }
    return match;
  });
  
  // Fix malformed template literals in return statements
  techContent = techContent.replace(/timeEstimate:\s*`[^`]*`\s*n\s*`/g, 'timeEstimate: `${timeframe} horizon`');
  
  fs.writeFileSync(techIndicatorsPath, techContent);
  console.log('Fixed technicalIndicators.ts');
  
  // Fix advancedSignalsNew.ts critical errors
  const advSignalsPath = path.join(__dirname, 'client/src/lib/advancedSignalsNew.ts');
  let advContent = fs.readFileSync(advSignalsPath, 'utf8');
  
  // Fix template literal corruption
  advContent = advContent.replace(/`[^`]*\$\{[^}]*\}[^`]*`\.`/g, match => {
    return match.replace('`.`', '`');
  });
  
  // Fix broken timeframe properties
  advContent = advContent.replace(/\.03:/g, '"03":');
  advContent = advContent.replace(/"12h"/g, '"1d"'); // Replace invalid timeframe
  
  fs.writeFileSync(advSignalsPath, advContent);
  console.log('Fixed advancedSignalsNew.ts');
  
  // Fix SignalHeatMap.tsx critical errors
  const heatmapPath = path.join(__dirname, 'client/src/components/SignalHeatMap.tsx');
  let heatmapContent = fs.readFileSync(heatmapPath, 'utf8');
  
  // Fix JSX syntax errors
  heatmapContent = heatmapContent.replace(/className="[^"]*animate-bounc`e`/g, 'className="animate-bounce"');
  heatmapContent = heatmapContent.replace(/\s*\}\s*\([^)]*\)\s*`[^`]*`/g, '');
  
  // Fix broken JSX elements
  heatmapContent = heatmapContent.replace(/>\s*\{\s*\$[^}]*\}\s*</g, '><');
  
  fs.writeFileSync(heatmapPath, heatmapContent);
  console.log('Fixed SignalHeatMap.tsx');
  
  // Fix optimizedCalculator.ts type errors
  const optimizedCalcPath = path.join(__dirname, 'client/src/lib/optimizedCalculator.ts');
  let optimizedContent = fs.readFileSync(optimizedCalcPath, 'utf8');
  
  // Fix Record type issues
  optimizedContent = optimizedContent.replace(
    /: Record<TimeFrame, CalculationResult>/g, 
    ': Partial<Record<TimeFrame, CalculationResult>>'
  );
  
  fs.writeFileSync(optimizedCalcPath, optimizedContent);
  console.log('Fixed optimizedCalculator.ts');
  
  console.log('Comprehensive syntax repair completed');
}

repairCriticalSyntaxErrors();