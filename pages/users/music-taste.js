import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import styles from '../../styles/MusicTaste.module.css';

// Dynamically import components to reduce initial bundle size
const ArtistCard = dynamic(() => import('../../components/ArtistCard'), {
  loading: () => <div className={styles.cardSkeleton} />
});

const EventCard = dynamic(() => import('../../components/EventCard'), {
  loading: () => <div className={styles.cardSkeleton} />
});

// Create a loading skeleton component
const LoadingSkeleton = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.skeletonHeader}></div>
    <div className={styles.skeletonGrid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.cardSkeleton}>
          <div className={styles.skeletonImage}></div>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonText}></div>
        </div>
      ))}
    </div>
  </div>
);

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add a state for incremental loading
  const [visibleArtists, setVisibleArtists] = useState(6);
  const [visibleTracks, setVisibleTracks] = useState(6);
  const [visibleEvents, setVisibleEvents] = useState(4);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }
    
    if (status === 'authenticated') {
      fetchUserTaste();
    }
    
    // Implement intersection observer for infinite scrolling
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && userTaste) {
          // Load more items when user scrolls to the bottom
          if (entry.target.id === 'artists-end') {
            setVisibleArtists(prev => Math.min(prev + 6, userTaste.topArtists?.length || 0));
          } else if (entry.target.id === 'tracks-end') {
            setVisibleTracks(prev => Math.min(prev + 6, userTaste.topTracks?.length || 0));
          } else if (entry.target.id === 'events-end') {
            setVisibleEvents(prev => Math.min(prev + 4, userTaste.suggestedEvents?.length || 0));
          }
        }
      });
    }, { threshold: 0.1 });
    
    // Observe end markers
    const artistsEnd = document.getElementById('artists-end');
    const tracksEnd = document.getElementById('tracks-end');
    const eventsEnd = document.getElementById('events-end');
    
    if (artistsEnd) observer.observe(artistsEnd);
    if (tracksEnd) observer.observe(tracksEnd);
    if (eventsEnd) observer.observe(eventsEnd);
    
    return () => {
      if (artistsEnd) observer.unobserve(artistsEnd);
      if (tracksEnd) observer.unobserve(tracksEnd);
      if (eventsEnd) observer.unobserve(eventsEnd);
    };
  }, [status, router, userTaste]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      
      // Use A
(Content truncated due to size limit. Use line ranges to read in chunks)
