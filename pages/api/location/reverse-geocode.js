// Simple stub reverse geocode endpoint to prevent 404s and provide minimal location data.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing lat/lon' });
    }
    // Return a lightweight placeholder; could integrate real geocoding later.
    return res.status(200).json({
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      city: 'Detected City',
      region: 'Detected Region',
      country: 'Unknown',
      source: 'stub'
    });
  } catch (e) {
    return res.status(500).json({ error: 'Reverse geocode failed', message: e.message });
  }
}
