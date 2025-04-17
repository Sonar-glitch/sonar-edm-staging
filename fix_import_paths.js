#!/usr/bin/env node

/**
 * This script automatically fixes import paths in the Sonar EDM Platform project
 * It specifically targets the pages/users/ and pages/auth/ directories
 * to ensure imports correctly reference the root directories
 */

const fs = require('fs');
const path = require('path');

// Define the files we need to fix
const filesToFix = [
  'pages/users/music-taste.js',
  'pages/auth/signin.js'
];

// Function to fix import paths in a file
function fixImportPaths(filePath) {
  console.log(`Fixing import paths in ${filePath}...`);
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix import paths for components and styles
    if (filePath.includes('pages/users/')) {
      // Fix component imports
      content = content.replace(/from ['"]\.\.\/components\//g, 'from \'../../components/');
      
      // Fix style imports
      content = content.replace(/from ['"]\.\.\/styles\//g, 'from \'../../styles/');
    }
    
    // Fix Signin.module.css import in signin.js
    if (filePath.includes('pages/auth/signin.js')) {
      // Check if we need to fix capitalization
      if (fs.existsSync('styles/signin.module.css')) {
        content = content.replace(/['"]\.\.\/\.\.\/styles\/Signin\.module\.css['"]/g, '\'../../styles/signin.module.css\'');
      } else {
        content = content.replace(/['"]\.\.\/\.\.\/styles\/[^'"]+['"]/g, '\'../../styles/Signin.module.css\'');
      }
    }
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main function to run the script
function main() {
  console.log('🔧 Starting import path fixer for Sonar EDM Platform...');
  
  let successCount = 0;
  let failCount = 0;
  
  // Process each file
  filesToFix.forEach(file => {
    if (fixImportPaths(file)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully fixed ${successCount} files`);
  console.log(`❌ Failed to fix ${failCount} files`);
  
  if (failCount === 0) {
    console.log('\n🎉 All import paths have been fixed!');
    console.log('Next steps:');
    console.log('1. Commit the changes: git add . && git commit -m "Fix import paths"');
    console.log('2. Push to Heroku: git push heroku main');
  } else {
    console.log('\n⚠️ Some files could not be fixed. Please check the errors above.');
  }
}

// Run the script
main();
