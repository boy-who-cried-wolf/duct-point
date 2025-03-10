import React, { createContext, useContext, ReactNode, useEffect } from 'react';

// Simplified ThemeProvider that only enforces light mode
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Set light mode on mount
  useEffect(() => {
    const root = window.document.documentElement;
    // Remove dark mode if present
    root.classList.remove('dark');
    // Ensure light mode is applied
    root.classList.add('light');
    // Clear any saved theme preference
    localStorage.removeItem('theme');
  }, []);

  return <>{children}</>;
};

// Empty context for compatibility with existing imports
const ThemeContext = createContext<any>(undefined);

export const useTheme = () => {
  return { theme: 'light', setTheme: () => {} };
}; 