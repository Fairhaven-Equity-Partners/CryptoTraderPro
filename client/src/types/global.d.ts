declare global {
  interface Window {
    triggerSignalCalculation?: (symbol: string, price: number) => void;
    syncGlobalPrice?: (symbol: string, price: number, timestamp?: number) => number;
    getUltimateSystemStatus?: () => {
      initialized: boolean;
      timerActive: boolean;
      nextFetch: number;
      components: string[];
    };
    latestPriceEvents?: Record<string, { price: number; timestamp: number }>;
  }
}

export {};