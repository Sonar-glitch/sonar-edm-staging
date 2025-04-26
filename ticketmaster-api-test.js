// Simple test script to verify Ticketmaster API functionality
const fetch = require('node-fetch');

// Your Ticketmaster API key
const apiKey = 'gjGKNoTGeWl8HF2FAgYQVCf25D5ap7yw';

// Test function to directly call Ticketmaster API
async function testTicketmasterAPI() {
  console.log('Testing Ticketmaster API with key:', apiKey.substring(0, 4) + '...');
  
  try {
    // Simple request for music events in Toronto
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=Toronto&classificationName=music&size=3`;
    console.log('Making request to:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data._embedded || !data._embedded.events || data._embedded.events.length === 0) {
      console.log('No events found in API response');
      return;
    }
    
    console.log(`Found ${data._embedded.events.length} events:`);
    
    // Display basic info about each event
    data._embedded.events.forEach((event, index) => {
      console.log(`\nEvent ${index + 1}:`);
      console.log(`Name: ${event.name}`);
      console.log(`Date: ${event.dates?.start?.localDate || 'Unknown'}`);
      console.log(`Venue: ${event._embedded?.venues?.[0]?.name || 'Unknown'}`);
      console.log(`URL: ${event.url || 'Unknown'}`);
      
      // Check if there are images
      if (event.images && event.images.length > 0) {
        console.log(`Has ${event.images.length} images`);
        console.log(`First image URL: ${event.images[0].url}`);
      } else {
        console.log('No images found');
      }
    });
    
    console.log('\nAPI test completed successfully!');
    
  } catch (error) {
    console.error('Error testing Ticketmaster API:', error);
  }
}

// Run the test
testTicketmasterAPI();
