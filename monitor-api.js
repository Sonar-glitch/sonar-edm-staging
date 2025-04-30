// API Monitoring Script for TIKO Platform
// This script monitors API calls and responses

// Run this script on Heroku to monitor API activity
// heroku run node monitor-api.js --app sonar-edm-user

console.log('=== TIKO Platform API Monitor ===');
console.log('Checking environment variables...');

// Check API keys
const ticketmasterKey = process.env.TICKETMASTER_API_KEY;
const edmtrainKey = process.env.EDMTRAIN_API_KEY;

console.log('Ticketmaster API Key:', ticketmasterKey ? `Set (length: ${ticketmasterKey.length})` : 'Not set');
console.log('EDMTrain API Key:', edmtrainKey ? `Set (length: ${edmtrainKey.length})` : 'Not set');

// Test Ticketmaster API
console.log('\nTesting Ticketmaster API...');
if (ticketmasterKey) {
  const https = require('https');
  const ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&dmaId=527&apikey=${ticketmasterKey}`;
  
  https.get(ticketmasterUrl, (res) => {
    console.log(`Ticketmaster API Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        const events = parsedData._embedded?.events || [];
        console.log(`Ticketmaster events found: ${events.length}`);
        
        if (events.length > 0) {
          console.log('First event:', events[0].name);
        }
        
        // Test EDMTrain API after Ticketmaster completes
        testEDMTrain();
      } catch (e) {
        console.log('Error parsing Ticketmaster API response:', e.message);
        testEDMTrain();
      }
    });
  }).on('error', (e) => {
    console.log('Ticketmaster API request error:', e.message);
    testEDMTrain();
  });
} else {
  console.log('Skipping Ticketmaster API test - API key not set');
  testEDMTrain();
}

// Test EDMTrain API
function testEDMTrain() {
  console.log('\nTesting EDMTrain API...');
  if (edmtrainKey) {
    const https = require('https');
    const options = {
      hostname: 'edmtrain.com',
      path: '/api/events?locationIds=146',  // Toronto location ID
      method: 'GET',
      headers: {
        'Authorization': edmtrainKey
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`EDMTrain API Status Code: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          const events = parsedData.data || [];
          console.log(`EDMTrain events found: ${events.length}`);
          
          if (events.length > 0) {
            console.log('First event:', events[0].artistList.map(a => a.name).join(', '));
          }
          
          console.log('\nMonitoring complete!');
        } catch (e) {
          console.log('Error parsing EDMTrain API response:', e.message);
          console.log('\nMonitoring complete!');
        }
      });
    });
    
    req.on('error', (e) => {
      console.log('EDMTrain API request error:', e.message);
      console.log('\nMonitoring complete!');
    });
    
    req.end();
  } else {
    console.log('Skipping EDMTrain API test - API key not set');
    console.log('\nMonitoring complete!');
  }
}
