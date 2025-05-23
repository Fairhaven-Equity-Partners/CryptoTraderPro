// Optimized price system that reduces redundant calculations
// and ensures synchronized updates across the application

// Declare global type to track initialization state
declare global {
  interface Window {
    _priceSystemInitialized?: boolean;
  }
}

// Main function to set up the price system
export function setupPriceSystem() {
  console.log("[FinalPriceSystem] Setting up optimized price system");
  
  // Avoid multiple initialization
  if (window._priceSystemInitialized) {
    console.log("[FinalPriceSystem] System already initialized");
    return;
  }
  
  window._priceSystemInitialized = true;
  
  // Setup interval for automatic price fetching
  const fetchIntervalSeconds = 60; // Fetch every minute
  setInterval(() => {
    fetchPriceAndCalculate();
  }, fetchIntervalSeconds * 1000);
  
  console.log(`[FinalPriceSystem] Price fetch interval set to ${fetchIntervalSeconds}s`);
  
  // When price is fetched, trigger synced calculation explicitly
  window.addEventListener('price-fetched', (event: CustomEvent) => {
    if (!event.detail) return;
    
    const { symbol, price } = event.detail;
    console.log(`[FinalPriceSystem] Triggered synchronized calculation for ${symbol}: ${price}`);
    
    // Dispatch an event specifically for synced calculation system
    const syncEvent = new CustomEvent('synced-price-fetch', {
      detail: { symbol, price }
    });
    window.dispatchEvent(syncEvent);
  });
  
  // Start first fetch immediately
  setTimeout(() => {
    fetchPriceAndCalculate();
  }, 2000);
}

// Function to fetch price and trigger calculations
async function fetchPriceAndCalculate() {
  const symbol = 'BTC/USDT'; // Default symbol
  
  try {
    console.log(`[FinalPriceSystem] Fetching fresh price for ${symbol}`);
    
    // Dispatch price fetching event
    const fetchEvent = new CustomEvent('price-fetching', {
      detail: { symbol }
    });
    window.dispatchEvent(fetchEvent);
    
    // Fetch price from API
    const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.statusText}`);
    }
    
    const data = await response.json();
    const price = data.price;
    
    console.log(`[FinalPriceSystem] Successfully fetched price for ${symbol}: ${price}`);
    
    // Dispatch price update event
    const priceEvent = new CustomEvent('price-update', {
      detail: { symbol, price }
    });
    window.dispatchEvent(priceEvent);
    
    // Also dispatch a separate event for price fetched directly
    const fetchedEvent = new CustomEvent('price-fetched', {
      detail: { symbol, price }
    });
    window.dispatchEvent(fetchedEvent);
    
    console.log(`[FinalPriceSystem] Price fetch completed for ${symbol}: ${price}`);
    
    // Schedule next fetch
    const nextFetchIntervals = [60, 120]; // 1 min, 2 min intervals
    nextFetchIntervals.forEach(seconds => {
      console.log(`[FinalPriceSystem] Next fetch in ${seconds}s`);
    });
    
    return price;
  } catch (error) {
    console.error(`[FinalPriceSystem] Error fetching price for ${symbol}:`, error);
    return null;
  }
}