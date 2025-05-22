import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeverageParams, LeverageResult, TimeFrame } from '../types';
import { calculateSafeLeverage, calculateTimeframeLeverage } from '../lib/calculations';
import { calculateLeverage } from '../lib/api';
import { 
  analyzeMacroEnvironment,
  getMacroEnvironmentClassification 
} from '../lib/macroIndicators';

interface LeverageCalculatorProps {
  symbol: string;
  currentPrice: number;
}

// Only calculate for most commonly used timeframes to save computation
const timeframes: TimeFrame[] = ['15m', '1h', '4h', '1d'];

const LeverageCalculator: React.FC<LeverageCalculatorProps> = ({ symbol, currentPrice }) => {
  const [params, setParams] = useState<LeverageParams>({
    positionSize: 10000,
    riskPercentage: 2,
    entryPrice: currentPrice,
    stopLoss: currentPrice * 0.98,
    takeProfit: currentPrice * 1.04,
  });
  
  const [result, setResult] = useState<LeverageResult | null>(null);
  const [timeframeResults, setTimeframeResults] = useState<Record<string, LeverageResult>>({});
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1h');
  const [isCalculating, setIsCalculating] = useState(false);
  const [directionType, setDirectionType] = useState<'long' | 'short'>('long');
  const [macroScore, setMacroScore] = useState<number>(50);
  const [macroClassification, setMacroClassification] = useState<string>("Neutral");
  
  // Reset calculator when symbol changes (but keep position size)
  useEffect(() => {
    setParams(prev => ({
      positionSize: prev.positionSize, // Keep the user-entered position size
      riskPercentage: 2,
      entryPrice: currentPrice,
      stopLoss: directionType === 'long' ? currentPrice * 0.98 : currentPrice * 1.02,
      takeProfit: directionType === 'long' ? currentPrice * 1.04 : currentPrice * 0.96,
    }));
    setResult(null);
    setTimeframeResults({});
  }, [symbol, currentPrice, directionType]);
  
  // Memoized macro data update function to prevent unnecessary recalculations
  const updateMacroData = useCallback(() => {
    // Pass the symbol to these functions
    const { score } = analyzeMacroEnvironment(symbol);
    const classification = getMacroEnvironmentClassification(symbol);
    
    setMacroScore(score);
    setMacroClassification(classification);
  }, [symbol]);
  
  // Fetch and update macro indicators
  useEffect(() => {
    // Update initially
    updateMacroData();
    
    // Set interval to refresh every 60 seconds
    const intervalId = setInterval(updateMacroData, 60000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [updateMacroData]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };
  
  const toggleDirection = useCallback(() => {
    const newDirection = directionType === 'long' ? 'short' : 'long';
    setDirectionType(newDirection);
    
    // Update stop loss and take profit based on new direction
    setParams(prev => ({
      ...prev,
      stopLoss: newDirection === 'long' ? currentPrice * 0.98 : currentPrice * 1.02,
      takeProfit: newDirection === 'long' ? currentPrice * 1.04 : currentPrice * 0.96,
    }));
  }, [directionType, currentPrice]);
  
  // Memoized function to adjust parameters based on macro environment
  const getAdjustedParams = useMemo(() => (inputParams: LeverageParams) => {
    const adjustedParams = {...inputParams};
    
    // Adjust risk percentage based on macro score
    if (macroScore >= 80) {
      adjustedParams.riskPercentage = inputParams.riskPercentage ? inputParams.riskPercentage * 1.2 : 2.4;
    } else if (macroScore >= 65) {
      adjustedParams.riskPercentage = inputParams.riskPercentage ? inputParams.riskPercentage * 1.1 : 2.2;
    } else if (macroScore <= 20) {
      adjustedParams.riskPercentage = inputParams.riskPercentage ? inputParams.riskPercentage * 0.7 : 1.4;
    } else if (macroScore <= 35) {
      adjustedParams.riskPercentage = inputParams.riskPercentage ? inputParams.riskPercentage * 0.8 : 1.6;
    }
    
    // Adjust take profit targets
    if (directionType === 'long') {
      if (macroScore >= 65 && inputParams.takeProfit && inputParams.entryPrice) {
        adjustedParams.takeProfit = inputParams.entryPrice * (1 + ((inputParams.takeProfit / inputParams.entryPrice - 1) * 1.2));
      } else if (macroScore <= 35 && inputParams.takeProfit && inputParams.entryPrice) {
        adjustedParams.takeProfit = inputParams.entryPrice * (1 + ((inputParams.takeProfit / inputParams.entryPrice - 1) * 0.8));
      }
    } else {
      if (macroScore <= 35 && inputParams.takeProfit && inputParams.entryPrice) {
        adjustedParams.takeProfit = inputParams.entryPrice * (1 - ((1 - inputParams.takeProfit / inputParams.entryPrice) * 1.2));
      } else if (macroScore >= 65 && inputParams.takeProfit && inputParams.entryPrice) {
        adjustedParams.takeProfit = inputParams.entryPrice * (1 - ((1 - inputParams.takeProfit / inputParams.entryPrice) * 0.8));
      }
    }
    
    return adjustedParams;
  }, [macroScore, directionType]);
  
  const handleCalculate = async () => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    try {
      // Use the memoized function to adjust parameters
      const adjustedParams = getAdjustedParams(params);
      
      // Call API for calculation with adjusted parameters
      const result = await calculateLeverage(adjustedParams);
      setResult(result);
      
      // Calculate for different timeframes - optimize by calculating only a subset
      const tfResults: Record<string, LeverageResult> = {};
      
      // Calculate for selected timeframes in parallel using Promise.all for better performance
      await Promise.all(timeframes.map(async (tf) => {
        tfResults[tf] = calculateTimeframeLeverage(adjustedParams, tf);
      }));
      
      setTimeframeResults(tfResults);
    } catch (error) {
      // Fallback to client-side calculation if API fails
      const adjustedParams = getAdjustedParams(params);
      
      const fallbackResult = calculateSafeLeverage(adjustedParams);
      setResult(fallbackResult);
      
      // Calculate for different timeframes
      const tfResults: Record<string, LeverageResult> = {};
      
      // Calculate for only the most relevant timeframes
      timeframes.forEach(tf => {
        tfResults[tf] = calculateTimeframeLeverage(adjustedParams, tf);
      });
      
      setTimeframeResults(tfResults);
      
      console.error('Failed to calculate leverage via API, used fallback:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  return (
    <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
      <h2 className="text-white text-lg font-medium mb-3">Leverage Calculator</h2>
      
      {/* Macro Environment Indicator */}
      <div className="mb-4 bg-gray-800 rounded-lg p-2">
        <div className="flex justify-between items-center">
          <span className="text-neutral text-xs">Macro Environment</span>
          <div 
            className={`text-xs font-semibold rounded px-2 py-1 ${
              macroScore >= 65 ? 'bg-green-900 text-green-300' : 
              macroScore <= 35 ? 'bg-red-900 text-red-300' : 
              'bg-yellow-900 text-yellow-300'
            }`}
          >
            {macroClassification} ({macroScore}/100)
          </div>
        </div>
        <div className="mt-1">
          <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" 
              style={{ width: `${macroScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral mt-0.5">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-neutral text-sm">Position Type</span>
          <div className="flex items-center space-x-2">
            <button
              className={`py-1 px-4 text-xs font-medium rounded-l-lg ${directionType === 'long' ? 'bg-green-600 text-white' : 'bg-gray-700 text-neutral'}`}
              onClick={() => directionType !== 'long' && toggleDirection()}
            >
              LONG
            </button>
            <button
              className={`py-1 px-4 text-xs font-medium rounded-r-lg ${directionType === 'short' ? 'bg-red-600 text-white' : 'bg-gray-700 text-neutral'}`}
              onClick={() => directionType !== 'short' && toggleDirection()}
            >
              SHORT
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Label className="block text-neutral text-xs mb-1">Position Size (USDT)</Label>
          <Input
            type="number"
            name="positionSize"
            value={params.positionSize}
            onChange={handleInputChange}
            className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-white text-sm"
          />
        </div>
        <div>
          <Label className="block text-neutral text-xs mb-1">Risk Tolerance (%)</Label>
          <Input
            type="number"
            name="riskPercentage"
            value={params.riskPercentage}
            onChange={handleInputChange}
            className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-white text-sm"
          />
        </div>
        <div>
          <Label className="block text-neutral text-xs mb-1">Entry Price ($)</Label>
          <Input
            type="number"
            name="entryPrice"
            value={params.entryPrice}
            onChange={handleInputChange}
            className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-white text-sm"
          />
        </div>
        <div>
          <Label className="block text-neutral text-xs mb-1">Stop Loss ($)</Label>
          <Input
            type="number"
            name="stopLoss"
            value={params.stopLoss}
            onChange={handleInputChange}
            className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-white text-sm"
          />
        </div>
        <div>
          <Label className="block text-neutral text-xs mb-1">Take Profit ($)</Label>
          <Input
            type="number"
            name="takeProfit"
            value={params.takeProfit}
            onChange={handleInputChange}
            className="w-full bg-gray-800 border border-gray-700 rounded py-2 px-3 text-white text-sm"
          />
        </div>
      </div>
      
      <Button
        className="w-full bg-accent hover:bg-amber-500 text-primary font-medium py-2 rounded-lg transition duration-150 mb-3"
        onClick={handleCalculate}
        disabled={isCalculating}
      >
        {isCalculating ? 'Calculating...' : 'Calculate Risk & Leverage'}
      </Button>
      
      {result && Object.keys(timeframeResults).length > 0 && (
        <>
          {/* Macro environment impact explanation */}
          <div className="mb-4 p-2 bg-gray-800 rounded-lg text-xs">
            <p className="text-neutral mb-1">Macro Environment Impact:</p>
            <ul className="list-disc list-inside text-[11px] text-neutral">
              {macroScore >= 65 ? (
                <>
                  <li className="text-green-400">Bullish macro environment detected</li>
                  <li>Take profit targets extended by 20%</li>
                  {directionType === 'long' ? 
                    <li>Risk tolerance increased slightly for long positions</li> :
                    <li>Using tighter take profits for short positions</li>
                  }
                </>
              ) : macroScore <= 35 ? (
                <>
                  <li className="text-red-400">Bearish macro environment detected</li>
                  <li>Risk tolerance reduced to protect capital</li>
                  {directionType === 'long' ? 
                    <li>Using tighter take profits for long positions</li> :
                    <li>Take profit targets extended by 20% for short positions</li>
                  }
                </>
              ) : (
                <>
                  <li className="text-yellow-300">Neutral macro environment</li>
                  <li>Standard risk parameters applied</li>
                  <li>No adjustment to take profit targets</li>
                </>
              )}
            </ul>
          </div>
        
          <Tabs defaultValue={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as TimeFrame)}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral text-xs">Timeframe Recommendations</span>
              <TabsList className="grid grid-cols-4 h-8">
                {['5m', '15m', '1h', '1d'].map(tf => (
                  <TabsTrigger key={tf} value={tf} className="text-xs py-1 h-full">{tf}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {Object.entries(timeframeResults).map(([tf, tfResult]) => (
              <TabsContent key={tf} value={tf} className="mt-0">
                <div className="bg-gray-800 rounded-lg p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-neutral text-xs">{tf} Timeframe - Recommended Leverage</span>
                    <span className="text-white text-lg font-medium">{tfResult.recommendedLeverage}x</span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral">Safe</span>
                      <span className="text-danger">Risky</span>
                    </div>
                    <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-success via-accent to-danger h-full rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <div className="relative h-3">
                      <div 
                        className="absolute top-0 left-0 h-3 w-0.5 bg-white" 
                        style={{ left: `${Math.min(parseFloat(tfResult.recommendedLeverage) * 5, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="text-xs text-neutral mb-1 font-medium">Take Profit Targets</h3>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {tfResult.takeProfitLevels && (
                        <>
                          <div className="bg-gray-700 p-2 rounded text-center">
                            <div className="text-xs text-neutral">TP1</div>
                            <div className="text-success text-sm">${tfResult.takeProfitLevels.tp1}</div>
                          </div>
                          <div className="bg-gray-700 p-2 rounded text-center">
                            <div className="text-xs text-neutral">TP2</div>
                            <div className="text-success text-sm">${tfResult.takeProfitLevels.tp2}</div>
                          </div>
                          <div className="bg-gray-700 p-2 rounded text-center">
                            <div className="text-xs text-neutral">TP3</div>
                            <div className="text-success text-sm">${tfResult.takeProfitLevels.tp3}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-neutral">Potential Profit:</span>
                      <span className="text-success ml-1">${tfResult.potentialProfit}</span>
                    </div>
                    <div>
                      <span className="text-neutral">Max Loss:</span>
                      <span className="text-danger ml-1">${tfResult.maxLoss}</span>
                    </div>
                    <div>
                      <span className="text-neutral">Risk/Reward:</span>
                      <span className="text-white ml-1">1:{tfResult.riskRewardRatio}</span>
                    </div>
                    <div>
                      <span className="text-neutral">Liquidation:</span>
                      <span className="text-danger ml-1">${tfResult.liquidationPrice}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default LeverageCalculator;