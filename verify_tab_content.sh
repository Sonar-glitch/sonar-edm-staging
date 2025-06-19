#!/bin/bash

# Verification Script for Tab Content
# Specifically checks My Events and Music Taste tabs

echo "🔍 VERIFYING MY EVENTS AND MUSIC TASTE TABS..."

# Navigate to project directory
cd /c/sonar/users/sonar-edm-user

# Check current branch
echo "📍 Current branch: $(git branch --show-current)"

echo ""
echo "1️⃣ CHECKING MY EVENTS TAB:"
echo "----------------------------"

# Check if MyEventsContent component exists
if [ -f "components/MyEventsContent.js" ]; then
  echo "✅ MyEventsContent component exists"
else
  echo "❌ MyEventsContent component MISSING"
fi

# Check if MyEventsContent is properly implemented
if grep -q "fetchInterestedEvents" components/MyEventsContent.js 2>/dev/null; then
  echo "✅ MyEventsContent has proper data fetching"
else
  echo "❌ MyEventsContent missing proper data fetching"
fi

if grep -q "EnhancedEventList" components/MyEventsContent.js 2>/dev/null; then
  echo "✅ MyEventsContent uses EnhancedEventList component"
else
  echo "❌ MyEventsContent NOT using EnhancedEventList component"
fi

# Check if interested-events API is properly implemented
if [ -f "pages/api/user/interested-events.js" ]; then
  echo "✅ interested-events API exists"
else
  echo "❌ interested-events API MISSING"
fi

echo ""
echo "2️⃣ CHECKING MUSIC TASTE TAB:"
echo "----------------------------"

# Check if MusicTasteContent component exists
if [ -f "components/MusicTasteContent.js" ]; then
  echo "✅ MusicTasteContent component exists"
else
  echo "❌ MusicTasteContent component MISSING"
fi

# Check if MusicTasteContent is properly implemented
if grep -q "loadSpotifyData" components/MusicTasteContent.js 2>/dev/null; then
  echo "✅ MusicTasteContent has proper data fetching"
else
  echo "❌ MusicTasteContent missing proper data fetching"
fi

if grep -q "tasteEvolution" components/MusicTasteContent.js 2>/dev/null; then
  echo "✅ MusicTasteContent has taste evolution section"
else
  echo "❌ MusicTasteContent missing taste evolution section"
fi

# Check if Spotify API endpoints are properly implemented
if [ -f "pages/api/spotify/user-data.js" ]; then
  echo "✅ Spotify user-data API exists"
else
  echo "❌ Spotify user-data API MISSING"
fi

echo ""
echo "3️⃣ CHECKING TAB NAVIGATION INTEGRATION:"
echo "----------------------------"

# Check if TabNavigationWrapper properly renders both tabs
if grep -q "case 'music-taste':" components/TabNavigationWrapper.js 2>/dev/null; then
  echo "✅ TabNavigationWrapper handles Music Taste tab"
else
  echo "❌ TabNavigationWrapper NOT handling Music Taste tab"
fi

if grep -q "case 'my-events':" components/TabNavigationWrapper.js 2>/dev/null; then
  echo "✅ TabNavigationWrapper handles My Events tab"
else
  echo "❌ TabNavigationWrapper NOT handling My Events tab"
fi

echo ""
echo "🔍 VERIFICATION COMPLETE!"
echo ""
echo "🚨 POTENTIAL ISSUES:"
echo "   1. Missing or incomplete tab content components"
echo "   2. Improper data fetching in tab content"
echo "   3. Styling inconsistencies between tabs"
echo "   4. API endpoints not properly implemented"
echo ""
echo "🔧 RECOMMENDED FIXES:"
echo "   1. Implement proper MyEventsContent and MusicTasteContent components"
echo "   2. Ensure proper data fetching in both components"
echo "   3. Match styling with the main dashboard"
echo "   4. Implement missing API endpoints"

