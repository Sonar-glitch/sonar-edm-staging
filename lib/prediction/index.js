/**
 * Prediction Models Index for Sonar EDM Platform
 * 
 * This file exports all prediction models and related functionality
 * to provide a unified interface for the application.
 */

import { predictArtistPopularity } from './artistPopularity';
import { forecastEventDemand } from './eventDemand';
import { optimizeTicketPricing } from './ticketPricing';
import { analyzeMusicTaste } from './musicTaste';

// Create class wrappers for backward compatibility
export class ArtistPopularityPredictor {
  predictPopularity(data) {
    return predictArtistPopularity(data);
  }
}

export class EventDemandForecaster {
  forecastDemand(data) {
    return forecastEventDemand(data);
  }
}

export class TicketPriceOptimizer {
  optimizePrice(data) {
    return optimizeTicketPricing(data);
  }
}

export class MusicTasteAnalyzer {
  analyzeTaste(data) {
    return analyzeMusicTaste(data);
  }
}

// Also export the functions directly
export {
  predictArtistPopularity,
  forecastEventDemand,
  optimizeTicketPricing,
  analyzeMusicTaste
}

