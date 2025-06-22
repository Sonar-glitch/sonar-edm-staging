// Targeted debug script to isolate the exact query issue
const { MongoClient } = require('mongodb');

async function debugQueryIssue() {
  console.log('🔍 TARGETED QUERY DEBUG');
  console.log('=======================');
  
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || 'test';
  
  console.log(`📊 Using database: ${MONGODB_DB}`);
  
  if (!MONGODB_URI) {
    console.log('❌ MONGODB_URI not set');
    return;
  }
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const eventsCollection = db.collection('events');
    
    console.log('\n📊 BASIC COLLECTION INFO:');
    const totalCount = await eventsCollection.countDocuments();
    console.log(`Total events: ${totalCount}`);
    
    // Test 1: Sample event structure
    console.log('\n🔍 TEST 1: Sample event structure');
    const sampleEvent = await eventsCollection.findOne({});
    if (sampleEvent) {
      console.log('Sample event fields:');
      console.log(`- _id: ${sampleEvent._id}`);
      console.log(`- name: ${sampleEvent.name}`);
      console.log(`- date: ${sampleEvent.date} (type: ${typeof sampleEvent.date})`);
      console.log(`- status: ${sampleEvent.status}`);
      console.log(`- location: ${JSON.stringify(sampleEvent.location)}`);
      console.log(`- venue: ${JSON.stringify(sampleEvent.venue)}`);
    }
    
    // Test 2: Date filter
    console.log('\n🔍 TEST 2: Date filter');
    const now = new Date();
    console.log(`Current date: ${now}`);
    
    const futureEvents = await eventsCollection.countDocuments({
      date: { $gte: now }
    });
    console.log(`Events with date >= now: ${futureEvents}`);
    
    const allDates = await eventsCollection.find({}, { date: 1 }).limit(5).toArray();
    console.log('Sample dates in collection:');
    allDates.forEach((event, i) => {
      console.log(`  ${i+1}. ${event.date} (type: ${typeof event.date})`);
    });
    
    // Test 3: Status filter
    console.log('\n🔍 TEST 3: Status filter');
    const statusCounts = await eventsCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Status distribution:');
    statusCounts.forEach(item => {
      console.log(`  ${item._id || 'null'}: ${item.count}`);
    });
    
    const nonCancelledEvents = await eventsCollection.countDocuments({
      status: { $ne: 'cancelled' }
    });
    console.log(`Events with status != 'cancelled': ${nonCancelledEvents}`);
    
    // Test 4: Combined date + status filter
    console.log('\n🔍 TEST 4: Combined date + status filter');
    const dateStatusEvents = await eventsCollection.countDocuments({
      date: { $gte: now },
      status: { $ne: 'cancelled' }
    });
    console.log(`Events with date >= now AND status != 'cancelled': ${dateStatusEvents}`);
    
    // Test 5: Location structure analysis
    console.log('\n🔍 TEST 5: Location structure analysis');
    const locationSamples = await eventsCollection.find({
      location: { $exists: true }
    }, { location: 1, name: 1 }).limit(3).toArray();
    
    console.log('Sample location structures:');
    locationSamples.forEach((event, i) => {
      console.log(`  ${i+1}. ${event.name}`);
      console.log(`     location: ${JSON.stringify(event.location)}`);
    });
    
    // Test 6: Simple geospatial query (without date/status filters)
    console.log('\n🔍 TEST 6: Simple geospatial query');
    const latitude = 43.65;
    const longitude = -79.38;
    const radiusInMeters = 50 * 1000;
    
    try {
      const geoEvents = await eventsCollection.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusInMeters
          }
        }
      }).limit(10).toArray();
      
      console.log(`Geospatial query (no filters): ${geoEvents.length} events`);
      if (geoEvents.length > 0) {
        console.log('Sample geo events:');
        geoEvents.slice(0, 3).forEach((event, i) => {
          console.log(`  ${i+1}. ${event.name}`);
        });
      }
    } catch (geoError) {
      console.log(`❌ Geospatial query failed: ${geoError.message}`);
    }
    
    // Test 7: Full API query
    console.log('\n🔍 TEST 7: Full API query (exact replica)');
    try {
      const fullQuery = await eventsCollection.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusInMeters
          }
        },
        date: { $gte: now },
        status: { $ne: 'cancelled' }
      })
      .limit(50)
      .sort({ date: 1 })
      .toArray();
      
      console.log(`Full API query: ${fullQuery.length} events`);
      if (fullQuery.length > 0) {
        console.log('Sample results:');
        fullQuery.slice(0, 3).forEach((event, i) => {
          console.log(`  ${i+1}. ${event.name} - ${event.date}`);
        });
      }
    } catch (fullError) {
      console.log(`❌ Full query failed: ${fullError.message}`);
    }
    
    await client.close();
    console.log('\n✅ Debug complete');
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

debugQueryIssue().catch(console.error);

