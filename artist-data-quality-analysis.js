#!/usr/bin/env node
/**
 * ARTIST DATA QUALITY ANALYSIS & CLEANUP TOOL
 * Analyzes current artist collection issues and provides cleanup strategy
 */

const { MongoClient } = require('mongodb');

async function analyzeArtistDataQuality() {
  console.log('🔍 ARTIST DATA QUALITY ANALYSIS');
  console.log('================================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  
  const artistGenresCollection = db.collection('artistGenres');
  const eventsUnifiedCollection = db.collection('events_unified');
  const eventsTicketmasterCollection = db.collection('events_ticketmaster');
  const eventsCollection = db.collection('events');
  
  console.log('\n📊 ARTIST COLLECTION ANALYSIS');
  console.log('==============================');
  
  // 1. Check artistGenres collection status
  const totalArtists = await artistGenresCollection.countDocuments();
  const artistsWithSpotifyId = await artistGenresCollection.countDocuments({ spotifyId: { $exists: true, $ne: null } });
  const artistsWithGenres = await artistGenresCollection.countDocuments({ genres: { $exists: true, $not: { $size: 0 } } });
  const artistsWithEssentia = await artistGenresCollection.countDocuments({ essentiaAudioProfile: { $exists: true } });
  
  console.log(`📈 artistGenres Collection Status:`);
  console.log(`   Total artists: ${totalArtists}`);
  console.log(`   With Spotify ID: ${artistsWithSpotifyId} (${((artistsWithSpotifyId/totalArtists)*100).toFixed(1)}%)`);
  console.log(`   With genres: ${artistsWithGenres} (${((artistsWithGenres/totalArtists)*100).toFixed(1)}%)`);
  console.log(`   With Essentia profiles: ${artistsWithEssentia} (${((artistsWithEssentia/totalArtists)*100).toFixed(1)}%)`);
  
  // 2. Sample artist data
  const sampleArtists = await artistGenresCollection.find({}).limit(5).toArray();
  console.log(`\n🎤 Sample Artists:`);
  sampleArtists.forEach((artist, i) => {
    console.log(`  [${i+1}] ${artist.originalName || artist.artistName || artist.name}`);
    console.log(`      Genres: ${(artist.genres || []).join(', ') || 'None'}`);
    console.log(`      Spotify ID: ${artist.spotifyId || 'Missing'}`);
    console.log(`      Essentia: ${artist.essentiaAudioProfile ? 'Yes' : 'No'}`);
  });
  
  // 3. Check for duplicates
  const duplicates = await artistGenresCollection.aggregate([
    { $group: { _id: '$originalName', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 10 }
  ]).toArray();
  
  console.log(`\n🔍 Duplicate Artists: ${duplicates.length} found`);
  duplicates.forEach(dup => {
    console.log(`   - "${dup._id}": ${dup.count} copies`);
  });
  
  console.log('\n📊 EVENT COLLECTION ARTIST ANALYSIS');
  console.log('====================================');
  
  // 4. Check events_unified artist field
  const unifiedTotal = await eventsUnifiedCollection.countDocuments();
  const unifiedWithArtists = await eventsUnifiedCollection.countDocuments({ artists: { $exists: true, $not: { $size: 0 } } });
  const unifiedWithArtistList = await eventsUnifiedCollection.countDocuments({ artistList: { $exists: true } });
  
  console.log(`📈 events_unified (${unifiedTotal} total):`);
  console.log(`   With artists field: ${unifiedWithArtists} (${((unifiedWithArtists/unifiedTotal)*100).toFixed(1)}%)`);
  console.log(`   With artistList field: ${unifiedWithArtistList} (${((unifiedWithArtistList/unifiedTotal)*100).toFixed(1)}%)`);
  
  // 5. Sample event artist data
  const sampleEvents = await eventsUnifiedCollection.find({ artists: { $exists: true } }).limit(3).toArray();
  console.log(`\n🎭 Sample Event Artist Data:`);
  sampleEvents.forEach((event, i) => {
    console.log(`  [${i+1}] ${event.title}`);
    console.log(`      Artists: ${event.artists ? JSON.stringify(event.artists).substring(0,150) + '...' : 'None'}`);
    console.log(`      Artist List: ${event.artistList ? JSON.stringify(event.artistList).substring(0,100) + '...' : 'None'}`);
  });
  
  // 6. Check for artist field inconsistencies
  const artistFieldTypes = await eventsUnifiedCollection.aggregate([
    { $project: { 
        artistType: { $type: '$artists' },
        artistCount: { $cond: [{ $isArray: '$artists' }, { $size: '$artists' }, 0] }
      }
    },
    { $group: { _id: '$artistType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log(`\n🔍 Artist Field Type Distribution:`);
  artistFieldTypes.forEach(type => {
    console.log(`   ${type._id}: ${type.count} events`);
  });
  
  console.log('\n📊 MISSING ARTIST DATA ANALYSIS');
  console.log('=================================');
  
  // 7. Events without artist data
  const eventsWithoutArtists = await eventsUnifiedCollection.find({ 
    $or: [
      { artists: { $exists: false } },
      { artists: { $size: 0 } },
      { artists: null }
    ]
  }).limit(5).toArray();
  
  console.log(`🎭 Events without artist data (sample):`);
  eventsWithoutArtists.forEach((event, i) => {
    console.log(`  [${i+1}] ${event.title}`);
    console.log(`      Source: ${event.source}`);
    console.log(`      Has artistList: ${event.artistList ? 'Yes' : 'No'}`);
  });
  
  await client.close();
}

// Add cleanup strategy function
async function generateCleanupStrategy() {
  console.log('\n🔧 CLEANUP STRATEGY RECOMMENDATIONS');
  console.log('===================================');
  
  console.log(`
📋 IMMEDIATE ACTIONS NEEDED:

1. 🧹 DUPLICATE REMOVAL
   - Clean up duplicate artists in artistGenres collection
   - Merge artist data keeping the most complete record
   - Update references in events to use canonical artist IDs

2. 📊 ARTIST INGESTION PIPELINE
   - Extract unique artists from all event collections
   - events_unified, events_ticketmaster, events
   - Search Spotify for each artist
   - Populate artistGenres with complete data

3. 🔗 EVENT-ARTIST LINKING
   - Standardize artist field format in events_unified
   - Link events to artistGenres collection IDs
   - Ensure consistent artist references

4. 🎵 ESSENTIA PROFILE BUILDING
   - Run matrix builder AFTER artist collection is clean
   - Process artists in order: EDM first, then others
   - Build comprehensive audio profiles

📁 REQUIRED SCRIPTS:
   - artist-collection-cleanup.js (duplicate removal)
   - artist-ingestion-pipeline.js (extract from events)
   - event-artist-linking.js (standardize references)
   - build-essentia-audio-matrix.js (audio profiles)
  `);
}

// Run analysis
if (require.main === module) {
  analyzeArtistDataQuality()
    .then(() => generateCleanupStrategy())
    .catch(console.error);
}

module.exports = { analyzeArtistDataQuality };
