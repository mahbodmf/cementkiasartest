import React, { createContext, useContext } from 'react';
import { ThemeMode } from '../types';
import { useAppSettings } from './AppSettingsContext';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useAppSettings();

  const theme: ThemeMode = settings.theme === 'light' ? 'light' : 'dark';
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const setTheme = (mode: ThemeMode) => {
    updateSettings({ theme: mode });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'dark',
      isDark: true,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};

export default ThemeContext;
