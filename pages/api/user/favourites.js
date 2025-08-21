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
      // Return the user's favourites in the SAME order they were saved
      const ids = (userProfile?.savedEventIds || []).filter(Boolean);
      if (!ids.length) return res.status(200).json({ favourites: [], count: 0, missingIds: [] });

      const includeMissing = req.query.includeMissing === '1' || req.query.includeMissing === 'true';

      // Map to ObjectIds, capture invalid separately (won't appear in results)
      const idPairs = ids.map(id => ({ id, obj: (() => { try { return new ObjectId(id); } catch { return null; } })() }));
      const objectIds = idPairs.filter(p => p.obj).map(p => p.obj);

      const eventsRaw = await db.collection('events_unified')
        .find({ _id: { $in: objectIds } })
        .project({ name: 1, date: 1, venue: 1, artists: 1, image: 1, images: 1, genres: 1 })
        .toArray();

      // Index by string _id for fast reordering
      const byId = new Map(eventsRaw.map(ev => [String(ev._id), ev]));

      const favourites = ids
        .map(eventId => {
          const ev = byId.get(eventId);
          if (!ev) return null;
          // Provide a stable top-level image field (prefer existing image, else first in images array)
          const primaryImage = ev.image || (Array.isArray(ev.images) ? ev.images.find(i => typeof i === 'string' && i.trim()) : null) || null;
          return {
            _id: ev._id,
            eventId: String(ev._id),
            name: ev.name,
            date: ev.date,
            venue: ev.venue,
            artists: ev.artists,
            image: primaryImage,
            genres: ev.genres || [],
          };
        })
        .filter(Boolean);

      const foundIdsSet = new Set(favourites.map(f => f.eventId));
      const missingIds = includeMissing ? ids.filter(id => !foundIdsSet.has(id)) : [];

      return res.status(200).json({ favourites, count: favourites.length, missingIds });
    }

    if (req.method === 'POST') {
      const { eventId } = req.body || {};
      if (!eventId) return res.status(400).json({ error: 'eventId required' });

      // Add to set to avoid duplicates, then (optionally) prune if list grows too large
      await db.collection('userProfiles').updateOne(
        { email },
        { $addToSet: { savedEventIds: eventId } },
        { upsert: true }
      );

      // Optional pruning (soft cap) to protect against unbounded growth
      const MAX_FAVOURITES = 1000; // adjust as needed
      const updated = await db.collection('userProfiles').findOne({ email }, { projection: { savedEventIds: 1 } });
      if (updated?.savedEventIds?.length > MAX_FAVOURITES) {
        // Keep the most recent MAX_FAVOURITES (we assume append order) by slicing from end
        const trimmed = updated.savedEventIds.slice(-MAX_FAVOURITES);
        await db.collection('userProfiles').updateOne(
          { email },
          { $set: { savedEventIds: trimmed } }
        );
      }
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
