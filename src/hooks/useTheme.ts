import { useState, useEffect, useCallback, createContext, useContext } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'arcmart-theme';

export const useThemeState = () => {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        if (stored === 'light' || stored === 'dark') {
            setThemeState(stored);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setThemeState(prefersDark ? 'dark' : 'light');
        }
        setIsLoaded(true);
    }, []);

    // Update document class and localStorage when theme changes
    useEffect(() => {
        if (!isLoaded) return;
        
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme, isLoaded]);

    const toggleTheme = useCallback(() => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    return { theme, toggleTheme, setTheme, isLoaded };
};

// Context for sharing theme state
export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

