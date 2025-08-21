#!/usr/bin/env node
/**
 * CRITICAL FIX: Artist Data Recovery
 * Repairs 100% corrupted artist data by extracting names from event titles
 * This is ESSENTIAL for artist-based scoring to work
 */

const { MongoClient } = require('mongodb');

async function recoverArtistData() {
  console.log('🆘 STARTING CRITICAL ARTIST DATA RECOVERY');
  console.log('==========================================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const collection = db.collection('events_unified');
  
  // Find all events with corrupted artist data
  const corruptedEvents = await collection.find({
    artists: { 
      $exists: true, 
      $ne: [],
      $type: "array"
    }
  }).toArray();
  
  console.log(`\n📊 Found ${corruptedEvents.length.toLocaleString()} events with artist arrays`);
  
  let processed = 0;
  let recovered = 0;
  let failed = 0;
  
  console.log('\n🔧 Processing corrupted artist data...\n');
  
  for (const event of corruptedEvents) {
    try {
      // Check if first artist is corrupted object
      const firstArtist = event.artists[0];
      if (typeof firstArtist === 'object' && firstArtist.constructor === Object) {
        
        // Extract artist names using multiple strategies
        const recoveredArtists = extractArtistNames(event.name, event.artists.length);
        
        if (recoveredArtists.length > 0) {
          // Update the database with clean artist array
          await collection.updateOne(
            { _id: event._id },
            { 
              $set: { 
                artists: recoveredArtists,
                'artistRecovery.recovered': true,
                'artistRecovery.recoveredAt': new Date(),
                'artistRecovery.originalCorrupted': true,
                'artistRecovery.recoveredArtists': recoveredArtists.length
              }
            }
          );
          
          recovered++;
          
          if (processed % 100 === 0) {
            console.log(`[${processed}] ✅ ${event.name}`);
            console.log(`    Recovered: ${recoveredArtists.join(', ')}`);
          }
        } else {
          failed++;
          if (processed % 100 === 0) {
            console.log(`[${processed}] ❌ Could not extract artists from: ${event.name}`);
          }
        }
      } else if (typeof firstArtist === 'string') {
        // Already clean, mark as such
        await collection.updateOne(
          { _id: event._id },
          { 
            $set: { 
              'artistRecovery.recovered': false,
              'artistRecovery.alreadyClean': true,
              'artistRecovery.checkedAt': new Date()
            }
          }
        );
      }
      
      processed++;
      
      if (processed % 500 === 0) {
        console.log(`\n📈 PROGRESS: ${processed}/${corruptedEvents.length}`);
        console.log(`   Recovered: ${recovered} (${((recovered/processed)*100).toFixed(1)}%)`);
        console.log(`   Failed: ${failed} (${((failed/processed)*100).toFixed(1)}%)`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing event ${event._id}:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n✅ ARTIST DATA RECOVERY COMPLETE:`);
  console.log(`   Events processed: ${processed.toLocaleString()}`);
  console.log(`   Artists recovered: ${recovered.toLocaleString()}`);
  console.log(`   Recovery failed: ${failed.toLocaleString()}`);
  console.log(`   Success rate: ${((recovered/processed)*100).toFixed(1)}%`);
  
  // Verify the fix
  const cleanEvents = await collection.countDocuments({
    artists: { $exists: true, $ne: [], $type: "array" },
    "artists.0": { $type: "string" }
  });
  
  const totalWithArtists = await collection.countDocuments({
    artists: { $exists: true, $ne: [] }
  });
  
  console.log(`\n📈 VERIFICATION:`);
  console.log(`   Events with clean artists: ${cleanEvents.toLocaleString()}`);
  console.log(`   Total events with artists: ${totalWithArtists.toLocaleString()}`);
  console.log(`   Clean percentage: ${((cleanEvents/totalWithArtists)*100).toFixed(1)}%`);
  
  await client.close();
}

/**
 * Extract artist names from event title using multiple strategies
 */
function extractArtistNames(eventTitle, originalCount = 1) {
  const artists = [];
  
  // Strategy 1: Direct artist name (for single artist events)
  if (originalCount === 1) {
    // Remove common tour/venue suffixes
    let artistName = eventTitle
      .replace(/ - .*(tour|live|concert|show|presents|at |@).*/i, '')
      .replace(/ (tour|live|concert|show|presents|2024|2025).*/i, '')
      .replace(/ with .*/i, '')
      .replace(/ feat\.? .*/i, '')
      .replace(/ ft\.? .*/i, '')
      .trim();
    
    if (artistName && artistName.length > 0 && artistName.length < 100) {
      artists.push(artistName);
    }
  }
  
  // Strategy 2: Multiple artists (with, &, +, featuring)
  if (originalCount > 1 || artists.length === 0) {
    const multiArtistPatterns = [
      / with /i,
      / & /i,
      / and /i,
      / \+ /i,
      / feat\.? /i,
      / ft\.? /i,
      / vs\.? /i,
      / x /i
    ];
    
    for (const pattern of multiArtistPatterns) {
      if (pattern.test(eventTitle)) {
        const parts = eventTitle.split(pattern);
        if (parts.length >= 2) {
          parts.forEach(part => {
            const cleanPart = part
              .replace(/ - .*(tour|live|concert|show|presents).*/i, '')
              .replace(/ (tour|live|concert|show|presents|2024|2025).*/i, '')
              .trim();
            
            if (cleanPart && cleanPart.length > 0 && cleanPart.length < 100) {
              artists.push(cleanPart);
            }
          });
          break;
        }
      }
    }
  }
  
  // Strategy 3: Fallback - use event title as single artist
  if (artists.length === 0) {
    let fallbackName = eventTitle
      .replace(/ - .*/i, '')
      .replace(/:.*/i, '')
      .trim();
    
    if (fallbackName && fallbackName.length > 0 && fallbackName.length < 100) {
      artists.push(fallbackName);
    }
  }
  
  // Clean up artist names
  return artists
    .map(name => name.trim())
    .filter(name => name.length > 0 && name.length < 100)
    .slice(0, Math.max(originalCount, 3)); // Respect original count but cap at 3
}

// Run the recovery
if (require.main === module) {
  recoverArtistData().catch(console.error);
}

module.exports = { recoverArtistData };
