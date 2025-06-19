import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '@/lib/mongodb'; // Ensure this path is correct

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const client = await clientPromise;
    const db = client.db('sonar_edm_db'); // Use your actual DB name
    const interestedEventsCollection = db.collection('interestedEvents');
    const userId = session.user.id; // Or session.user.email, depending on your user ID

    // GET - Fetch all saved events for the user
    if (req.method === 'GET') {
      const events = await interestedEventsCollection.find({ userId }).toArray();
      return res.status(200).json({ events });
    }

    // POST - Save a new event
    if (req.method === 'POST') {
      const { event } = req.body;
      if (!event || !event.id) {
        return res.status(400).json({ message: 'Event data is required' });
      }
      // Check if event already exists for this user
      const existingEvent = await interestedEventsCollection.findOne({ userId, "event.id": event.id });
      if (existingEvent) {
        return res.status(200).json({ message: 'Event already saved', event: existingEvent });
      }
      const result = await interestedEventsCollection.insertOne({ userId, event, savedAt: new Date() });
      return res.status(201).json({ message: 'Event saved', eventId: result.insertedId, event });
    }

    // DELETE - Remove a saved event
    if (req.method === 'DELETE') {
      const { eventId } = req.body; // This should be the Ticketmaster event ID, not MongoDB ObjectId
      if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required' });
      }
      const result = await interestedEventsCollection.deleteOne({ userId, "event.id": eventId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Event not found or not saved by user' });
      }
      return res.status(200).json({ message: 'Event removed' });
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('Error in interested-events API:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
