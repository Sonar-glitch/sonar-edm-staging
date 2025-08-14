#!/usr/bin/env node
/**
 * ESSENTIA-BASED AUDIO PROFILE MATRIX BUILDER
 * Uses the deployed Essentia service to build comprehensive audio profiles
 * This replaces deprecated Spotify audio features with advanced ML analysis
 */

import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

// Essentia service configuration
const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';

async function buildEssentiaAudioProfileMatrix() {
  console.log('🎵 BUILDING ESSENTIA-BASED AUDIO PROFILE MATRIX');
  console.log('===============================================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  // Verify Essentia service is available
  try {
    const healthCheck = await fetch(`${ESSENTIA_SERVICE_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error(`Essentia service health check failed: ${healthCheck.status}`);
    }
    console.log('✅ Essentia service is online and ready');
  } catch (error) {
    console.error('❌ Essentia service unavailable:', error.message);
    process.exit(1);
  }
  
  // Get all artists without Essentia audio profiles
  const artistsToProcess = await artistGenresCollection.find({
    essentiaAudioProfile: { $exists: false }
  }).toArray();
  
  console.log(`\n📊 Artists to process: ${artistsToProcess.length}`);
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  for (const artist of artistsToProcess) {
    try {
      console.log(`\n[${processed + 1}/${artistsToProcess.length}] Processing: ${artist.originalName}`);
      
      // Get tracks for this artist (up to 20)
      const trackResult = await getArtistTracks(artist.originalName);
      
      if (!trackResult.success) {
        console.log(`  ❌ Failed to get tracks: ${trackResult.error}`);
        failed++;
        processed++;
        continue;
      }
      
      const tracks = trackResult.tracks.slice(0, 20); // Limit to 20 tracks
      console.log(`  🎧 Found ${tracks.length} tracks to analyze`);
      
      if (tracks.length === 0) {
        console.log(`  ⚠️ No tracks found for ${artist.originalName}`);
        failed++;
        processed++;
        continue;
      }
      
      // Analyze each track with Essentia
      const trackAnalyses = [];
      let tracksAnalyzed = 0;
      
      for (const track of tracks) {
        if (!track.preview_url) {
          console.log(`    ⚠️ No preview URL for ${track.name}`);
          continue;
        }
        
        console.log(`    🎵 Analyzing: ${track.name}`);
        const analysis = await analyzeTrackWithEssentia(track.preview_url, track);
        
        if (analysis.success) {
          trackAnalyses.push({
            trackId: track.id,
            trackName: track.name,
            features: analysis.features,
            analyzedAt: new Date()
          });
          tracksAnalyzed++;
          console.log(`    ✅ Analysis complete (${tracksAnalyzed}/${tracks.length})`);
        } else {
          console.log(`    ❌ Analysis failed: ${analysis.error}`);
        }
        
        // Rate limiting: small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (trackAnalyses.length === 0) {
        console.log(`  ❌ No successful analyses for ${artist.originalName}`);
        failed++;
        processed++;
        continue;
      }
      
      // Calculate aggregate audio profile for the artist
      const aggregateProfile = calculateAggregateAudioProfile(trackAnalyses);
      
      // Update artist with Essentia audio profile
      await artistGenresCollection.updateOne(
        { _id: artist._id },
        {
          $set: {
            essentiaAudioProfile: {
              trackCount: trackAnalyses.length,
              aggregateFeatures: aggregateProfile,
              tracks: trackAnalyses,
              lastUpdated: new Date(),
              source: 'essentia-ml'
            }
          }
        }
      );
      
      console.log(`  ✅ Profile created with ${trackAnalyses.length} track analyses`);
      successful++;
      processed++;
      
    } catch (error) {
      console.log(`  ❌ Processing error: ${error.message}`);
      failed++;
      processed++;
    }
    
    // Progress report every 10 artists
    if (processed % 10 === 0) {
      console.log(`\n📊 Progress: ${processed}/${artistsToProcess.length} (${successful} successful, ${failed} failed)`);
    }
  }
  
  console.log('\n🎯 MATRIX BUILD COMPLETE');
  console.log('========================');
  console.log(`Total processed: ${processed}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((successful / processed) * 100).toFixed(1)}%`);
  
  await client.close();
  process.exit(0);
}

/**
 * Get tracks for an artist using Spotify API
 */
async function getArtistTracks(artistName) {
  try {
    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from('20d98eaf33fa464291b4c13a1e70a2ad:be60f4a1c5ad409985ad9c57b4d17df9').toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Search for the artist
    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!searchResponse.ok) {
      throw new Error(`Artist search failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.artists || searchData.artists.items.length === 0) {
      throw new Error('Artist not found');
    }
    
    const artistId = searchData.artists.items[0].id;
    
    // Get top tracks for the artist
    const tracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!tracksResponse.ok) {
      throw new Error(`Top tracks request failed: ${tracksResponse.status}`);
    }
    
    const tracksData = await tracksResponse.json();
    const tracks = tracksData.tracks || [];
    
    // If we don't have enough top tracks, get albums
    if (tracks.length < 20) {
      try {
        const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=20`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (albumsResponse.ok) {
          const albumsData = await albumsResponse.json();
          
          for (const album of albumsData.items.slice(0, 5)) { // Get tracks from first 5 albums
            if (tracks.length >= 20) break;
            
            const albumTracksResponse = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks?limit=10`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            if (albumTracksResponse.ok) {
              const albumTracksData = await albumTracksResponse.json();
              tracks.push(...albumTracksData.items.slice(0, 10));
            }
          }
        }
      } catch (albumError) {
        console.log(`    ⚠️ Could not fetch album tracks: ${albumError.message}`);
      }
    }
    
    return { success: true, tracks: tracks };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Analyze a single track with Essentia service
 */
async function analyzeTrackWithEssentia(audioUrl, trackMetadata) {
  try {
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioUrl: audioUrl,
        trackMetadata: {
          name: trackMetadata.name,
          artist: trackMetadata.artists?.[0]?.name || 'Unknown',
          id: trackMetadata.id
        }
      }),
      timeout: 30000 // 30 second timeout for analysis
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const analysisResult = await response.json();
    
    if (analysisResult.success) {
      return {
        success: true,
        features: analysisResult.features
      };
    } else {
      return { success: false, error: analysisResult.error || 'Analysis failed' };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate aggregate audio profile from multiple track analyses
 */
function calculateAggregateAudioProfile(trackAnalyses) {
  if (trackAnalyses.length === 0) return null;
  
  const features = {};
  const featureNames = Object.keys(trackAnalyses[0].features);
  
  for (const featureName of featureNames) {
    const values = trackAnalyses
      .map(track => track.features[featureName])
      .filter(value => typeof value === 'number' && !isNaN(value));
    
    if (values.length > 0) {
      features[featureName] = {
        mean: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        std: calculateStandardDeviation(values)
      };
    }
  }
  
  return features;
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values) {
  if (values.length <= 1) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(avgSquaredDiff);
}

// Start the matrix building process
buildEssentiaAudioProfileMatrix().catch(console.error);
