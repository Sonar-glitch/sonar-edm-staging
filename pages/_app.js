import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '../contexts/ThemeContext';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
