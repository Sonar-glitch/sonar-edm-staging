#!/bin/bash

# TIKO Platform Dashboard Improvements Deployment Script
# This script verifies component integration and deploys to Heroku
# Created: April 25, 2025

echo "Starting TIKO dashboard deployment at $(date +%Y%m%d%H%M%S)"
echo "This script will verify component integration and deploy to Heroku"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
git branch backup-before-deployment-$(date +%Y%m%d%H%M%S)
echo "Backup branch created successfully"

# Verify required components exist
echo "Verifying required components..."

# Check for SideBySideLayout
if [ ! -f "components/SideBySideLayout.js" ]; then
  echo "SideBySideLayout component not found, creating from layout-improvements..."
  mkdir -p components
  mkdir -p styles
  cp -f layout-improvements/SideBySideLayout.js components/
  cp -f layout-improvements/SideBySideLayout.module.css styles/
  echo "SideBySideLayout component created successfully"
fi

# Check for CompactSoundCharacteristics
if [ ! -f "components/CompactSoundCharacteristics.js" ]; then
  echo "CompactSoundCharacteristics component not found, creating from layout-improvements..."
  cp -f layout-improvements/CompactSoundCharacteristics.js components/
  cp -f layout-improvements/CompactSoundCharacteristics.module.css styles/
  echo "CompactSoundCharacteristics component created successfully"
fi

# Check for CompactSeasonalVibes
if [ ! -f "components/CompactSeasonalVibes.js" ]; then
  echo "CompactSeasonalVibes component not found, creating from layout-improvements..."
  cp -f layout-improvements/CompactSeasonalVibes.js components/
  cp -f layout-improvements/CompactSeasonalVibes.module.css styles/
  echo "CompactSeasonalVibes component created successfully"
fi

# Check for EnhancedEventList
if [ ! -f "components/EnhancedEventList.js" ]; then
  echo "EnhancedEventList component not found, checking for ImprovedEventList..."
  if [ -f "components/ImprovedEventList.js" ]; then
    echo "Using ImprovedEventList as EnhancedEventList..."
    cp -f components/ImprovedEventList.js components/EnhancedEventList.js
    if [ -f "styles/ImprovedEventList.module.css" ]; then
      cp -f styles/ImprovedEventList.module.css styles/EnhancedEventList.module.css
    fi
    echo "EnhancedEventList component created successfully"
  else
    echo "Creating EnhancedEventList from layout-improvements..."
    cp -f layout-improvements/EnhancedEventList.js components/ 2>/dev/null || echo "Warning: EnhancedEventList.js not found in layout-improvements"
    cp -f layout-improvements/EnhancedEventList.module.css styles/ 2>/dev/null || echo "Warning: EnhancedEventList.module.css not found in layout-improvements"
    echo "EnhancedEventList component creation attempted"
  fi
fi

# Check for MobileOptimizedVibeQuiz
if [ ! -f "components/MobileOptimizedVibeQuiz.js" ]; then
  echo "MobileOptimizedVibeQuiz component not found, creating from layout-improvements..."
  cp -f layout-improvements/MobileOptimizedVibeQuiz.js components/
  cp -f layout-improvements/MobileOptimizedVibeQuiz.module.css styles/
  echo "MobileOptimizedVibeQuiz component created successfully"
fi

# Verify dashboard.js imports
echo "Verifying dashboard.js imports..."
DASHBOARD_FILE="pages/dashboard.js"

# Create backup of dashboard.js
cp -f "$DASHBOARD_FILE" "${DASHBOARD_FILE}.backup"
echo "Created backup of dashboard.js at ${DASHBOARD_FILE}.backup"

# Check if dashboard.js contains required imports
MISSING_IMPORTS=0

if ! grep -q "import SideBySideLayout from" "$DASHBOARD_FILE"; then
  echo "Warning: SideBySideLayout import not found in dashboard.js"
  MISSING_IMPORTS=1
fi

if ! grep -q "import CompactSoundCharacteristics from" "$DASHBOARD_FILE"; then
  echo "Warning: CompactSoundCharacteristics import not found in dashboard.js"
  MISSING_IMPORTS=1
