// Match Score Analysis Script
// Analyzes why certain events get high match scores

const { MongoClient } = require('mongodb');

async function analyzeMatchScores() {
  let client;
  
  try {
    // Connect to production MongoDB
    client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('test'); // Production database
    const eventsCollection = db.collection('events_unified');
    
    // Find events that might be questionable (non-music events)
    console.log('\n🔍 Searching for Casa Loma and similar non-music events...\n');
    
    const questionableEvents = await eventsCollection.find({
      $or: [
        { name: { $regex: /casa loma/i } },
        { name: { $regex: /general admission/i } },
        { name: { $regex: /museum/i } },
        { name: { $regex: /exhibition/i } },
        { name: { $regex: /historic/i } },
        { description: { $regex: /museum|admission|historic|castle|sightseeing/i } }
      ]
    }).limit(20).toArray();
    
    console.log(`Found ${questionableEvents.length} potentially non-music events:\n`);
    
    for (const event of questionableEvents) {
      console.log(`📋 Event: "${event.name}"`);
      console.log(`   Description: ${event.description || 'No description'}`);
      console.log(`   Venue: ${event.venue?.name || event.venue || 'No venue'}`);
      console.log(`   Genres: ${event.genres ? event.genres.join(', ') : 'No genres'}`);
      console.log(`   Artists: ${event.artists ? event.artists.map(a => typeof a === 'object' ? a.name : a).join(', ') : 'No artists'}`);
      console.log(`   Personal Score: ${event.personalizedScore || 'No score'}`);
      console.log(`   Scoring Method: ${event.scoringMethod || 'Unknown'}`);
      console.log(`   Phase 1 Applied: ${event.phase1Applied || false}`);
      
      if (event.scoreBreakdown) {
        console.log(`   Score Breakdown:`, JSON.stringify(event.scoreBreakdown, null, 2));
      }
      
      // Analyze why this got scored
      const eventText = (event.name + ' ' + (event.description || '')).toLowerCase();
      const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'club', 'party', 'live music', 'band', 'artist', 'performance'];
      const nonMusicKeywords = ['admission', 'general admission', 'tour', 'museum', 'exhibition', 'history', 'castle', 'historic', 'visit', 'sightseeing'];
      
      const musicMatches = musicKeywords.filter(word => eventText.includes(word));
      const nonMusicMatches = nonMusicKeywords.filter(word => eventText.includes(word));
      
      console.log(`   Music keywords found: [${musicMatches.join(', ')}]`);
      console.log(`   Non-music keywords found: [${nonMusicMatches.join(', ')}]`);
      console.log(`   Is likely music event: ${musicMatches.length > nonMusicMatches.length}`);
      console.log('   ─────────────────────────────────────────────────────────\n');
    }
    
    // Also analyze some high-scoring music events for comparison
    console.log('\n🎵 Analyzing high-scoring music events for comparison...\n');
    
    const musicEvents = await eventsCollection.find({
      $and: [
        { personalizedScore: { $gte: 70 } },
        {
          $or: [
            { name: { $regex: /dj|music|concert|festival|electronic|house|techno|edm|dance|bass|club|party/i } },
            { description: { $regex: /dj|music|concert|festival|electronic|house|techno|edm|dance|bass|club|party/i } }
          ]
        }
      ]
    }).limit(3).toArray();
    
    for (const event of musicEvents) {
      console.log(`🎵 Music Event: "${event.name}"`);
      console.log(`   Score: ${event.personalizedScore}`);
      console.log(`   Genres: ${event.genres ? event.genres.join(', ') : 'No genres'}`);
      console.log(`   Artists: ${event.artists ? event.artists.map(a => typeof a === 'object' ? a.name : a).join(', ') : 'No artists'}`);
      console.log(`   Method: ${event.scoringMethod || 'Unknown'}`);
      console.log('   ─────────────────────────────────────────────────────────\n');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the analysis
analyzeMatchScores().catch(console.error);
