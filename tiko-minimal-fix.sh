#!/bin/bash

# TIKO Platform Minimal Dependency Fix Script
# This script adds the missing visualization libraries needed for the build
# Created: April 25, 2025

echo "Starting TIKO minimal dependency fix at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
BACKUP_DIR="./backups/minimal-fix-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory created: $BACKUP_DIR"

# Backup package.json
echo "Backing up package.json..."
cp -f package.json "$BACKUP_DIR/package.json.bak" 2>/dev/null || echo "Warning: Could not backup package.json"

# Install the missing visualization libraries
echo "Installing missing visualization libraries..."
npm install --save d3@7.8.5 chart.js@4.3.0 react-chartjs-2@5.2.0 --legacy-peer-deps

# Create a simple deployment script
echo "Creating simple deployment script..."

cat > deploy-minimal.sh << 'EOL'
#!/bin/bash

# TIKO Platform Minimal Deployment Script
# This script deploys the application with minimal changes

echo "Starting minimal deployment at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Commit changes
echo "Committing changes..."
git add package.json package-lock.json
git commit -m "Add missing visualization libraries"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
EOL

chmod +x deploy-minimal.sh

echo "Minimal dependency fix script completed successfully!"
echo "To fix the dependencies and deploy your application:"
echo "1. Copy this script to /c/sonar/users/sonar-edm-user/"
echo "2. Make it executable: chmod +x tiko-minimal-fix.sh"
echo "3. Run it: ./tiko-minimal-fix.sh"
echo "4. Deploy with minimal changes: ./deploy-minimal.sh"
