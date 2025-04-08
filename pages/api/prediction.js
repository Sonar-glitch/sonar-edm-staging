/**
 * API routes for prediction models in Sonar EDM Platform
 * 
 * This file provides API endpoints for accessing prediction models
 * using the centralized configuration system.
 */

import { 
  ArtistPopularityPredictor, 
  EventDemandForecaster, 
  TicketPriceOptimizer, 
  MusicTasteAnalyzer 
} from '../../../lib/prediction';

// Initialize prediction models
const artistPredictor = new ArtistPopularityPredictor();
const demandForecaster = new EventDemandForecaster();
const priceOptimizer = new TicketPriceOptimizer();
const tasteAnalyzer = new MusicTasteAnalyzer();

/**
 * API handler for prediction-related endpoints
 */
export default async function handler(req, res) {
  // Check if the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract prediction type from query
    const { type } = req.query;
    
    // Extract data from request body
    const data = req.body;
    
    // Handle different prediction types
    switch (type) {
      case 'artist-popularity':
        if (!data.artistData) {
          return res.status(400).json({ error: 'Artist data is required' });
        }
        const popularityPrediction = artistPredictor.predictPopularity(data.artistData);
        return res.status(200).json(popularityPrediction);
        
      case 'event-demand':
        if (!data.eventData) {
          return res.status(400).json({ error: 'Event data is required' });
        }
        const demandForecast = demandForecaster.forecastDemand(data.eventData);
        return res.status(200).json(demandForecast);
        
      case 'ticket-price':
        if (!data.eventData) {
          return res.status(400).json({ error: 'Event data is required' });
        }
        const priceRecommendation = priceOptimizer.optimizePrice(data.eventData);
        return res.status(200).json(priceRecommendation);
        
      case 'music-taste':
        if (!data.userData) {
          return res.status(400).json({ error: 'User data is required' });
        }
        const tasteAnalysis = tasteAnalyzer.analyzeTaste(data.userData);
        return res.status(200).json(tasteAnalysis);
        
      default:
        return res.status(400).json({ error: 'Invalid prediction type' });
    }
  } catch (error) {
    console.error('Prediction API error:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
