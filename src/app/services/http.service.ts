import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorageService } from './token-storage.service';

/**
 * Servicio base para comunicación HTTP con el backend
 * Proporciona configuración común para todos los servicios de datos
 *
 * ARQUITECTURA DE SEGURIDAD:
 * - El backend genera y firma los JWTs (no el frontend)
 * - El frontend almacena el JWT en localStorage
 * - Cada request incluye el JWT en el header X-Firebase-Token
 * - El secreto NUNCA se expone al navegador
 */
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  protected http = inject(HttpClient);
  protected platformId = inject(PLATFORM_ID);
  protected tokenStorage = inject(TokenStorageService);
  protected readonly apiUrl = environment.apiUrl;

  /**
   * Crea headers HTTP con autenticación de usuario (JWT solamente)
   *
   * Usado para endpoints custom (/curso, /user/me) que necesitan identificar al usuario
   * NO requiere BACKEND_API_TOKEN - el JWT firmado por el backend es suficiente
   */
  protected createUserAuthHeaders(): HttpHeaders {
    const jwt = this.tokenStorage.getToken();

    if (!jwt) {
      throw new Error('No hay JWT almacenado. Debe autenticarse primero con /user/login');
    }

    return new HttpHeaders({
      'X-Firebase-Token': jwt,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Crea headers HTTP con autenticación general del backend (BACKEND_API_TOKEN)
   * Usado para endpoints REST genéricos (/rest/*) que no necesitan identificar usuarios
   * @param backendToken - Token secreto del backend
   */
  protected createBackendAuthHeaders(backendToken: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${backendToken}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Verifica si el código se está ejecutando en el navegador
   * Lanza error si se intenta hacer una llamada HTTP en SSR
   */
  protected ensureBrowser(): void {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('API calls only available in browser');
    }
  }

  /**
   * Wrapper para llamadas GET con autenticación de usuario (endpoints custom)
   * @param url - Ruta del endpoint (ej: '/curso', '/user/me')
   */
  protected get$<T>(url: string): Observable<T> {
    this.ensureBrowser();
    return this.http.get<T>(`${this.apiUrl}${url}`, {
      headers: this.createUserAuthHeaders(),
    });
  }

  /**
   * Wrapper para llamadas GET con autenticación general (endpoints REST genéricos)
   * @param url - Ruta del endpoint (ej: '/rest/curso')
   * @param backendToken - Token secreto del backend
   */
  protected getRest$<T>(url: string, backendToken: string): Observable<T> {
    this.ensureBrowser();
    return this.http.get<T>(`${this.apiUrl}${url}`, {
      headers: this.createBackendAuthHeaders(backendToken),
    });
  }

  /**
   * Wrapper para llamadas POST con autenticación de usuario
   * Si no se requiere autenticación (register/login), no envía JWT
   */
  protected post$<T>(url: string, body: any, requireAuth: boolean = false): Observable<T> {
    this.ensureBrowser();

    if (!requireAuth) {
      // Endpoints públicos (/user/register, /user/login)
      return this.http.post<T>(`${this.apiUrl}${url}`, body, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${environment.backendApiToken}`,
          'Content-Type': 'application/json',
        }),
      });
    }

    // Endpoints protegidos (requieren JWT)
    return this.http.post<T>(`${this.apiUrl}${url}`, body, {
      headers: this.createUserAuthHeaders(),
    });
  }

  /**
   * Wrapper para llamadas POST con Firebase ID Token
   * Usado por /user/register y /user/login - NO requiere BACKEND_API_TOKEN
   * @param url - Ruta del endpoint
   * @param body - Cuerpo de la petición
   * @param firebaseIdToken - Firebase ID Token del usuario autenticado
   */
  protected postWithFirebaseToken$<T>(
    url: string,
    body: any,
    firebaseIdToken: string,
  ): Observable<T> {
    this.ensureBrowser();
    return this.http.post<T>(`${this.apiUrl}${url}`, body, {
      headers: new HttpHeaders({
        'X-Firebase-ID-Token': firebaseIdToken,
        'Content-Type': 'application/json',
      }),
    });
  }

  /**
   * Wrapper para llamadas PATCH con verificación de plataforma
   */
  protected patch$<T>(url: string, body: any): Observable<T> {
    this.ensureBrowser();
    return this.http.patch<T>(`${this.apiUrl}${url}`, body, {
      headers: this.createUserAuthHeaders(),
    });
  }

  /**
   * Wrapper para llamadas DELETE con verificación de plataforma
   */
  protected delete$<T>(url: string): Observable<T> {
    this.ensureBrowser();
    return this.http.delete<T>(`${this.apiUrl}${url}`, {
      headers: this.createUserAuthHeaders(),
    });
  }
}
