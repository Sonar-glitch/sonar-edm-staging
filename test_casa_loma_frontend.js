// Test Casa Loma Frontend Scoring Logic
// Simulates the frontend logic to see where 75% comes from

const testEvent = {
  name: "Casa Loma General Admission",
  description: "",
  venue: "Casa Loma",
  genres: undefined,
  artists: undefined,
  personalizedScore: undefined // No backend score
};

// Frontend fallback logic
const score = testEvent.personalizedScore || 50;
console.log('Basic fallback score:', score);

// Let me check if there's additional logic...

// Simulate the EnhancedCircularProgress component logic
const getScoreBreakdown = (event) => {
  let genreMatch = 0;
  let soundMatch = 0;
  let artistMatch = 0;
  let venueMatch = 0;
  let timingMatch = 0;
  
  // IMPROVED: Better genre/music detection
  const eventText = (event.name || '').toLowerCase();
  const eventDescription = (event.description || '').toLowerCase();
  const fullEventText = eventText + ' ' + eventDescription;
  
  // Get venue info early for analysis
  const venueName = (typeof event.venue === 'object' ? event.venue?.name : event.venue || '').toLowerCase();
  
  // Check if this is actually a music event
  const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'club', 'party', 'live music', 'band', 'artist', 'performance', 'tour'];
  const nonMusicKeywords = ['museum', 'exhibition', 'castle', 'historic', 'visit', 'sightseeing'];
  
  // Special case: "general admission" is only non-music if it's NOT accompanied by music keywords
  const hasGeneralAdmission = fullEventText.includes('general admission');
  const hasSpecificNonMusicVenue = venueName.includes('casa loma') && !fullEventText.includes('concert');
  
  const musicMatches = musicKeywords.filter(word => fullEventText.includes(word));
  const nonMusicMatches = nonMusicKeywords.filter(word => fullEventText.includes(word));
  
  // Add general admission to non-music only if no music context
  if (hasGeneralAdmission && musicMatches.length === 0) {
    nonMusicMatches.push('general admission');
  }
  
  // Add venue-specific non-music detection
  if (hasSpecificNonMusicVenue) {
    nonMusicMatches.push('historic venue tour');
  }
  
  console.log('Music keywords found:', musicMatches);
  console.log('Non-music keywords found:', nonMusicMatches);
  console.log('Has general admission:', hasGeneralAdmission);
  console.log('Has specific non-music venue:', hasSpecificNonMusicVenue);
  
  // Heavily penalize non-music events
  if (nonMusicMatches.length > musicMatches.length) {
    genreMatch = 5; // Very low music relevance
  } else {
    // REAL Genre matching for actual music events
    const electronicKeywords = ['electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'dj', 'club'];
    const matches = electronicKeywords.filter(word => fullEventText.includes(word));
    genreMatch = Math.min(25, matches.length * 4 + 10);
  }
  
  // REAL Sound characteristics from venue analysis
  const venueText = venueName + ' ' + fullEventText;
  
  if (nonMusicMatches.length > musicMatches.length) {
    soundMatch = 3; // Very low for non-music venues
  } else if (venueText.includes('club') || venueText.includes('lounge')) {
    soundMatch = 20;
  } else if (venueText.includes('theater') || venueText.includes('hall')) {
    soundMatch = 25;
  } else {
    soundMatch = 15;
  }
  
  // REAL Artist affinity
  if (event.artists && event.artists.length > 0) {
    artistMatch = Math.min(20, event.artists.length * 4 + 8);
  } else if (nonMusicMatches.length > musicMatches.length) {
    artistMatch = 2; // Very low for non-music events
  } else {
    artistMatch = 15;
  }
  
  // REAL Venue preference
  if (typeof event.venue === 'object' && event.venue?.name) {
    const venueType = event.venue.name.toLowerCase();
    if (nonMusicMatches.length > musicMatches.length) {
      venueMatch = 3; // Very low for non-music venues
    } else if (venueType.includes('club')) venueMatch = 12;
    else if (venueType.includes('theater') || venueType.includes('hall')) venueMatch = 15;
    else if (venueType.includes('festival')) venueMatch = 18;
    else venueMatch = 10;
  } else {
    venueMatch = nonMusicMatches.length > musicMatches.length ? 2 : 8;
  }
  
  // REAL Timing preference
  const eventDate = event.date ? new Date(event.date) : null;
  if (eventDate) {
    const now = new Date();
    const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 7) timingMatch = 15;
    else if (daysUntil > 7 && daysUntil <= 14) timingMatch = 12;
    else if (daysUntil > 14 && daysUntil <= 30) timingMatch = 8;
    else timingMatch = 5;
  } else {
    timingMatch = 5;
  }
  
  const calculatedTotal = genreMatch + soundMatch + artistMatch + venueMatch + timingMatch;
  
  console.log('Individual scores:', {
    genreMatch,
    soundMatch,
    artistMatch,
    venueMatch,
    timingMatch
  });
  console.log('Calculated total:', calculatedTotal);
  
  return {
    genreMatch,
    soundMatch,
    artistMatch,
    venueMatch,
    timingMatch,
    total: calculatedTotal
  };
};

console.log('\n=== Testing Casa Loma General Admission ===');
const breakdown = getScoreBreakdown(testEvent);
console.log('\nFinal breakdown:', breakdown);

console.log('\n=== So where does 75% come from? ===');
console.log('The frontend uses:', score, '(personalizedScore || 50)');
console.log('The calculated breakdown totals:', breakdown.total);
console.log('There must be additional logic somewhere...');
