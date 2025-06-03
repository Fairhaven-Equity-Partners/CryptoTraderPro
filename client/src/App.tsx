import { useState, useEffect } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Analysis from "@/pages/Analysis";
import Settings from "@/pages/Settings";
import NavigationBar from "@/components/NavigationBar";
import GlobalNotifications from "@/components/GlobalNotifications";
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
        <Route path="/settings" component={() => <Settings />} />
        <Route component={NotFound} />
      </Switch>
      <NavigationBar currentTab={currentTab} onChangeTab={handleTabChange} />
      <GlobalNotifications />
    </div>
  );
}

function App() {
  // Initialize streamlined calculation system
  useEffect(() => {
    // Import and initialize the optimized unified calculation system
    import('./lib/streamlinedPriceManager').then(({ initPriceManager }) => {
      console.log('✅ Initializing streamlined calculation system');
      initPriceManager();
    }).catch(error => {
      console.error('Failed to initialize streamlined system:', error);
    });
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {/* Hidden element to store live price data for calculations - AUTO-ENABLED */}
        <div id="live-price-data" style={{ display: 'none' }} data-calculation-mode="auto-enabled" />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;