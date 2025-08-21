import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Clear Montreal-specific cache
    const result = await db.collection('apiCache').deleteMany({
      key: { $regex: '^events_Montreal' }
    });
    
    console.log(`🧹 Cleared ${result.deletedCount} Montreal cache entries`);
    
    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} Montreal cache entries`,
      clearedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Error clearing Montreal cache:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
}
