// pages/api/user/favourites.js
// Minimal favourites API: list + add (POST) + delete (DELETE with ?eventId=)
// Stores event ids inside userProfiles.savedEventIds []

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
const { connectToDatabase } = require('../../../lib/mongodb');
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { db } = await connectToDatabase();
    const email = session.user.email?.toLowerCase();
    const userProfile = await db.collection('userProfiles').findOne({ email });

    if (req.method === 'GET') {
      const ids = (userProfile?.savedEventIds || []).filter(Boolean);
      if (!ids.length) return res.status(200).json({ favourites: [], count: 0 });
      const objectIds = ids.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean);
      const events = await db.collection('events_unified')
        .find({ _id: { $in: objectIds } })
        .project({ name: 1, date: 1, venue: 1, artists: 1 })
        .toArray();
      return res.status(200).json({ favourites: events, count: events.length });
    }

    if (req.method === 'POST') {
      const { eventId } = req.body || {};
      if (!eventId) return res.status(400).json({ error: 'eventId required' });
      await db.collection('userProfiles').updateOne(
        { email },
        { $addToSet: { savedEventIds: eventId } },
        { upsert: true }
      );
      return res.status(201).json({ ok: true, eventId });
    }

    if (req.method === 'DELETE') {
      const { eventId } = req.query;
      if (!eventId) return res.status(400).json({ error: 'eventId required' });
      await db.collection('userProfiles').updateOne(
        { email },
        { $pull: { savedEventIds: eventId } }
      );
      return res.status(200).json({ ok: true, eventId });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('FAVOURITES API ERROR', e);
    return res.status(500).json({ error: 'Internal error', message: e.message });
  }
}
