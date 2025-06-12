import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/windowTypes";
import { initializeUltimateSystem } from "./lib/ultimateSystemManager";

// Initialize ultimate system manager (final solution - eliminates ALL redundancies)
initializeUltimateSystem().then(() => {}).catch((error) => {
  console.error('[System] Ultimate initialization failed:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
