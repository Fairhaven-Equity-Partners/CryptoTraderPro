declare global {
  interface Window {
    triggerSignalCalculation?: (symbol: string, price: number) => void;
  }
}

export {};