fi

if ! grep -q "import CompactSeasonalVibes from" "$DASHBOARD_FILE"; then
  echo "Warning: CompactSeasonalVibes import not found in dashboard.js"
  MISSING_IMPORTS=1
fi

if ! grep -q "import EnhancedEventList from" "$DASHBOARD_FILE"; then
  echo "Warning: EnhancedEventList import not found in dashboard.js"
  MISSING_IMPORTS=1
fi

if ! grep -q "import MobileOptimizedVibeQuiz from" "$DASHBOARD_FILE"; then
  echo "Warning: MobileOptimizedVibeQuiz import not found in dashboard.js"
  MISSING_IMPORTS=1
fi

# Check if dashboard.js uses SideBySideLayout
if ! grep -q "<SideBySideLayout>" "$DASHBOARD_FILE"; then
  echo "Warning: SideBySideLayout component not used in dashboard.js"
  MISSING_IMPORTS=1
fi

# Check if dashboard.js uses EnhancedEventList
if ! grep -q "<EnhancedEventList" "$DASHBOARD_FILE"; then
  echo "Warning: EnhancedEventList component not used in dashboard.js"
  MISSING_IMPORTS=1
fi

# Check if dashboard.js uses MobileOptimizedVibeQuiz
if ! grep -q "<MobileOptimizedVibeQuiz" "$DASHBOARD_FILE"; then
  echo "Warning: MobileOptimizedVibeQuiz component not used in dashboard.js"
  MISSING_IMPORTS=1
fi

# If missing imports, provide instructions
if [ "$MISSING_IMPORTS" -eq 1 ]; then
  echo "Some required imports or component usages are missing in dashboard.js"
  echo "Please review the dashboard.js file and ensure all components are properly imported and used"
  echo "You can use the backup file at ${DASHBOARD_FILE}.backup if needed"
else
  echo "All required imports and component usages found in dashboard.js"
fi

# Check for recharts dependency
echo "Checking for recharts dependency..."
if ! grep -q '"recharts"' package.json; then
  echo "Adding recharts dependency..."
  # Use npm to add recharts
  npm install --save recharts
  echo "Recharts dependency added successfully"
else
  echo "Recharts dependency already exists"
fi

# Verify component integration
echo "Verifying component integration..."

# Check if components are properly integrated
if grep -q "<SideBySideLayout>" "$DASHBOARD_FILE" && \
   grep -q "<CompactSoundCharacteristics" "$DASHBOARD_FILE" && \
   grep -q "<CompactSeasonalVibes" "$DASHBOARD_FILE" && \
   grep -q "<EnhancedEventList" "$DASHBOARD_FILE" && \
   grep -q "<MobileOptimizedVibeQuiz" "$DASHBOARD_FILE"; then
  echo "All components are properly integrated in dashboard.js"
else
  echo "Warning: Not all components are properly integrated in dashboard.js"
  echo "Please review the dashboard.js file and ensure all components are properly used"
fi

# Commit changes
echo "Committing changes..."
git add components/
git add styles/
git add pages/
git add package.json
git commit -m "Implement dashboard improvements: side-by-side layout, enhanced event list, and mobile-optimized vibe quiz"

# Push to Heroku
echo "Pushing changes to Heroku with force flag..."
git push -f heroku main

# Check deployment status
echo "Checking deployment status..."
heroku logs --tail --app sonar-edm-user &
HEROKU_LOGS_PID=$!

# Wait for deployment to complete (or timeout after 2 minutes)
echo "Waiting for deployment to complete (timeout: 2 minutes)..."
sleep 120
kill $HEROKU_LOGS_PID

# Verify deployment
echo "Verifying deployment..."
heroku ps --app sonar-edm-user

echo "Deployment complete! Your improved dashboard should be live at:"
echo "https://sonar-edm-user-50e4fb038f6e.herokuapp.com"

echo "If you don't see your changes, please check the Heroku logs:"
echo "heroku logs --app sonar-edm-user"

echo "TIKO dashboard deployment completed at $(date +%Y%m%d%H%M%S)"
