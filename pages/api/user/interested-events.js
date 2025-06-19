/**
 * Enhanced Interested Events API
 * 
 * This API handles user's saved/liked events with:
 * - Proper MongoDB connection handling
 * - Graceful error handling and fallbacks
 * - Data source tracking for verification
 * - Consistent response format
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise, { getCollection } from '@/lib/mongodbClient';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized',
        source: 'api',
        timestamp: new Date().toISOString()
      });
    }

    // Get user ID from session
    const userId = session.user.id || session.user.email;
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID not found in session',
        source: 'api',
        timestamp: new Date().toISOString()
      });
    }

    // Get MongoDB collection with error handling
    let interestedEventsCollection;
    try {
      interestedEventsCollection = await getCollection('interestedEvents');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      // Return empty data with error flag for graceful degradation
      return res.status(200).json({ 
        success: false,
        events: [], 
        error: true, 
        message: 'Database connection error',
        errorDetails: error.message,
        source: 'api_fallback',
        timestamp: new Date().toISOString()
      });
    }

    // GET - Fetch all saved events for the user
    if (req.method === 'GET') {
      try {
        const events = await interestedEventsCollection.find({ userId }).toArray();
        
        return res.status(200).json({ 
          success: true,
          events,
          count: events.length,
          source: 'mongodb',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error fetching saved events:', error);
        return res.status(200).json({ 
          success: false,
          events: [],
          error: true,
          message: 'Error fetching saved events',
          errorDetails: error.message,
          source: 'api_error',
          timestamp: new Date().toISOString()
        });
      }
    }

    // POST - Save a new event
    if (req.method === 'POST') {
      try {
        const { event } = req.body;
        if (!event || !event.id) {
          return res.status(400).json({ 
            success: false,
            message: 'Event data is required',
            source: 'api',
            timestamp: new Date().toISOString()
          });
        }

        // Check if event already exists for this user
        const existingEvent = await interestedEventsCollection.findOne({ 
          userId, 
          "event.id": event.id 
        });
        
        if (existingEvent) {
          return res.status(200).json({ 
            success: true,
            message: 'Event already saved',
            event: existingEvent,
            source: 'mongodb',
            timestamp: new Date().toISOString()
          });
        }

        // Add the event with timestamp
        const result = await interestedEventsCollection.insertOne({ 
          userId, 
          event, 
          savedAt: new Date(),
          source: 'user_action'
        });

        return res.status(201).json({ 
          success: true,
          message: 'Event saved',
          eventId: result.insertedId,
          event,
          source: 'mongodb',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving event:', error);
        return res.status(500).json({ 
          success: false,
          message: 'Error saving event',
          errorDetails: error.message,
          source: 'api_error',
          timestamp: new Date().toISOString()
        });
      }
    }

    // DELETE - Remove a saved event
    if (req.method === 'DELETE') {
      try {
        const { eventId } = req.body; // This should be the Ticketmaster event ID, not MongoDB ObjectId
        if (!eventId) {
          return res.status(400).json({ 
            success: false,
            message: 'Event ID is required',
            source: 'api',
            timestamp: new Date().toISOString()
          });
        }

        const result = await interestedEventsCollection.deleteOne({ 
          userId, 
          "event.id": eventId 
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ 
            success: false,
            message: 'Event not found or not saved by user',
            source: 'mongodb',
            timestamp: new Date().toISOString()
          });
        }

        return res.status(200).json({ 
          success: true,
          message: 'Event removed',
          source: 'mongodb',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error removing event:', error);
        return res.status(500).json({ 
          success: false,
          message: 'Error removing event',
          errorDetails: error.message,
          source: 'api_error',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ 
      success: false,
      message: `Method ${req.method} Not Allowed`,
      source: 'api',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in interested-events API:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: error.message,
      source: 'api_error',
      timestamp: new Date().toISOString()
    });
  }
}
