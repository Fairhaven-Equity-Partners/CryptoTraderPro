/**
 * Ultimate System Manager
 * Final solution to eliminate ALL redundant initializations and synchronize timers
 * Single point of control for the entire cryptocurrency analysis platform
 */

let systemInitialized = false;
let masterTimerActive = false;
let ultimateTimer: number | null = null;
let countdownRemaining = 240; // Exactly 4 minutes

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

    // Trigger immediate calculation on startup
    console.log('[UltimateManager] Triggering immediate calculation on startup');
    await performScheduledPriceFetch();

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

    // Log every 10 seconds to reduce spam
    if (countdownRemaining % 10 === 0) {
      console.log(`[UltimateManager] Next fetch in ${countdownRemaining}s`);
    }

    // When countdown reaches zero
    if (countdownRemaining <= 0) {
      console.log('[UltimateManager] 4-minute interval reached - triggering synchronized calculation');
      performScheduledPriceFetch();
      
      // Broadcast synchronized calculation event to all components
      window.dispatchEvent(new CustomEvent('synchronized-calculation-complete', {
        detail: { timestamp: Date.now(), interval: '4-minute' }
      }));
      
      countdownRemaining = 240; // Reset to exactly 4 minutes
    }
  }, 1000);
}

/**
 * Perform the scheduled price fetch for all 50 cryptocurrency pairs
 */
async function performScheduledPriceFetch(): Promise<void> {
  try {
    systemState.lastPriceFetch = Date.now();

    // Fetch BTC/USDT price as primary symbol
    const response = await fetch('/api/crypto/BTC/USDT');
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.currentPrice === 'number') {
        console.log(`[UltimateManager] Primary price synchronized: BTC/USDT = $${data.currentPrice}`);
        
        // Update global price if function exists
        if (window.syncGlobalPrice) {
          window.syncGlobalPrice('BTC/USDT', data.currentPrice, Date.now());
        }

        // Trigger immediate signal calculations if this is startup
        if (window.triggerSignalCalculation) {
          console.log('[UltimateManager] Triggering immediate signal calculations');
          window.triggerSignalCalculation('BTC/USDT', data.currentPrice);
        }
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
  }
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