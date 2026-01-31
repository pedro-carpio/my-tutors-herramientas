import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="form-card card">
        <h2>Crear Cuenta</h2>

        @if (successMessage()) {
          <div class="alert success">{{ successMessage() }}</div>
        }

        @if (errorMessage()) {
          <div class="alert error">{{ errorMessage() }}</div>
        }

        <button
          type="button"
          class="login-with-google-btn"
          (click)="signUpWithGoogle()"
          [disabled]="loading()"
        >
          Registrarse con Google
        </button>

        <div class="divider">
          <span>o</span>
        </div>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label for="fullName">Nombre completo</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              [(ngModel)]="fullName"
              required
              placeholder="Tu nombre completo"
              autocomplete="name"
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              required
              minlength="6"
              placeholder="Repite la contraseña"
              autocomplete="new-password"
            />
            @if (confirmPassword && password !== confirmPassword) {
              <small class="error">Las contraseñas no coinciden</small>
            }
          </div>

          <div class="form-group">
            <label for="role">Yo soy</label>
            <select id="role" name="role" [(ngModel)]="selectedRole" required>
              <option value="2">Maestro/Profesor</option>
              <option value="3">Director</option>
              <option value="4">Quiero vender el software</option>
            </select>
            <small class="info"
              >Tu cuenta será revisada por un administrador antes de activarse</small
            >
          </div>

          <button
            type="submit"
            class="btn btn-primary full-width"
            [disabled]="!registerForm.form.valid || password !== confirmPassword || loading()"
          >
            @if (loading()) {
              <span>Creando cuenta...</span>
            } @else {
              <span>Crear Cuenta</span>
            }
          </button>
        </form>

        <div class="form-links">
          <a routerLink="/login">¿Ya tienes cuenta? Inicia sesión</a>
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
        transition: background-color 0.2s ease;
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

      small.info {
        display: block;
        margin-top: 0.5rem;
        color: var(--text-muted);
        font-size: 0.875rem;
      }

      small.error {
        display: block;
        margin-top: 0.5rem;
        color: var(--error-color);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class Register {
  private userService = inject(UserService);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);

  protected fullName = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';
  protected selectedRole = '2';
  protected loading = signal(false);
  protected errorMessage = signal('');
  protected successMessage = signal('');

  protected signUpWithGoogle(): void {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `${environment.apiUrl}/auth/google`,
      'Google Sign In',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no`,
    );

    // Monitor popup closure
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);

        // Check if tokens were saved
        const token = this.tokenStorage.getToken();
        if (token) {
          // OAuth successful, redirect to home
          this.router.navigate(['/inicio']);
        }
      }
    }, 500);
  }

  protected onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.userService
      .registerUser({
        email: this.email,
        password: this.password,
        full_name: this.fullName,
        role_id: parseInt(this.selectedRole),
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          // Verificar si el usuario fue activado automáticamente
          if (response.user.is_active) {
            this.successMessage.set('¡Cuenta creada y activada! Redirigiendo al login...');
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.successMessage.set(
              'Cuenta creada exitosamente. Un administrador debe activar tu cuenta antes de que puedas iniciar sesión.',
            );
            // Limpiar el formulario
            this.fullName = '';
            this.email = '';
            this.password = '';
            this.confirmPassword = '';
            this.selectedRole = '2';
          }

          console.log('✅ Registro exitoso:', response);
        },
        error: (error) => {
          this.loading.set(false);

          if (error.status === 409) {
            this.errorMessage.set('Este email ya está registrado');
          } else if (error.status === 400) {
            this.errorMessage.set(error.error?.error || 'Datos inválidos. Verifica el formulario');
          } else if (error.status === 0) {
            this.errorMessage.set('Error de conexión. Verifica tu internet');
          } else {
            this.errorMessage.set(error.error?.error || 'Error al crear cuenta. Intenta de nuevo');
          }

          console.error('❌ Error en registro:', error);
        },
      });
  }
}
