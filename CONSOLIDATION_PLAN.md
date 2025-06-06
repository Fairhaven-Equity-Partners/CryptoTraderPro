# Codebase Consolidation Plan

## 1. Component Consolidation Strategy

### Redundant Components to Remove:
- `PerformanceDashboard.tsx` (replace with enhanced CompactPerformanceDashboard)
- `OptimizedSignalDashboard.tsx` (unused/duplicate)
- Unused imports in Analysis.tsx

### Font & Styling Standardization:
- Standardize on `font-mono` for all numeric data
- Use consistent text sizing: xs, sm, base hierarchy  
- Unified color scheme: gray-900 backgrounds, consistent borders
- Standardized padding: p-2 for compact cards, p-3 for larger cards

## 2. Enhanced Unified Performance Component

Create single `UnifiedPerformancePanel.tsx` that combines:
- Technical analysis indicators (from EnhancedTechnicalAnalysis)
- Performance metrics (from CompactPerformanceDashboard)  
- Real-time signal data
- Consistent styling throughout

## 3. Layout Simplification

Current flow:
1. Advanced Signal Dashboard (Market Analysis)
2. Enhanced Technical Analysis  
3. Compact Performance Dashboard
4. Signal Heatmap

Proposed simplified flow:
1. Advanced Signal Dashboard (Market Analysis)
2. **Unified Performance Panel** (combines technical + performance)
3. Signal Heatmap

## 4. Styling Standards

### Typography:
- Headers: `text-sm font-mono` 
- Values: `text-xs font-mono`
- Labels: `text-xs font-mono text-gray-400`

### Colors:
- Background: `bg-gray-900`
- Borders: `border-gray-800`
- Text: `text-white` (primary), `text-gray-400` (secondary)
- Success: `text-green-400`
- Warning: `text-yellow-400`  
- Error: `text-red-400`

### Spacing:
- Card padding: `p-2` (compact), `p-3` (standard)
- Gap between elements: `gap-2` (compact), `gap-3` (standard)
- Section spacing: `space-y-2`

## 5. Implementation Steps

1. Create UnifiedPerformancePanel with standardized styling
2. Remove redundant components
3. Update Analysis.tsx layout
4. Clean up unused imports
5. Test functionality preservation