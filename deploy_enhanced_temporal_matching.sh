#!/bin/bash

echo "🚀 DEPLOYING ENHANCED TEMPORAL MATCHING SYSTEM"
echo "=============================================="

echo "✅ Step 1: Adding changes to git..."
git add .

echo "✅ Step 2: Committing enhanced temporal matching..."
git commit -m "PHASE 1: Enhanced Temporal Matching - Time-weighted preferences, negative signals, taste evolution"

echo "✅ Step 3: Deploying to Heroku..."
git push heroku HEAD:main --force

echo ""
echo "🎯 ENHANCED TEMPORAL MATCHING DEPLOYED"
echo "====================================="
echo ""
echo "✅ New Features:"
echo "   - Time-weighted preferences (recent activity prioritized)"
echo "   - Negative signal processing (removed tracks, skipped content)"
echo "   - Taste evolution tracking (trending up/down genres)"
echo "   - Seasonal context matching"
echo "   - Enhanced caching for stability"
echo ""
echo "✅ Sophisticated Scoring Components:"
echo "   - Genre Matching: 30% (with temporal weighting)"
echo "   - Artist Matching: 20% (with popularity weighting)"
echo "   - Venue Quality: 15% (reputation-based)"
echo "   - EDM Relevance: 10% (keyword matching)"
echo "   - Time-Weighted Preferences: 15% (NEW)"
echo "   - Negative Signals: -10% penalty (NEW)"
echo "   - Taste Evolution: 5% bonus (NEW)"
echo "   - Seasonal Context: 5% (NEW)"
echo ""
echo "🚀 Your staging site with enhanced matching:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo ""
