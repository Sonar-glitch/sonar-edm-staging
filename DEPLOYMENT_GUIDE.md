# Sonar EDM Platform - Deployment Guide

This guide provides detailed instructions for deploying the Sonar EDM Platform to Heroku with all the necessary dependencies.

## Prerequisites

Before deploying, ensure you have:

1. A Heroku account
2. Heroku CLI installed (optional for manual deployment)
3. Git installed
4. Spotify Developer account with API credentials
5. Google Developer account with API credentials
6. MongoDB Atlas account (or other MongoDB provider)

## Step 1: Update Dependencies

The platform uses Chart.js for data visualization. Make sure your `package.json` includes these dependencies:

```json
{
  "dependencies": {
    "axios": "^0.27.2",
    "chart.js": "^3.9.1",
    "dotenv": "^16.0.1",
    "mongodb": "^4.8.1",
    "next": "12.2.5",
    "next-auth": "^4.10.3",
    "react": "18.2.0",
    "react-chartjs-2": "^4.3.1",
    "react-dom": "18.2.0"
  },
  "engines": {
    "node": "16.x"
  }
}
```

## Step 2: Prepare Your Repository

1. Extract the provided `sonar-edm-platform-fixes.zip` file
2. Replace the existing files in your repository with the fixed versions
3. Make sure the `package.json` file is updated with the dependencies listed above
4. Commit all changes to your repository:

```bash
git add .
git commit -m "Implement modern UI and fix functionality issues"
```

## Step 3: Set Up Environment Variables

You'll need to set the following environment variables in Heroku:

1. `SPOTIFY_CLIENT_ID` - Your Spotify application client ID
2. `SPOTIFY_CLIENT_SECRET` - Your Spotify application client secret
3. `GOOGLE_CLIENT_ID` - Your Google application client ID
4. `GOOGLE_CLIENT_SECRET` - Your Google application client secret
5. `MONGODB_URI` - Your MongoDB connection string
6. `NEXTAUTH_SECRET` - A random string for session encryption (generate with `openssl rand -base64 32`)
7. `NEXTAUTH_URL` - Your Heroku app URL (e.g., https://your-app-name.herokuapp.com)

## Step 4: Deploy to Heroku

### Option 1: Deploy via Heroku CLI

```bash
# Login to Heroku
heroku login

# Create a new Heroku app (if you don't have one already)
heroku create your-app-name

# Set environment variables
heroku config:set SPOTIFY_CLIENT_ID=your_spotify_client_id
heroku config:set SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
heroku config:set GOOGLE_CLIENT_ID=your_google_client_id
heroku config:set GOOGLE_CLIENT_SECRET=your_google_client_secret
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set NEXTAUTH_SECRET=your_random_string
heroku config:set NEXTAUTH_URL=https://your-app-name.herokuapp.com

# Push to Heroku
git push heroku main
```

### Option 2: Deploy via Heroku Dashboard

1. Go to your Heroku Dashboard
2. Create a new app or select your existing app
3. Go to the "Deploy" tab
4. Connect your GitHub repository
5. Scroll down to "Manual deploy" and click "Deploy Branch"
6. Go to the "Settings" tab
7. Click "Reveal Config Vars" and add all the environment variables listed above

## Step 5: Update Authentication Callback URLs

After deployment, update your callback URLs:

1. In Spotify Developer Dashboard:
   - Add: `https://your-app-name.herokuapp.com/api/auth/callback/spotify`

2. In Google Cloud Console:
   - Add: `https://your-app-name.herokuapp.com/api/auth/callback/google`

## Troubleshooting Common Deployment Issues

### Missing Dependencies

If you encounter errors about missing dependencies:

1. Make sure your `package.json` includes all required dependencies
2. Run `npm install` locally to update your `package-lock.json`
3. Commit both files and redeploy

### Build Failures

If your build fails:

1. Check the build logs for specific errors
2. Verify that all CSS module files exist and are properly referenced
3. Ensure Node.js version compatibility (we're using 16.x)

### Authentication Issues

If authentication doesn't work:

1. Verify all environment variables are correctly set
2. Check that callback URLs are properly configured in Spotify and Google dashboards
3. Ensure `NEXTAUTH_URL` matches your actual Heroku app URL

## Post-Deployment Verification

After successful deployment:

1. Visit your app URL
2. Test both authentication methods (Spotify and Google)
3. Verify all pages load correctly with the modern UI
4. Test the music taste analysis functionality
5. Check that analytics dashboards display properly

If you encounter any issues during deployment, please refer to the error messages in the Heroku logs for troubleshooting.
