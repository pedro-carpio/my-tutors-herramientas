import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeToggle } from './components/shared/theme-toggle';
import { TokenStorageService } from './services/token-storage.service';
import { UserService } from './services/user.service';
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

          @if (loadingUser()) {
            <span class="loading">Cargando...</span>
          } @else if (isAuthenticated()) {
            <div class="user-section">
              <span class="user-name">
                {{ currentUser()?.fullName || currentUser()?.email || 'Usuario' }}
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
  private tokenStorage = inject(TokenStorageService);
  private userService = inject(UserService);
  private router = inject(Router);

  protected readonly title = signal('Mi Cuaderno');
  protected readonly currentUser = signal<any>(null);
  protected readonly loadingUser = signal(false);

  protected readonly isAuthenticated = computed(() => {
    return this.tokenStorage.hasToken() && this.currentUser() !== null;
  });

  constructor() {
    console.log('🔵 [App] Inicializando aplicación');

    // Cargar usuario si hay token al iniciar la app
    if (this.tokenStorage.hasToken()) {
      console.log('🔵 [App] Token encontrado, cargando usuario...');
      this.loadCurrentUser();
    } else {
      console.log('🔵 [App] No hay token guardado');
    }
  }

  /**
   * Carga información del usuario actual desde el backend
   * Llamar después de login exitoso para actualizar el UI
   *
   * El interceptor HTTP manejará automáticamente:
   * - Añadir el JWT a la request
   * - Renovar el JWT si está expirado (usando refresh token)
   * - Limpiar tokens y redirigir si el refresh falla
   */
  loadCurrentUser(): void {
    console.log('👤 Obteniendo usuario actual');
    this.loadingUser.set(true);

    this.userService.getCurrentUser().subscribe({
      next: (response) => {
        console.log('✅ Perfil cargado:', response.user);
        this.currentUser.set(response.user);
        this.loadingUser.set(false);
      },
      error: (error) => {
        console.error('❌ Error cargando usuario:', error);
        this.loadingUser.set(false);

        // Si es 401 y el interceptor no pudo renovar el token,
        // significa que el refresh token también expiró
        if (error.status === 401) {
          console.log('🔴 [App] Sesión expirada, limpiando tokens');
          this.tokenStorage.clearTokens();
          this.currentUser.set(null);
          this.router.navigate(['/login']);
        }
      },
    });
  }

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }

  protected logout(): void {
    console.log('🚪 Cerrando sesión');

    // Opcional: revocar el refresh token en el backend
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (refreshToken) {
      this.userService.revokeToken(refreshToken).subscribe({
        next: () => console.log('✅ Refresh token revocado en backend'),
        error: (error) => console.error('⚠️ Error revocando token:', error),
      });
    }

    // Limpiar tokens locales
    this.tokenStorage.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
