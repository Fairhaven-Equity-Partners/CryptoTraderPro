/**
 * UI Component Validator
 * Specialized testing for frontend UI components and visual elements
 * Validates data display accuracy, user interactions, and real-time updates
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class UIComponentValidator {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      components: new Map(),
      interactions: new Map(),
      realTimeUpdates: new Map(),
      visualValidation: new Map(),
      errors: []
    };
    
    this.baseUrl = 'http://localhost:5000';
    this.testComponents = [
      'price-overview',
      'market-heatmap', 
      'signal-dashboard',
      'trade-recommendations',
      'performance-charts',
      'automation-controls',
      'navigation-menu',
      'error-boundaries'
    ];
  }

  /**
   * Initialize browser for UI testing
   */
  async initializeBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      // Set up console logging
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          this.testResults.errors.push({
            type: 'console_error',
            message: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      return true;
    } catch (error) {
      console.log('Browser not available for UI testing, using API-only validation');
      return false;
    }
  }

  /**
   * Run UI validation tests
   */
  async runUIValidation(cycles = 20) {
    console.log('🎨 Starting UI Component Validation');
    console.log(`📊 Testing ${this.testComponents.length} components across ${cycles} cycles`);
    
    const browserAvailable = await this.initializeBrowser();
    
    for (let cycle = 1; cycle <= cycles; cycle++) {
      console.log(`\n🔄 UI Validation Cycle ${cycle}/${cycles}`);
      
      if (browserAvailable) {
        await this.validateVisualComponents(cycle);
        await this.validateUserInteractions(cycle);
        await this.validateRealTimeUpdates(cycle);
      }
      
      await this.validateDataAccuracy(cycle);
      await this.validateErrorHandling(cycle);
      
      if (cycle % 5 === 0) {
        this.generateUIReport(cycle);
      }
      
      await this.sleep(1500);
    }
    
    if (browserAvailable) {
      await this.browser.close();
    }
    
    return this.generateFinalUIReport();
  }

  /**
   * Validate visual components and layout
   */
  async validateVisualComponents(cycle) {
    if (!this.page) return;
    
    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
      
      for (const component of this.testComponents) {
        const componentResult = await this.testVisualComponent(component);
        
        if (!this.testResults.components.has(component)) {
          this.testResults.components.set(component, []);
        }
        this.testResults.components.get(component).push({
          cycle,
          ...componentResult,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      this.testResults.errors.push({
        type: 'visual_validation_error',
        cycle,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test individual visual component
   */
  async testVisualComponent(componentName) {
    const selectors = this.getComponentSelectors(componentName);
    const result = {
      component: componentName,
      visible: false,
      dataLoaded: false,
      responsive: false,
      errors: []
    };
    
    try {
      // Check component visibility
      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) {
          result.visible = true;
          
          // Check if data is loaded
          const hasContent = await this.page.evaluate(el => {
            return el.textContent.trim().length > 0 && 
                   !el.textContent.includes('Loading') &&
                   !el.textContent.includes('Error');
          }, element);
          
          if (hasContent) {
            result.dataLoaded = true;
          }
          
          // Check responsiveness
          const boundingBox = await element.boundingBox();
          if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0) {
            result.responsive = true;
          }
          
          break;
        }
      }
    } catch (error) {
      result.errors.push(error.message);
    }
    
    return result;
  }

  /**
   * Get CSS selectors for components
   */
  getComponentSelectors(componentName) {
    const selectorMap = {
      'price-overview': [
        '[data-testid="price-overview"]',
        '.price-display',
        '.crypto-price'
      ],
      'market-heatmap': [
        '[data-testid="market-heatmap"]',
        '.heatmap-container',
        '.market-grid'
      ],
      'signal-dashboard': [
        '[data-testid="signal-dashboard"]',
        '.signals-container',
        '.trading-signals'
      ],
      'trade-recommendations': [
        '[data-testid="trade-recommendations"]',
        '.recommendations',
        '.trade-advice'
      ],
      'performance-charts': [
        '[data-testid="performance-charts"]',
        '.chart-container',
        'canvas'
      ],
      'automation-controls': [
        '[data-testid="automation-controls"]',
        '.automation-panel',
        '.control-buttons'
      ],
      'navigation-menu': [
        '[data-testid="navigation"]',
        '.nav-menu',
        'nav'
      ],
      'error-boundaries': [
        '[data-testid="error-boundary"]',
        '.error-message',
        '.error-state'
      ]
    };
    
    return selectorMap[componentName] || [`[data-testid="${componentName}"]`];
  }

  /**
   * Validate user interactions
   */
  async validateUserInteractions(cycle) {
    if (!this.page) return;
    
    const interactions = [
      'symbol-selection',
      'timeframe-change', 
      'refresh-data',
      'toggle-automation'
    ];
    
    for (const interaction of interactions) {
      try {
        const result = await this.testInteraction(interaction);
        
        if (!this.testResults.interactions.has(interaction)) {
          this.testResults.interactions.set(interaction, []);
        }
        this.testResults.interactions.get(interaction).push({
          cycle,
          ...result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.testResults.errors.push({
          type: 'interaction_error',
          interaction,
          cycle,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Test specific user interaction
   */
  async testInteraction(interactionType) {
    const result = {
      interaction: interactionType,
      successful: false,
      responseTime: 0,
      dataChanged: false
    };
    
    const startTime = Date.now();
    
    try {
      switch (interactionType) {
        case 'symbol-selection':
          result.successful = await this.testSymbolSelection();
          break;
        case 'timeframe-change':
          result.successful = await this.testTimeframeChange();
          break;
        case 'refresh-data':
          result.successful = await this.testDataRefresh();
          break;
        case 'toggle-automation':
          result.successful = await this.testAutomationToggle();
          break;
      }
      
      result.responseTime = Date.now() - startTime;
    } catch (error) {
      result.error = error.message;
    }
    
    return result;
  }

  /**
   * Test symbol selection functionality
   */
  async testSymbolSelection() {
    try {
      // Look for symbol selector
      const selectors = [
        'select[data-testid="symbol-selector"]',
        '.symbol-dropdown',
        'button[data-symbol]'
      ];
      
      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(500);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test timeframe change functionality
   */
  async testTimeframeChange() {
    try {
      const selectors = [
        'button[data-timeframe]',
        '.timeframe-selector button',
        '[data-testid="timeframe-1h"]'
      ];
      
      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(500);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test data refresh functionality
   */
  async testDataRefresh() {
    try {
      const selectors = [
        'button[data-testid="refresh"]',
        '.refresh-button',
        'button[aria-label*="refresh"]'
      ];
      
      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(1000);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test automation toggle
   */
  async testAutomationToggle() {
    try {
      const selectors = [
        'button[data-testid="automation-toggle"]',
        '.automation-switch',
        'input[type="checkbox"][data-automation]'
      ];
      
      for (const selector of selectors) {
        const element = await this.page.$(selector);
        if (element) {
          await element.click();
          await this.page.waitForTimeout(500);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate real-time updates
   */
  async validateRealTimeUpdates(cycle) {
    if (!this.page) return;
    
    try {
      // Monitor for DOM changes over time
      const initialContent = await this.page.evaluate(() => {
        const priceElements = document.querySelectorAll('.price, .crypto-price, [data-price]');
        return Array.from(priceElements).map(el => el.textContent);
      });
      
      // Wait and check for updates
      await this.page.waitForTimeout(3000);
      
      const updatedContent = await this.page.evaluate(() => {
        const priceElements = document.querySelectorAll('.price, .crypto-price, [data-price]');
        return Array.from(priceElements).map(el => el.textContent);
      });
      
      const hasUpdates = JSON.stringify(initialContent) !== JSON.stringify(updatedContent);
      
      if (!this.testResults.realTimeUpdates.has('price-updates')) {
        this.testResults.realTimeUpdates.set('price-updates', []);
      }
      
      this.testResults.realTimeUpdates.get('price-updates').push({
        cycle,
        hasUpdates,
        elementsFound: initialContent.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.testResults.errors.push({
        type: 'realtime_validation_error',
        cycle,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate data accuracy against API
   */
  async validateDataAccuracy(cycle) {
    try {
      // Fetch data from API
      const apiData = await this.fetchAPIData();
      
      // If browser available, compare with UI
      if (this.page) {
        const uiData = await this.extractUIData();
        const accuracy = this.compareDataAccuracy(apiData, uiData);
        
        if (!this.testResults.visualValidation.has('data-accuracy')) {
          this.testResults.visualValidation.set('data-accuracy', []);
        }
        
        this.testResults.visualValidation.get('data-accuracy').push({
          cycle,
          accuracy,
          apiDataPoints: Object.keys(apiData).length,
          uiDataPoints: Object.keys(uiData).length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      this.testResults.errors.push({
        type: 'data_accuracy_error',
        cycle,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Fetch reference data from API
   */
  async fetchAPIData() {
    const endpoints = [
      '/api/crypto/BTC/USDT',
      '/api/automation/status',
      '/api/timing/metrics',
      '/api/market-heatmap'
    ];
    
    const data = {};
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        if (response.ok) {
          data[endpoint] = await response.json();
        }
      } catch (error) {
        console.log(`Failed to fetch ${endpoint}: ${error.message}`);
      }
    }
    
    return data;
  }

  /**
   * Extract data from UI elements
   */
  async extractUIData() {
    if (!this.page) return {};
    
    try {
      return await this.page.evaluate(() => {
        const data = {};
        
        // Extract price data
        const priceElements = document.querySelectorAll('[data-price], .price, .crypto-price');
        data.prices = Array.from(priceElements).map(el => ({
          text: el.textContent,
          value: parseFloat(el.textContent.replace(/[^0-9.-]/g, ''))
        }));
        
        // Extract status indicators
        const statusElements = document.querySelectorAll('[data-status], .status, .automation-status');
        data.statuses = Array.from(statusElements).map(el => el.textContent);
        
        // Extract signals
        const signalElements = document.querySelectorAll('[data-signal], .signal, .trade-signal');
        data.signals = Array.from(signalElements).map(el => el.textContent);
        
        return data;
      });
    } catch (error) {
      return {};
    }
  }

  /**
   * Compare API data with UI data for accuracy
   */
  compareDataAccuracy(apiData, uiData) {
    let matches = 0;
    let total = 0;
    
    // Compare prices if available
    if (apiData['/api/crypto/BTC/USDT']?.lastPrice && uiData.prices?.length > 0) {
      const apiPrice = apiData['/api/crypto/BTC/USDT'].lastPrice;
      const uiPrices = uiData.prices.map(p => p.value).filter(v => !isNaN(v));
      
      for (const uiPrice of uiPrices) {
        total++;
        if (Math.abs(apiPrice - uiPrice) / apiPrice < 0.01) { // 1% tolerance
          matches++;
        }
      }
    }
    
    // Compare automation status
    if (apiData['/api/automation/status']?.isRunning !== undefined && uiData.statuses?.length > 0) {
      const apiStatus = apiData['/api/automation/status'].isRunning;
      const uiStatusText = uiData.statuses.join(' ').toLowerCase();
      
      total++;
      if ((apiStatus && uiStatusText.includes('running')) || 
          (!apiStatus && uiStatusText.includes('stopped'))) {
        matches++;
      }
    }
    
    return total > 0 ? (matches / total) * 100 : 0;
  }

  /**
   * Validate error handling
   */
  async validateErrorHandling(cycle) {
    try {
      // Test error scenarios
      const errorTests = [
        { name: 'invalid-symbol', url: `${this.baseUrl}/api/crypto/INVALID/USDT` },
        { name: 'missing-endpoint', url: `${this.baseUrl}/api/nonexistent` },
        { name: 'malformed-request', url: `${this.baseUrl}/api/crypto/` }
      ];
      
      for (const test of errorTests) {
        try {
          const response = await fetch(test.url);
          const hasProperErrorHandling = !response.ok && response.status >= 400;
          
          if (!this.testResults.visualValidation.has('error-handling')) {
            this.testResults.visualValidation.set('error-handling', []);
          }
          
          this.testResults.visualValidation.get('error-handling').push({
            cycle,
            test: test.name,
            properErrorHandling: hasProperErrorHandling,
            statusCode: response.status,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          // Network errors are also valid error handling
        }
      }
    } catch (error) {
      this.testResults.errors.push({
        type: 'error_handling_test_error',
        cycle,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Generate progress report
   */
  generateUIReport(cycle) {
    console.log(`\n📊 UI Validation Report - Cycle ${cycle}`);
    console.log('-'.repeat(50));
    
    const componentStats = this.calculateComponentStats();
    const interactionStats = this.calculateInteractionStats();
    
    console.log(`✅ Components visible: ${componentStats.visible}/${this.testComponents.length}`);
    console.log(`📊 Data loaded: ${componentStats.dataLoaded}%`);
    console.log(`🖱️  Interactions working: ${interactionStats.successful}%`);
    console.log(`⚠️  UI errors: ${this.testResults.errors.filter(e => e.cycle <= cycle).length}`);
  }

  /**
   * Calculate component statistics
   */
  calculateComponentStats() {
    let visible = 0;
    let dataLoaded = 0;
    let total = 0;
    
    for (const [component, results] of this.testResults.components) {
      const latest = results[results.length - 1];
      if (latest) {
        total++;
        if (latest.visible) visible++;
        if (latest.dataLoaded) dataLoaded++;
      }
    }
    
    return {
      visible,
      dataLoaded: total > 0 ? Math.round((dataLoaded / total) * 100) : 0,
      total
    };
  }

  /**
   * Calculate interaction statistics
   */
  calculateInteractionStats() {
    let successful = 0;
    let total = 0;
    
    for (const [interaction, results] of this.testResults.interactions) {
      const latest = results[results.length - 1];
      if (latest) {
        total++;
        if (latest.successful) successful++;
      }
    }
    
    return {
      successful: total > 0 ? Math.round((successful / total) * 100) : 0,
      total
    };
  }

  /**
   * Generate final UI report
   */
  generateFinalUIReport() {
    const report = {
      summary: {
        componentsTested: this.testComponents.length,
        totalErrors: this.testResults.errors.length,
        ...this.calculateComponentStats(),
        ...this.calculateInteractionStats()
      },
      components: Object.fromEntries(this.testResults.components),
      interactions: Object.fromEntries(this.testResults.interactions),
      realTimeUpdates: Object.fromEntries(this.testResults.realTimeUpdates),
      visualValidation: Object.fromEntries(this.testResults.visualValidation),
      errors: this.testResults.errors,
      timestamp: new Date().toISOString()
    };
    
    // Save report
    fs.writeFileSync('ui_validation_report.json', JSON.stringify(report, null, 2));
    
    console.log('\n🎨 UI Validation Complete');
    console.log(`📄 Report saved to: ui_validation_report.json`);
    
    return report;
  }

  /**
   * Utility methods
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = UIComponentValidator;

// Run if called directly
if (require.main === module) {
  const validator = new UIComponentValidator();
  validator.runUIValidation(20).catch(console.error);
}