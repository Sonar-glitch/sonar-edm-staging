import styles from '../../styles/MusicTaste.module.css';

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

export default LoadingSkeleton;
