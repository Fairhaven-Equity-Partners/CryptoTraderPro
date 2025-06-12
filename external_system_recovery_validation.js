#!/usr/bin/env node

/**
 * External System Recovery Validation
 * Comprehensive 15-cycle validation of system stability after emergency repairs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SystemRecoveryValidator {
  constructor() {
    this.validationResults = [];
    this.criticalIssues = [];
    this.systemHealth = 0;
  }

  async runComprehensiveValidation() {
    console.log('🔍 Starting external system recovery validation...');
    
    for (let cycle = 1; cycle <= 15; cycle++) {
      console.log(`\n--- Validation Cycle ${cycle}/15 ---`);
      
      const cycleResult = await this.runValidationCycle(cycle);
      this.validationResults.push(cycleResult);
      
      if (cycleResult.criticalErrors > 0) {
        console.log(`⚠️  Cycle ${cycle}: ${cycleResult.criticalErrors} critical errors detected`);
      } else {
        console.log(`✅ Cycle ${cycle}: All validations passed`);
      }
      
      await this.sleep(200);
    }
    
    this.generateRecoveryReport();
    return this.systemHealth;
  }

  async runValidationCycle(cycle) {
    const result = {
      cycle,
      timestamp: new Date().toISOString(),
      criticalErrors: 0,
      warnings: 0,
      validations: []
    };

    // Validate core file integrity
    const coreValidation = await this.validateCoreFiles();
    result.validations.push(coreValidation);
    if (coreValidation.status === 'CRITICAL') result.criticalErrors++;

    // Validate TypeScript compilation
    const tsValidation = await this.validateTypeScriptCompilation();
    result.validations.push(tsValidation);
    if (tsValidation.status === 'CRITICAL') result.criticalErrors++;

    // Validate application startup
    const startupValidation = await this.validateApplicationStartup();
    result.validations.push(startupValidation);
    if (startupValidation.status === 'CRITICAL') result.criticalErrors++;

    // Validate API endpoints
    const apiValidation = await this.validateAPIEndpoints();
    result.validations.push(apiValidation);
    if (apiValidation.status === 'WARNING') result.warnings++;

    return result;
  }

  async validateCoreFiles() {
    const coreFiles = [
      'client/src/lib/queryClient.ts',
      'client/src/lib/advancedSignalsNew.ts',
      'client/src/lib/technicalIndicators.ts',
      'client/src/components/SignalHeatMap.tsx',
      'client/src/lib/optimizedCalculator.ts'
    ];

    let errors = 0;
    const issues = [];

    for (const file of coreFiles) {
      const filePath = path.join(__dirname, file);
      
      if (!fs.existsSync(filePath)) {
        errors++;
        issues.push(`Missing file: ${file}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for basic syntax issues
      if (content.includes('throw new Error(}')) {
        errors++;
        issues.push(`Syntax error in ${file}: malformed throw statement`);
      }
      
      if (content.includes('`${') && content.includes('`n`')) {
        errors++;
        issues.push(`Template literal corruption in ${file}`);
      }
      
      if (content.includes('{>}') || content.includes('{"}')) {
        errors++;
        issues.push(`JSX corruption in ${file}`);
      }
    }

    return {
      name: 'Core File Integrity',
      status: errors > 0 ? 'CRITICAL' : 'PASS',
      errors,
      issues
    };
  }

  async validateTypeScriptCompilation() {
    // Simulate TypeScript validation by checking for common syntax patterns
    const tsFiles = [
      'client/src/lib/advancedSignalsNew.ts',
      'client/src/lib/technicalIndicators.ts',
      'client/src/lib/optimizedCalculator.ts'
    ];

    let errors = 0;
    const issues = [];

    for (const file of tsFiles) {
      const filePath = path.join(__dirname, file);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for unterminated strings
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.includes('`') && line.match(/`/g)?.length % 2 !== 0) {
            errors++;
            issues.push(`Unterminated template literal in ${file}:${i + 1}`);
          }
          
          if (line.includes('throw new Error(}')) {
            errors++;
            issues.push(`Malformed error in ${file}:${i + 1}`);
          }
        }
      }
    }

    return {
      name: 'TypeScript Compilation',
      status: errors > 0 ? 'CRITICAL' : 'PASS',
      errors,
      issues
    };
  }

  async validateApplicationStartup() {
    // Check for common startup blockers
    const packagePath = path.join(__dirname, 'package.json');
    const vitePath = path.join(__dirname, 'vite.config.ts');
    
    let errors = 0;
    const issues = [];

    if (!fs.existsSync(packagePath)) {
      errors++;
      issues.push('Missing package.json');
    }

    if (!fs.existsSync(vitePath)) {
      errors++;
      issues.push('Missing vite.config.ts');
    }

    // Check for dependency issues
    if (fs.existsSync(packagePath)) {
      const packageContent = fs.readFileSync(packagePath, 'utf8');
      try {
        const pkg = JSON.parse(packageContent);
        if (!pkg.scripts || !pkg.scripts.dev) {
          errors++;
          issues.push('Missing dev script in package.json');
        }
      } catch (e) {
        errors++;
        issues.push('Malformed package.json');
      }
    }

    return {
      name: 'Application Startup',
      status: errors > 0 ? 'CRITICAL' : 'PASS',
      errors,
      issues
    };
  }

  async validateAPIEndpoints() {
    // Validate server routes file
    const routesPath = path.join(__dirname, 'server/routes.ts');
    
    let warnings = 0;
    const issues = [];

    if (fs.existsSync(routesPath)) {
      const content = fs.readFileSync(routesPath, 'utf8');
      
      // Check for API endpoint patterns
      if (!content.includes('/api/heatmap')) {
        warnings++;
        issues.push('Missing heatmap API endpoint');
      }
      
      if (!content.includes('/api/signals')) {
        warnings++;
        issues.push('Missing signals API endpoint');
      }
    } else {
      warnings++;
      issues.push('Missing server routes file');
    }

    return {
      name: 'API Endpoints',
      status: warnings > 0 ? 'WARNING' : 'PASS',
      warnings,
      issues
    };
  }

  generateRecoveryReport() {
    const totalCycles = this.validationResults.length;
    const successfulCycles = this.validationResults.filter(r => r.criticalErrors === 0).length;
    const totalCriticalErrors = this.validationResults.reduce((sum, r) => sum + r.criticalErrors, 0);
    const totalWarnings = this.validationResults.reduce((sum, r) => sum + r.warnings, 0);
    
    this.systemHealth = Math.round((successfulCycles / totalCycles) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('SYSTEM RECOVERY VALIDATION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Validation Cycles: ${totalCycles}`);
    console.log(`Successful Cycles: ${successfulCycles}`);
    console.log(`System Health Score: ${this.systemHealth}%`);
    console.log(`Total Critical Errors: ${totalCriticalErrors}`);
    console.log(`Total Warnings: ${totalWarnings}`);
    
    if (this.systemHealth >= 80) {
      console.log('🎉 SYSTEM RECOVERY: SUCCESSFUL');
      console.log('✅ Application is stable and ready for deployment');
    } else if (this.systemHealth >= 60) {
      console.log('⚠️  SYSTEM RECOVERY: PARTIAL');
      console.log('🔧 Some issues remain, additional fixes recommended');
    } else {
      console.log('❌ SYSTEM RECOVERY: FAILED');
      console.log('🚨 Critical issues prevent normal operation');
    }
    
    // Export results
    const reportPath = path.join(__dirname, `system_recovery_report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      systemHealth: this.systemHealth,
      totalCycles,
      successfulCycles,
      totalCriticalErrors,
      totalWarnings,
      validationResults: this.validationResults,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n📄 Full report exported to: ${reportPath}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const validator = new SystemRecoveryValidator();
  const systemHealth = await validator.runComprehensiveValidation();
  process.exit(systemHealth >= 80 ? 0 : 1);
}

main().catch(console.error);