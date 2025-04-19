
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
          setUserTaste(data);
          setLoading(false);
        });
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status]);

  if (loading || !userTaste) return <div className={styles.loader}>Loading...</div>;

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Sonic Signature</title>
      </Head>

      <h1 className={styles.pageTitle}>Your Sonic Signature</h1>

      <div className={styles.chartWrapper}>
        <SpiderChart data={userTaste.genres} />
      </div>

      <div className={styles.moodSection}>
        <SeasonalMoodCard mood={userTaste.seasonalMood} />
      </div>

      <div className={styles.highlightRow}>
        <div>
          <p className={styles.sectionLabel}>Top Artist</p>
          <ArtistCard artist={userTaste.topArtist} />
        </div>
        <div>
          <p className={styles.sectionLabel}>Repeat Track</p>
          <TrackCard track={userTaste.repeatTrack} />
        </div>
      </div>

      <div className={styles.feedbackPrompt}>
        <p>Did we get it right? <span className={styles.feedbackLink}>no</span></p>
      </div>

      <div className={styles.eventsHeader}>Events You’ll Like</div>
      <div className={styles.eventList}>
        {userTaste.recommendedEvents.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default MusicTaste;
