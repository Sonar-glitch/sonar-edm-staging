# Adding Monitoring Script to Dashboard

To help monitor the events API and see which sources (Ticketmaster or EDMTrain) are providing events, add the monitoring script to your dashboard page:

## Option 1: Add to dashboard.js

Open your dashboard page file (likely at `pages/dashboard.js` or `pages/users/dashboard.js`) and add the following script tag:

```jsx
import Head from 'next/head';

// In your Dashboard component
return (
  <div>
    <Head>
      {/* Add this line */}
      <script src="/js/events-monitor.js"></script>
    </Head>
    {/* Rest of your dashboard */}
  </div>
);
```

## Option 2: Add to _app.js

If you prefer to add it globally, open `pages/_app.js` and add:

```jsx
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Add this line */}
        <script src="/js/events-monitor.js"></script>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
```

## After Adding the Script

1. Deploy the changes
2. Visit your dashboard
3. Open the browser console (F12 or right-click > Inspect > Console)
4. Look for monitoring messages about the events API
5. Use the "Monitor Events" button in the bottom-right corner to refresh the data

This will help you see:
- Which API sources are providing events (Ticketmaster, EDMTrain, or sample)
- How many events are coming from each source
- The full API response with all event details
