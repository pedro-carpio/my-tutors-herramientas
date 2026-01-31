import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, type UserProfileResponse } from '../../services/user.service';
import { CursoService, type Curso } from '../../services/curso.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <div class="user-info">
          <span>{{ backendUser()?.fullName || backendUser()?.email }}</span>
          <button class="btn btn-outline" (click)="onLogout()">Cerrar Sesión</button>
        </div>
      </header>

      <div class="dashboard-content">
        <!-- Perfil del Usuario -->
        <section class="card">
          <h2>Mi Perfil</h2>
          @if (loadingProfile()) {
            <p>Cargando perfil...</p>
          } @else if (profileError()) {
            <div class="alert error">{{ profileError() }}</div>
          } @else if (backendUser()) {
            <div class="profile-info">
              <p><strong>Nombre:</strong> {{ backendUser()!.fullName }}</p>
              <p><strong>Email:</strong> {{ backendUser()!.email }}</p>
              <p><strong>Rol:</strong> {{ backendUser()!.roleName }}</p>
              <p>
                <strong>Estado:</strong>
                {{ backendUser()!.isActive ? '✅ Activo' : '⏳ Pendiente de activación' }}
              </p>
            </div>
          } @else {
            <div class="alert warning">
              Perfil no encontrado. Verifica que tu cuenta esté registrada.
            </div>
          }
        </section>

        <!-- Cursos del Usuario -->
        <section class="card">
          <h2>Mis Cursos</h2>
          @if (loadingCursos()) {
            <p>Cargando cursos...</p>
          } @else if (cursosError()) {
            <div class="alert error">{{ cursosError() }}</div>
          } @else if (cursos() && cursos()!.length > 0) {
            <div class="cursos-list">
              @for (curso of cursos(); track curso.id) {
                <div class="curso-card">
                  <h3>{{ curso.nivel }} - Sección {{ curso.seccion }}</h3>
                  <p><strong>Unidad Educativa:</strong> {{ curso.unidad_educativa }}</p>
                  <p><strong>Gestión:</strong> {{ curso.gestion }}</p>
                  <p>
                    <strong>Turno:</strong>
                    {{ curso.turno_manana ? 'Mañana' : '' }}
                    {{ curso.turno_tarde ? 'Tarde' : '' }}
                  </p>
                </div>
              }
            </div>
          } @else {
            <div class="alert info">No tienes cursos asignados.</div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--border-color);
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .dashboard-content {
        display: grid;
        gap: 2rem;
      }

      .card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
      }

      .card h2 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: var(--text-primary);
      }

      .profile-info p {
        margin: 0.5rem 0;
        line-height: 1.6;
      }

      .cursos-list {
        display: grid;
        gap: 1rem;
      }

      .curso-card {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        padding: 1rem;
      }

      .curso-card h3 {
        margin: 0 0 0.5rem 0;
        color: var(--primary-color);
      }

      .curso-card p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      .alert {
        padding: 1rem;
        border-radius: 4px;
        margin: 1rem 0;
      }

      .alert.error {
        background: #fee;
        border: 1px solid #fcc;
        color: #c33;
      }

      .alert.warning {
        background: #ffc;
        border: 1px solid #fc6;
        color: #960;
      }

      .alert.info {
        background: #e6f2ff;
        border: 1px solid #99ccff;
        color: #0066cc;
      }
    `,
  ],
})
export class Home implements OnInit {
  private userService = inject(UserService);
  private cursoService = inject(CursoService);
  private tokenStorage = inject(TokenStorageService);
  private router = inject(Router);

  protected backendUser = signal<UserProfileResponse['user'] | null>(null);
  protected cursos = signal<Curso[] | null>(null);

  protected loadingProfile = signal(false);
  protected loadingCursos = signal(false);
  protected profileError = signal('');
  protected cursosError = signal('');

  ngOnInit(): void {
    if (!this.tokenStorage.hasToken()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserProfile();
    this.loadCursos();
  }

  private loadUserProfile(): void {
    this.loadingProfile.set(true);
    this.profileError.set('');

    console.log('🔍 Cargando perfil del usuario desde /user/me');

    this.userService
      .getCurrentUser()
      .pipe(
        catchError((error) => {
          console.error('❌ Error al cargar perfil:', error);
          this.profileError.set(
            error.status === 404
              ? 'Perfil no encontrado. Contacta al administrador.'
              : `Error al cargar perfil: ${error.message || error.statusText}`,
          );
          return of(null);
        }),
      )
      .subscribe((response) => {
        this.loadingProfile.set(false);
        if (response) {
          console.log('✅ Perfil cargado:', response.user);
          this.backendUser.set(response.user);
        }
      });
  }

  private loadCursos(): void {
    this.loadingCursos.set(true);
    this.cursosError.set('');

    console.log('🔍 Cargando cursos del usuario');

    this.cursoService
      .getCursos()
      .pipe(
        catchError((error) => {
          console.error('❌ Error al cargar cursos:', error);
          this.cursosError.set(`Error al cargar cursos: ${error.message || error.statusText}`);
          return of(null);
        }),
      )
      .subscribe((response) => {
        this.loadingCursos.set(false);
        if (response) {
          console.log('✅ Cursos cargados:', response.cursos);
          this.cursos.set(response.cursos);
        }
      });
  }

  protected onLogout(): void {
    console.log('🚪 Cerrando sesión');
    this.tokenStorage.clearTokens();
    this.router.navigate(['/login']);
  }
}
