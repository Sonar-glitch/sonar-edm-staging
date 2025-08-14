#!/usr/bin/env node
/**
 * FIX 2: Comprehensive Event Enhancement
 * Full reprocessing using the enhanced recommendationEnhancer
 */

const { MongoClient } = require('mongodb');
const path = require('path');

// Set environment variables
process.env.MONGODB_URI = 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM';

// Load the enhanced recommendationEnhancer
const enhancerPath = path.join(__dirname, '../../heroku-workers/event-population/lib/recommendationEnhancer.js');
let RecommendationEnhancer;

try {
  RecommendationEnhancer = require(enhancerPath);
} catch (error) {
  console.error('❌ Could not load RecommendationEnhancer:', error.message);
  process.exit(1);
}

/**
 * Extract and validate artist names using clean artistGenres collection
 * This leverages the clean artistGenres collection to get accurate artist names and genres
 */
async function extractAndValidateArtists(eventTitle, eventsCollection) {
  const db = eventsCollection.db;
  const artistGenresCollection = db.collection('artistGenres');
  
  // Strategy 1: Extract potential artist names from event title
  const potentialArtists = [];
  
  // Remove common tour/venue suffixes first
  let cleanTitle = eventTitle
    .replace(/ - .*(tour|live|concert|show|presents|at |@).*/i, '')
    .replace(/ (tour|live|concert|show|presents|2024|2025).*/i, '')
    .replace(/ with .*/i, '')
    .trim();
  
  // Split by common separators
  const separators = [' with ', ' & ', ' and ', ' + ', ' feat. ', ' ft. ', ' vs. ', ' x '];
  
  for (const separator of separators) {
    if (cleanTitle.toLowerCase().includes(separator.toLowerCase())) {
      const parts = cleanTitle.split(new RegExp(separator, 'i'));
      parts.forEach(part => {
        const cleanPart = part.trim();
        if (cleanPart && cleanPart.length > 0 && cleanPart.length < 100) {
          potentialArtists.push(cleanPart);
        }
      });
      break;
    }
  }
  
  // If no separators found, use the main title
  if (potentialArtists.length === 0) {
    potentialArtists.push(cleanTitle);
  }
  
  // Strategy 2: Validate against artistGenres collection with fuzzy matching
  const validatedArtists = [];
  
  for (const artistName of potentialArtists) {
    if (!artistName || artistName.length === 0) continue;
    
    // Clean the artist name for better matching
    const cleanArtistName = cleanArtistForMatching(artistName);
    
    // Try exact match first (highest confidence)
    const exactMatch = await artistGenresCollection.findOne({
      $or: [
        { artistName: { $regex: new RegExp(`^${escapeRegex(cleanArtistName)}$`, 'i') } },
        { originalName: { $regex: new RegExp(`^${escapeRegex(cleanArtistName)}$`, 'i') } }
      ]
    });
    
    if (exactMatch) {
      validatedArtists.push({
        name: exactMatch.originalName,
        verified: true,
        confidence: 1.0,
        genres: exactMatch.genres || [],
        source: 'artistGenres_exact'
      });
      continue;
    }
    
    // Try fuzzy matching with confidence scoring
    const fuzzyMatches = await findFuzzyArtistMatches(cleanArtistName, artistGenresCollection);
    
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0]; // Highest confidence first
      
      if (bestMatch.confidence >= 0.8) { // High confidence threshold
        validatedArtists.push({
          name: bestMatch.originalName,
          verified: true,
          confidence: bestMatch.confidence,
          genres: bestMatch.genres || [],
          source: `artistGenres_fuzzy_${bestMatch.confidence.toFixed(2)}`
        });
        continue;
      }
    }
    
    // No good match found, keep the extracted name but mark as unverified
    validatedArtists.push({
      name: artistName,
      verified: false,
      confidence: 0.0,
      genres: [],
      source: 'title_extraction'
    });
  }
  
  // Return just the artist names for now, but log the validation info
  const artistNames = validatedArtists.map(artist => artist.name);
  const verifiedCount = validatedArtists.filter(artist => artist.verified).length;
  
  if (verifiedCount > 0) {
    console.log(`   🎯 Verified ${verifiedCount}/${validatedArtists.length} artists in artistGenres collection`);
    validatedArtists.filter(artist => artist.verified).forEach(artist => {
      console.log(`      ✅ ${artist.name}: ${artist.genres.slice(0, 2).join(', ')}`);
    });
  }
  
  return artistNames;
}

/**
 * Clean artist name for better matching - removes common issues
 */
