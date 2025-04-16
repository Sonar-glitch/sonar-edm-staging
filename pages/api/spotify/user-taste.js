import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req, res)  {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  try {
    // Get access token from session
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      console.error('No Spotify access token found in session');
      return res.status(401).json({ 
        success: false, 
        error: 'No Spotify access token found',
        // Return mock data as fallback for development/testing
        fallbackData: true,
        taste: getMockTasteData()
      });
    }
    
    // Fetch top artists (medium_term = approximately last 6 months)
    let topArtistsResponse;
    try {
      topArtistsResponse = await axios.get('https://api.spotify.com/v1/me/top/artists', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          time_range: 'medium_term',
          limit: 10
        }
      }) ;
    } catch (error) {
      console.error('Error fetching top artists:', error.response?.data || error.message);
      // If token expired or other auth error, return mock data
      if (error.response?.status === 401) {
        return res.status(200).json({ 
          success: true, 
          authError: true,
          fallbackData: true,
          taste: getMockTasteData() 
        });
      }
      throw error;
    }
    
    // Fetch top tracks (short_term = approximately last 4 weeks)
    let topTracksResponse;
    try {
      topTracksResponse = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          time_range: 'short_term',
          limit: 10
        }
      }) ;
    } catch (error) {
      console.error('Error fetching top tracks:', error.response?.data || error.message);
      throw error;
    }
    
    // Process artists data
    const topArtists = await Promise.all(topArtistsResponse.data.items.map(async (artist, index) => {
      // Get similar artists for each top artist
      let similarArtists = [];
      try {
        const similarArtistsResponse = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}/related-artists`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }) ;
        
        similarArtists = similarArtistsResponse.data.artists
          .slice(0, 5)
          .map(similar => similar.name);
      } catch (error) {
        console.error(`Error fetching similar artists for ${artist.name}:`, error.response?.data || error.message);
        // Continue even if we can't get similar artists
        similarArtists = [];
      }
      
      return {
        name: artist.name,
        match: Math.round(100 - (index * 2.5)), // Calculate match percentage based on position
        image: artist.images[0]?.url || '',
        similarArtists
      };
    }));
    
    // Process tracks data
    const topTracks = topTracksResponse.data.items.map(track => ({
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      image: track.album.images[0]?.url || '',
      previewUrl: track.preview_url
    }));
    
    // Extract genres from top artists
    const allGenres = topArtistsResponse.data.items.flatMap(artist => artist.genres);
    const genreCounts = {};
    
    allGenres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    
    // Sort genres by frequency and convert to format for spider chart
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([genre, count]) => ({
        label: genre.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: Math.min(100, Math.round((count / topArtistsResponse.data.items.length) * 100))
      }));
    
    // If we don't have enough genres, add some defaults to ensure the spider chart works
    while (topGenres.length < 6) {
      topGenres.push({
        label: `Genre ${topGenres.length + 1}`,
        value: 10
      });
    }
    
    // Generate seasonal mood based on genres
    const seasonalMood = {
      spring: [],
      summer: [],
      fall: [],
      winter: []
    };
    
    // Map genres to seasons (this is a simplified approach)
    const genreToSeason = {
      'house': 'summer',
      'techno': 'winter',
      'trance': 'spring',
      'drum and bass': 'fall',
      'edm': 'summer',
      'electronic': 'spring',
      'dance': 'summer',
      'deep house': 'fall',
      'progressive house': 'spring',
      'tech house': 'summer',
      'ambient': 'winter',
      'chill': 'fall'
    };
    
    // Assign genres to seasons
    Object.keys(genreCounts).forEach(genre => {
      for (const [keyword, season] of Object.entries(genreToSeason)) {
        if (genre.includes(keyword) && !seasonalMood[season].includes(genre) && seasonalMood[season].length < 3) {
          seasonalMood[season].push(genre.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
        }
      }
    });
    
    // Fill in any empty seasons with generic genres
    Object.keys(seasonalMood).forEach(season => {
      if (seasonalMood[season].length === 0) {
        seasonalMood[season] = ['Electronic Music'];
      }
    });
    
    // Generate personalized taste labels based on genres
    const genreToLabel = {
      'techno': 'Techno Enthusiast',
      'house': 'House Head',
      'trance': 'Trance Lover',
      'drum and bass': 'Bass Beast',
      'ambient': 'Ambient Explorer',
      'progressive': 'Progressive Connoisseur',
      'deep': 'Deep Diver',
      'experimental': 'Sound Experimenter',
      'minimal': 'Minimal Master',
      'melodic': 'Melodic Explorer'
    };
    
    const tasteLabels = [];
    Object.keys(genreCounts)
      .sort((a, b) => genreCounts[b] - genreCounts[a])
      .forEach(genre => {
        for (const [keyword, label] of Object.entries(genreToLabel)) {
          if (genre.includes(keyword) && !tasteLabels.includes(label) && tasteLabels.length < 5) {
            tasteLabels.push(label);
          }
        }
      });
    
    // Add a default label if none were found
    if (tasteLabels.length === 0) {
      tasteLabels.push('Electronic Music Fan');
    }
    
    // Generate taste profile description
    const topGenreNames = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);
    
    const tasteProfile = `${topGenreNames.join(', ')} enthusiast with a passion for electronic music`;
    
    // Construct the final user taste object
    const userTaste = {
      topGenres,
      topArtists,
      topTracks,
      seasonalMood,
      tasteLabels,
      tasteProfile
    };
    
    res.status(200).json({ success: true, taste: userTaste });
  } catch (error) {
    console.error('Error fetching user taste data:', error);
    // Return mock data as fallback in case of error
    res.status(200).json({ 
      success: true, 
      error: 'Error fetching real data, using fallback',
      fallbackData: true,
      taste: getMockTasteData() 
    });
  }
}

// Mock data function for fallback
function getMockTasteData() {
  return {
    topGenres: [
      { label: 'House', value: 85 },
      { label: 'Techno', value: 70 },
      { label: 'Trance', value: 60 },
      { label: 'Dubstep', value: 40 },
      { label: 'Drum & Bass', value: 75 },
      { label: 'Future Bass', value: 55 }
    ],
    topArtists: [
      { 
        name: 'Deadmau5', 
        match: 95,
        image: 'https://i.scdn.co/image/ab6761610000e5eb9e46a78c5cd2f7a0e26c808a',
        similarArtists: ['Eric Prydz', 'Feed Me', 'ATTLAS', 'No Mana', 'i_o']
      },
      { 
        name: 'Eric Prydz', 
        match: 92,
        image: 'https://i.scdn.co/image/ab6761610000e5eb5d3fb4853effa48cc2d0f789',
        similarArtists: ['Deadmau5', 'Pryda', 'Jeremy Olander', 'Adam Beyer', 'Cristoph']
      },
      { 
        name: 'Charlotte de Witte', 
        match: 88,
        image: 'https://i.scdn.co/image/ab6761610000e5eb3c02d5d6f5c77f2bde70bb0d',
        similarArtists: ['Amelie Lens', 'ANNA', 'I Hate Models', 'Kobosil', 'Dax J']
      },
      { 
        name: 'Above & Beyond', 
        match: 85,
        image: 'https://i.scdn.co/image/ab6761610000e5eb7e4d9e43fdf4b0e1acafd9c2',
        similarArtists: ['Armin van Buuren', 'Andrew Bayer', 'ilan Bluestone', 'Cosmic Gate', 'Gareth Emery']
      },
      { 
        name: 'Armin van Buuren', 
        match: 82,
        image: 'https://i.scdn.co/image/ab6761610000e5eb1a2eab4d3d0f0e7e3c1b5d1a',
        similarArtists: ['Above & Beyond', 'Tiësto', 'Ferry Corsten', 'Paul van Dyk', 'Markus Schulz']
      },
      { 
        name: 'Skrillex', 
        match: 80,
        image: 'https://i.scdn.co/image/ab6761610000e5eb90c4872e8b6ebb5e0c975c41',
        similarArtists: ['Diplo', 'Knife Party', 'Zeds Dead', 'Flux Pavilion', 'NGHTMRE']
      },
      { 
        name: 'Amelie Lens', 
        match: 78,
        image: 'https://i.scdn.co/image/ab6761610000e5eb5a3c1c7e8e8c7c6b7e1d4f9a',
        similarArtists: ['Charlotte de Witte', 'ANNA', 'I Hate Models', 'Kobosil', 'Dax J']
      },
      { 
        name: 'Boris Brejcha', 
        match: 75,
        image: 'https://i.scdn.co/image/ab6761610000e5eb3c5f65f5e2cf5a843c05f4b5',
        similarArtists: ['Stephan Bodzin', 'Worakls', 'N\'to', 'Artbat', 'Mathame']
      },
      { 
        name: 'Disclosure', 
        match: 72,
        image: 'https://i.scdn.co/image/ab6761610000e5eb9e2528e671f9f34f95c4bc8b',
        similarArtists: ['Duke Dumont', 'Kaytranada', 'Jamie xx', 'Bicep', 'Bonobo']
      },
      { 
        name: 'Four Tet', 
        match: 70,
        image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7aa1cf9',
        similarArtists: ['Floating Points', 'Caribou', 'Jon Hopkins', 'Bonobo', 'Jamie xx']
      }
    ],
    topTracks: [
      {
        name: 'Strobe',
        artist: 'Deadmau5',
        album: 'For Lack of a Better Name',
        image: 'https://i.scdn.co/image/ab67616d0000b273103e4cf3613ef2f98a188c3c',
        previewUrl: 'https://p.scdn.co/mp3-preview/d0b3db5d012be9f2c07339f1a43a13ff9bf30e66'
      },
      {
        name: 'Opus',
        artist: 'Eric Prydz',
        album: 'Opus',
        image: 'https://i.scdn.co/image/ab67616d0000b273e414c6f5f4c59f40e0c041c4',
        previewUrl: 'https://p.scdn.co/mp3-preview/8443e8e7d2fde0f2547d3afc35701b9c3f78e8d8'
      },
      {
        name: 'The Veldt',
        artist: 'Deadmau5 feat. Chris James',
        album: '> album title goes here <',
        image: 'https://i.scdn.co/image/ab67616d0000b273b4d5d2e3d6a2c33b464b57f6',
        previewUrl: 'https://p.scdn.co/mp3-preview/8c7ae9e0aba7f1b1d0d0f5e9363f1f7f0b58daef'
      },
      {
        name: 'Age Of Love (Charlotte de Witte & Enrico Sangiuliano Remix) ',
        artist: 'Age Of Love',
        album: 'Age Of Love (Charlotte de Witte & Enrico Sangiuliano Remix)',
        image: 'https://i.scdn.co/image/ab67616d0000b273a6b7a3f7b7d7af9b73c7d0a6',
        previewUrl: 'https://p.scdn.co/mp3-preview/8c7ae9e0aba7f1b1d0d0f5e9363f1f7f0b58daef'
      },
      {
        name: 'Sun & Moon',
        artist: 'Above & Beyond feat. Richard Bedford',
        album: 'Group Therapy',
        image: 'https://i.scdn.co/image/ab67616d0000b273f2e181ccd7573e7d6b0bd5e8',
        previewUrl: 'https://p.scdn.co/mp3-preview/8c7ae9e0aba7f1b1d0d0f5e9363f1f7f0b58daef'
      },
      {
        name: 'Blah Blah Blah',
        artist: 'Armin van Buuren',
        album: 'Blah Blah Blah',
        image: 'https://i.scdn.co/image/ab67616d0000b273a1c37f3aaef0b0a2a7e3ca38',
        previewUrl: 'https://p.scdn.co/mp3-preview/8c7ae9e0aba7f1b1d0d0f5e9363f1f7f0b58daef'
      },
      {
        name: 'Bangarang (feat. Sirah) ',
        artist: 'Skrillex',
        album: 'Bangarang',
        image: 'https://i.scdn.co/image/ab67616d0000b273e0d3c847e47b85131eace1b1',
        previewUrl: 'https://p.scdn.co/mp3-preview/8c7ae9e0aba7f1b1d0d0f5e9363f1f7f0b58daef'
      },
      {
        name: 'Higher Love',
        artist: 'Amelie Lens',
        album: 'Higher EP',
        image: 'https://i.scdn.co/image/ab67616d0000b273e0d3c847e47b85131eace1b1',
        previewUrl: 'https://p.scdn.co/mp3-preview/8c7ae9e0aba7f1b1d0d0f5e9363f1f7f0b58daef'
      },
      {
        name: 'Purple Noise',
        artist: 'Boris Brejcha',
        album: 'Purple Noise',
        image: 'https://i.scdn.co/image/ab67616d0000b273e0d3c847e47b85131eace1b1',
        previewUrl: 'https://p.scdn.co/mp3-preview/8c7ae9e0aba7f1b1d0d0f5e9363f1f7f0b58daef'
      },
      {
        name: 'Latch (feat. Sam Smith) ',
        artist: 'Disclosure',
        album: 'Settle',
        image: 'https://i.scdn.co/image/ab67616d0000b273e0d3c847e47b85131eace1b1',
        previewUrl: 'https://p.scdn.co/mp3-preview/8c7ae9e0aba7f1b1d0d0f5e9363f1f7f0b58daef'
      }
    ],
    seasonalMood: {
      spring: ['Melodic House', 'Progressive', 'Uplifting Trance'],
      summer: ['Tech House', 'Festival Anthems', 'Tropical House'],
      fall: ['Deep House', 'Chill Electronic', 'Melodic Techno'],
      winter: ['Techno', 'Dark Progressive', 'Ambient']
    },
    tasteLabels: [
      'Techno Enthusiast',
      'Bass Beast',
      'Melodic Explorer',
      'Progressive Connoisseur',
      'Underground Devotee'
    ],
    tasteProfile: 'Underground techno and melodic house with occasional interest in trance and bass music'
  };
}
