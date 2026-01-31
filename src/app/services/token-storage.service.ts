import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Servicio para almacenar y recuperar tokens del backend
 *
 * ALMACENAMIENTO:
 * - JWT (corta duración: 1h) en localStorage (persiste entre pestañas)
 * - Refresh Token (larga duración: 100 días) en localStorage
 *
 * El JWT contiene:
 * - user_id: identificador del usuario en el backend
 * - iat: timestamp de emisión
 * - exp: timestamp de expiración (1 hora)
 */
@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private platformId = inject(PLATFORM_ID);
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Guarda el JWT en localStorage (persiste entre pestañas y al cerrar navegador)
   */
  saveToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
      console.log('💾 JWT almacenado en localStorage');
    }
  }

  /**
   * Recupera el JWT desde localStorage
   */
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  /**
   * Guarda el refresh token en localStorage (persiste al cerrar navegador)
   */
  saveRefreshToken(refreshToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      console.log('💾 Refresh token almacenado en localStorage');
    }
  }

  /**
   * Recupera el refresh token desde localStorage
   */
  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Elimina ambos tokens (logout completo)
   */
  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      console.log('🗑️ Tokens eliminados de localStorage');
    }
  }

  /**
   * Verifica si hay un JWT almacenado
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Verifica si el JWT ha expirado
   * @returns true si expiró o no existe
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a millisegundos
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}
