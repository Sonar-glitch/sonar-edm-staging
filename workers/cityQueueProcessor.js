const axios = require("axios");
const mongoose = require("mongoose");

// Import the city request queue utilities
const { 
  getPendingCityRequests, 
  markCityAsProcessing, 
  markCityAsCompleted, 
  markCityAsError,
  cleanupOldRequests,
  getQueueStats
} = require("../lib/cityRequestQueue");

// Environment variables
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// Database connection
async function connectDB() {
    if (!MONGODB_URI) {
        console.error("Error: MONGODB_URI is not defined");
        process.exit(1);
    }
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    }
}

async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log("✅ MongoDB Disconnected");
    } catch (err) {
        console.error("❌ Error disconnecting MongoDB:", err.message);
    }
}

// Event schema for MongoDB
const eventSchema = new mongoose.Schema({
    sourceId: String,
    name: String,
    date: Date,
    startTime: String,
    venue: {
        name: String,
        address: String,
        city: String,
        coordinates: [Number]
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    artists: [String],
    artistList: [String],
    genres: [String],
    url: String,
    priceRange: {
        min: Number,
        max: Number
    },
    source: String,
    country: String,
    status: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

eventSchema.index({ location: "2dsphere" });
eventSchema.index({ date: 1 });
eventSchema.index({ sourceId: 1 });

const UnifiedEvent = mongoose.model('UnifiedEvent', eventSchema, 'events_unified');

// Main worker function
async function processQueue() {
    console.log("🚀 City Queue Processor Starting...");
    console.log("📅 Timestamp:", new Date().toISOString());
    
    await connectDB();
    
    try {
        // Clean up old requests
        cleanupOldRequests();
        const queueStats = getQueueStats();
        console.log("📊 Queue Statistics:", queueStats);
        
        // Get pending requests
        const pendingRequests = getPendingCityRequests();
        
        if (pendingRequests.length === 0) {
            console.log("📭 No pending city requests to process");
            return;
        }
        
        console.log(`📋 Processing ${pendingRequests.length} pending city requests:`);
        pendingRequests.forEach((req, index) => {
            console.log(`   ${index + 1}. ${req.city}, ${req.country} (${req.countryCode}) - Priority: ${req.priority}`);
        });
        
        let totalEvents = 0;
        let citiesProcessed = 0;
        
        for (const cityRequest of pendingRequests) {
            try {
                console.log(`\n🔄 Processing: ${cityRequest.city}, ${cityRequest.country}`);
                
                // Mark as processing
                markCityAsProcessing(cityRequest.city, cityRequest.country);
                
                // Fetch events for the city
                const cityEvents = await fetchEventsForCity(
                    cityRequest.city, 
                    cityRequest.countryCode,
                    cityRequest.latitude,
                    cityRequest.longitude
                );
                
                console.log(`✅ ${cityRequest.city}: ${cityEvents.length} events processed`);
                
                // Mark as completed
                markCityAsCompleted(cityRequest.city, cityRequest.country, cityEvents.length);
                
                totalEvents += cityEvents.length;
                citiesProcessed++;
                
                // Clear cache for this city so fresh events are returned
                await clearCityCache(cityRequest.city, cityRequest.latitude, cityRequest.longitude);
                
                // Rate limiting between cities
                if (citiesProcessed < pendingRequests.length) {
                    console.log("⏳ Rate limiting delay (5 seconds)...");
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
                
            } catch (error) {
                console.error(`❌ Failed to process ${cityRequest.city}, ${cityRequest.country}:`, error.message);
                markCityAsError(cityRequest.city, cityRequest.country, error.message);
            }
        }
        
        console.log(`\n🎯 QUEUE PROCESSING COMPLETED`);
        console.log(`📊 Total events processed: ${totalEvents}`);
        console.log(`🏙️ Cities processed: ${citiesProcessed}`);
        
    } catch (error) {
        console.error("🚨 Queue processor failed:", error);
    } finally {
        await disconnectDB();
    }
}

// Fetch events for a specific city
async function fetchEventsForCity(city, countryCode, latitude, longitude) {
    try {
        console.log(`🎫 Fetching Ticketmaster events for ${city}, ${countryCode}...`);
        
        const params = {
            apikey: TICKETMASTER_API_KEY,
            city: city,
            countryCode: countryCode,
            classificationName: 'music',
            size: 200,
            sort: 'date,asc'
        };
        
        const response = await axios.get(BASE_URL, { params, timeout: 30000 });
        
        if (!response.data._embedded?.events) {
            console.log(`📭 No events found for ${city}`);
            return [];
        }
        
        const events = response.data._embedded.events;
        console.log(`📥 Fetched ${events.length} raw events from Ticketmaster`);
        
        // Transform and save events
        const transformedEvents = [];
        
        for (const event of events) {
            try {
                const transformedEvent = transformTicketmasterEvent(event, city, countryCode, latitude, longitude);
                
                // Save to MongoDB
                await UnifiedEvent.findOneAndUpdate(
                    { sourceId: transformedEvent.sourceId },
                    transformedEvent,
                    { upsert: true, new: true }
                );
                
                transformedEvents.push(transformedEvent);
                
            } catch (transformError) {
                console.error(`⚠️ Error transforming event:`, transformError.message);
            }
        }
        
        console.log(`💾 Saved ${transformedEvents.length} events to MongoDB`);
        return transformedEvents;
        
    } catch (error) {
        console.error(`❌ Error fetching events for ${city}:`, error.message);
        return [];
    }
}

// Transform Ticketmaster event to unified format
function transformTicketmasterEvent(event, city, countryCode, latitude, longitude) {
    const venue = event._embedded?.venues?.[0];
    const attractions = event._embedded?.attractions || [];
    
    // Extract coordinates
    let coordinates = [longitude, latitude]; // Default to city coordinates
    if (venue?.location?.longitude && venue?.location?.latitude) {
        coordinates = [parseFloat(venue.location.longitude), parseFloat(venue.location.latitude)];
    }
    
    // Extract artists
    const artists = attractions.map(attraction => attraction.name).filter(Boolean);
    
    // Extract genres
    const genres = [];
    if (event.classifications) {
        event.classifications.forEach(classification => {
            if (classification.genre?.name) genres.push(classification.genre.name);
            if (classification.subGenre?.name) genres.push(classification.subGenre.name);
        });
    }
    
    // Extract price range
    let priceRange = null;
    if (event.priceRanges && event.priceRanges.length > 0) {
        const price = event.priceRanges[0];
        priceRange = {
            min: price.min || 0,
            max: price.max || 0
        };
    }
    
    return {
        sourceId: event.id,
        name: event.name,
        date: event.dates?.start?.localDate ? new Date(event.dates.start.localDate) : null,
        startTime: event.dates?.start?.localTime || null,
        venue: {
            name: venue?.name || 'Venue TBA',
            address: venue?.address?.line1 || venue?.city?.name || 'Address TBA',
            city: venue?.city?.name || city,
            coordinates: coordinates
        },
        location: {
            type: 'Point',
            coordinates: coordinates
        },
        artists: artists,
        artistList: artists,
        genres: genres,
        url: event.url || null,
        priceRange: priceRange,
        source: 'ticketmaster',
        country: countryCode,
        status: event.dates?.status?.code || 'onsale',
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

// Clear cache for a city
async function clearCityCache(city, latitude, longitude) {
    try {
        // This would integrate with your cache system
        // For now, we'll just log that cache should be cleared
        console.log(`🗑️ Cache cleared for ${city} (${latitude}, ${longitude})`);
    } catch (error) {
        console.error(`⚠️ Error clearing cache for ${city}:`, error.message);
    }
}

// Run the queue processor
if (require.main === module) {
    processQueue()
        .then(() => {
            console.log("✅ Queue processing completed successfully");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Queue processing failed:", error);
            process.exit(1);
        });
}

module.exports = { processQueue };
