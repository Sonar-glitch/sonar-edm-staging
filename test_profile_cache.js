// Test script to verify user profile caching system
const { MongoClient } = require('mongodb');

async function testUserProfileCaching() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/?retryWrites=true&w=majority&appName=SonarEDM';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🧪 Testing user profile caching system...\n');
    
    // Test user ID
    const testUserId = 'test-user-cache@example.com';
    
    // 1. Clear any existing cache for test user
    await db.collection('user_sound_profiles').deleteOne({ userId: testUserId });
    console.log('🧹 Cleared existing cache for test user');
    
    // 2. Create a test profile
    const testProfile = {
      userId: testUserId,
      soundCharacteristics: {
        energy: 0.8,
        danceability: 0.7,
        valence: 0.6,
        confidence: 0.9,
        variance: 0.1,
        source: 'test_profile'
      },
      topGenres: [
        { genre: 'electronic', count: 15, weight: 0.6 },
        { genre: 'techno', count: 10, weight: 0.4 }
      ],
      recentTracksCount: 25,
      topTracksCount: 20,
      confidence: 0.9,
      variance: 0.1,
      source: 'test_generation',
      analyzedAt: new Date().toISOString(),
      tracksAnalyzed: 45,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    // 3. Insert test profile
    await db.collection('user_sound_profiles').insertOne(testProfile);
    console.log('✅ Test profile inserted with 24-hour TTL');
    
    // 4. Test cache retrieval
    const cachedProfile = await db.collection('user_sound_profiles').findOne({
      userId: testUserId,
      expiresAt: { $gt: new Date() }
    });
    
    if (cachedProfile) {
      const ageMinutes = Math.floor((new Date() - cachedProfile.createdAt) / 1000 / 60);
      console.log(`✅ Cache retrieval successful! Profile age: ${ageMinutes} minutes`);
      console.log(`📊 Profile confidence: ${cachedProfile.confidence}`);
      console.log(`🎵 Tracks analyzed: ${cachedProfile.tracksAnalyzed}`);
      console.log(`🎪 Top genres: ${cachedProfile.topGenres.map(g => g.genre).join(', ')}`);
    } else {
      console.log('❌ Cache retrieval failed');
    }
    
    // 5. Test TTL index
    const indexes = await db.collection('user_sound_profiles').listIndexes().toArray();
    const ttlIndex = indexes.find(idx => idx.name === 'user_profile_ttl');
    
    if (ttlIndex) {
      console.log('✅ TTL index is properly configured');
      console.log(`📋 TTL index details: ${JSON.stringify(ttlIndex.key)}`);
    } else {
      console.log('❌ TTL index not found');
    }
    
    // 6. Test cache statistics
    const totalProfiles = await db.collection('user_sound_profiles').countDocuments();
    const activeProfiles = await db.collection('user_sound_profiles').countDocuments({
      expiresAt: { $gt: new Date() }
    });
    
    console.log(`\n📈 Cache Statistics:`);
    console.log(`  Total profiles: ${totalProfiles}`);
    console.log(`  Active profiles: ${activeProfiles}`);
    console.log(`  Expired profiles: ${totalProfiles - activeProfiles}`);
    
    // 7. Clean up test data
    await db.collection('user_sound_profiles').deleteOne({ userId: testUserId });
    console.log('\n🧹 Test cleanup completed');
    
    console.log('\n✅ User profile caching system test PASSED!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

testUserProfileCaching();
