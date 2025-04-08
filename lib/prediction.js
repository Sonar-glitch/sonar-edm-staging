/**
 * AI Prediction Models for Sonar EDM Platform
 * 
 * This module provides machine learning models and algorithms for:
 * - Artist popularity prediction
 * - Event demand forecasting
 * - Ticket price optimization
 * - Music taste analysis
 * 
 * Uses the centralized configuration system for model parameters.
 */

const config = require('../config');

/**
 * Artist Popularity Prediction Model
 * Predicts future popularity of artists based on current metrics and trends
 */
class ArtistPopularityPredictor {
  constructor() {
    // Model parameters would be loaded from a trained model in production
    this.weights = {
      currentPopularity: 0.4,
      followerGrowthRate: 0.25,
      recentReleases: 0.15,
      socialMediaMentions: 0.1,
      festivalAppearances: 0.1
    };
  }

  /**
   * Predict future popularity of an artist
   * @param {Object} artistData - Artist metrics and historical data
   * @returns {Object} Prediction results with confidence score
   */
  predictPopularity(artistData) {
    // Validate input data
    if (!artistData || !artistData.currentPopularity) {
      throw new Error('Invalid artist data for popularity prediction');
    }

    // In a real implementation, this would use a trained ML model
    // For now, we'll use a weighted formula based on available metrics
    const {
      currentPopularity = 0,
      followerGrowthRate = 0,
      recentReleases = 0,
      socialMediaMentions = 0,
      festivalAppearances = 0
    } = artistData;

    // Calculate predicted popularity (0-100 scale)
    const predictedPopularity = Math.min(100, Math.max(0,
      this.weights.currentPopularity * currentPopularity +
      this.weights.followerGrowthRate * followerGrowthRate +
      this.weights.recentReleases * recentReleases +
      this.weights.socialMediaMentions * socialMediaMentions +
      this.weights.festivalAppearances * festivalAppearances
    ));

    // Calculate confidence score based on data completeness
    const dataPoints = Object.keys(artistData).filter(key => artistData[key] !== undefined).length;
    const maxDataPoints = 5; // Total possible data points
    const confidenceScore = Math.min(0.95, 0.5 + (dataPoints / maxDataPoints) * 0.45);

    // Generate growth trajectory for next 6 months
    const growthTrajectory = this.generateGrowthTrajectory(currentPopularity, predictedPopularity);

    return {
      currentPopularity,
      predictedPopularity: Math.round(predictedPopularity),
      confidenceScore,
      growthTrajectory,
      nextMonthPopularity: growthTrajectory[1],
      threeMonthPopularity: growthTrajectory[3],
      sixMonthPopularity: growthTrajectory[6]
    };
  }

  /**
   * Generate a growth trajectory for popularity over time
   * @param {number} current - Current popularity value
   * @param {number} predicted - Predicted popularity value
   * @returns {Object} Monthly popularity predictions
   */
  generateGrowthTrajectory(current, predicted) {
    const trajectory = { 0: current };
    const months = 6;
    const diff = predicted - current;
    
    // Generate a slightly non-linear growth curve
    for (let i = 1; i <= months; i++) {
      // Use a sigmoid-like function for more realistic growth
      const progress = i / months;
      const factor = 1 / (1 + Math.exp(-10 * (progress - 0.5)));
      trajectory[i] = Math.round(current + diff * factor);
    }
    
    return trajectory;
  }
}

/**
 * Event Demand Forecasting Model
 * Predicts attendance and demand for events based on various factors
 */
class EventDemandForecaster {
  constructor() {
    // Model parameters
    this.weights = {
      artistPopularity: 0.35,
      venueCapacity: 0.1,
      dayOfWeek: 0.15,
      seasonality: 0.1,
      competingEvents: 0.15,
      ticketPrice: 0.15
    };
    
    // Day of week factors (Friday/Saturday are highest)
    this.dayFactors = {
      0: 0.6,  // Sunday
      1: 0.5,  // Monday
      2: 0.55, // Tuesday
      3: 0.6,  // Wednesday
      4: 0.7,  // Thursday
      5: 1.0,  // Friday
      6: 0.95  // Saturday
    };
    
    // Seasonality factors by month
    this.seasonFactors = {
      0: 0.7,  // January
      1: 0.75, // February
      2: 0.8,  // March
      3: 0.85, // April
      4: 0.9,  // May
      5: 1.0,  // June
      6: 1.0,  // July
      7: 0.95, // August
      8: 0.9,  // September
      9: 0.85, // October
      10: 0.8, // November
      11: 0.75 // December
    };
  }

