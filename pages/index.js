import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // If loading, show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in, show login page
  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>TIKO - Electronic Music Events</title>
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold text-cyan-500 mb-8">TIKO</h1>
        <p className="text-xl mb-8 text-center">Discover electronic music events that match your taste</p>
        
        <Link href="/api/auth/signin/spotify" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full font-medium hover:opacity-90 transition-opacity">
          Login with Spotify
        </Link>
      </main>
    </div>
  );
}
