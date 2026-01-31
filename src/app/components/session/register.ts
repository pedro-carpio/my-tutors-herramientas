import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="form-card card">
        <h2>Crear Cuenta</h2>

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
            <label for="displayName">Nombre</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              [(ngModel)]="displayName"
              required
              placeholder="Tu nombre"
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
  styles: [],
})
export class Register {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);

  protected displayName = '';
  protected email = '';
  protected password = '';
  protected confirmPassword = '';
  protected loading = signal(false);
  protected errorMessage = signal('');

  protected onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.signUp(this.email, this.password, this.displayName).subscribe({
      next: (credential) => {
        // Sincronizar con backend
        this.userService
          .registerUser(credential.user.uid, credential.user.email, credential.user.displayName)
          .pipe(
            catchError((error) => {
              console.error('❌ Error al registrar en backend:', error);
              // Aún así, permitir continuar - el usuario está en Firebase
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

  protected signUpWithGoogle(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.signInWithGoogle().subscribe({
      next: async (credential) => {
        try {
          // Obtener Firebase ID Token del usuario autenticado
          const idToken = await credential.user.getIdToken();

          // Sincronizar con backend
          this.userService
            .registerUser(idToken, credential.user.email, credential.user.displayName)
            .pipe(
              catchError((error) => {
                if (error.status === 409) {
                  console.log('✅ Usuario ya existe en backend');
                } else {
                  console.error('❌ Error al registrar en backend:', error);
                }
                return of(null);
              }),
            )
            .subscribe((response) => {
              // Guardar el JWT si el registro fue exitoso
              if (response && response.token) {
                this.tokenStorage.saveToken(response.token);
                console.log('✅ JWT guardado después del registro');
              }
              this.router.navigate(['/inicio']);
            });
        } catch (error) {
          console.error('❌ Error obteniendo ID Token:', error);
          this.loading.set(false);
          this.errorMessage.set('Error al obtener token de autenticación');
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      },
    });
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet';
      default:
        return 'Error al crear cuenta. Intenta de nuevo';
    }
  }
}
