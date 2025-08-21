#!/usr/bin/env node
/**
 * TIKO System Management Console
 * Consolidated tool for all database, pipeline, and enhancement operations
 * Replaces dozens of scattered scripts with one comprehensive interface
 */

const { MongoClient } = require('mongodb');
const path = require('path');

class TikoManager {
  constructor() {
    this.mongoClient = null;
    this.db = null;
  }

  async connect() {
    // Force correct MongoDB URI
    process.env.MONGODB_URI = 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM';
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }
    
    this.mongoClient = new MongoClient(process.env.MONGODB_URI);
    await this.mongoClient.connect();
    this.db = this.mongoClient.db('test'); // ✅ CORRECT: Using 'test' database as per project docs
    console.log(`✅ Connected to database: ${process.env.MONGODB_DB || 'test'}`);
  }

  async disconnect() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }

  // === DATABASE OPERATIONS ===
  async checkCollections() {
    console.log('\n🔍 DATABASE COLLECTIONS OVERVIEW');
    console.log('================================');
    
    const collections = await this.db.listCollections().toArray();
    
    for (const collection of collections) {
      const name = collection.name;
      const count = await this.db.collection(name).countDocuments();
      const sample = count > 0 ? await this.db.collection(name).findOne() : null;
      
      console.log(`\n📁 ${name}: ${count.toLocaleString()} documents`);
      
      if (sample) {
        const keys = Object.keys(sample).slice(0, 5);
        console.log(`   Sample fields: ${keys.join(', ')}${keys.length === 5 ? '...' : ''}`);
        
        // Special handling for events collections
        if (name.includes('events')) {
          const enhanced = await this.db.collection(name).countDocuments({ enhancementProcessed: true });
          const withScores = await this.db.collection(name).countDocuments({ personalizedScore: { $exists: true } });
          console.log(`   Enhanced: ${enhanced} | With scores: ${withScores}`);
        }
      }
    }
  }

  async checkEnhancementStatus() {
    console.log('\n🎯 ENHANCEMENT PIPELINE STATUS');
    console.log('==============================');
    
    const collections = ['events_unified', 'events_ticketmaster', 'events'];
    
    for (const collName of collections) {
      try {
        const coll = this.db.collection(collName);
        const total = await coll.countDocuments();
        
        if (total === 0) {
          console.log(`❌ ${collName}: No events found`);
          continue;
        }
        
        const enhanced = await coll.countDocuments({ enhancementProcessed: true });
        const withScores = await coll.countDocuments({ personalizedScore: { $exists: true } });
        const withArtists = await coll.countDocuments({ artists: { $exists: true, $ne: [] } });
        const withSound = await coll.countDocuments({ soundCharacteristics: { $exists: true } });
        
        console.log(`\n📊 ${collName}:`);
        console.log(`   Total events: ${total.toLocaleString()}`);
        console.log(`   Enhanced: ${enhanced.toLocaleString()} (${((enhanced/total)*100).toFixed(1)}%)`);
        console.log(`   With scores: ${withScores.toLocaleString()} (${((withScores/total)*100).toFixed(1)}%)`);
        console.log(`   With artists: ${withArtists.toLocaleString()} (${((withArtists/total)*100).toFixed(1)}%)`);
        console.log(`   With sound: ${withSound.toLocaleString()} (${((withSound/total)*100).toFixed(1)}%)`);
        
        // Recent activity
        const recent = await coll.countDocuments({
          enhancementTimestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
        });
        console.log(`   Enhanced last 24h: ${recent.toLocaleString()}`);
        
      } catch (err) {
        console.log(`❌ ${collName}: Collection not found`);
      }
    }
  }

  async checkSpecificEvents(query = {}) {
    console.log('\n🎪 EVENT ANALYSIS');
    console.log('=================');
    
    const coll = this.db.collection('events_unified');
    const events = await coll.find(query).limit(10).toArray();
    
    if (events.length === 0) {
      console.log('❌ No events found matching criteria');
      return;
    }
    
    events.forEach((event, i) => {
      console.log(`\n${i+1}. ${event.name || 'Unnamed Event'}`);
      console.log(`   Score: ${event.personalizedScore || 'N/A'}`);
      console.log(`   Artists: ${event.artists?.join(', ') || 'None'}`);
      console.log(`   Venue: ${event.venue?.name || event.location?.name || 'Unknown'}`);
      console.log(`   Enhanced: ${event.enhancementProcessed ? '✅' : '❌'}`);
      if (event.soundCharacteristics) {
        const sound = event.soundCharacteristics;
        console.log(`   Sound: E:${sound.energy} D:${sound.danceability} V:${sound.valence}`);
      }
    });
  }

  async performanceAnalysis() {
    console.log('\n⚡ PIPELINE PERFORMANCE ANALYSIS');
    console.log('=================================');
    
    const collections = ['events_unified', 'events_ticketmaster'];
    
    for (const collName of collections) {
      try {
        const coll = this.db.collection(collName);
        
        // Enhancement speed analysis
        const enhancedEvents = await coll.find({
          enhancementProcessed: true,
          enhancementTimestamp: { $exists: true }
        }).limit(100).toArray();
        
        if (enhancedEvents.length > 0) {
          console.log(`\n📈 ${collName} Performance:`);
          
          // Calculate enhancement sources
          const sources = {};
          enhancedEvents.forEach(event => {
            const source = event.soundCharacteristics?.source || 'unknown';
            sources[source] = (sources[source] || 0) + 1;
          });
          
          console.log('   Enhancement sources:');
          Object.entries(sources).forEach(([source, count]) => {
            console.log(`     ${source}: ${count} events`);
          });
          
          // Recent enhancement rate
          const last24h = enhancedEvents.filter(e => 
            new Date(e.enhancementTimestamp) > new Date(Date.now() - 24*60*60*1000)
          ).length;
          
          console.log(`   Enhanced in last 24h: ${last24h}`);
        }
        
      } catch (err) {
        console.log(`❌ ${collName}: Analysis failed - ${err.message}`);
      }
    }
  }

  // === CONFIDENCE SCORING ANALYSIS ===
  async confidenceAnalysis() {
    console.log('\n🎯 EVENT CONFIDENCE SCORING ANALYSIS');
    console.log('====================================');
    
    const coll = this.db.collection('events_unified');
    
    // Get sample events to analyze confidence factors
    const totalEvents = await coll.countDocuments();
    const sampleSize = Math.min(100, totalEvents); // Use 100 or total if less
    const events = await coll.find({}).limit(sampleSize).toArray();
    
    if (events.length === 0) {
      console.log('❌ No events found for analysis');
      return;
    }
    
    console.log(`\n📊 SAMPLE ANALYSIS:`);
    console.log(`   Total events in collection: ${totalEvents.toLocaleString()}`);
    console.log(`   Sample size analyzed: ${events.length}`);
    console.log(`   Coverage: ${((events.length/totalEvents)*100).toFixed(1)}%`);
    
    let totalConfidence = 0;
    const confidenceBreakdown = {};
    const detailedResults = [];
    
    // Calculate confidence for each event
    events.forEach((event, index) => {
      const confidence = this.calculateEventConfidence(event);
      totalConfidence += confidence.total;
      
      // Track confidence ranges
      const range = this.getConfidenceRange(confidence.total);
      confidenceBreakdown[range] = (confidenceBreakdown[range] || 0) + 1;
      
      if (index < 5) { // Show detailed breakdown for first 5 events
        detailedResults.push({
          name: event.name || 'Unnamed Event',
          confidence: confidence
        });
      }
    });
    
    const avgConfidence = (totalConfidence / events.length).toFixed(1);
    
    console.log(`\n🎯 OVERALL CONFIDENCE METRICS:`);
    console.log(`   Average confidence: ${avgConfidence}%`);
    console.log(`   Confidence distribution:`);
    Object.entries(confidenceBreakdown).forEach(([range, count]) => {
      const percentage = ((count / events.length) * 100).toFixed(1);
      console.log(`     ${range}: ${count} events (${percentage}%)`);
    });
    
    console.log(`\n🔍 DETAILED BREAKDOWN (First 5 Events):`);
    detailedResults.forEach((result, i) => {
      console.log(`\n${i+1}. ${result.name}`);
      console.log(`   Overall Confidence: ${result.confidence.total}%`);
      console.log(`   Breakdown:`);
      console.log(`     Core Data: ${result.confidence.coreData}% (name, date, venue)`);
      console.log(`     Artists: ${result.confidence.artists}% (artist info)`);
      console.log(`     Sound: ${result.confidence.sound}% (audio characteristics)`);
      console.log(`     Genre: ${result.confidence.genre}% (genre classification)`);
      console.log(`     Location: ${result.confidence.location}% (venue details)`);
      console.log(`     Enhancement: ${result.confidence.enhancement}% (processing status)`);
      console.log(`   Missing: ${result.confidence.missing.join(', ') || 'None'}`);
    });
    
    // Aggregate statistics
    await this.aggregateConfidenceStats();
  }

  calculateEventConfidence(event) {
    let confidence = {
      coreData: 0,
      artists: 0,
      sound: 0,
      genre: 0,
      location: 0,
      enhancement: 0,
      total: 0,
      missing: []
    };
    
    // Core data (30% weight) - Essential fields
    let coreScore = 0;
    if (event.name) coreScore += 40;
    else confidence.missing.push('name');
    
    if (event.date || event.startDate) coreScore += 30;
    else confidence.missing.push('date');
    
    if (event.venue || event.location) coreScore += 30;
    else confidence.missing.push('venue');
    
    confidence.coreData = Math.min(coreScore, 100);
    
    // Artists (25% weight) - Critical for music matching
    if (event.artists && event.artists.length > 0) {
      confidence.artists = 100;
    } else if (event.artistList && event.artistList.length > 0) {
      confidence.artists = 80;
    } else {
      confidence.artists = 0;
      confidence.missing.push('artists');
    }
    
    // Sound characteristics (20% weight) - Core for recommendation
    if (event.soundCharacteristics) {
      let soundScore = 60; // Base score for having sound data
      
      if (event.soundCharacteristics.source !== 'surgical_fallback') {
        soundScore += 20; // Real data bonus
      }
      
      if (event.soundCharacteristics.confidence > 0.7) {
        soundScore += 20; // High confidence bonus
      } else if (event.soundCharacteristics.confidence > 0.3) {
        soundScore += 10; // Medium confidence bonus
      }
      
      confidence.sound = Math.min(soundScore, 100);
    } else {
      confidence.sound = 0;
      confidence.missing.push('sound_characteristics');
    }
    
    // Genre (10% weight) - Helpful for categorization
    if (event.genre && event.genre !== 'unknown') {
      confidence.genre = 100;
    } else if (event.categories && event.categories.length > 0) {
      confidence.genre = 70;
    } else {
      confidence.genre = 0;
      confidence.missing.push('genre');
    }
    
    // Location details (10% weight) - For geographical matching
    let locationScore = 0;
    if (event.venue?.name || event.location?.name) locationScore += 50;
    if (event.venue?.address || event.location?.address) locationScore += 30;
    if (event.venue?.city || event.location?.city) locationScore += 20;
    
    confidence.location = Math.min(locationScore, 100);
    if (locationScore === 0) confidence.missing.push('location_details');
    
    // Enhancement status (5% weight) - Processing completion
    if (event.enhancementProcessed) {
      confidence.enhancement = 100;
    } else if (event.enhancementAttempts > 0) {
      confidence.enhancement = 50;
    } else {
      confidence.enhancement = 0;
      confidence.missing.push('enhancement');
    }
    
    // Calculate weighted total
    confidence.total = Math.round(
      (confidence.coreData * 0.3) +
      (confidence.artists * 0.25) +
      (confidence.sound * 0.2) +
      (confidence.genre * 0.1) +
      (confidence.location * 0.1) +
      (confidence.enhancement * 0.05)
    );
    
    return confidence;
  }
  
  getConfidenceRange(score) {
    if (score >= 90) return 'Excellent (90-100%)';
    if (score >= 75) return 'Good (75-89%)';
    if (score >= 60) return 'Fair (60-74%)';
    if (score >= 40) return 'Poor (40-59%)';
    return 'Very Poor (0-39%)';
  }
  
  async aggregateConfidenceStats() {
    console.log(`\n📈 AGGREGATE CONFIDENCE STATISTICS:`);
    
    const coll = this.db.collection('events_unified');
    
    // Count events by data completeness
    const withArtists = await coll.countDocuments({ 
      $or: [
        { artists: { $exists: true, $ne: [] } },
        { artistList: { $exists: true, $ne: [] } }
      ]
    });
    
    const withSound = await coll.countDocuments({ 
      soundCharacteristics: { $exists: true }
    });
    
    const withRealSound = await coll.countDocuments({ 
      'soundCharacteristics.source': { $ne: 'surgical_fallback' }
    });
    
    const withGenre = await coll.countDocuments({ 
      $or: [
        { genre: { $exists: true, $ne: null, $ne: 'unknown' } },
        { categories: { $exists: true, $ne: [] } }
      ]
    });
    
    const enhanced = await coll.countDocuments({ 
      enhancementProcessed: true 
    });
    
    const total = await coll.countDocuments();
    
    console.log(`\n📊 DATA COMPLETENESS OVERVIEW:`);
    console.log(`   Total events: ${total.toLocaleString()}`);
    console.log(`   With artists: ${withArtists.toLocaleString()} (${((withArtists/total)*100).toFixed(1)}%)`);
    console.log(`   With sound data: ${withSound.toLocaleString()} (${((withSound/total)*100).toFixed(1)}%)`);
    console.log(`   With real sound: ${withRealSound.toLocaleString()} (${((withRealSound/total)*100).toFixed(1)}%)`);
    console.log(`   With genre: ${withGenre.toLocaleString()} (${((withGenre/total)*100).toFixed(1)}%)`);
    console.log(`   Enhanced: ${enhanced.toLocaleString()} (${((enhanced/total)*100).toFixed(1)}%)`);
    
    // Calculate ideal vs current state
    console.log(`\n🎯 SAMPLES NEEDED VS CALCULATED:`);
    console.log(`   Current logic requires:`);
    console.log(`     • Core data (name/date/venue): 30% weight`);
    console.log(`     • Artists: 25% weight - ${withArtists}/${total} calculated`);
    console.log(`     • Sound characteristics: 20% weight - ${withRealSound}/${total} with real data`);
    console.log(`     • Genre: 10% weight - ${withGenre}/${total} calculated`);
    console.log(`     • Location details: 10% weight`);
    console.log(`     • Enhancement status: 5% weight - ${enhanced}/${total} processed`);
    
    // Estimate overall confidence
    const estimatedConfidence = (
      (withArtists/total * 25) +
      (withRealSound/total * 20) +
      (withGenre/total * 10) +
      (enhanced/total * 5) +
      25 // Assume 25% for core+location (conservative)
    );
    
    console.log(`\n🎯 ESTIMATED SYSTEM CONFIDENCE: ${estimatedConfidence.toFixed(1)}%`);
    
    // Show improvement targets
    const targetConfidence = 85; // Target confidence level
    const gap = targetConfidence - estimatedConfidence;
    
    if (gap > 0) {
      console.log(`\n⚠️  GAP TO TARGET (${targetConfidence}%): ${gap.toFixed(1)} points`);
      console.log(`   RECOMMENDATIONS FOR IMPROVEMENT:`);
      if (withArtists/total < 0.9) {
        const needed = Math.ceil(total * 0.9) - withArtists;
        console.log(`   - Extract artists for ${needed.toLocaleString()} more events (target: 90%)`);
      }
      if (withRealSound/total < 0.8) {
        const needed = Math.ceil(total * 0.8) - withRealSound;
        console.log(`   - Get real sound data for ${needed.toLocaleString()} more events (target: 80%)`);
      }
      if (withGenre/total < 0.85) {
        const needed = Math.ceil(total * 0.85) - withGenre;
        console.log(`   - Classify genres for ${needed.toLocaleString()} more events (target: 85%)`);
      }
      if (enhanced/total < 0.95) {
        const needed = Math.ceil(total * 0.95) - enhanced;
        console.log(`   - Complete enhancement for ${needed.toLocaleString()} more events (target: 95%)`);
      }
    } else {
      console.log(`\n✅ CONFIDENCE TARGET ACHIEVED!`);
    }
  }

  async cleanup() {
    console.log('\n🧹 CLEANUP OPERATIONS');
    console.log('=====================');
    
    // Clean up old cache entries
    const cacheCleanup = await this.db.collection('events_cache').deleteMany({
      createdAt: { $lt: new Date(Date.now() - 7*24*60*60*1000) } // 7 days old
    });
    
    console.log(`✅ Cleaned up ${cacheCleanup.deletedCount} old cache entries`);
    
    // Clean up failed enhancement attempts
    const failedCleanup = await this.db.collection('events_unified').updateMany(
      { enhancementAttempts: { $gt: 5 }, enhancementProcessed: { $ne: true } },
      { $unset: { enhancementAttempts: 1 } }
    );
    
    console.log(`✅ Reset ${failedCleanup.modifiedCount} failed enhancement attempts`);
  }

  // === CASA LOMA SPECIFIC ANALYSIS ===
  async casaLomaAnalysis() {
    console.log('\n🏰 CASA LOMA EVENTS ANALYSIS');
    console.log('============================');
    
    const casaLomaQuery = {
      $or: [
        { name: { $regex: /casa loma/i } },
        { 'venue.name': { $regex: /casa loma/i } },
        { 'location.name': { $regex: /casa loma/i } }
      ]
    };
    
    await this.checkSpecificEvents(casaLomaQuery);
  }
}

