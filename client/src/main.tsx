import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { connectWebSocket } from "./lib/api";
import "./lib/windowTypes"; // Import type definitions for window object
import { initTechnicalIndicatorsModule } from "./lib/technicalIndicators";

// Initialize WebSocket connection on app start
connectWebSocket();

// Initialize technical indicators and add them to the global window object
initTechnicalIndicatorsModule();

// Initialize default price events container
window.latestPriceEvents = window.latestPriceEvents || {};

// Create a sync function if not already defined
window.syncGlobalPrice = window.syncGlobalPrice || ((symbol: string, price: number, timestamp?: number) => {
  const now = timestamp || Date.now();
  window.latestPriceEvents[symbol] = { price, timestamp: now };
  return price;
});

createRoot(document.getElementById("root")!).render(<App />);
