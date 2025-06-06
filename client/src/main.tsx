import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/windowTypes";
import { initializeUltimateSystem } from "./lib/ultimateSystemManager";

// Initialize ultimate system manager (final solution - eliminates ALL redundancies)
initializeUltimateSystem().then(() => {
  console.log('[System] Ultimate manager active - synchronized 4-minute intervals');
}).catch((error) => {
  console.error('[System] Ultimate initialization failed:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