function cleanArtistForMatching(artistName) {
  return artistName
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Escape regex special characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find fuzzy matches for artist names with confidence scoring
 */
async function findFuzzyArtistMatches(cleanArtistName, artistGenresCollection) {
  // Get all artists and compute similarity scores
  const allArtists = await artistGenresCollection.find({}).toArray();
  const matches = [];
  
  for (const artist of allArtists) {
    // Test multiple name variations
    const namesToTest = [
      artist.artistName,
      artist.originalName
    ].filter(Boolean);
    
    for (const nameToTest of namesToTest) {
      const cleanDbName = cleanArtistForMatching(nameToTest);
      const confidence = calculateSimilarity(cleanArtistName, cleanDbName);
      
      if (confidence > 0.6) { // Minimum similarity threshold
        matches.push({
          ...artist,
          confidence,
          matchedField: nameToTest === artist.artistName ? 'artistName' : 'originalName'
        });
      }
    }
  }
  
  // Sort by confidence (highest first) and remove duplicates
  const uniqueMatches = matches
    .sort((a, b) => b.confidence - a.confidence)
    .filter((match, index, arr) => 
      index === 0 || arr[index - 1]._id.toString() !== match._id.toString()
    );
  
  return uniqueMatches.slice(0, 3); // Top 3 matches
}

/**
 * Calculate similarity between two strings (0-1 scale)
 * Uses Levenshtein distance with normalization
 */
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  // Handle exact substring matches
  if (str1.includes(str2) || str2.includes(str1)) {
    const shorter = str1.length < str2.length ? str1 : str2;
    const longer = str1.length >= str2.length ? str1 : str2;
    return shorter.length / longer.length;
  }
  
  // Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  const distance = matrix[str2.length][str1.length];
  return 1 - (distance / maxLength);
}

