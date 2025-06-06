import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { Badge } from './ui/badge';

interface AutoCalculationStatusProps {
  isCalculating: boolean;
  nextUpdateIn?: string;
}

/**
 * A simple component to display the status of automatic calculations
 * replacing the old "Calculate Now" and "Quick Update" buttons
 */
export const AutoCalculationStatus: React.FC<AutoCalculationStatusProps> = ({ 
  isCalculating, 
  nextUpdateIn 
}) => {
  if (isCalculating) {
    return (
      <Badge 
        variant="outline" 
        className="text-xs bg-amber-900/30 text-amber-300 border-amber-800 px-3 py-1 animate-pulse"
      >
        <Clock className="w-3 h-3 mr-1" />
        UPDATING SIGNALS...
      </Badge>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant="outline" 
        className="text-xs bg-emerald-900/30 text-emerald-300 border-emerald-800 px-3 py-1"
      >
        <CheckCircle2 className="w-3 h-3 mr-1" />
        AUTO-CALCULATIONS ENABLED
      </Badge>
      {nextUpdateIn && (
        <span className="text-xs text-slate-400">
          Next update in {nextUpdateIn}
        </span>
      )}
    </div>
  );
};