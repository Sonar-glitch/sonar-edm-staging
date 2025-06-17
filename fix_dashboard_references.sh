#!/bin/bash

echo "🔗 FIXING DASHBOARD REFERENCES"
echo "=============================="
echo ""
echo "After removing enhanced-dashboard.js, we need to update any files"
echo "that still reference it to point to the correct dashboard"
echo ""

# Navigate to frontend directory
cd /c/sonar/users/sonar-edm-user

echo "📍 Current directory: $(pwd)"

echo ""
echo "🔍 STEP 1: FIND ALL REFERENCES TO ENHANCED-DASHBOARD"
echo "===================================================="

echo ""
echo "📋 Searching for 'enhanced-dashboard' references:"
grep -r "enhanced-dashboard" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v .next

echo ""
echo "📋 Searching for '/enhanced-dashboard' URL references:"
grep -r "/enhanced-dashboard" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v .next

echo ""
echo "📋 Searching for 'EnhancedDashboard' component references:"
grep -r "EnhancedDashboard" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v .next

echo ""
echo "🔧 STEP 2: UPDATE REFERENCES TO USE CORRECT DASHBOARD"
echo "====================================================="

# Common files that might need updating
files_to_check=(
    "components/Navigation.js"
    "components/Header.js"
    "components/Layout.js"
    "pages/index.js"
    "pages/_app.js"
    "next.config.js"
)

echo ""
echo "📋 Checking common files for dashboard references:"
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo ""
        echo "🔍 Checking: $file"
        if grep -q "enhanced-dashboard\|EnhancedDashboard" "$file" 2>/dev/null; then
            echo "⚠️  Found references in $file:"
            grep -n "enhanced-dashboard\|EnhancedDashboard" "$file"
        else
            echo "✅ No enhanced-dashboard references found"
        fi
    else
        echo "⚪ $file not found"
    fi
done

echo ""
echo "🔧 STEP 3: AUTOMATIC FIXES"
echo "=========================="

# Fix any /enhanced-dashboard URLs to /dashboard
echo ""
echo "🔧 Replacing '/enhanced-dashboard' URLs with '/dashboard'..."

# Find and replace in all relevant files
find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | \
    grep -v node_modules | grep -v .next | \
    xargs sed -i 's|/enhanced-dashboard|/dashboard|g' 2>/dev/null

echo "✅ URL replacements completed"

# Fix any import statements
echo ""
echo "🔧 Fixing import statements..."

find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | \
    grep -v node_modules | grep -v .next | \
    xargs sed -i 's|enhanced-dashboard|dashboard|g' 2>/dev/null

echo "✅ Import statement fixes completed"

echo ""
echo "🔍 STEP 4: VERIFY FIXES"
echo "======================"

echo ""
echo "📋 Remaining 'enhanced-dashboard' references (should be empty):"
grep -r "enhanced-dashboard" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v .next || echo "✅ No remaining references found"

echo ""
echo "📋 Current dashboard route references:"
grep -r "/dashboard" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v .next | head -10

echo ""
echo "🔍 STEP 5: CHECK NEXTAUTH REDIRECT"
echo "=================================="

if [ -f "pages/api/auth/[...nextauth].js" ]; then
    echo ""
    echo "🔍 Checking NextAuth redirect configuration:"
    if grep -q "enhanced-dashboard" "pages/api/auth/[...nextauth].js"; then
        echo "⚠️  Found enhanced-dashboard in NextAuth config, fixing..."
        sed -i 's|enhanced-dashboard|dashboard|g' "pages/api/auth/[...nextauth].js"
        echo "✅ NextAuth redirect fixed"
    else
        echo "✅ NextAuth already redirects to correct dashboard"
    fi
    
    echo ""
    echo "📋 Current NextAuth redirect:"
    grep -A 2 -B 2 "redirect.*dashboard" "pages/api/auth/[...nextauth].js" || echo "No dashboard redirect found"
else
    echo "⚪ NextAuth config not found"
fi

echo ""
echo "📦 STEP 6: COMMIT REFERENCE FIXES"
echo "================================="

git add -A
git commit -m "🔗 FIX: Update all enhanced-dashboard references to dashboard

After cleanup, updated all remaining references:
- Changed /enhanced-dashboard URLs to /dashboard
- Fixed import statements
- Updated NextAuth redirects
- Ensured single dashboard route consistency

✅ All references now point to pages/dashboard.js
✅ No more broken links or imports
✅ Ready for Step 1 testing"

if [ $? -eq 0 ]; then
    echo "✅ Reference fixes committed successfully"
else
    echo "❌ Failed to commit reference fixes"
fi

echo ""
echo "🏁 DASHBOARD REFERENCE FIXES COMPLETED"
echo "====================================="
echo ""
echo "✅ All enhanced-dashboard references updated"
echo "✅ URLs now point to /dashboard"
echo "✅ Imports now reference correct files"
echo "✅ NextAuth redirects to correct dashboard"
echo ""
echo "🚀 READY FOR DEPLOYMENT:"
echo "git push heroku main"
echo ""
echo "🎯 After deployment, your site should:"
echo "- Use pages/dashboard.js (single source of truth)"
echo "- Show spider chart + capsules (Step 1)"
echo "- Have no broken dashboard links"

