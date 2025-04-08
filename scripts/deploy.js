#!/usr/bin/env node

/**
 * Sonar EDM Platform - One-Click Deployment Script
 * 
 * This script automates the setup and deployment process for the Sonar EDM Platform.
 * It handles:
 * 1. Environment setup
 * 2. Dependency installation
 * 3. Configuration validation
 * 4. Deployment to Heroku
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const crypto = require('crypto');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration object to store user inputs
const userConfig = {
  spotify: {
    clientId: '',
    clientSecret: ''
  },
  mongodb: {
    uri: ''
  },
  auth: {
    secret: ''
  },
  heroku: {
    appName: '',
    apiKey: ''
  }
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Print a styled header to the console
 * @param {string} text - Header text
 */
function printHeader(text) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(text.length + 4) + colors.reset);
  console.log(colors.bright + colors.cyan + '| ' + text + ' |' + colors.reset);
  console.log(colors.bright + colors.cyan + '='.repeat(text.length + 4) + colors.reset + '\n');
}

/**
 * Print a success message to the console
 * @param {string} text - Success message
 */
function printSuccess(text) {
  console.log(colors.green + '✓ ' + text + colors.reset);
}

/**
 * Print an error message to the console
 * @param {string} text - Error message
 */
function printError(text) {
  console.log(colors.red + '✗ ' + text + colors.reset);
}

/**
 * Print an info message to the console
 * @param {string} text - Info message
 */
function printInfo(text) {
  console.log(colors.blue + 'ℹ ' + text + colors.reset);
}

/**
 * Ask a question and get user input
 * @param {string} question - Question to ask
 * @param {boolean} isRequired - Whether the input is required
 * @param {string} defaultValue - Default value if user input is empty
 * @returns {Promise<string>} User input
 */
function askQuestion(question, isRequired = true, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(colors.yellow + question + defaultText + ': ' + colors.reset, (answer) => {
      if (!answer && isRequired && !defaultValue) {
        printError('This field is required. Please try again.');
        resolve(askQuestion(question, isRequired, defaultValue));
      } else {
        resolve(answer || defaultValue);
      }
    });
  });
}

/**
 * Check if a command is available in the system
 * @param {string} command - Command to check
 * @returns {boolean} Whether the command is available
 */
function isCommandAvailable(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check system requirements
 * @returns {Promise<boolean>} Whether all requirements are met
 */
async function checkRequirements() {
  printHeader('Checking System Requirements');
  
  let allRequirementsMet = true;
  
  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    const versionMatch = nodeVersion.match(/v(\d+)\./);
    const majorVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
    
    if (majorVersion >= 16) {
      printSuccess(`Node.js ${nodeVersion} is installed (required: v16+)`);
    } else {
      printError(`Node.js ${nodeVersion} is below the required version (v16+)`);
      allRequirementsMet = false;
    }
  } catch (error) {
    printError('Node.js is not installed or not in PATH');
    allRequirementsMet = false;
  }
  
  // Check npm
  if (isCommandAvailable('npm')) {
    printSuccess('npm is installed');
  } else {
    printError('npm is not installed or not in PATH');
    allRequirementsMet = false;
  }
  
  // Check git
  if (isCommandAvailable('git')) {
    printSuccess('git is installed');
  } else {
    printError('git is not installed or not in PATH');
    allRequirementsMet = false;
  }
  
  // Check Heroku CLI (optional)
  if (isCommandAvailable('heroku')) {
    printSuccess('Heroku CLI is installed');
  } else {
    printInfo('Heroku CLI is not installed. It\'s recommended for deployment but not required.');
  }
  
  if (!allRequirementsMet) {
    printError('Please install the missing requirements and try again.');
    return false;
  }
  
  return true;
}

/**
 * Collect configuration from user
 * @returns {Promise<void>}
 */
async function collectConfiguration() {
  printHeader('Collecting Configuration');
  
  printInfo('Please provide the following credentials and configuration:');
  
  // Spotify API credentials
  console.log('\n' + colors.cyan + 'Spotify API Credentials' + colors.reset);
  userConfig.spotify.clientId = await askQuestion('Spotify Client ID');
  userConfig.spotify.clientSecret = await askQuestion('Spotify Client Secret');
  
  // MongoDB connection
  console.log('\n' + colors.cyan + 'MongoDB Connection' + colors.reset);
  userConfig.mongodb.uri = await askQuestion('MongoDB URI (e.g., mongodb+srv://...)');
  
  // NextAuth secret
  console.log('\n' + colors.cyan + 'Authentication' + colors.reset);
  const generateSecret = await askQuestion('Generate a random NextAuth secret? (y/n)', true, 'y');
  
  if (generateSecret.toLowerCase() === 'y') {
    userConfig.auth.secret = crypto.randomBytes(32).toString('hex');
    printSuccess(`Generated NextAuth secret: ${userConfig.auth.secret.substring(0, 8)}...`);
  } else {
    userConfig.auth.secret = await askQuestion('NextAuth Secret');
  }
  
  // Heroku deployment (optional)
  console.log('\n' + colors.cyan + 'Heroku Deployment (Optional)' + colors.reset);
  const deployToHeroku = await askQuestion('Deploy to Heroku? (y/n)', true, 'n');
  
  if (deployToHeroku.toLowerCase() === 'y') {
    userConfig.heroku.appName = await askQuestion('Heroku App Name (will be created if it doesn\'t exist)');
    const useHerokuLogin = await askQuestion('Use Heroku CLI login? (y/n)', true, 'y');
    
    if (useHerokuLogin.toLowerCase() !== 'y') {
      userConfig.heroku.apiKey = await askQuestion('Heroku API Key');
    }
  }
}

/**
 * Create .env file with user configuration
 * @returns {Promise<void>}
 */
