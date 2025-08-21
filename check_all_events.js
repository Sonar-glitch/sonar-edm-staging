const { MongoClient } = require('mongodb');

async function checkEvents() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected successfully');
    
    const db = client.db('test'); // ✅ CORRECT: Using 'test' database as per project docs
    
    // Get all events with scores
    const events = await db.collection('events_unified')
      .find({personalizedScore: {$exists: true}})
      .sort({personalizedScore: -1})
      .limit(10)
      .toArray();
    
    console.log('\n=== TOP 10 EVENTS BY SCORE ===');
    events.forEach((event, i) => {
      console.log(`${i+1}. "${event.name}" - Score: ${event.personalizedScore}%`);
      console.log(`   Venue: ${typeof event.venue === 'object' ? event.venue?.name : event.venue}`);
      console.log(`   Location: ${typeof event.location === 'object' ? event.location?.city : event.location}`);
      console.log(`   Artists: ${event.artists ? event.artists.length : 0}`);
      console.log(`   Genres: ${event.genres ? event.genres.join(', ') : 'None'}`);
      console.log('');
    });
    
    // Look for any admission events
    const admissionEvents = await db.collection('events_unified')
      .find({name: /admission|general/i})
      .limit(5)
      .toArray();
    
    console.log('\n=== ADMISSION EVENTS ===');
    admissionEvents.forEach((event, i) => {
      console.log(`${i+1}. "${event.name}" - Score: ${event.personalizedScore}%`);
      
      // Analyze this event
      const eventText = (event.name || '').toLowerCase();
      const eventDescription = (event.description || '').toLowerCase();
      const fullEventText = eventText + ' ' + eventDescription;
      
      const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'club', 'party', 'live music', 'band', 'artist', 'performance'];
      const nonMusicKeywords = ['admission', 'general admission', 'tour', 'museum', 'exhibition', 'history', 'castle', 'historic', 'visit', 'sightseeing'];
      
      const musicMatches = musicKeywords.filter(word => fullEventText.includes(word));
      const nonMusicMatches = nonMusicKeywords.filter(word => fullEventText.includes(word));
      
      console.log(`   Text: "${fullEventText}"`);
      console.log(`   Music keywords: [${musicMatches.join(', ')}]`);
      console.log(`   Non-music keywords: [${nonMusicMatches.join(', ')}]`);
      console.log(`   Is music event: ${musicMatches.length > nonMusicMatches.length}`);
      console.log('');
    });
    
    await client.close();
    console.log('Database connection closed');
    
  } catch (err) {
    console.log('Error:', err.message);
    console.log('Stack:', err.stack);
  }
}

checkEvents();
