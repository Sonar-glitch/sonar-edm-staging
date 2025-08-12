// Phase 1 Enhancement Pipeline
// Enhances events_unified collection with artistMetadata, enhancedGenres, and personalizedScore

const { MongoClient } = require('mongodb');

class Phase1EventEnhancer {
  constructor() {
    this.mongoClient = null;
    this.db = null;
  }

  async connect() {
    this.mongoClient = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
    await this.mongoClient.connect();
    this.db = this.mongoClient.db('test');
    console.log('✅ Connected to MongoDB');
  }

  async disconnect() {
    if (this.mongoClient) {
      await this.mongoClient.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  // Get artist metadata from artistGenres collection
  async getArtistMetadata(artistName) {
    if (!artistName) return null;
    
    const artistDoc = await this.db.collection('artistGenres').findOne({
      $or: [
        { artistName: { $regex: new RegExp(`^${artistName}$`, 'i') } },
        { originalName: { $regex: new RegExp(`^${artistName}$`, 'i') } }
      ]
    });

    if (artistDoc) {
      return {
        name: artistDoc.artistName,
        genres: artistDoc.genres || [],
        spotifyId: artistDoc.spotifyId,
        edmWeight: this.calculateEdmWeight(artistDoc.genres || []),
        popularity: this.estimatePopularity(artistDoc.genres || []),
        source: 'artistGenres_collection'
      };
    }

    return null;
  }

  // Calculate EDM weight based on genres
  calculateEdmWeight(genres) {
    const edmGenres = ['house', 'techno', 'trance', 'dubstep', 'drum and bass', 'dnb', 'electronic', 'dance', 'edm', 'electro'];
    const edmMatches = genres.filter(genre => 
      edmGenres.some(edmGenre => genre.toLowerCase().includes(edmGenre))
    );
    return edmMatches.length / Math.max(genres.length, 1);
  }

  // Detect if event is actually a music event
  detectMusicEvent(event) {
    const eventText = (event.name + ' ' + (event.description || '')).toLowerCase();
    const venueName = (typeof event.venue === 'object' ? event.venue?.name : event.venue || '').toLowerCase();
    const fullText = eventText + ' ' + venueName;
    
    const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 
                          'dance', 'bass', 'club', 'party', 'live music', 'band', 'artist', 'performance', 
                          'tour', 'show', 'live'];
    
    const nonMusicKeywords = ['admission', 'general admission', 'museum', 'exhibition', 'castle', 
                             'historic', 'tour', 'visit', 'sightseeing', 'gallery'];
    
    const musicMatches = musicKeywords.filter(word => fullText.includes(word));
    const nonMusicMatches = nonMusicKeywords.filter(word => fullText.includes(word));
    
    // Special handling for "general admission" - only non-music if no music context
    const hasGeneralAdmission = fullText.includes('general admission');
    if (hasGeneralAdmission && musicMatches.length === 0) {
      return false; // Clearly non-music general admission
    }
    
    // Return true if more music keywords than non-music keywords
    return musicMatches.length > nonMusicMatches.length;
  }

  // Estimate artist popularity based on genres
  estimatePopularity(genres) {
    // Simple popularity estimation - mainstream genres get higher scores
    const popularGenres = ['house', 'pop', 'electronic', 'dance'];
    const hasPopularGenre = genres.some(genre => 
      popularGenres.some(popGenre => genre.toLowerCase().includes(popGenre))
    );
    return hasPopularGenre ? 75 : 50;
  }

  // Enhance event with artist metadata
  async enhanceEventArtists(event) {
    if (!event.artists || event.artists.length === 0) {
      return { artistMetadata: [], enhancedGenres: [] };
    }

    const artistMetadata = [];
    const allGenres = new Set();

    for (const artist of event.artists) {
      const artistName = typeof artist === 'object' ? artist.name : artist;
      const metadata = await this.getArtistMetadata(artistName);
      
      if (metadata) {
        artistMetadata.push(metadata);
        metadata.genres.forEach(genre => allGenres.add(genre.toLowerCase()));
      }
    }

    // Combine event genres with artist genres
    const enhancedGenres = [...new Set([
      ...(event.genres || []).map(g => g.toLowerCase()),
      ...Array.from(allGenres)
    ])];

    return { artistMetadata, enhancedGenres };
  }

  // Calculate basic personalized score
  calculatePersonalizedScore(event, artistMetadata, enhancedGenres) {
    // FIRST: Check if this is actually a music event
    const isMusicEvent = this.detectMusicEvent(event);
    
    if (!isMusicEvent) {
      // Non-music events get very low scores (5-15%)
      console.log(`🚫 Non-music event detected: "${event.name}" -> Low score`);
      return Math.floor(Math.random() * 11) + 5; // Random 5-15%
    }
    
    let score = 50; // Base score for music events

    // Artist metadata contribution (30%)
    if (artistMetadata && artistMetadata.length > 0) {
      const avgEdmWeight = artistMetadata.reduce((sum, a) => sum + (a.edmWeight || 0), 0) / artistMetadata.length;
      const avgPopularity = artistMetadata.reduce((sum, a) => sum + (a.popularity || 50), 0) / artistMetadata.length;
      
      score += (avgEdmWeight * 20); // EDM weight boost
      score += ((avgPopularity - 50) / 50) * 10; // Popularity adjustment
    }

    // Genre contribution (25%)
    const edmGenres = ['house', 'techno', 'trance', 'dubstep', 'electronic', 'dance', 'edm'];
    const edmGenreCount = enhancedGenres.filter(genre => 
      edmGenres.some(edmGenre => genre.includes(edmGenre))
    ).length;
    score += edmGenreCount * 5;

    // Sound characteristics contribution (20%)
    if (event.soundCharacteristics) {
      const characteristics = event.soundCharacteristics;
      if (characteristics.energy > 0.7) score += 5;
      if (characteristics.danceability > 0.7) score += 5;
      if (characteristics.tempo > 120 && characteristics.tempo < 150) score += 5;
    }

    // Venue contribution (15%)
    if (event.venue) {
      const venueName = typeof event.venue === 'object' ? event.venue.name : event.venue;
      if (venueName && typeof venueName === 'string') {
        const venueNameLower = venueName.toLowerCase();
        if (venueNameLower.includes('club') || venueNameLower.includes('festival')) {
          score += 10;
        }
      }
    }

    // Date/timing contribution (10%)
    if (event.date) {
      const eventDate = new Date(event.date);
      const now = new Date();
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntil >= 0 && daysUntil <= 14) {
        score += 5; // Upcoming events bonus
      }
    }

    return Math.max(10, Math.min(95, Math.round(score)));
  }

