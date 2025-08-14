import { MongoClient } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import corsMiddleware from './cors-middleware';

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

async function handler(req, res) {
    if (req.method !== 'GET') {
        console.log('[Dashboard Status] Received non-GET request:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[Dashboard Status] API called at:', new Date().toISOString());

    try {
        // 🔐 CHECK: Get the current user session
        const session = await getServerSession(req, res, authOptions);
        console.log('[Dashboard Status] Session:', session ? session.user.email : 'No session');

        const client = await connectToDatabase();
        const db = client.db('sonar');

        console.log('[Dashboard Status] Connected to database');

        // 🎯 FIX: Check if THIS SPECIFIC USER has a profile, not total users globally
        let userHasProfile = false;
        let isFirstLogin = true;

        if (session && session.user) {
            const userProfile = await db.collection('userProfiles').findOne({ 
                email: session.user.email 
            });
            userHasProfile = !!userProfile;
            isFirstLogin = !userHasProfile; // First login if this user has no profile
            console.log('[Dashboard Status] User has profile:', userHasProfile);
        } else {
            console.log('[Dashboard Status] No session - user not logged in');
            // For non-authenticated users, don't show first-login onboarding
            isFirstLogin = false;
        }

        // Get basic stats
        const [eventsCount, artistsCount, totalUsers] = await Promise.all([
            db.collection('events_unified').countDocuments(),
            db.collection('artistGenres').countDocuments(),
            db.collection('userProfiles').countDocuments()
        ]);

        console.log('[Dashboard Status] Events count:', eventsCount);
        console.log('[Dashboard Status] Artists count:', artistsCount);
        console.log('[Dashboard Status] Total users:', totalUsers);

        const response = {
            status: {
                showTasteLoader: isFirstLogin && !!session, // Only show for logged-in users with no profile
                showEventsLoader: false,
                isFirstLogin: isFirstLogin && !!session,    // Only true for logged-in users with no profile  
                userHasProfile: userHasProfile,
                isAuthenticated: !!session
            },
            timestamp: new Date().toISOString(),
            stats: {
                totalUsers,
                eventsCount,
                artistsCount
            },
            debug: {
                mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
                nodeEnv: process.env.NODE_ENV || 'not-set',
                userEmail: session?.user?.email || 'not-logged-in'
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

export default corsMiddleware(handler);
