/**
 * System Recovery Diagnostic - External Shell Test
 * Identifies and fixes critical syntax errors preventing server startup
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class SystemRecoveryDiagnostic {
  constructor() {
    this.serverFile = 'server/routes.ts';
  }

  async diagnoseSyntaxErrors() {
    console.log('🔍 DIAGNOSING SYNTAX ERRORS');
    console.log('===========================');
    
    try {
      // Check TypeScript compilation
      const { stdout, stderr } = await execAsync('npx tsc --noEmit server/routes.ts');
      
      if (stderr) {
        console.log('❌ TypeScript compilation errors found:');
        console.log(stderr);
        return this.identifyErrorPattern(stderr);
      } else {
        console.log('✅ No TypeScript compilation errors');
        return null;
      }
    } catch (error) {
      console.log('❌ Compilation failed:', error.message);
      return this.identifyErrorPattern(error.message);
    }
  }

  identifyErrorPattern(errorMessage) {
    const patterns = [
      { pattern: /Expected "\)" but found/, fix: 'Missing closing parenthesis' },
      { pattern: /Expected "," but found/, fix: 'Missing comma' },
      { pattern: /Unexpected "\)"/, fix: 'Extra closing parenthesis' },
      { pattern: /Declaration or statement expected/, fix: 'Invalid function structure' }
    ];

    for (const { pattern, fix } of patterns) {
      if (pattern.test(errorMessage)) {
        return fix;
      }
    }
    
    return 'Unknown syntax error';
  }

  async testServerStartup() {
    console.log('\n🔄 TESTING SERVER STARTUP');
    console.log('=========================');
    
    try {
      // Try to start the server with timeout
      const startupTest = setTimeout(() => {
        console.log('❌ Server failed to start within 10 seconds');
      }, 10000);

      // Check if server is responsive
      await this.sleep(2000);
      
      const response = await fetch('http://localhost:5000/api/performance-metrics');
      if (response.ok) {
        clearTimeout(startupTest);
        console.log('✅ Server is running and responsive');
        return true;
      } else {
        console.log(`❌ Server responded with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log('❌ Server not accessible:', error.message);
      return false;
    }
  }

  async identifyBrokenRoutes() {
    console.log('\n🔍 IDENTIFYING BROKEN ROUTES');
    console.log('============================');
    
    const criticalRoutes = [
      '/api/performance-metrics',
      '/api/signals/BTC%2FUSDT',
      '/api/crypto/BTC%2FUSDT',
      '/api/monte-carlo-risk'
    ];

    let workingRoutes = 0;
    
    for (const route of criticalRoutes) {
      try {
        const options = route === '/api/monte-carlo-risk' 
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
            }
          : {};

        const response = await fetch(`http://localhost:5000${route}`, options);
        
        if (response.ok) {
          workingRoutes++;
          console.log(`✅ ${route}: Working`);
        } else {
          console.log(`❌ ${route}: Status ${response.status}`);
        }
        
        await this.sleep(100);
      } catch (error) {
        console.log(`❌ ${route}: Failed - ${error.message}`);
      }
    }

    const healthPercentage = (workingRoutes / criticalRoutes.length) * 100;
    console.log(`\n🎯 System Health: ${healthPercentage}%`);
    
    return {
      workingRoutes,
      totalRoutes: criticalRoutes.length,
      healthPercentage
    };
  }

  async generateRecoveryPlan() {
    console.log('\n📋 GENERATING RECOVERY PLAN');
    console.log('===========================');
    
    const syntaxIssue = await this.diagnoseSyntaxErrors();
    const serverRunning = await this.testServerStartup();
    
    if (syntaxIssue) {
      console.log(`🔧 Priority 1: Fix syntax error - ${syntaxIssue}`);
      console.log('🔧 Priority 2: Restart server and validate core routes');
      console.log('🔧 Priority 3: Run comprehensive system validation');
      
      return {
        priority: 'syntax_fix',
        issue: syntaxIssue,
        serverRunning: false
      };
    }
    
    if (serverRunning) {
      const routeHealth = await this.identifyBrokenRoutes();
      
      if (routeHealth.healthPercentage >= 75) {
        console.log('✅ System is stable - proceed with comprehensive testing');
        return {
          priority: 'comprehensive_testing',
          serverRunning: true,
          health: routeHealth.healthPercentage
        };
      } else {
        console.log('⚠️ System partially working - fix critical routes');
        return {
          priority: 'route_fixes',
          serverRunning: true,
          health: routeHealth.healthPercentage
        };
      }
    }
    
    console.log('❌ Server not running - investigate startup issues');
    return {
      priority: 'server_startup',
      serverRunning: false
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute system recovery diagnostic
async function main() {
  const diagnostic = new SystemRecoveryDiagnostic();
  const plan = await diagnostic.generateRecoveryPlan();
  
  console.log('\n🎯 RECOVERY PLAN COMPLETE');
  console.log(`Priority: ${plan.priority}`);
  console.log(`Server Running: ${plan.serverRunning}`);
  
  if (plan.health) {
    console.log(`System Health: ${plan.health}%`);
  }
  
  process.exit(plan.serverRunning ? 0 : 1);
}

main().catch(console.error);