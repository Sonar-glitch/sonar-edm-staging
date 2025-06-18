import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const client = await clientPromise;
    const db = client.db('sonar_edm');
    const collection = db.collection('user_interested_events');
    const userEmail = session.user.email;

    console.log(`🎯 Interested Events API called by ${userEmail} - Method: ${req.method}`);

    if (req.method === 'GET') {
      // Get user's liked events
      const userEvents = await collection.findOne({ userEmail });
      const events = userEvents?.events || [];
      
      console.log(`✅ Retrieved ${events.length} liked events for ${userEmail}`);
      
      return res.status(200).json({
        success: true,
        events: events,
        count: events.length
      });

    } else if (req.method === 'POST') {
      // Add event to liked events
      const { eventId, eventData } = req.body;
      
      if (!eventId || !eventData) {
        return res.status(400).json({ error: 'Event ID and data required' });
      }

      // Add timestamp and user info to event data
      const enrichedEventData = {
        ...eventData,
        id: eventId,
        likedAt: new Date(),
        likedBy: userEmail
      };

      // Update or create user's liked events
      const result = await collection.updateOne(
        { userEmail },
        {
          $addToSet: { events: enrichedEventData },
          $set: { 
            lastUpdated: new Date(),
            userEmail: userEmail
          }
        },
        { upsert: true }
      );

      console.log(`✅ Event ${eventId} added to liked events for ${userEmail}`);

      // Update user's taste profile based on liked event
      await updateTasteProfile(userEmail, eventData, 'like');

      return res.status(200).json({
        success: true,
        message: 'Event added to liked events',
        eventId: eventId
      });

    } else if (req.method === 'DELETE') {
      // Remove event from liked events
      const { eventId } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ error: 'Event ID required' });
      }

      // Remove event from user's liked events
      const result = await collection.updateOne(
        { userEmail },
        {
          $pull: { events: { id: eventId } },
          $set: { lastUpdated: new Date() }
        }
      );

      console.log(`✅ Event ${eventId} removed from liked events for ${userEmail}`);

      // Update user's taste profile based on unliked event
      await updateTasteProfile(userEmail, { id: eventId }, 'unlike');

      return res.status(200).json({
        success: true,
        message: 'Event removed from liked events',
        eventId: eventId
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ Interested Events API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Update user's taste profile based on liked/unliked events
async function updateTasteProfile(userEmail, eventData, action) {
  try {
    const client = await clientPromise;
    const db = client.db('sonar_edm');
    const tasteCollection = db.collection('user_taste_profiles');

    console.log(`🧠 Updating taste profile for ${userEmail} - Action: ${action}`);

    if (action === 'like') {
      // Extract learning signals from liked event
      const learningSignals = {
        genres: eventData.genres || [],
        venue: eventData.venue,
        venueType: eventData.venueType,
        artists: eventData.headliners || [],
        matchScore: eventData.matchScore,
        city: eventData.city,
        likedAt: new Date()
      };

      // Update taste profile with positive signals
      await tasteCollection.updateOne(
        { userEmail },
        {
          $push: {
            likedEvents: {
              eventId: eventData.id,
              ...learningSignals
            }
          },
          $inc: {
            'preferences.totalLikes': 1
          },
          $set: {
            lastLearningUpdate: new Date(),
            userEmail: userEmail
          }
        },
        { upsert: true }
      );

      // Update genre preferences
      if (eventData.genres && eventData.genres.length > 0) {
        for (const genre of eventData.genres) {
          await tasteCollection.updateOne(
            { userEmail },
            {
              $inc: {
                [`preferences.genres.${genre.toLowerCase()}`]: 1
              }
            }
          );
        }
      }

      // Update venue preferences
      if (eventData.venue) {
        await tasteCollection.updateOne(
          { userEmail },
          {
            $inc: {
              [`preferences.venues.${eventData.venue.toLowerCase()}`]: 1
            }
          }
        );
      }

      console.log(`✅ Taste profile updated with positive signals for ${userEmail}`);

    } else if (action === 'unlike') {
      // Remove from liked events and add to negative signals
      await tasteCollection.updateOne(
        { userEmail },
        {
          $pull: {
            likedEvents: { eventId: eventData.id }
          },
          $push: {
            unlikedEvents: {
              eventId: eventData.id,
              unlikedAt: new Date()
            }
          },
          $inc: {
            'preferences.totalUnlikes': 1
          },
          $set: {
            lastLearningUpdate: new Date()
          }
        }
      );

      console.log(`✅ Taste profile updated with negative signals for ${userEmail}`);
    }

  } catch (error) {
    console.error('❌ Error updating taste profile:', error);
    // Don't throw error - taste profile update is secondary to main functionality
  }
}
