const { MongoClient } = require('mongodb');

async function checkAllCollections() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    console.log('🔍 COMPREHENSIVE DATABASE CHECK...');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS ===');
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      console.log(`${collectionName}: ${count} documents`);
      
      // Sample a few documents from each collection
      if (count > 0) {
        const sample = await db.collection(collectionName).findOne();
        console.log(`  Sample keys: ${Object.keys(sample).join(', ')}`);
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllCollections();
