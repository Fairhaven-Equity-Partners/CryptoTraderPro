#!/usr/bin/env node

/**
 * Script to fix critical syntax errors introduced by console logging removal
 * Focuses on restoring proper file syntax for application loading
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Fix broken template literals
    const templateLiteralFixes = [
      { pattern: /\$\{[^}]*\}[^`]*`\);?\s*$/, replacement: '";' },
      { pattern: /`[^`]*\$\{[^}]*\}[^`]*(?!`)/g, replacement: match => match + '`' },
      { pattern: /\}\s*\([^)]*\)\s*\$\{/g, replacement: '} ${' },
    ];
    
    templateLiteralFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // Fix broken function calls and statements
    const syntaxFixes = [
      { pattern: /\}\s*\([^)]*\)\s*\$\{/g, replacement: '} ${' },
      { pattern: /\s*console\.[a-z]+\([^)]*\);\s*/g, replacement: '' },
      { pattern: /\n\n\n+/g, replacement: '\n\n' },
      { pattern: /\s*\}\s*\([^)]*\)\s*`\);/g, replacement: '}' },
      { pattern: /\s*`[^`]*\$\{[^}]*\}[^`]*`\)\s*;?\s*(?=\})/g, replacement: '' },
    ];
    
    syntaxFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed syntax errors in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let fixedCount = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        if (fixSyntaxErrors(fullPath)) {
          fixedCount++;
        }
      }
    }
  }
  
  walkDir(dirPath);
  return fixedCount;
}

// Process client/src directory
const clientSrcPath = path.join(__dirname, 'client', 'src');
console.log('Fixing critical syntax errors in frontend components...');
const fixedCount = processDirectory(clientSrcPath);
console.log(`Fixed syntax errors in ${fixedCount} files to restore application functionality`);