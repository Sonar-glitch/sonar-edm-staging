const { MongoClient } = require('mongodb');

async function checkCasaLoma() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected successfully');
    
    const db = client.db('tiko_development');
    
    // Look for Casa Loma event
    const event = await db.collection('events_unified').findOne({name: /Casa Loma/i});
    
    if (event) {
      console.log('\n=== CASA LOMA EVENT ANALYSIS ===');
      console.log('Name:', event.name);
      console.log('Description:', event.description || 'No description');
      console.log('Venue:', event.venue);
      console.log('Artists:', event.artists);
      console.log('Genres:', event.genres);
      console.log('Categories:', event.categories);
      console.log('Date:', event.date);
      console.log('Personalized Score:', event.personalizedScore);
      console.log('Location:', event.location);
      
      // Check if it has music keywords
      const eventText = (event.name || '').toLowerCase();
      const eventDescription = (event.description || '').toLowerCase();
      const fullEventText = eventText + ' ' + eventDescription;
      
      const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'club', 'party', 'live music', 'band', 'artist', 'performance'];
      const nonMusicKeywords = ['admission', 'general admission', 'tour', 'museum', 'exhibition', 'history', 'castle', 'historic', 'visit', 'sightseeing'];
      
      const musicMatches = musicKeywords.filter(word => fullEventText.includes(word));
      const nonMusicMatches = nonMusicKeywords.filter(word => fullEventText.includes(word));
      
      console.log('\n=== MUSIC DETECTION ANALYSIS ===');
      console.log('Event text analyzed:', fullEventText);
      console.log('Music keywords found:', musicMatches);
      console.log('Non-music keywords found:', nonMusicMatches);
      console.log('Is likely music event:', musicMatches.length > nonMusicMatches.length);
      
    } else {
      console.log('Casa Loma event not found');
      
      // Check for similar events
      const similar = await db.collection('events_unified').find({name: /casa|loma/i}).limit(5).toArray();
      console.log('Similar events found:', similar.length);
      similar.forEach(e => console.log('- ' + e.name + ' (Score: ' + e.personalizedScore + ')'));
    }
    
    await client.close();
    console.log('Database connection closed');
    
  } catch (err) {
    console.log('Error:', err.message);
    console.log('Stack:', err.stack);
  }
}

checkCasaLoma();
