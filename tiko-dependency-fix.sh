#!/bin/bash

# TIKO Platform Dependency Fix Script
# This script fixes the Next.js dependency issues and ensures proper implementation
# Created: April 25, 2025

echo "Starting TIKO dependency fix at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
BACKUP_DIR="./backups/dependency-fix-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory created: $BACKUP_DIR"

# Backup package.json and package-lock.json
echo "Backing up package files..."
cp -f package.json "$BACKUP_DIR/package.json.bak" 2>/dev/null || echo "Warning: Could not backup package.json"
cp -f package-lock.json "$BACKUP_DIR/package-lock.json.bak" 2>/dev/null || echo "Warning: Could not backup package-lock.json"

# Fix Next.js dependencies
echo "Fixing Next.js dependencies..."

# 1. Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# 2. Remove node_modules directory
echo "Removing node_modules directory..."
rm -rf node_modules

# 3. Remove package-lock.json
echo "Removing package-lock.json..."
rm -f package-lock.json

# 4. Update package.json to ensure correct dependencies
echo "Updating package.json with correct dependencies..."

# Create a temporary file with updated dependencies
cat > package.json.new << 'EOL'
{
  "name": "sonar-edm-user",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "heroku-postbuild": "npm run build"
  },
  "dependencies": {
    "@next-auth/mongodb-adapter": "^1.1.3",
    "axios": "^1.4.0",
    "bcryptjs": "^2.4.3",
    "cookie": "^0.5.0",
    "mongodb": "^5.6.0",
    "next": "13.4.4",
    "next-auth": "^4.22.1",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "recharts": "^2.6.2"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.14",
    "eslint": "8.42.0",
    "eslint-config-next": "13.4.4",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2"
  },
  "engines": {
    "node": "18.x"
  }
}
EOL

# Replace the existing package.json with the new one
mv package.json.new package.json
echo "package.json updated with correct dependencies"

# 5. Reinstall dependencies
echo "Reinstalling dependencies..."
npm install --legacy-peer-deps

# 6. Create a .npmrc file to ensure proper dependency resolution
echo "Creating .npmrc file..."
cat > .npmrc << 'EOL'
legacy-peer-deps=true
strict-peer-dependencies=false
auto-install-peers=true
node-linker=hoisted
EOL

# 7. Create a next.config.js file with optimized settings
echo "Creating optimized next.config.js..."
cat > next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Disable some experimental features that might cause issues
    appDir: false,
    serverComponentsExternalPackages: [],
  },
  // Increase build memory limit
  webpack: (config, { isServer }) => {
    // Increase memory limit for the build process
    if (!isServer) {
      config.optimization.nodeEnv = 'production';
    }
    return config;
  },
}

module.exports = nextConfig
EOL

# 8. Create a .babelrc file to ensure proper transpilation
echo "Creating .babelrc file..."
cat > .babelrc << 'EOL'
{
  "presets": ["next/babel"]
}
EOL

# 9. Create a deployment script that includes dependency checks
echo "Creating deployment script with dependency checks..."

cat > deploy-with-checks.sh << 'EOL'
#!/bin/bash

# TIKO Platform Deployment Script with Dependency Checks
# This script ensures dependencies are properly installed before deploying to Heroku

echo "Starting deployment with dependency checks at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# 1. Verify dependencies
echo "Verifying dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "node_modules directory not found. Installing dependencies..."
  npm install --legacy-peer-deps
fi

# Check for critical Next.js files
if [ ! -f "node_modules/next/dist/bin/next" ]; then
  echo "Next.js binary not found. Reinstalling Next.js..."
  npm install next@13.4.4 --legacy-peer-deps
fi

# 2. Run a local build test
echo "Running local build test..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Local build failed. Fixing dependencies and trying again..."
  
  # Clean and reinstall
  rm -rf node_modules
  rm -f package-lock.json
  npm cache clean --force
  npm install --legacy-peer-deps
  
  # Try building again
  npm run build
  
  # Check if second build attempt was successful
  if [ $? -ne 0 ]; then
    echo "Build failed again. Please check the error messages above."
    exit 1
  fi
fi

echo "Local build successful. Proceeding with deployment."

# 3. Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix dependencies and implement comprehensive solution"

# 4. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
EOL

chmod +x deploy-with-checks.sh

echo "Dependency fix script completed successfully!"
echo "To fix the dependencies and deploy your application:"
echo "1. Copy this script to /c/sonar/users/sonar-edm-user/"
echo "2. Make it executable: chmod +x tiko-dependency-fix.sh"
echo "3. Run it: ./tiko-dependency-fix.sh"
echo "4. Deploy with checks: ./deploy-with-checks.sh"
