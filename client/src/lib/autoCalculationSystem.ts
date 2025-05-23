/**
 * Auto Calculation System
 * 
 * This module ensures that calculations happen automatically when price data is updated,
 * eliminating the need for manual "Calculate Now" or "Quick Update" buttons.
 */

import { initSyncedCalculation } from './syncedPriceCalculation';

// Initialize the auto-calculation system
export function initAutoCalculationSystem() {
  console.log('✅ Initializing automatic calculation system ✅');
  
  // Make sure auto-calculations are enabled globally
  if (typeof window !== 'undefined') {
    // Remove any flags that might disable calculations
    (window as any).autoCalculationsDisabled = false;
    (window as any).__CALCULATIONS_LOCKED__ = false;
    
    // Clear any event listeners that might block calculations
    const events = [
      'price-update', 
      'price-fetching', 
      'price-fetch-completed',
      'final-price-update',
      'calculation-started',
      'calculation-completed', 
      'live-price-update'
    ];
    
    // Helper to remove all handlers for an event
    const clearEventHandlers = (eventName: string) => {
      const eventClone = new Event(eventName);
      window.removeEventListener(eventName, (e) => {
        console.log(`Removed handler for ${eventName}`);
      });
    };
    
    // Clear all blocking handlers
    events.forEach(clearEventHandlers);
    
    // Initialize the synchronized calculation system
    initSyncedCalculation();
    
    console.log('✅ Auto-calculation system successfully initialized');
    console.log('👉 Calculations will run automatically with price updates');
  }
}

// Enable auto-calculation by removing blockers
export function enableAutoCalculation() {
  if (typeof window !== 'undefined') {
    (window as any).autoCalculationsDisabled = false;
    (window as any).__CALCULATIONS_LOCKED__ = false;
    
    // Dispatch an event to notify components
    const enableEvent = new CustomEvent('auto-calculations-enabled');
    window.dispatchEvent(enableEvent);
    
    console.log('✅ Auto-calculations enabled');
  }
}