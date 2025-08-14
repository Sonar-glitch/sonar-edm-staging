#!/usr/bin/env node
/**
 * SPOTIFY ARTIST ENRICHMENT PIPELINE
 * ==================================
 * 
 * Enriches the 4,308 newly extracted artists with Spotify data:
 * - Artist genres
 * - Popularity scores  
 * - Spotify IDs
 * - Follower counts
 * 
 * Uses existing Spotify credentials from .env
 */

require('dotenv').config({ path: './users/sonar-edm-user/.env' });
const { MongoClient } = require('mongodb');
const SpotifyWebApi = require('spotify-web-api-node');

// Spotify API setup with credentials from .env
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

async function authenticateSpotify() {
  try {
    console.log('🎵 Authenticating with Spotify API...');
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('✅ Spotify authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Spotify authentication failed:', error.message);
    return false;
  }
}

async function enrichArtistsWithSpotify() {
  console.log('🎧 SPOTIFY ARTIST ENRICHMENT PIPELINE');
  console.log('====================================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  
  // Authenticate with Spotify
  const authenticated = await authenticateSpotify();
  if (!authenticated) {
    console.error('🚫 Cannot proceed without Spotify authentication');
    await client.close();
    return;
  }
  
  const artistGenresCollection = db.collection('artistGenres');
  
  // Get artists that need Spotify enrichment
  const artistsNeedingEnrichment = await artistGenresCollection.find({
    needsSpotifyEnrichment: true
  }).toArray();
  
  console.log(`\n📊 ENRICHMENT STATUS:`);
  console.log(`   Artists needing enrichment: ${artistsNeedingEnrichment.length}`);
  
  if (artistsNeedingEnrichment.length === 0) {
    console.log('✅ All artists already enriched with Spotify data');
    await client.close();
    return;
  }
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  let rateLimited = 0;
  
  console.log(`\n🔄 Starting enrichment of ${artistsNeedingEnrichment.length} artists...`);
  
  for (const artistDoc of artistsNeedingEnrichment) {
    try {
      const artistName = artistDoc.originalName || artistDoc.artistName;
      
      // Progress indicator
      processed++;
      if (processed % 100 === 0) {
        console.log(`   📈 Progress: ${processed}/${artistsNeedingEnrichment.length} (${((processed/artistsNeedingEnrichment.length)*100).toFixed(1)}%)`);
      }
      
      // Search for artist on Spotify
      const searchResult = await spotifyApi.searchArtists(artistName, { limit: 1 });
      
      if (searchResult.body.artists.items.length > 0) {
        const spotifyArtist = searchResult.body.artists.items[0];
        
        // Update artist document with Spotify data
        const updateData = {
          spotifyId: spotifyArtist.id,
          spotifyName: spotifyArtist.name,
          genres: spotifyArtist.genres || [],
          popularity: spotifyArtist.popularity || 0,
          followers: spotifyArtist.followers?.total || 0,
          spotifyUrl: spotifyArtist.external_urls?.spotify,
          images: spotifyArtist.images || [],
          enrichedAt: new Date(),
          needsSpotifyEnrichment: false
        };
        
        await artistGenresCollection.updateOne(
          { _id: artistDoc._id },
          { $set: updateData }
        );
        
        successful++;
        
        // Log some successful enrichments for visibility
        if (successful <= 5 || successful % 50 === 0) {
          console.log(`   ✅ ${artistName} → Genres: [${spotifyArtist.genres.slice(0,2).join(', ')}], Popularity: ${spotifyArtist.popularity}`);
        }
        
      } else {
        // Artist not found on Spotify
        await artistGenresCollection.updateOne(
          { _id: artistDoc._id },
          { 
            $set: { 
              spotifyNotFound: true,
              needsSpotifyEnrichment: false,
              enrichedAt: new Date()
            }
          }
        );
        failed++;
      }
      
      // Rate limiting: Wait between requests
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
    } catch (error) {
      if (error.statusCode === 429) {
        // Rate limited
        rateLimited++;
        console.log(`   ⏳ Rate limited, waiting 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      } else {
        console.error(`   ❌ Error enriching ${artistDoc.originalName}:`, error.message);
        failed++;
      }
    }
  }
  
  // Final statistics
  console.log(`\n✅ SPOTIFY ENRICHMENT COMPLETE!`);
  console.log(`=================================`);
  console.log(`📊 Total processed: ${processed}`);
  console.log(`✅ Successfully enriched: ${successful}`);
  console.log(`❌ Not found/failed: ${failed}`);
  console.log(`⏳ Rate limited: ${rateLimited}`);
  console.log(`📈 Success rate: ${((successful/processed)*100).toFixed(1)}%`);
  
  // Verify final state
  const enrichedCount = await artistGenresCollection.countDocuments({ spotifyId: { $exists: true } });
  const totalCount = await artistGenresCollection.countDocuments();
  
  console.log(`\n🎯 FINAL VERIFICATION:`);
  console.log(`   Total artists: ${totalCount}`);
  console.log(`   Enriched with Spotify: ${enrichedCount}`);
  console.log(`   Coverage: ${((enrichedCount/totalCount)*100).toFixed(1)}%`);
  
  await client.close();
  
  console.log('\n🎉 Ready for next step: Event-Artist Standardization');
}

if (require.main === module) {
  enrichArtistsWithSpotify().catch(console.error);
}

module.exports = { enrichArtistsWithSpotify };
