import styles from '../styles/SeasonalVibes.module.css';

export default function SeasonalVibes({ profile }) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <span className={styles.icon}>✨</span> Your Year-Round Vibes
      </h2>
      
      <p className={styles.description}>
        Your taste evolves from <span className={styles.highlight}>deep house vibes</span> in winter to <span className={styles.highlight}>high-energy techno</span> in summer, with a consistent appreciation for <span className={styles.highlight}>melodic elements</span> year-round.
      </p>
      
      <div className={styles.seasonsGrid}>
        <div className={styles.season}>
          <h3>
            <span className={styles.icon}>🌱</span> Spring/Now
          </h3>
          <h4>Vibe:</h4>
          <p>House, Progressive</p>
          <p>Fresh beats & uplifting vibes</p>
        </div>
        
        <div className={styles.season}>
          <h3>
            <span className={styles.icon}>☀️</span> Summer
          </h3>
          <h4>Vibe:</h4>
          <p>Techno, Tech House</p>
          <p>High energy open air sounds</p>
        </div>
        
        <div className={styles.season}>
          <h3>
            <span className={styles.icon}>🍂</span> Fall
          </h3>
          <h4>Vibe:</h4>
          <p>Organic House, Downtempo</p>
          <p>Mellow grooves & deep beats</p>
        </div>
        
        <div className={styles.season}>
          <h3>
            <span className={styles.icon}>❄️</span> Winter
          </h3>
          <h4>Vibe:</h4>
          <p>Deep House, Ambient Techno</p>
          <p>Hypnotic journeys & warm basslines</p>
        </div>
      </div>
      
      <div className={styles.feedback}>
        <span>Did we get it right?</span>
        <span className={styles.answer}>No</span>
      </div>
    </div>
  );
}
