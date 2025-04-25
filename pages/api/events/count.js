export default async function handler(req, res) {
  try {
    // This would normally fetch from a database or API
    // For now, return a sample count
    res.status(200).json({ count: 42 });
  } catch (error) {
    console.error('Error fetching event count:', error);
    res.status(500).json({ error: 'Failed to fetch event count' });
  }
}
