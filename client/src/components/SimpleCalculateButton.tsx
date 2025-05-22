import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { RefreshCcw } from "lucide-react";
import { useToast } from '../hooks/use-toast';

interface SimpleCalculateButtonProps {
  symbol: string;
  onCalculate?: () => void;
}

export default function SimpleCalculateButton({ symbol, onCalculate }: SimpleCalculateButtonProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch the current price for the symbol
  useEffect(() => {
    async function fetchPrice() {
      try {
        const response = await fetch(`/api/crypto/${symbol}`);
        const data = await response.json();
        setPrice(data.lastPrice);
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    }
    
    fetchPrice();
    
    // Refresh price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [symbol]);
  
  // Handle the calculate button click
  const handleCalculate = async () => {
    if (!price) {
      toast({
        title: "Price Unavailable",
        description: "Unable to calculate signals without a current price.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCalculating(true);
    
    try {
      toast({
        title: "Calculation Started",
        description: "Generating signals for all timeframes...",
      });
      
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sync with server
      await fetch('/api/sync-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, price }),
      });
      
      // Call the parent handler if provided
      if (onCalculate) {
        onCalculate();
      }
      
      toast({
        title: "Calculation Complete",
        description: `Analysis updated for ${symbol}`,
      });
    } catch (error) {
      toast({
        title: "Calculation Error",
        description: `Failed to generate signals: ${error}`,
        variant: "destructive",
      });
      console.error("Error in calculation:", error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  return (
    <div className="flex justify-end mb-4">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleCalculate}
        disabled={isCalculating || !price}
        className="text-xs bg-indigo-900/30 text-indigo-300 border-indigo-800 hover:bg-indigo-800/50 hover:text-indigo-200 font-medium"
      >
        {isCalculating ? (
          <>
            <RefreshCcw className="mr-1 h-3 w-3 animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <RefreshCcw className="mr-1 h-3 w-3" />
            Calculate Now
          </>
        )}
      </Button>
    </div>
  );
}