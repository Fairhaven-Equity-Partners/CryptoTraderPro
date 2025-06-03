import { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Analysis from "@/pages/Analysis";
import Settings from "@/pages/Settings";
import Forex from "@/pages/Forex";
import NavigationBar from "@/components/NavigationBar";
import GlobalNotifications from "@/components/GlobalNotifications";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AppTab } from "./types";


function Router() {
  const [currentTab, setCurrentTab] = useState<AppTab['id']>('analysis');

  const handleTabChange = (tab: AppTab['id']) => {
    setCurrentTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Switch>
        <Route path="/" component={() => <Analysis />} />
        <Route path="/forex" component={() => <Forex />} />
        <Route path="/settings" component={() => <Settings />} />
        <Route component={NotFound} />
      </Switch>
      <NavigationBar currentTab={currentTab} onChangeTab={handleTabChange} />
      <GlobalNotifications />
    </div>
  );
}

function App() {
  // Initialize streamlined calculation system with error handling
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        // Add global error handler for DOM exceptions
        window.addEventListener('error', (event) => {
          if (event.error?.name === 'DOMException') {
            console.warn('DOMException caught and handled:', event.error.message);
            event.preventDefault();
            return false;
          }
        });

        // Add unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
          if (event.reason?.name === 'DOMException') {
            console.warn('Unhandled DOMException caught:', event.reason.message);
            event.preventDefault();
          }
        });

        // Import and initialize the optimized unified calculation system
        const { initPriceManager } = await import('./lib/streamlinedPriceManager');
        console.log('✅ Initializing streamlined calculation system');
        initPriceManager();
      } catch (error) {
        console.error('Failed to initialize streamlined system:', error);
      }
    };

    initializeSystem();
  }, []);
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            {/* Hidden element to store live price data for calculations - AUTO-ENABLED */}
            <div id="live-price-data" style={{ display: 'none' }} data-calculation-mode="auto-enabled" />
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;