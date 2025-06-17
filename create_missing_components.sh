#!/bin/bash

echo "🔧 QUICK FIX: Create Missing Components"
echo "======================================"
echo ""
echo "Creating placeholder components to fix build errors:"
echo "- EnhancedLocationSearch.js"
echo "- EventDetailModal.js"
echo ""

# Navigate to frontend directory
cd /c/sonar/users/sonar-edm-user

echo "📍 Current directory: $(pwd)"

echo ""
echo "🔧 STEP 1: Create EnhancedLocationSearch.js"
echo "==========================================="

cat > components/EnhancedLocationSearch.js << 'EOF'
import React, { useState } from 'react';

/**
 * Placeholder EnhancedLocationSearch component
 * TODO: Implement full location search functionality for Step 2
 */
export default function EnhancedLocationSearch({ initialLocation, onLocationChange }) {
  const [currentLocation] = useState(initialLocation || {
    city: 'Toronto',
    stateCode: 'ON',
    countryCode: 'CA',
    lat: 43.653226,
    lon: -79.383184,
    formattedAddress: 'Toronto, ON, Canada'
  });

  return (
    <div style={{ 
      padding: '1rem', 
      background: '#1a1a1a', 
      borderRadius: '8px',
      border: '1px solid #333',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: '#ff1493' }}>📍</span>
        <span>{currentLocation.formattedAddress}</span>
        <button 
          style={{
            background: 'linear-gradient(90deg, #00c6ff, #ff00ff)',
            border: 'none',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            color: 'white',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          Change
        </button>
      </div>
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#888', 
        marginTop: '0.5rem' 
      }}>
        Step 2: Location search functionality coming soon
      </div>
    </div>
  );
}
EOF

echo "✅ Created components/EnhancedLocationSearch.js"

echo ""
echo "🔧 STEP 2: Create EventDetailModal.js"
echo "====================================="

cat > components/EventDetailModal.js << 'EOF'
import React from 'react';

/**
 * Placeholder EventDetailModal component
 * TODO: Implement full event detail modal for Step 4
 */
export default function EventDetailModal({ event, isOpen, onClose }) {
  if (!isOpen || !event) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #333',
        color: '#fff',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: '#00c6ff' }}>{event.name || 'Event Details'}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <p><strong>Venue:</strong> {event.venue || 'TBD'}</p>
          <p><strong>Date:</strong> {event.date || 'TBD'}</p>
          <p><strong>Match Score:</strong> {event.matchScore || 'N/A'}%</p>
        </div>
        
        <div style={{ 
          padding: '1rem',
          background: '#2a2a2a',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>
            Step 4: Full event details with AI explanations and purchase links coming soon
          </p>
        </div>
        
        <button 
          onClick={onClose}
          style={{
            background: 'linear-gradient(90deg, #00c6ff, #ff00ff)',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
EOF

echo "✅ Created components/EventDetailModal.js"

echo ""
echo "🔧 STEP 3: Verify Components Created"
echo "==================================="

echo ""
echo "📋 Checking created files:"
if [ -f "components/EnhancedLocationSearch.js" ]; then
    echo "✅ components/EnhancedLocationSearch.js - EXISTS"
else
    echo "❌ components/EnhancedLocationSearch.js - MISSING"
fi

if [ -f "components/EventDetailModal.js" ]; then
    echo "✅ components/EventDetailModal.js - EXISTS"
else
    echo "❌ components/EventDetailModal.js - MISSING"
fi

echo ""
echo "📦 STEP 4: Commit and Deploy"
echo "============================"

git add components/EnhancedLocationSearch.js components/EventDetailModal.js
git commit -m "🔧 QUICK FIX: Add missing component placeholders

Created placeholder components to fix build errors:
- EnhancedLocationSearch.js (Step 2 placeholder)
- EventDetailModal.js (Step 4 placeholder)

✅ Build should now succeed
✅ Step 1 (spider chart + capsules) should be visible
🎯 Ready to test Step 1 implementation"

if [ $? -eq 0 ]; then
    echo "✅ Placeholder components committed successfully"
    
    echo ""
    echo "🚀 DEPLOYING TO STAGING"
    echo "======================="
    
    git push heroku main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        echo "========================"
        echo ""
        echo "🌐 Check your dashboard at:"
        echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
        echo ""
        echo "🎯 You should now see:"
        echo "✅ Spider chart (top 5 genres) instead of progress bars"
        echo "✅ Capsule indicators (sound features) with percentage fills"
        echo "✅ Step 1 COMPLETE!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Test Step 1 components are working"
        echo "2. Implement Step 2 (location search)"
        echo "3. Implement Step 3 (event list)"
        echo "4. Implement Step 4 (event detail modal)"
    else
        echo ""
        echo "❌ DEPLOYMENT FAILED"
        echo "Check the error messages above"
    fi
else
    echo "❌ Failed to commit placeholder components"
fi

echo ""
echo "🏁 QUICK FIX COMPLETED"
echo "====================="

