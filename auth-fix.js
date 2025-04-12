// auth-fix.js - Script to add missing NextAuth API routes to Sonar EDM Platform components

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Define the components to fix
const components = [
  { name: 'sonar-edm-platform', dir: 'sonar-edm-platform' },
  { name: 'sonar-edm-user', dir: 'sonar-edm-platform/sonar-edm-user' },
  { name: 'sonar-edm-promoter', dir: 'sonar-edm-platform/sonar-edm-promoter' }
];

// NextAuth configuration for Spotify (for user components)
const spotifyAuthConfig = `
import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

// Spotify scopes for API access
const scopes = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ');

export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: { params: { scope: scopes } }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at * 1000,
          user: {
            id: profile.id,
            name: profile.display_name,
            email: profile.email,
            image: profile.images?.[0]?.url
          }
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development'
});
`;

// NextAuth configuration for Google (for promoter component)
const googleAuthConfig = `
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        return {
          ...token,
          accessToken: account.access_token,
          user: {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture
          }
        };
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development'
});
`;

// Basic sign-in page template
const signInPageTemplate = `
import { getProviders, signIn } from 'next-auth/react';
import styles from '../../styles/SignIn.module.css';

export default function SignIn({ providers }) {
  return (
    <div className={styles.container}>
      <div className={styles.signInBox}>
        <h1 className={styles.title}>Sign In</h1>
        <div className={styles.providersContainer}>
          {Object.values(providers).map((provider) => (
            <div key={provider.name} className={styles.providerButton}>
              <button onClick={() => signIn(provider.id, { callbackUrl: '/users/dashboard' })}>
                {provider.name === 'Spotify' ? '♫ ' : ''}
                Sign in with {provider.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
`;

// Basic sign-out page template
const signOutPageTemplate = `
import { signOut } from 'next-auth/react';
import styles from '../../styles/SignOut.module.css';

export default function SignOut() {
  return (
    <div className={styles.container}>
      <div className={styles.signOutBox}>
        <h1 className={styles.title}>Sign Out</h1>
        <p>Are you sure you want to sign out?</p>
        <button 
          className={styles.signOutButton} 
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Yes, Sign Out
        </button>
      </div>
    </div>
  );
}
`;

// Basic error page template
const errorPageTemplate = `
import styles from '../../styles/Auth.module.css';

export default function Error({ error }) {
  return (
    <div className={styles.container}>
      <div className={styles.errorBox}>
        <h1 className={styles.title}>Authentication Error</h1>
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
        <a href="/" className={styles.backLink}>
          Back to Home
        </a>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { error } = context.query;
  return {
    props: {
      error: error || 'An unknown error occurred during authentication'
    }
  };
}
`;

// CSS for auth pages
const authCssTemplate = `
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #121212 0%, #1e1e1e 100%);
  color: white;
}

.signInBox, .signOutBox, .errorBox {
  background: rgba(30, 30, 30, 0.8);
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 500px;
  text-align: center;
}

.title {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #f0f;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.providersContainer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.providerButton button {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 5px;
  background: linear-gradient(90deg, #f0f 0%, #00f0ff 100%);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.providerButton button:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
}

.signOutButton {
  margin-top: 1rem;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 5px;
  background: linear-gradient(90deg, #f0f 0%, #00f0ff 100%);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.signOutButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
}

.errorMessage {
  background: rgba(255, 0, 0, 0.1);
  border-left: 4px solid #f00;
  padding: 1rem;
  margin: 1rem 0;
  text-align: left;
}

.backLink {
  display: inline-block;
  margin-top: 1rem;
  color: #00f0ff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.backLink:hover {
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.7);
}
`;

// Function to create directory if it doesn't exist
async function ensureDir(dirPath) {
  try {
    await stat(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

// Function to create file if it doesn't exist
async function createFile(filePath, content) {
  try {
    await writeFile(filePath, content);
    console.log(`Created: ${filePath}`);
  } catch (error) {
    console.error(`Error creating ${filePath}:`, error.message);
  }
}

// Main function to fix auth routes for a component
async function fixAuthRoutes(componentDir, isPromoter = false) {
  const baseDir = path.join(__dirname, componentDir);
  
  try {
    // Create NextAuth API route
    const apiAuthDir = path.join(baseDir, 'pages', 'api', 'auth');
    await ensureDir(apiAuthDir);
    
    // Create [...nextauth].js file with appropriate config
    const nextAuthPath = path.join(apiAuthDir, '[...nextauth].js');
    await createFile(nextAuthPath, isPromoter ? googleAuthConfig : spotifyAuthConfig);
    
    // Create auth pages directory
    const authPagesDir = path.join(baseDir, 'pages', 'auth');
    await ensureDir(authPagesDir);
    
    // Create sign-in page
    await createFile(path.join(authPagesDir, 'signin.js'), signInPageTemplate);
    
    // Create sign-out page
    await createFile(path.join(authPagesDir, 'signout.js'), signOutPageTemplate);
    
    // Create error page
    await createFile(path.join(authPagesDir, 'error.js'), errorPageTemplate);
    
    // Create or update CSS files
    const stylesDir = path.join(baseDir, 'styles');
    await ensureDir(stylesDir);
    
    // Create SignIn.module.css
    await createFile(path.join(stylesDir, 'SignIn.module.css'), authCssTemplate);
    
    // Create SignOut.module.css
    await createFile(path.join(stylesDir, 'SignOut.module.css'), authCssTemplate);
    
    // Create Auth.module.css
    await createFile(path.join(stylesDir, 'Auth.module.css'), authCssTemplate);
    
    console.log(`✅ Auth routes fixed for ${componentDir}`);
    return true;
  } catch (error) {
    console.error(`❌ Error fixing auth routes for ${componentDir}:`, error.message);
    return false;
  }
}

// Main function to fix all components
async function main() {
  console.log('🔧 Starting auth routes fix for Sonar EDM Platform components...');
  
  for (const component of components) {
    const isPromoter = component.name === 'sonar-edm-promoter';
    await fixAuthRoutes(component.dir, isPromoter);
  }
  
  console.log('\n✨ Auth routes fix completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Commit the changes: git add . && git commit -m "Add missing auth routes"');
  console.log('2. Deploy all components using the deploy-all-components.sh script');
  console.log('3. Set up environment variables using the setup-environment.sh script');
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
