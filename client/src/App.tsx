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
  // Initialize automatic calculation system when the app loads
  useEffect(() => {
    // Import and initialize the improved auto calculation system
    import('./lib/autoCalculationSystem').then(({ initAutoCalculationSystem }) => {
      console.log('✅ App initializing - setting up enhanced auto calculation system ✅');
      initAutoCalculationSystem();
    }).catch(error => {
      console.error('Failed to initialize auto calculation system:', error);
    });
    
    // Our legacy price update listener - preserved for backward compatibility
    const handlePriceUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.symbol && event.detail.price) {
        console.log(`🔄 Price update detected for ${event.detail.symbol}: ${event.detail.price}`);
        
        // Broadcast a calculation needed event with the new price data
        const calcEvent = new CustomEvent('calculation-needed', {
          detail: {
            symbol: event.detail.symbol,
            price: event.detail.price,
            timestamp: Date.now(),
            trigger: 'auto-price-update'
          }
        });
        
        // Dispatch the event to trigger calculations
        window.dispatchEvent(calcEvent);
      }
    };
    
    // Listen for all price update events
    window.addEventListener('price-update', handlePriceUpdate as EventListener);
    window.addEventListener('live-price-update', handlePriceUpdate as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('price-update', handlePriceUpdate as EventListener);
      window.removeEventListener('live-price-update', handlePriceUpdate as EventListener);
    };
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