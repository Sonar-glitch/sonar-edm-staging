// /c/sonar/users/sonar-edm-user/lib/fallbackData.js
/**
 * Fallback data for the music taste page
 * Used when API calls fail or return incomplete data
 */

export const getFallbackDetailedTasteData = () => {
  return {
    genreProfile: {
      'House': 75,
      'Techno': 65,
      'Indie Dance': 45,
      'Trance': 35,
      'Progressive': 60
    },
    artistProfile: [
      { name: 'Tale Of Us', plays: 18, genre: 'Melodic Techno' },
      { name: 'Boris Brejcha', plays: 15, genre: 'High-Tech Minimal' },
      { name: 'Lane 8', plays: 14, genre: 'Progressive House' },
      { name: 'Artbat', plays: 12, genre: 'Melodic House & Techno' },
      { name: 'Eric Prydz', plays: 11, genre: 'Progressive House' }
    ],
    topTracks: [
      { name: 'Realm of Consciousness', artist: 'Tale Of Us', plays: 18 },
      { name: 'Purple Noise', artist: 'Boris Brejcha', plays: 15 },
      { name: 'Atlas', artist: 'Lane 8', plays: 14 },
      { name: 'Return to Oz', artist: 'Artbat', plays: 12 },
      { name: 'Opus', artist: 'Eric Prydz', plays: 11 }
    ],
    mood: {
      energetic: 72,
      melodic: 85,
      dark: 58,
      euphoric: 76,
      deep: 68
    },
    seasonalProfile: {
      spring: ['Progressive House', 'Melodic House'],
      summer: ['Tech House', 'House'],
      fall: ['Organic House', 'Downtempo'],
      winter: ['Deep House', 'Ambient Techno']
    },
    listeningTrends: [
      { month: 'Jan', house: 65, techno: 50, trance: 30 },
      { month: 'Feb', house: 70, techno: 60, trance: 35 },
      { month: 'Mar', house: 75, techno: 65, trance: 40 },
      { month: 'Apr', house: 72, techno: 70, trance: 45 },
      { month: 'May', house: 70, techno: 68, trance: 50 },
      { month: 'Jun', house: 65, techno: 72, trance: 48 }
    ]
  };
};

export const getFallbackEvents = () => {
  return [
    {
      id: 'evt-001',
      name: 'Techno Dreamscape',
      venue: 'Warehouse 23',
      location: 'New York',
      date: 'Thu, May 1',
      price: '$45',
      genre: 'Techno',
      matchScore: 92,
      imageUrl: 'https://example.com/event1.jpg'
    },
    {
      id: 'evt-002',
      name: 'Deep House Journey',
      venue: 'Club Echo',
      location: 'Brooklyn',
      date: 'Thu, May 8',
      price: '$35',
      genre: 'Deep House',
      matchScore: 85,
      imageUrl: 'https://example.com/event2.jpg'
    },
    {
      id: 'evt-003',
      name: 'Melodic Techno Night',
      venue: 'The Sound Bar',
      location: 'Manhattan',
      date: 'Sun, Apr 27',
      price: '$55',
      genre: 'Melodic Techno',
      matchScore: 88,
      imageUrl: 'https://example.com/event3.jpg'
    }
  ];
};
