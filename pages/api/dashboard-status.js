import { MongoClient } from 'mongodb';
import cors from '../../cors-middleware';

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }

    const mongoUri = process.env.MONGODB_URI;
    const client = new MongoClient(mongoUri);
    await client.connect();
    cachedClient = client;
    return client;
}

export default async function handler(req, res) {
    // Apply CORS
    await cors(req, res);

    if (req.method !== 'GET') {
        console.log('[Dashboard Status] Received non-GET request:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Dashboard Status] API called at:', new Date().toISOString());
    console.log('[Dashboard Status] Headers:', req.headers);
    console.log('[Dashboard Status] Query params:', req.query);

    try {
        const client = await connectToDatabase();
        const db = client.db('sonar');

        console.log('[Dashboard Status] Connected to database');

        // Check user profiles collection
        const usersCollection = db.collection('userProfiles');
        const totalUsers = await usersCollection.countDocuments();
        
        console.log('[Dashboard Status] Total users found:', totalUsers);

        // Check if this is a first-time login scenario
        const isFirstLogin = totalUsers === 0;
        console.log('[Dashboard Status] Is first login:', isFirstLogin);

        // Get basic stats
        const [eventsCount, artistsCount] = await Promise.all([
            db.collection('events_unified').countDocuments(),
            db.collection('artistGenres').countDocuments()
        ]);

        console.log('[Dashboard Status] Events count:', eventsCount);
        console.log('[Dashboard Status] Artists count:', artistsCount);

        const response = {
            status: 'success',
            timestamp: new Date().toISOString(),
            isFirstLogin,
            stats: {
                totalUsers,
                eventsCount,
                artistsCount
            },
            debug: {
                mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
                nodeEnv: process.env.NODE_ENV || 'not-set'
            }
        };

        console.log('[Dashboard Status] Sending response:', JSON.stringify(response, null, 2));
        
        return res.status(200).json(response);

    } catch (error) {
        console.error('[Dashboard Status] Error:', error);
        console.error('[Dashboard Status] Error stack:', error.stack);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
