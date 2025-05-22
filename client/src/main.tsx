import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { connectWebSocket } from "./lib/api";
import "./lib/windowTypes"; // Import type definitions for window object
import { initTechnicalIndicatorsModule } from "./lib/technicalIndicators";
import { initSignalStabilizationSystem } from "./lib/signalStabilizer";
import { initOneTimeCalculationSystem } from "./lib/oneTimeCalculation";
import { initPriceSystem } from "./lib/finalPriceSystem";

// Initialize WebSocket connection on app start
connectWebSocket();

// Initialize all subsystems
initTechnicalIndicatorsModule();
initSignalStabilizationSystem();

// Important: Use the new synchronized calculation system for price updates
import('./lib/syncedPriceCalculation').then(({ initSyncedCalculation }) => {
  console.log("⚡ Starting synchronized calculation system");
  initSyncedCalculation();
});

// Initialize price system with 1-minute refresh interval for more frequent updates
initPriceSystem(60);

// Initialize default price events container
window.latestPriceEvents = window.latestPriceEvents || {};

// Create a sync function if not already defined
window.syncGlobalPrice = window.syncGlobalPrice || ((symbol: string, price: number, timestamp?: number) => {
  const now = timestamp || Date.now();
  window.latestPriceEvents[symbol] = { price, timestamp: now };
  
  // Log price updates for debugging
  console.log(`💰 PRICE UPDATE: ${symbol} = ${price} 💰`);
  console.log(`💰 CALCULATIONS COMING SOON 💰`);
  
  return price;
});

// Log that main initialization is complete
console.log('===================================================');
console.log('Cryptocurrency Analysis Platform Initialized');
console.log('All subsystems ready for signal generation');
console.log('===================================================');

createRoot(document.getElementById("root")!).render(<App />);
