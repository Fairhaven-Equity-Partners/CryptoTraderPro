import React, { useState, useEffect } from 'react';
import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import PriceOverview from '../components/PriceOverview';
import ChartComponent from '../components/ChartComponent';
import SignalSummary from '../components/SignalSummary';
import TimeframeAnalysis from '../components/TimeframeAnalysis';
import LeverageCalculator from '../components/LeverageCalculator';
import ActiveAlerts from '../components/ActiveAlerts';
import AdvancedSignalDashboard from '../components/AdvancedSignalDashboard';
import { useAssetPrice } from '../hooks/useMarketData';
import { TimeFrame } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Analysis: React.FC = () => {
  const [currentAsset, setCurrentAsset] = useState('BTC/USDT');
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeFrame>('4h');
  const { price } = useAssetPrice(currentAsset);
  
  const handleChangeAsset = (symbol: string) => {
    setCurrentAsset(symbol);
  };
  
  const handleChangeTimeframe = (timeframe: TimeFrame) => {
    setCurrentTimeframe(timeframe);
  };
  
  const [analysisTab, setAnalysisTab] = useState<string>("chart");

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
          <Tabs value={analysisTab} onValueChange={setAnalysisTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">Chart Analysis</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Signals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-4 mt-2">
              <ChartComponent 
                symbol={currentAsset} 
                timeframe={currentTimeframe} 
                onChangeTimeframe={handleChangeTimeframe}
              />
              
              <SignalSummary 
                symbol={currentAsset} 
                timeframe={currentTimeframe}
              />
              
              <TimeframeAnalysis symbol={currentAsset} />
              
              <LeverageCalculator 
                symbol={currentAsset} 
                currentPrice={price?.lastPrice || 0}
              />
            </TabsContent>
            
            <TabsContent value="advanced" className="mt-2">
              <AdvancedSignalDashboard 
                symbol={currentAsset} 
                onTimeframeSelect={handleChangeTimeframe}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="px-4 py-2">
          <ActiveAlerts 
            symbol={currentAsset} 
            currentPrice={price?.lastPrice || 0}
          />
        </div>
      </main>
    </div>
  );
};

export default Analysis;
