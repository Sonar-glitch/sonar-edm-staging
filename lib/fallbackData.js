// /c/sonar/users/sonar-edm-user/lib/fallbackData.js
export const getFallbackEvents = () => {
  const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  
  return [
    {
      id: 'fb-1',
      name: 'Tale of Us',
      venue: 'Output',
      location: 'New York',
      date: daysFromNow(7),
      price: 85,
      primaryGenre: 'Melodic Techno',
      matchScore: 92
    },
    {
      id: 'fb-2',
      name: 'Mathame',
      venue: 'Afterlife',
      location: 'Brooklyn',
      date: daysFromNow(14),
      price: 35,
      primaryGenre: 'Deep House',
      matchScore: 85
    },
    {
      id: 'fb-3',
      name: 'Boris Brejcha',
      venue: 'Avant Gardner',
      location: 'Manhattan',
      date: daysFromNow(3),
      price: 75,
      primaryGenre: 'Minimal Techno',
      matchScore: 95
    }
  ];
};

export const getFallbackTasteData = () => {
  return {
    genreProfile: {
      'House': 75,
      'Techno': 65,
      'Progressive House': 60,
      'Trance': 45,
      'Melodic': 55
    },
    mood: 'Chillwave Flow',
    topArtists: [{ 
      name: 'Boris Brejcha', 
      id: '6bDWAcdtVR39rjZS5A3SoD',
      images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb8ae72ad1d3e564e2b883afb5' }],
      popularity: 85,
      genres: ['melodic techno', 'minimal techno']
    }],
    topTracks: [{ 
      name: 'Realm of Consciousness', 
      id: '2pXJ3zJ9smoG8SQqlMBvoF',
      artists: [{ name: 'Tale Of Us' }],
      album: { 
        name: 'Realm of Consciousness', 
        images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273c3a84c67544c46c7df9529c5' }] 
      },
      popularity: 80,
      preview_url: 'https://p.scdn.co/mp3-preview/5a6aa5ef7516e6771c964c3d44b77156c5330b7e'
    }]
  };
};

export const getFallbackDetailedTasteData = ()  => {
  return {
    genreProfile: {
      'House': 75,
      'Techno': 65,
      'Progressive House': 60,
      'Trance': 45,
      'Melodic': 55
    },
    artistProfile: [
      { name: 'Boris Brejcha', plays: 42, genre: 'Melodic Techno' },
      { name: 'Lane 8', plays: 38, genre: 'Progressive House' },
      { name: 'Tale Of Us', plays: 35, genre: 'Melodic Techno' },
      { name: 'Artbat', plays: 32, genre: 'Melodic House' },
      { name: 'Eric Prydz', plays: 28, genre: 'Progressive House' }
    ],
    listeningTrends: [
      { month: 'Jan', house: 65, techno: 55, trance: 30 },
      { month: 'Feb', house: 68, techno: 60, trance: 35 },
      { month: 'Mar', house: 75, techno: 65, trance: 40 },
      { month: 'Apr', house: 72, techno: 70, trance: 45 },
      { month: 'May', house: 70, techno: 68, trance: 50 },
      { month: 'Jun', house: 65, techno: 72, trance: 48 }
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
    }
  };
};
