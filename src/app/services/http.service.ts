import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorageService } from './token-storage.service';

/**
 * Servicio base para comunicación HTTP con el backend
 * Proporciona configuración común para todos los servicios de datos
 *
 * ARQUITECTURA DE SEGURIDAD:
 * - El backend genera y firma los JWTs (email/password + OAuth)
 * - El frontend almacena JWT en sessionStorage y refresh token en localStorage
 * - Cada request protegido incluye JWT en header Authorization
 * - El interceptor maneja refresh automático cuando el JWT expira
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
   * Crea headers HTTP básicos con Content-Type
   * El interceptor añade el JWT automáticamente
   */
  protected createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }

  /**
   * Verifica si el código se está ejecutando en el navegador
   */
  protected ensureBrowser(): void {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('API calls only available in browser');
    }
  }

  /**
   * Wrapper para llamadas GET
   * El interceptor añade el JWT automáticamente
   */
  protected get$<T>(url: string): Observable<T> {
    this.ensureBrowser();
    return this.http.get<T>(`${this.apiUrl}${url}`, {
      headers: this.createHeaders(),
    });
  }

  /**
   * Wrapper para llamadas POST
   * @param url - Ruta del endpoint
   * @param body - Cuerpo de la petición
   * @param requireAuth - Si requiere JWT (el interceptor lo maneja)
   */
  protected post$<T>(url: string, body: any, requireAuth: boolean = false): Observable<T> {
    this.ensureBrowser();
    return this.http.post<T>(`${this.apiUrl}${url}`, body, {
      headers: this.createHeaders(),
    });
  }

  /**
   * Wrapper para llamadas PATCH
   */
  protected patch$<T>(url: string, body: any): Observable<T> {
    this.ensureBrowser();
    return this.http.patch<T>(`${this.apiUrl}${url}`, body, {
      headers: this.createHeaders(),
    });
  }

  /**
   * Wrapper para llamadas DELETE
   */
  protected delete$<T>(url: string): Observable<T> {
    this.ensureBrowser();
    return this.http.delete<T>(`${this.apiUrl}${url}`, {
      headers: this.createHeaders(),
    });
  }
}
