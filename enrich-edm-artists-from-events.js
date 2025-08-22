#!/usr/bin/env node
/**
 * EDM ARTIST ENRICHMENT FROM EVENTS
 * Identify EDM artists from upcoming events and enrich artistGenres collection
 */

const { MongoClient } = require('mongodb');

async function enrichEDMArtistsFromEvents() {
  console.log('🎧 ENRICHING EDM ARTISTS FROM UPCOMING EVENTS');
  console.log('==============================================');
  
  // Use MONGODB_URI from environment. For local dev you can set MONGODB_URI to a local instance
  // e.g. mongodb://localhost:27017/sonaredm. Do NOT commit credentials to the repo.
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/sonaredm');
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'test');

  // Connect to event database. Prefer providing an event DB URI via ENV as well.
  // Set EVENT_DB_URI to the event DB connection string in CI/hosting secrets.
  const eventClient = new MongoClient(process.env.EVENT_DB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sonaredm_events');
  await eventClient.connect();
  const eventDb = eventClient.db(process.env.EVENT_DB_NAME || 'tiko_development');
  
  const artistGenresCollection = db.collection('artistGenres');
  const eventsCollection = eventDb.collection('events_unified');
  
  // Get upcoming events (next 3 months)
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  
  const upcomingEvents = await eventsCollection.find({
    date: { 
      $gte: new Date(), 
      $lte: threeMonthsFromNow 
    }
  }).toArray();
  
  console.log(`📅 Found ${upcomingEvents.length} upcoming events`);
  
  // Extract all artists from upcoming events
  const eventArtists = new Set();
  
  upcomingEvents.forEach(event => {
    // Extract artists from various fields
    if (event.artist) eventArtists.add(event.artist);
    if (event.headliner) eventArtists.add(event.headliner);
    if (event.performers && Array.isArray(event.performers)) {
      event.performers.forEach(performer => {
        if (typeof performer === 'string') {
          eventArtists.add(performer);
        } else if (performer.name) {
          eventArtists.add(performer.name);
        }
      });
    }
    if (event.lineup && Array.isArray(event.lineup)) {
      event.lineup.forEach(artist => eventArtists.add(artist));
    }
  });
  
  console.log(`🎤 Found ${eventArtists.size} unique artists from upcoming events`);
  
  // Filter for EDM-specific events and artists
  const edmKeywords = [
    'edm', 'electronic', 'dance', 'house', 'techno', 'trance', 'dubstep', 
    'electro', 'progressive', 'deep house', 'tech house', 'bass', 'rave',
    'festival', 'club', 'underground', 'dj', 'remix', 'beat'
  ];
  
  const edmEvents = upcomingEvents.filter(event => {
    const eventText = `${event.name || ''} ${event.description || ''} ${event.genre || ''} ${event.venue || ''}`.toLowerCase();
    return edmKeywords.some(keyword => eventText.includes(keyword));
  });
  
  console.log(`🎧 Found ${edmEvents.length} EDM-related events`);
  
  // Extract EDM artists from EDM events
  const edmArtists = new Set();
  
  edmEvents.forEach(event => {
    if (event.artist) edmArtists.add(event.artist);
    if (event.headliner) edmArtists.add(event.headliner);
    if (event.performers && Array.isArray(event.performers)) {
      event.performers.forEach(performer => {
        if (typeof performer === 'string') {
          edmArtists.add(performer);
        } else if (performer.name) {
          edmArtists.add(performer.name);
        }
      });
    }
    if (event.lineup && Array.isArray(event.lineup)) {
      event.lineup.forEach(artist => edmArtists.add(artist));
    }
  });
  
  console.log(`🎵 Found ${edmArtists.size} EDM artists from upcoming events`);
  
  // Show sample EDM events and artists
  console.log(`\n📋 SAMPLE EDM EVENTS:`);
  edmEvents.slice(0, 5).forEach((event, i) => {
    console.log(`${i+1}. ${event.name}`);
    console.log(`   Date: ${event.date}`);
    console.log(`   Venue: ${event.venue || 'N/A'}`);
    console.log(`   Artist: ${event.artist || event.headliner || 'Multiple'}`);
  });
  
  console.log(`\n🎧 SAMPLE EDM ARTISTS FROM EVENTS:`);
  const edmArtistArray = Array.from(edmArtists);
  edmArtistArray.slice(0, 10).forEach((artist, i) => {
    console.log(`${i+1}. ${artist}`);
  });
  
  // Check which EDM artists are already in artistGenres collection
  const existingEDMArtists = [];
  const missingEDMArtists = [];
  
  for (const artistName of edmArtistArray) {
    const existing = await artistGenresCollection.findOne({ 
      originalName: { $regex: new RegExp(`^${artistName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') }
    });
    
    if (existing) {
      existingEDMArtists.push({ name: artistName, data: existing });
    } else {
      missingEDMArtists.push(artistName);
    }
  }
  
  console.log(`\n📊 EDM ARTIST STATUS:`);
  console.log(`   Already in database: ${existingEDMArtists.length}`);
  console.log(`   Missing from database: ${missingEDMArtists.length}`);
  
  // Show existing EDM artists and their Essentia status
  console.log(`\n✅ EXISTING EDM ARTISTS IN DATABASE:`);
  existingEDMArtists.slice(0, 15).forEach((artist, i) => {
    console.log(`${i+1}. ${artist.name}`);
    console.log(`   Genres: ${(artist.data.genres || []).join(', ')}`);
    console.log(`   Spotify ID: ${artist.data.spotifyId ? 'YES' : 'NO'}`);
    console.log(`   Essentia Profile: ${artist.data.essentiaAudioProfile ? 'YES' : 'NO'}`);
    console.log('');
  });
  
  if (missingEDMArtists.length > 0) {
    console.log(`\n❌ MISSING EDM ARTISTS (need to add to database):`);
    missingEDMArtists.slice(0, 15).forEach((artist, i) => {
      console.log(`${i+1}. ${artist}`);
    });
  }
  
  // Count EDM artists ready for Essentia analysis
  const edmArtistsReadyForEssentia = existingEDMArtists.filter(artist => 
    artist.data.spotifyId && !artist.data.essentiaAudioProfile
  );
  
  console.log(`\n🎯 PRIORITY ANALYSIS:`);
  console.log(`   EDM artists ready for Essentia: ${edmArtistsReadyForEssentia.length}`);
  console.log(`   EDM artists needing Spotify lookup: ${missingEDMArtists.length}`);
  
  await client.close();
  await eventClient.close();
  
  return {
    totalUpcomingEvents: upcomingEvents.length,
    edmEvents: edmEvents.length,
    edmArtists: edmArtistArray,
    existingEDMArtists,
    missingEDMArtists,
    readyForEssentia: edmArtistsReadyForEssentia
  };
}

// Run the enrichment
if (require.main === module) {
  enrichEDMArtistsFromEvents().catch(console.error);
}

module.exports = { enrichEDMArtistsFromEvents };
