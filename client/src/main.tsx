import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/windowTypes"; // Import type definitions for window object
import { initializeUnifiedSystem } from "./lib/unifiedSystemInitializer";

// Initialize all systems through unified initializer (prevents redundant initialization)
initializeUnifiedSystem().then(() => {
  console.log('✅ Unified system initialization complete');
}).catch((error) => {
  console.error('❌ System initialization failed:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
