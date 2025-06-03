# Emergency Backup Locations

## Current Working Dashboard Backup
**File:** `backup/AdvancedSignalDashboard_working.tsx`
- This is the last known working version before condensing
- Contains all original functionality and features
- Safe fallback if anything breaks

## How to Restore Backup Quickly

### Option 1: Quick Restore Command
```bash
cp backup/AdvancedSignalDashboard_working.tsx client/src/components/AdvancedSignalDashboard.tsx
```

### Option 2: Manual Restore
1. Open `backup/AdvancedSignalDashboard_working.tsx`
2. Copy all content
3. Replace content in `client/src/components/AdvancedSignalDashboard.tsx`
4. Update import in `client/src/pages/Analysis.tsx` back to:
   ```typescript
   import AdvancedSignalDashboard from '../components/AdvancedSignalDashboard';
   ```

## Backup File Locations
- **Main Backup:** `backup/AdvancedSignalDashboard_working.tsx`
- **Broken Version:** `backup/AdvancedSignalDashboard_broken.tsx`
- **Original Version:** `backup/AdvancedSignalDashboard.tsx`

## Current Active Files
- **Active Dashboard:** `client/src/components/ConsolidatedSignalDashboard.tsx`
- **Page Import:** `client/src/pages/Analysis.tsx` (imports ConsolidatedSignalDashboard)

## Emergency Restore Steps
If the new dashboard has issues:
1. Run: `cp backup/AdvancedSignalDashboard_working.tsx client/src/components/AdvancedSignalDashboard.tsx`
2. Change import in Analysis.tsx from ConsolidatedSignalDashboard to AdvancedSignalDashboard
3. Everything will work exactly as before