async function comprehensiveEventEnhancement() {
  console.log('🔄 STARTING COMPREHENSIVE EVENT ENHANCEMENT');
  console.log('==========================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('test'); // ✅ CORRECT: Using 'test' database as per project docs
  const collection = db.collection('events_unified');
  
  // Initialize enhancer
  const enhancer = new RecommendationEnhancer();
  
  // Check current enhancement status
  const total = await collection.countDocuments();
  const enhanced = await collection.countDocuments({ 
    'enhancement.status': 'completed'
  });
  const withGenres = await collection.countDocuments({ 
    genre: { $exists: true, $ne: null, $ne: 'unknown' }
  });
  const withArtists = await collection.countDocuments({ 
    artists: { $exists: true, $ne: [] }
  });
  const withSound = await collection.countDocuments({ 
    'soundCharacteristics.energy': { $exists: true }
  });
  
  console.log(`\n📊 CURRENT ENHANCEMENT STATUS:`);
  console.log(`   Total events: ${total.toLocaleString()}`);
  console.log(`   Enhanced: ${enhanced.toLocaleString()} (${((enhanced/total)*100).toFixed(1)}%)`);
  console.log(`   With genres: ${withGenres.toLocaleString()} (${((withGenres/total)*100).toFixed(1)}%)`);
  console.log(`   With artists: ${withArtists.toLocaleString()} (${((withArtists/total)*100).toFixed(1)}%)`);
  console.log(`   With sound: ${withSound.toLocaleString()} (${((withSound/total)*100).toFixed(1)}%)`);
  
  // Get events that need enhancement
  const eventsToEnhance = await collection.find({
    $or: [
      { 'enhancement.status': { $ne: 'completed' } },
      { genre: { $exists: false } },
      { genre: 'unknown' },
      { artists: { $exists: false } },
      { artists: [] },
      { 'soundCharacteristics.energy': { $exists: false } }
    ]
  }).limit(10).toArray(); // Process 10 events for testing
  
  console.log(`\n🎯 EVENTS TO ENHANCE: ${eventsToEnhance.length}`);
  
  let processed = 0;
  let enhanced_count = 0;
  let errors = 0;
  
  for (const event of eventsToEnhance) {
    try {
      console.log(`\n[${processed + 1}/${eventsToEnhance.length}] Processing: ${event.name}`);
      
      // Create a copy of the event for enhancement
      const eventToEnhance = { ...event };
      
      // ENHANCED FIX: Extract and validate artist names using clean artistGenres collection
      if (eventToEnhance.artists && eventToEnhance.artists.length > 0) {
        const firstArtist = eventToEnhance.artists[0];
        if (typeof firstArtist === 'object' && firstArtist.constructor === Object) {
          console.log(`🔧 Fixing corrupted artist data for: ${event.name}`);
          
          // Extract artist names from event title
          const extractedArtists = await extractAndValidateArtists(event.name, collection);
          
          if (extractedArtists.length > 0) {
            eventToEnhance.artists = extractedArtists;
            console.log(`   ✅ Validated artists: ${extractedArtists.join(', ')}`);
          } else {
            // Fallback to simple extraction
            const artistName = event.name.split(' - ')[0] || event.name.split(':')[0] || event.name;
            eventToEnhance.artists = [artistName.trim()];
            console.log(`   ⚠️ Fallback artist: ${eventToEnhance.artists[0]}`);
          }
        }
      }
      
      // Run the full enhancement
      const enhancedEvent = await enhancer.enhanceEventWithArtistData(eventToEnhance);
      
      // Update the database
      const updateData = {
        'enhancement.status': 'completed',
        'enhancement.lastUpdated': new Date(),
        'enhancement.version': '2.0'
      };
      
      // Add detected data
      if (enhancedEvent.genre && enhancedEvent.genre !== 'unknown') {
        updateData.genre = enhancedEvent.genre;
        updateData.genres = enhancedEvent.genres || [enhancedEvent.genre];
        updateData.primaryGenre = enhancedEvent.genre;
      }
      
      if (enhancedEvent.artists && enhancedEvent.artists.length > 0) {
        updateData.artists = enhancedEvent.artists;
        updateData.artistIds = enhancedEvent.artistIds || [];
      }
      
      if (enhancedEvent.soundCharacteristics) {
        updateData.soundCharacteristics = enhancedEvent.soundCharacteristics;
      }
      
      if (enhancedEvent.ticketmasterGenres) {
        updateData.ticketmasterGenres = enhancedEvent.ticketmasterGenres;
      }
      
      await collection.updateOne(
        { _id: event._id },
        { $set: updateData }
      );
      
      enhanced_count++;
      
      // Log progress
      if (enhancedEvent.genre && enhancedEvent.genre !== 'unknown') {
        console.log(`   ✅ Genre: ${enhancedEvent.genre}`);
      }
      if (enhancedEvent.artists && enhancedEvent.artists.length > 0) {
        // Handle both string arrays and enhanced artist objects
        const artistNames = enhancedEvent.artists.map(artist => 
          typeof artist === 'string' ? artist : artist.name || artist
        );
        console.log(`   🎤 Artists: ${artistNames.slice(0, 3).join(', ')}${artistNames.length > 3 ? '...' : ''}`);
      }
      if (enhancedEvent.soundCharacteristics && enhancedEvent.soundCharacteristics.energy !== undefined) {
        console.log(`   🔊 Sound: Energy=${enhancedEvent.soundCharacteristics.energy}, Danceability=${enhancedEvent.soundCharacteristics.danceability}`);
      }
      
    } catch (error) {
      console.error(`❌ Error enhancing event ${event._id}:`, error.message);
      errors++;
    }
    
    processed++;
    
    if (processed % 25 === 0) {
      console.log(`\n📈 PROGRESS UPDATE:`);
      console.log(`   Processed: ${processed}/${eventsToEnhance.length}`);
      console.log(`   Enhanced: ${enhanced_count}`);
      console.log(`   Errors: ${errors}`);
      console.log(`   Success rate: ${((enhanced_count/processed)*100).toFixed(1)}%`);
    }
  }
  
  console.log(`\n✅ COMPREHENSIVE ENHANCEMENT COMPLETE:`);
  console.log(`   Events processed: ${processed}`);
  console.log(`   Events enhanced: ${enhanced_count}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Success rate: ${((enhanced_count/processed)*100).toFixed(1)}%`);
  
  // Check final status
  const finalEnhanced = await collection.countDocuments({ 
    'enhancement.status': 'completed'
  });
  const finalWithGenres = await collection.countDocuments({ 
    genre: { $exists: true, $ne: null, $ne: 'unknown' }
  });
  const finalWithArtists = await collection.countDocuments({ 
    artists: { $exists: true, $ne: [] }
  });
  const finalWithSound = await collection.countDocuments({ 
    'soundCharacteristics.energy': { $exists: true }
  });
  
  console.log(`\n📈 FINAL IMPROVEMENT:`);
  console.log(`   Enhanced: ${enhanced} → ${finalEnhanced} (+${finalEnhanced - enhanced})`);
  console.log(`   Genres: ${withGenres} → ${finalWithGenres} (+${finalWithGenres - withGenres})`);
  console.log(`   Artists: ${withArtists} → ${finalWithArtists} (+${finalWithArtists - withArtists})`);
  console.log(`   Sound: ${withSound} → ${finalWithSound} (+${finalWithSound - withSound})`);
  
  await client.close();
}

// Run the enhancement
if (require.main === module) {
  comprehensiveEventEnhancement().catch(console.error);
}

module.exports = { comprehensiveEventEnhancement };
