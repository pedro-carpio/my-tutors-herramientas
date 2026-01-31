import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * Interceptor HTTP para manejar autenticación y refresh token automático
 *
 * FUNCIONES:
 * 1. Añade JWT automáticamente a todas las requests (excepto endpoints públicos)
 * 2. Detecta errores 401 (JWT expirado)
 * 3. Intenta renovar JWT automáticamente con refresh token
 * 4. Reintenta la request original con el nuevo JWT
 * 5. Si el refresh falla (token expirado/revocado), limpia tokens y redirige a login
 *
 * FLUJO DE RENOVACIÓN:
 * Request → 401 Error → Refresh Token Request → Nuevo JWT → Retry Request Original
 *
 * PERSISTENCIA ENTRE PESTAÑAS:
 * - JWT y refresh token están en localStorage (persisten entre pestañas)
 * - Al abrir nueva pestaña, el usuario sigue autenticado
 * - Si el JWT expiró, se renueva automáticamente en la primera request
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const http = inject(HttpClient);

  // Añadir JWT si existe (excepto para endpoints de autenticación)
  let authReq = req;
  const token = tokenStorage.getToken();

  // No añadir token a endpoints públicos
  const publicEndpoints = ['/user/login', '/user/register', '/user/refresh-token', '/auth/google'];
  const isPublicEndpoint = publicEndpoints.some((endpoint) => req.url.includes(endpoint));

  if (token && !isPublicEndpoint) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    console.log('🔐 JWT añadido a request:', req.url);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 y NO es un endpoint público, intentar refresh
      if (error.status === 401 && !isPublicEndpoint) {
        console.log('⚠️ [Interceptor] JWT expirado (401), intentando renovar...');

        const refreshToken = tokenStorage.getRefreshToken();

        if (!refreshToken) {
          console.log('❌ [Interceptor] No hay refresh token, sesión expirada');
          tokenStorage.clearTokens();
          window.location.href = '/login';
          return throwError(() => error);
        }

        console.log('🔄 [Interceptor] Renovando JWT con refresh token...');

        // Intentar renovar el JWT
        return http
          .post<{ token: string; expires_in: string }>(
            `${environment.apiUrl}/user/refresh-token`,
            { refresh_token: refreshToken },
            {
              headers: new HttpHeaders({
                'Content-Type': 'application/json',
              }),
            },
          )
          .pipe(
            switchMap((response) => {
              console.log('✅ [Interceptor] JWT renovado exitosamente');
              tokenStorage.saveToken(response.token);

              // Reintentar la request original con el nuevo token
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${response.token}`),
              });

              console.log('🔄 [Interceptor] Reintentando request original con nuevo JWT');
              return next(retryReq);
            }),
            catchError((refreshError) => {
              console.error('❌ [Interceptor] Error al renovar JWT:', refreshError);
              console.log('🚪 [Interceptor] Refresh token expirado/revocado, limpiando sesión');
              tokenStorage.clearTokens();
              window.location.href = '/login';
              return throwError(() => refreshError);
            }),
          );
      }

      return throwError(() => error);
    }),
  );
};
