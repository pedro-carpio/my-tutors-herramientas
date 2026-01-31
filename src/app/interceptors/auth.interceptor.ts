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
 * 1. Añade JWT automáticamente a todas las requests
 * 2. Detecta errores 401 (JWT expirado)
 * 3. Intenta renovar JWT con refresh token
 * 4. Reintenta la request original con el nuevo JWT
 * 5. Si el refresh falla, limpia tokens y redirige a login
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
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 y NO es un endpoint público, intentar refresh
      if (error.status === 401 && !isPublicEndpoint) {
        console.log('🔄 JWT expirado, intentando renovar...');

        const refreshToken = tokenStorage.getRefreshToken();

        if (!refreshToken) {
          console.log('❌ No hay refresh token, redirigiendo a login');
          tokenStorage.clearTokens();
          window.location.href = '/login';
          return throwError(() => error);
        }

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
              console.log('✅ JWT renovado exitosamente');
              tokenStorage.saveToken(response.token);

              // Reintentar la request original con el nuevo token
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${response.token}`),
              });

              return next(retryReq);
            }),
            catchError((refreshError) => {
              console.log('❌ Error al renovar JWT, limpiando sesión');
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
