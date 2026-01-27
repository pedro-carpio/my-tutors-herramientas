import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  template: `
    <div class="home-container">
      @if (authService.isLoading()) {
        <div class="loading-state">
          <h2>Cargando...</h2>
          <p>Verificando sesión</p>
        </div>
      } @else if (authService.isAuthenticated()) {
        <div class="welcome-state">
          <h1>¡Bienvenido!</h1>
        </div>
      } @else {
        <div class="guest-state">
          <h1>Bienvenido a Mi Cuaderno</h1>
          <p>Por favor inicia sesión para continuar</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .home-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }

      .loading-state,
      .welcome-state,
      .guest-state {
        text-align: center;
      }

      h1 {
        color: var(--primary);
        margin-bottom: 1.5rem;
      }
    `,
  ],
})
export class Home {
  protected readonly authService = inject(AuthService);
}
