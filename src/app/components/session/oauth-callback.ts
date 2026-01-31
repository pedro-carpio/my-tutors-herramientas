import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenStorageService } from '../../services/token-storage.service';
import { CommonModule } from '@angular/common';
import { App } from '../../app';

@Component({
  selector: 'app-oauth-callback',
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="callback-card">
        @if (error()) {
          <div class="error-state">
            <h2>Error de autenticación</h2>
            <p>{{ errorMessage() }}</p>
            <button class="btn btn-primary" (click)="goToLogin()">Volver al login</button>
          </div>
        } @else {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Completando autenticación...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .callback-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--bg-primary);
      }

      .callback-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 3rem;
        text-align: center;
        max-width: 400px;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .spinner {
        border: 4px solid var(--border-color);
        border-top: 4px solid var(--primary-color);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .error-state {
        h2 {
          color: var(--error-color);
          margin-bottom: 1rem;
        }

        p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
      }
    `,
  ],
})
export class OAuthCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tokenStorage = inject(TokenStorageService);
  private app = inject(App);

  protected error = () => this.route.snapshot.queryParamMap.has('error');
  protected errorMessage = () =>
    this.route.snapshot.queryParamMap.get('message') || 'Error desconocido';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refresh_token');

    if (token && refreshToken) {
      // Guardar tokens
      this.tokenStorage.saveToken(token);
      this.tokenStorage.saveRefreshToken(refreshToken);

      console.log('✅ OAuth exitoso - tokens guardados');

      // Cargar usuario para actualizar UI
      this.app.loadCurrentUser();

      // Limpiar URL y redirigir
      setTimeout(() => {
        this.router.navigate(['/inicio']);
      }, 500);
    } else if (!this.error()) {
      // No hay tokens ni error - algo salió mal
      this.router.navigate(['/login'], {
        queryParams: { error: 'oauth_failed', message: 'No se recibieron tokens' },
      });
    }
  }

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
