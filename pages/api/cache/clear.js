import { clearAllCache } from '../../../lib/cache';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await clearAllCache();
      res.status(200).json({ message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ message: 'Failed to clear cache', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
