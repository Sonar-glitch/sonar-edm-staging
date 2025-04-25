import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '@/lib/session';

export default withIronSessionApiRoute(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { latitude, longitude, city, region, country } = req.body;
    
    // Validate location data
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Invalid location data' });
    }
    
    // Store location in session
    req.session.userLocation = {
      latitude,
      longitude,
      city: city || 'Unknown',
      region: region || 'Unknown',
      country: country || 'Unknown',
      timestamp: Date.now()
    };
    
    await req.session.save();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving location:', error);
    return res.status(500).json({ error: 'Failed to save location' });
  }
}, sessionOptions);
