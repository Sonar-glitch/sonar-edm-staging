import React from 'react';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import '@/styles/globals.css';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>TIKO | EDM Event Discovery</title>
        <meta name="description" content="Find your next night out. Powered by your vibe." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
        
        {/* Open Graph / Social Media Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TIKO | EDM Event Discovery" />
        <meta property="og:description" content="Find your next night out. Powered by your vibe." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://tiko.sonar.com" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      
      <Component {...pageProps} />
    </SessionProvider>
  );
}