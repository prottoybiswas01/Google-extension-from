import { ThemeMode } from '../../types';

export class ThemeManager {
  private currentTheme: ThemeMode = 'light';

  getTheme(): ThemeMode {
    return this.currentTheme;
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  toggleTheme(): ThemeMode {
    const next = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(next);
    return next;
  }
}

export const themeManager = new ThemeManager();
