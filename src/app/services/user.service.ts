import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface BackendUser {
  id: number;
  email: string;
  full_name: string | null;
  role_id: number;
  role_name: string;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  full_name?: string;
  role_id?: number; // 2=teacher, 3=director, 4=seller
}

export interface RegisterUserResponse {
  message: string;
  user: BackendUser;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  user: BackendUser;
  token: string; // JWT (1h)
  refresh_token: string; // Refresh token (100 días)
  expires_in: string; // "1h"
}

export interface UserProfileResponse {
  user: {
    userId: number;
    email: string;
    fullName: string | null;
    roleId: number;
    roleName: string;
    isActive: boolean;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  token: string;
  expires_in: string;
}

export interface GetUserResponse {
  user: {
    userId: number;
    email: string;
    fullName: string | null;
    roleId: number;
    roleName: string;
    isActive: boolean;
  };
}

/**
 * Servicio para gestión de usuarios con autenticación backend directa
 * Sistema: email/password + OAuth 2.0 (Google)
 */
@Injectable({
  providedIn: 'root',
})
export class UserService extends HttpService {
  /**
   * Registra un nuevo usuario con email/password
   *
   * REGLAS:
   * - Sin SECRET: crea cuenta inactiva (requiere activación admin)
   * - Con SECRET: crea cuenta activa (solo para admins)
   * - Roles disponibles: 2=teacher, 3=director, 4=seller
   *
   * @param request - Datos del usuario (email, password, full_name, role_id)
   */
  registerUser(request: RegisterUserRequest): Observable<RegisterUserResponse> {
    console.log('📤 Registrando usuario en backend:', {
      email: request.email,
      role_id: request.role_id || 2,
    });
    return this.post$<RegisterUserResponse>('/user/register', request, false);
  }

  /**
   * Autentica un usuario con email/password
   *
   * RETORNA:
   * - JWT (1 hora de validez)
   * - Refresh token (100 días)
   * - Información del usuario
   *
   * @param request - Credenciales (email, password)
   */
  loginUser(request: LoginUserRequest): Observable<LoginUserResponse> {
    console.log('🔐 Autenticando usuario:', request.email);
    return this.post$<LoginUserResponse>('/user/login', request, false);
  }

  /**
   * Renueva el JWT usando un refresh token válido
   *
   * @param refreshToken - Refresh token obtenido en login
   */
  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    console.log('🔄 Renovando JWT');
    return this.post$<RefreshTokenResponse>(
      '/user/refresh-token',
      { refresh_token: refreshToken },
      false,
    );
  }

  /**
   * Obtiene información del usuario actual autenticado
   * Usa el JWT almacenado en sessionStorage
   */
  getCurrentUser(): Observable<GetUserResponse> {
    console.log('👤 Obteniendo usuario actual');
    return this.get$<GetUserResponse>('/user/me');
  }

  /**
   * Revoca un refresh token específico (logout de un dispositivo)
   */
  revokeToken(refreshToken: string): Observable<{ message: string }> {
    console.log('🚪 Revocando refresh token');
    return this.post$<{ message: string }>(
      '/user/revoke-token',
      { refresh_token: refreshToken },
      false,
    );
  }

  /**
   * Cierra todas las sesiones del usuario (requiere JWT)
   */
  logoutAll(): Observable<{ message: string }> {
    console.log('🚪 Cerrando todas las sesiones');
    return this.delete$<{ message: string }>('/user/logout-all');
  }
}
