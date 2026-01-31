import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Servicio para almacenar y recuperar el JWT del backend
 *
 * El JWT se almacena en localStorage y contiene:
 * - firebase_uid: identificador del usuario
 * - iat: timestamp de emisión
 * - exp: timestamp de expiración (1 hora)
 *
 * El backend genera y firma el JWT, el frontend solo lo almacena y usa.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private platformId = inject(PLATFORM_ID);
  private readonly TOKEN_KEY = 'backend_jwt';

  /**
   * Guarda el JWT en localStorage
   * @param token - JWT firmado por el backend
   */
  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
      console.log('💾 JWT almacenado en localStorage');
    }
  }

  /**
   * Recupera el JWT desde localStorage
   * @returns JWT almacenado o null si no existe
   */
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Elimina el JWT de localStorage
   * Útil cuando el usuario cierra sesión
   */
  clearToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      console.log('🗑️ JWT eliminado de localStorage');
    }
  }

  /**
   * Verifica si hay un JWT almacenado
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }
}
