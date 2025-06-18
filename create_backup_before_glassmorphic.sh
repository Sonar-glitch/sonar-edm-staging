#!/bin/bash

# 🛡️ COMPREHENSIVE BACKUP SCRIPT - GLASSMORPHIC THEME DEPLOYMENT
# ==============================================================

echo "🛡️ COMPREHENSIVE BACKUP SCRIPT - GLASSMORPHIC THEME DEPLOYMENT"
echo "=============================================================="

# Create backup directory with timestamp
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)_pre_glassmorphic"
echo "✅ Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo ""
echo "📋 STEP 1: BACKING UP CURRENT FILES"
echo "=================================="

# Backup current dashboard component
if [ -f "components/EnhancedPersonalizedDashboard.js" ]; then
    cp "components/EnhancedPersonalizedDashboard.js" "$BACKUP_DIR/EnhancedPersonalizedDashboard.js.backup"
    echo "✅ Backed up: EnhancedPersonalizedDashboard.js"
else
    echo "⚠️  File not found: components/EnhancedPersonalizedDashboard.js"
fi

# Backup current event list component
if [ -f "components/EnhancedEventList.js" ]; then
    cp "components/EnhancedEventList.js" "$BACKUP_DIR/EnhancedEventList.js.backup"
    echo "✅ Backed up: EnhancedEventList.js"
else
    echo "⚠️  File not found: components/EnhancedEventList.js"
fi

# Backup current CSS files
if [ -f "styles/EnhancedPersonalizedDashboard.module.css" ]; then
    cp "styles/EnhancedPersonalizedDashboard.module.css" "$BACKUP_DIR/EnhancedPersonalizedDashboard.module.css.backup"
    echo "✅ Backed up: EnhancedPersonalizedDashboard.module.css"
else
    echo "⚠️  File not found: styles/EnhancedPersonalizedDashboard.module.css"
fi

if [ -f "styles/EnhancedEventList.module.css" ]; then
    cp "styles/EnhancedEventList.module.css" "$BACKUP_DIR/EnhancedEventList.module.css.backup"
    echo "✅ Backed up: EnhancedEventList.module.css"
else
    echo "⚠️  File not found: styles/EnhancedEventList.module.css"
fi

# Backup sound characteristics component if it exists
if [ -f "components/SoundCharacteristics.js" ]; then
    cp "components/SoundCharacteristics.js" "$BACKUP_DIR/SoundCharacteristics.js.backup"
    echo "✅ Backed up: SoundCharacteristics.js"
else
    echo "ℹ️  SoundCharacteristics.js not found (will be created)"
fi

if [ -f "styles/SoundCharacteristics.module.css" ]; then
    cp "styles/SoundCharacteristics.module.css" "$BACKUP_DIR/SoundCharacteristics.module.css.backup"
    echo "✅ Backed up: SoundCharacteristics.module.css"
else
    echo "ℹ️  SoundCharacteristics.module.css not found (will be created)"
fi

echo ""
echo "📋 STEP 2: CREATING GIT BACKUP BRANCH"
echo "====================================="

# Create a backup branch in git
BACKUP_BRANCH="backup_pre_glassmorphic_$(date +%Y%m%d_%H%M%S)"
echo "✅ Creating git backup branch: $BACKUP_BRANCH"

# Add all current changes to git
git add .
git commit -m "BACKUP: Pre-glassmorphic theme state - $(date)"

# Create backup branch
git checkout -b "$BACKUP_BRANCH"
git checkout main

echo "✅ Git backup branch created: $BACKUP_BRANCH"

echo ""
echo "📋 STEP 3: DOCUMENTING CURRENT STATE"
echo "===================================="

# Document current git commit
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $CURRENT_COMMIT" > "$BACKUP_DIR/current_state.txt"
echo "Current branch: $(git branch --show-current)" >> "$BACKUP_DIR/current_state.txt"
echo "Backup created: $(date)" >> "$BACKUP_DIR/current_state.txt"
echo "Backup branch: $BACKUP_BRANCH" >> "$BACKUP_DIR/current_state.txt"

echo "✅ Current state documented in: $BACKUP_DIR/current_state.txt"

echo ""
echo "📋 STEP 4: CREATING RESTORATION INSTRUCTIONS"
echo "============================================"

# Create detailed restoration instructions
cat > "$BACKUP_DIR/RESTORATION_INSTRUCTIONS.md" << 'EOF'
# 🛡️ RESTORATION INSTRUCTIONS - GLASSMORPHIC THEME BACKUP

