#!/bin/bash

# Interpretive Project Analysis Script for TIKO Platform
# This script analyzes component relationships and feature implementation status
# Created: April 25, 2025

# Create output directory for analysis artifacts
ANALYSIS_DIR="tiko-project-analysis-$(date +%Y%m%d%H%M%S)"
mkdir -p "$ANALYSIS_DIR"

# Create main report file
REPORT_FILE="$ANALYSIS_DIR/project-analysis-report.md"

# Initialize report
cat > "$REPORT_FILE" << EOF
# TIKO Platform Project Analysis Report
Generated: $(date)

## Project Overview
This report provides an interpretive analysis of the TIKO platform project structure,
component relationships, and implementation status of key features.

EOF

# Navigate to project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# ===== PROJECT ARCHITECTURE ANALYSIS =====

# Add architecture section to report
cat >> "$REPORT_FILE" << EOF
## Project Architecture
This section analyzes the overall architecture of the TIKO platform.

### Key Pages
EOF

# Analyze pages directory
echo "Analyzing pages directory..."
find ./pages -type f -name "*.js" | sort > "$ANALYSIS_DIR/pages-list.txt"

# Add pages analysis to report
cat >> "$REPORT_FILE" << EOF
The project contains the following key pages:

| Page | Purpose | Key Components Used |
|------|---------|---------------------|
EOF

# Analyze each page file
while IFS= read -r page_file; do
  page_name=$(basename "$page_file" .js)
  echo "Analyzing page: $page_name"
  
  # Extract imports to determine component usage
  grep -n "import" "$page_file" > "$ANALYSIS_DIR/${page_name}-imports.txt"
  
  # Determine page purpose based on content
  if [[ "$page_name" == "dashboard" ]]; then
    purpose="Main dashboard displaying user's music taste and event recommendations"
  elif [[ "$page_name" == "index" ]]; then
    purpose="Landing/entry page with authentication handling"
  elif [[ "$page_name" == "_app" ]]; then
    purpose="Application wrapper with global layout and state"
  elif [[ "$page_name" == *"music-taste"* ]]; then
    purpose="Displays user's music taste profile and preferences"
  elif [[ "$page_name" == *"signin"* || "$page_name" == *"login"* ]]; then
    purpose="Authentication page"
  else
    purpose="Unknown purpose"
  fi
  
  # Extract key components used
  components=$(grep -o "import [A-Za-z]* from ['\"].*['\"]" "$page_file" | grep -v "react\|next\|styles" | sed 's/import \([A-Za-z]*\) from.*/\1/g' | tr '\n' ', ' | sed 's/,$//')
  if [[ -z "$components" ]]; then
    components="No custom components"
  fi
  
  # Add to report
  echo "| $page_name | $purpose | $components |" >> "$REPORT_FILE"
done < "$ANALYSIS_DIR/pages-list.txt"

# Add component analysis section to report
cat >> "$REPORT_FILE" << EOF

### Component Hierarchy
The following diagram shows the main component hierarchy and relationships:

