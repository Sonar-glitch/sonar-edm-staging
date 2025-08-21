// /c/sonar/users/sonar-edm-user/components/Navigation.js
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

const Navigation = () => {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Determine active route
  const isActive = (path) => {
    return router.pathname === path ? 'text-cyan-400 font-medium' : 'text-white hover:text-fuchsia-400';
  };
  
  return (
    <header className="p-4 flex justify-between items-center bg-black">
      <div className="text-fuchsia-500 text-2xl font-bold">TIKO</div>
      
      <nav className="flex items-center space-x-6">
        <Link href="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        <Link href="/users/music-taste" className={isActive('/users/music-taste')}>Music Taste</Link>
        <Link href="/events" className={isActive('/events')}>Events</Link>
        
        {session ? (
          <div className="ml-4 relative group">
            <div className="flex items-center bg-black/30 border border-cyan-500/30 rounded-full px-3 py-1.5 cursor-pointer">
              {session.user?.image ? (
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                  <Image 
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full"
                    unoptimized={true}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 flex items-center justify-center mr-2">
                  {session.user?.name?.charAt(0) || "U"}
                </div>
              )}
              <span className="truncate max-w-[100px]">
                {session.user?.name || "User"}
              </span>
            </div>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-cyan-500/20 rounded-lg shadow-lg overflow-hidden z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div className="py-1">
                <Link href="/profile" className="block px-4 py-2 text-white hover:bg-cyan-500/20">Profile</Link>
                <Link href="/settings" className="block px-4 py-2 text-white hover:bg-cyan-500/20">Settings</Link>
                <button 
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-cyan-500/20"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/auth/signin" className="ml-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full text-white">
              Sign In
            </Link>
        )}
      </nav>
    </header>
  );
};

export default Navigation;
