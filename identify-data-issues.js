#!/usr/bin/env node
/**
 * CLEAN ARTIST DATA
 * Identify and optionally clean problematic entries in artistGenres collection
 */

const { MongoClient } = require('mongodb');

async function identifyDataIssues() {
  console.log('🔧 IDENTIFYING DATA ISSUES FOR CLEANUP');
  console.log('======================================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  // 1. Artists with no Spotify ID and no Essentia profile (likely problematic)
  const problematicArtists = await artistGenresCollection.find({
    $and: [
      { $or: [{ spotifyId: null }, { spotifyId: { $exists: false } }] },
      { essentiaAudioProfile: { $exists: false } }
    ]
  }).toArray();
  
  console.log('⚠️ ARTISTS WITH NO SPOTIFY ID AND NO ESSENTIA PROFILE:');
  console.log(`   Found ${problematicArtists.length} entries`);
  
  if (problematicArtists.length > 0) {
    console.log('\n📋 PROBLEMATIC ENTRIES:');
    problematicArtists.forEach((artist, i) => {
      console.log(`${i+1}. ${artist.originalName || artist.name}`);
      console.log(`   Genres: ${(artist.genres || []).join(', ')}`);
      console.log(`   ID: ${artist._id}`);
      console.log('');
    });
  }
  
  // 2. Artists with only "electronic" genre (likely misclassified)
  const misclassifiedArtists = await artistGenresCollection.find({
    $and: [
      { genres: { $size: 1 } },
      { genres: { $in: ['electronic'] } }
    ]
  }).toArray();
  
  console.log(`🎭 ARTISTS WITH ONLY "ELECTRONIC" GENRE:`);
  console.log(`   Found ${misclassifiedArtists.length} entries`);
  
  if (misclassifiedArtists.length > 0) {
    misclassifiedArtists.forEach((artist, i) => {
      console.log(`${i+1}. ${artist.originalName || artist.name}`);
      console.log(`   Has Spotify ID: ${artist.spotifyId ? 'YES' : 'NO'}`);
      console.log(`   Has Essentia: ${artist.essentiaAudioProfile ? 'YES' : 'NO'}`);
    });
  }
  
  // 3. Artists that failed Essentia analysis
  const withoutEssentia = await artistGenresCollection.find({
    essentiaAudioProfile: { $exists: false }
  }).toArray();
  
  console.log(`\n❌ ARTISTS WITHOUT ESSENTIA PROFILES:`);
  console.log(`   Found ${withoutEssentia.length} entries`);
  
  // Group by whether they have Spotify IDs
  const withSpotifyNoEssentia = withoutEssentia.filter(a => a.spotifyId);
  const withoutSpotifyNoEssentia = withoutEssentia.filter(a => !a.spotifyId);
  
  console.log(`   With Spotify ID: ${withSpotifyNoEssentia.length}`);
  console.log(`   Without Spotify ID: ${withoutSpotifyNoEssentia.length}`);
  
  if (withSpotifyNoEssentia.length > 0) {
    console.log('\n🎵 ARTISTS WITH SPOTIFY ID BUT NO ESSENTIA (should work):');
    withSpotifyNoEssentia.slice(0, 10).forEach((artist, i) => {
      console.log(`${i+1}. ${artist.originalName || artist.name}`);
      console.log(`   Spotify ID: ${artist.spotifyId}`);
      console.log(`   Genres: ${(artist.genres || []).join(', ')}`);
    });
  }
  
  // 4. Summary and recommendations
  console.log('\n💡 CLEANUP RECOMMENDATIONS:');
  
  if (problematicArtists.length > 0) {
    console.log(`   • Remove ${problematicArtists.length} artists with no Spotify ID and no Essentia profile`);
  }
  
  if (misclassifiedArtists.length > 0) {
    console.log(`   • Re-fetch genres for ${misclassifiedArtists.length} artists with only "electronic" genre`);
  }
  
  if (withSpotifyNoEssentia.length > 0) {
    console.log(`   • Retry Essentia analysis for ${withSpotifyNoEssentia.length} artists with Spotify IDs`);
  }
  
  await client.close();
}

// Run the analysis
identifyDataIssues().catch(console.error);