  // Check if event is music-related
  isMusicEvent(event, enhancedGenres) {
    const eventText = (event.name || '').toLowerCase() + ' ' + (event.description || '').toLowerCase();
    const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'club', 'party', 'live music', 'band', 'artist', 'performance', 'tour'];
    const nonMusicKeywords = ['museum', 'exhibition', 'castle', 'historic', 'visit', 'sightseeing'];
    
    const musicMatches = musicKeywords.filter(word => eventText.includes(word));
    const nonMusicMatches = nonMusicKeywords.filter(word => eventText.includes(word));
    
    // Special case for general admission at non-music venues
    const hasGeneralAdmission = eventText.includes('general admission') && musicMatches.length === 0;
    
    // Has music indicators OR enhanced genres contain music genres
    const hasMusic = musicMatches.length > nonMusicMatches.length;
    const hasEDMGenres = enhancedGenres.some(genre => 
      ['house', 'techno', 'trance', 'electronic', 'dance', 'edm'].some(edmGenre => genre.includes(edmGenre))
    );
    
    return (hasMusic || hasEDMGenres) && !hasGeneralAdmission;
  }

  // Process a batch of events
  async processBatch(events) {
    const results = {
      processed: 0,
      enhanced: 0,
      skipped: 0,
      errors: 0
    };

    for (const event of events) {
      try {
        results.processed++;

        // Skip if already enhanced
        if (event.artistMetadata || event.enhancedGenres || event.personalizedScore) {
          results.skipped++;
          continue;
        }

        // Enhance with artist metadata and genres
        const { artistMetadata, enhancedGenres } = await this.enhanceEventArtists(event);

        // Check if it's a music event
        const isMusic = this.isMusicEvent(event, enhancedGenres);
        
        if (!isMusic) {
          console.log(`⚠️ Skipping non-music event: "${event.name}"`);
          results.skipped++;
          continue;
        }

        // Calculate personalized score
        const personalizedScore = this.calculatePersonalizedScore(event, artistMetadata, enhancedGenres);

        // Update the event in database
        const updateResult = await this.db.collection('events_unified').updateOne(
          { _id: event._id },
          {
            $set: {
              artistMetadata,
              enhancedGenres,
              personalizedScore,
              phase1Applied: true,
              lastEnhanced: new Date(),
              enhancementVersion: '1.0.0'
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          results.enhanced++;
          console.log(`✅ Enhanced: "${event.name}" -> Score: ${personalizedScore}% (${artistMetadata.length} artists, ${enhancedGenres.length} genres)`);
        }

      } catch (error) {
        results.errors++;
        console.error(`❌ Error processing "${event.name}":`, error.message);
      }
    }

    return results;
  }

  // Main enhancement process
  async enhanceEvents(batchSize = 50, limit = null) {
    console.log('🚀 Starting Phase 1 Event Enhancement Pipeline...\n');

    // Get events that need enhancement
    const query = {
      $and: [
        { artistMetadata: { $exists: false } },
        { enhancedGenres: { $exists: false } },
        { personalizedScore: { $exists: false } }
      ]
    };

    const totalEvents = await this.db.collection('events_unified').countDocuments(query);
    const eventsToProcess = limit ? Math.min(totalEvents, limit) : totalEvents;
    
    console.log(`📊 Found ${totalEvents} events needing enhancement`);
    console.log(`🎯 Processing ${eventsToProcess} events in batches of ${batchSize}\n`);

    const totalResults = {
      processed: 0,
      enhanced: 0,
      skipped: 0,
      errors: 0
    };

    let processedCount = 0;
    const cursor = this.db.collection('events_unified').find(query).limit(eventsToProcess);
    
    while (await cursor.hasNext()) {
      const batch = [];
      
      // Collect batch
      for (let i = 0; i < batchSize && await cursor.hasNext(); i++) {
        batch.push(await cursor.next());
      }

      if (batch.length === 0) break;

      console.log(`\n🔄 Processing batch ${Math.floor(processedCount / batchSize) + 1}: ${batch.length} events`);
      
      const batchResults = await this.processBatch(batch);
      
      // Update totals
      totalResults.processed += batchResults.processed;
      totalResults.enhanced += batchResults.enhanced;
      totalResults.skipped += batchResults.skipped;
      totalResults.errors += batchResults.errors;
      
      processedCount += batch.length;
      
      console.log(`📈 Batch results: ${batchResults.enhanced} enhanced, ${batchResults.skipped} skipped, ${batchResults.errors} errors`);
      console.log(`📊 Progress: ${processedCount}/${eventsToProcess} events processed (${Math.round(processedCount/eventsToProcess*100)}%)`);
    }

    console.log('\n🎉 Phase 1 Enhancement Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total Events Processed: ${totalResults.processed}`);
    console.log(`✅ Successfully Enhanced: ${totalResults.enhanced}`);
    console.log(`⚠️ Skipped (non-music/existing): ${totalResults.skipped}`);
    console.log(`❌ Errors: ${totalResults.errors}`);
    console.log(`🎯 Success Rate: ${Math.round(totalResults.enhanced/totalResults.processed*100)}%`);

    return totalResults;
  }
}

// Main execution function
async function runEnhancement() {
  const enhancer = new Phase1EventEnhancer();
  
  try {
    await enhancer.connect();
    
    // Run enhancement with limits for testing (remove limit for full run)
    const results = await enhancer.enhanceEvents(25, 100); // Process 100 events in batches of 25
    
  } catch (error) {
    console.error('💥 Enhancement pipeline failed:', error);
  } finally {
    await enhancer.disconnect();
  }
}

// Export for use as module or run directly
if (require.main === module) {
  runEnhancement();
}

module.exports = Phase1EventEnhancer;
