/**
 * Auto Calculation System
 * 
 * This lightweight system coordinates automatic market analysis calculations
 * whenever price updates occur, maintaining the same display format.
 */

let isInitialized = false;

/**
 * Initialize the auto calculation system
 */
export function initAutoCalculationSystem() {
  if (isInitialized) {
    console.log('Auto calculation system already initialized');
    return;
  }
  
  console.log('✅ Initializing automatic calculation system');
  
  // Event listeners have been moved to the AdvancedSignalDashboard component
  // to prevent duplicate calculations across multiple systems
  console.log('✅ Auto calculation system initialized - using centralized event handling');
  
  isInitialized = true;
  
  return () => {
    // Event listeners have been moved, so no need to clean them up here
    isInitialized = false;
  };
}

/**
 * Handle price update events
 * NOTE: This function is no longer used as event listeners are now in the AdvancedSignalDashboard
 * Keeping it for reference only
 */
function handlePriceUpdate(event: Event) {
  // This function has been moved to AdvancedSignalDashboard for central management
  console.log('Legacy price handler called - should not happen');
}

/**
 * Check if auto calculation is enabled
 */
export function isAutoCalculationEnabled(): boolean {
  return isInitialized;
}

/**
 * Manually toggle auto calculation
 */
export function toggleAutoCalculation(enable: boolean): boolean {
  if (enable && !isInitialized) {
    initAutoCalculationSystem();
    return true;
  } else if (!enable && isInitialized) {
    // Event listeners have been moved to AdvancedSignalDashboard
    // so no need to remove them here
    isInitialized = false;
    return false;
  }
  return isInitialized;
}