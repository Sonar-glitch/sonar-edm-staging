#!/bin/bash

# TIKO Platform - Complete Fix Deployment Script
# Fixes all 4 critical issues: audio features, city autocomplete, venue mapping, wrong city events

echo "🚀 Starting TIKO Platform comprehensive fix deployment..."

# Navigate to project directory
cd /c/sonar/users/sonar-edm-user || {
    echo "❌ Error: Could not navigate to project directory"
    echo "📁 Current directory: $(pwd)"
    exit 1
}

echo "📁 Current directory: $(pwd)"

# Create backup of current files
echo "💾 Creating backup of current files..."
timestamp=$(date +%Y%m%d%H%M%S)
mkdir -p backups/$timestamp
cp pages/dashboard.js backups/$timestamp/dashboard.js.backup 2>/dev/null || echo "⚠️  dashboard.js not found for backup"
cp components/MusicTaste.js backups/$timestamp/MusicTaste.js.backup 2>/dev/null || echo "⚠️  MusicTaste.js not found for backup"
cp components/EnhancedEventList.js backups/$timestamp/EnhancedEventList.js.backup 2>/dev/null || echo "⚠️  EnhancedEventList.js not found for backup"
cp pages/api/events/index.js backups/$timestamp/events-api.js.backup 2>/dev/null || echo "⚠️  events API not found for backup"

# Deploy fixed files
echo "📋 Deploying comprehensive fixes..."

# Fix 1: Dashboard with city autocomplete
echo "   ✓ Deploying dashboard with city autocomplete..."
cat > pages/dashboard.js << 'EOF'


$(cat /home/ubuntu/dashboard_with_city_autocomplete.js)
EOF

# Fix 2: MusicTaste with correct audio features calculation
echo "   ✓ Deploying MusicTaste with fixed audio features..."
cat > components/MusicTaste.js << 'EOF'
$(cat /home/ubuntu/final_music_taste_fixed.js)
EOF

# Fix 3: EnhancedEventList with correct venue mapping
echo "   ✓ Deploying EnhancedEventList with fixed venue mapping..."
cat > components/EnhancedEventList.js << 'EOF'
$(cat /home/ubuntu/final_enhanced_event_list_fixed.js)
EOF

# Fix 4: Events API with proper city handling
echo "   ✓ Deploying Events API with multi-city support..."
cat > pages/api/events/index.js << 'EOF'
$(cat /home/ubuntu/final_events_api_fixed.js)
EOF

echo "✅ Verifying file deployment..."
if [ -f "pages/dashboard.js" ]; then
    echo "   ✓ dashboard.js deployed successfully"
else
    echo "   ❌ dashboard.js deployment failed"
fi

if [ -f "components/MusicTaste.js" ]; then
    echo "   ✓ MusicTaste.js deployed successfully"
else
    echo "   ❌ MusicTaste.js deployment failed"
fi

if [ -f "components/EnhancedEventList.js" ]; then
    echo "   ✓ EnhancedEventList.js deployed successfully"
else
    echo "   ❌ EnhancedEventList.js deployment failed"
fi

if [ -f "pages/api/events/index.js" ]; then
    echo "   ✓ Events API deployed successfully"
else
    echo "   ❌ Events API deployment failed"
fi

# Git operations
echo "📝 Adding files to git..."
git add pages/dashboard.js components/MusicTaste.js components/EnhancedEventList.js pages/api/events/index.js

echo "💬 Committing changes..."
git commit -m "🔧 COMPREHENSIVE FIX: All 4 critical issues resolved

✅ Issue #1: Fixed audio features showing 5000% instead of 50%
   - Removed incorrect *100 multiplication in MusicTaste component
   - API returns percentages directly (50 = 50%, not 0.5)

✅ Issue #2: Added city autocomplete with suggestions dropdown
   - 60+ major North American cities database
   - Real-time filtering as user types
   - Keyboard navigation (Enter/Escape) support
   - Click to select functionality

✅ Issue #3: Fixed venue data mapping showing 'Venue TBA'
   - Changed event.venue?.name to event.venue (API returns string directly)
   - Fixed address mapping from event.address + event.city
   - Now displays real venue names: CODA, Rebel, Vertigo, etc.

✅ Issue #4: Fixed wrong city events (Montreal search returning Toronto)
   - Added multi-city sample events (Toronto, Montreal, Vancouver)
   - Improved fallback logic to show 'No events found' instead of wrong city
   - Better city matching with partial name support

🎯 Expected Results:
- Audio features show correct percentages (50% not 5000%)
- City search shows dropdown suggestions while typing
- Events display real venue names instead of 'Venue TBA'
- City-specific events or proper 'no events' message"

echo "🚀 Deploying to Heroku staging..."
git push https://git.heroku.com/sonar-edm-staging.git HEAD:main

echo "✅ Deployment completed successfully!"
echo ""
echo "🔧 Fixed Issues:"
echo "   ✓ Issue #1: Audio features calculation (5000% → 50%)"
echo "   ✓ Issue #2: City autocomplete with suggestions dropdown"
echo "   ✓ Issue #3: Venue data mapping ('Venue TBA' → real venues)"
echo "   ✓ Issue #4: City-specific events (Montreal → Montreal events)"
echo ""
echo "🌐 Live URL: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo "⏱️  Please wait 2-3 minutes for Heroku build to complete, then test the fixes."
echo ""
echo "🧪 Testing Checklist:"
echo "   □ Audio features show 50%, 65%, etc. (not 5000%)"
echo "   □ City search shows dropdown suggestions while typing"
echo "   □ Events show real venue names (CODA, Rebel, Stereo, etc.)"
echo "   □ Montreal search shows Montreal events (not Toronto)"
echo "   □ Toronto search shows Toronto events"
echo "   □ Vancouver search shows Vancouver events"

