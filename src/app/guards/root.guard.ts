import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { map } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Guard para la ruta raíz que redirige según el estado de autenticación
 * Autenticado → /inicio
 * No autenticado → /anuncio
 */
export const rootGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si aún está cargando, esperar
  if (authService.isLoading()) {
    return toObservable(authService.loading).pipe(
      map((loading) => {
        if (loading) {
          return false;
        }
        return router.createUrlTree([authService.isAuthenticated() ? '/inicio' : '/anuncio']);
      }),
    );
  }

  // Si ya cargó, redirigir según autenticación
  return router.createUrlTree([authService.isAuthenticated() ? '/inicio' : '/anuncio']);
};
