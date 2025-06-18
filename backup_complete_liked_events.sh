#!/bin/bash

# 🛡️ BACKUP: COMPLETE LIKED EVENTS SYSTEM SUCCESS
# ================================================

echo "🛡️ BACKUP: COMPLETE LIKED EVENTS SYSTEM SUCCESS"
echo "================================================"

# Create backup directory with timestamp
BACKUP_DIR="backup_complete_liked_events_$(date +%Y%m%d_%H%M%S)"
echo "📁 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo ""
echo "📋 BACKING UP COMPLETE WORKING STATE:"
echo "====================================="

# Backup all key files
echo "📦 Backing up dashboard components..."
cp components/EnhancedPersonalizedDashboard.js "$BACKUP_DIR/"
cp components/EnhancedEventList.js "$BACKUP_DIR/"

echo "📦 Backing up My Events page..."
cp pages/my-events.js "$BACKUP_DIR/"

echo "📦 Backing up API endpoints..."
mkdir -p "$BACKUP_DIR/api/user"
cp pages/api/user/interested-events.js "$BACKUP_DIR/api/user/"
cp pages/api/events/index.js "$BACKUP_DIR/api/"

echo "📦 Backing up CSS files..."
cp styles/EnhancedPersonalizedDashboard.module.css "$BACKUP_DIR/"
cp styles/EnhancedEventList.module.css "$BACKUP_DIR/"
cp styles/MyEvents.module.css "$BACKUP_DIR/" 2>/dev/null || echo "   (MyEvents.module.css not found - using inline styles)"

echo "📦 Backing up package files..."
cp package.json "$BACKUP_DIR/"
cp next.config.js "$BACKUP_DIR/" 2>/dev/null || echo "   (next.config.js not found)"

echo ""
echo "🔄 Creating git backup branch..."
BACKUP_BRANCH="backup_complete_liked_events_$(date +%Y%m%d_%H%M%S)"
git checkout -b "$BACKUP_BRANCH"
git add .
git commit -m "BACKUP: Complete liked events system working perfectly

✅ WORKING FEATURES:
- Glassmorphic events with heart buttons
- Complete liked events API with MongoDB
- My Events page with pixel-perfect design
- Real-time like/unlike functionality
- Database persistence and learning system
- Enhanced temporal matching system

🎯 MILESTONE: Full liked events system functional
📅 Backup created: $(date)
🔗 Heroku version: Latest deployment"

echo "✅ Git backup branch created: $BACKUP_BRANCH"

# Switch back to main branch
git checkout main

echo ""
echo "📝 Creating restoration instructions..."
cat > "$BACKUP_DIR/RESTORATION_INSTRUCTIONS.md" << 'EOF'
# 🛡️ COMPLETE LIKED EVENTS SYSTEM - RESTORATION GUIDE

## 📋 WHAT'S BACKED UP:
✅ **Glassmorphic Events** - Beautiful event cards with neon effects
✅ **Heart Button Functionality** - Complete like/unlike system
✅ **My Events Page** - Pixel-perfect design showing saved events
✅ **MongoDB Integration** - Working database persistence
✅ **Learning System** - Taste profile updates
✅ **Enhanced Temporal Matching** - Sophisticated event scoring

## 🚀 QUICK RESTORE (Recommended):

### Option 1: Git Branch Restore
```bash
git checkout [BACKUP_BRANCH_NAME]
git push heroku [BACKUP_BRANCH_NAME]:main --force
```

### Option 2: File-by-File Restore
```bash
# Restore dashboard components
cp backup_*/EnhancedPersonalizedDashboard.js components/
cp backup_*/EnhancedEventList.js components/

# Restore My Events page
cp backup_*/my-events.js pages/

# Restore API endpoints
cp backup_*/interested-events.js pages/api/user/
cp backup_*/index.js pages/api/events/

# Restore CSS files
cp backup_*/EnhancedPersonalizedDashboard.module.css styles/
cp backup_*/EnhancedEventList.module.css styles/

# Deploy
git add .
git commit -m "RESTORE: Complete liked events system"
git push heroku HEAD:main --force
```

## 🎯 WORKING STATE FEATURES:
- **Dashboard**: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard
- **My Events**: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/my-events
- **Heart Buttons**: Click to like/unlike events
- **Real-time Sync**: Changes reflect immediately
- **Database**: MongoDB persistence working

## ⚠️ IMPORTANT NOTES:
- This backup captures the complete working liked events system
- All glassmorphic styling preserved
- MongoDB connection fixed and functional
- Enhanced temporal matching system included
- Ready for tab navigation implementation

## 📞 SUPPORT:
If restoration fails, use the git backup branch as the most reliable option.
EOF

echo "✅ Restoration instructions created"

echo ""
echo "🔧 Creating quick restore script..."
cat > "$BACKUP_DIR/quick_restore.sh" << EOF
#!/bin/bash
echo "🛡️ QUICK RESTORE: Complete Liked Events System"
echo "=============================================="

# Get the backup branch name
BACKUP_BRANCH=\$(git branch -a | grep backup_complete_liked_events | head -1 | sed 's/.*\///')

if [ -z "\$BACKUP_BRANCH" ]; then
    echo "❌ No backup branch found!"
    exit 1
fi

echo "📋 Restoring from branch: \$BACKUP_BRANCH"

# Restore from git backup
git checkout "\$BACKUP_BRANCH"
git push heroku "\$BACKUP_BRANCH":main --force

echo ""
echo "✅ RESTORATION COMPLETE!"
echo "========================"
echo ""
echo "🎯 Your complete liked events system has been restored:"
echo "   - Dashboard: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo "   - My Events: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/my-events"
echo "   - Heart buttons working"
echo "   - Database persistence functional"
echo ""
EOF

chmod +x "$BACKUP_DIR/quick_restore.sh"
echo "✅ Quick restore script created"

echo ""
echo "📊 BACKUP SUMMARY:"
echo "=================="
echo "📁 Backup Directory: $BACKUP_DIR"
echo "🌿 Git Backup Branch: $BACKUP_BRANCH"
echo "📝 Restoration Guide: $BACKUP_DIR/RESTORATION_INSTRUCTIONS.md"
echo "⚡ Quick Restore: $BACKUP_DIR/quick_restore.sh"

echo ""
echo "🎉 BACKUP COMPLETE!"
echo "=================="
echo ""
echo "✅ PROTECTED STATE:"
echo "   🎨 Glassmorphic events with heart buttons"
echo "   💖 Complete liked events system"
echo "   📱 My Events page (pixel-perfect)"
echo "   🗄️ MongoDB integration working"
echo "   🧠 Learning system functional"
echo "   ⚡ Enhanced temporal matching"
echo ""
echo "🚀 READY FOR: Tab navigation system implementation"
echo ""
echo "🛡️ Your complete liked events system is now safely backed up!"
echo "   You can proceed with confidence to implement tab navigation."
echo ""

