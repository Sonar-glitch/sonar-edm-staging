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
} from '../../lib/prediction';
import config from '../../config';
import { logApiRequest } from '../../lib/analytics';

// Check if prediction features are enabled in configuration
const {
  artistPrediction,
  eventForecasting,
  ticketPricing,
  userMusicTaste
} = config.features;

// Initialize prediction models with configuration
const predictors = {
  artistPopularity: artistPrediction ? new ArtistPopularityPredictor(config) : null,
  eventDemand: eventForecasting ? new EventDemandForecaster(config) : null,
  ticketPrice: ticketPricing ? new TicketPriceOptimizer(config) : null,
  musicTaste: userMusicTaste ? new MusicTasteAnalyzer(config) : null
};

/**
 * Validate that required prediction model is enabled
 * @param {string} type - Prediction type
 * @returns {boolean} Whether the prediction type is enabled
 */
function isPredictionEnabled(type) {
  switch (type) {
    case 'artist-popularity':
      return artistPrediction && predictors.artistPopularity !== null;
    case 'event-demand':
      return eventForecasting && predictors.eventDemand !== null;
    case 'ticket-price':
      return ticketPricing && predictors.ticketPrice !== null;
    case 'music-taste':
      return userMusicTaste && predictors.musicTaste !== null;
    default:
      return false;
  }
}

/**
 * API handler for prediction-related endpoints
 */
export default async function handler(req, res) {
  // Check if the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported for prediction endpoints'
    });
  }

  try {
    // Extract prediction type from query
    const { type } = req.query;
    
    // Check if prediction type is valid and enabled
    if (!type) {
      return res.status(400).json({ 
        error: 'Missing parameter',
        message: 'Prediction type must be specified in query parameters'
      });
    }
    
    if (!isPredictionEnabled(type)) {
      return res.status(403).json({ 
        error: 'Feature disabled',
        message: `The ${type} prediction feature is currently disabled in configuration`
      });
    }
    
    // Extract data from request body
    const data = req.body;
    
    // Log API request (for analytics)
    await logApiRequest({
      endpoint: `/api/prediction/${type}`,
      userId: req.session?.user?.id || 'anonymous',
      timestamp: new Date(),
      requestData: { ...data, _sensitive: '[REDACTED]' } // Redact sensitive data
    });
    
    // Handle different prediction types
    switch (type) {
      case 'artist-popularity':
        if (!data.artistData) {
          return res.status(400).json({ 
            error: 'Missing data',
            message: 'Artist data is required for popularity prediction'
          });
        }
        const popularityPrediction = await predictors.artistPopularity.predictPopularity(data.artistData);
        return res.status(200).json({
          success: true,
          data: popularityPrediction,
          timestamp: new Date()
        });
        
      case 'event-demand':
        if (!data.eventData) {
          return res.status(400).json({ 
            error: 'Missing data',
            message: 'Event data is required for demand forecasting'
          });
        }
        const demandForecast = await predictors.eventDemand.forecastDemand(data.eventData);
        return res.status(200).json({
          success: true,
          data: demandForecast,
          timestamp: new Date()
        });
        
      case 'ticket-price':
        if (!data.eventData) {
          return res.status(400).json({ 
            error: 'Missing data',
            message: 'Event data is required for price optimization'
          });
        }
        const priceRecommendation = await predictors.ticketPrice.optimizePrice(data.eventData);
        return res.status(200).json({
          success: true,
          data: priceRecommendation,
          timestamp: new Date()
        });
        
      case 'music-taste':
        if (!data.userData) {
          return res.status(400).json({ 
            error: 'Missing data',
            message: 'User data is required for taste analysis'
          });
        }
        const tasteAnalysis = await predictors.musicTaste.analyzeTaste(data.userData);
        return res.status(200).json({
          success: true,
          data: tasteAnalysis,
          timestamp: new Date()
        });
        
      default:
        return res.status(400).json({ 
          error: 'Invalid type',
          message: `Prediction type '${type}' is not supported`
        });
    }
  } catch (error) {
    console.error('Prediction API error:', error.message);
    
    // Determine if error is client-side or server-side
    const clientErrors = ['Invalid user data', 'Invalid artist data', 'Invalid event data'];
    const isClientError = clientErrors.some(msg => error.message.includes(msg));
    
    return res.status(isClientError ? 400 : 500).json({ 
      error: isClientError ? 'Invalid input' : 'Internal server error',
      message: error.message,
      timestamp: new Date()
    });
  }
}
