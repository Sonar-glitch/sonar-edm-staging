
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SpiderChart from '../../components/SpiderChart';
import SeasonalMoodCard from '../../components/SeasonalMoodCard';
import ArtistCard from '../../components/ArtistCard';
import TrackCard from '../../components/TrackCard';
import EventCard from '../../components/EventCard';
import styles from '../../styles/MusicTaste.module.css';

const MusicTaste = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/spotify/user-taste')
        .then(res => res.json())
        .then(data => {
          console.log('Fetched taste data:', data);
          setUserTaste(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Taste fetch failed:', err);
          setUserTaste(null);
          setLoading(false);
        });
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status]);

  if (loading || !userTaste) {
    return <div className={styles.loader}>Loading your vibe...</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Sonic Signature</title>
      </Head>

      <h1 className={styles.pageTitle}>Your Sonic Signature</h1>

      <div className={styles.chartWrapper}>
        {userTaste.topGenres?.length > 0 ? (
          <SpiderChart data={userTaste.topGenres} />
        ) : (
          <p className={styles.placeholder}>No genre data available.</p>
        )}
      </div>

      <div className={styles.moodSection}>
        {userTaste.seasonalMood && (
          <SeasonalMoodCard mood={userTaste.seasonalMood} />
        )}
      </div>

      <div className={styles.highlightRow}>
        <div>
          <p className={styles.sectionLabel}>Top Artist</p>
          {userTaste.topArtist ? (
            <ArtistCard artist={userTaste.topArtist} />
          ) : (
            <p className={styles.placeholder}>No artist data</p>
          )}
        </div>
        <div>
          <p className={styles.sectionLabel}>Repeat Track</p>
          {userTaste.topTrack ? (
            <TrackCard track={userTaste.topTrack} />
          ) : (
            <p className={styles.placeholder}>No track data</p>
          )}
        </div>
      </div>

      <div className={styles.feedbackPrompt}>
        <p>Did we get it right? <span className={styles.feedbackLink}>no</span></p>
      </div>

      <div className={styles.eventsHeader}>Events You’ll Like</div>
      <div className={styles.eventList}>
        {Array.isArray(userTaste.matchedEvents) && userTaste.matchedEvents.length > 0 ? (
          userTaste.matchedEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <p className={styles.placeholder}>No events matched your vibe yet.</p>
        )}
      </div>
    </div>
  );
};

export default MusicTaste;
