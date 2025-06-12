#!/usr/bin/env node

/**
 * Script to remove all debug console logging from frontend components
 * Ensures clean production experience per ground rules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeConsoleLogging(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remove console.log, console.debug, console.warn statements
    const cleanedContent = content
      .replace(/\s*console\.log\([^)]*\);?\s*/g, '')
      .replace(/\s*console\.debug\([^)]*\);?\s*/g, '')
      .replace(/\s*console\.warn\([^)]*\);?\s*/g, '')
      .replace(/\s*console\.info\([^)]*\);?\s*/g, '')
      // Handle multiline console statements
      .replace(/\s*console\.(log|debug|warn|info)\(\s*[\s\S]*?\);\s*/g, '')
      // Clean up extra whitespace
      .replace(/\n\n\n+/g, '\n\n');
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`Cleaned: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let cleanedCount = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        if (removeConsoleLogging(fullPath)) {
          cleanedCount++;
        }
      }
    }
  }
  
  walkDir(dirPath);
  return cleanedCount;
}

// Process client/src directory
const clientSrcPath = path.join(__dirname, 'client', 'src');
console.log('Removing debug console logging from frontend components...');
const cleanedCount = processDirectory(clientSrcPath);
console.log(`Cleaned ${cleanedCount} files to ensure production-ready experience`);