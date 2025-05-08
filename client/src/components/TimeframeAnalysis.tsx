import React from 'react';
import { useMultiTimeframeAnalysis } from '../hooks/useSignalAnalysis';
import { Progress } from '@/components/ui/progress';

interface TimeframeAnalysisProps {
  symbol: string;
}

const TimeframeAnalysis: React.FC<TimeframeAnalysisProps> = ({ symbol }) => {
  const { timeframeSignals, dominantDirection } = useMultiTimeframeAnalysis(symbol);
  
  return (
    <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
      <h2 className="text-white text-lg font-medium mb-3">Multi-Timeframe Analysis</h2>
      
      <div className="overflow-x-auto">
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
    </div>
  );
};

export default TimeframeAnalysis;