\`\`\`
EOF

# Analyze dashboard.js to determine component hierarchy
if [[ -f "./pages/dashboard.js" ]]; then
  echo "Analyzing dashboard.js component hierarchy..."
  
  # Create a simple ASCII hierarchy diagram
  echo "Dashboard" >> "$REPORT_FILE"
  
  # Check for layout components
  if grep -q "SideBySideLayout" "./pages/dashboard.js"; then
    echo "├── SideBySideLayout" >> "$REPORT_FILE"
    echo "│   ├── CompactSoundCharacteristics" >> "$REPORT_FILE"
    echo "│   └── CompactSeasonalVibes" >> "$REPORT_FILE"
  else
    echo "├── SoundCharacteristics" >> "$REPORT_FILE"
    echo "├── SeasonalVibes" >> "$REPORT_FILE"
  fi
  
  # Check for event list components
  if grep -q "EnhancedEventList" "./pages/dashboard.js"; then
    echo "├── EnhancedEventList" >> "$REPORT_FILE"
  else
    echo "├── EventList" >> "$REPORT_FILE"
  fi
  
  # Check for vibe quiz components
  if grep -q "MobileOptimizedVibeQuiz" "./pages/dashboard.js"; then
    echo "└── MobileOptimizedVibeQuiz" >> "$REPORT_FILE"
  else
    echo "└── VibeQuiz/TasteQuiz" >> "$REPORT_FILE"
  fi
else
  echo "Dashboard.js not found, cannot analyze component hierarchy" >> "$REPORT_FILE"
fi

# Close the diagram
echo "\`\`\`" >> "$REPORT_FILE"

# ===== FEATURE IMPLEMENTATION ANALYSIS =====

# Add feature implementation section to report
cat >> "$REPORT_FILE" << EOF

## Feature Implementation Status
This section analyzes the implementation status of key features requested for the TIKO platform.

### Dashboard Layout Features
EOF

# Check for side-by-side layout implementation
echo "Checking side-by-side layout implementation..."
if grep -q "SideBySideLayout" "./pages/dashboard.js" && [[ -f "./components/SideBySideLayout.js" ]]; then
  implementation_status="✅ Implemented"
  notes="The dashboard uses SideBySideLayout to arrange sound characteristics and seasonal vibes side-by-side."
else
  implementation_status="❌ Not implemented"
  notes="The dashboard does not use a side-by-side layout for sound characteristics and seasonal vibes."
fi

# Add to report
cat >> "$REPORT_FILE" << EOF
#### Side-by-Side Layout
**Status:** $implementation_status
**Notes:** $notes

EOF

# Check for seasonal vibes heading removal
echo "Checking seasonal vibes heading implementation..."
if grep -q "CompactSeasonalVibes" "./pages/dashboard.js" && [[ -f "./components/CompactSeasonalVibes.js" ]]; then
  if grep -q "Your Seasonal Vibes" "./components/CompactSeasonalVibes.js"; then
    implementation_status="⚠️ Partially implemented"
    notes="CompactSeasonalVibes component exists but still includes the 'Your Seasonal Vibes' heading."
  else
    implementation_status="✅ Implemented"
    notes="CompactSeasonalVibes component exists and does not include the 'Your Seasonal Vibes' heading."
  fi
else
  implementation_status="❌ Not implemented"
  notes="CompactSeasonalVibes component is not implemented or not used in the dashboard."
fi

# Add to report
cat >> "$REPORT_FILE" << EOF
#### Seasonal Vibes Heading Removal
**Status:** $implementation_status
**Notes:** $notes

EOF

# Check for enhanced event list implementation
echo "Checking enhanced event list implementation..."
if grep -q "EnhancedEventList" "./pages/dashboard.js" && [[ -f "./components/EnhancedEventList.js" ]]; then
  implementation_status="✅ Implemented"
  
  # Check for specific features
  features=""
  if grep -q "matchScore" "./components/EnhancedEventList.js"; then
    features+="- Shows DJs in order of match score\n"
  fi
  if grep -q "address" "./components/EnhancedEventList.js"; then
    features+="- Includes venue addresses\n"
  fi
  if grep -q "source" "./components/EnhancedEventList.js" && (grep -q "Live Data" "./components/EnhancedEventList.js" || grep -q "Sample" "./components/EnhancedEventList.js"); then
    features+="- Distinguishes between real events and mockups\n"
  fi
  
  notes="EnhancedEventList component is implemented with the following features:\n$features"
else
  implementation_status="❌ Not implemented"
  notes="EnhancedEventList component is not implemented or not used in the dashboard."
fi

# Add to report
cat >> "$REPORT_FILE" << EOF
#### Enhanced Event List
**Status:** $implementation_status
**Notes:** $notes

EOF

# Check for mobile-optimized vibe quiz implementation
echo "Checking mobile-optimized vibe quiz implementation..."
if grep -q "MobileOptimizedVibeQuiz" "./pages/dashboard.js" && [[ -f "./components/MobileOptimizedVibeQuiz.js" ]]; then
  implementation_status="✅ Implemented"
  
  # Check for specific features
  features=""
  if grep -q "card" "./components/MobileOptimizedVibeQuiz.js"; then
    features+="- Uses card-based format\n"
  fi
  if grep -q "preferences" "./components/MobileOptimizedVibeQuiz.js" && grep -q "initialSelections" "./components/MobileOptimizedVibeQuiz.js"; then
    features+="- Preserves previous state\n"
  fi
  if grep -q "onSave" "./components/MobileOptimizedVibeQuiz.js"; then
    features+="- Saves selections to user profile\n"
  fi
  
  notes="MobileOptimizedVibeQuiz component is implemented with the following features:\n$features"
else
  implementation_status="❌ Not implemented"
  notes="MobileOptimizedVibeQuiz component is not implemented or not used in the dashboard."
fi

# Add to report
cat >> "$REPORT_FILE" << EOF
#### Mobile-Optimized Vibe Quiz
**Status:** $implementation_status
**Notes:** $notes

EOF

# ===== COMPONENT DEPENDENCY ANALYSIS =====

# Add component dependency section to report
cat >> "$REPORT_FILE" << EOF

## Component Dependency Analysis
This section analyzes the dependencies between components in the TIKO platform.

### Key Component Dependencies
EOF

# Create a list of key components
echo "Analyzing component dependencies..."
find ./components -type f -name "*.js" | sort > "$ANALYSIS_DIR/components-list.txt"

# Create a simple dependency graph
cat >> "$REPORT_FILE" << EOF
The following table shows which components import other components:

| Component | Imports | Imported By |
|-----------|---------|-------------|
EOF

# Analyze each component file
while IFS= read -r component_file; do
  component_name=$(basename "$component_file" .js)
  echo "Analyzing component dependencies: $component_name"
  
  # Extract imports
  imports=$(grep -o "import [A-Za-z]* from ['\"].*components.*['\"]" "$component_file" | sed 's/import \([A-Za-z]*\) from.*/\1/g' | tr '\n' ', ' | sed 's/,$//')
  if [[ -z "$imports" ]]; then
    imports="None"
  fi
  
  # Find where this component is imported
  imported_by=""
  for file in $(find ./pages ./components -type f -name "*.js"); do
    if grep -q "import.*$component_name.*from" "$file"; then
      file_name=$(basename "$file" .js)
      imported_by+="$file_name, "
    fi
  done
  imported_by=$(echo "$imported_by" | sed 's/, $//')
  if [[ -z "$imported_by" ]]; then
    imported_by="None"
  fi
  
  # Add to report
  echo "| $component_name | $imports | $imported_by |" >> "$REPORT_FILE"
done < "$ANALYSIS_DIR/components-list.txt"

# ===== IMPLEMENTATION RECOMMENDATIONS =====

# Add recommendations section to report
cat >> "$REPORT_FILE" << EOF

## Implementation Recommendations
Based on the analysis of the current project state, here are recommendations for implementing the requested features:

EOF

# Generate recommendations based on analysis
if ! grep -q "SideBySideLayout" "./pages/dashboard.js" || ! [[ -f "./components/SideBySideLayout.js" ]]; then
  cat >> "$REPORT_FILE" << EOF
### 1. Implement Side-by-Side Layout
- Create a SideBySideLayout component that arranges two components horizontally
- Modify dashboard.js to use this layout for sound characteristics and seasonal vibes
- Ensure responsive behavior for mobile devices

EOF
fi

if ! grep -q "CompactSeasonalVibes" "./pages/dashboard.js" || ! [[ -f "./components/CompactSeasonalVibes.js" ]]; then
  cat >> "$REPORT_FILE" << EOF
### 2. Create CompactSeasonalVibes Component
- Create a modified version of the SeasonalVibes component without the heading
- Place year-round vibes at the top
- Ensure it works well in the side-by-side layout

EOF
fi

if ! grep -q "EnhancedEventList" "./pages/dashboard.js" || ! [[ -f "./components/EnhancedEventList.js" ]]; then
  cat >> "$REPORT_FILE" << EOF
### 3. Enhance Event List
- Create an EnhancedEventList component that shows DJs in order of match score
- Include venue addresses
- Add "Live Data" or "Sample" badges to distinguish real events from mockups
- Implement an expand button for showing all DJs when there are many

EOF
fi

if ! grep -q "MobileOptimizedVibeQuiz" "./pages/dashboard.js" || ! [[ -f "./components/MobileOptimizedVibeQuiz.js" ]]; then
  cat >> "$REPORT_FILE" << EOF
### 4. Create Mobile-Optimized Vibe Quiz
- Implement a 5-card format with at least 6 input options per card
- Ensure state preservation
- Save selections to user profile with higher weightage
- Show completion indicator when at least 1 option from each category is selected

EOF
fi

# ===== CONCLUSION =====

# Add conclusion to report
cat >> "$REPORT_FILE" << EOF

## Conclusion
This analysis provides a comprehensive understanding of the TIKO platform's current state and the implementation status of requested features. Use this report as a guide for implementing the remaining features in a way that integrates seamlessly with the existing project structure.

For future tasks, this report should be regenerated to reflect the current state of the project and track progress on feature implementation.
EOF

# Create a simplified version for quick reference
SUMMARY_FILE="$ANALYSIS_DIR/quick-reference.md"
cat > "$SUMMARY_FILE" << EOF
# TIKO Platform Quick Reference
Generated: $(date)

## Project Structure
- Pages: $(wc -l < "$ANALYSIS_DIR/pages-list.txt") pages including dashboard, music-taste, etc.
- Components: $(wc -l < "$ANALYSIS_DIR/components-list.txt") components

## Feature Implementation Status
- Side-by-Side Layout: $(if grep -q "SideBySideLayout" "./pages/dashboard.js" && [[ -f "./components/SideBySideLayout.js" ]]; then echo "✅"; else echo "❌"; fi)
- Seasonal Vibes Heading Removal: $(if grep -q "CompactSeasonalVibes" "./pages/dashboard.js" && [[ -f "./components/CompactSeasonalVibes.js" ]] && ! grep -q "Your Seasonal Vibes" "./components/CompactSeasonalVibes.js"; then echo "✅"; else echo "❌"; fi)
- Enhanced Event List: $(if grep -q "EnhancedEventList" "./pages/dashboard.js" && [[ -f "./components/EnhancedEventList.js" ]]; then echo "✅"; else echo "❌"; fi)
- Mobile-Optimized Vibe Quiz: $(if grep -q "MobileOptimizedVibeQuiz" "./pages/dashboard.js" && [[ -f "./components/MobileOptimizedVibeQuiz.js" ]]; then echo "✅"; else echo "❌"; fi)

## Next Steps
$(if ! grep -q "SideBySideLayout" "./pages/dashboard.js" || ! [[ -f "./components/SideBySideLayout.js" ]]; then echo "1. Implement Side-by-Side Layout"; fi)
$(if ! grep -q "CompactSeasonalVibes" "./pages/dashboard.js" || ! [[ -f "./components/CompactSeasonalVibes.js" ]]; then echo "2. Create CompactSeasonalVibes Component"; fi)
$(if ! grep -q "EnhancedEventList" "./pages/dashboard.js" || ! [[ -f "./components/EnhancedEventList.js" ]]; then echo "3. Enhance Event List"; fi)
$(if ! grep -q "MobileOptimizedVibeQuiz" "./pages/dashboard.js" || ! [[ -f "./components/MobileOptimizedVibeQuiz.js" ]]; then echo "4. Create Mobile-Optimized Vibe Quiz"; fi)
EOF

# Create a ZIP archive of all analysis files
echo "Creating ZIP archive of analysis files..."
cd "$(dirname "$ANALYSIS_DIR")"
zip -r "$(basename "$ANALYSIS_DIR").zip" "$(basename "$ANALYSIS_DIR")"
cd - > /dev/null

# Display completion message
echo "Project analysis complete!"
echo "Full report: $REPORT_FILE"
echo "Quick reference: $SUMMARY_FILE"
echo "ZIP archive: $(dirname "$ANALYSIS_DIR")/$(basename "$ANALYSIS_DIR").zip"
echo ""
echo "Please share these files at the beginning of your next task to provide context."
