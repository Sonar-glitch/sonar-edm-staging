import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get base URL for API calls
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Mock data for development and testing
    const mockData = {
      topGenres: [
        { name: 'Melodic House', value: 90 },
        { name: 'Techno', value: 80 },
        { name: 'Progressive House', value: 70 },
        { name: 'Trance', value: 60 },
        { name: 'Deep House', value: 50 }
      ],
      topArtists: [
        { 
          name: 'Max Styler', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb8cbc5b79c7ab0ac7e6c0ff03',
          genres: ['melodic house', 'edm'],
          popularity: 90,
          rank: 1,
          similarArtists: [
            { name: 'Autograf', image: 'https://i.scdn.co/image/ab6761610000e5eb8a7af5d1f7eacb6addae5493' },
            { name: 'Amtrac', image: 'https://i.scdn.co/image/ab6761610000e5eb90c4c8a6fb0b4142c57e0bce' }
          ]
        },
        { 
          name: 'ARTBAT', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
          genres: ['melodic techno', 'organic house'],
          popularity: 85,
          rank: 2,
          similarArtists: [
            { name: 'Anyma', image: 'https://i.scdn.co/image/ab6761610000e5eb4c7c1e59b3e8c594dce7c2d2' },
            { name: 'Mathame', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' }
          ]
        },
        { 
          name: 'Lane 8', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb7f6d6a0a5b0d5e0747e01522',
          genres: ['progressive house', 'melodic house'],
          popularity: 80,
          rank: 3,
          similarArtists: [
            { name: 'Yotto', image: 'https://i.scdn.co/image/ab6761610000e5eb5d27d18dfef4c76f1b3a0f32' },
            { name: 'Ben Böhmer', image: 'https://i.scdn.co/image/ab6761610000e5eb7eb7d559b43f5e9775b20d9a' }
          ]
        },
        { 
          name: 'Boris Brejcha', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb7324ce0b63aec68c638e26f6',
          genres: ['german techno', 'minimal techno'],
          popularity: 75,
          rank: 4,
          similarArtists: [
            { name: 'Stephan Bodzin', image: 'https://i.scdn.co/image/ab6761610000e5eb4e8b9c8e5c628c4d0d64b463' },
            { name: 'Worakls', image: 'https://i.scdn.co/image/ab6761610000e5eb2d7d5f1fe46b7d1c0d11e0c0' }
          ]
        },
        { 
          name: 'Nora En Pure', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2',
          genres: ['deep house', 'organic house'],
          popularity: 70,
          rank: 5,
          similarArtists: [
            { name: 'EDX', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' },
            { name: 'Klingande', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' }
          ]
        }
      ],
      topTracks: [
        {
          name: 'Techno Cat',
          artist: 'Max Styler',
          image: 'https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 1
        },
        {
          name: 'Return To Oz (ARTBAT Remix) ',
          artist: 'Monolink',
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 2
        },
        {
          name: 'Atlas',
          artist: 'Lane 8',
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 3
        },
        {
          name: 'Purple Noise',
          artist: 'Boris Brejcha',
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 4
        },
        {
          name: 'Come With Me',
          artist: 'Nora En Pure',
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 5
        }
      ],
      seasonalMood: {
        winter: { genres: ['Deep House', 'Ambient Techno'], mood: 'Introspective' },
        spring: { genres: ['Progressive House', 'Melodic House'], mood: 'Uplifting' },
        summer: { genres: ['Tech House', 'House'], mood: 'Energetic' },
        fall: { genres: ['Organic House', 'Downtempo'], mood: 'Melancholic' },
        current: 'spring'
      },
      tasteLabels: ['Melodic', 'Progressive', 'Deep', 'Atmospheric', 'Energetic']
    };
    
    // Fetch events from the events API
    let suggestedEvents = [];
    try {
      console.log('Fetching events from events API...');
      const eventsResponse = await axios.get(`${baseUrl}/api/events`);
      
      if (eventsResponse.data && Array.isArray(eventsResponse.data.events)) {
        suggestedEvents = eventsResponse.data.events;
        console.log(`Successfully fetched ${suggestedEvents.length} events`);
      } else {
        console.log('No events found in API response, trying correlated-events endpoint');
        
        // Try the correlated-events endpoint as fallback
        const correlatedEventsResponse = await axios.get(`${baseUrl}/api/events/correlated-events`);
        
        if (correlatedEventsResponse.data && Array.isArray(correlatedEventsResponse.data.events)) {
          suggestedEvents = correlatedEventsResponse.data.events;
          console.log(`Successfully fetched ${suggestedEvents.length} correlated events`);
        } else {
          console.log('No events found in correlated-events API response, using mock events');
          
          // Use mock events as a last resort
          suggestedEvents = [
            {
              id: 'evt1',
              name: 'Melodic Nights',
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              venue: {
                name: 'Echostage',
                location: 'Washington, DC'
              },
              genres: ['Melodic House', 'Progressive House'],
              artists: ['Lane 8', 'Yotto'],
              image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
              ticketLink: 'https://example.com/tickets/1',
              correlation: 0.85
            },
            {
              id: 'evt2',
              name: 'Techno Revolution',
              date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              venue: {
                name: 'Club Space',
                location: 'Miami, FL'
              },
              genres: ['Techno', 'Dark Techno'],
              artists: ['Boris Brejcha', 'ANNA'],
              image: 'https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c',
              ticketLink: 'https://example.com/tickets/2',
              correlation: 0.78
            },
            {
              id: 'evt3',
              name: 'Deep Vibes',
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              venue: {
                name: 'Sound Bar',
                location: 'Chicago, IL'
              },
              genres: ['Deep House', 'Organic House'],
              artists: ['Nora En Pure', 'Ben Böhmer'],
              image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
              ticketLink: 'https://example.com/tickets/3',
              correlation: 0.72
            }
          ];
          console.log('Using mock events as fallback');
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error.message);
      console.log('Using mock events due to API error');
      
      // Use mock events as fallback
      suggestedEvents = [
        {
          id: 'evt1',
          name: 'Melodic Nights',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          venue: {
            name: 'Echostage',
            location: 'Washington, DC'
          },
          genres: ['Melodic House', 'Progressive House'],
          artists: ['Lane 8', 'Yotto'],
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          ticketLink: 'https://example.com/tickets/1',
          correlation: 0.85
        },
        {
          id: 'evt2',
          name: 'Techno Revolution',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          venue: {
            name: 'Club Space',
            location: 'Miami, FL'
          },
          genres: ['Techno', 'Dark Techno'],
          artists: ['Boris Brejcha', 'ANNA'],
          image: 'https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c',
          ticketLink: 'https://example.com/tickets/2',
          correlation: 0.78
        },
        {
          id: 'evt3',
          name: 'Deep Vibes',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          venue: {
            name: 'Sound Bar',
            location: 'Chicago, IL'
          },
          genres: ['Deep House', 'Organic House'],
          artists: ['Nora En Pure', 'Ben Böhmer'],
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          ticketLink: 'https://example.com/tickets/3',
          correlation: 0.72
        }
      ];
    }
    
    // Add suggested events to the response
    const responseData = {
      ...mockData,
      suggestedEvents
    };
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user taste:', error);
    return res.status(500).json({ error: 'Failed to fetch music taste data' });
  }
}