## 📋 BACKUP INFORMATION
- **Backup Created:** $(date)
- **Current Commit:** $(git rev-parse HEAD)
- **Current Branch:** $(git branch --show-current)
- **Backup Branch:** $BACKUP_BRANCH

## 🚨 IF SOMETHING GOES WRONG - RESTORATION OPTIONS

### OPTION 1: QUICK FILE RESTORATION (Recommended for minor issues)

```bash
# Navigate to your project directory
cd /c/sonar/users/sonar-edm-user

# Restore individual files from backup
cp backup_*/EnhancedPersonalizedDashboard.js.backup components/EnhancedPersonalizedDashboard.js
cp backup_*/EnhancedEventList.js.backup components/EnhancedEventList.js
cp backup_*/EnhancedPersonalizedDashboard.module.css.backup styles/EnhancedPersonalizedDashboard.module.css
cp backup_*/EnhancedEventList.module.css.backup styles/EnhancedEventList.module.css

# Remove new files if they're causing issues
rm -f components/SoundCharacteristics.js
rm -f styles/SoundCharacteristics.module.css

# Commit and deploy
git add .
git commit -m "RESTORE: Reverted to pre-glassmorphic state"
git push heroku HEAD:main --force
```

### OPTION 2: COMPLETE GIT RESTORATION (For major issues)

```bash
# Navigate to your project directory
cd /c/sonar/users/sonar-edm-user

# Switch to backup branch
git checkout $BACKUP_BRANCH

# Force push to heroku (this completely reverts everything)
git push heroku $BACKUP_BRANCH:main --force

# Switch back to main and reset to backup state
git checkout main
git reset --hard $BACKUP_BRANCH
```

### OPTION 3: SELECTIVE RESTORATION (For specific component issues)

#### If Dashboard Component Has Issues:
```bash
cp backup_*/EnhancedPersonalizedDashboard.js.backup components/EnhancedPersonalizedDashboard.js
cp backup_*/EnhancedPersonalizedDashboard.module.css.backup styles/EnhancedPersonalizedDashboard.module.css
git add . && git commit -m "RESTORE: Dashboard component only"
git push heroku HEAD:main --force
```

#### If Event List Component Has Issues:
```bash
cp backup_*/EnhancedEventList.js.backup components/EnhancedEventList.js
cp backup_*/EnhancedEventList.module.css.backup styles/EnhancedEventList.module.css
git add . && git commit -m "RESTORE: Event list component only"
git push heroku HEAD:main --force
```

#### If Like Functionality Has Issues:
```bash
# Restore just the event list without like functionality
cp backup_*/EnhancedEventList.js.backup components/EnhancedEventList.js
git add . && git commit -m "RESTORE: Removed like functionality"
git push heroku HEAD:main --force
```

## 🔍 TROUBLESHOOTING COMMON ISSUES

### Issue: "Demo Data" Label Still Showing
**Solution:** The glassmorphic theme doesn't affect this - use the separate demo data label fix

### Issue: Events Not Loading
**Solution:** Restore the event list component:
```bash
cp backup_*/EnhancedEventList.js.backup components/EnhancedEventList.js
```

### Issue: CSS Styling Broken
**Solution:** Restore CSS files:
```bash
cp backup_*/EnhancedPersonalizedDashboard.module.css.backup styles/EnhancedPersonalizedDashboard.module.css
cp backup_*/EnhancedEventList.module.css.backup styles/EnhancedEventList.module.css
```

### Issue: Like Buttons Not Working
**Solution:** Check browser console for errors, or restore original event list:
```bash
cp backup_*/EnhancedEventList.js.backup components/EnhancedEventList.js
```

### Issue: Build Errors on Heroku
**Solution:** Complete restoration to backup branch:
```bash
git checkout $BACKUP_BRANCH
git push heroku $BACKUP_BRANCH:main --force
```

## 📞 EMERGENCY CONTACT

If you need immediate help:
1. **Stop deployment** - Don't push more changes
2. **Use OPTION 2** for complete restoration
3. **Check Heroku logs** - `heroku logs --tail --app sonar-edm-staging`
4. **Test locally first** - Always test changes locally before deploying

## ✅ VERIFICATION AFTER RESTORATION

After any restoration:
1. **Check dashboard loads** - Visit /dashboard
2. **Check events display** - Verify events are showing
3. **Check My Events page** - Visit /my-events
4. **Test like functionality** - Try liking/unliking events
5. **Check mobile view** - Test responsive design