// === COMMAND LINE INTERFACE ===
async function main() {
  const command = process.argv[2] || 'overview';
  const manager = new TikoManager();
  
  console.log('🎯 TIKO SYSTEM MANAGER');
  console.log('======================');
  console.log(`Command: ${command}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  try {
    // Help command doesn't need database connection
    if (command === 'help') {
      console.log(`
📋 Available Commands:
  overview    - Full system status (default)
  performance - Pipeline performance analysis
  casa-loma   - Casa Loma events analysis
  confidence  - Event confidence scoring analysis
  cleanup     - Clean up old data
  events      - Show recent events (optional JSON query)
  help        - Show this help

🔧 Usage Examples:
  node tiko-manager.js overview
  node tiko-manager.js confidence
  node tiko-manager.js performance
  node tiko-manager.js casa-loma
  node tiko-manager.js events '{"artists": {"$exists": true}}'

🚀 Production Examples:
  heroku run "node tiko-manager.js overview" --app sonar-edm-staging
  heroku run "node tiko-manager.js confidence" --app sonar-edm-staging
  heroku run "node tiko-manager.js casa-loma" --app sonar-edm-staging
      `);
      return;
    }
    
    // All other commands need database connection
    await manager.connect();
    
    switch (command) {
      case 'overview':
      case 'status':
        await manager.checkCollections();
        await manager.checkEnhancementStatus();
        break;
        
      case 'performance':
      case 'perf':
        await manager.performanceAnalysis();
        break;
        
      case 'casa-loma':
      case 'casa':
        await manager.casaLomaAnalysis();
        break;
        
      case 'cleanup':
        await manager.cleanup();
        break;
        
      case 'events':
        const query = process.argv[3] ? JSON.parse(process.argv[3]) : {};
        await manager.checkSpecificEvents(query);
        break;
        
      case 'confidence':
      case 'conf':
        await manager.confidenceAnalysis();
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Use "help" to see available commands');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await manager.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = TikoManager;
