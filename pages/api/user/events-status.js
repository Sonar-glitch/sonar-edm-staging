// pages/api/user/events-status.js
// 🎪 USER EVENTS STATUS API
// Returns status of event collection and matching for the user

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    const userEmail = session.user.email;
    
    // Check if user has a taste profile (required for event matching)
    const tasteProfile = await db.collection('user_taste_profiles').findOne({ userEmail });
    
    if (!tasteProfile) {
      return res.status(200).json({
        status: 'pending',
        message: 'Music taste profile required for event matching',
        eventsAvailable: 0,
        matchesCalculated: 0
      });
    }

    // Get basic event statistics
    const totalEvents = await db.collection('events_unified').countDocuments({
      date: { $gte: new Date() } // Only future events
    });

    // Check if user has personalized event recommendations
    const userEventMatches = await db.collection('user_event_matches').findOne({ userEmail });
    
    // Check user's interested events
    const interestedEvents = await db.collection('user_interested_events').find({ userEmail }).toArray();

    // Determine status based on available data
    let status = 'available';
    let message = 'Events ready for matching';
    let matchesCalculated = 0;

    if (userEventMatches) {
      matchesCalculated = userEventMatches.matches?.length || 0;
      status = 'available';
      message = `${matchesCalculated} personalized matches available`;
    } else if (totalEvents > 0) {
      status = 'loading';
      message = 'Calculating event matches...';
    } else {
      status = 'pending';
      message = 'No events available';
    }

    return res.status(200).json({
      status,
      message,
      eventsAvailable: totalEvents,
      matchesCalculated,
      interestedCount: interestedEvents.length,
      lastCalculated: userEventMatches?.lastUpdated || null,
      tasteProfileReady: true
    });
    
  } catch (error) {
    console.error('Error getting events status:', error);
    return res.status(500).json({ 
      status: 'error',
      error: 'Failed to get events status',
      message: error.message 
    });
  }
}
