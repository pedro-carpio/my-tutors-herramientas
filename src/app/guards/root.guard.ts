import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Guard para la ruta raíz que redirige según el estado de autenticación
 * Autenticado (tiene JWT) → /inicio
 * No autenticado → /anuncio
 */
export const rootGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const targetRoute = tokenStorage.hasToken() ? '/inicio' : '/anuncio';
  return router.createUrlTree([targetRoute]);
};
