import { ShoppingListApp } from './components/ShoppingList';
import { ThemeContext, useThemeState } from './hooks/useTheme';

function App() {
  const themeState = useThemeState();

  // Don't render until theme is loaded to prevent flash
  if (!themeState.isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{
      theme: themeState.theme,
      toggleTheme: themeState.toggleTheme,
      setTheme: themeState.setTheme
    }}>
      <ShoppingListApp />
    </ThemeContext.Provider>
  );
}

export default App;
