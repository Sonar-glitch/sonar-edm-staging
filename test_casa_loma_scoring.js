// Test Casa Loma Scoring Fix
// Tests the updated phase1_event_enhancer.js logic

const { MongoClient } = require('mongodb');

// Import the enhancer class
const Phase1EventEnhancer = require('./phase1_event_enhancer');

async function testCasaLomaScoring() {
  console.log('🧪 Testing Casa Loma Scoring Fix\n');
  
  // Create enhancer instance
  const enhancer = new Phase1EventEnhancer();
  
  // Test events
  const testEvents = [
    {
      name: "Casa Loma General Admission",
      description: "",
      venue: "Casa Loma",
      artists: [],
      genres: undefined
    },
    {
      name: "Sunset Concerts at Casa Loma w/ Deborah Cox",
      description: "",
      venue: "Casa Loma", 
      artists: ["Deborah Cox"],
      genres: ["Other"]
    },
    {
      name: "Museum Exhibition Opening",
      description: "Historic art exhibition",
      venue: "Art Gallery",
      artists: [],
      genres: undefined
    },
    {
      name: "Electronic Music Festival",
      description: "EDM festival with top DJs",
      venue: "Festival Grounds",
      artists: ["DJ Snake", "Skrillex"],
      genres: ["Electronic", "EDM"]
    }
  ];
  
  console.log('🔍 Testing music event detection:\n');
  
  for (const event of testEvents) {
    const isMusic = enhancer.detectMusicEvent(event);
    const score = enhancer.calculatePersonalizedScore(event, [], []);
    
    console.log(`📋 Event: "${event.name}"`);
    console.log(`   Venue: ${event.venue}`);
    console.log(`   Is Music Event: ${isMusic ? '✅' : '❌'}`);
    console.log(`   Score: ${score}%`);
    console.log(`   Expected: ${getExpectedScore(event.name)}`);
    console.log('   ─────────────────────────────────────\n');
  }
  
  // Test with real database data
  console.log('🔍 Testing with real Casa Loma events from database:\n');
  
  let client;
  try {
    client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
    await client.connect();
    
    const db = client.db('test');
    const eventsCollection = db.collection('events_unified');
    
    const casaLomaEvents = await eventsCollection.find({
      name: { $regex: /casa loma/i }
    }).limit(5).toArray();
    
    for (const event of casaLomaEvents) {
      const isMusic = enhancer.detectMusicEvent(event);
      const score = enhancer.calculatePersonalizedScore(event, [], []);
      
      console.log(`📋 Real Event: "${event.name}"`);
      console.log(`   Venue: ${typeof event.venue === 'object' ? event.venue?.name : event.venue}`);
      console.log(`   Is Music Event: ${isMusic ? '✅' : '❌'}`);
      console.log(`   New Score: ${score}%`);
      console.log(`   Old personalizedScore: ${event.personalizedScore || 'None'}`);
      console.log('   ─────────────────────────────────────\n');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

function getExpectedScore(eventName) {
  if (eventName.includes('General Admission') && !eventName.includes('Concert')) {
    return '5-15% (Non-music venue tour)';
  } else if (eventName.includes('Concert') || eventName.includes('Festival')) {
    return '50-85% (Music event)';
  } else if (eventName.includes('Museum') || eventName.includes('Exhibition')) {
    return '5-15% (Cultural, non-music)';
  }
  return 'Variable based on content';
}

// Run the test
testCasaLomaScoring().catch(console.error);
