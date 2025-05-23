// This file intercepts automatic calculation events
// to let the improved synced calculation system handle them instead

export function disableAllAutoCalculations() {
  console.log("[AUTO-CALC-DISABLED] Setting up event interceptor");
  
  // Intercept price update events
  window.addEventListener('live-price-update', (event) => {
    // Only allow forceRefresh events to pass through
    const customEvent = event as CustomEvent;
    if (customEvent.detail && customEvent.detail.forceRefresh) {
      console.log("[AUTO-CALC-DISABLED] Allowing force refresh event to pass through");
      return; // Allow this event to continue
    }
    
    // Stop propagation of other events
    event.stopImmediatePropagation();
    console.log("[AUTO-CALC-DISABLED] Intercepted and blocked event: live-price-update");
  }, true); // Capture phase to intercept before others
  
  // Intercept other events
  const eventsToBlock = [
    'price-fetching', 
    'price-update'
  ];
  
  eventsToBlock.forEach(eventName => {
    window.addEventListener(eventName, (event) => {
      event.stopImmediatePropagation();
      console.log(`[AUTO-CALC-DISABLED] Intercepted and blocked event: ${eventName}`);
    }, true); // Capture phase
  });
}