#!/bin/bash

# Project State Capture Script for TIKO/Sonar EDM Platform
# This script captures the current state of your project for continuity between tasks
# Created: April 25, 2025

echo "=== TIKO/Sonar EDM Platform - Project State Capture ==="
echo "Executed on: $(date)"
echo ""

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Get latest commit
echo "Latest commit:"
git log -1 --pretty=format:"%h - %an, %ar : %s"
echo -e "\n"

# List all directories in the project
echo "Project directory structure:"
find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/\.next/*" | sort
echo ""

# List all components
echo "React components:"
find ./components -type f -name "*.js" -o -name "*.jsx" -o -name "*.tsx" | sort
echo ""

# List all pages
echo "Next.js pages:"
find ./pages -type f -name "*.js" -o -name "*.jsx" -o -name "*.tsx" | sort
echo ""

# List all style files
echo "Style files:"
find . -type f -name "*.css" -o -name "*.scss" -o -name "*.module.css" -o -name "*.module.scss" | grep -v "node_modules" | sort
echo ""

# Get package.json dependencies
echo "Dependencies from package.json:"
grep -A 50 '"dependencies"' package.json | grep -B 50 '"devDependencies"' || grep -A 50 '"dependencies"' package.json
echo ""

# Check for key components
echo "Key component check:"

# Sound characteristics component
if [ -f "components/SoundCharacteristics.js" ]; then
  echo "✅ SoundCharacteristics component exists"
elif [ -f "components/SonicSignature.js" ]; then
  echo "✅ SonicSignature component exists (alternative to SoundCharacteristics)"
else
  echo "❌ No sound characteristics component found"
fi

# Seasonal vibes component
if [ -f "components/SeasonalVibes.js" ]; then
  echo "✅ SeasonalVibes component exists"
elif [ -f "components/ReorganizedSeasonalVibes.js" ]; then
  echo "✅ ReorganizedSeasonalVibes component exists (alternative to SeasonalVibes)"
else
  echo "❌ No seasonal vibes component found"
fi

# Event list component
if [ -f "components/EventList.js" ]; then
  echo "✅ EventList component exists"
elif [ -f "components/EnhancedEventList.js" ]; then
  echo "✅ EnhancedEventList component exists (enhanced version)"
elif [ -f "components/ImprovedEventList.js" ]; then
  echo "✅ ImprovedEventList component exists (improved version)"
else
  echo "❌ No event list component found"
fi

# Side-by-side layout component
if [ -f "components/SideBySideLayout.js" ]; then
  echo "✅ SideBySideLayout component exists"
else
  echo "❌ No side-by-side layout component found"
fi

# Vibe quiz component
if [ -f "components/MobileOptimizedVibeQuiz.js" ]; then
  echo "✅ MobileOptimizedVibeQuiz component exists"
elif [ -f "components/VibeQuiz.js" ]; then
  echo "✅ VibeQuiz component exists"
else
  echo "❌ No vibe quiz component found"
fi

echo ""

# Check dashboard.js for key imports
echo "Dashboard.js imports:"
if [ -f "pages/dashboard.js" ]; then
  grep -n "import" pages/dashboard.js | head -20
else
  echo "❌ No dashboard.js file found"
fi
echo ""

# Check for Heroku configuration
echo "Heroku configuration:"
git remote -v | grep heroku
echo ""

echo "=== End of Project State Capture ==="
echo "Copy and paste the output above into your next task to help maintain continuity."
