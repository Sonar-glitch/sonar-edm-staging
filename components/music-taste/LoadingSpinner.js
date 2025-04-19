import styles from '../../styles/MusicTaste.module.css';

const LoadingSpinner = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}></div>
    <p>Loading your vibe...</p>
  </div>
);

export default LoadingSpinner;
