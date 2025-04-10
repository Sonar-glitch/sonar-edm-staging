import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import Header from '../components/Header';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Determine if we're in the user or promoter section based on the URL path
  const isPromoter = 
    typeof window !== 'undefined' && 
    window.location.pathname.startsWith('/promoters');
  
  return (
    <SessionProvider session={session}>
      <Header type={isPromoter ? 'promoter' : 'user'} />
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
