import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import config from '../config';

export default function Home({ serverConfigStatus }) {
  const { data: session, status } = useSession();
  const [appStatus, setAppStatus] = useState({
    isValid: serverConfigStatus.isValid,
    missingConfigs: serverConfigStatus.missingConfigs || []
  });

  // Check if the app is properly configured (client-side fallback)
  useEffect(() => {
    if (!serverConfigStatus.isValid) {
      const configStatus = config.validateConfig();
      setAppStatus(configStatus);
    }
  }, [serverConfigStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Head>
        <title>{config.app.name}</title>
        <meta name="description" content="Dual-focused platform for EDM promoters and music fans" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            {config.app.name}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover EDM trends, analyze music preferences, and connect promoters with fans
          </p>
        </div>

        {!appStatus.isValid ? (
          <div className="max-w-md mx-auto bg-red-900/30 border border-red-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Configuration Required</h2>
            <p className="mb-4">
              Please set up the following configuration items in your .env file:
            </p>
            <ul className="list-disc pl-5 mb-4">
              {appStatus.missingConfigs.map((config, index) => (
                <li key={index} className="mb-1">{config}</li>
              ))}
            </ul>
            <p className="text-sm">
              Copy the .env.example file to .env and fill in your credentials.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-700/20 border border-purple-700/50 rounded-xl p-8 transition-all hover:shadow-lg hover:shadow-purple-700/20">
              <h2 className="text-2xl font-bold mb-4">For Promoters</h2>
              <p className="text-gray-300 mb-6">
                Gain insights into EDM trends, predict artist popularity, and optimize event planning with data-driven analytics.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="bg-purple-500 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Artist popularity prediction
                </li>
                <li className="flex items-center">
                  <span className="bg-purple-500 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Event demand forecasting
                </li>
                <li className="flex items-center">
                  <span className="bg-purple-500 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Ticket price optimization
                </li>
              </ul>
              <Link href="/promoters/dashboard" className="block w-full bg-purple-600 hover:bg-purple-700 text-center py-3 rounded-lg font-medium transition-colors">
                Promoter Dashboard
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-blue-700/20 border border-blue-700/50 rounded-xl p-8 transition-all hover:shadow-lg hover:shadow-blue-700/20">
              <h2 className="text-2xl font-bold mb-4">For Music Fans</h2>
              <p className="text-gray-300 mb-6">
                Discover new artists based on your music taste, find events that match your preferences, and explore trending genres.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="bg-blue-500 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Music taste analysis
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-500 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Event recommendations
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-500 rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  Similar artist discovery
                </li>
              </ul>
              <Link href="/users/dashboard" className="block w-full bg-blue-600 hover:bg-blue-700 text-center py-3 rounded-lg font-medium transition-colors">
                User Dashboard
              </Link>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          {status === 'unauthenticated' ? (
            <button
              onClick={() => signIn('spotify')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Sign in with Spotify
            </button>
          ) : status === 'authenticated' ? (
            <div className="bg-gray-800/50 inline-block px-6 py-3 rounded-lg">
              Signed in as <span className="font-semibold">{session.user.name}</span>
            </div>
          ) : (
            <div className="bg-gray-800/50 inline-block px-6 py-3 rounded-lg">
              Loading...
            </div>
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-gray-400">
        <p>© {new Date().getFullYear()} {config.app.name}</p>
      </footer>
    </div>
  );
}

// Server-side environment variable check
export async function getServerSideProps() {
  // Check if the application is configured by verifying environment variables
  const isConfigured = 
    process.env.SPOTIFY_CLIENT_ID && 
    process.env.SPOTIFY_CLIENT_SECRET && 
    process.env.MONGODB_URI && 
    process.env.NEXTAUTH_SECRET;
  
  // Create a list of missing configurations
  const missingConfigs = [];
  if (!process.env.SPOTIFY_CLIENT_ID) missingConfigs.push('Spotify API credentials');
  if (!process.env.MONGODB_URI) missingConfigs.push('MongoDB connection string');
  if (!process.env.NEXTAUTH_SECRET) missingConfigs.push('NextAuth secret');
  
  return {
    props: {
      serverConfigStatus: {
        isValid: !!isConfigured,
        missingConfigs
      }
    }
  };
}

