import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { connectWebSocket } from "./lib/api";

// Initialize WebSocket connection on app start
connectWebSocket();

createRoot(document.getElementById("root")!).render(<App />);
