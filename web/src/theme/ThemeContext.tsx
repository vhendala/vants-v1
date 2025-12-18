import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { colors } from './colors';

interface ThemeContextType {
  theme: 'dark';
  isDark: boolean;
  colors: typeof colors.dark & {
    accentTeal: string;
    accentTealDark: string;
    accentBlue: string;
    accentRed: string;
    accentGreen: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = 'dark';
  const isDark = true;
  const themeColors = {
    ...colors.dark,
    accentTeal: colors.accentTeal,
    accentTealDark: colors.accentTealDark,
    accentBlue: colors.accentBlue,
    accentRed: colors.accentRed,
    accentGreen: colors.accentGreen,
  };

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const root = document.documentElement;
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [themeColors]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors: themeColors,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

