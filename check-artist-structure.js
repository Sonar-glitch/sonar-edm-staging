#!/usr/bin/env node
process.env.MONGODB_URI = 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM';

const { MongoClient } = require('mongodb');

async function checkArtistData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('test');
  const collection = db.collection('events_unified');
  
  console.log('🔍 CHECKING ARTIST DATA STRUCTURE');
  console.log('================================');
  
  const sample = await collection.findOne({ artists: { $exists: true, $ne: [] } });
  if (sample) {
    console.log('Event name:', sample.name);
    console.log('Artists type:', typeof sample.artists);
    console.log('Artists length:', sample.artists?.length);
    console.log('First artist:', JSON.stringify(sample.artists?.[0], null, 2));
    console.log('First artist type:', typeof sample.artists?.[0]);
    
    if (sample.artists?.[0] && typeof sample.artists[0] === 'object') {
      console.log('Artist object keys:', Object.keys(sample.artists[0]));
    }
  } else {
    console.log('No events with artists found');
  }
  
  await client.close();
}

checkArtistData().catch(console.error);
