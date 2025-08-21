import { SessionProvider, useSession } from "next-auth/react";
import LocationProvider from "../components/LocationProvider";
import { useRouter } from "next/router";
import { useEffect } from "react";
import "../styles/globals.css";

// Component to handle protected routes and redirects
function Auth({ children, requiredAuth }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isUser = !!session?.user;
  const loading = status === "loading";
  const currentPath = router.pathname;

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // If authentication is required but user is not logged in, redirect to login
    if (requiredAuth && !loading && !isUser) {
      router.push("/");
      return;
    }

    // If user is logged in and on the root path, redirect to dashboard
    if (isUser && currentPath === "/") {
      router.push("/users/dashboard");
      return;
    }

    // If user is logged in and on the music-taste path, allow access
    if (isUser && currentPath.includes("/users/music-taste")) {
      return;
    }

    // If user is logged in and on any other path, allow access
    if (isUser) {
      return;
    }
  }, [isUser, loading, requiredAuth, router, currentPath]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authentication is required and user is not logged in, show nothing
  if (requiredAuth && !isUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If we get here, show the page
  return children;
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Check if the page requires authentication
  const requiredAuth = Component.auth?.requiredAuth;

  return (
    <SessionProvider session={session}>
      <LocationProvider>
      {requiredAuth ? (
        <Auth requiredAuth={requiredAuth}>
          <Component {...pageProps} />
        </Auth>
      ) : (
        <Component {...pageProps} />
      )}
          </LocationProvider>
    </SessionProvider>
  );
}

export default MyApp;
