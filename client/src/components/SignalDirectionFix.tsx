/**
 * This component ensures the signal direction and arrow always match
 * It's used to override and fix inconsistent signals in weekly and monthly timeframes
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TimeFrame } from '../types';
import { AdvancedSignal } from '../lib/advancedSignals';

interface SignalIconDisplayProps {
  signal: AdvancedSignal | null;
  timeframe: TimeFrame;
  size?: 'sm' | 'md' | 'lg';
}

// This component always shows the correct icon based on the signal's direction
export const SignalIconDisplay: React.FC<SignalIconDisplayProps> = ({ 
  signal, 
  timeframe,
  size = 'md'
}) => {
  // Icon sizes based on requested size
  const iconSize = size === 'sm' ? "w-5 h-5" : 
                  size === 'lg' ? "w-10 h-10" : 
                  "w-8 h-8";
  
  // Background styling based on signal direction
  const bgStyle = signal?.direction === 'LONG' ? 'bg-green-500/20' : 
                 signal?.direction === 'SHORT' ? 'bg-red-500/20' : 
                 'bg-gray-500/20';

  // Text color based on signal direction                 
  const textColor = signal?.direction === 'LONG' ? 'text-green-500' : 
                   signal?.direction === 'SHORT' ? 'text-red-500' : 
                   'text-gray-400';

  return (
    <div className={`p-2 rounded-full ${bgStyle}`}>
      {signal?.direction === 'LONG' ? 
        <TrendingUp className={`${iconSize} ${textColor}`} /> : 
        signal?.direction === 'SHORT' ? 
        <TrendingDown className={`${iconSize} ${textColor}`} /> :
        <Minus className={`${iconSize} ${textColor}`} />
      }
    </div>
  );
};

export default SignalIconDisplay;