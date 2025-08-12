// Check database for specific events
const { MongoClient } = require('mongodb');

async function checkSpecificEvents() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb+srv://sonar:NqcOhA0K4YMI0uOm@cluster0.3zn5s.mongodb.net');
    await client.connect();
    const db = client.db('tiko_development');
    
    console.log('🔍 Searching for specific events in database...\n');
    
    // Search for Hernan Cattaneo
    const hernanEvents = await db.collection('events_unified').find({
      $or: [
        { name: { $regex: 'hernan', $options: 'i' } },
        { name: { $regex: 'cattaneo', $options: 'i' } },
        { url: { $regex: '13823584' } },
        { ticketUrl: { $regex: '13823584' } }
      ]
    }).toArray();
    
    console.log('=== HERNAN CATTANEO SEARCH ===');
    console.log('Events found:', hernanEvents.length);
    hernanEvents.forEach((e, i) => {
      console.log(`${i+1}. "${e.name}"`);
      console.log(`   Score: ${e.personalizedScore || 'No score'}%`);
      console.log(`   Venue: ${typeof e.venue === 'object' ? e.venue?.name : e.venue}`);
      console.log(`   URL: ${e.url || e.ticketUrl || 'No URL'}`);
      console.log(`   Music Type: ${e.musicType || 'Unknown'}`);
      if (e.personalizedScore) {
        console.log(`   ✅ Score Analysis: ${e.personalizedScore}% (${e.personalizedScore > 60 ? 'High' : e.personalizedScore > 30 ? 'Medium' : 'Low'})`);
      }
      console.log('');
    });
    
    // Search for Kream
    const kreamEvents = await db.collection('events_unified').find({
      $or: [
        { name: { $regex: 'kream', $options: 'i' } },
        { url: { $regex: '14379933' } },
        { ticketUrl: { $regex: '14379933' } }
      ]
    }).toArray();
    
    console.log('=== KREAM SEARCH ===');
    console.log('Events found:', kreamEvents.length);
    kreamEvents.forEach((e, i) => {
      console.log(`${i+1}. "${e.name}"`);
      console.log(`   Score: ${e.personalizedScore || 'No score'}%`);
      console.log(`   Venue: ${typeof e.venue === 'object' ? e.venue?.name : e.venue}`);
      console.log(`   URL: ${e.url || e.ticketUrl || 'No URL'}`);
      console.log(`   Music Type: ${e.musicType || 'Unknown'}`);
      if (e.personalizedScore) {
        console.log(`   ✅ Score Analysis: ${e.personalizedScore}% (${e.personalizedScore > 60 ? 'High' : e.personalizedScore > 30 ? 'Medium' : 'Low'})`);
      }
      console.log('');
    });
    
    // Also search for similar electronic/techno events for comparison
    console.log('=== SIMILAR ELECTRONIC EVENTS (FOR COMPARISON) ===');
    const electronicEvents = await db.collection('events_unified').find({
      $and: [
        { personalizedScore: { $exists: true, $ne: null } },
        {
          $or: [
            { name: { $regex: 'techno|house|electronic|dj', $options: 'i' } },
            { musicType: { $regex: 'electronic|techno|house', $options: 'i' } }
          ]
        }
      ]
    }).limit(5).toArray();
    
    console.log('Electronic events found:', electronicEvents.length);
    electronicEvents.forEach((e, i) => {
      console.log(`${i+1}. "${e.name}"`);
      console.log(`   Score: ${e.personalizedScore}% (${e.personalizedScore > 60 ? 'High' : e.personalizedScore > 30 ? 'Medium' : 'Low'})`);
      console.log(`   Venue: ${typeof e.venue === 'object' ? e.venue?.name : e.venue}`);
      console.log(`   Music Type: ${e.musicType || 'Unknown'}`);
      console.log('');
    });
    
    await client.close();
    
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
}

checkSpecificEvents();
