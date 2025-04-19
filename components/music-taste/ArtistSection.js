import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/MusicTaste.module.css';
import LoadingSkeleton from './LoadingSkeleton';

// Dynamically import ArtistCard
const ArtistCard = dynamic(() => import('../ArtistCard'), {
  loading: () => <div className={styles.cardSkeleton} />
});

const ArtistSection = ({ artists, visibleArtists }) => (
  <section className={styles.sectionContainer}>
    <h2 className={styles.sectionTitle}>Top Artists</h2>
    <div className={styles.cardsGrid}>
      <Suspense fallback={<LoadingSkeleton />}>
        {artists?.slice(0, visibleArtists).map((artist, index) => (
          <ArtistCard key={artist.id || index} artist={artist} />
        ))}
      </Suspense>
    </div>
    <div id="artists-end" className={styles.loadMoreTrigger}></div>
  </section>
);

export default ArtistSection;
