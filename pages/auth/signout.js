import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import styles from '../../styles/SignOut.module.css';
import Head from 'next/head';

export default function SignOut() {
  const [timeLeft, setTimeLeft] = useState(5);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      signOut({ callbackUrl: '/' });
    }, 5000);
    
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Sign Out - Sonar EDM Platform</title>
      </Head>
      
      <div className={styles.content}>
        <h1 className={styles.title}>Signing you out...</h1>
        <p className={styles.message}>
          Thanks for using Sonar EDM Platform. You'll be redirected to the home page in {timeLeft} seconds.
        </p>
        <div className={styles.loader}></div>
      </div>
    </div>
  );
}
