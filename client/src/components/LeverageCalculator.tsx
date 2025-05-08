import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeverageParams, LeverageResult } from '../types';
import { calculateSafeLeverage } from '../lib/calculations';
import { calculateLeverage } from '../lib/api';

interface LeverageCalculatorProps {
  symbol: string;
  currentPrice: number;
}

const LeverageCalculator: React.FC<LeverageCalculatorProps> = ({ symbol, currentPrice }) => {
  const [params, setParams] = useState<LeverageParams>({
    positionSize: 1000,
    riskPercentage: 2,
    entryPrice: currentPrice,
    stopLoss: currentPrice * 0.98, // 2% below current price
    takeProfit: currentPrice * 1.04, // 4% above current price
  });
  
  const [result, setResult] = useState<LeverageResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Update entry price when current price changes
  useEffect(() => {
    setParams(prev => ({
      ...prev,
      entryPrice: currentPrice,
      stopLoss: currentPrice * 0.98,
      takeProfit: currentPrice * 1.04,
    }));
  }, [currentPrice]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };
  
  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      // Call API for calculation
      const result = await calculateLeverage(params);
      setResult(result);
    } catch (error) {
      // Fallback to client-side calculation if API fails
      const fallbackResult = calculateSafeLeverage(params);
      setResult(fallbackResult);
      console.error('Failed to calculate leverage via API, used fallback:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  return (
    <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
      <h2 className="text-white text-lg font-medium mb-3">Leverage Calculator</h2>
      
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
      
      {result && (
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-neutral text-xs">Recommended Leverage</span>
            <span className="text-white text-lg font-medium">{result.recommendedLeverage}x</span>
          </div>
          <div className="mb-2">
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
                style={{ left: `${Math.min(parseFloat(result.recommendedLeverage) * 10, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral">Potential Profit:</span>
              <span className="text-success ml-1">${result.potentialProfit}</span>
            </div>
            <div>
              <span className="text-neutral">Max Loss:</span>
              <span className="text-danger ml-1">${result.maxLoss}</span>
            </div>
            <div>
              <span className="text-neutral">Risk/Reward:</span>
              <span className="text-white ml-1">1:{result.riskRewardRatio}</span>
            </div>
            <div>
              <span className="text-neutral">Liquidation:</span>
              <span className="text-danger ml-1">${result.liquidationPrice}</span>
            </div>
          </div>
        </div>
      )}
      
      <Button
        className="w-full bg-accent hover:bg-amber-500 text-primary font-medium py-2 rounded-lg transition duration-150"
        onClick={handleCalculate}
        disabled={isCalculating}
      >
        {isCalculating ? 'Calculating...' : 'Calculate Optimal Position'}
      </Button>
    </div>
  );
};

export default LeverageCalculator;
