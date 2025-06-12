/**
 * Master System Controller
 * Single source of truth for all system initialization and timer management
 * Eliminates all redundant initializations and synchronizes timers properly
 */

let isSystemActive = false;
let masterTimer: number | null = null;
let countdownSeconds = 240; // Exactly 4 minutes for CoinGecko compliance

interface SystemComponents {
  priceSystem: boolean;
  technicalIndicators: boolean;
  webSocket: boolean;
  calculationEngine: boolean;
}

const componentStatus: SystemComponents = {
  priceSystem: false,
  technicalIndicators: false,
  webSocket: false,
  calculationEngine: false
};

/**
 * Initialize the master system controller
 * This is the ONLY function that should be called to start the system
 */
export async function initializeMasterSystem(): Promise<void> {
  if (isSystemActive) {return;
  }

  try {// Initialize core components exactly once
    await initializeComponents();

    // Disabled timer - using UltimateManager timer only
    // startMasterTimer();

    // Setup global price sync function
    setupGlobalPriceSync();

    isSystemActive = true;} catch (error) {
    console.error('[MasterController] Initialization failed:', error);
    throw error;
  }
}

/**
 * Initialize all system components exactly once
 */
async function initializeComponents(): Promise<void> {
  // Technical indicators
  if (!componentStatus.technicalIndicators) {
    const { initTechnicalIndicatorsModule } = await import('./technicalIndicators');
    initTechnicalIndicatorsModule();
    componentStatus.technicalIndicators = true;
  }

  // WebSocket connection
  if (!componentStatus.webSocket) {
    const { connectWebSocket } = await import('./api');
    connectWebSocket();
    componentStatus.webSocket = true;
  }

  // Mark other components as ready
  componentStatus.priceSystem = true;
  componentStatus.calculationEngine = true;
}

/**
 * Start the master timer that controls all system timing
 */
function startMasterTimer(): void {
  if (masterTimer) {
    clearInterval(masterTimer);
  }

  countdownSeconds = 240; // Start at exactly 4 minutes

  masterTimer = window.setInterval(() => {
    countdownSeconds -= 1;

    // Log countdown every 10 seconds to reduce spam
    if (countdownSeconds % 10 === 0) {}

    // When timer reaches zero, trigger price fetch and reset
    if (countdownSeconds <= 0) {triggerPriceFetch();
      countdownSeconds = 240; // Reset to exactly 4 minutes
    }
  }, 1000);
}

/**
 * Trigger price fetch for the main symbol
 */
async function triggerPriceFetch(): Promise<void> {
  try {
    // Fetch price for BTC/USDT as the primary symbol
    const response = await fetch('/api/crypto/BTC/USDT');
    if (response.ok) {
      const data = await response.json();// Update global price events
      if (window.syncGlobalPrice) {
        window.syncGlobalPrice('BTC/USDT', data.currentPrice, Date.now());
      }
    }
  } catch (error) {
    console.error('[MasterController] Error fetching price:', error);
  }
}

/**
 * Setup global price synchronization function
 */
function setupGlobalPriceSync(): void {
  if (!window.syncGlobalPrice) {
    window.latestPriceEvents = window.latestPriceEvents || {};
    window.syncGlobalPrice = (symbol: string, price: number, timestamp?: number) => {
      const now = timestamp || Date.now();
      window.latestPriceEvents![symbol] = { price, timestamp: now };
      return price;
    };
  }
}

/**
 * Get current system status
 */
export function getSystemStatus(): { active: boolean; components: SystemComponents; nextFetch: number } {
  return {
    active: isSystemActive,
    components: { ...componentStatus },
    nextFetch: countdownSeconds
  };
}

/**
 * Cleanup the master system
 */
export function cleanupMasterSystem(): void {
  if (masterTimer) {
    clearInterval(masterTimer);
    masterTimer = null;
  }
  isSystemActive = false;
  Object.keys(componentStatus).forEach(key => {
    componentStatus[key as keyof SystemComponents] = false;
  });}