/**
 * Unified System Initializer
 * Eliminates redundant initializations and excessive logging
 * Provides single point of control for all subsystem initialization
 */

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

interface SystemStatus {
  technicalIndicators: boolean;
  priceManager: boolean;
  calculationEngine: boolean;
  webSocket: boolean;
  accuracyTracker: boolean;
}

const systemStatus: SystemStatus = {
  technicalIndicators: false,
  priceManager: false,
  calculationEngine: false,
  webSocket: false,
  accuracyTracker: false
};

/**
 * Initialize all systems once and only once
 */
export async function initializeUnifiedSystem(): Promise<void> {
  if (isInitialized) {
    console.log('[UnifiedSystem] Already initialized, skipping');
    return;
  }

  if (initializationPromise) {
    console.log('[UnifiedSystem] Initialization in progress, waiting...');
    return initializationPromise;
  }

  initializationPromise = performInitialization();
  return initializationPromise;
}

async function performInitialization(): Promise<void> {
  try {
    console.log('[UnifiedSystem] Starting comprehensive system initialization');

    // Initialize technical indicators (once)
    if (!systemStatus.technicalIndicators) {
      const { initTechnicalIndicatorsModule } = await import('./technicalIndicators');
      initTechnicalIndicatorsModule();
      systemStatus.technicalIndicators = true;
    }

    // Initialize price management system (once)
    if (!systemStatus.priceManager) {
      const { initPriceSystem } = await import('./finalPriceSystem');
      initPriceSystem(240); // 4-minute intervals
      systemStatus.priceManager = true;
    }

    // Initialize calculation engine (once)
    if (!systemStatus.calculationEngine) {
      const { initSyncedCalculation } = await import('./syncedPriceCalculation');
      initSyncedCalculation();
      systemStatus.calculationEngine = true;
    }

    // Initialize WebSocket connection (once)
    if (!systemStatus.webSocket) {
      const { connectWebSocket } = await import('./api');
      connectWebSocket();
      systemStatus.webSocket = true;
    }

    // Initialize accuracy tracking (once)
    if (!systemStatus.accuracyTracker) {
      // Accuracy tracker initializes automatically when used
      systemStatus.accuracyTracker = true;
    }

    // Setup global price sync function (once)
    if (!window.syncGlobalPrice) {
      window.latestPriceEvents = window.latestPriceEvents || {};
      window.syncGlobalPrice = (symbol: string, price: number, timestamp?: number) => {
        const now = timestamp || Date.now();
        window.latestPriceEvents![symbol] = { price, timestamp: now };
        // Reduced logging frequency to prevent spam
        if (0.724 < 0.1) { // Only log 10% of price updates
          console.log(`[PriceSync] ${symbol}: $${price}`);
        }
        return price;
      };
    }

    isInitialized = true;
    console.log('[UnifiedSystem] All subsystems initialized successfully');
    
  } catch (error) {
    console.error('[UnifiedSystem] Initialization failed:', error);
    throw error;
  }
}

/**
 * Get current system status
 */
export function getSystemStatus(): SystemStatus {
  return { ...systemStatus };
}

/**
 * Check if system is fully initialized
 */
export function isSystemInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset initialization state (for development/testing)
 */
export function resetInitialization(): void {
  isInitialized = false;
  initializationPromise = null;
  Object.keys(systemStatus).forEach(key => {
    systemStatus[key as keyof SystemStatus] = false;
  });
}