## 📝 BACKUP FILES INCLUDED

- `EnhancedPersonalizedDashboard.js.backup` - Main dashboard component
- `EnhancedEventList.js.backup` - Event list component
- `EnhancedPersonalizedDashboard.module.css.backup` - Dashboard styles
- `EnhancedEventList.module.css.backup` - Event list styles
- `current_state.txt` - Git state information
- `RESTORATION_INSTRUCTIONS.md` - This file

## 🎯 REMEMBER

- **Always test locally first** before deploying to Heroku
- **Keep this backup directory** until you're satisfied with the new theme
- **The backup branch** `$BACKUP_BRANCH` contains the complete working state
- **You can always go back** - nothing is permanently lost
EOF

# Replace placeholders in the restoration instructions
sed -i "s/\$(date)/$(date)/g" "$BACKUP_DIR/RESTORATION_INSTRUCTIONS.md"
sed -i "s/\$(git rev-parse HEAD)/$CURRENT_COMMIT/g" "$BACKUP_DIR/RESTORATION_INSTRUCTIONS.md"
sed -i "s/\$(git branch --show-current)/$(git branch --show-current)/g" "$BACKUP_DIR/RESTORATION_INSTRUCTIONS.md"
sed -i "s/\$BACKUP_BRANCH/$BACKUP_BRANCH/g" "$BACKUP_DIR/RESTORATION_INSTRUCTIONS.md"

echo "✅ Detailed restoration instructions created: $BACKUP_DIR/RESTORATION_INSTRUCTIONS.md"

echo ""
echo "📋 STEP 5: CREATING QUICK RESTORE SCRIPT"
echo "========================================"

# Create a quick restore script
cat > "$BACKUP_DIR/quick_restore.sh" << EOF
#!/bin/bash

echo "🛡️ QUICK RESTORE SCRIPT"
echo "======================"

echo "⚠️  This will restore your dashboard to the pre-glassmorphic state"
echo "⚠️  Are you sure you want to continue? (y/N)"
read -r response

if [[ "\$response" =~ ^[Yy]$ ]]; then
    echo "✅ Restoring files..."
    
    # Navigate to project root
    cd /c/sonar/users/sonar-edm-user
    
    # Restore backup files
    cp "$BACKUP_DIR/EnhancedPersonalizedDashboard.js.backup" components/EnhancedPersonalizedDashboard.js
    cp "$BACKUP_DIR/EnhancedEventList.js.backup" components/EnhancedEventList.js
    cp "$BACKUP_DIR/EnhancedPersonalizedDashboard.module.css.backup" styles/EnhancedPersonalizedDashboard.module.css
    cp "$BACKUP_DIR/EnhancedEventList.module.css.backup" styles/EnhancedEventList.module.css
    
    # Remove new files
    rm -f components/SoundCharacteristics.js
    rm -f styles/SoundCharacteristics.module.css
    
    echo "✅ Files restored successfully"
    echo "✅ Now commit and deploy:"
    echo "   git add ."
    echo "   git commit -m 'RESTORE: Reverted to pre-glassmorphic state'"
    echo "   git push heroku HEAD:main --force"
else
    echo "❌ Restore cancelled"
fi
EOF

chmod +x "$BACKUP_DIR/quick_restore.sh"
echo "✅ Quick restore script created: $BACKUP_DIR/quick_restore.sh"

echo ""
echo "🎯 BACKUP COMPLETE!"
echo "=================="
echo ""
echo "✅ Backup Directory: $BACKUP_DIR"
echo "✅ Git Backup Branch: $BACKUP_BRANCH"
echo "✅ Current Commit: $CURRENT_COMMIT"
echo ""
echo "📋 WHAT'S BEEN BACKED UP:"
echo "   - All current component files"
echo "   - All current CSS files"
echo "   - Complete git state in backup branch"
echo "   - Detailed restoration instructions"
echo "   - Quick restore script"
echo ""
echo "🛡️ SAFETY MEASURES:"
echo "   - Read: $BACKUP_DIR/RESTORATION_INSTRUCTIONS.md"
echo "   - Quick restore: ./$BACKUP_DIR/quick_restore.sh"
echo "   - Git restore: git checkout $BACKUP_BRANCH"
echo ""
echo "✅ YOU'RE NOW SAFE TO DEPLOY THE GLASSMORPHIC THEME!"
echo "   Run: ./glassmorphic_theme_with_likes.sh"
echo ""

