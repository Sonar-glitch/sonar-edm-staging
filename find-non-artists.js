#!/usr/bin/env node
/**
 * FIND NON-ARTIST ENTRIES
 * Look for venues, events, or other non-artist data in artistGenres collection
 */

const { MongoClient } = require('mongodb');

async function findNonArtistEntries() {
  console.log('🔍 SEARCHING FOR NON-ARTIST ENTRIES');
  console.log('====================================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  // Look for venue/location patterns
  const venuePatterns = await artistGenresCollection.find({
    $or: [
      { originalName: /venue|club|festival|arena|stadium|hall|center|centre|theatre|theater|stage|room|lounge|bar|pub|amphitheatre|amphitheater/i },
      { name: /venue|club|festival|arena|stadium|hall|center|centre|theatre|theater|stage|room|lounge|bar|pub|amphitheatre|amphitheater/i }
    ]
  }).toArray();
  
  console.log('🏢 POTENTIAL VENUE/LOCATION ENTRIES:');
  if (venuePatterns.length === 0) {
    console.log('   ✅ No obvious venue entries found');
  } else {
    venuePatterns.forEach((entry, i) => {
      console.log(`${i+1}. ${entry.originalName || entry.name}`);
      console.log(`   Genres: ${(entry.genres || []).join(', ')}`);
      console.log(`   ID: ${entry._id}`);
    });
  }
  
  // Look for entries with unusual names
  const allNames = await artistGenresCollection.find({}, { projection: { originalName: 1, name: 1, genres: 1, _id: 1 } }).toArray();
  const suspiciousNames = allNames.filter(entry => {
    const name = (entry.originalName || entry.name || '').toLowerCase();
    // Look for non-artist patterns
    return name.includes('fest') || 
           name.includes('event') || 
           name.includes('stage') || 
           name.includes('main') || 
           name.includes('outdoor') ||
           name.includes('indoor') ||
           name.includes('live') ||
           name.includes('presents') ||
           name.includes('featuring') ||
           name.length < 2 ||
           /^[0-9]+$/.test(name) ||
           name.includes('&') && name.length > 50; // Long names with & are often event titles
  });
  
  console.log('\n🤔 SUSPICIOUS ENTRIES:');
  if (suspiciousNames.length === 0) {
    console.log('   ✅ No suspicious entries found');
  } else {
    suspiciousNames.slice(0, 20).forEach((entry, i) => {
      console.log(`${i+1}. ${entry.originalName || entry.name}`);
      console.log(`   Genres: ${(entry.genres || []).join(', ')}`);
      console.log(`   ID: ${entry._id}`);
    });
    
    if (suspiciousNames.length > 20) {
      console.log(`   ... and ${suspiciousNames.length - 20} more suspicious entries`);
    }
  }
  
  // Look for entries with no genres or empty genres
  const noGenres = await artistGenresCollection.find({
    $or: [
      { genres: { $exists: false } },
      { genres: { $size: 0 } },
      { genres: null }
    ]
  }).limit(10).toArray();
  
  console.log('\n❌ ENTRIES WITH NO GENRES:');
  if (noGenres.length === 0) {
    console.log('   ✅ All entries have genres');
  } else {
    noGenres.forEach((entry, i) => {
      console.log(`${i+1}. ${entry.originalName || entry.name}`);
      console.log(`   ID: ${entry._id}`);
    });
  }
  
  // Summary of data quality
  const totalEntries = await artistGenresCollection.countDocuments();
  const withEssentia = await artistGenresCollection.countDocuments({ essentiaAudioProfile: { $exists: true } });
  const withSpotifyId = await artistGenresCollection.countDocuments({ spotifyId: { $ne: null, $exists: true } });
  
  console.log('\n📊 DATA QUALITY SUMMARY:');
  console.log(`   Total entries: ${totalEntries}`);
  console.log(`   With Essentia profiles: ${withEssentia} (${((withEssentia/totalEntries)*100).toFixed(1)}%)`);
  console.log(`   With Spotify IDs: ${withSpotifyId} (${((withSpotifyId/totalEntries)*100).toFixed(1)}%)`);
  console.log(`   Venue patterns found: ${venuePatterns.length}`);
  console.log(`   Suspicious entries: ${suspiciousNames.length}`);
  console.log(`   Missing genres: ${noGenres.length}`);
  
  await client.close();
}

// Run the search
findNonArtistEntries().catch(console.error);
