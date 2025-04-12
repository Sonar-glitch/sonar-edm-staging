# Implementation Guide for Fixing Import Path Issues

This guide provides step-by-step instructions for using the automated scripts to fix the import path issues in the Sonar EDM Platform Backend API and deploy the application to Heroku.

## Prerequisites

- Node.js (v16.x or higher)
- Git
- Heroku CLI (optional, only needed for deployment)

## Files Included

1. `fix_import_paths.js` - Script to automatically fix incorrect import paths
2. `deploy.sh` - Comprehensive script that runs the fix script and handles deployment

## Option 1: Using the All-in-One Deployment Script (Recommended)

This is the easiest option as it automates the entire process.

1. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

3. Follow the prompts in the script. It will:
   - Run the fix script to correct import paths
   - Commit the changes to your repository
   - Deploy to Heroku (if Heroku CLI is installed)
   - Provide guidance for manual steps if needed

## Option 2: Running Scripts Separately

If you prefer more control over the process, you can run the scripts separately.

### Step 1: Fix Import Paths

1. Run the fix script:
   ```bash
   node fix_import_paths.js
   ```

2. The script will:
   - Search for JavaScript files in the pages directory
   - Fix incorrect import paths (changing "../../lib/" to "../lib/" and "../../config" to "../config")
   - Report which files were fixed

### Step 2: Commit and Deploy Manually

1. Navigate to the repository directory:
   ```bash
   cd sonar-edm-platform
   ```

2. Commit the changes:
   ```bash
   git add .
   git commit -m "Fix import paths in API files"
   ```

3. Push to your GitHub repository:
   ```bash
   git push origin main
   ```

4. Deploy to Heroku:
   ```bash
   git push heroku main:main --force
   ```

## Troubleshooting

### If the fix script doesn't find any files to fix:

- Ensure you're running the script from the correct directory (it should be in the same directory as the `sonar-edm-platform` folder)
- The patterns in the script might not match the actual import statements. You can modify the `replacements` array in the script to match your specific import patterns.

### If you encounter Git configuration issues:

Configure Git with your credentials:
```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

### If you encounter Heroku deployment issues:

1. Ensure you're logged in to Heroku:
   ```bash
   heroku login
   ```

2. Check if the Heroku remote is correctly set:
   ```bash
   git remote -v
   ```

3. If the Heroku remote is missing, add it:
   ```bash
   git remote add heroku https://git.heroku.com/your-app-name.git
   ```

## Next Steps After Deployment

1. Verify the deployment by visiting your Heroku app URL
2. Test the API endpoints to ensure they're working correctly
3. If you encounter any new issues, check the Heroku logs:
   ```bash
   heroku logs --tail
   ```

## Additional Notes

- The fix script only modifies import paths and doesn't change any functionality
- The deployment script includes checks for prerequisites and provides guidance for missing components
- If you need to customize the fix script, the main patterns to modify are in the `replacements` array
