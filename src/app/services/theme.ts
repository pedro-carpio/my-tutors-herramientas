import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'app-theme';

  // Signal para el tema actual
  protected readonly theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Efecto para aplicar el tema cuando cambia
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.applyTheme(this.theme());
      }
    });

    // Escuchar cambios en las preferencias del sistema
    if (isPlatformBrowser(this.platformId)) {
      this.listenToSystemTheme();
    }
  }

  /**
   * Obtiene el tema actual
   */
  getTheme(): Theme {
    return this.theme();
  }

  /**
   * Establece un nuevo tema
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, theme);
    }
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  toggleTheme(): void {
    const currentTheme = this.theme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Obtiene el tema inicial desde localStorage o preferencias del sistema
   */
  private getInitialTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }

    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme;
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      return stored;
    }

    return 'auto';
  }

  /**
   * Aplica el tema al documento
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    if (theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }

  /**
   * Escucha cambios en las preferencias de tema del sistema
   */
  private listenToSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', (e) => {
      if (this.theme() === 'auto') {
        // Forzar re-aplicación cuando cambian las preferencias del sistema
        this.applyTheme('auto');
      }
    });
  }
}
