// Client-side debug script for events section
(function() {
  console.log('Events debug script loaded');
  
  // Function to fetch events from API
  async function fetchEvents() {
    try {
      console.log('Attempting to fetch events from API...');
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        console.error('API request failed with status', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('Events API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching events:', error);
      return null;
    }
  }
  
  // Function to check if events section exists
  function checkEventsSection() {
    console.log('Checking for events section in DOM...');
    const eventsSections = document.querySelectorAll('.events-section, [data-testid="events-section"], [class*="events"], [id*="events"]');
    
    if (eventsSections.length > 0) {
      console.log('Found potential events sections:', eventsSections.length);
      eventsSections.forEach((section, index) => {
        console.log(`Events section ${index}:`, section);
      });
    } else {
      console.log('No events section found in DOM');
    }
  }
  
  // Run diagnostics when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, running events diagnostics...');
    
    // Fetch events
    fetchEvents();
    
    // Check for events section
    setTimeout(checkEventsSection, 1000);
    
    // Add debug button to page
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Events';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.style.padding = '10px';
    debugButton.style.backgroundColor = '#ff5722';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '5px';
    debugButton.style.cursor = 'pointer';
    
    debugButton.addEventListener('click', function() {
      fetchEvents();
      checkEventsSection();
    });
    
    document.body.appendChild(debugButton);
  });
})();