  /**
   * Forecast demand for an event
   * @param {Object} eventData - Event details and context
   * @returns {Object} Demand forecast with attendance prediction
   */
  forecastDemand(eventData) {
    // Validate input data
    if (!eventData || !eventData.artistPopularity || !eventData.venueCapacity) {
      throw new Error('Invalid event data for demand forecasting');
    }

    const {
      artistPopularity = 0,
      venueCapacity = 0,
      dayOfWeek = new Date().getDay(),
      month = new Date().getMonth(),
      competingEvents = 0,
      ticketPrice = 0
    } = eventData;

    // Normalize ticket price impact (higher prices reduce demand)
    const priceImpact = Math.max(0, 100 - ticketPrice * 2) / 100;
    
    // Calculate competing events impact (more events reduce demand)
    const competingImpact = Math.max(0, 100 - competingEvents * 10) / 100;
    
    // Get day and season factors
    const dayFactor = this.dayFactors[dayOfWeek] || 0.7;
    const seasonFactor = this.seasonFactors[month] || 0.8;
    
    // Calculate base demand score (0-100)
    const demandScore = 
      this.weights.artistPopularity * artistPopularity +
      this.weights.venueCapacity * (venueCapacity > 0 ? Math.min(100, venueCapacity / 100) : 50) +
      this.weights.dayOfWeek * (dayFactor * 100) +
      this.weights.seasonality * (seasonFactor * 100) +
      this.weights.competingEvents * (competingImpact * 100) +
      this.weights.ticketPrice * (priceImpact * 100);
    
    // Calculate expected attendance
    const attendanceRate = Math.min(1, demandScore / 100 * 1.2);
    const expectedAttendance = Math.round(venueCapacity * attendanceRate);
    
    // Calculate sell-out probability
    const sellOutProbability = Math.min(1, Math.max(0, (demandScore - 70) / 30));
    
    return {
      demandScore: Math.round(demandScore),
      expectedAttendance,
      attendanceRate: Math.round(attendanceRate * 100),
      sellOutProbability: Math.round(sellOutProbability * 100),
      bestDayOfWeek: this.getBestDayOfWeek(),
      recommendedPromotionLevel: this.getRecommendedPromotionLevel(demandScore)
    };
  }
  
  /**
   * Get the best day of the week for events
   * @returns {string} Best day for event scheduling
   */
  getBestDayOfWeek() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const factors = Object.entries(this.dayFactors);
    factors.sort((a, b) => b[1] - a[1]);
    return days[factors[0][0]];
  }
  
  /**
   * Get recommended promotion level based on demand score
   * @param {number} demandScore - Calculated demand score
   * @returns {string} Recommended promotion level
   */
  getRecommendedPromotionLevel(demandScore) {
    if (demandScore >= 85) return 'Low - Event will likely sell itself';
    if (demandScore >= 70) return 'Medium - Standard promotion recommended';
    if (demandScore >= 50) return 'High - Aggressive promotion needed';
    return 'Very High - Consider additional incentives';
  }
}

/**
 * Ticket Price Optimizer
 * Recommends optimal ticket pricing based on demand and artist popularity
 */
class TicketPriceOptimizer {
  constructor() {
    // Base price factors
    this.basePriceFactors = {
      artistPopularity: 0.5,
      venuePrestige: 0.2,
      productionCost: 0.3
    };
    
    // Adjustment factors
    this.adjustmentFactors = {
      demandLevel: 0.3,
      competingEvents: -0.1,
      dayOfWeek: 0.1,
      advancePurchase: -0.2
    };
  }

