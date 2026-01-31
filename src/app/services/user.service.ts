import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface BackendUser {
  id: number;
  firebase_uid: string;
  email: string | null;
  full_name: string | null;
  role_id: number;
  role_name?: string;
  is_active: number;
  created_at: string;
}

export interface RegisterUserRequest {
  firebase_uid: string;
  email?: string;
  full_name?: string;
  role_id: number;
  is_active: number;
}

export interface RegisterUserResponse {
  message: string;
  user: BackendUser;
  token: string; // JWT generado por el backend
}

export interface LoginUserResponse {
  user: BackendUser;
  token: string; // JWT generado por el backend
}

export interface GetUserResponse {
  user: BackendUser;
}

/**
 * Servicio para gestión de usuarios en el backend
 * Extiende HttpService para reutilizar configuración HTTP común
 */
@Injectable({
  providedIn: 'root',
})
export class UserService extends HttpService {
  /**
   * Capitaliza correctamente un nombre completo
   * Ejemplo: "PEDRO CARPIO MONTERO" -> "Pedro Carpio Montero"
   */
  private capitalizeName(name: string): string {
    if (!name) return '';

    return name
      .toLowerCase()
      .split(' ')
      .map((word) => {
        // Manejar preposiciones y artículos en español
        const lowercaseWords = ['de', 'del', 'la', 'los', 'las', 'y', 'el'];
        if (lowercaseWords.includes(word)) {
          return word;
        }
        // Capitalizar primera letra de cada palabra
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .trim();
  }

  /**
   * Registra un nuevo usuario en el backend
   *
   * REGLAS:
   * - Usuarios auto-registrados son teachers (role_id: 2)
   * - No están activos por defecto (is_active: 0)
   * - Nombres se capitalizan correctamente
   * - Devuelve JWT firmado por el backend
   *
   * @param firebase_uid - UID del usuario en Firebase Auth
   * @param email - Email del usuario
   * @param displayName - Nombre completo del usuario
   */
  registerUser(
    firebase_uid: string,
    email: string | null,
    displayName: string | null,
  ): Observable<RegisterUserResponse> {
    const payload: RegisterUserRequest = {
      firebase_uid,
      email: email || undefined,
      full_name: displayName ? this.capitalizeName(displayName) : undefined,
      role_id: 2, // teacher por defecto
      is_active: 0, // no activo hasta que admin apruebe
    };

    console.log('📤 Registrando usuario en backend:', payload);

    // requireAuth: false porque el usuario aún no tiene JWT
    return this.post$<RegisterUserResponse>('/user/register', payload, false);
  }

  /**
   * Autentica un usuario existente y obtiene un JWT firmado del backend
   *
   * Este método debe llamarse después de autenticar con Firebase para:
   * 1. Validar que el usuario existe en el backend
   * 2. Verificar que está activo (is_active = 1)
   * 3. Obtener JWT firmado para requests subsecuentes
   *
   * @param firebase_uid - UID del usuario autenticado en Firebase
   */
  loginUser(firebase_uid: string): Observable<LoginUserResponse> {
    console.log('🔐 Solicitando JWT del backend para:', firebase_uid);

    // requireAuth: false porque el usuario aún no tiene JWT
    return this.post$<LoginUserResponse>('/user/login', { firebase_uid }, false);
  }

  /**
   * Obtiene información del usuario del backend basado en su JWT
   * El JWT almacenado contiene el firebase_uid
   */
  getUserInfo(): Observable<GetUserResponse> {
    return this.get$<GetUserResponse>('/user/me');
  }

  /**
   * Obtiene información del usuario actual autenticado
   * Alias conveniente para getUserInfo
   */
  getCurrentUser(): Observable<GetUserResponse> {
    return this.getUserInfo();
  }
}
