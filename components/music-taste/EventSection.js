import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/MusicTaste.module.css';
import LoadingSkeleton from './LoadingSkeleton';

// Dynamically import EventCard
const EventCard = dynamic(() => import('../EventCard'), {
  loading: () => <div className={styles.cardSkeleton} />
});

const EventSection = ({ events, visibleEvents }) => (
  <section className={styles.sectionContainer}>
    <h2 className={styles.sectionTitle}>Suggested Events</h2>
    <div className={styles.eventsGrid}>
      <Suspense fallback={<LoadingSkeleton />}>
        {events?.slice(0, visibleEvents).map((event, index) => (
          <EventCard key={event.id || index} event={event} />
        ))}
      </Suspense>
    </div>
    <div id="events-end" className={styles.loadMoreTrigger}></div>
  </section>
);

export default EventSection;
