#!/bin/bash

# Streamlined Project State Capture Script for TIKO Platform
# This script captures essential project state information while excluding node_modules
# Created: April 25, 2025

# Create output file
OUTPUT_FILE="tiko-project-state-$(date +%Y%m%d%H%M%S).txt"
echo "=== TIKO Platform Project State Capture ===" > "$OUTPUT_FILE"
echo "Capturing project state at $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Navigate to project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# ===== LOCAL PROJECT STATE =====
echo "=== LOCAL PROJECT STATE ===" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Git information
echo "=== Git Information ===" >> "$OUTPUT_FILE"
echo "Current branch:" >> "$OUTPUT_FILE"
git branch --show-current >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Latest commit:" >> "$OUTPUT_FILE"
git log -1 --oneline >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Project structure (excluding node_modules)
echo "=== Project Structure ===" >> "$OUTPUT_FILE"
echo "Key directories:" >> "$OUTPUT_FILE"
find . -maxdepth 1 -type d | grep -v "node_modules" | grep -v ".git" | sort >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Pages (*.js files only):" >> "$OUTPUT_FILE"
find ./pages -type f -name "*.js" | sort >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Components (*.js files only):" >> "$OUTPUT_FILE"
find ./components -type f -name "*.js" | sort >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "Styles (*.css files only):" >> "$OUTPUT_FILE"
find ./styles -type f -name "*.css" | sort >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Package dependencies (just the names, not versions)
echo "=== Package Dependencies ===" >> "$OUTPUT_FILE"
echo "Main dependencies (names only):" >> "$OUTPUT_FILE"
grep -o '"[^"]*": "' package.json | grep -v "devDependencies" | sed 's/": "//g' | sed 's/"//g' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Key component analysis
echo "=== Key Component Analysis ===" >> "$OUTPUT_FILE"

# Dashboard component
echo "Dashboard component imports:" >> "$OUTPUT_FILE"
grep -n "import" ./pages/dashboard.js | head -10 >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Check for key components
for component in SoundCharacteristics SeasonalVibes EventList SideBySideLayout LoadingSpinner SpotifyImage ErrorBoundary; do
  echo "Checking for $component component:" >> "$OUTPUT_FILE"
  find ./components -name "${component}.js" >> "$OUTPUT_FILE"
  if [ -f "./components/${component}.js" ]; then
    echo "First 5 imports:" >> "$OUTPUT_FILE"
    grep -n "import" "./components/${component}.js" | head -5 >> "$OUTPUT_FILE"
  fi
  echo "" >> "$OUTPUT_FILE"
done

# ===== HEROKU DEPLOYMENT STATE =====
echo "=== HEROKU DEPLOYMENT STATE ===" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Heroku app information
echo "=== Heroku App Information ===" >> "$OUTPUT_FILE"
echo "Heroku apps:" >> "$OUTPUT_FILE"
heroku apps >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Current Heroku remote:" >> "$OUTPUT_FILE"
git remote -v | grep heroku >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Heroku configuration (excluding sensitive values)
echo "=== Heroku Configuration ===" >> "$OUTPUT_FILE"
echo "Environment variables (names only):" >> "$OUTPUT_FILE"
heroku config --app sonar-edm-user | cut -d':' -f1 >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Heroku build information (limited)
echo "=== Heroku Build Information ===" >> "$OUTPUT_FILE"
echo "Latest build status:" >> "$OUTPUT_FILE"
heroku releases --app sonar-edm-user | head -3 >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Compare local and remote (simplified)
echo "=== Local vs Remote Comparison ===" >> "$OUTPUT_FILE"
echo "Git remote details (simplified):" >> "$OUTPUT_FILE"
git remote show heroku | grep "HEAD branch\|Push" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

echo "=== Project State Capture Complete ===" >> "$OUTPUT_FILE"
echo "Capture time: $(date)" >> "$OUTPUT_FILE"
echo "Output saved to: $OUTPUT_FILE" >> "$OUTPUT_FILE"

# Display completion message to console
echo "Project state capture complete!"
echo "Output saved to: $OUTPUT_FILE"
echo "Please share this file at the beginning of your next task to provide context."
