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
    console.log('🔵 [OAuth Callback] Componente inicializado');
    console.log('🔵 [OAuth Callback] URL completa:', window.location.href);
    console.log('🔵 [OAuth Callback] Query params:', window.location.search);
    console.log('🔵 [OAuth Callback] ¿Es popup?:', window.opener !== null);

    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refresh_token');
    const error = this.route.snapshot.queryParamMap.get('error');
    const message = this.route.snapshot.queryParamMap.get('message');

    console.log('🔵 [OAuth Callback] Parámetros extraídos:', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
      hasError: !!error,
      errorMessage: message,
    });

    if (token && refreshToken) {
      console.log('✅ [OAuth Callback] Tokens recibidos correctamente');

      // Si es un popup (tiene window.opener), enviar tokens a la ventana principal
      if (window.opener && !window.opener.closed) {
        console.log('📤 [OAuth Callback] Enviando tokens a ventana principal via postMessage');

        window.opener.postMessage(
          {
            type: 'OAUTH_SUCCESS',
            token,
            refreshToken,
          },
          window.location.origin,
        );

        console.log('✅ [OAuth Callback] Mensaje enviado - cerrando popup');

        // Cerrar el popup después de un breve delay
        setTimeout(() => {
          window.close();
        }, 500);
      } else {
        // Si NO es un popup (navegación directa), guardar tokens normalmente
        console.log('🔵 [OAuth Callback] No es popup - guardando tokens localmente');

        this.tokenStorage.saveToken(token);
        this.tokenStorage.saveRefreshToken(refreshToken);

        console.log('✅ [OAuth Callback] Tokens guardados en storage');
        console.log('🔵 [OAuth Callback] Cargando usuario...');

        // Cargar usuario para actualizar UI
        this.app.loadCurrentUser();

        // Redirigir a inicio
        setTimeout(() => {
          console.log('🟢 [OAuth Callback] Redirigiendo a /inicio');
          this.router.navigate(['/inicio']);
        }, 500);
      }
    } else if (error) {
      // Hay un error del backend
      console.error('🔴 [OAuth Callback] Error recibido del backend:', {
        error,
        message,
      });

      // Si es popup, enviar error a ventana principal
      if (window.opener && !window.opener.closed) {
        console.log('📤 [OAuth Callback] Enviando error a ventana principal');

        window.opener.postMessage(
          {
            type: 'OAUTH_ERROR',
            error,
            message: message || 'Error desconocido',
          },
          window.location.origin,
        );

        setTimeout(() => {
          window.close();
        }, 500);
      }
    } else if (!this.error()) {
      // No hay tokens ni error - algo salió mal
      console.error('🔴 [OAuth Callback] No se recibieron tokens ni error');
      console.error('🔴 [OAuth Callback] Redirigiendo a login con error');

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: 'OAUTH_ERROR',
            error: 'oauth_failed',
            message: 'No se recibieron tokens',
          },
          window.location.origin,
        );

        setTimeout(() => {
          window.close();
        }, 500);
      } else {
        this.router.navigate(['/login'], {
          queryParams: { error: 'oauth_failed', message: 'No se recibieron tokens' },
        });
      }
    }
  }

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
