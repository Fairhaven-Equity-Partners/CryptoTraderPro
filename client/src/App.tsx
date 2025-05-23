import { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Analysis from "@/pages/Analysis";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";
import NavigationBar from "@/components/NavigationBar";
import GlobalNotifications from "@/components/GlobalNotifications";
import { AppTab } from "./types";
import { disableAllAutoCalculations } from "./lib/disableAllAutoCalculations";

function Router() {
  const [currentTab, setCurrentTab] = useState<AppTab['id']>('analysis');

  const handleTabChange = (tab: AppTab['id']) => {
    setCurrentTab(tab);
  };

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Switch>
        <Route path="/" component={() => <Analysis />} />
        <Route path="/alerts" component={() => <Alerts />} />
        <Route path="/settings" component={() => <Settings />} />
        <Route component={NotFound} />
      </Switch>
      <NavigationBar currentTab={currentTab} onChangeTab={handleTabChange} />
      <GlobalNotifications />
    </div>
  );
}

function App() {
  // Call the disableAllAutoCalculations function when the app loads
  useEffect(() => {
    // Completely disable all automatic calculations at startup
    console.log('🛑 App initializing - disabling all auto-calculations 🛑');
    disableAllAutoCalculations();
    
    // Also apply again after a short delay to catch any late initializations
    const secondaryDisableTimer = setTimeout(() => {
      console.log('🔒 Secondary disable pass for auto-calculations 🔒');
      disableAllAutoCalculations();
    }, 1000);
    
    return () => clearTimeout(secondaryDisableTimer);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {/* Hidden element to store live price data for calculations - MANUAL ONLY */}
        <div id="live-price-data" style={{ display: 'none' }} data-calculation-mode="manual-only" />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;