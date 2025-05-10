import { useState, useEffect, useCallback } from 'react';
import { 
  getMacroIndicators, 
  refreshMacroIndicators, 
  analyzeMacroEnvironment, 
  getMacroEnvironmentClassification,
  getMacroInsights,
  MacroData
} from '../lib/macroIndicators';

export function useMacroIndicators() {
  const [macroData, setMacroData] = useState<MacroData>(getMacroIndicators());
  const [macroScore, setMacroScore] = useState<number>(analyzeMacroEnvironment());
  const [macroClassification, setMacroClassification] = useState<string>(getMacroEnvironmentClassification());
  const [macroInsights, setMacroInsights] = useState<string[]>(getMacroInsights());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Refresh the macro data
      const newData = await refreshMacroIndicators();
      
      // Update state with new data
      setMacroData(newData);
      setMacroScore(analyzeMacroEnvironment());
      setMacroClassification(getMacroEnvironmentClassification());
      setMacroInsights(getMacroInsights());
      
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch macro indicators'));
      setIsLoading(false);
    }
  }, []);

  // Fetch data on initial render
  useEffect(() => {
    refreshData();
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshData]);

  return {
    macroData,
    macroScore,
    macroClassification,
    macroInsights,
    isLoading,
    error,
    refreshData
  };
}