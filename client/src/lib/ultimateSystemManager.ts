/**
 * Ultimate System Manager
 * Final solution to eliminate ALL redundant initializations and synchronize timers
 * Single point of control for the entire cryptocurrency analysis platform
 */

let systemInitialized = false;
let masterTimerActive = false;
let ultimateTimer: number | null = null;
let countdownRemaining = 240; // Exactly 4 minutes
let calculationInProgress = false;
let lastCalculationTime = 0;

interface GlobalSystemState {
  initialized: boolean;
  timersActive: boolean;
  lastPriceFetch: number;
  activeComponents: Set<string>;
}

const systemState: GlobalSystemState = {
  initialized: false,
  timersActive: false,
  lastPriceFetch: 0,
  activeComponents: new Set()
};

/**
 * Initialize the ultimate system manager - THE ONLY INITIALIZATION FUNCTION
 */
export async function initializeUltimateSystem(): Promise<void> {
  // Prevent any duplicate initialization
  if (systemInitialized || systemState.initialized) {return;
  }try {
    // Mark system as initializing immediately
    systemInitialized = true;
    systemState.initialized = true;

    // Initialize only essential components
    await initializeEssentialComponents();

    // Trigger IMMEDIATE calculation on startup - eliminate 2-cycle delayawait performScheduledPriceFetch();
    
    // Force immediate signal generation for all components with chart data pre-loading
    await preloadChartDataForImmediate(['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT']);
    
    // Trigger immediate technical analysis calculation for ALL symbols
    setTimeout(() => {
      // Dispatch calculation event for all supported symbols
      const allSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'SOL/USDT', 'USDC/USD', 'ADA/USDT', 'AVAX/USDT', 'DOGE/USDT', 'TRX/USDT', 'TON/USDT', 'LINK/USDT', 'MATIC/USDT', 'SHIB/USDT', 'LTC/USDT', 'BCH/USDT', 'UNI/USDT', 'DOT/USDT', 'XLM/USDT', 'ATOM/USDT', 'XMR/USDT', 'ETC/USDT', 'HBAR/USDT', 'FIL/USDT', 'ICP/USDT', 'VET/USDT', 'APT/USDT', 'NEAR/USDT', 'AAVE/USDT', 'ARB/USDT', 'OP/USDT', 'MKR/USDT', 'GRT/USDT', 'STX/USDT', 'INJ/USDT', 'ALGO/USDT', 'LDO/USDT', 'THETA/USDT', 'SUI/USDT', 'RUNE/USDT', 'MANA/USDT', 'SAND/USDT', 'FET/USDT', 'RNDR/USDT', 'KAVA/USDT', 'MINA/USDT', 'FLOW/USDT', 'XTZ/USDT', 'BLUR/USDT', 'QNT/USDT'];
      
      allSymbols.forEach((symbol, index) => {
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('synchronized-calculation-trigger', {
            detail: { 
              interval: '4-minute', 
              symbol: symbol, 
              manual: false,
              immediate: true 
            }
          }));
        }, index * 50); // Stagger events to prevent overwhelming
      });
    }, 100); // Minimal delay to ensure components are ready

    // Start the ultimate synchronized timer
    startUltimateTimer();

    // Setup minimal global functions
    setupGlobalFunctions();} catch (error) {
    console.error('[UltimateManager] Initialization failed:', error);
    systemInitialized = false;
    systemState.initialized = false;
    throw error;
  }
}

/**
 * Initialize only the absolutely essential components
 */
async function initializeEssentialComponents(): Promise<void> {
  // Technical indicators (required for calculations)
  if (!systemState.activeComponents.has('technical')) {
    try {
      const { initTechnicalIndicatorsModule } = await import('./technicalIndicators');
      initTechnicalIndicatorsModule();
      systemState.activeComponents.add('technical');
    } catch (error) {}
  }

  // WebSocket connection (required for real-time data)
  if (!systemState.activeComponents.has('websocket')) {
    try {
      const { connectWebSocket } = await import('./api');
      connectWebSocket();
      systemState.activeComponents.add('websocket');
    } catch (error) {}
  }

  systemState.activeComponents.add('core');
}

/**
 * Start the ultimate synchronized timer - exactly 4 minutes
 */
function startUltimateTimer(): void {
  // Clear any existing timers
  if (ultimateTimer) {
    clearInterval(ultimateTimer);
  }

  // Prevent multiple timer instances
  if (masterTimerActive) {return;
  }

  countdownRemaining = 240; // Start at exactly 4 minutes
  masterTimerActive = true;

  ultimateTimer = window.setInterval(() => {
    countdownRemaining -= 1;

    // Optimized logging frequency for better performance
    if (countdownRemaining % 20 === 0) {}

    // Enhanced synchronized calculation trigger
    if (countdownRemaining <= 0) {performScheduledPriceFetch();
      
      // Enhanced event broadcasting for all components
      const syncEvent = new CustomEvent('synchronized-calculation-complete', {
        detail: { 
          timestamp: Date.now(), 
          interval: '4-minute',
          triggerType: 'automatic',
          systemState: 'active'
        }
      });
      
      window.dispatchEvent(syncEvent);
      document.dispatchEvent(syncEvent);
      
      countdownRemaining = 240; // Reset to exactly 4 minutes
    }
  }, 1000);
}

/**
 * Check if calculations are allowed based on 4-minute schedule
 */
