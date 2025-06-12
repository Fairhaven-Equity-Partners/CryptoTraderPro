import { useState, useEffect } from 'react';
import { MacroData, getMacroIndicators, analyzeMacroEnvironment, getMacroEnvironmentClassification, getMacroInsights } from '../lib/macroIndicators';

export function useMacroIndicators() {
  const [macroData, setMacroData] = useState<MacroData>(getMacroIndicators());
  const [macroScore, setMacroScore] = useState<number>(0);
  const [macroClassification, setMacroClassification] = useState<string>('');
  const [macroInsights, setMacroInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current macro data
        const data = getMacroIndicators();
        
        if (isMounted) {
          setMacroData(data);
          
          // Calculate score and classifications
          const analysisResult = analyzeMacroEnvironment('BTC/USDT');
          setMacroScore(analysisResult.score);
          
          const classification = getMacroEnvironmentClassification('BTC/USDT');
          setMacroClassification(classification);
          
          const insights = getMacroInsights('BTC/USDT');
          setMacroInsights(insights);
          
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return {
    macroData,
    macroScore,
    macroClassification,
    macroInsights,
    isLoading,
    error
  };
}