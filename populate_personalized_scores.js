// Simple Event Score Populator
// Bypasses the complex RecommendationEnhancer and directly populates personalizedScore

const { MongoClient } = require('mongodb');

// Simple music event detection and scoring (working logic from our fixes)
function detectMusicEvent(event) {
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
  
  // Special handling for "general admission" - only non-music if no music context
  const hasGeneralAdmission = fullText.includes('general admission');
  if (hasGeneralAdmission && musicMatches.length === 0) {
    return false; // Clearly non-music general admission
  }
  
  // Return true if more music keywords than non-music keywords
  return musicMatches.length > nonMusicMatches.length;
}

function calculatePersonalizedScore(event) {
  const isMusicEvent = detectMusicEvent(event);
  
  if (!isMusicEvent) {
    // Non-music events get very low scores (5-15%)
    console.log(`🚫 Non-music event: "${event.name}" -> Low score`);
    return Math.floor(Math.random() * 11) + 5; // Random 5-15%
  }
  
  // For music events, calculate score based on EDM affinity
  let score = 50; // Base score
  
  // Genre contribution
  const eventText = (event.name + ' ' + (event.description || '')).toLowerCase();
  const edmKeywords = ['house', 'techno', 'trance', 'dubstep', 'electronic', 'dance', 'edm'];
  const edmMatches = edmKeywords.filter(word => eventText.includes(word));
  score += edmMatches.length * 5;
  
  // Artist contribution
  if (event.artists && event.artists.length > 0) {
    score += Math.min(20, event.artists.length * 4);
  }
  
  // Venue contribution
  const venueName = (typeof event.venue === 'object' ? event.venue?.name : event.venue || '').toLowerCase();
  if (venueName.includes('club') || venueName.includes('festival')) {
    score += 10;
  }
  
  console.log(`🎵 Music event: "${event.name}" -> ${score}%`);
  return Math.max(15, Math.min(95, Math.round(score)));
}

async function populatePersonalizedScores() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('test');
    const eventsCollection = db.collection('events_unified');
    
    // Find events that need personalized scores
    const eventsToScore = await eventsCollection.find({
      personalizedScore: { $exists: false }
    }).limit(20).toArray(); // Start with a small batch
    
    console.log(`📊 Found ${eventsToScore.length} events to score`);
    
    let successCount = 0;
    
    for (const event of eventsToScore) {
      try {
        const personalizedScore = calculatePersonalizedScore(event);
        
        // Update the event in database
        await eventsCollection.updateOne(
          { _id: event._id },
          { 
            $set: { 
              personalizedScore: personalizedScore,
              scoringMethod: 'simple_music_detection',
              scoringTimestamp: new Date(),
              scoringVersion: '1.0.0'
            }
          }
        );
        
        successCount++;
        console.log(`✅ Scored: "${event.name}" -> ${personalizedScore}%`);
        
      } catch (error) {
        console.warn(`⚠️ Failed to score "${event.name}":`, error.message);
      }
    }
    
    console.log(`\n🎯 Scoring complete: ${successCount}/${eventsToScore.length} events scored`);
    
    // Verify results by checking Casa Loma specifically
    console.log('\n🔍 Verifying Casa Loma events...');
    const casaLomaEvents = await eventsCollection.find({
      name: { $regex: /casa loma/i }
    }).limit(5).toArray();
    
    for (const event of casaLomaEvents) {
      console.log(`📋 "${event.name}": ${event.personalizedScore}% (${event.scoringMethod || 'No method'})`);
    }
    
  } catch (error) {
    console.error('❌ Scoring failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the scoring
populatePersonalizedScores().catch(console.error);