  /**
   * Optimize ticket price for maximum revenue
   * @param {Object} eventData - Event details and market context
   * @returns {Object} Price recommendations and revenue projections
   */
  optimizePrice(eventData) {
    // Validate input data
    if (!eventData || !eventData.artistPopularity || !eventData.venueCapacity) {
      throw new Error('Invalid event data for price optimization');
    }

    const {
      artistPopularity = 0,
      venueCapacity = 0,
      venuePrestige = 50,
      productionCost = 5000,
      demandLevel = 70,
      competingEvents = 0,
      dayOfWeek = new Date().getDay(),
      daysUntilEvent = 30
    } = eventData;

    // Calculate base price (in dollars)
    const basePrice = 
      (this.basePriceFactors.artistPopularity * artistPopularity * 0.5) +
      (this.basePriceFactors.venuePrestige * venuePrestige * 0.2) +
      (this.basePriceFactors.productionCost * (productionCost / venueCapacity) * 0.1);
    
    // Calculate adjustments
    const demandAdjustment = this.adjustmentFactors.demandLevel * (demandLevel / 100) * 20;
    const competingEventsAdjustment = this.adjustmentFactors.competingEvents * competingEvents * 2;
    const dayAdjustment = (dayOfWeek === 5 || dayOfWeek === 6) ? 5 : 0; // Weekend premium
    const advancePurchaseDiscount = daysUntilEvent > 60 ? -5 : daysUntilEvent > 30 ? -2 : 0;
    
    // Calculate optimal price
    const optimalPrice = Math.max(10, Math.round(
      basePrice + demandAdjustment + competingEventsAdjustment + dayAdjustment
    ));
    
    // Calculate tiered pricing
    const earlyBirdPrice = Math.max(10, Math.round(optimalPrice + advancePurchaseDiscount));
    const vipPrice = Math.round(optimalPrice * 2.5);
    const lastMinutePrice = Math.round(optimalPrice * 1.2);
    
    // Project revenue
    const projectedAttendance = Math.min(venueCapacity, Math.round(venueCapacity * (demandLevel / 100)));
    const projectedRevenue = projectedAttendance * optimalPrice;
    const breakEvenAttendance = Math.ceil(productionCost / optimalPrice);
    
    return {
      optimalPrice,
      priceTiers: {
        earlyBird: earlyBirdPrice,
        standard: optimalPrice,
        vip: vipPrice,
        lastMinute: lastMinutePrice
      },
      projectedRevenue,
      projectedAttendance,
      breakEvenAttendance,
      breakEvenPercentage: Math.round((breakEvenAttendance / venueCapacity) * 100)
    };
  }
}

/**
 * Music Taste Analyzer
 * Analyzes user music preferences and provides recommendations
 */
class MusicTasteAnalyzer {
  constructor() {
    // Feature weights for similarity calculation
    this.featureWeights = {
      genres: 0.3,
      acousticness: 0.05,
      danceability: 0.15,
      energy: 0.15,
      instrumentalness: 0.05,
      tempo: 0.1,
      valence: 0.1,
      popularity: 0.1
    };
    
    // Genre similarity matrix (simplified)
    this.genreSimilarity = {
      'house': { 'deep-house': 0.8, 'tech-house': 0.7, 'progressive-house': 0.6, 'techno': 0.5 },
      'techno': { 'tech-house': 0.7, 'house': 0.5, 'minimal-techno': 0.8, 'industrial': 0.6 },
      'trance': { 'progressive-trance': 0.9, 'psytrance': 0.7, 'progressive-house': 0.6 },
      'dubstep': { 'brostep': 0.8, 'trap': 0.6, 'drum-and-bass': 0.5 },
      'drum-and-bass': { 'jungle': 0.7, 'dubstep': 0.5, 'breakbeat': 0.6 }
    };
  }

