import React, { useState } from 'react';
import SimpleSignalDisplay from '../components/SimpleSignalDisplay';

const Analysis: React.FC = () => {
  const [currentAsset] = useState('BTC/USDT');

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <header className="bg-gray-800 py-4 px-6 shadow-md">
        <h1 className="text-2xl font-bold text-white">CryptoSignals Pro</h1>
      </header>
      
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Market Analysis</h2>
          <p className="text-gray-400">Technical analysis and trade signals</p>
        </div>
        
        <div className="mb-8">
          <SimpleSignalDisplay symbol={currentAsset} />
        </div>
      </main>
    </div>
  );
};

export default Analysis;