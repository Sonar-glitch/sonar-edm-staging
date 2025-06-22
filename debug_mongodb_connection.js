// Debug script to test MongoDB connection and query
const { MongoClient } = require('mongodb');

async function debugMongoConnection() {
  console.log('🔍 MONGODB CONNECTION DEBUG');
  console.log('===========================');
  
  // Check environment variables
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || 'test';
  
  console.log('📋 Environment Variables:');
  console.log(`MONGODB_URI: ${MONGODB_URI ? 'SET' : 'NOT SET'}`);
  console.log(`MONGODB_DB: ${MONGODB_DB}`);
  
  if (!MONGODB_URI) {
    console.log('❌ MONGODB_URI not set');
    return;
  }
  
  try {
    console.log('\n🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ Connected successfully');
    
    const db = client.db(MONGODB_DB);
    console.log(`📊 Using database: ${MONGODB_DB}`);
    
    // List all collections
    console.log('\n📋 Collections in database:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check events collection specifically
    const eventsCollection = db.collection('events');
    const eventCount = await eventsCollection.countDocuments();
    console.log(`\n📊 Events collection: ${eventCount} documents`);
    
    if (eventCount > 0) {
      console.log('\n🎯 Sample events:');
      const sampleEvents = await eventsCollection.find({}).limit(3).toArray();
      sampleEvents.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.name} (source: ${event.source})`);
      });
      
      // Test the exact query from the API
      console.log('\n🔍 Testing API query (Toronto area):');
      const latitude = 43.65;
      const longitude = -79.38;
      const radiusInMeters = 50 * 1000;
      
      const mongoEvents = await eventsCollection.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusInMeters
          }
        },
        date: { $gte: new Date() },
        status: { $ne: 'cancelled' }
      })
      .limit(50)
      .sort({ date: 1 })
      .toArray();
      
      console.log(`📍 Found ${mongoEvents.length} events in Toronto area`);
      
      if (mongoEvents.length > 0) {
        console.log('🎯 Sample Toronto events:');
        mongoEvents.slice(0, 3).forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.name} at ${event.venue?.name || 'Unknown venue'}`);
        });
      }
    }
    
    await client.close();
    console.log('\n✅ Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugMongoConnection().catch(console.error);

