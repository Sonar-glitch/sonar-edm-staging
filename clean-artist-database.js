#!/usr/bin/env node
/**
 * CLEAN ARTIST DATABASE
 * Remove problematic entries and fix data quality issues
 */

const { MongoClient } = require('mongodb');

async function cleanArtistDatabase() {
  console.log('🧹 CLEANING ARTIST DATABASE');
  console.log('============================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  console.log('📊 BEFORE CLEANUP:');
  const beforeCount = await artistGenresCollection.countDocuments();
  console.log(`   Total artists: ${beforeCount}`);
  
  // 1. Remove truly problematic artists (no Spotify ID, no Essentia profile)
  const problematicArtists = await artistGenresCollection.find({
    $and: [
      { $or: [{ spotifyId: null }, { spotifyId: { $exists: false } }] },
      { essentiaAudioProfile: { $exists: false } }
    ]
  }).toArray();
  
  console.log(`\n🗑️ REMOVING PROBLEMATIC ARTISTS:`);
  console.log(`   Found ${problematicArtists.length} artists to remove`);
  
  if (problematicArtists.length > 0) {
    // Show what we're removing
    problematicArtists.forEach((artist, i) => {
      console.log(`   ${i+1}. ${artist.originalName || artist.name}`);
    });
    
    // Remove them
    const deleteResult = await artistGenresCollection.deleteMany({
      $and: [
        { $or: [{ spotifyId: null }, { spotifyId: { $exists: false } }] },
        { essentiaAudioProfile: { $exists: false } }
      ]
    });
    
    console.log(`   ✅ Removed ${deleteResult.deletedCount} problematic entries`);
  }
  
  // 2. Mark misclassified artists for re-analysis
  const misclassifiedArtists = await artistGenresCollection.find({
    $and: [
      { genres: { $size: 1 } },
      { genres: { $in: ['electronic'] } }
    ]
  }).toArray();
  
  console.log(`\n🏷️ FIXING MISCLASSIFIED ARTISTS:`);
  console.log(`   Found ${misclassifiedArtists.length} artists with only "electronic" genre`);
  
  if (misclassifiedArtists.length > 0) {
    // Add a flag to indicate these need genre re-fetch
    const updateResult = await artistGenresCollection.updateMany(
      {
        $and: [
          { genres: { $size: 1 } },
          { genres: { $in: ['electronic'] } }
        ]
      },
      {
        $set: {
          needsGenreRefetch: true,
          genreRefetchReason: 'Only has generic electronic genre'
        }
      }
    );
    
    console.log(`   ✅ Marked ${updateResult.modifiedCount} artists for genre re-fetch`);
    
    // Show some examples
    console.log('   Examples of marked artists:');
    misclassifiedArtists.slice(0, 5).forEach((artist, i) => {
      console.log(`     ${i+1}. ${artist.originalName || artist.name}`);
    });
  }
  
  // 3. Summary after cleanup
  console.log(`\n📊 AFTER CLEANUP:`);
  const afterCount = await artistGenresCollection.countDocuments();
  const withEssentia = await artistGenresCollection.countDocuments({ essentiaAudioProfile: { $exists: true } });
  const withSpotifyId = await artistGenresCollection.countDocuments({ spotifyId: { $ne: null, $exists: true } });
  const needsGenreRefetch = await artistGenresCollection.countDocuments({ needsGenreRefetch: true });
  const readyForEssentia = await artistGenresCollection.countDocuments({
    $and: [
      { spotifyId: { $ne: null, $exists: true } },
      { essentiaAudioProfile: { $exists: false } }
    ]
  });
  
  console.log(`   Total artists: ${afterCount} (removed ${beforeCount - afterCount})`);
  console.log(`   With Essentia profiles: ${withEssentia} (${((withEssentia/afterCount)*100).toFixed(1)}%)`);
  console.log(`   With Spotify IDs: ${withSpotifyId} (${((withSpotifyId/afterCount)*100).toFixed(1)}%)`);
  console.log(`   Need genre re-fetch: ${needsGenreRefetch}`);
  console.log(`   Ready for Essentia analysis: ${readyForEssentia}`);
  
  console.log(`\n✅ DATABASE CLEANUP COMPLETE`);
  console.log(`   • Removed ${beforeCount - afterCount} problematic artists`);
  console.log(`   • Marked ${needsGenreRefetch} artists for genre re-fetch`);
  console.log(`   • ${readyForEssentia} artists ready for Essentia analysis`);
  
  await client.close();
}

// Run the cleanup
if (require.main === module) {
  cleanArtistDatabase().catch(console.error);
}

module.exports = { cleanArtistDatabase };
