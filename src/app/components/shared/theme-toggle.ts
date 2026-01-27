// Componente para cambiar el tema
// Uso: <app-theme-toggle />

import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  imports: [CommonModule],
  template: `
    <button
      class="btn btn-outline theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="'Cambiar a tema ' + (isDark() ? 'claro' : 'oscuro')"
    >
      @if (isDark()) {
        <span class="material-icons">light_mode</span>
      } @else {
        <span class="material-icons">dark_mode</span>
      }
    </button>
  `,
  styles: [
    `
      .theme-toggle {
        .material-icons {
          font-size: 1.25rem;
          line-height: 1;
        }
      }
    `,
  ],
})
export class ThemeToggle {
  private themeService = inject(ThemeService);

  protected isDark(): boolean {
    const theme = this.themeService.getTheme();
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    // Para 'auto', verificar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
