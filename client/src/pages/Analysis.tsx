import React, { useState, useEffect } from 'react';
import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import PriceOverview from '../components/PriceOverview';
import ChartComponent from '../components/ChartComponent';
import SignalSummary from '../components/SignalSummary';
import TimeframeAnalysis from '../components/TimeframeAnalysis';
import LeverageCalculator from '../components/LeverageCalculator';
import ActiveAlerts from '../components/ActiveAlerts';
import { useAssetPrice } from '../hooks/useMarketData';
import { TimeFrame } from '../types';

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
        
        <ActiveAlerts 
          symbol={currentAsset} 
          currentPrice={price?.lastPrice || 0}
        />
      </main>
    </div>
  );
};

export default Analysis;
