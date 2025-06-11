#!/bin/bash
# Emergency restore script for the working dashboard

echo "Restoring working dashboard backup..."

# Copy the working backup to replace the current dashboard
cp backup/AdvancedSignalDashboard_working.tsx client/src/components/AdvancedSignalDashboard.tsx

# Update the import in Analysis.tsx
sed -i 's/ConsolidatedSignalDashboard/AdvancedSignalDashboard/g' client/src/pages/Analysis.tsx

echo "Backup restored successfully!"
echo "The original working dashboard is now active."
echo "Restart the application to see the changes."