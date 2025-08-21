// Check Spotify genre flow investigation
const { MongoClient } = require('mongodb');

async function checkSpotifyGenreFlow() {
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  console.log('🔍 SPOTIFY GENRE FLOW INVESTIGATION');
  console.log('===================================');
  
  // Check successful Essentia artists and their Spotify data
  const successfulArtists = await artistGenresCollection.find({
    essentiaTrackMatrix: { $exists: true }
  }).limit(10).toArray();
  
  console.log('📊 Analysis of successful artists:');
  successfulArtists.forEach((artist, i) => {
    console.log('\n' + (i+1) + '. ' + artist.originalName);
    console.log('   📋 Original Spotify genres:', artist.genres);
    console.log('   🎵 Track matrix length:', artist.essentiaTrackMatrix?.length || 0);
    console.log('   🔄 Essentia genre mapping:', artist.essentiaGenreMapping?.inferredGenres);
    console.log('   🆔 Spotify ID:', artist.spotifyId || 'NONE');
    
    // Check if we have tracks but no genres
    if (artist.essentiaTrackMatrix?.length > 0 && (!artist.genres || artist.genres.length === 0)) {
      console.log('   ⚠️  ISSUE: Has tracks but no input genres!');
    }
    
    if (artist.essentiaTrackMatrix?.length > 0 && artist.genres?.length > 0 && (!artist.essentiaGenreMapping?.inferredGenres || artist.essentiaGenreMapping.inferredGenres.length === 0)) {
      console.log('   ⚠️  ISSUE: Has input genres but no inferred genres!');
    }
  });
  
  // Let's also check what's in the track matrix to see if we get artist info from tracks
  console.log('\n🎵 Sample track data:');
  if (successfulArtists.length > 0 && successfulArtists[0].essentiaTrackMatrix?.length > 0) {
    const firstTrack = successfulArtists[0].essentiaTrackMatrix[0];
    console.log('   Artist name from track:', firstTrack.artist);
    console.log('   Track name:', firstTrack.trackName);
    console.log('   Track keys:', Object.keys(firstTrack));
  }
  
  await client.close();
}

checkSpotifyGenreFlow();
