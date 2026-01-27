import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Guard para proteger rutas públicas (login, register)
 * Si el usuario ya está autenticado, redirige a /inicio
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si aún está cargando, esperar
  if (authService.isLoading()) {
    return toObservable(authService.loading).pipe(
      map((loading) => {
        if (loading) {
          return false;
        }
        return !authService.isAuthenticated() ? true : router.createUrlTree(['/inicio']);
      }),
    );
  }

  // Si ya cargó, verificar autenticación
  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};
