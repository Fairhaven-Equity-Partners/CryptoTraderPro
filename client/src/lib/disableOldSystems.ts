/**
 * Disable Old Calculation Systems
 * 
 * This module disables all the conflicting calculation trigger systems
 * to prevent multiple simultaneous calculations and price mismatches.
 */

// Disable all old calculation systems by overriding their functions
const disableOldSystems = () => {
  console.log('[SystemCleanup] Disabling conflicting calculation systems');
  
  // Disable simpleCalcTrigger
  if (typeof window !== 'undefined') {
    // Override event listeners to prevent duplicate calculations
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      // Block calculation-related events from old systems
      if (type === 'simple-calc-trigger' || 
          type === 'calculation-trigger' || 
          type === 'auto-calculation' ||
          type === 'streamlined-calculation') {
        console.log(`[SystemCleanup] Blocked old event listener: ${type}`);
        return;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Clear any existing timers from old systems
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    const highestIntervalId = setInterval(() => {}, 999999);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
    clearInterval(highestIntervalId);
    
    console.log('[SystemCleanup] Cleared all existing timers and intervals');
  }
};

// Run cleanup immediately
disableOldSystems();

export { disableOldSystems };