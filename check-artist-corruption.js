const { MongoClient } = require('mongodb');

async function checkArtistCorruption() {
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  
  console.log('=== ARTIST DATA CORRUPTION ANALYSIS ===');
  
  // Get sample events with artist data
  const events = await db.collection('events_unified').find({
    artists: { $exists: true, $ne: [] }
  }).limit(10).toArray();
  
  let stringArtists = 0;
  let objectArtists = 0;
  let emptyArtists = 0;
  let totalEvents = events.length;
  
  console.log(`\nAnalyzing ${totalEvents} events with artist data...\n`);
  
  events.forEach((event, i) => {
    console.log(`[${i+1}] ${event.name}`);
    console.log(`    Artists field:`, event.artists);
    console.log(`    Type: ${typeof event.artists}, Length: ${event.artists?.length || 0}`);
    
    if (!event.artists || event.artists.length === 0) {
      emptyArtists++;
      console.log(`    Status: ❌ EMPTY`);
    } else {
      const firstArtist = event.artists[0];
      console.log(`    First artist type: ${typeof firstArtist}`);
      console.log(`    First artist constructor: ${firstArtist?.constructor?.name || 'unknown'}`);
      
      if (typeof firstArtist === 'string') {
        stringArtists++;
        console.log(`    Status: ✅ CLEAN (string array)`);
        console.log(`    Artists: ${event.artists.slice(0, 3).join(', ')}`);
      } else if (typeof firstArtist === 'object') {
        objectArtists++;
        console.log(`    Status: ❌ CORRUPTED (object array)`);
        console.log(`    Object keys: ${Object.keys(firstArtist).join(', ')}`);
        
        // Try to extract name
        const possibleName = firstArtist.name || firstArtist.artistName || firstArtist._id || firstArtist.id;
        console.log(`    Possible name: ${possibleName}`);
      }
    }
    console.log('');
  });
  
  console.log('=== SUMMARY ===');
  console.log(`Total events analyzed: ${totalEvents}`);
  console.log(`String artists (clean): ${stringArtists} (${((stringArtists/totalEvents)*100).toFixed(1)}%)`);
  console.log(`Object artists (corrupted): ${objectArtists} (${((objectArtists/totalEvents)*100).toFixed(1)}%)`);
  console.log(`Empty artists: ${emptyArtists} (${((emptyArtists/totalEvents)*100).toFixed(1)}%)`);
  
  // Check total database stats
  const totalEventsInDB = await db.collection('events_unified').countDocuments();
  const eventsWithArtists = await db.collection('events_unified').countDocuments({
    artists: { $exists: true, $ne: [] }
  });
  
  console.log(`\n=== DATABASE STATS ===`);
  console.log(`Total events in DB: ${totalEventsInDB.toLocaleString()}`);
  console.log(`Events with artists: ${eventsWithArtists.toLocaleString()} (${((eventsWithArtists/totalEventsInDB)*100).toFixed(1)}%)`);
  
  await client.close();
}

checkArtistCorruption().catch(console.error);