  /**
   * Analyze user's music taste based on listening history
   * @param {Object} userData - User's listening history and preferences
   * @returns {Object} Taste profile and recommendations
   */
  analyzeTaste(userData) {
    // Validate input data
    if (!userData || !userData.topTracks || !userData.topArtists) {
      throw new Error('Invalid user data for taste analysis');
    }

    const { topTracks = [], topArtists = [], recentlyPlayed = [] } = userData;
    
    // Extract and aggregate audio features from top tracks
    const features = this.aggregateAudioFeatures(topTracks);
    
    // Extract top genres from artists
    const genreCount = this.countGenres(topArtists);
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Calculate taste profile
    const tasteProfile = {
      topGenres,
      danceability: features.danceability,
      energy: features.energy,
      valence: features.valence, // Musical positivity
      tempo: features.tempo,
      acousticness: features.acousticness,
      instrumentalness: features.instrumentalness
    };
    
    // Generate taste description
    const tasteDescription = this.generateTasteDescription(tasteProfile);
    
    // Find similar genres for recommendations
    const recommendedGenres = this.findSimilarGenres(topGenres);
    
    return {
      tasteProfile,
      tasteDescription,
      recommendedGenres,
      listeningPatterns: this.analyzeListeningPatterns(recentlyPlayed)
    };
  }
  
  /**
   * Aggregate audio features from tracks
   * @param {Array} tracks - List of tracks with audio features
   * @returns {Object} Aggregated audio features
   */
  aggregateAudioFeatures(tracks) {
    // Default values if no tracks are provided
    if (!tracks.length) {
      return {
        danceability: 50,
        energy: 50,
        valence: 50,
        tempo: 120,
        acousticness: 50,
        instrumentalness: 50
      };
    }
    
    // Sum all features
    const sum = tracks.reduce((acc, track) => {
      const features = track.audioFeatures || {};
      return {
        danceability: acc.danceability + (features.danceability || 0.5) * 100,
        energy: acc.energy + (features.energy || 0.5) * 100,
        valence: acc.valence + (features.valence || 0.5) * 100,
        tempo: acc.tempo + (features.tempo || 120),
        acousticness: acc.acousticness + (features.acousticness || 0.5) * 100,
        instrumentalness: acc.instrumentalness + (features.instrumentalness || 0.5) * 100
      };
    }, {
      danceability: 0,
      energy: 0,
      valence: 0,
      tempo: 0,
      acousticness: 0,
      instrumentalness: 0
    });
    
    // Calculate averages
    const count = tracks.length;
    return {
      danceability: Math.round(sum.danceability / count),
      energy: Math.round(sum.energy / count),
      valence: Math.round(sum.valence / count),
      tempo: Math.round(sum.tempo / count),
      acousticness: Math.round(sum.acousticness / count),
      instrumentalness: Math.round(sum.instrumentalness / count)
    };
  }
  
  /**
   * Count genres from artists
   * @param {Array} artists - List of artists with genres
   * @returns {Object} Genre frequency count
   */
  countGenres(artists) {
    const genreCount = {};
    
    artists.forEach(artist => {
      const genres = artist.genres || [];
      genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
    
    return genreCount;
  }
  
  /**
   * Generate a description of the user's music taste
   * @param {Object} profile - User's taste profile
   * @returns {string} Description of music taste
   */
  generateTasteDescription(profile) {
    const { energy, danceability, valence, topGenres } = profile;
    
    let description = "Your EDM taste is ";
    
    // Energy description
    if (energy > 80) description += "high-energy, ";
    else if (energy > 60) description += "energetic, ";
    else if (energy > 40) description += "moderate-energy, ";
    else description += "chill, ";
    
    // Danceability description
    if (danceability > 80) description += "very danceable, ";
    else if (danceability > 60) description += "danceable, ";
    else if (danceability > 40) description += "somewhat danceable, ";
    else description += "less focused on danceability, ";
    
    // Mood description
    if (valence > 80) description += "and upbeat. ";
    else if (valence > 60) description += "and positive. ";
    else if (valence > 40) description += "and balanced in mood. ";
    else if (valence > 20) description += "and somewhat dark. ";
    else description += 
(Content truncated due to size limit. Use line ranges to read in chunks)