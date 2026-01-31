import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { environment } from '../../environments/environment';

export interface Curso {
  id: number;
  unidad_educativa: string;
  distrito_educativo: string;
  director: string;
  nivel: string;
  seccion: string;
  gestion: string;
  turno_manana: number;
  turno_tarde: number;
  docente_id: number;
  docente_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface GetCursosResponse {
  cursos: Curso[];
  total: number;
  user_role?: string;
}

export interface CreateCursoRequest {
  unidad_educativa: string;
  distrito_educativo: string;
  director: string;
  nivel: string;
  seccion: string;
  gestion: string;
  turno_manana?: number;
  turno_tarde?: number;
  docente_id?: number; // Solo para admins
}

export interface CreateCursoResponse {
  message: string;
  curso: Curso;
}

export interface UpdateCursoRequest {
  unidad_educativa?: string;
  distrito_educativo?: string;
  director?: string;
  nivel?: string;
  seccion?: string;
  gestion?: string;
  turno_manana?: number;
  turno_tarde?: number;
  docente_id?: number; // Solo para admins
}

export interface UpdateCursoResponse {
  message: string;
  curso: Curso;
}

export interface DeleteCursoResponse {
  message: string;
}

/**
 * Servicio para gestión de cursos
 *
 * Endpoints del backend:
 * - GET /curso - Lista cursos (filtrado por rol: admin ve todos, teacher solo los suyos)
 * - POST /curso - Crea un nuevo curso
 * - PATCH /curso/:id - Actualiza un curso existente
 * - DELETE /curso/:id - Elimina un curso (solo admin)
 *
 * NOTA: El backend usa rutas personalizadas en /curso, no /rest/curso
 */
@Injectable({
  providedIn: 'root',
})
export class CursoService extends HttpService {
  /**
   * Obtiene lista de cursos del backend
   *
   * IMPORTANTE: El backend filtra automáticamente según el rol:
   * - Admin: ve todos los cursos
   * - Teacher: solo ve sus cursos (donde es docente)
   *
   * @param firebaseUid - UID del usuario autenticado en Firebase
   */
  getCursos(firebaseUid: string): Observable<GetCursosResponse> {
    console.log('🔍 Obteniendo cursos del usuario:', firebaseUid);
    return this.get$<GetCursosResponse>('/curso', firebaseUid);
  }

  /**
   * Obtiene un curso específico por ID
   *
   * @param cursoId - ID del curso
   * @param firebaseUid - UID del usuario autenticado
   */
  getCursoById(cursoId: number, firebaseUid: string): Observable<Curso> {
    return this.get$<Curso>(`/curso/${cursoId}`, firebaseUid);
  }

  /**
   * Crea un nuevo curso
   *
   * REGLAS:
   * - Teachers se auto-asignan como docente
   * - Admins pueden asignar a cualquier docente
   *
   * @param request - Datos del curso a crear
   * @param firebaseUid - UID del usuario autenticado
   */
  createCurso(request: CreateCursoRequest, firebaseUid: string): Observable<CreateCursoResponse> {
    console.log('➕ Creando curso:', request);
    return this.post$<CreateCursoResponse>('/curso', request, firebaseUid);
  }

  /**
   * Actualiza un curso existente
   *
   * PERMISOS:
   * - Admin: puede editar cualquier curso
   * - Teacher: solo puede editar sus propios cursos
   *
   * @param cursoId - ID del curso a actualizar
   * @param request - Datos a actualizar
   * @param firebaseUid - UID del usuario autenticado
   */
  updateCurso(
    cursoId: number,
    request: UpdateCursoRequest,
    firebaseUid: string,
  ): Observable<UpdateCursoResponse> {
    console.log(`✏️ Actualizando curso ${cursoId}:`, request);
    return this.patch$<UpdateCursoResponse>(`/curso/${cursoId}`, request, firebaseUid);
  }

  /**
   * Elimina un curso
   *
   * PERMISOS: Solo admin puede eliminar cursos
   * RESTRICCIÓN: No se puede eliminar si tiene estudiantes asignados
   *
   * @param cursoId - ID del curso a eliminar
   * @param firebaseUid - UID del usuario autenticado (debe ser admin)
   */
  deleteCurso(cursoId: number, firebaseUid: string): Observable<DeleteCursoResponse> {
    console.log(`🗑️ Eliminando curso ${cursoId}`);
    return this.delete$<DeleteCursoResponse>(`/curso/${cursoId}`, firebaseUid);
  }

  /**
   * Obtiene cursos usando el endpoint genérico REST
   *
   * IMPORTANTE: Este endpoint NO filtra por usuario - devuelve TODOS los cursos
   * Usa autenticación general del backend (BACKEND_API_TOKEN)
   * Para filtros por rol (admin ve todos, teacher solo los suyos), usa getCursos()
   */
  getCursosGeneric(): Observable<any> {
    console.log('🔍 [TEST] Obteniendo cursos via /rest/curso (sin filtro de usuario)');
    const backendToken = environment.apiUrl.includes('127.0.0.1')
      ? environment.backendApiToken
      : environment.backendApiToken;
    return this.getRest$<any>('/rest/curso', backendToken);
  }
}
