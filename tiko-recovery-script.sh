#!/bin/bash

# TIKO Platform Recovery Script
# This script helps restore your project to its previous working state
# Created: April 25, 2025

echo "Starting TIKO platform recovery process..."

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Restore dashboard.js from backup if it exists
if [ -f "pages/dashboard.js.backup" ]; then
  echo "Restoring dashboard.js from backup..."
  cp pages/dashboard.js.backup pages/dashboard.js
else
  echo "Warning: No dashboard.js.backup found. Cannot restore from backup."
  echo "Checking for Git history to restore dashboard.js..."
  
  # Try to restore from Git history
  git checkout -- pages/dashboard.js
  if [ $? -eq 0 ]; then
    echo "Restored dashboard.js from Git history."
  else
    echo "Error: Could not restore dashboard.js from Git history."
    echo "You may need to manually edit the file to fix import errors."
  fi
fi

# Remove any newly created components that might be causing issues
echo "Removing newly created components..."
rm -f components/SideBySideLayout.js
rm -f styles/SideBySideLayout.module.css
rm -f components/EnhancedEventList.js
rm -f styles/EnhancedEventList.module.css
rm -f components/MobileOptimizedVibeQuiz.js
rm -f styles/MobileOptimizedVibeQuiz.module.css
rm -f styles/Dashboard.module.css

# Fix import errors in dashboard.js if backup wasn't available
if [ ! -f "pages/dashboard.js.backup" ]; then
  echo "Fixing import errors in dashboard.js..."
  
  # Remove problematic imports
  sed -i '/import SideBySideLayout from/d' pages/dashboard.js
  sed -i '/import EnhancedEventList from/d' pages/dashboard.js
  sed -i '/import MobileOptimizedVibeQuiz from/d' pages/dashboard.js
  sed -i '/import.*SoundCharacteristics/d' pages/dashboard.js
  
  # Remove showVibeQuiz state if it exists
  sed -i '/const \[showVibeQuiz, setShowVibeQuiz\]/d' pages/dashboard.js
  
  # Remove vibe quiz modal if it exists
  sed -i '/{showVibeQuiz && (/,/)})/d' pages/dashboard.js
  
  # Remove handleVibeQuizSave function if it exists
  sed -i '/const handleVibeQuizSave/,/};/d' pages/dashboard.js
  
  echo "Fixed import errors in dashboard.js"
fi

# Commit the restoration
echo "Committing restoration..."
git add pages/dashboard.js
git commit -m "Restore dashboard to previous working state"

# Push to Heroku
echo "Pushing to Heroku..."
git push -f heroku main

echo "Recovery complete. Your dashboard should be restored to its previous state."
echo "Visit https://sonar-edm-user-50e4fb038f6e.herokuapp.com to verify."
echo ""
echo "For future tasks, please run the project-state-capture.sh script first"
echo "and share its output to maintain continuity between tasks."
