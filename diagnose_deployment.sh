#!/bin/bash
# DIAGNOSTIC: Check current deployment state and fix issues
# File: diagnose_deployment.sh

echo "🔍 DIAGNOSTIC: Checking TIKO Deployment Issues"
echo "=============================================="

# Check current directory
echo "📍 Current directory: $(pwd)"
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: Not in project directory. Please run from /c/sonar/users/sonar-edm-user"
    exit 1
fi

# Check Heroku apps
echo ""
echo "🌐 Checking Heroku apps..."
heroku apps | grep sonar

# Check which app we're connected to
echo ""
echo "🔗 Checking Git remotes..."
git remote -v

# Check if our components exist
echo ""
echo "📁 Checking if our new components exist..."
if [[ -f "components/Top5GenresSpiderChart.js" ]]; then
    echo "✅ Top5GenresSpiderChart.js exists"
else
    echo "❌ Top5GenresSpiderChart.js missing"
fi

if [[ -f "components/SoundFeatureCapsules.js" ]]; then
    echo "✅ SoundFeatureCapsules.js exists"
else
    echo "❌ SoundFeatureCapsules.js missing"
fi

if [[ -f "components/EnhancedPersonalizedDashboard.js" ]]; then
    echo "✅ EnhancedPersonalizedDashboard.js exists"
else
    echo "❌ EnhancedPersonalizedDashboard.js missing"
fi

# Check what page is actually being used for dashboard
echo ""
echo "📄 Checking dashboard pages..."
if [[ -f "pages/dashboard.js" ]]; then
    echo "✅ pages/dashboard.js exists"
    echo "🔍 Checking if it uses EnhancedPersonalizedDashboard..."
    if grep -q "EnhancedPersonalizedDashboard" pages/dashboard.js; then
        echo "✅ dashboard.js imports EnhancedPersonalizedDashboard"
    else
        echo "❌ dashboard.js does NOT import EnhancedPersonalizedDashboard"
        echo "📝 This is likely the problem!"
    fi
else
    echo "❌ pages/dashboard.js missing"
fi

if [[ -f "pages/users/dashboard.js" ]]; then
    echo "✅ pages/users/dashboard.js exists"
    echo "🔍 Checking if it uses EnhancedPersonalizedDashboard..."
    if grep -q "EnhancedPersonalizedDashboard" pages/users/dashboard.js; then
        echo "✅ users/dashboard.js imports EnhancedPersonalizedDashboard"
    else
        echo "❌ users/dashboard.js does NOT import EnhancedPersonalizedDashboard"
    fi
else
    echo "❌ pages/users/dashboard.js missing"
fi

# Check API endpoints
echo ""
echo "🔌 Checking API endpoints..."
if [[ -f "pages/api/user/profile.js" ]]; then
    echo "✅ pages/api/user/profile.js exists"
else
    echo "❌ pages/api/user/profile.js missing - this explains the 404 errors!"
fi

if [[ -f "pages/api/spotify/user-profile.js" ]]; then
    echo "✅ pages/api/spotify/user-profile.js exists"
else
    echo "❌ pages/api/spotify/user-profile.js missing"
fi

# Check package.json for recharts
echo ""
echo "📦 Checking dependencies..."
if grep -q "recharts" package.json; then
    echo "✅ recharts is in package.json"
else
    echo "❌ recharts missing from package.json"
fi

echo ""
echo "🎯 DIAGNOSIS COMPLETE"
echo "===================="
echo ""
echo "🔧 LIKELY ISSUES FOUND:"
echo "1. Wrong Heroku app - you deployed to sonar-edm-staging but viewing sonar-edm-user"
echo "2. Dashboard page not using our new component"
echo "3. Missing API endpoints causing 404 errors"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Fix the dashboard page to use our new component"
echo "2. Deploy to the correct Heroku app"
echo "3. Add missing API endpoints"
echo ""
echo "Run: ./fix_deployment_issues.sh"