export function isCalculationAllowed(): boolean {
  const now = Date.now();
  const timeSinceLastCalc = now - lastCalculationTime;
  
  // Only allow calculations every 4 minutes (240,000ms) OR if it's the first calculation
  return (timeSinceLastCalc >= 240000) || (lastCalculationTime === 0);
}

/**
 * Perform the scheduled price fetch for all 50 cryptocurrency pairs
 * ENHANCED: Ensures data availability before triggering calculations
 */
async function performScheduledPriceFetch(): Promise<void> {
  // Prevent overlapping calculations
  if (calculationInProgress) {return;
  }
  
  calculationInProgress = true;
  lastCalculationTime = Date.now();
  try {
    systemState.lastPriceFetch = Date.now();
    
    // Define all 50 supported symbols - each must use its own authentic price
    const allSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'SOL/USDT', 'USDC/USD', 'ADA/USDT', 'AVAX/USDT', 'DOGE/USDT', 'TRX/USDT', 'TON/USDT', 'LINK/USDT', 'MATIC/USDT', 'SHIB/USDT', 'LTC/USDT', 'BCH/USDT', 'UNI/USDT', 'DOT/USDT', 'XLM/USDT', 'ATOM/USDT', 'XMR/USDT', 'ETC/USDT', 'HBAR/USDT', 'FIL/USDT', 'ICP/USDT', 'VET/USDT', 'APT/USDT', 'NEAR/USDT', 'AAVE/USDT', 'ARB/USDT', 'OP/USDT', 'MKR/USDT', 'GRT/USDT', 'STX/USDT', 'INJ/USDT', 'ALGO/USDT', 'LDO/USDT', 'THETA/USDT', 'SUI/USDT', 'RUNE/USDT', 'MANA/USDT', 'SAND/USDT', 'FET/USDT', 'RNDR/USDT', 'KAVA/USDT', 'MINA/USDT', 'FLOW/USDT', 'XTZ/USDT', 'BLUR/USDT', 'QNT/USDT'];

    // Backend automated signal calculator handles authentic data generation for all 50 symbols
    // Trade simulations are created every 4 minutes with real market data// Trigger multi-pair fetch for market-wide heatmap
    try {
      const multiResponse = await fetch('/api/crypto/all-pairs');
      if (multiResponse.ok) {
        const multiData = await multiResponse.json();}
    } catch (error) {}
    
  } catch (error) {} finally {
    calculationInProgress = false;
  }
}

/**
 * Preload essential chart data for automated calculations
 */
async function preloadEssentialChartData(): Promise<void> {try {
    const { fetchChartData } = await import('./api');
    const essentialTimeframes = ['1h', '4h', '1d']; // Focus on key timeframes
    const prioritySymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']; // Start with major symbols
    
    // Preload essential data in parallel with error handling
    const preloadPromises = prioritySymbols.flatMap(symbol =>
      essentialTimeframes.map(async timeframe => {
        try {
          await fetchChartData(symbol, timeframe as any);
          return { symbol, timeframe, success: true };
        } catch (error) {return { symbol, timeframe, success: false };
        }
      })
    );
    
    const results = await Promise.all(preloadPromises);
    const successful = results.filter(r => r.success).length;} catch (error) {}
}

/**
 * Preload chart data for immediate analysis - eliminates 2-cycle delay
 */
async function preloadChartDataForImmediate(symbols: string[]): Promise<void> {const { fetchChartData } = await import('./api');
  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  
  // Preload data for all symbols and timeframes in parallel
  const preloadPromises = symbols.flatMap(symbol =>
    timeframes.map(timeframe =>
      fetchChartData(symbol, timeframe as any).catch(error => {return null;
      })
    )
  );
  
  await Promise.all(preloadPromises);}

/**
 * Setup minimal global functions
 */
function setupGlobalFunctions(): void {
  // Global price sync function
  if (!window.syncGlobalPrice) {
    window.latestPriceEvents = window.latestPriceEvents || {};
    window.syncGlobalPrice = (symbol: string, price: number, timestamp?: number) => {
      const now = timestamp || Date.now();
      window.latestPriceEvents![symbol] = { price, timestamp: now };
      return price;
    };
  }

  // Global system status function
  if (!window.getUltimateSystemStatus) {
    window.getUltimateSystemStatus = () => ({
      initialized: systemState.initialized,
      timerActive: masterTimerActive,
      nextFetch: countdownRemaining,
      components: Array.from(systemState.activeComponents)
    });
  }
}

/**
 * Get current system status
 */
export function getUltimateSystemStatus(): {
  initialized: boolean;
  timerActive: boolean;
  nextFetch: number;
  components: string[];
} {
  return {
    initialized: systemState.initialized,
    timerActive: masterTimerActive,
    nextFetch: countdownRemaining,
    components: Array.from(systemState.activeComponents)
  };
}

/**
 * Emergency system cleanup
 */
export function emergencyCleanup(): void {
  if (ultimateTimer) {
    clearInterval(ultimateTimer);
    ultimateTimer = null;
  }
  masterTimerActive = false;
  systemInitialized = false;
  systemState.initialized = false;
  systemState.activeComponents.clear();}

/**
 * Check if system is ready
 */
export function isUltimateSystemReady(): boolean {
  return systemInitialized && systemState.initialized && masterTimerActive;
}