/** Header (browser / installed-app title bar) colour per theme. index.html has the same map for its early script. */
export const THEME_BARS: Record<string, string> = {
  Dark: '#0079ae',
  Ocean: '#35373d',
  Green: '#103762',
  Night: '#27343b',
  Red: '#bb3b00',
  Monokai: '#1e1f1c',
};

/**
 * Logging out (or a failed session refresh) clears local storage; the chosen theme is a device setting, not account
 * data, so it is kept. Otherwise the next login shows the default theme while the installed app's title bar still
 * shows the old one.
 */
export const clearStorageKeepTheme = () => {
  let theme: string | null = null;
  try {
    theme = localStorage.getItem('theme');
    localStorage.clear();
    if (theme) localStorage.setItem('theme', theme);
  } catch {
    /* storage unavailable */
  }
};
