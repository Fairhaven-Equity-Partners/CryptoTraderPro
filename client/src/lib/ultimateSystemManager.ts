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
  if (systemInitialized || systemState.initialized) {
    console.log('[UltimateManager] System already initialized - preventing duplicate');
    return;
  }

  console.log('[UltimateManager] Starting FINAL system initialization');

  try {
    // Mark system as initializing immediately
    systemInitialized = true;
    systemState.initialized = true;

    // Initialize only essential components
    await initializeEssentialComponents();

    // Trigger IMMEDIATE calculation on startup - eliminate 2-cycle delay
    console.log('[UltimateManager] Triggering IMMEDIATE calculation to eliminate 2-cycle delay');
    await performScheduledPriceFetch();
    
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
    setupGlobalFunctions();

    console.log('[UltimateManager] System initialization complete - ALL timers synchronized to 240s');

  } catch (error) {
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
    } catch (error) {
      console.warn('[UltimateManager] Technical indicators init failed:', error);
    }
  }

  // WebSocket connection (required for real-time data)
  if (!systemState.activeComponents.has('websocket')) {
    try {
      const { connectWebSocket } = await import('./api');
      connectWebSocket();
      systemState.activeComponents.add('websocket');
    } catch (error) {
      console.warn('[UltimateManager] WebSocket init failed:', error);
    }
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
  if (masterTimerActive) {
    console.log('[UltimateManager] Timer already active - preventing duplicate');
    return;
  }

  countdownRemaining = 240; // Start at exactly 4 minutes
  masterTimerActive = true;

  ultimateTimer = window.setInterval(() => {
    countdownRemaining -= 1;

    // Optimized logging frequency for better performance
    if (countdownRemaining % 20 === 0) {
      console.log(`[UltimateManager] Next fetch in ${countdownRemaining}s`);
    }

    // Enhanced synchronized calculation trigger
    if (countdownRemaining <= 0) {
      console.log('[UltimateManager] 4-minute synchronized calculation starting');
      performScheduledPriceFetch();
      
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
  if (calculationInProgress) {
    console.log('[UltimateManager] Calculation already in progress - skipping');
    return;
  }
  
  calculationInProgress = true;
  lastCalculationTime = Date.now();
  try {
    systemState.lastPriceFetch = Date.now();
    
    // Define all 50 supported symbols - each must use its own authentic price
    const allSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'SOL/USDT', 'USDC/USD', 'ADA/USDT', 'AVAX/USDT', 'DOGE/USDT', 'TRX/USDT', 'TON/USDT', 'LINK/USDT', 'MATIC/USDT', 'SHIB/USDT', 'LTC/USDT', 'BCH/USDT', 'UNI/USDT', 'DOT/USDT', 'XLM/USDT', 'ATOM/USDT', 'XMR/USDT', 'ETC/USDT', 'HBAR/USDT', 'FIL/USDT', 'ICP/USDT', 'VET/USDT', 'APT/USDT', 'NEAR/USDT', 'AAVE/USDT', 'ARB/USDT', 'OP/USDT', 'MKR/USDT', 'GRT/USDT', 'STX/USDT', 'INJ/USDT', 'ALGO/USDT', 'LDO/USDT', 'THETA/USDT', 'SUI/USDT', 'RUNE/USDT', 'MANA/USDT', 'SAND/USDT', 'FET/USDT', 'RNDR/USDT', 'KAVA/USDT', 'MINA/USDT', 'FLOW/USDT', 'XTZ/USDT', 'BLUR/USDT', 'QNT/USDT'];

    // Fetch authentic price for each symbol independently
    for (const symbol of allSymbols) {
      try {
        // Use centralized price manager for each symbol
        if ((window as any).centralizedPriceManager) {
          const price = await (window as any).centralizedPriceManager.getPrice(symbol);
          if (price && typeof price === 'number') {
            console.log(`[UltimateManager] Price synchronized: ${symbol} = $${price}`);
            
            // Update global price for this specific symbol
            if ((window as any).syncGlobalPrice) {
              (window as any).syncGlobalPrice(symbol, price, Date.now());
            }

            // Trigger calculations for this symbol with its own authentic price
            if ((window as any).triggerSignalCalculation) {
              (window as any).triggerSignalCalculation(symbol, price);
            }
          }
        } else {
          // Fallback to direct API call for this specific symbol
          const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
          if (response.ok) {
            const data = await response.json();
            const symbolPrice = data.lastPrice || data.currentPrice;
            if (symbolPrice && typeof symbolPrice === 'number') {
              console.log(`[UltimateManager] Fallback price synchronized: ${symbol} = $${symbolPrice}`);
              
              // Update global price for this specific symbol
              if ((window as any).syncGlobalPrice) {
                (window as any).syncGlobalPrice(symbol, symbolPrice, Date.now());
              }

              // Trigger calculations for this symbol with its own authentic price
              if ((window as any).triggerSignalCalculation) {
                (window as any).triggerSignalCalculation(symbol, symbolPrice);
              }
            }
          }
        }
        
        // Small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.warn(`[UltimateManager] Failed to fetch price for ${symbol}:`, error);
      }
    }

    // Trigger multi-pair fetch for market-wide heatmap
    try {
      const multiResponse = await fetch('/api/crypto/all-pairs');
      if (multiResponse.ok) {
        const multiData = await multiResponse.json();
        console.log(`[UltimateManager] Multi-pair fetch: ${multiData.length} symbols updated`);
      }
    } catch (error) {
      console.warn('[UltimateManager] Multi-pair fetch unavailable');
    }
    
  } catch (error) {
    console.warn('[UltimateManager] Price fetch temporarily unavailable');
  } finally {
    calculationInProgress = false;
  }
}

/**
 * Preload essential chart data for automated calculations
 */
async function preloadEssentialChartData(): Promise<void> {
  console.log('[UltimateManager] Preloading essential chart data for automated calculations');
  
  try {
    const { fetchChartData } = await import('./api');
    const essentialTimeframes = ['1h', '4h', '1d']; // Focus on key timeframes
    const prioritySymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']; // Start with major symbols
    
    // Preload essential data in parallel with error handling
    const preloadPromises = prioritySymbols.flatMap(symbol =>
      essentialTimeframes.map(async timeframe => {
        try {
          await fetchChartData(symbol, timeframe as any);
          return { symbol, timeframe, success: true };
        } catch (error) {
          console.warn(`[UltimateManager] Failed to preload ${symbol} ${timeframe}:`, error);
          return { symbol, timeframe, success: false };
        }
      })
    );
    
    const results = await Promise.all(preloadPromises);
    const successful = results.filter(r => r.success).length;
    console.log(`[UltimateManager] Preloaded ${successful}/${results.length} essential data sets`);
    
  } catch (error) {
    console.warn('[UltimateManager] Chart data preloading failed:', error);
  }
}

/**
 * Preload chart data for immediate analysis - eliminates 2-cycle delay
 */
async function preloadChartDataForImmediate(symbols: string[]): Promise<void> {
  console.log('[UltimateManager] Preloading chart data for immediate analysis');
  
  const { fetchChartData } = await import('./api');
  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  
  // Preload data for all symbols and timeframes in parallel
  const preloadPromises = symbols.flatMap(symbol =>
    timeframes.map(timeframe =>
      fetchChartData(symbol, timeframe as any).catch(error => {
        console.warn(`Failed to preload ${symbol} ${timeframe}:`, error);
        return null;
      })
    )
  );
  
  await Promise.all(preloadPromises);
  console.log('[UltimateManager] Chart data preloading completed');
}

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
  systemState.activeComponents.clear();
  console.log('[UltimateManager] Emergency cleanup completed');
}

/**
 * Check if system is ready
 */
export function isUltimateSystemReady(): boolean {
  return systemInitialized && systemState.initialized && masterTimerActive;
}