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

    return this.post$<RegisterUserResponse>('/user/register', payload);
  }

  /**
   * Obtiene información del usuario del backend basado en su Firebase UID
   *
   * @param firebase_uid - UID del usuario en Firebase Auth
   */
  getUserByFirebaseUid(firebase_uid: string): Observable<GetUserResponse> {
    return this.get$<GetUserResponse>(`/user/me?firebase_uid=${firebase_uid}`, firebase_uid);
  }

  /**
   * Obtiene información del usuario actual autenticado
   * Alias conveniente para getUserByFirebaseUid
   *
   * @param firebase_uid - UID del usuario autenticado
   */
  getCurrentUser(firebase_uid: string): Observable<GetUserResponse> {
    return this.getUserByFirebaseUid(firebase_uid);
  }
}
