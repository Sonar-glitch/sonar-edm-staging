import React from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import styles from '../styles/ThemeToggle.module.css';

export default function ThemeToggle({ floating = false }) {
  const { theme, changeTheme } = useTheme();
  
  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
  };
  
  if (floating) {
    return (
      <div className={styles.floatingToggle}>
        <button 
          className={`${styles.floatingButton} ${theme === THEMES.NEON ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.NEON)}
          aria-label="Neon Theme"
          title="Neon Theme"
        >
          <span className={styles.neonIcon}></span>
        </button>
        <button 
          className={`${styles.floatingButton} ${theme === THEMES.PURPLE ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.PURPLE)}
          aria-label="Purple Theme"
          title="Purple Theme"
        >
          <span className={styles.purpleIcon}></span>
        </button>
        <button 
          className={`${styles.floatingButton} ${theme === THEMES.MINIMAL ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.MINIMAL)}
          aria-label="Minimal Theme"
          title="Minimal Theme"
        >
          <span className={styles.minimalIcon}></span>
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.themeToggle}>
      <h3 className={styles.themeTitle}>Theme</h3>
      <div className={styles.themeOptions}>
        <div 
          className={`${styles.themeOption} ${theme === THEMES.NEON ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.NEON)}
        >
          <div className={`${styles.themePreview} ${styles.neonPreview}`}>
            <div className={styles.previewBar}></div>
          </div>
          <span className={styles.themeName}>Neon</span>
        </div>
        
        <div 
          className={`${styles.themeOption} ${theme === THEMES.PURPLE ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.PURPLE)}
        >
          <div className={`${styles.themePreview} ${styles.purplePreview}`}>
            <div className={styles.previewBar}></div>
          </div>
          <span className={styles.themeName}>Purple</span>
        </div>
        
        <div 
          className={`${styles.themeOption} ${theme === THEMES.MINIMAL ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.MINIMAL)}
        >
          <div className={`${styles.themePreview} ${styles.minimalPreview}`}>
            <div className={styles.previewBar}></div>
          </div>
          <span className={styles.themeName}>Minimal</span>
        </div>
      </div>
    </div>
  );
}
