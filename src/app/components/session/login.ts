import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { environment } from '../../../environments/environment';
import { App } from '../../app';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="form-card card">
        <h2>Iniciar Sesión</h2>

        @if (errorMessage()) {
          <div class="alert error">{{ errorMessage() }}</div>
        }

        <button
          type="button"
          class="login-with-google-btn"
          (click)="signInWithGoogle()"
          [disabled]="loading()"
        >
          Continuar con Google
        </button>

        <div class="divider">
          <span>o</span>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              email
              placeholder="tu@email.com"
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary full-width"
            [disabled]="!loginForm.form.valid || loading()"
          >
            @if (loading()) {
              <span>Iniciando sesión...</span>
            } @else {
              <span>Iniciar Sesión</span>
            }
          </button>
        </form>

        <div class="form-links">
          <a routerLink="/register">¿No tienes cuenta? Regístrate</a>
          <a routerLink="/forgot-password">¿Olvidaste tu contraseña?</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-with-google-btn {
        width: 100%;
        padding: 12px 24px;
        background-color: white;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-weight: 500;
        color: var(--text-color);
        cursor: pointer;
        transition:
          background-color 0.2s ease,
          box-shadow 0.2s ease;
        text-align: center;
        text-decoration: none;
        display: block;
        margin-bottom: 1.5rem;

        &:hover:not(:disabled) {
          background-color: #f8f9fa;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    `,
  ],
})
export class Login {
  private userService = inject(UserService);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);
  private app = inject(App);

  protected readonly googleOAuthUrl = `${environment.apiUrl}/auth/google`;
  protected email = '';
  protected password = '';
  protected loading = signal(false);
  protected errorMessage = signal('');

  protected signInWithGoogle(): void {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      this.googleOAuthUrl,
      'Google Sign In',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
    );

    if (!popup) {
      this.errorMessage.set(
        'No se pudo abrir la ventana de Google. Verifica que no esté bloqueada por el navegador.',
      );
      return;
    }

    // Monitorear cuando se cierre el popup
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        // Verificar si hay tokens (el usuario completó el OAuth)
        if (this.tokenStorage.hasToken()) {
          this.router.navigate(['/inicio']);
        }
      }
    }, 500);
  }

  protected onSubmit(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.userService.loginUser({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        // Guardar JWT y refresh token
        this.tokenStorage.saveToken(response.token);
        this.tokenStorage.saveRefreshToken(response.refresh_token);
        console.log('✅ Autenticación exitosa');

        // Cargar usuario para actualizar UI
        this.app.loadCurrentUser();

        this.router.navigate(['/inicio']);
      },
      error: (error) => {
        this.loading.set(false);

        if (error.status === 401) {
          this.errorMessage.set('Email o contraseña incorrectos');
        } else if (error.status === 403) {
          this.errorMessage.set(
            'Tu cuenta está pendiente de activación. Contacta al administrador.',
          );
        } else if (error.status === 0) {
          this.errorMessage.set('Error de conexión. Verifica tu internet');
        } else {
          this.errorMessage.set(error.error?.error || 'Error al iniciar sesión. Intenta de nuevo');
        }

        console.error('❌ Error en login:', error);
      },
    });
  }
}
