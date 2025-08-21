import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" 
          rel="stylesheet"
        />
        
        {/* Google Maps JavaScript API - single inclusion (moved from AppLayout) */}
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <script
            id="google-maps-script"
            data-role="google-maps"
            // Added loading=async per Google Maps JS API performance recommendation to remove console warning
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
            async
            defer
          />
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}