async function createEnvFile() {
  printHeader('Creating Environment Configuration');
  
  const envContent = `# Sonar EDM Platform - Environment Variables
# Generated by one-click deployment script

# Application settings
APP_NAME=Sonar EDM Platform
NODE_ENV=development
PORT=3000

# Spotify API credentials
SPOTIFY_CLIENT_ID=${userConfig.spotify.clientId}
SPOTIFY_CLIENT_SECRET=${userConfig.spotify.clientSecret}
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify

# MongoDB connection
MONGODB_URI=${userConfig.mongodb.uri}
MONGODB_DB_NAME=sonar-edm

# NextAuth configuration
NEXTAUTH_SECRET=${userConfig.auth.secret}
NEXTAUTH_URL=http://localhost:3000

# Feature flags (set to 'false' to disable)
FEATURE_PROMOTER_ANALYTICS=true
FEATURE_USER_MUSIC_TASTE=true
FEATURE_ARTIST_PREDICTION=true
FEATURE_EVENT_FORECASTING=true
FEATURE_TICKET_PRICING=true
FEATURE_GENRE_TRENDS=true
FEATURE_CITY_AUDIENCE=true
FEATURE_SIMILAR_ARTISTS=true
FEATURE_EVENT_MATCHING=true
FEATURE_TRENDING_ARTISTS=true
FEATURE_LOCATION_RECOMMENDATIONS=true`;

  try {
    fs.writeFileSync('.env', envContent);
    printSuccess('Created .env file with your configuration');
  } catch (error) {
    printError(`Failed to create .env file: ${error.message}`);
    throw error;
  }
}

/**
 * Install dependencies
 * @returns {Promise<void>}
 */
async function installDependencies() {
  printHeader('Installing Dependencies');
  
  try {
    printInfo('Installing npm packages (this may take a few minutes)...');
    execSync('npm install', { stdio: 'inherit' });
    printSuccess('Dependencies installed successfully');
  } catch (error) {
    printError(`Failed to install dependencies: ${error.message}`);
    throw error;
  }
}

/**
 * Deploy to Heroku
 * @returns {Promise<void>}
 */
async function deployToHeroku() {
  if (!userConfig.heroku.appName) {
    return;
  }
  
  printHeader('Deploying to Heroku');
  
  try {
    // Check if git is initialized
    if (!fs.existsSync('.git')) {
      printInfo('Initializing git repository...');
      execSync('git init', { stdio: 'inherit' });
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Initial commit"', { stdio: 'inherit' });
    }
    
    // Create Heroku app if it doesn't exist
    printInfo(`Creating Heroku app: ${userConfig.heroku.appName}...`);
    try {
      execSync(`heroku apps:info ${userConfig.heroku.appName}`, { stdio: 'ignore' });
      printInfo(`Heroku app ${userConfig.heroku.appName} already exists`);
    } catch (error) {
      execSync(`heroku create ${userConfig.heroku.appName}`, { stdio: 'inherit' });
      printSuccess(`Created Heroku app: ${userConfig.heroku.appName}`);
    }
    
    // Set environment variables
    printInfo('Setting environment variables on Heroku...');
    execSync(`heroku config:set SPOTIFY_CLIENT_ID=${userConfig.spotify.clientId} --app ${userConfig.heroku.appName}`, { stdio: 'inherit' });
    execSync(`heroku config:set SPOTIFY_CLIENT_SECRET=${userConfig.spotify.clientSecret} --app ${userConfig.heroku.appName}`, { stdio: 'inherit' });
    execSync(`heroku config:set MONGODB_URI=${userConfig.mongodb.uri} --app ${userConfig.heroku.appName}`, { stdio: 'inherit' });
    execSync(`heroku config:set NEXTAUTH_SECRET=${userConfig.auth.secret} --app ${userConfig.heroku.appName}`, { stdio: 'inherit' });
    execSync(`heroku config:set NEXTAUTH_URL=https://${userConfig.heroku.appName}.herokuapp.com --app ${userConfig.heroku.appName}`, { stdio: 'inherit' });
    execSync(`heroku config:set NODE_ENV=production --app ${userConfig.heroku.appName}`, { stdio: 'inherit' });
    
    // Deploy to Heroku
    printInfo('Deploying to Heroku (this may take a few minutes)...');
    execSync(`git push heroku master --force`, { stdio: 'inherit' });
    
    printSuccess(`Deployed to Heroku: https://${userConfig.heroku.appName}.herokuapp.com`);
  } catch (error) {
    printError(`Failed to deploy to Heroku: ${error.message}`);
    printInfo('You can try deploying manually using the Heroku CLI or Heroku Dashboard.');
  }
}

/**
 * Main function to run the deployment script
 */
async function main() {
  try {
    printHeader('Sonar EDM Platform - One-Click Deployment');
    
    // Check requirements
    const requirementsMet = await checkRequirements();
    if (!requirementsMet) {
      process.exit(1);
    }
    
    // Collect configuration
    await collectConfiguration();
    
    // Create .env file
    await createEnvFile();
    
    // Install dependencies
    await installDependencies();
    
    // Deploy to Heroku if requested
    if (userConfig.heroku.appName) {
      await deployToHeroku();
    }
    
    printHeader('Deployment Complete');
    printSuccess('Sonar EDM Platform has been successfully set up!');
    
    if (userConfig.heroku.appName) {
      printInfo(`Your application is deployed at: https://${userConfig.heroku.appName}.herokuapp.com`);
    } else {
      printInfo('To start the development server, run: npm run dev');
      printInfo('To build for production, run: npm run build');
      printInfo('To start the production server, run: npm start');
    }
    
    printInfo('Thank you for using Sonar EDM Platform!');
  } catch (error) {
    printError(`Deployment failed: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
main();
