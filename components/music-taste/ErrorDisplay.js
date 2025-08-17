import styles from '../../styles/MusicTaste.module.css';

const ErrorDisplay = ({ error, onRetry }) => (
  <div className={styles.errorContainer}>
    <h2>Oops! Something went wrong</h2>
    <p>{error?.message || error?.toString() || 'An unknown error occurred'}</p>
    <button onClick={onRetry} className={styles.retryButton}>
      Try Again
    </button>
  </div>
);

export default ErrorDisplay;
