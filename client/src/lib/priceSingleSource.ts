/**
 * SIMPLE PRICE SYSTEM
 * This module provides a clean, simple source of price data for all components
 */

import { fetchAssetBySymbol } from './api';

// Central event bus for price updates
export function broadcastPriceUpdate(symbol: string, price: number) {
  // Create and dispatch a custom event with the price data
  const event = new CustomEvent('price-update', {
    detail: { symbol, price }
  });
  
  // Broadcast to both window and document to maximize capture
  window.dispatchEvent(event);
  document.dispatchEvent(event);
  
  console.log(`Broadcasting price update: ${symbol} = ${price}`);
}

// Get latest price from the API
export async function fetchLatestPrice(symbol: string): Promise<number> {
  try {
    const data = await fetchAssetBySymbol(symbol);
    if (data && data.price) {
      // Broadcast this new price to all components
      broadcastPriceUpdate(symbol, data.price);
      return data.price;
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
  }
  return 0;
}

// Subscribe to price updates
export function subscribeToPrice(
  symbol: string, 
  callback: (price: number) => void
): () => void {
  // Create the event handler
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail && detail.symbol === symbol) {
      callback(detail.price);
    }
  };
  
  // Add event listeners
  window.addEventListener('price-update', handler);
  document.addEventListener('price-update', handler);
  
  // Return an unsubscribe function
  return () => {
    window.removeEventListener('price-update', handler);
    document.removeEventListener('price-update', handler);
  };
}

// Start price polling for a symbol
export function startPricePolling(symbol: string, intervalMs: number = 15000): () => void {
  // Fetch immediately
  fetchLatestPrice(symbol);
  
  // Set up interval
  const intervalId = setInterval(() => {
    fetchLatestPrice(symbol);
  }, intervalMs);
  
  // Return a cleanup function
  return () => clearInterval(intervalId);
}