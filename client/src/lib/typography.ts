/**
 * Typography System - Consistent font sizes and text classes
 * Provides unified text styling across the entire application
 */

export const typography = {
  // Component titles and headings
  title: 'text-sm font-medium text-slate-200',
  
  // Card headers and section titles
  cardTitle: 'text-sm font-medium text-slate-200',
  
  // Data labels and descriptions
  label: 'text-xs text-slate-400',
  
  // Primary data values (prices, percentages, etc.)
  value: 'text-xs font-mono font-medium text-white',
  
  // Secondary data values
  valueSecondary: 'text-xs font-mono font-medium text-slate-300',
  
  // Success/positive values
  valuePositive: 'text-xs font-mono font-medium text-green-300',
  
  // Error/negative values
  valueNegative: 'text-xs font-mono font-medium text-red-300',
  
  // Warning values
  valueWarning: 'text-xs font-mono font-medium text-yellow-300',
  
  // Neutral values
  valueNeutral: 'text-xs font-mono font-medium text-blue-300',
  
  // Small descriptive text
  description: 'text-xs text-slate-400',
  
  // Badge text
  badge: 'text-xs font-medium',
  
  // Button text
  button: 'text-xs font-medium',
  
  // Icon sizes
  iconSmall: 'h-3 w-3',
  iconMedium: 'h-4 w-4',
  iconLarge: 'h-5 w-5',
} as const;

// Helper function to get consistent classes
export function getTypographyClass(type: keyof typeof typography): string {
  return typography[type];
}

// Specialized classes for specific use cases
export const specializedTypography = {
  // Price display
  priceMain: 'text-sm font-mono font-medium text-white',
  priceLarge: 'text-base font-mono font-semibold text-white',
  
  // Percentage changes
  percentagePositive: 'text-xs font-mono font-medium text-green-300',
  percentageNegative: 'text-xs font-mono font-medium text-red-300',
  
  // Signal confidence
  confidenceHigh: 'text-xs font-mono font-medium text-green-300',
  confidenceMedium: 'text-xs font-mono font-medium text-yellow-300',
  confidenceLow: 'text-xs font-mono font-medium text-red-300',
  
  // Timeframe labels
  timeframe: 'text-xs font-mono font-medium text-slate-300',
  
  // Status indicators
  statusActive: 'text-xs font-mono font-medium text-green-300',
  statusInactive: 'text-xs font-mono font-medium text-slate-400',
  statusWarning: 'text-xs font-mono font-medium text-yellow-300',
  statusError: 'text-xs font-mono font-medium text-red-300',
} as const;