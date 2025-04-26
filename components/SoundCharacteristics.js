import styles from '../styles/SoundCharacteristics.module.css';

export default function SoundCharacteristics({ profile }) {
  // Default values if profile is not available
  const characteristics = {
    melody: 65,
    danceability: 80,
    energy: 75,
    tempo: 60,
    obscurity: 45
  };

  // Use profile data if available
  if (profile && profile.soundCharacteristics) {
    Object.assign(characteristics, profile.soundCharacteristics);
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Sound Characteristics</h2>
      
      <div className={styles.characteristicsList}>
        <div className={styles.characteristic}>
          <span className={styles.label}>Melody</span>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar} 
              style={{ width: `${characteristics.melody}%`, background: 'linear-gradient(90deg, #00c6ff, #ff00ff)' }}
            ></div>
          </div>
        </div>
        
        <div className={styles.characteristic}>
          <span className={styles.label}>Danceability</span>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar} 
              style={{ width: `${characteristics.danceability}%`, background: 'linear-gradient(90deg, #00c6ff, #ff00ff)' }}
            ></div>
          </div>
        </div>
        
        <div className={styles.characteristic}>
          <span className={styles.label}>Energy</span>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar} 
              style={{ width: `${characteristics.energy}%`, background: 'linear-gradient(90deg, #00c6ff, #ff00ff)' }}
            ></div>
          </div>
        </div>
        
        <div className={styles.characteristic}>
          <span className={styles.label}>Tempo</span>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar} 
              style={{ width: `${characteristics.tempo}%`, background: 'linear-gradient(90deg, #00c6ff, #ff00ff)' }}
            ></div>
          </div>
        </div>
        
        <div className={styles.characteristic}>
          <span className={styles.label}>Obscurity</span>
          <div className={styles.barContainer}>
            <div 
              className={styles.bar} 
              style={{ width: `${characteristics.obscurity}%`, background: 'linear-gradient(90deg, #00c6ff, #ff00ff)' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
