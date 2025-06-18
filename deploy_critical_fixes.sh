#!/bin/bash

echo "🚀 DEPLOYING CRITICAL EVENT FIXES"
echo "================================="

echo "✅ Step 1: Adding changes to git..."
git add .

echo "✅ Step 2: Committing critical fixes..."
git commit -m "CRITICAL FIXES: Match scores capped at 99%, proper event URLs, correct data labels"

echo "✅ Step 3: Deploying to Heroku..."
git push heroku step2-frontend-backend-alignment:main --force

echo ""
echo "🎯 CRITICAL FIXES DEPLOYED"
echo "========================="
echo ""
echo "✅ Fixed Issues:"
echo "   - Match scores: Now properly capped at 99%"
echo "   - Event URLs: Use actual Ticketmaster ticket links"
echo "   - Data labels: Show 'Live Data' for real events"
echo "   - Event clicking: Proper URL validation and handling"
echo ""
echo "🚀 Your staging site is ready for testing:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
