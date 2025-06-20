
import React, { useState, useRef, useEffect } from 'react';
import StatusBar from '../components/StatusBar';
import Header from '../components/Header';
import PriceOverview from '../components/PriceOverview';
import AdvancedSignalDashboard from '../components/AdvancedSignalDashboard';
import MacroIndicatorsPanel from '../components/MacroIndicatorsPanel';
import TechnicalAnalysisSummary from '../components/TechnicalAnalysisSummary';
import RiskAssessmentDashboard from '../components/RiskAssessmentDashboard';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAssetPrice } from '../hooks/useMarketData';
// TimeFrame type definition
type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '3d' | '1w' | '1M';
const Analysis: React.FC = () => {
  const [currentAsset, setCurrentAsset] = useState('BTC/USDT');
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeFrame>('4h');
  const { price } = useAssetPrice(currentAsset);
  // Keep track if this is first load or a user-initiated change
  const [assetChangeCounter, setAssetChangeCounter] = useState(0);
  const [shouldRunAnalysis, setShouldRunAnalysis] = useState(false);
  const [detectedPatterns, setDetectedPatterns] = useState([]);
  const handlePatternChange = (patterns: any[]) => {
    setDetectedPatterns(patterns);
    // Integrate pattern strength into signal confidence scoring
    if (patterns.length > 0) {
      console.log(`[Analysis] ${patterns.length} patterns detected, updating signal calculations`);
    }
  };
  // Effect to trigger analysis when asset changes
  useEffect(() => {
    // Skip the initial render
    if (assetChangeCounter > 0) {
      console.log(`Automatically running analysis for ${currentAsset}`);
      // Allow time for data to load first
      const timer = setTimeout(() => {
        setShouldRunAnalysis(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentAsset, assetChangeCounter]);
  const handleChangeAsset = (symbol: string) => {
    setCurrentAsset(symbol);
    setShouldRunAnalysis(true); // Directly set to run analysis
    setAssetChangeCounter(prev => prev + 1);
    console.log(`Selected new asset: ${symbol} - analysis will run automatically`);
    // Dispatch immediate calculation event with delay to ensure component is ready
    setTimeout(() => {
      console.log(`[Analysis] Dispatching immediate calculation event for ${symbol}`);
      const event = new CustomEvent('immediate-pair-calculation', {
        detail: { symbol: symbol, trigger: 'dropdown-selection' }
      });
      document.dispatchEvent(event);
    }, 1000); // 1 second delay to allow component to mount and listen
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
      <main className="flex-1 overflow-y-auto pb-16 px-4">
        {
        }
        
        {/* SECONDARY PRIORITY SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ErrorBoundary>
            <TechnicalAnalysisSummary symbol={currentAsset} timeframe={currentTimeframe} />
          </ErrorBoundary>
          <ErrorBoundary>
            <RiskAssessmentDashboard symbol={currentAsset} timeframe={currentTimeframe} />
          </ErrorBoundary>
        </div>
        {
        }
        {/* TERTIARY PRIORITY SECTION - Detailed Analysis */}
        <div className="space-y-6">
          {/* Advanced Signal Dashboard - Enhanced Version */}
          <ErrorBoundary>
            <AdvancedSignalDashboard
              symbol={currentAsset}
              onTimeframeSelect={handleChangeTimeframe}
            />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};
export default Analysis;