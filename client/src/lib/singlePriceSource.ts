/**
 * SinglePriceSource - A central price manager for the entire application
 * 
 * This module provides a single source of truth for cryptocurrency prices
 * throughout the application, ensuring all components show consistent values.
 */

import { fetchAssetBySymbol } from './api';

// Global price storage - serves as our centralized price registry
type PriceRegistry = {
  [symbol: string]: {
    price: number;
    lastUpdated: Date;
  }
};

// Our in-memory price registry
const priceRegistry: PriceRegistry = {};

/**
 * Get a price from the registry or fetch it from the API
 */
export async function getPrice(symbol: string): Promise<number> {
  // Check if we have a recent price (less than 15 seconds old)
  const entry = priceRegistry[symbol];
  const now = new Date();
  const isFresh = entry && 
    (now.getTime() - entry.lastUpdated.getTime() < 15000);
  
  if (isFresh) {
    return entry.price;
  }
  
  // If no recent price, fetch a new one
  try {
    const data = await fetchAssetBySymbol(symbol);
    if (data && data.price) {
      // Update the registry
      priceRegistry[symbol] = {
        price: data.price,
        lastUpdated: new Date()
      };
      return data.price;
    }
  } catch (err) {
    console.error(`Error fetching price for ${symbol}:`, err);
  }
  
  // Return existing price as authentic or 0
  return entry ? entry.price : 0;
}

/**
 * Update a price in the registry directly
 */
export function updatePrice(symbol: string, price: number): void {
  priceRegistry[symbol] = {
    price,
    lastUpdated: new Date()
  };
  
  // Broadcast price update event for components to react
  const event = new CustomEvent('price-updated', {
    detail: { symbol, price }
  });
  window.dispatchEvent(event);
  document.dispatchEvent(event);
}

/**
 * Listen for price updates
 */
export function onPriceUpdate(
  callback: (symbol: string, price: number) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      callback(customEvent.detail.symbol, customEvent.detail.price);
    }
  };
  
  window.addEventListener('price-updated', handler);
  document.addEventListener('price-updated', handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('price-updated', handler);
    document.removeEventListener('price-updated', handler);
  };
}