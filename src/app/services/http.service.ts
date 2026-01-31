import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { SignJWT } from 'jose';
import { environment } from '../../environments/environment';

/**
 * Servicio base para comunicación HTTP con el backend
 * Proporciona configuración común para todos los servicios de datos
 */
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  protected http = inject(HttpClient);
  protected platformId = inject(PLATFORM_ID);
  protected readonly apiUrl = environment.apiUrl;

  /**
   * Genera un JWT firmado con el firebase_uid
   *
   * El JWT contiene:
   * - firebase_uid: identificador del usuario
   * - iat: timestamp de emisión
   * - exp: timestamp de expiración (1 hora)
   *
   * @param firebaseUid - UID del usuario autenticado de Firebase
   * @returns JWT firmado con el secreto compartido
   */
  private async generateFirebaseJWT(firebaseUid: string): Promise<string> {
    console.log('🔑 DEBUG backendApiToken:', environment.backendApiToken);
    console.log('🔑 DEBUG token length:', environment.backendApiToken?.length);
    console.log('🔑 DEBUG production mode:', environment.production);

    const secret = new TextEncoder().encode(environment.backendApiToken);

    const jwt = await new SignJWT({ firebase_uid: firebaseUid })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    return jwt;
  }

  /**
   * Crea headers HTTP con autenticación de doble capa segura:
   * - Authorization: Bearer token del backend (BACKEND_API_TOKEN)
   * - X-Firebase-Token: JWT firmado con firebase_uid en payload
   *
   * Usado para endpoints custom (/curso, /user) que necesitan identificar al usuario
   * @param firebaseUid - UID del usuario autenticado de Firebase
   */
  protected async createUserAuthHeaders(firebaseUid: string): Promise<HttpHeaders> {
    const jwt = await this.generateFirebaseJWT(firebaseUid);

    return new HttpHeaders({
      Authorization: `Bearer ${environment.backendApiToken}`,
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
   * @param firebaseUid - UID del usuario autenticado
   */
  protected get$<T>(url: string, firebaseUid: string): Observable<T> {
    this.ensureBrowser();

    return new Observable<T>((observer) => {
      this.createUserAuthHeaders(firebaseUid)
        .then((headers) => {
          this.http.get<T>(`${this.apiUrl}${url}`, { headers }).subscribe({
            next: (data) => observer.next(data),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        })
        .catch((err) => observer.error(err));
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
   */
  protected post$<T>(url: string, body: any, firebaseUid?: string): Observable<T> {
    this.ensureBrowser();

    if (!firebaseUid) {
      return this.http.post<T>(`${this.apiUrl}${url}`, body);
    }

    return new Observable<T>((observer) => {
      this.createUserAuthHeaders(firebaseUid)
        .then((headers) => {
          this.http.post<T>(`${this.apiUrl}${url}`, body, { headers }).subscribe({
            next: (data) => observer.next(data),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        })
        .catch((err) => observer.error(err));
    });
  }

  /**
   * Wrapper para llamadas PATCH con verificación de plataforma
   */
  protected patch$<T>(url: string, body: any, firebaseUid: string): Observable<T> {
    this.ensureBrowser();

    return new Observable<T>((observer) => {
      this.createUserAuthHeaders(firebaseUid)
        .then((headers) => {
          this.http.patch<T>(`${this.apiUrl}${url}`, body, { headers }).subscribe({
            next: (data) => observer.next(data),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        })
        .catch((err) => observer.error(err));
    });
  }

  /**
   * Wrapper para llamadas DELETE con verificación de plataforma
   */
  protected delete$<T>(url: string, firebaseUid: string): Observable<T> {
    this.ensureBrowser();

    return new Observable<T>((observer) => {
      this.createUserAuthHeaders(firebaseUid)
        .then((headers) => {
          this.http.delete<T>(`${this.apiUrl}${url}`, { headers }).subscribe({
            next: (data) => observer.next(data),
            error: (err) => observer.error(err),
            complete: () => observer.complete(),
          });
        })
        .catch((err) => observer.error(err));
    });
  }
}
