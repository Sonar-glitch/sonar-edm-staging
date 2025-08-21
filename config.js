/**
 * Sonar EDM Platform - Centralized Configuration System
 * 
 * This file serves as the central configuration hub for all API keys, credentials,
 * and environment-specific settings. This approach allows for:
 * 
 * 1. Easy management of all credentials in one place
 * 2. Simple deployment across different environments
 * 3. Secure handling of sensitive information
 * 4. Consistent access pattern throughout the application
 */

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Configuration object with all application settings
const config = {
  // Application metadata
  app: {
    name: process.env.APP_NAME || 'Sonar EDM Platform',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    baseUrl: process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
  },

  // Spotify API credentials
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/spotify',
    
    // Validate Spotify credentials
    isConfigured: function() {
      return this.clientId && this.clientSecret;
    }
  },

  // MongoDB connection settings
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME || 'sonar-edm',
    
    // Validate MongoDB configuration
    isConfigured: function() {
      return this.uri;
    }
  },

  // NextAuth authentication configuration
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    
    // Validate NextAuth configuration
    isConfigured: function() {
      return this.secret;
    }
  },

  // Feature flags for enabling/disabling specific functionality
  features: {
    promoterAnalytics: process.env.FEATURE_PROMOTER_ANALYTICS !== 'false',
    userMusicTaste: process.env.FEATURE_USER_MUSIC_TASTE !== 'false',
    artistPrediction: process.env.FEATURE_ARTIST_PREDICTION !== 'false',
    eventForecasting: process.env.FEATURE_EVENT_FORECASTING !== 'false',
    ticketPricing: process.env.FEATURE_TICKET_PRICING !== 'false',
    genreTrends: process.env.FEATURE_GENRE_TRENDS !== 'false',
    cityAudience: process.env.FEATURE_CITY_AUDIENCE !== 'false',
    similarArtists: process.env.FEATURE_SIMILAR_ARTISTS !== 'false',
    eventMatching: process.env.FEATURE_EVENT_MATCHING !== 'false',
    trendingArtists: process.env.FEATURE_TRENDING_ARTISTS !== 'false',
    locationRecommendations: process.env.FEATURE_LOCATION_RECOMMENDATIONS !== 'false'
  },

  // Validate the entire configuration
  validateConfig: function() {
    const missingConfigs = [];
    
    if (!this.spotify.isConfigured()) {
      missingConfigs.push('Spotify API credentials');
    }
    
    if (!this.mongodb.isConfigured()) {
      missingConfigs.push('MongoDB connection string');
    }
    
    if (!this.auth.isConfigured()) {
      missingConfigs.push('NextAuth secret');
    }
    
    return {
      isValid: missingConfigs.length === 0,
      missingConfigs
    };
  }
};

module.exports = config;
