/**
 * Prediction Models Index for Sonar EDM Platform
 * 
 * This file exports all prediction models and related functionality
 * to provide a unified interface for the application.
 */

import { ArtistPopularityPredictor } from './artistPopularity';
import { EventDemandForecaster } from './eventDemand';
import { TicketPriceOptimizer } from './ticketPricing';
import { MusicTasteAnalyzer } from './musicTaste';

// Export all prediction models
export {
  ArtistPopularityPredictor,
  EventDemandForecaster,
  TicketPriceOptimizer,
  MusicTasteAnalyzer
};
