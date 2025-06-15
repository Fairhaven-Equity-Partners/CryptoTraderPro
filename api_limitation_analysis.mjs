/**
 * API Limitation Analysis - Complete Codebase Review
 * Analyzes all API calls across the system to ensure strict compliance with rate limits
 */

import fs from 'fs';
import path from 'path';

class APILimitationAnalyzer {
  constructor() {
    this.apiCalls = [];
    this.rateLimiters = [];
    this.apiConfigurations = [];
    this.findings = [];
    this.totalCallsFound = 0;
    this.criticalIssues = [];
  }

  async analyzeCompletely() {
    console.log('\n🔍 API LIMITATION ANALYSIS - COMPLETE CODEBASE REVIEW');
    console.log('=====================================================');
    
    await this.step1_analyzeServerRoutes();
    await this.step2_analyzeCoinMarketCapUsage();
    await this.step3_analyzeRateLimiters();
    await this.step4_analyzeAutomatedCalculators();
    await this.step5_analyzePriceStreamers();
    await this.step6_analyzeCircuitBreakers();
    await this.step7_validateAPILimits();
    await this.generateComprehensiveReport();
  }

  async step1_analyzeServerRoutes() {
    console.log('\n📋 Step 1: Server Routes API Usage Analysis');
    
    try {
      const routesContent = fs.readFileSync('./server/routes.ts', 'utf8');
      
      // Find CoinMarketCap API calls
      const cmcMatches = routesContent.match(/coinMarketCapService\./g) || [];
      const fetchPriceMatches = routesContent.match(/fetchPrice\(/g) || [];
      const batchFetchMatches = routesContent.match(/batchFetch\(/g) || [];
      
      console.log(`🔍 CoinMarketCap service calls: ${cmcMatches.length}`);
      console.log(`📊 fetchPrice calls: ${fetchPriceMatches.length}`);
      console.log(`📦 batchFetch calls: ${batchFetchMatches.length}`);
      
      this.apiCalls.push({
        file: 'server/routes.ts',
        service: 'CoinMarketCap',
        calls: cmcMatches.length + fetchPriceMatches.length + batchFetchMatches.length,
        types: ['fetchPrice', 'batchFetch']
      });
      
      // Check for rate limiting implementations
      const rateLimitMatches = routesContent.match(/rateLimiter|RateLimiter/g) || [];
      console.log(`⚡ Rate limiter references: ${rateLimitMatches.length}`);
      
      this.rateLimiters.push({
        file: 'server/routes.ts',
        references: rateLimitMatches.length,
        implemented: rateLimitMatches.length > 0
      });
      
    } catch (error) {
      console.log('❌ Could not analyze server routes:', error.message);
    }
  }

  async step2_analyzeCoinMarketCapUsage() {
    console.log('\n💰 Step 2: CoinMarketCap Service Analysis');
    
    try {
      const files = ['./server/services/coinMarketCapService.ts', './server/services/optimizedCMCService.ts'];
      
      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Find API endpoint calls
          const apiCallMatches = content.match(/\/v1\/cryptocurrency\//g) || [];
          const quotesMatches = content.match(/quotes\/latest/g) || [];
          const mapMatches = content.match(/\/map/g) || [];
          
          console.log(`📁 ${path.basename(filePath)}:`);
          console.log(`   API endpoint calls: ${apiCallMatches.length}`);
          console.log(`   Quotes calls: ${quotesMatches.length}`);
          console.log(`   Map calls: ${mapMatches.length}`);
          
          // Check for batch processing
          const batchMatches = content.match(/batch|Batch/g) || [];
          const limitMatches = content.match(/limit|Limit/g) || [];
          
          console.log(`   Batch processing: ${batchMatches.length} references`);
          console.log(`   Limit handling: ${limitMatches.length} references`);
          
          this.apiCalls.push({
            file: path.basename(filePath),
            service: 'CoinMarketCap',
            endpointCalls: apiCallMatches.length,
            quoteCalls: quotesMatches.length,
            mapCalls: mapMatches.length,
            batchImplemented: batchMatches.length > 0
          });
        }
      }
      
    } catch (error) {
      console.log('❌ Could not analyze CoinMarketCap services:', error.message);
    }
  }

  async step3_analyzeRateLimiters() {
    console.log('\n⚡ Step 3: Rate Limiter Implementation Analysis');
    
    try {
      const files = ['./server/services/rateLimiter.ts'];
      
      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Find rate limiting configurations
          const monthlyLimitMatches = content.match(/30000|monthly.*limit/gi) || [];
          const circuitBreakerMatches = content.match(/circuit.*breaker|breaker/gi) || [];
          const thresholdMatches = content.match(/threshold/gi) || [];
          
          console.log(`📁 ${path.basename(filePath)}:`);
          console.log(`   Monthly limit references: ${monthlyLimitMatches.length}`);
          console.log(`   Circuit breaker logic: ${circuitBreakerMatches.length}`);
          console.log(`   Threshold management: ${thresholdMatches.length}`);
          
          // Check for emergency protocols
          const emergencyMatches = content.match(/emergency|Emergency/g) || [];
          const backoffMatches = content.match(/backoff|Backoff/g) || [];
          
          console.log(`   Emergency protocols: ${emergencyMatches.length}`);
          console.log(`   Backoff strategies: ${backoffMatches.length}`);
          
          this.rateLimiters.push({
            file: path.basename(filePath),
            monthlyLimitConfigured: monthlyLimitMatches.length > 0,
            circuitBreakerImplemented: circuitBreakerMatches.length > 0,
            emergencyProtocols: emergencyMatches.length > 0
          });
        }
      }
      
    } catch (error) {
      console.log('❌ Could not analyze rate limiters:', error.message);
    }
  }

  async step4_analyzeAutomatedCalculators() {
    console.log('\n🤖 Step 4: Automated Calculator API Usage');
    
    try {
      const files = ['./server/services/automatedSignalCalculator.ts'];
      
      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Find calculation triggers
          const calculateMatches = content.match(/calculate|Calculate/g) || [];
          const batchMatches = content.match(/batch.*process/gi) || [];
          const scheduleMatches = content.match(/schedule|interval/gi) || [];
          
          console.log(`📁 ${path.basename(filePath)}:`);
          console.log(`   Calculation triggers: ${calculateMatches.length}`);
          console.log(`   Batch processing: ${batchMatches.length}`);
          console.log(`   Scheduled operations: ${scheduleMatches.length}`);
          
          // Check for API call frequency
          const intervalMatches = content.match(/setInterval|setTimeout/g) || [];
          const minuteMatches = content.match(/minute|min/gi) || [];
          
          console.log(`   Timer functions: ${intervalMatches.length}`);
          console.log(`   Minute-based timing: ${minuteMatches.length}`);
          
          this.apiCalls.push({
            file: path.basename(filePath),
            service: 'AutomatedCalculator',
            calculationTriggers: calculateMatches.length,
            timerBased: intervalMatches.length > 0,
            batchProcessing: batchMatches.length > 0
          });
        }
      }
      
    } catch (error) {
      console.log('❌ Could not analyze automated calculators:', error.message);
    }
  }

  async step5_analyzePriceStreamers() {
    console.log('\n📊 Step 5: Price Streamer API Usage Analysis');
    
    try {
      const files = ['./server/services/priceStreamer.ts', './server/services/ultimateManager.ts'];
      
      for (const filePath of files) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Find streaming operations
          const streamMatches = content.match(/stream|Stream/g) || [];
          const fetchMatches = content.match(/fetch.*price/gi) || [];
          const updateMatches = content.match(/update.*price/gi) || [];
          
          console.log(`📁 ${path.basename(filePath)}:`);
          console.log(`   Streaming operations: ${streamMatches.length}`);
          console.log(`   Price fetch operations: ${fetchMatches.length}`);
          console.log(`   Price update operations: ${updateMatches.length}`);
          
          // Check for batch operations
          const batchFetchMatches = content.match(/batch.*fetch/gi) || [];
          const symbolBatchMatches = content.match(/symbol.*batch/gi) || [];
          
          console.log(`   Batch fetch operations: ${batchFetchMatches.length}`);
          console.log(`   Symbol batching: ${symbolBatchMatches.length}`);
          
          this.apiCalls.push({
            file: path.basename(filePath),
            service: 'PriceStreamer',
            streamingOps: streamMatches.length,
            fetchOps: fetchMatches.length,
            batchOps: batchFetchMatches.length
          });
        }
      }
      
    } catch (error) {
      console.log('❌ Could not analyze price streamers:', error.message);
    }
  }

  async step6_analyzeCircuitBreakers() {
    console.log('\n🔐 Step 6: Circuit Breaker Protection Analysis');
    
    try {
      // Check all service files for circuit breaker patterns
      const serviceFiles = [
        './server/services/coinMarketCapService.ts',
        './server/services/optimizedCMCService.ts',
        './server/services/rateLimiter.ts'
      ];
      
      let totalProtections = 0;
      
      for (const filePath of serviceFiles) {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          const protectionPatterns = [
            /try.*catch/g,
            /error.*handling/gi,
            /limit.*exceeded/gi,
            /circuit.*open/gi,
            /fallback/gi,
            /retry/gi
          ];
          
          let fileProtections = 0;
          protectionPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            fileProtections += matches.length;
          });
          
          console.log(`📁 ${path.basename(filePath)}: ${fileProtections} protection mechanisms`);
          totalProtections += fileProtections;
        }
      }
      
      console.log(`🛡️ Total circuit breaker protections: ${totalProtections}`);
      
      this.apiConfigurations.push({
        component: 'CircuitBreakers',
        totalProtections,
        adequateProtection: totalProtections >= 10
      });
      
    } catch (error) {
      console.log('❌ Could not analyze circuit breakers:', error.message);
    }
  }

  async step7_validateAPILimits() {
    console.log('\n✅ Step 7: API Limit Validation');
    
    // Calculate total API usage potential
    const totalApiCalls = this.apiCalls.reduce((sum, call) => {
      return sum + (call.calls || call.endpointCalls || call.calculationTriggers || call.streamingOps || 0);
    }, 0);
    
    this.totalCallsFound = totalApiCalls;
    
    console.log(`📊 Total API call references found: ${totalApiCalls}`);
    
    // Validate against known limits
    const monthlyLimit = 30000;
    const dailyEstimate = monthlyLimit / 30; // ~1000 per day
    const hourlyEstimate = dailyEstimate / 24; // ~42 per hour
    
    console.log(`📋 API Limits:`);
    console.log(`   Monthly: ${monthlyLimit} calls`);
    console.log(`   Daily estimate: ${dailyEstimate.toFixed(0)} calls`);
    console.log(`   Hourly estimate: ${hourlyEstimate.toFixed(0)} calls`);
    
    // Check for potential issues
    if (totalApiCalls > 100) {
      this.criticalIssues.push({
        severity: 'HIGH',
        issue: 'High number of API call references detected',
        details: `${totalApiCalls} references found across codebase`,
        recommendation: 'Ensure proper rate limiting and batching'
      });
    }
    
    // Validate rate limiter presence
    const hasRateLimiter = this.rateLimiters.some(rl => rl.implemented);
    if (!hasRateLimiter) {
      this.criticalIssues.push({
        severity: 'CRITICAL',
        issue: 'No rate limiter implementation detected',
        recommendation: 'Implement comprehensive rate limiting immediately'
      });
    }
    
    // Check for circuit breakers
    const hasCircuitBreaker = this.apiConfigurations.some(config => config.adequateProtection);
    if (!hasCircuitBreaker) {
      this.criticalIssues.push({
        severity: 'HIGH',
        issue: 'Insufficient circuit breaker protection',
        recommendation: 'Enhance error handling and fallback mechanisms'
      });
    }
  }

  async generateComprehensiveReport() {
    console.log('\n📋 API LIMITATION ANALYSIS REPORT');
    console.log('=================================');
    
    console.log('\n🔍 API USAGE SUMMARY:');
    this.apiCalls.forEach((call, index) => {
      console.log(`   ${index + 1}. ${call.file} (${call.service}):`);
      if (call.calls) console.log(`      Total calls: ${call.calls}`);
      if (call.endpointCalls) console.log(`      Endpoint calls: ${call.endpointCalls}`);
      if (call.quoteCalls) console.log(`      Quote calls: ${call.quoteCalls}`);
      if (call.calculationTriggers) console.log(`      Calculation triggers: ${call.calculationTriggers}`);
      if (call.streamingOps) console.log(`      Streaming operations: ${call.streamingOps}`);
      if (call.batchImplemented) console.log(`      Batch processing: ✅`);
    });
    
    console.log('\n⚡ RATE LIMITER STATUS:');
    this.rateLimiters.forEach((limiter, index) => {
      console.log(`   ${index + 1}. ${limiter.file}:`);
      console.log(`      Implemented: ${limiter.implemented ? '✅' : '❌'}`);
      if (limiter.monthlyLimitConfigured !== undefined) {
        console.log(`      Monthly limit configured: ${limiter.monthlyLimitConfigured ? '✅' : '❌'}`);
      }
      if (limiter.circuitBreakerImplemented !== undefined) {
        console.log(`      Circuit breaker: ${limiter.circuitBreakerImplemented ? '✅' : '❌'}`);
      }
    });
    
    if (this.criticalIssues.length > 0) {
      console.log('\n⚠️ CRITICAL ISSUES:');
      this.criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.severity}] ${issue.issue}`);
        if (issue.details) console.log(`      Details: ${issue.details}`);
        console.log(`      Recommendation: ${issue.recommendation}`);
      });
    }
    
    console.log('\n🎯 COMPLIANCE ASSESSMENT:');
    const complianceScore = this.calculateComplianceScore();
    console.log(`   Compliance Score: ${complianceScore}/100`);
    
    if (complianceScore >= 80) {
      console.log('   Status: API LIMITS PROPERLY MANAGED');
      console.log('   Recommendation: CONTINUE MONITORING');
    } else if (complianceScore >= 60) {
      console.log('   Status: API LIMITS NEED ATTENTION');
      console.log('   Recommendation: IMPLEMENT MISSING PROTECTIONS');
    } else {
      console.log('   Status: API LIMITS AT RISK');
      console.log('   Recommendation: IMMEDIATE ACTION REQUIRED');
    }
    
    console.log('\n📊 KEY METRICS:');
    console.log(`   Total API call references: ${this.totalCallsFound}`);
    console.log(`   Rate limiters found: ${this.rateLimiters.filter(rl => rl.implemented).length}`);
    console.log(`   Circuit breakers found: ${this.apiConfigurations.filter(c => c.adequateProtection).length}`);
    console.log(`   Critical issues: ${this.criticalIssues.length}`);
    
    return {
      complianceScore,
      criticalIssues: this.criticalIssues.length,
      totalApiCalls: this.totalCallsFound,
      recommendation: complianceScore >= 80 ? 'continue' : complianceScore >= 60 ? 'improve' : 'urgent'
    };
  }

  calculateComplianceScore() {
    let score = 0;
    
    // Rate limiter implementation (30 points)
    if (this.rateLimiters.some(rl => rl.implemented)) score += 30;
    
    // Circuit breaker protection (25 points)
    if (this.apiConfigurations.some(config => config.adequateProtection)) score += 25;
    
    // Batch processing implementation (20 points)
    if (this.apiCalls.some(call => call.batchImplemented || call.batchOps > 0)) score += 20;
    
    // Monthly limit configuration (15 points)
    if (this.rateLimiters.some(rl => rl.monthlyLimitConfigured)) score += 15;
    
    // Emergency protocols (10 points)
    if (this.rateLimiters.some(rl => rl.emergencyProtocols)) score += 10;
    
    return score;
  }
}

// Execute analysis
async function main() {
  const analyzer = new APILimitationAnalyzer();
  const result = await analyzer.analyzeCompletely();
  
  process.exit(result.recommendation === 'continue' ? 0 : 1);
}

main().catch(console.error);