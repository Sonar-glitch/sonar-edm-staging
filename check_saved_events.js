const { MongoClient } = require('mongodb');

async function checkDatabases() {
  const uri = process.env.MONGODB_URI;
  console.log('🔍 Checking saved events across all databases...');
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    const databases = ['test', 'sonar_edm', 'sonar_edm_db'];
    
    for (const dbName of databases) {
      try {
        const db = client.db(dbName);
        
        // Check interested_events collection
        const interestedCount = await db.collection('interested_events').countDocuments();
        console.log(`${dbName}.interested_events: ${interestedCount} documents`);
        
        // Check user_interested_events collection
        const userInterestedCount = await db.collection('user_interested_events').countDocuments();
        console.log(`${dbName}.user_interested_events: ${userInterestedCount} documents`);
        
        // If we find any, show a sample
        if (interestedCount > 0) {
          const sample = await db.collection('interested_events').findOne({});
          console.log(`Sample from ${dbName}.interested_events:`, {
            userId: sample.userId,
            eventId: sample.eventId,
            source: sample.source,
            name: sample.name || 'No name'
          });
        }
        
        if (userInterestedCount > 0) {
          const sample = await db.collection('user_interested_events').findOne({});
          console.log(`Sample from ${dbName}.user_interested_events:`, {
            userEmail: sample.userEmail,
            eventsCount: sample.events ? sample.events.length : 0
          });
        }
        
      } catch (error) {
        console.log(`❌ Error checking ${dbName}: ${error.message}`);
      }
    }
    
    await client.close();
    console.log('✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

checkDatabases();

