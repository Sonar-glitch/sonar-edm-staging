#!/bin/bash

echo "🛡️ QUICK RESTORE: GLASSMORPHIC SUCCESS STATE"
echo "==========================================="

echo "⚠️  This will restore your dashboard to the successful glassmorphic state"
echo "⚠️  Are you sure you want to continue? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "✅ Restoring glassmorphic success state..."
    
    # Navigate to project root
    cd /c/sonar/users/sonar-edm-user
    
    # Restore glassmorphic files
    cp "backup_glassmorphic_success_20250618_030434/EnhancedEventList.js.glassmorphic" components/EnhancedEventList.js
    cp "backup_glassmorphic_success_20250618_030434/EnhancedEventList.module.css.glassmorphic" styles/EnhancedEventList.module.css
    
    echo "✅ Files restored successfully"
    echo "✅ Now commit and deploy:"
    echo "   git add ."
    echo "   git commit -m 'RESTORE: Glassmorphic events success state'"
    echo "   git push heroku HEAD:main --force"
else
    echo "❌ Restore cancelled"
fi
