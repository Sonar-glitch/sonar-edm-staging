#!/usr/bin/env node
process.env.MONGODB_URI = 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM';

const { MongoClient } = require('mongodb');
const path = require('path');

// Load the enhanced recommendationEnhancer
const enhancerPath = path.join(__dirname, '../../heroku-workers/event-population/lib/recommendationEnhancer.js');
const RecommendationEnhancer = require(enhancerPath);

async function testGenreDetection() {
  console.log('🧪 TESTING GENRE DETECTION FIX');
  console.log('==============================');
  
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('test');
  const collection = db.collection('events_unified');
  
  // Get a sample event that has artists
  const sampleEvent = await collection.findOne({ 
    name: "Don Diablo"
  });
  
  if (!sampleEvent) {
    console.log('❌ No test event found');
    return;
  }
  
  console.log(`\n🎯 Testing event: ${sampleEvent.name}`);
  console.log(`Original artists:`, sampleEvent.artists);
  
  // Test enhancement
  const enhancer = new RecommendationEnhancer();
  
  // Create a clean copy with proper artist structure
  const testEvent = {
    ...sampleEvent,
    artists: ['don diablo'] // Reset to simple string array for testing
  };
  
  console.log(`\n🔄 Testing with clean artist array:`, testEvent.artists);
  
  try {
    const enhancedEvent = await enhancer.enhanceEventWithArtistData(testEvent);
    
    console.log(`\n✅ Enhancement results:`);
    console.log(`Genre: ${enhancedEvent.genre || 'none'}`);
    console.log(`Genres: ${JSON.stringify(enhancedEvent.genres || [])}`);
    console.log(`Primary Genre: ${enhancedEvent.primaryGenre || 'none'}`);
    console.log(`Artists type:`, typeof enhancedEvent.artists);
    console.log(`Artists length:`, enhancedEvent.artists?.length);
    
    if (enhancedEvent.artists && enhancedEvent.artists.length > 0) {
      console.log(`First artist:`, enhancedEvent.artists[0]);
      console.log(`First artist type:`, typeof enhancedEvent.artists[0]);
    }
    
  } catch (error) {
    console.error(`❌ Enhancement failed:`, error.message);
  }
  
  await client.close();
}

testGenreDetection().catch(console.error);
