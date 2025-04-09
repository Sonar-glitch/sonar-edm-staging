/**
 * One-Click Deployment Script for Sonar EDM Platform
 * 
 * This script automates the deployment process to Heroku with AWS and MongoDB integration.
 * It validates the configuration, prepares the application, and handles the deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('../config');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Main deployment function
 */
async function deploy() {
  console.log('\n🚀 Starting Sonar EDM Platform Deployment\n');
  
  try {
    // Step 1: Validate configuration
    console.log('Step 1/5: Validating configuration...');
    const configValidation = validateConfig();
    
    if (!configValidation.isValid) {
      console.error('\n❌ Configuration validation failed!');
      console.error('Missing configurations:');
      configValidation.missingConfigs.forEach(config => {
        console.error(`  - ${config}`);
      });
      
      const shouldContinue = await promptYesNo('Would you like to set up these configurations now?');
      
      if (shouldContinue) {
        await setupMissingConfigs(configValidation.missingConfigs);
      } else {
        console.log('\n⚠️ Deployment aborted. Please configure the missing settings and try again.');
        process.exit(1);
      }
    } else {
      console.log('✅ Configuration validated successfully!');
    }
    
    // Step 2: Check Heroku CLI installation
    console.log('\nStep 2/5: Checking Heroku CLI installation...');
    const herokuInstalled = checkHerokuCLI();
    
    if (!herokuInstalled) {
      console.error('❌ Heroku CLI not found!');
      console.log('Please install Heroku CLI by following the instructions at:');
      console.log('https://devcenter.heroku.com/articles/heroku-cli');
      
      const shouldContinue = await promptYesNo('Would you like to continue anyway?');
      if (!shouldContinue) {
        console.log('\n⚠️ Deployment aborted. Please install Heroku CLI and try again.');
        process.exit(1);
      }
    } else {
      console.log('✅ Heroku CLI is installed!');
    }
    
    // Step 3: Check Heroku login status
    console.log('\nStep 3/5: Checking Heroku login status...');
    const loggedIn = checkHerokuLogin();
    
    if (!loggedIn) {
      console.log('⚠️ Not logged in to Heroku.');
      console.log('Please run the following command to log in:');
      console.log('heroku login');
      
      const shouldContinue = await promptYesNo('Would you like to continue after logging in?');
      if (!shouldContinue) {
        console.log('\n⚠️ Deployment aborted. Please log in to Heroku and try again.');
        process.exit(1);
      }
    } else {
      console.log('✅ Logged in to Heroku!');
    }
    
    // Step 4: Prepare application for deployment
    console.log('\nStep 4/5: Preparing application for deployment...');
    prepareForDeployment();
    console.log('✅ Application prepared for deployment!');
    
    // Step 5: Deploy to Heroku
    console.log('\nStep 5/5: Deploying to Heroku...');
    const appName = await promptInput('Enter your Heroku app name (leave blank to use sonar-edm-platform):');
    const finalAppName = appName || 'sonar-edm-platform';
    
    deployToHeroku(finalAppName);
    console.log(`✅ Deployment to ${finalAppName} completed successfully!`);
    
    // Deployment completed
    console.log('\n🎉 Sonar EDM Platform has been successfully deployed!');
    console.log(`You can access your application at: https://${finalAppName}.herokuapp.com`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed!');
    console.error(error.message);
    console.error('Please check the error message and try again.');
  } finally {
    rl.close();
  }
}

/**
 * Validate configuration
 * @returns {Object} Validation result
 */
function validateConfig() {
  return config.validateConfig();
}

/**
 * Set up missing configurations
 * @param {Array} missingConfigs - List of missing configurations
 */
async function setupMissingConfigs(missingConfigs) {
  console.log('\n📝 Setting up missing configurations...');
  
  const envVars = [];
  
  for (const configName of missingConfigs) {
    if (configName === 'Spotify API credentials') {
      const clientId = await promptInput('Enter Spotify Client ID:');
      const clientSecret = await promptInput('Enter Spotify Client Secret:');
      
      envVars.push(`SPOTIFY_CLIENT_ID=${clientId}`);
      envVars.push(`SPOTIFY_CLIENT_SECRET=${clientSecret}`);
    }
    
    if (configName === 'MongoDB connection string') {
      const mongoUri = await promptInput('Enter MongoDB URI:');
      const dbName = await promptInput('Enter MongoDB database name (default: sonar-edm):');
      
      envVars.push(`MONGODB_URI=${mongoUri}`);
      if (dbName) {
        envVars.push(`MONGODB_DB_NAME=${dbName}`);
      }
    }
    
    if (configName === 'NextAuth secret') {
      const secret = await promptInput('Enter NextAuth secret (or press Enter to generate one):');
      const generatedSecret = secret || generateRandomString(32);
      
      envVars.push(`NEXTAUTH_SECRET=${generatedSecret}`);
    }
  }
  
  // Create .env file
  const envContent = envVars.join('\n');
  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
  
  console.log('✅ Configuration set up successfully!');
}

/**
 * Check if Heroku CLI is installed
 * @returns {boolean} Whether Heroku CLI is installed
 */
function checkHerokuCLI() {
  try {
    execSync('heroku --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if logged in to Heroku
 * @returns {boolean} Whether logged in to Heroku
 */
function checkHerokuLogin() {
  try {
    execSync('heroku auth:whoami', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Prepare application for deployment
 */
function prepareForDeployment() {
  // Ensure Procfile exists
  const procfilePath = path.join(process.cwd(), 'Procfile');
  if (!fs.existsSync(procfilePath)) {
    fs.writeFileSync(procfilePath, 'web: npm start');
    console.log('Created Procfile');
  }
  
  // Ensure engines field in package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);
  
  if (!packageJson.engines) {
    packageJson.engines = {
      node: '16.x',
      npm: '8.x'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json with engines field');
  }
}

/**
 * Deploy to Heroku
 * @param {string} appName - Heroku app name
 */
function deployToHeroku(appName) {
  try {
    // Check if app exists
    try {
      execSync(`heroku apps:info -a ${appName}`, { stdio: 'ignore' });
      console.log(`Using existing Heroku app: ${appName}`);
    } catch (error) {
      console.log(`Creating new Heroku app: ${appName}`);
      execSync(`heroku create ${appName}`);
    }
    
    // Set environment variables
    console.log('Setting environment variables...');
    const envVars = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8')
      .split('\n')
      .filter(line => line.trim() !== '');
    
    for (const envVar of envVars) {
      const [key, value] = envVar.split('=');
      execSync(`heroku config:set ${key}=${value} -a ${appName}`);
    }
    
    // Add MongoDB addon if not already added
    try {
      execSync(`heroku addons:info mongodb -a ${appName}`, { stdio: 'ignore' });
      console.log('MongoDB addon already exists');
    } catch (error) {
      console.log('Adding MongoDB addon...');
      execSync(`heroku addons:create mongodb -a ${appName}`);
    }
    
    // Deploy to Heroku
    console.log('Pushing code to Heroku...');
    execSync('git push heroku main');
    
  } catch (error) {
    throw new Error(`Heroku deployment failed: ${error.message}`);
  }
}

/**
 * Prompt for yes/no input
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} User response
 */
function promptYesNo(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Prompt for text input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} User response
 */
function promptInput(question) {
  return new Promise((resolve) => {
    rl.question(`${question} `, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Generate random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

// Run deployment if script is executed directly
if (require.main === module) {
  deploy();
}

module.exports = { deploy };
