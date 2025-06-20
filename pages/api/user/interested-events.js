import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  try {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Get user session with fallback
    let session = null;
    let userId = 'demo-user-' + Date.now(); // Fallback user ID
    
    try {
      session = await getServerSession(req, res, authOptions);
      if (session && session.user) {
        userId = session.user.email || session.user.id || userId;
      }
    } catch (authError) {
      console.warn('Authentication error, using demo user:', authError.message);
    }

    // CONSOLIDATED: Use connectToDatabase instead of getCollection
    const { db } = await connectToDatabase();
    const collection = db.collection('interested_events');

    if (req.method === 'GET') {
      try {
        const interestedEvents = await collection.find({ userId }).toArray();
        
        return res.status(200).json({
          success: true,
          events: interestedEvents || [],
          count: interestedEvents ? interestedEvents.length : 0,
          source: 'database',
          timestamp,
          userId: session ? userId : 'demo-user',
          authenticated: !!session
        });
      } catch (dbError) {
        console.error('Database query error:', dbError);
        return res.status(200).json({
          success: true,
          events: [],
          count: 0,
          source: 'fallback',
          timestamp,
          userId: 'demo-user',
          authenticated: false,
          error: 'Database connection issue'
        });
      }
    }

    if (req.method === 'POST') {
      const { eventId, eventData } = req.body;
      
      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required',
          source: 'api',
          timestamp
        });
      }

      try {
        const eventToSave = {
          userId,
          eventId,
          ...eventData,
          savedAt: timestamp,
          source: 'user_action'
        };

        const result = await collection.insertOne(eventToSave);
        
        return res.status(200).json({
          success: true,
          message: 'Event saved successfully',
          eventId: result.insertedId,
          source: 'database',
          timestamp,
          authenticated: !!session
        });
      } catch (dbError) {
        console.error('Database insert error:', dbError);
        return res.status(200).json({
          success: false,
          message: 'Failed to save event',
          source: 'api',
          timestamp,
          error: dbError.message
        });
      }
    }

    if (req.method === 'DELETE') {
      const { eventId } = req.query;
      
      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required',
          source: 'api',
          timestamp
        });
      }

      try {
        const result = await collection.deleteOne({ userId, eventId });
        
        return res.status(200).json({
          success: true,
          message: 'Event removed successfully',
          deletedCount: result.deletedCount,
          source: 'database',
          timestamp,
          authenticated: !!session
        });
      } catch (dbError) {
        console.error('Database delete error:', dbError);
        return res.status(200).json({
          success: false,
          message: 'Failed to remove event',
          source: 'api',
          timestamp,
          error: dbError.message
        });
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      source: 'api',
      timestamp
    });

  } catch (error) {
    console.error('Error in interested-events API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      source: 'api',
      timestamp,
      error: error.message
    });
  }
}
