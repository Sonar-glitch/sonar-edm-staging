#!/usr/bin/env node
/**
 * CLEANUP SCRIPT: Remove all the scattered test scripts
 * This will clean up the mess of one-off scripts we've accumulated
 */

const fs = require('fs');
const path = require('path');

const scriptsToRemove = [
  'check_mongo.js',
  'check_production_db.js', 
  'check_all_collections.js',
  'check_db_config.js',
  'casa_loma_check.js',
  'match_score_analysis.js',
  'validate_react_fix.js',
  'test_enhancement_flow.js',
  'test_frontend_fix.js', // This one too - functionality moved to tiko-manager
  'verify_enhancement_pipeline.js',
  'db_connection_test.js',
  'heroku_db_check.js'
];

console.log('🧹 CLEANING UP SCATTERED SCRIPTS');
console.log('=================================');

const currentDir = process.cwd();
let removedCount = 0;

scriptsToRemove.forEach(scriptName => {
  const scriptPath = path.join(currentDir, scriptName);
  
  if (fs.existsSync(scriptPath)) {
    try {
      fs.unlinkSync(scriptPath);
      console.log(`✅ Removed: ${scriptName}`);
      removedCount++;
    } catch (err) {
      console.log(`❌ Failed to remove ${scriptName}: ${err.message}`);
    }
  } else {
    console.log(`⚪ Not found: ${scriptName}`);
  }
});

console.log(`\n📊 CLEANUP SUMMARY:`);
console.log(`   Scripts removed: ${removedCount}`);
console.log(`   Scripts not found: ${scriptsToRemove.length - removedCount}`);

console.log(`\n✨ MIGRATION TO TIKO-MANAGER:`);
console.log('   All functionality consolidated into tiko-manager.js');
console.log('   Use: node tiko-manager.js [command]');
console.log('   Commands: overview | performance | casa-loma | cleanup | help');

console.log(`\n🎯 RECOMMENDED USAGE:`);
console.log('   Production check: heroku run "node tiko-manager.js overview" --app sonar-edm-staging');
console.log('   Casa Loma check: heroku run "node tiko-manager.js casa-loma" --app sonar-edm-staging');
console.log('   Performance: heroku run "node tiko-manager.js performance" --app sonar-edm-staging');
