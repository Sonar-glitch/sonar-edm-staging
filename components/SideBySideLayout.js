import React from 'react';
import styles from '@/styles/SideBySideLayout.module.css';

const SideBySideLayout = ({ children }) => {
  // Expect exactly two children - the sound characteristics chart and seasonal vibes
  const [soundChart, seasonalVibes] = React.Children.toArray(children);

  return (
    <div className={styles.container}>
      <div className={styles.column}>
        {soundChart}
      </div>
      <div className={styles.column}>
        {seasonalVibes}
      </div>
    </div>
  );
};

export default SideBySideLayout;
