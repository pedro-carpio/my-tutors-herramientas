import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Guard para proteger rutas que requieren autenticación
 * Si el usuario no está autenticado, redirige a /anuncio
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si aún está cargando, esperar
  if (authService.isLoading()) {
    return toObservable(authService.loading).pipe(
      map((loading) => {
        if (loading) {
          return false;
        }
        return authService.isAuthenticated() ? true : router.createUrlTree(['/anuncio']);
      }),
    );
  }

  // Si ya cargó, verificar autenticación
  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/anuncio']);
};
