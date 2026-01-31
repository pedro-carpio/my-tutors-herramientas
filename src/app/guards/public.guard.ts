import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Guard para proteger rutas públicas (login, register)
 * Verifica que NO exista JWT válido
 * Si el usuario ya está autenticado, redirige a /inicio
 */
export const publicGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (tokenStorage.hasToken()) {
    return router.createUrlTree(['/inicio']);
  }

  return true;
};
