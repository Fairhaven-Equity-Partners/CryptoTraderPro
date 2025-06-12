import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { Badge } from './ui/badge';

interface AutoCalculationStatusProps {
  isCalculating: boolean;
  nextUpdateIn?: string;
}

/**
 * Synchronized timer display showing countdown from ultimateSystemManager
 */
export const AutoCalculationStatus: React.FC<AutoCalculationStatusProps> = ({ 
  isCalculating, 
  nextUpdateIn 
}) => {
  const [countdown, setCountdown] = useState<number>(240);
  const [syncStatus, setSyncStatus] = useState<string>('Synchronized');

  // Listen for synchronized timer updates from ultimateSystemManager
  useEffect(() => {
    const handleSyncEvent = (event: CustomEvent) => {
      if (event.detail?.timestamp && event.detail?.interval === '4-minute') {
        setSyncStatus('Calculating...');
        setCountdown(240); // Reset to 4 minutes
        
        setTimeout(() => setSyncStatus('Synchronized'), 2000);
      }
    };

    // Listen for calculation events
    window.addEventListener('synchronized-calculation-complete', handleSyncEvent as EventListener);
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      window.removeEventListener('synchronized-calculation-complete', handleSyncEvent as EventListener);
      clearInterval(timer);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')`}`;
  };

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
        {syncStatus.toUpperCase()}
      </Badge>
      <span className="text-xs text-slate-400">
        Next update in {formatTime(countdown)}
      </span>
    </div>
  );
};