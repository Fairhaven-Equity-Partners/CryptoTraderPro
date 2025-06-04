/**
 * Optimized Typography System - Streamlined consistent styling
 */

export const typography = {
  title: 'text-sm font-medium text-slate-200',
  cardTitle: 'text-sm font-medium text-slate-200',
  label: 'text-xs text-slate-400',
  value: 'text-xs font-medium text-white',
  valuePositive: 'text-xs font-medium text-green-300',
  valueNegative: 'text-xs font-medium text-red-300',
  valueWarning: 'text-xs font-medium text-yellow-300',
  valueNeutral: 'text-xs font-medium text-blue-300',
  badge: 'text-xs font-medium',
  iconSmall: 'h-3 w-3',
  description: 'text-xs text-slate-400',
} as const;

// Backward compatibility
export const specializedTypography = {
  priceMain: 'text-sm font-medium text-white',
  priceLarge: 'text-base font-semibold text-white',
  percentagePositive: 'text-xs font-medium text-green-300',
  percentageNegative: 'text-xs font-medium text-red-300',
};