import { parse, serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { latitude, longitude, city, region, country } = req.body;
    
    // Validate location data
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Invalid location data' });
    }
    
    // Store location in cookie
    const locationData = {
      latitude,
      longitude,
      city: city || 'Unknown',
      region: region || 'Unknown',
      country: country || 'Unknown',
      timestamp: Date.now()
    };
    
    // Set cookie with location data
    const locationCookie = serialize('userLocation', JSON.stringify(locationData), {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    res.setHeader('Set-Cookie', locationCookie);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving location:', error);
    return res.status(500).json({ error: 'Failed to save location' });
  }
}
