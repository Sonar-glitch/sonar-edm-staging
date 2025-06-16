import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock taste profile data - replace with real database calls
    const tasteProfile = {
      genrePreferences: [
        { name: 'house', weight: 0.85, confidence: 0.9 },
        { name: 'techno', weight: 0.72, confidence: 0.8 },
        { name: 'progressive', weight: 0.68, confidence: 0.75 },
        { name: 'deep house', weight: 0.61, confidence: 0.7 },
        { name: 'trance', weight: 0.45, confidence: 0.6 }
      ],
      venuePreferences: {
        preferredCapacity: 'medium',
        preferredAmbiance: 'underground',
        locationPreference: 'urban'
      },
      seasonalPreferences: {
        spring: { energy: 0.7, mood: 'uplifting' },
        summer: { energy: 0.85, mood: 'euphoric' },
        fall: { energy: 0.65, mood: 'deep' },
        winter: { energy: 0.6, mood: 'introspective' }
      }
    };

    res.status(200).json(tasteProfile);
  } catch (error) {
    console.error('Error in /api/user/taste-profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
