import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/windowTypes";
import { initializeOptimizedSystem } from "./lib/optimizedSystemCore";

// Initialize optimized system (single point of control, eliminates redundancies)
initializeOptimizedSystem().then(() => {
  console.log('[Core] Optimized system ready with authentic data sources');
}).catch((error) => {
  console.error('[Core] System initialization failed:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
