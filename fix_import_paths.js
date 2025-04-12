/**
 * Automated fix script for Sonar EDM Platform import path issues
 * 
 * This script automatically fixes the incorrect import paths in the Backend API
 * by changing "../../lib/" to "../lib/" and "../../config" to "../config"
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Define the directory containing the pages
const pagesDir = path.join(__dirname, 'sonar-edm-platform', 'pages');

// Define the patterns to search for and their replacements
const replacements = [
  { from: /from\s+['"]\.\.\/\.\.\/(lib\/[^'"]+)['"]/g, to: 'from "../$1"' },
  { from: /import\s+['"]\.\.\/\.\.\/(lib\/[^'"]+)['"]/g, to: 'import "../$1"' },
  { from: /from\s+['"]\.\.\/\.\.\/config['"]/g, to: 'from "../config"' },
  { from: /import\s+['"]\.\.\/\.\.\/config['"]/g, to: 'import "../config"' },
  { from: /require\(['"]\.\.\/\.\.\/(lib\/[^'"]+)['"]\)/g, to: 'require("../$1")' },
  { from: /require\(['"]\.\.\/\.\.\/config['"]\)/g, to: 'require("../config")' }
];

// Function to recursively find all JavaScript files
async function findJsFiles(dir) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  const jsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const subDirFiles = await findJsFiles(fullPath);
      jsFiles.push(...subDirFiles);
    } else if (file.name.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }

  return jsFiles;
}

// Function to fix import paths in a file
async function fixImportPaths(filePath) {
  try {
    // Read the file content
    const content = await readFile(filePath, 'utf8');
    
    // Check if the file contains any of the patterns
    let hasPatterns = false;
    let newContent = content;
    
    for (const { from, to } of replacements) {
      if (from.test(content)) {
        hasPatterns = true;
        newContent = newContent.replace(from, to);
      }
    }
    
    // If the file contains patterns, write the fixed content
    if (hasPatterns) {
      await writeFile(filePath, newContent, 'utf8');
      console.log(`✅ Fixed import paths in: ${path.relative(__dirname, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing import paths in ${filePath}:`, error.message);
    return false;
  }
}

// Main function to fix all import paths
async function main() {
  try {
    console.log('🔍 Searching for JavaScript files in pages directory...');
    const jsFiles = await findJsFiles(pagesDir);
    console.log(`Found ${jsFiles.length} JavaScript files.`);
    
    console.log('🔧 Fixing import paths...');
    let fixedCount = 0;
    
    for (const filePath of jsFiles) {
      const fixed = await fixImportPaths(filePath);
      if (fixed) fixedCount++;
    }
    
    console.log(`\n✨ Import path fix completed!`);
    console.log(`📊 Summary: Fixed ${fixedCount} files out of ${jsFiles.length} total files.`);
    
    if (fixedCount > 0) {
      console.log(`\n📝 Next steps:`);
      console.log(`1. Commit the changes: git add . && git commit -m "Fix import paths in API files"`);
      console.log(`2. Push to your repository: git push origin main`);
      console.log(`3. Deploy to Heroku: git push heroku main:main --force`);
    } else {
      console.log(`\n⚠️ No files needed fixing. This could mean:`);
      console.log(`- The import paths are already correct`);
      console.log(`- The patterns in the script don't match the actual import statements`);
      console.log(`- The files with incorrect imports are in a different location`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
