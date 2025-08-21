import React, { createContext, useContext, useState, useEffect } from 'react';

// Available themes
export const THEMES = {
  NEON: 'neon',
  PURPLE: 'purple',
  MINIMAL: 'minimal'
};

// Theme context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEMES.NEON);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('sonarTheme');
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);
  
  // Update theme
  const changeTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('sonarTheme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Also save to API if available
      try {
        fetch('/api/user/update-theme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ theme: newTheme }),
        }).catch(err => console.log('Could not save theme to API:', err));
      } catch (error) {
        console.log('Error saving theme to API:', error);
      }
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
