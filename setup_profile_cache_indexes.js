// MongoDB TTL Index Setup for User Profile Caching
// Run this script once to set up the TTL index

const { MongoClient } = require('mongodb');

async function setupTTLIndexes() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/?retryWrites=true&w=majority&appName=SonarEDM';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔧 Setting up TTL indexes for user profile caching...');
    
    // Create TTL index on user_sound_profiles collection
    await db.collection('user_sound_profiles').createIndex(
      { "expiresAt": 1 },
      { expireAfterSeconds: 0, name: "user_profile_ttl" }
    );
    
    console.log('✅ TTL index created on user_sound_profiles.expiresAt');
    
    // Create index on userId for fast lookups
    await db.collection('user_sound_profiles').createIndex(
      { "userId": 1 },
      { unique: true, name: "user_profile_userId" }
    );
    
    console.log('✅ Unique index created on user_sound_profiles.userId');
    
    // Check existing indexes
    const indexes = await db.collection('user_sound_profiles').listIndexes().toArray();
    console.log('📋 Current indexes on user_sound_profiles:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up TTL indexes:', error);
  } finally {
    await client.close();
  }
}

setupTTLIndexes();
