#!/usr/bin/env node
/**
 * CHECK ARTIST DATA QUALITY
 * Identify non-artist entries and data quality issues in artistGenres collection
 */

const { MongoClient } = require('mongodb');

async function checkArtistDataQuality() {
  console.log('🔍 CHECKING ARTIST DATA QUALITY');
  console.log('=================================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  // Get sample of all entries to see what's in there
  const allEntries = await artistGenresCollection.find({}).limit(30).toArray();
  
  console.log('📋 SAMPLE ARTISTGENRES ENTRIES:');
  console.log('================================');
  allEntries.forEach((entry, i) => {
    console.log(`${i+1}. Name: ${entry.originalName || entry.name || 'NO_NAME'}`);
    console.log(`   Type: ${entry.type || 'NO_TYPE'}`);
    console.log(`   Genres: ${(entry.genres || []).join(', ') || 'NO_GENRES'}`);
    console.log(`   Spotify ID: ${entry.spotifyId || 'NONE'}`);
    console.log(`   Has Essentia: ${entry.essentiaAudioProfile ? 'YES' : 'NO'}`);
    console.log('');
  });
  
  // Get total stats
  const totalEntries = await artistGenresCollection.countDocuments();
  const withType = await artistGenresCollection.countDocuments({ type: { $exists: true } });
  const withoutType = totalEntries - withType;
  
  console.log('📊 ENTRY ANALYSIS:');
  console.log(`   Total entries: ${totalEntries}`);
  console.log(`   With 'type' field: ${withType}`);
  console.log(`   Without 'type' field: ${withoutType}`);
  
  // Check different types
  if (withType > 0) {
    const types = await artistGenresCollection.distinct('type');
    console.log('\n🏷️ TYPES FOUND:');
    for (const type of types) {
      const count = await artistGenresCollection.countDocuments({ type: type });
      console.log(`   ${type}: ${count}`);
    }
  }
  
  // Look for obvious non-artist patterns
  const suspiciousEntries = await artistGenresCollection.find({
    $or: [
      { originalName: /venue|club|festival|event|location|stage|room/i },
      { name: /venue|club|festival|event|location|stage|room/i },
      { type: { $nin: ['artist', null] } },
      { $and: [{ genres: { $exists: true } }, { genres: { $size: 0 } }] }
    ]
  }).limit(20).toArray();
  
  if (suspiciousEntries.length > 0) {
    console.log('\n⚠️ SUSPICIOUS NON-ARTIST ENTRIES:');
    suspiciousEntries.forEach((entry, i) => {
      console.log(`${i+1}. ${entry.originalName || entry.name}`);
      console.log(`   Type: ${entry.type || 'NONE'}`);
      console.log(`   Genres: ${(entry.genres || []).length} genres`);
      console.log(`   ID: ${entry._id}`);
    });
  }
  
  // Check for entries with no name
  const noNameEntries = await artistGenresCollection.find({
    $and: [
      { originalName: { $exists: false } },
      { name: { $exists: false } }
    ]
  }).limit(5).toArray();
  
  if (noNameEntries.length > 0) {
    console.log('\n❌ ENTRIES WITH NO NAME:');
    noNameEntries.forEach((entry, i) => {
      console.log(`${i+1}. ID: ${entry._id}, Type: ${entry.type || 'NONE'}`);
    });
  }
  
  // Check for duplicates
  const duplicateNames = await artistGenresCollection.aggregate([
    { $group: { _id: "$originalName", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();
  
  if (duplicateNames.length > 0) {
    console.log('\n🔄 DUPLICATE ARTIST NAMES:');
    duplicateNames.forEach((dup, i) => {
      console.log(`${i+1}. ${dup._id}: ${dup.count} entries`);
    });
  }
  
  await client.close();
}

// Run the check
checkArtistDataQuality().catch(console.error);
