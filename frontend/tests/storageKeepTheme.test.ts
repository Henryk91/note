import { clearStorageKeepTheme, THEME_BARS } from '../src/shared/utils/Helpers/storage';

describe('logout keeps the theme', () => {
  test('clears everything except the chosen theme', () => {
    localStorage.setItem('theme', 'Red');
    localStorage.setItem('loginKey', 'abc');
    localStorage.setItem('REACT_QUERY_OFFLINE_CACHE', '{}');
    clearStorageKeepTheme();
    expect(localStorage.getItem('theme')).toBe('Red');
    expect(localStorage.getItem('loginKey')).toBeNull();
    expect(localStorage.getItem('REACT_QUERY_OFFLINE_CACHE')).toBeNull();
  });
  test('no theme saved: nothing is left behind', () => {
    localStorage.clear();
    localStorage.setItem('loginKey', 'abc');
    clearStorageKeepTheme();
    expect(localStorage.length).toBe(0);
  });
  test('every theme has a title-bar colour', () => {
    expect(Object.keys(THEME_BARS).sort()).toEqual(['Dark', 'Green', 'Monokai', 'Night', 'Ocean', 'Red']);
  });
});
