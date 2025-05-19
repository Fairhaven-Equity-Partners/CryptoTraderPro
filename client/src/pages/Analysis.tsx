import React, { useState } from 'react';
import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import PriceOverview from '../components/PriceOverview';
import LeverageCalculator from '../components/LeverageCalculator';
import AdvancedSignalDashboard from '../components/AdvancedSignalDashboard';
import MacroIndicatorsPanel from '../components/MacroIndicatorsPanel';
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
        
        <div className="px-4 py-2">
          <h2 className="text-xl font-bold mb-4 text-white">Advanced Signal Analysis</h2>
          <AdvancedSignalDashboard 
            symbol={currentAsset} 
            onTimeframeSelect={handleChangeTimeframe}
          />
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
