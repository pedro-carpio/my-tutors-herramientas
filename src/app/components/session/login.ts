import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { catchError, of } from 'rxjs';

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
  styles: [],
})
export class Login {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);

  protected email = '';
  protected password = '';
  protected loading = signal(false);
  protected errorMessage = signal('');

  protected onSubmit(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.signIn(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      },
    });
  }

  protected signInWithGoogle(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.signInWithGoogle().subscribe({
      next: (credential) => {
        // Primero intentar login (usuario existente)
        this.userService
          .loginUser(credential.user.uid)
          .pipe(
            catchError((loginError) => {
              // Si usuario no existe (404), registrarlo
              if (loginError.status === 404) {
                console.log('ℹ️ Usuario no existe, registrando...');
                return this.userService.registerUser(
                  credential.user.uid,
                  credential.user.email,
                  credential.user.displayName,
                );
              }
              // Si es error 403 (inactivo), mostrar mensaje
              if (loginError.status === 403) {
                this.loading.set(false);
                this.errorMessage.set(
                  'Tu cuenta está pendiente de activación. Contacta al administrador.',
                );
                throw loginError;
              }
              // Cualquier otro error, re-lanzar
              throw loginError;
            }),
          )
          .subscribe({
            next: (response) => {
              // Guardar el JWT (viene de login o register)
              if (response && response.token) {
                this.tokenStorage.saveToken(response.token);
                console.log('✅ JWT guardado después de autenticación');
                this.router.navigate(['/inicio']);
              } else {
                console.error('❌ No se recibió token del backend');
                this.loading.set(false);
                this.errorMessage.set('Error al autenticar con el backend');
              }
            },
            error: (error) => {
              if (error.status !== 403) {
                // 403 ya se manejó arriba
                this.loading.set(false);
                this.errorMessage.set('Error al autenticar. Intenta de nuevo.');
                console.error('❌ Error en autenticación:', error);
              }
            },
          });
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      },
    });
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email o contraseña incorrectos';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta más tarde';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet';
      default:
        return 'Error al iniciar sesión. Intenta de nuevo';
    }
  }
}
