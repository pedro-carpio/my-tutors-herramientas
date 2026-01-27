import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-anuncio',
  imports: [CommonModule],
  template: `
    Hola, aqui viene una lista de ventajas o videos de como esta herramienta sirve a maestr@s de
    kinder de momento (si eres de primaria o secundaria y te interesa una herramienta que te sirva a
    lo largo del año, hablame al [mi numero de whatsapp]) puedes probar la app:
    <button (click)="goToRegister()">Registrarse</button> ya tienes una cuenta?
    <button (click)="goToLogin()">Iniciar Sesión</button>
  `,
  styles: [],
})
export class Anuncio {
  constructor(private router: Router) {}

  protected goToRegister(): void {
    this.router.navigate(['/register']);
  }

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
