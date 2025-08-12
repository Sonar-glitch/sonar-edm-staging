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
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }
    
    this.mongoClient = new MongoClient(process.env.MONGODB_URI);
    await this.mongoClient.connect();
    this.db = this.mongoClient.db(process.env.MONGODB_DB || 'test');
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
  cleanup     - Clean up old data
  events      - Show recent events (optional JSON query)
  help        - Show this help

🔧 Usage Examples:
  node tiko-manager.js overview
  node tiko-manager.js performance
  node tiko-manager.js casa-loma
  node tiko-manager.js events '{"artists": {"$exists": true}}'

🚀 Production Examples:
  heroku run "node tiko-manager.js overview" --app sonar-edm-staging
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
