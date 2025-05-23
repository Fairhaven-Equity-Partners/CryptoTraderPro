import React from 'react';
import './index.css';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Import the standalone market analysis component
import StandaloneMarketAnalysis from './components/StandaloneMarketAnalysis';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <header className="bg-gray-800 py-4 px-6 shadow-md">
          <h1 className="text-2xl font-bold">CryptoSignals Pro</h1>
        </header>
        
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Market Analysis</h2>
            <p className="text-gray-400">Technical analysis and trade signals</p>
          </div>
          
          <StandaloneMarketAnalysis symbol="BTC/USDT" />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;