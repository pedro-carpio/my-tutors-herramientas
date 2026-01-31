import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user.service';
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
        // Sincronizar con backend (registrar si es primera vez)
        this.userService
          .registerUser(credential.user.uid, credential.user.email, credential.user.displayName)
          .pipe(
            catchError((error) => {
              // Si error 409, usuario ya existe - continuar normalmente
              if (error.status === 409) {
                console.log('✅ Usuario ya existe en backend');
              } else {
                console.error('❌ Error al sincronizar con backend:', error);
              }
              return of(null);
            }),
          )
          .subscribe(() => {
            this.router.navigate(['/inicio']);
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
