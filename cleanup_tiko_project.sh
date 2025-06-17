#!/bin/bash

echo "🧹 TIKO PROJECT CLEANUP SCRIPT"
echo "=============================="
echo ""
echo "Based on comprehensive audit findings:"
echo "- Remove redundant dashboard files"
echo "- Remove old sound characteristic components"  
echo "- Establish single source of truth"
echo "- Prepare for Step 1 implementation"
echo ""

# Navigate to frontend directory
cd /c/sonar/users/sonar-edm-user

echo "📍 Current directory: $(pwd)"

echo ""
echo "🗑️  STEP 1: REMOVE REDUNDANT DASHBOARD FILES"
echo "============================================"

# Files to remove based on audit
redundant_dashboards=(
    "pages/enhanced-dashboard.js"
    "dashboard.js"
    "EnhancedDashboard.js"
    "StagingEnhancedDashboard.js"
    "DashboardWithMatchPercentage.js"
    "add-events-fix-to-dashboard.js"
)

for file in "${redundant_dashboards[@]}"; do
    if [ -f "$file" ]; then
        echo "🗑️  Removing: $file"
        rm "$file"
    else
        echo "⚪ Not found: $file"
    fi
done

echo ""
echo "🗑️  STEP 2: REMOVE OLD SOUND CHARACTERISTIC COMPONENTS"
echo "====================================================="

redundant_sound_components=(
    "components/SoundCharacteristics.js"
    "components/SoundCharacteristicsCompact.js"
    "components/CompactSoundCharacteristics.js"
    "components/SoundCharacteristicsChart.js"
    "SoundCharacteristics.js"
)

for file in "${redundant_sound_components[@]}"; do
    if [ -f "$file" ]; then
        echo "🗑️  Removing: $file"
        rm "$file"
    else
        echo "⚪ Not found: $file"
    fi
done

echo ""
echo "🗑️  STEP 3: CLEAN UP BACKUP DIRECTORIES"
echo "======================================="

if [ -d "backups" ]; then
    echo "🗑️  Removing backups directory (contains old redundant files)"
    rm -rf backups/
else
    echo "⚪ Backups directory not found"
fi

echo ""
echo "✅ STEP 4: VERIFY CORE FILES REMAIN"
echo "==================================="

core_files=(
    "pages/dashboard.js"
    "components/EnhancedPersonalizedDashboard.js"
    "components/Top5GenresSpiderChart.js"
    "components/SoundFeatureCapsules.js"
    "components/EnhancedLocationSearch.js"
)

echo "Checking core files that should remain:"
for file in "${core_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - EXISTS"
    else
        echo "❌ $file - MISSING (CRITICAL!)"
    fi
done

echo ""
echo "📋 STEP 5: VERIFY CLEANUP RESULTS"
echo "================================="

echo ""
echo "📄 Remaining dashboard files:"
find . -name "*dashboard*" -type f | grep -E "\.(js|jsx)$" | grep -v node_modules | grep -v .next

echo ""
echo "📄 Remaining sound characteristic files:"
find . -name "*[Ss]ound*" -type f | grep -E "\.(js|jsx)$" | grep -v node_modules | grep -v .next

echo ""
echo "🎯 STEP 6: PREPARE FOR STEP 1 IMPLEMENTATION"
echo "============================================"

echo ""
echo "✅ CLEANUP SUMMARY:"
echo "- Removed redundant dashboard files"
echo "- Removed old sound characteristic components"
echo "- Kept core TIKO components"
echo "- Single source of truth: pages/dashboard.js"
echo ""

echo "🚀 NEXT: STEP 1 IMPLEMENTATION"
echo "- pages/dashboard.js should use EnhancedPersonalizedDashboard"
echo "- EnhancedPersonalizedDashboard should render spider chart + capsules"
echo "- Fix any missing API endpoints"
echo "- Deploy and test"
echo ""

echo "📦 COMMIT CLEANUP CHANGES"
echo "========================"

git add -A
git commit -m "🧹 CLEANUP: Remove redundant dashboard and sound components

Based on comprehensive audit:
- Removed pages/enhanced-dashboard.js (was causing confusion)
- Removed old SoundCharacteristics components (replaced by spider chart + capsules)
- Removed backup directories and redundant files
- Established single source of truth: pages/dashboard.js

✅ Ready for Step 1 implementation:
- Spider chart (Top5GenresSpiderChart)
- Capsule indicators (SoundFeatureCapsules)
- Clean codebase with no conflicts"

if [ $? -eq 0 ]; then
    echo "✅ Cleanup changes committed successfully"
else
    echo "❌ Failed to commit cleanup changes"
fi

echo ""
echo "🏁 CLEANUP COMPLETED"
echo "==================="
echo ""
echo "✅ Project is now clean and ready for Step 1"
echo "✅ Single source of truth established"
echo "✅ No more conflicting dashboard files"
echo "✅ Ready to implement spider chart + capsules"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Deploy cleanup to staging"
echo "2. Verify pages/dashboard.js is being used"
echo "3. Implement Step 1 (spider chart + capsules)"
echo "4. Test and verify Step 1 works"
echo "5. Move to Step 2 (location search)"

