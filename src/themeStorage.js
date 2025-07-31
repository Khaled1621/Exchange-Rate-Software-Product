// Function to get the theme preference from localStorage
export const getThemePreference = () => {
  const savedTheme = localStorage.getItem('themePreference');
  // If user has previously set a preference, use it
  if (savedTheme) {
    return savedTheme;
  }
  // Otherwise, check if user's system prefers dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  // Default to light mode
  return 'light';
};

// Function to save the theme preference to localStorage
export const saveThemePreference = (theme) => {
  localStorage.setItem('themePreference', theme);
};
