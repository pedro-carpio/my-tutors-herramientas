import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Guard para proteger rutas que requieren autenticación
 * Verifica si existe JWT válido en sessionStorage
 * Si el usuario no está autenticado, redirige a /anuncio
 */
export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (!tokenStorage.hasToken()) {
    return router.createUrlTree(['/anuncio']);
  }

  return true;
};
