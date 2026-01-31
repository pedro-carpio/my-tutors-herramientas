import {
  Injectable,
  inject,
  signal,
  PLATFORM_ID,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Auth,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);

  // Signal para el usuario actual
  public readonly currentUser = signal<AuthUser | null>(null);
  public readonly loading = signal<boolean>(true);

  constructor() {
    // Solo escuchar cambios de autenticación en el navegador
    if (isPlatformBrowser(this.platformId)) {
      // Primero inicializar el listener
      this.initAuthListener();
    } else {
      this.loading.set(false);
    }
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser();
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  /**
   * Indica si está cargando el estado de autenticación
   */
  isLoading(): boolean {
    return this.loading();
  }

  /**
   * Registro con email y contraseña
   * NOTA: Login/Register components manejan el registro en backend
   */
  signUp(email: string, password: string, displayName?: string): Observable<UserCredential> {
    const promise = createUserWithEmailAndPassword(this.auth, email, password).then(
      async (credential) => {
        if (displayName && credential.user) {
          await updateProfile(credential.user, { displayName });
        }
        return credential;
      },
    );

    return from(promise);
  }

  /**
   * Inicio de sesión con email y contraseña
   */
  signIn(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Inicio de sesión con Google (usando popup con custom parameters)
   * NOTA: Login/Register components manejan el registro en backend
   */
  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    // Configurar popup para evitar COOP issues
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    return from(runInInjectionContext(this.injector, () => signInWithPopup(this.auth, provider)));
  }

  /**
   * Cerrar sesión
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  /**
   * Actualizar perfil del usuario
   */
  updateUserProfile(displayName?: string, photoURL?: string): Observable<void> {
    const user = this.auth.currentUser;
    if (!user) {
      return from(Promise.reject('No user logged in'));
    }
    return from(updateProfile(user, { displayName, photoURL }));
  }

  /**
   * Inicializar listener de cambios de autenticación
   */
  private initAuthListener(): void {
    onAuthStateChanged(this.auth, (user: User | null) => {
      if (user) {
        const authUser: AuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        };
        this.currentUser.set(authUser);

        // Mostrar información del usuario en consola
        console.log('🔐 Usuario autenticado:');
        console.table({
          UID: authUser.uid,
          Email: authUser.email || 'N/A',
          Nombre: authUser.displayName || 'Sin nombre',
          Foto: authUser.photoURL || 'Sin foto',
          'Email verificado': authUser.emailVerified ? '✓ Sí' : '✗ No',
        });
      } else {
        this.currentUser.set(null);
        console.log('🚪 Usuario cerró sesión');
      }
      this.loading.set(false);
    });
  }
}
