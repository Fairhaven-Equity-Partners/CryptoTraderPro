import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/windowTypes";
import { initializeMasterSystem } from "./lib/masterSystemController";

// Initialize master system controller (eliminates all redundancies and synchronizes timers)
initializeMasterSystem().then(() => {
  console.log('[System] Master controller initialized - all timers synchronized to 4-minute intervals');
}).catch((error) => {
  console.error('[System] Master initialization failed:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
