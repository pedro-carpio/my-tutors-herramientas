import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="form-card card">
        <h2>¿Olvidaste tu contraseña?</h2>

        <div class="alert info">
          <p>
            Para recuperar tu contraseña, contacta con el administrador a través de WhatsApp. El
            administrador generará un token de recuperación para ti.
          </p>
        </div>

        <a
          href="https://wa.me/59177914381?text=Hola,%20necesito%20recuperar%20mi%20contraseña"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary full-width whatsapp-btn"
        >
          <span class="whatsapp-icon">📱</span>
          Contactar por WhatsApp
        </a>

        <div class="form-links">
          <a routerLink="/login">Volver al inicio de sesión</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .whatsapp-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background-color: #25d366;
        color: white;
        margin: 1.5rem 0;

        &:hover {
          background-color: #20ba5a;
        }
      }

      .whatsapp-icon {
        font-size: 1.5rem;
      }

      .alert.info p {
        margin: 0;
        line-height: 1.6;
      }
    `,
  ],
})
export class ForgotPassword {}
