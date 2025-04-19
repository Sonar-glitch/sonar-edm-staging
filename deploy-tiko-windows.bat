@echo off
echo === TIKO - Visualization Restoration Deployment Script ===
echo This script will deploy your TIKO platform with restored visualization components

echo Setting environment variables...
heroku config:set NEXTAUTH_URL=https://sonar-edm-user-50e4fb038f6e.herokuapp.com --app sonar-edm-user
heroku config:set NODE_ENV=production --app sonar-edm-user
heroku config:set NPM_CONFIG_PRODUCTION=false --app sonar-edm-user

echo Setting timestamp to force a clean build...
heroku config:set DEPLOY_TIMESTAMP=%TIME% --app sonar-edm-user

echo Committing changes...
git add .
git commit -m "Restore visualization components and optimize performance"

echo Deploying to Heroku...
git push heroku main:master --force

echo Deployment complete!
echo Your TIKO platform is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com
