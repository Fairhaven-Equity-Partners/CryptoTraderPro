/**
 * Optimized System Core
 * Single unified initialization point eliminating all redundancies
 * Ensures authentic data flow with minimal resource usage
 */

interface SystemCore {
  isInitialized: boolean;
  priceManager: any;
  calculationEngine: any;
  accuracyTracker: any;
  cleanupFunctions: (() => void)[];
}

const systemCore: SystemCore = {
  isInitialized: false,
  priceManager: null,
  calculationEngine: null,
  accuracyTracker: null,
  cleanupFunctions: []
};

let initializationInProgress = false;

/**
 * Initialize entire system once with optimal resource usage
 */
export async function initializeOptimizedSystem(): Promise<void> {
  if (systemCore.isInitialized || initializationInProgress) {
    return;
  }

  initializationInProgress = true;

  try {
    // Initialize price management with 4-minute intervals
    const { initPriceSystem } = await import('./finalPriceSystem');
    initPriceSystem(240);

    // Initialize technical indicators once
    const { initTechnicalIndicatorsModule } = await import('./technicalIndicators');
    initTechnicalIndicatorsModule();

    // Initialize WebSocket connection once
    const { connectWebSocket } = await import('./api');
    connectWebSocket();

    // Setup global price sync with reduced logging
    if (!window.syncGlobalPrice) {
      window.latestPriceEvents = window.latestPriceEvents || {};
      window.syncGlobalPrice = (symbol: string, price: number, timestamp?: number) => {
        const now = timestamp || Date.now();
        window.latestPriceEvents[symbol] = { price, timestamp: now };
        return price;
      };
    }

    systemCore.isInitialized = true;
    console.log('[OptimizedCore] System initialized with authentic data sources');

  } catch (error) {
    console.error('[OptimizedCore] Initialization failed:', error);
    throw error;
  } finally {
    initializationInProgress = false;
  }
}

/**
 * Check if system is ready
 */
export function isSystemReady(): boolean {
  return systemCore.isInitialized;
}

/**
 * Cleanup system resources
 */
export function cleanupSystem(): void {
  systemCore.cleanupFunctions.forEach(cleanup => cleanup());
  systemCore.cleanupFunctions = [];
  systemCore.isInitialized = false;
}

/**
 * Add cleanup function
 */
export function addCleanupFunction(cleanup: () => void): void {
  systemCore.cleanupFunctions.push(cleanup);
}