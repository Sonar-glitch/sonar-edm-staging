import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import styles from '@/styles/Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  
  return (
    <header className={styles.header}>
      <Link href="/" legacyBehavior>
        <a className={styles.logo}>
          <span className={styles.logoText}>TIKO</span>
        </a>
      </Link>
      
      <div className={styles.nav}>
        {session ? (
          <Link href="/users/profile" legacyBehavior>
            <a className={styles.profileLink}>
              <div className={styles.avatarContainer}>
                {session.user?.image ? (
                  <Image 
                    src={session.user.image}
                    alt="Profile"
                    width={32}
                    height={32}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {session.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <span className={styles.profileName}>
                {session.user?.name?.split(' ')[0] || 'Profile'}
              </span>
            </a>
          </Link>
        ) : (
          <Link href="/auth/signin" legacyBehavior>
            <a className={styles.signInButton}>
              Sign In
            </a>
          </Link>
        )}
      </div>
    </header>
  );
}