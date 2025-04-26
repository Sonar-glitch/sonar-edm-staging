// Client-side monitoring script for events API
(function() {
  console.log('Events monitoring script loaded');
  
  // Function to fetch events from API
  async function fetchEvents() {
    try {
      console.log('Fetching events from API...');
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        console.error('API request failed with status', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('Events API response:', data);
      
      // Log source and counts
      console.log('Events source:', data.source);
      if (data.ticketmasterCount !== undefined) {
        console.log('Ticketmaster events:', data.ticketmasterCount);
      }
      if (data.edmtrainCount !== undefined) {
        console.log('EDMTrain events:', data.edmtrainCount);
      }
      
      // Log individual events with their sources
      if (data.events && data.events.length > 0) {
        console.log('Events by source:');
        const sources = {};
        data.events.forEach(event => {
          sources[event.source] = (sources[event.source] || 0) + 1;
        });
        console.table(sources);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return null;
    }
  }
  
  // Run when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, running events monitoring...');
    
    // Fetch events
    setTimeout(fetchEvents, 1000);
    
    // Add monitor button to page
    const monitorButton = document.createElement('button');
    monitorButton.textContent = 'Monitor Events';
    monitorButton.style.position = 'fixed';
    monitorButton.style.bottom = '10px';
    monitorButton.style.right = '10px';
    monitorButton.style.zIndex = '9999';
    monitorButton.style.padding = '10px';
    monitorButton.style.backgroundColor = '#4CAF50';
    monitorButton.style.color = 'white';
    monitorButton.style.border = 'none';
    monitorButton.style.borderRadius = '5px';
    monitorButton.style.cursor = 'pointer';
    
    monitorButton.addEventListener('click', function() {
      fetchEvents();
    });
    
    document.body.appendChild(monitorButton);
  });
})();
