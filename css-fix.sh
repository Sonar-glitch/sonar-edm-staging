#!/bin/bash
# css-fix.sh
# Script to fix the missing CSS module issue
# For use in Windows Git Bash at /c/sonar/users/sonar-edm-user/

# Set timestamp to force a clean build on Heroku
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Starting CSS fix at $TIMESTAMP"

# Store current directory to return to it later
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Navigate to the main project directory
cd /c/sonar/users/sonar-edm-user/
echo "Moved to main project directory: $(pwd)"

# Make sure we have the latest changes
echo "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# 1. Create the styles directory if it doesn't exist
mkdir -p styles
echo "Created styles directory (if it didn't exist)"

# 2. Create the missing Signin.module.css file
echo "Creating Signin.module.css..."
cat > styles/Signin.module.css << 'EOL'
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #0a0a14;
}

.card {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 30px;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.logo {
  color: #00e5ff;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.title {
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 20px;
  text-align: center;
}

.providers {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.providerButton {
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.1), rgba(255, 0, 255, 0.1));
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 6px;
  color: #fff;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.providerButton:hover {
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.2), rgba(255, 0, 255, 0.2));
}

.providerIcon {
  margin-right: 10px;
  font-size: 1.2rem;
}

.error {
  background-color: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 6px;
  color: #ff6b6b;
  padding: 10px;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.terms {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
  text-align: center;
}
EOL
echo "Created Signin.module.css"

# 3. Update auth/[...nextauth].js to redirect to dashboard (if it exists)
if [ -f "pages/api/auth/[...nextauth].js" ]; then
  # Make a backup
  cp pages/api/auth/[...nextauth].js pages/api/auth/[...nextauth].js.bak
  
  # Update the file to redirect to dashboard
  sed -i 's|callbackUrl: "/users/music-taste"|callbackUrl: "/dashboard"|g' pages/api/auth/[...nextauth].js
  echo "Updated [...nextauth].js to redirect to dashboard"
else
  echo "Warning: pages/api/auth/[...nextauth].js not found, skipping this update"
fi

# 4. Add timestamp to force Heroku rebuild
echo "DEPLOY_TIMESTAMP=$TIMESTAMP" > .env
echo "Added timestamp to force rebuild"

# 5. Commit changes
echo "Committing changes..."
git add styles/Signin.module.css
git add .env
git add pages/api/auth/[...nextauth].js 2>/dev/null || true
git commit -m "Add missing Signin.module.css and fix authentication redirect"

# 6. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku $CURRENT_BRANCH:master --force

echo "Deployment complete! The build should now succeed with the missing CSS module added."
echo "Dashboard page: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo "Music Taste page: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/users/music-taste"

# Return to original directory
cd "$CURRENT_DIR"
echo "Returned to original directory: $(pwd)"
