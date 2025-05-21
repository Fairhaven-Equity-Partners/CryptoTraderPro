/**
 * This component ensures 100% consistency between signal direction and icons
 * Used as a direct replacement for signal displays in key components
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TimeFrame } from '../types';

type Direction = 'LONG' | 'SHORT' | 'NEUTRAL';

interface ConsistentSignalDisplayProps {
  direction: Direction;
  timeframe?: TimeFrame;
  size?: 'sm' | 'md' | 'lg';
  withLabel?: boolean;
}

// This component guarantees the icon always matches the direction
const ConsistentSignalDisplay: React.FC<ConsistentSignalDisplayProps> = ({
  direction,
  size = 'md',
  withLabel = true
}) => {
  // Icon sizes based on requested size
  const iconSize = size === 'sm' ? "h-5 w-5" : 
                size === 'lg' ? "h-10 w-10" : 
                "h-8 w-8";
  
  // Text style for the labels
  const labelStyle = size === 'sm' ? "text-sm" : 
                   size === 'lg' ? "text-xl" : 
                   "text-base";
  
  return (
    <div className="flex items-center">
      {direction === 'LONG' && (
        <>
          <TrendingUp className={`mr-2 ${iconSize} text-green-400`} />
          {withLabel && <span className={`text-green-400 ${labelStyle}`}>Long Signal</span>}
        </>
      )}
      {direction === 'SHORT' && (
        <>
          <TrendingDown className={`mr-2 ${iconSize} text-red-400`} />
          {withLabel && <span className={`text-red-400 ${labelStyle}`}>Short Signal</span>}
        </>
      )}
      {direction === 'NEUTRAL' && (
        <>
          <Minus className={`mr-2 ${iconSize} text-gray-400`} />
          {withLabel && <span className={`text-gray-400 ${labelStyle}`}>Neutral</span>}
        </>
      )}
    </div>
  );
};

export default ConsistentSignalDisplay;