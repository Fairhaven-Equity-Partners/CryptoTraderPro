import React, { useState, useRef, useEffect } from 'react';
import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import PriceOverview from '../components/PriceOverview';
import LeverageCalculator from '../components/LeverageCalculator';
import AdvancedSignalDashboard from '../components/AdvancedSignalDashboard';
import SignalHeatMap from '../components/SignalHeatMap';
import MacroIndicatorsPanel from '../components/MacroIndicatorsPanel';
import { useAssetPrice } from '../hooks/useMarketData';
import { TimeFrame } from '../types';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Analysis: React.FC = () => {
  const [currentAsset, setCurrentAsset] = useState('BTC/USDT');
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeFrame>('4h');
  const [isHeatMapOpen, setIsHeatMapOpen] = useState(true);
  const { price } = useAssetPrice(currentAsset);
  const [assetChangeCounter, setAssetChangeCounter] = useState(0);
  const signalDashboardRef = useRef<any>(null);
  
  // Effect to trigger analysis when asset changes
  useEffect(() => {
    // Skip the initial render
    if (assetChangeCounter > 0 && signalDashboardRef.current?.runAnalysis) {
      console.log(`Automatically running analysis for ${currentAsset}`);
      // Allow time for data to load first
      const timer = setTimeout(() => {
        signalDashboardRef.current.runAnalysis();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentAsset, assetChangeCounter]);
  
  const handleChangeAsset = (symbol: string) => {
    setCurrentAsset(symbol);
    setAssetChangeCounter(prev => prev + 1);
  };
  
  const handleChangeTimeframe = (timeframe: TimeFrame) => {
    setCurrentTimeframe(timeframe);
  };

  return (
    <div className="flex flex-col h-screen">
      <StatusBar />
      <Header 
        currentAsset={currentAsset} 
        onChangeAsset={handleChangeAsset} 
      />
      
      <main className="flex-1 overflow-y-auto pb-16">
        <PriceOverview 
          symbol={currentAsset} 
          timeframe={currentTimeframe}
        />
        
        <div className="px-4 py-2">
          <AdvancedSignalDashboard 
            ref={signalDashboardRef}
            symbol={currentAsset} 
            onTimeframeSelect={handleChangeTimeframe}
          />
        </div>
        
        {/* Heat Map Section */}
        <div className="px-4 py-4">
          <Collapsible open={isHeatMapOpen} onOpenChange={setIsHeatMapOpen}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white">Market-Wide Signal Analysis</h2>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  {isHeatMapOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              <SignalHeatMap onSelectAsset={handleChangeAsset} />
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <div className="px-4 py-4">
          <LeverageCalculator 
            symbol={currentAsset} 
            currentPrice={price?.lastPrice || 0}
          />
        </div>
      </main>
    </div>
  );
};

export default Analysis;
