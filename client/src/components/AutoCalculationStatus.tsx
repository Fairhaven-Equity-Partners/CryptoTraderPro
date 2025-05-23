import React from 'react';
import { CheckCircle2, RefreshCcw } from "lucide-react";

interface AutoCalculationStatusProps {
  isCalculating: boolean;
}

/**
 * A simple component to display the status of automatic calculations
 * replacing the old "Calculate Now" and "Quick Update" buttons
 */
export const AutoCalculationStatus: React.FC<AutoCalculationStatusProps> = ({ 
  isCalculating 
}) => {
  return (
    <div className="flex items-center h-7 text-xs px-2 py-1 bg-emerald-900/30 text-emerald-300 border border-emerald-800 rounded-md">
      {isCalculating ? (
        <>
          <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
          Calculating...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Auto-calculations enabled
        </>
      )}
    </div>
  );
};

export default AutoCalculationStatus;