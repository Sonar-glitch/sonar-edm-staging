// Check scores for specific events by URL
// Testing Hernan Cattaneo and Kream events

const targetEvents = [
  {
    url: 'https://www.ticketweb.ca/event/hernan-cattaneo-and-danny-tenaglia-evergreen-brickworks-tickets/13823584',
    expectedArtist: 'Hernan Cattaneo',
    expectedVenue: 'Evergreen Brickworks'
  },
  {
    url: 'https://www.ticketweb.ca/event/kream-cabana-toronto-tickets/14379933',
    expectedArtist: 'Kream',
    expectedVenue: 'Cabana Toronto'
  }
];

console.log('🔍 Checking specific event scores...\n');

async function checkEventScores() {
  try {
    // Check production API
    console.log('=== PRODUCTION API CHECK ===');
    
    const response = await fetch('https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/api/events?lat=43.6532&lon=-79.3832&city=Toronto&radius=50');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 Total events found: ${data.events?.length || 0}`);
    
    if (!data.events || data.events.length === 0) {
      console.log('❌ No events returned from API');
      return;
    }
    
    console.log('\n=== TARGET EVENT ANALYSIS ===');
    
    targetEvents.forEach((target, index) => {
      console.log(`\n${index + 1}. Searching for: ${target.expectedArtist} at ${target.expectedVenue}`);
      console.log(`   URL: ${target.url}`);
      
      // Search by URL match
      const byUrl = data.events.find(e => e.url === target.url || e.ticketUrl === target.url);
      
      // Search by artist name (case insensitive)
      const byArtist = data.events.filter(e => 
        e.name && e.name.toLowerCase().includes(target.expectedArtist.toLowerCase())
      );
      
      // Search by venue (case insensitive)
      const byVenue = data.events.filter(e => 
        (e.venue && typeof e.venue === 'string' && e.venue.toLowerCase().includes(target.expectedVenue.toLowerCase())) ||
        (e.venue && typeof e.venue === 'object' && e.venue.name && e.venue.name.toLowerCase().includes(target.expectedVenue.toLowerCase())) ||
        (e.location && typeof e.location === 'string' && e.location.toLowerCase().includes(target.expectedVenue.toLowerCase()))
      );
      
      if (byUrl) {
        console.log(`   ✅ FOUND BY URL: "${byUrl.name}"`);
        console.log(`   📍 Venue: ${typeof byUrl.venue === 'object' ? byUrl.venue.name : byUrl.venue}`);
        console.log(`   🎯 Score: ${byUrl.personalizedScore || 'No score'}%`);
        console.log(`   🎵 Music Type: ${byUrl.musicType || 'Unknown'}`);
        console.log(`   🔗 URL: ${byUrl.url || byUrl.ticketUrl}`);
      } else {
        console.log(`   ❌ NOT FOUND BY URL`);
        
        if (byArtist.length > 0) {
          console.log(`   🎤 Similar artist events found:`);
          byArtist.forEach(e => {
            console.log(`      - "${e.name}": ${e.personalizedScore || 'No score'}%`);
          });
        }
        
        if (byVenue.length > 0) {
          console.log(`   📍 Similar venue events found:`);
          byVenue.forEach(e => {
            console.log(`      - "${e.name}": ${e.personalizedScore || 'No score'}%`);
          });
        }
        
        if (byArtist.length === 0 && byVenue.length === 0) {
          console.log(`   ℹ️  No matching events found in current dataset`);
        }
      }
    });
    
    // Show some sample events for context
    console.log('\n=== SAMPLE EVENTS IN DATABASE ===');
    const sampleEvents = data.events.slice(0, 5);
    sampleEvents.forEach((e, i) => {
      console.log(`${i + 1}. "${e.name}"`);
      console.log(`   Score: ${e.personalizedScore || 'No score'}%`);
      console.log(`   Venue: ${typeof e.venue === 'object' ? e.venue.name : e.venue}`);
      console.log(`   URL: ${e.url || e.ticketUrl || 'No URL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking events:', error.message);
  }
}

// Use fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  const fetch = require('node-fetch');
  global.fetch = fetch;
}

checkEventScores();
