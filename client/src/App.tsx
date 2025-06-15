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
import RiskAnalysis from "@/pages/RiskAnalysis";
import PatternAnalysis from "@/pages/PatternAnalysis";
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
        <Route path="/risk" component={() => <RiskAnalysis />} />
        <Route path="/patterns" component={() => <PatternAnalysis />} />
        <Route path="/settings" component={() => <Settings />} />
        <Route component={NotFound} />
      </Switch>
      <NavigationBar currentTab={currentTab} onChangeTab={handleTabChange} />
      <GlobalNotifications />
    </div>
  );
}

function App() {
  // Add only essential error handlers (system initialization handled by master controller)
  useEffect(() => {
    // Global error handlers for stability
    window.addEventListener('error', (event) => {
      if (event.error?.name === 'DOMException') {
        console.warn('DOMException handled:', event.error.message);
        event.preventDefault();
        return false;
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.name === 'DOMException') {
        console.warn('Unhandled rejection handled:', event.reason.message);
        event.preventDefault();
      }
    });
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