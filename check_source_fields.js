const { MongoClient } = require('mongodb');

async function checkSourceFields() {
  console.log('🔍 CHECKING SOURCE FIELDS IN DATABASE');
  console.log('====================================');
  
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || 'test';
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const eventsCollection = db.collection('events');
    
    // Check how many events have source field
    const withSource = await eventsCollection.countDocuments({source: {$exists: true}});
    console.log(`Events with source field: ${withSource}`);
    
    // Check how many have Ticketmaster source
    const withTicketmaster = await eventsCollection.countDocuments({source: 'Ticketmaster'});
    console.log(`Events with Ticketmaster source: ${withTicketmaster}`);
    
    // Check most recent event
    const recent = await eventsCollection.find({}).sort({lastFetchedAt: -1}).limit(1).toArray();
    console.log(`Most recent event source: ${recent[0]?.source || 'undefined'}`);
    console.log(`Most recent event lastFetchedAt: ${recent[0]?.lastFetchedAt || 'undefined'}`);
    
    // Check a few sample events with source field
    if (withSource > 0) {
      console.log('\nSample events with source field:');
      const samples = await eventsCollection.find({source: {$exists: true}}).limit(3).toArray();
      samples.forEach((event, i) => {
        console.log(`  ${i+1}. ${event.name} - source: ${event.source}`);
      });
    }
    
    await client.close();
    console.log('\n✅ Check complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSourceFields().catch(console.error);
