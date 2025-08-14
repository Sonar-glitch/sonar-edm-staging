#!/usr/bin/env node
/**
 * FIX 1: Genre Classification Enhancement
 * Processes existing events to add missing genre data
 */

const { MongoClient } = require('mongodb');

async function fixGenreClassification() {
  console.log('🎯 STARTING GENRE CLASSIFICATION FIX');
  console.log('====================================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('test'); // ✅ CORRECT: Using 'test' database as per project docs
  const collection = db.collection('events_unified');
  
  // Check current state
  const total = await collection.countDocuments();
  const withGenres = await collection.countDocuments({ 
    $or: [
      { genre: { $exists: true, $ne: null, $ne: 'unknown' } },
      { genres: { $exists: true, $ne: [] } },
      { primaryGenre: { $exists: true, $ne: 'unknown' } }
    ]
  });
  
  console.log(`\n📊 CURRENT STATE:`);
  console.log(`   Total events: ${total.toLocaleString()}`);
  console.log(`   With genres: ${withGenres.toLocaleString()} (${((withGenres/total)*100).toFixed(1)}%)`);
  console.log(`   Missing genres: ${(total - withGenres).toLocaleString()}`);
  
  // Simple genre detection based on artist names and event names
  const genreRules = {
    // EDM Artists
    'deadmau5': 'progressive house',
    'calvin harris': 'electro house',
    'tiësto': 'trance',
    'david guetta': 'electro house',
    'martin garrix': 'big room',
    'hardwell': 'big room',
    'armin van buuren': 'trance',
    'above & beyond': 'trance',
    'skrillex': 'dubstep',
    'porter robinson': 'electronic',
    'madeon': 'electronic',
    'flume': 'electronic',
    'disclosure': 'deep house',
    'diplo': 'electronic',
    'major lazer': 'electronic',
    'zedd': 'electro house',
    'kaskade': 'progressive house',
    'steve aoki': 'electro house',
    'afrojack': 'electro house',
    'avicii': 'progressive house',
    'swedish house mafia': 'progressive house',
    'daft punk': 'electronic',
    'justice': 'electronic',
    'bonobo': 'electronic',
    'kiasmos': 'electronic',
    'odesza': 'electronic',
    'rufus du sol': 'electronic',
    'moderat': 'electronic',
    'thom yorke': 'electronic',
    'four tet': 'electronic',
    'caribou': 'electronic',
    
    // Keywords in event names
    'house': 'house',
    'techno': 'techno',
    'trance': 'trance',
    'dubstep': 'dubstep',
    'electronic': 'electronic',
    'edm': 'electronic',
    'drum and bass': 'drum and bass',
    'dnb': 'drum and bass',
    'ambient': 'ambient',
    'minimal': 'minimal techno',
    'progressive': 'progressive house',
    'deep house': 'deep house',
    'tech house': 'tech house',
    'electro': 'electro house',
    'trap': 'trap',
    'future bass': 'future bass',
    'disco': 'disco',
    'funk': 'funk',
    'jazz': 'jazz',
    'hip hop': 'hip hop',
    'rap': 'hip hop',
    'rock': 'rock',
    'metal': 'metal',
    'punk': 'punk',
    'pop': 'pop',
    'indie': 'indie',
    'folk': 'folk',
    'country': 'country',
    'classical': 'classical',
    'orchestra': 'classical',
    'symphony': 'classical',
    'r&b': 'r&b',
    'soul': 'soul',
    'reggae': 'reggae',
    'latin': 'latin',
    'world': 'world'
  };
  
  console.log(`\n🔄 PROCESSING EVENTS:`);
  
  // Process events in batches
  const batchSize = 100;
  let processed = 0;
  let updated = 0;
  
  const eventsToProcess = await collection.find({
    $or: [
      { genre: { $exists: false } },
      { genre: null },
      { genre: 'unknown' },
      { genres: { $exists: false } },
      { primaryGenre: { $exists: false } }
    ]
  }).limit(1000).toArray(); // Process first 1000 for testing
  
  console.log(`   Events to process: ${eventsToProcess.length}`);
  
  for (const event of eventsToProcess) {
    try {
      let detectedGenre = null;
      let detectionMethod = 'unknown';
      
      // Method 1: Check artists
      if (event.artists && event.artists.length > 0) {
        for (const artist of event.artists) {
          const artistLower = artist.toLowerCase().trim();
          if (genreRules[artistLower]) {
            detectedGenre = genreRules[artistLower];
            detectionMethod = 'artist_based';
            break;
          }
        }
      }
      
      // Method 2: Check event name keywords
      if (!detectedGenre && event.name) {
        const nameLower = event.name.toLowerCase();
        for (const [keyword, genre] of Object.entries(genreRules)) {
          if (nameLower.includes(keyword)) {
            detectedGenre = genre;
            detectionMethod = 'name_keyword';
            break;
          }
        }
      }
      
      // Method 3: Use existing genre field if available
      if (!detectedGenre && event.genre && event.genre !== 'unknown') {
        detectedGenre = event.genre.toLowerCase();
        detectionMethod = 'existing_field';
      }
      
      // Update event if we detected a genre
      if (detectedGenre) {
        await collection.updateOne(
          { _id: event._id },
          {
            $set: {
              genre: detectedGenre,
              genres: [detectedGenre],
              primaryGenre: detectedGenre,
              genreDetection: {
                method: detectionMethod,
                confidence: detectionMethod === 'artist_based' ? 90 : 
                           detectionMethod === 'name_keyword' ? 70 : 50,
                detectedAt: new Date()
              }
            }
          }
        );
        updated++;
      }
      
      processed++;
      
      if (processed % 50 === 0) {
        console.log(`   Processed: ${processed}/${eventsToProcess.length} (Updated: ${updated})`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing event ${event._id}:`, error.message);
    }
  }
  
  console.log(`\n✅ GENRE CLASSIFICATION FIX COMPLETE:`);
  console.log(`   Events processed: ${processed}`);
  console.log(`   Events updated: ${updated}`);
  console.log(`   Success rate: ${((updated/processed)*100).toFixed(1)}%`);
  
  // Check final state
  const finalWithGenres = await collection.countDocuments({ 
    $or: [
      { genre: { $exists: true, $ne: null, $ne: 'unknown' } },
      { genres: { $exists: true, $ne: [] } },
      { primaryGenre: { $exists: true, $ne: 'unknown' } }
    ]
  });
  
  console.log(`\n📈 IMPROVEMENT:`);
  console.log(`   Before: ${withGenres.toLocaleString()} events with genres`);
  console.log(`   After: ${finalWithGenres.toLocaleString()} events with genres`);
  console.log(`   Improvement: +${(finalWithGenres - withGenres).toLocaleString()} events`);
  
  await client.close();
}

// Run the fix
if (require.main === module) {
  fixGenreClassification().catch(console.error);
}

module.exports = { fixGenreClassification };
