import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="form-card card">
        <h2>Recuperar Contraseña</h2>

        @if (successMessage()) {
          <div class="alert success">{{ successMessage() }}</div>
        }

        @if (errorMessage()) {
          <div class="alert error">{{ errorMessage() }}</div>
        }

        @if (!successMessage()) {
          <p class="instructions">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <form (ngSubmit)="onSubmit()" #resetForm="ngForm">
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

            <button
              type="submit"
              class="btn btn-primary full-width"
              [disabled]="!resetForm.form.valid || loading()"
            >
              @if (loading()) {
                <span>Enviando...</span>
              } @else {
                <span>Enviar Enlace de Recuperación</span>
              }
            </button>
          </form>
        } @else {
          <div class="success-actions">
            <button class="btn btn-outline full-width" (click)="goToLogin()">
              Volver al inicio de sesión
            </button>
          </div>
        }

        <div class="form-links">
          <a routerLink="/login">Volver al inicio de sesión</a>
          <a routerLink="/register">¿No tienes cuenta? Regístrate</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .instructions {
        text-align: center;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        margin-bottom: 1.5rem;
        line-height: 1.5;
      }

      .success-actions {
        margin-top: 1.5rem;
      }
    `,
  ],
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected email = '';
  protected loading = signal(false);
  protected errorMessage = signal('');
  protected successMessage = signal('');

  protected onSubmit(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.resetPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set(
          `Se ha enviado un enlace de recuperación a ${this.email}. Revisa tu bandeja de entrada.`,
        );
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      },
    });
  }

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No existe una cuenta con este email';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta más tarde';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet';
      default:
        return 'Error al enviar el enlace. Intenta de nuevo';
    }
  }
}
