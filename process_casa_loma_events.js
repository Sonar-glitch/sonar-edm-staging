// Process Casa Loma Events Specifically
// Uses the fixed RecommendationEnhancer to score Casa Loma events

const { MongoClient } = require('mongodb');

async function processCasaLomaEvents() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('test');
    const eventsCollection = db.collection('events_unified');
    
    // Find Casa Loma events specifically
    const casaLomaEvents = await eventsCollection.find({
      name: { $regex: /casa loma/i },
      personalizedScore: { $exists: false }
    }).toArray();
    
    console.log(`📊 Found ${casaLomaEvents.length} Casa Loma events to score`);
    
    let successCount = 0;
    
    for (const event of casaLomaEvents) {
      try {
        // Apply our music detection logic
        const personalizedScore = calculateScore(event);
        
        // Update the event in database
        await eventsCollection.updateOne(
          { _id: event._id },
          { 
            $set: { 
              personalizedScore: personalizedScore,
              scoringMethod: 'music_detection_v2',
              scoringTimestamp: new Date(),
              scoringVersion: '2.0.0'
            }
          }
        );
        
        successCount++;
        console.log(`✅ Scored: "${event.name}" -> ${personalizedScore}% (${event.venue})`);
        
      } catch (error) {
        console.warn(`⚠️ Failed to score "${event.name}":`, error.message);
      }
    }
    
    console.log(`\n🎯 Casa Loma scoring complete: ${successCount}/${casaLomaEvents.length} events scored`);
    
    // Verify results
    console.log('\n🔍 Verification - Casa Loma events after scoring:');
    const verifyEvents = await eventsCollection.find({
      name: { $regex: /casa loma/i }
    }).toArray();
    
    for (const event of verifyEvents) {
      console.log(`📋 "${event.name}": ${event.personalizedScore}% (${event.scoringMethod || 'No method'})`);
    }
    
  } catch (error) {
    console.error('❌ Processing failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

function calculateScore(event) {
  const eventText = (event.name + ' ' + (event.description || '')).toLowerCase();
  const venueName = (typeof event.venue === 'object' ? event.venue?.name : event.venue || '').toLowerCase();
  const fullText = eventText + ' ' + venueName;
  
  const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 
                        'dance', 'bass', 'club', 'party', 'live music', 'band', 'artist', 'performance', 
                        'tour', 'show', 'live'];
  
  const nonMusicKeywords = ['admission', 'general admission', 'museum', 'exhibition', 'castle', 
                           'historic', 'tour', 'visit', 'sightseeing', 'gallery'];
  
  const musicMatches = musicKeywords.filter(word => fullText.includes(word));
  const nonMusicMatches = nonMusicKeywords.filter(word => fullText.includes(word));
  
  console.log(`   🔍 "${event.name}": Music=[${musicMatches.join(', ')}] NonMusic=[${nonMusicMatches.join(', ')}]`);
  
  // Special handling for "general admission" - only non-music if no music context
  const hasGeneralAdmission = fullText.includes('general admission');
  if (hasGeneralAdmission && musicMatches.length === 0) {
    console.log(`   🚫 Non-music: General admission without music context`);
    return Math.floor(Math.random() * 11) + 5; // Random 5-15%
  }
  
  // Return true if more music keywords than non-music keywords
  const isMusicEvent = musicMatches.length > nonMusicMatches.length;
  
  if (!isMusicEvent) {
    console.log(`   🚫 Non-music: More non-music keywords`);
    return Math.floor(Math.random() * 11) + 5; // Random 5-15%
  }
  
  // For music events, calculate score based on EDM affinity
  let score = 50; // Base score
  
  // Artist contribution
  if (event.artists && event.artists.length > 0) {
    score += Math.min(20, event.artists.length * 4);
  }
  
  // Music keyword bonus
  score += musicMatches.length * 3;
  
  console.log(`   🎵 Music event: Base ${50} + Artists ${event.artists?.length || 0} + Keywords ${musicMatches.length}`);
  return Math.max(15, Math.min(95, Math.round(score)));
}

// Run the processing
processCasaLomaEvents().catch(console.error);
