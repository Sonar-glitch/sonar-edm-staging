// Test the Enhanced RecommendationEnhancer
// Tests the new enhanceEvent method

const { MongoClient } = require('mongodb');

// Simulate the RecommendationEnhancer class with the new method
class TestRecommendationEnhancer {
  constructor() {
    this.enabled = true;
    this.version = '4.0.0';
  }
  
  // Calculate basic personalized score (similar to phase1_event_enhancer.js)
  calculateBasicPersonalizedScore(event) {
    // Simple music event detection
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
      console.log(`🚫 Non-music event detected: "${event.name}" -> Low score`);
      return Math.floor(Math.random() * 11) + 5; // Random 5-15%
    }
    
    // Return true if more music keywords than non-music keywords
    const isMusicEvent = musicMatches.length > nonMusicMatches.length;
    
    if (!isMusicEvent) {
      console.log(`🚫 Non-music event detected: "${event.name}" -> Low score`);
      return Math.floor(Math.random() * 11) + 5; // Random 5-15%
    }
    
    // For music events, calculate score based on EDM affinity
    let score = 50; // Base score
    
    // Genre contribution
    if (event.enhancedGenres && event.enhancedGenres.length > 0) {
      const edmGenres = ['house', 'techno', 'trance', 'dubstep', 'electronic', 'dance', 'edm'];
      const edmGenreCount = event.enhancedGenres.filter(genre => 
        edmGenres.some(edmGenre => genre.toLowerCase().includes(edmGenre))
      ).length;
      score += edmGenreCount * 5;
    }
    
    // Artist contribution
    if (event.artists && event.artists.length > 0) {
      score += Math.min(20, event.artists.length * 4);
    }
    
    // Venue contribution
    if (venueName.includes('club') || venueName.includes('festival')) {
      score += 10;
    }
    
    return Math.max(15, Math.min(95, Math.round(score)));
  }

  // Mock the enhanceEventWithArtistData method
  async enhanceEventWithArtistData(event, options = {}) {
    // Mock enhanced event data
    const enhancedEvent = { ...event };
    
    // Add basic enhanced genres from event name/description
    enhancedEvent.enhancedGenres = this.extractBasicGenres(event);
    enhancedEvent.artistMetadata = [];
    
    return enhancedEvent;
  }
  
  extractBasicGenres(event) {
    const text = (event.name + ' ' + (event.description || '')).toLowerCase();
    const genres = [];
    
    if (text.includes('house')) genres.push('house');
    if (text.includes('techno')) genres.push('techno');
    if (text.includes('electronic')) genres.push('electronic');
    if (text.includes('edm')) genres.push('edm');
    if (text.includes('dance')) genres.push('dance');
    
    return genres;
  }

  // Bridge method for compatibility with enhance_existing_events.js worker
  async enhanceEvent(event, options = {}) {
    try {
      console.log(`🔧 Enhancing single event: "${event.name}"`);
      
      // Use the existing enhanceEventWithArtistData method
      const enhancedEvent = await this.enhanceEventWithArtistData(event, options);
      
      // Mark as processed
      enhancedEvent.enhancementProcessed = true;
      enhancedEvent.enhancementVersion = this.version;
      enhancedEvent.enhancementTimestamp = new Date();
      
      // Calculate personalized score
      enhancedEvent.personalizedScore = this.calculateBasicPersonalizedScore(enhancedEvent);
      
      console.log(`✅ Enhanced "${event.name}" -> Score: ${enhancedEvent.personalizedScore}%`);
      
      return enhancedEvent;
    } catch (error) {
      console.error(`❌ Failed to enhance event "${event.name}":`, error);
      
      // Return original event with error flag
      return {
        ...event,
        enhancementProcessed: false,
        enhancementError: error.message,
        enhancementTimestamp: new Date()
      };
    }
  }
}

async function testEnhancer() {
  console.log('🧪 Testing Enhanced RecommendationEnhancer\n');
  
  const enhancer = new TestRecommendationEnhancer();
  
  // Test with real database events
  let client;
  try {
    client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
    await client.connect();
    
    const db = client.db('test');
    const eventsCollection = db.collection('events_unified');
    
    // Get Casa Loma events and some others
    const testEvents = await eventsCollection.find({
      $or: [
        { name: { $regex: /casa loma/i } },
        { name: { $regex: /electronic|house|techno/i } },
        { name: { $regex: /museum|exhibition/i } }
      ]
    }).limit(5).toArray();
    
    console.log(`📊 Testing ${testEvents.length} events:\n`);
    
    for (const event of testEvents) {
      const enhanced = await enhancer.enhanceEvent(event);
      
      console.log(`📋 Event: "${event.name}"`);
      console.log(`   Venue: ${typeof event.venue === 'object' ? event.venue?.name : event.venue}`);
      console.log(`   Original Score: ${event.personalizedScore || 'None'}`);
      console.log(`   New Score: ${enhanced.personalizedScore}%`);
      console.log(`   Enhanced Genres: [${enhanced.enhancedGenres?.join(', ') || 'None'}]`);
      console.log(`   Enhancement Processed: ${enhanced.enhancementProcessed}`);
      console.log('   ─────────────────────────────────────\n');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testEnhancer().catch(console.error);
