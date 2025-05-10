import React, { useState } from 'react';
import { useMultiTimeframeAnalysis } from '../hooks/useSignalAnalysis';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeFrame } from '../types';

interface TimeframeAnalysisProps {
  symbol: string;
}

const TimeframeAnalysis: React.FC<TimeframeAnalysisProps> = ({ symbol }) => {
  const { timeframeSignals, dominantDirection, isLoading, error } = useMultiTimeframeAnalysis(symbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1h');
  // Removed leverage and position size calculations as requested
  
  // Calculate dominant trend strength
  const dominantStrength = timeframeSignals.reduce((acc, tf) => {
    if (tf.signal === dominantDirection) {
      return acc + tf.strength;
    }
    return acc;
  }, 0) / timeframeSignals.length;
  
  // Group timeframes for better analysis
  const shortTimeframes = timeframeSignals.filter(tf => ['1m', '5m', '15m', '30m'].includes(tf.timeframe));
  const mediumTimeframes = timeframeSignals.filter(tf => ['1h', '4h'].includes(tf.timeframe));
  const longTimeframes = timeframeSignals.filter(tf => ['1d', '1w', '1M'].includes(tf.timeframe));
  
  return (
    <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white text-lg font-medium">Multi-Timeframe Analysis</h2>
        
        {/* Overall trend meter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral">Overall Trend:</span>
          <span className={`text-sm font-medium ${
            dominantDirection === 'LONG' 
              ? 'text-success' 
              : dominantDirection === 'SHORT' 
                ? 'text-danger' 
                : 'text-neutral'
          }`}>
            {dominantDirection === 'LONG' ? 'BULLISH' : dominantDirection === 'SHORT' ? 'BEARISH' : 'NEUTRAL'}
          </span>
          <div className="w-20 bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                dominantDirection === 'LONG' 
                  ? 'bg-success' 
                  : dominantDirection === 'SHORT' 
                    ? 'bg-danger' 
                    : 'bg-neutral'
              }`} 
              style={{ width: `${dominantStrength}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-neutral">Loading timeframe analysis...</span>
        </div>
      ) : (
        <>
          {/* Visual trend alignment */}
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <h3 className="text-sm text-white mb-2">Trend Alignment</h3>
            <div className="flex justify-between items-center mb-1 text-xs text-neutral">
              <span>Short-term</span>
              <span>Medium-term</span>
              <span>Long-term</span>
            </div>
            <div className="relative h-8">
              {/* Vertical alignment line */}
              <div className="absolute h-full w-0.5 left-1/2 bg-gray-700"></div>
              
              {/* Short-term signals */}
              <div className="absolute top-0 left-[10%] right-[60%] flex justify-around">
                {shortTimeframes.map(tf => (
                  <div 
                    key={`short-${tf.timeframe}`}
                    className={`w-2 h-2 rounded-full ${
                      tf.signal === 'LONG' 
                        ? 'bg-success' 
                        : tf.signal === 'SHORT' 
                          ? 'bg-danger' 
                          : 'bg-neutral'
                    }`}
                    title={`${tf.timeframe}: ${tf.signal}`}
                  ></div>
                ))}
              </div>
              
              {/* Medium-term signals */}
              <div className="absolute top-3 left-[40%] right-[30%] flex justify-around">
                {mediumTimeframes.map(tf => (
                  <div 
                    key={`medium-${tf.timeframe}`}
                    className={`w-3 h-3 rounded-full ${
                      tf.signal === 'LONG' 
                        ? 'bg-success' 
                        : tf.signal === 'SHORT' 
                          ? 'bg-danger' 
                          : 'bg-neutral'
                    }`}
                    title={`${tf.timeframe}: ${tf.signal}`}
                  ></div>
                ))}
              </div>
              
              {/* Long-term signals */}
              <div className="absolute top-0 left-[60%] right-[10%] flex justify-around">
                {longTimeframes.map(tf => (
                  <div 
                    key={`long-${tf.timeframe}`}
                    className={`w-4 h-4 rounded-full ${
                      tf.signal === 'LONG' 
                        ? 'bg-success' 
                        : tf.signal === 'SHORT' 
                          ? 'bg-danger' 
                          : 'bg-neutral'
                    }`}
                    title={`${tf.timeframe}: ${tf.signal}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as TimeFrame)}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-neutral">Timeframe Details</span>
              <TabsList className="grid grid-cols-4 h-8">
                {['5m', '1h', '4h', '1d'].map(tf => (
                  <TabsTrigger key={tf} value={tf} className="text-xs py-1 h-full">{tf}</TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {timeframeSignals.map(tf => (
              <TabsContent key={tf.timeframe} value={tf.timeframe} className="mt-0">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-white text-sm font-medium">{tf.timeframe} Timeframe</h3>
                      <p className={`text-xs ${
                        tf.signal === 'LONG' 
                          ? 'text-success' 
                          : tf.signal === 'SHORT' 
                            ? 'text-danger' 
                            : 'text-neutral'
                      }`}>
                        {tf.trend} ({tf.signal})
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral">Signal Strength</div>
                      <div className="w-24 bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            tf.signal === 'LONG' 
                              ? 'bg-success' 
                              : tf.signal === 'SHORT' 
                                ? 'bg-danger' 
                                : 'bg-neutral'
                          }`} 
                          style={{ width: `${tf.strength}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* No leverage recommendation or position size - removed as requested */}
                  
                  {/* Entry strategy */}
                  <div className="text-xs p-2 bg-gray-700 rounded">
                    <p className="font-medium text-white mb-1">
                      {tf.signal === 'LONG' 
                        ? 'Long Entry Strategy' 
                        : tf.signal === 'SHORT' 
                          ? 'Short Entry Strategy'
                          : 'Neutral - Wait for Clear Signal'}
                    </p>
                    <p className="text-neutral">
                      {tf.signal === 'LONG' 
                        ? 'Buy on support levels with stop below recent low. Average in on dips.' 
                        : tf.signal === 'SHORT' 
                          ? 'Sell on resistance levels with stop above recent high. Average in on rallies.'
                          : 'Market is ranging. Consider break-out strategies or wait for stronger directional signals.'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          <div className="overflow-x-auto mt-3">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-neutral border-b border-gray-700">
                  <th className="py-2 text-left">Timeframe</th>
                  <th className="py-2 text-center">Signal</th>
                  <th className="py-2 text-center">Strength</th>
                  <th className="py-2 text-center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {timeframeSignals.map((tf) => (
                  <tr key={tf.timeframe} className="border-b border-gray-800">
                    <td className="py-2 font-medium">{tf.timeframe}</td>
                    <td className={`py-2 text-center font-medium ${
                      tf.signal === 'LONG' 
                        ? 'text-success' 
                        : tf.signal === 'SHORT' 
                          ? 'text-danger' 
                          : 'text-neutral'
                    }`}>
                      {tf.signal}
                    </td>
                    <td className="py-2 text-center">
                      <div className="inline-block w-16 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            tf.signal === 'LONG' 
                              ? 'bg-success' 
                              : tf.signal === 'SHORT' 
                                ? 'bg-danger' 
                                : 'bg-neutral'
                          }`} 
                          style={{ width: `${tf.strength}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className={`py-2 text-center ${
                      tf.trend === 'Bullish' 
                        ? 'text-success' 
                        : tf.trend === 'Bearish' 
                          ? 'text-danger' 
                          : 'text-neutral'
                    }`}>
                      {tf.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TimeframeAnalysis;
