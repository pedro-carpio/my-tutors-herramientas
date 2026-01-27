import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeToggle } from './components/shared/theme-toggle';
import { AuthService } from './services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeToggle, CommonModule],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>{{ title() }}</h1>
        <div class="header-actions">
          <app-theme-toggle />

          @if (authService.isLoading()) {
            <span class="loading">Cargando...</span>
          } @else if (authService.isAuthenticated()) {
            <div class="user-section">
              <span class="user-name">
                {{
                  authService.getCurrentUser()?.displayName || authService.getCurrentUser()?.email
                }}
              </span>
              <button class="btn btn-outline" (click)="logout()">
                <span class="material-icons">logout</span>
                <span>Salir</span>
              </button>
            </div>
          } @else {
            <button class="btn btn-primary" (click)="goToLogin()">
              <span class="material-icons">login</span>
              <span>Iniciar Sesión</span>
            </button>
          }
        </div>
      </header>

      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .app-container {
        min-height: 100vh;
        background-color: var(--bg-primary);
        color: var(--text-primary);
      }

      .app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);

        h1 {
          font-size: 1.5rem;
          cursor: pointer;
          transition: color 0.2s ease;

          &:hover {
            color: var(--primary);
          }
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .user-section {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .user-name {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .loading {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }

      .app-main {
        padding: 2rem;
      }
    `,
  ],
})
export class App {
  protected readonly authService = inject(AuthService);
  private router = inject(Router);

  protected readonly title = signal('Mi Cuaderno');

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
