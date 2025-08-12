// Check what's actually deployed vs theoretical
console.log('🔍 DEPLOYMENT REALITY CHECK\n');

const fs = require('fs');
const path = require('path');

console.log('=== 1. FILE SYSTEM CHECK ===');

// Check if our enhancement files exist
const filesToCheck = [
  'lib/musicApiService.js',
  'lib/essentiaIntegration.js', 
  'lib/essentiaUserProfilingService.js',
  'pages/api/events/enhanced.js',
  'phase1_event_enhancer.js',
  'recommendationEnhancer.js',
  'components/EnhancedEventList.js',
  'components/EnhancedPersonalizedDashboard.js'
];

filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(exists ? '✅' : '❌', file, exists ? 'EXISTS' : 'MISSING');
  
  if (exists) {
    const stats = fs.statSync(file);
    console.log(`   Size: ${stats.size} bytes, Modified: ${stats.mtime.toISOString()}`);
  }
});

console.log('\n=== 2. API ENDPOINT CHECK ===');

// Check if enhanced events API exists and what it contains
if (fs.existsSync('pages/api/events/enhanced.js')) {
  const enhancedApi = fs.readFileSync('pages/api/events/enhanced.js', 'utf8');
  
  // Check for key integrations
  const integrations = [
    { name: 'Music API Service', pattern: /musicApiService|spotify|apple.*music/i },
    { name: 'Essentia Integration', pattern: /essentia/i },
    { name: 'Audio Analysis', pattern: /audioFeatures|audio.*analysis/i },
    { name: 'Recommendation Enhancer', pattern: /recommendationEnhancer/i },
    { name: 'Enhancement Stats', pattern: /enhancementStats/i }
  ];
  
  integrations.forEach(integration => {
    const found = integration.pattern.test(enhancedApi);
    console.log(found ? '✅' : '❌', `Enhanced API has ${integration.name}:`, found);
  });
  
  console.log(`Enhanced API file size: ${enhancedApi.length} characters`);
}

console.log('\n=== 3. MUSIC API INTEGRATION CHECK ===');

if (fs.existsSync('lib/musicApiService.js')) {
  const musicApi = fs.readFileSync('lib/musicApiService.js', 'utf8');
  
  const apiFeatures = [
    { name: 'Spotify Integration', pattern: /spotify.*api/i },
    { name: 'Apple Music Integration', pattern: /apple.*music/i },
    { name: 'Artist Analysis', pattern: /artist.*analysis|getArtistInfo/i },
    { name: 'Audio Features', pattern: /audioFeatures|getAudioFeatures/i },
    { name: 'Score Enhancement', pattern: /enhance.*score|calculateBoost/i }
  ];
  
  apiFeatures.forEach(feature => {
    const found = feature.pattern.test(musicApi);
    console.log(found ? '✅' : '❌', `Music API has ${feature.name}:`, found);
  });
}

console.log('\n=== 4. ESSENTIA INTEGRATION CHECK ===');

if (fs.existsSync('lib/essentiaIntegration.js')) {
  const essentia = fs.readFileSync('lib/essentiaIntegration.js', 'utf8');
  
  const essentiaFeatures = [
    { name: 'User Profiling', pattern: /user.*profiling|getUserProfile/i },
    { name: 'Audio Analysis', pattern: /audio.*analysis|analyzeAudio/i },
    { name: 'Taste Matching', pattern: /taste.*match|calculateSimilarity/i },
    { name: 'Worker Integration', pattern: /worker|heroku.*app/i }
  ];
  
  essentiaFeatures.forEach(feature => {
    const found = feature.pattern.test(essentia);
    console.log(found ? '✅' : '❌', `Essentia has ${feature.name}:`, found);
  });
}

console.log('\n=== 5. FRONTEND INTEGRATION CHECK ===');

if (fs.existsSync('components/EnhancedPersonalizedDashboard.js')) {
  const dashboard = fs.readFileSync('components/EnhancedPersonalizedDashboard.js', 'utf8');
  
  const frontendFeatures = [
    { name: 'Enhanced Events API Call', pattern: /\/api\/events\/enhanced/i },
    { name: 'Enhancement Stats Display', pattern: /enhancementStats/i },
    { name: 'Integration Status', pattern: /musicApiIntegration|essentiaIntegration/i },
    { name: 'Real Data Detection', pattern: /isReal.*data|real.*data/i }
  ];
  
  frontendFeatures.forEach(feature => {
    const found = feature.pattern.test(dashboard);
    console.log(found ? '✅' : '❌', `Dashboard has ${feature.name}:`, found);
  });
}

console.log('\n=== 6. SCORING SYSTEM CHECK ===');

if (fs.existsSync('recommendationEnhancer.js')) {
  const recommender = fs.readFileSync('recommendationEnhancer.js', 'utf8');
  
  const scoringFeatures = [
    { name: 'Music Detection', pattern: /music.*detection|isMusicEvent/i },
    { name: 'Artist Recognition', pattern: /artist.*recognition|artist.*score/i },
    { name: 'Genre Matching', pattern: /genre.*match|genre.*score/i },
    { name: 'Audio Matching', pattern: /audio.*match|audio.*similarity/i },
    { name: 'Venue Preferences', pattern: /venue.*preference|venue.*score/i }
  ];
  
  scoringFeatures.forEach(feature => {
    const found = feature.pattern.test(recommender);
    console.log(found ? '✅' : '❌', `Scoring has ${feature.name}:`, found);
  });
}

console.log('\n=== 7. DEPLOYMENT STATUS SUMMARY ===');
console.log('Based on file analysis:');

// Count what exists
const deployedComponents = filesToCheck.filter(file => fs.existsSync(file)).length;
const totalComponents = filesToCheck.length;
const deploymentPercentage = (deployedComponents / totalComponents * 100).toFixed(1);

console.log(`📊 Components deployed: ${deployedComponents}/${totalComponents} (${deploymentPercentage}%)`);

if (deploymentPercentage < 100) {
  console.log('⚠️  PARTIAL DEPLOYMENT - Some components missing');
} else {
  console.log('✅ FULL DEPLOYMENT - All components present');
}

console.log('\n=== 8. WHAT NEEDS VERIFICATION ===');
console.log('❓ Database connectivity and data structure');
console.log('❓ API endpoints actually working in production');
console.log('❓ Music API credentials configured');
console.log('❓ Essentia worker URL configured'); 
console.log('❓ Real event data with enhanced fields');
console.log('❓ User profile data for personalization');
