// Casa Loma Event Analysis - CORRECTED DATABASE
const { MongoClient } = require('mongodb');

async function analyzeCasaLomaEvent() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');
    
    // Use the correct database name from MONGODB_DB config var
    const db = client.db(process.env.MONGODB_DB || 'test');
    console.log('Using database:', process.env.MONGODB_DB || 'test');
    
    // Check what collections exist
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(col => console.log('- ' + col.name));
    
    // Try different possible collection names
    const possibleCollections = ['events', 'events_unified', 'event', 'concerts'];
    
    for (const collName of possibleCollections) {
      try {
        const collection = db.collection(collName);
        const count = await collection.countDocuments();
        console.log(`\n📊 Collection "${collName}": ${count} documents`);
        
        if (count > 0) {
          // Search for Casa Loma events
          const casaLomaEvents = await collection.find({
            $or: [
              { name: { $regex: /casa loma/i } },
              { title: { $regex: /casa loma/i } },
              { venue: { $regex: /casa loma/i } },
              { location: { $regex: /casa loma/i } }
            ]
          }).toArray();
          
          console.log(`🏰 Casa Loma events in "${collName}": ${casaLomaEvents.length}`);
          
          if (casaLomaEvents.length > 0) {
            casaLomaEvents.forEach((event, index) => {
              console.log(`\n📅 Casa Loma Event ${index + 1}:`);
              console.log('Name:', event.name || event.title);
              console.log('Description:', event.description?.substring(0, 100) + '...');
              console.log('Venue:', event.venue);
              console.log('Location:', event.location);
              console.log('Genres:', event.genres);
              console.log('Artists:', event.artists);
              console.log('Date:', event.date);
              console.log('Score:', event.personalizedScore);
              
              // Analyze why it might get a high score
              console.log('\n🔍 Score Analysis:');
              const eventText = ((event.name || '') + ' ' + (event.description || '')).toLowerCase();
              const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'club', 'party'];
              const nonMusicKeywords = ['admission', 'general admission', 'tour', 'museum', 'exhibition', 'history', 'castle', 'historic'];
              
              const musicMatches = musicKeywords.filter(word => eventText.includes(word));
              const nonMusicMatches = nonMusicKeywords.filter(word => eventText.includes(word));
              
              console.log('Music keywords found:', musicMatches);
              console.log('Non-music keywords found:', nonMusicMatches);
              console.log('Event text sample:', eventText.substring(0, 200));
            });
          }
          
          // Show a few sample events from this collection
          const sampleEvents = await collection.find({}).limit(3).toArray();
          console.log(`\n📝 Sample events from "${collName}":`);
          sampleEvents.forEach((event, i) => {
            console.log(`${i + 1}. ${event.name || event.title} - Score: ${event.personalizedScore || 'N/A'}`);
          });
        }
      } catch (err) {
        console.log(`❌ Error accessing collection "${collName}":`, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

analyzeCasaLomaEvent().catch(console.error);
