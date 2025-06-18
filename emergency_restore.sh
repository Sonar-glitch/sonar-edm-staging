#!/bin/bash

# 🛡️ EMERGENCY RESTORE - BACK TO WORKING STATE
# ============================================

echo "🛡️ EMERGENCY RESTORE - BACK TO WORKING STATE"
echo "============================================"

echo "⚠️  Restoring to backup state before glassmorphic changes..."
echo "⚠️  This will undo ALL changes and restore your working dashboard"
echo ""

# Navigate to project directory
cd /c/sonar/users/sonar-edm-user

echo "✅ Step 1: Switching to backup branch..."
git checkout backup_pre_glassmorphic_20250618_023008

echo "✅ Step 2: Force pushing backup to Heroku..."
git push heroku backup_pre_glassmorphic_20250618_023008:main --force

echo "✅ Step 3: Switching back to main and resetting..."
git checkout main
git reset --hard backup_pre_glassmorphic_20250618_023008

echo ""
echo "🎯 RESTORE COMPLETE"
echo "=================="
echo ""
echo "✅ Your dashboard is restored to the working state"
echo "✅ All glassmorphic changes have been undone"
echo "✅ Your original clean layout is back"
echo ""
echo "🔗 Your restored dashboard:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo ""
echo "💡 Next: I will create a fix that ONLY touches the events section"
echo "   as you originally requested, without changing anything else."
echo ""

