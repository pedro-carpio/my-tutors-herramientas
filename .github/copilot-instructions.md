# AI Coding Agent Instructions

## Project Overview

Angular 21 SSR (Server-Side Rendering) application using standalone components, signals, and prerendering. Portfolio project for tutor tools.

## Architecture

### Component Model

- **Standalone components only**: No NgModules. All components use `imports: []` array.
- **Inline templates and styles**: Components define templates/styles inline via schematics configuration ([angular.json](angular.json#L11-L13)).
- **Signals over traditional state**: Use `signal()` for reactive state (see [app.ts](src/app/app.ts#L14)).
- **No test files**: Project configured with `skipTests: true` for all schematics.

### SSR Configuration

- **Prerendering by default**: All routes use `RenderMode.Prerender` ([app.routes.server.ts](src/app/app.routes.server.ts#L3-L8)).
- **Dual configs**: Browser config in [app.config.ts](src/app/app.config.ts), server in [app.config.server.ts](src/app/app.config.server.ts).
- **Event replay enabled**: `withEventReplay()` for hydration performance ([app.config.ts](src/app/app.config.ts#L10)).

### TypeScript Settings

- **Strict mode everywhere**: Full strict checks enabled ([tsconfig.json](tsconfig.json#L5-L11)).
- **Module preservation**: Uses `module: "preserve"` for modern bundling.
- **Experimental decorators**: Still enabled for Angular compatibility.

## Development Workflows

### Package Management

```bash
pnpm start              # Dev server on http://localhost:4200
pnpm build              # Production build with SSR
pnpm run watch          # Development build with watch mode
pnpm run serve:ssr:my-tutors-tools  # Preview SSR build locally
```

**Always use pnpm** - configured as package manager in [angular.json](angular.json#L4) and package.json.

### Code Generation

```bash
ng generate component my-component  # Creates standalone component with inline template/styles
ng generate service my-service      # No test file generated
```

Components automatically get `inlineTemplate`, `inlineStyle`, SCSS, and `skipTests` from schematics.

## Conventions

### File Organization

- Components: `src/app/*.ts` (flat structure currently, organize by feature as needed)
- Routes: [app.routes.ts](src/app/app.routes.ts) (browser), [app.routes.server.ts](src/app/app.routes.server.ts) (server)
- Static assets: `public/` directory (copied to dist)

### Code Style

- **Prettier enforced**: 100 char line width, single quotes, Angular HTML parser ([package.json](package.json#L12-L23))
- **Protected over public**: Use `protected readonly` for component properties exposed to templates
- **Selector prefix**: All components use `app-` prefix
- **SCSS modules**: Always use `@use` instead of `@import` (deprecated)

### Component Pattern Example

```typescript
@Component({
  selector: 'app-my-component',
  imports: [CommonModule, OtherStandaloneComponent],
  template: `<div>{{ mySignal() }}</div>`,
  styles: [
    `
      div {
        color: blue;
      }
    `,
  ],
})
export class MyComponent {
  protected readonly mySignal = signal('value');
}
```

## Backend Integration

### API Architecture

**NO direct HttpClient usage in components** - All HTTP calls go through domain services.

### Auth Flow (Firebase → Backend)

1. User signs in via [AuthService](src/app/services/auth.ts) using Firebase SDK
2. Frontend extracts `firebase_uid` from Firebase User object
3. On first login, call `UserService.registerUser()` to create user record:
   ```typescript
   userService.registerUser(firebase_uid, email, displayName).subscribe(...)
   ```
4. For subsequent requests, pass `firebase_uid` to service methods - they inject it as `Authorization: Bearer {uid}` header
5. Backend middleware validates UID against `user_account` table ([backend/src/middleware/auth.ts](../../backend/src/middleware/auth.ts))

### Environment Configuration

- **API URL**: `environment.apiUrl` = `https://d1-rest.pedrocarpiom.workers.dev`
- **Backend API Token**: 
  - **Development**: `environment.backendApiToken` = `'my super secret token'` (hardcoded in [environment.development.ts](src/environments/environment.development.ts))
  - **Production**: Injected from `process.env.BACKEND_API_TOKEN` via [apphosting.yaml](apphosting.yaml)
- **Firebase config**: Separate configs for dev/prod in `environment.*.ts`
- **Role IDs**: Backend roles - `1=admin, 2=teacher, 3=director, 4=seller`

**Two authentication systems**:
1. **BACKEND_API_TOKEN**: For `/rest/*` endpoints (general app authentication)
2. **firebase_uid**: For `/curso`, `/user` endpoints (user-specific authentication)

### Backend Endpoints

**Custom Routes** (preferred for complex logic):
- `/user/register` - POST - Register new user
- `/user/me?firebase_uid=xxx` - GET - Get user profile
- `/curso` - GET - List courses (auto-filtered by role)
- `/curso` - POST - Create course
- `/curso/:id` - PATCH - Update course
- `/curso/:id` - DELETE - Delete course (admin only)

**Generic REST** (for simple CRUD):
- `/rest/{table}` - GET - List records with filtering/sorting/pagination
- `/rest/{table}/{id}` - GET - Get single record
- `/rest/{table}` - POST - Create record
- `/rest/{table}/{id}` - PATCH - Update record
- `/rest/{table}/{id}` - DELETE - Delete record

See [backend README](../../backend/README.md) for full REST API documentation.

## Route Guards System

Three guards control navigation flow ([guards/](src/app/guards/)):

1. **[authGuard](src/app/guards/auth.guard.ts)**: Protects authenticated routes
   - Redirects to `/anuncio` if not logged in
   - Uses `toObservable()` to handle signal-based loading state
2. **[publicGuard](src/app/guards/public.guard.ts)**: Prevents authenticated users from accessing login/register
   - Redirects to `/inicio` if already logged in
3. **[rootGuard](src/app/guards/root.guard.ts)**: Smart root redirect
   - Sends authenticated users to `/inicio`
   - Sends guests to `/anuncio`

**Pattern**: Guards use `toObservable(authService.loading)` for async auth state checks during SSR.

## Firebase Authentication

## Firebase Authentication (Frontend Only)

### Configuration

- **Firebase SDK**: `@angular/fire@20.0.1` + `firebase@12.8.0`
- **Environments**: [environment.ts](src/environments/environment.ts) (prod), [environment.development.ts](src/environments/environment.development.ts) (dev)
- **Browser-only**: Firebase initialized only in browser via [app.config.ts](src/app/app.config.ts), never on server
- **Backend sync**: After Firebase sign-in, sync user data to backend via `/user/register` endpoint

### Auth Service

[AuthService](src/app/services/auth.ts) provides:

- `getCurrentUser()`, `isAuthenticated()`, `isLoading()` - State management with signals
- `signUp()`, `signIn()`, `signInWithGoogle()` - Authentication methods
- `logout()`, `resetPassword()`, `updateUserProfile()` - User management
- SSR-safe: Uses `isPlatformBrowser()` checks

### Auth Components

- [Login](src/app/components/session/login.ts) - Email/password + Google sign-in
- [Register](src/app/components/session/register.ts) - Registration with validation
- Error messages translated to Spanish

## Data Services

### Service Architecture (Refactored)

Services follow a **layered architecture** with **two authentication systems**:

**Base Layer**: [HttpService](src/app/services/http.service.ts)
- Provides common HTTP configuration and SSR safety
- **Two types of auth headers**:
  - `createUserAuthHeaders(firebaseUid)` - For custom endpoints (/curso, /user) that identify specific users
  - `createBackendAuthHeaders(backendToken)` - For REST generic endpoints (/rest/*) using BACKEND_API_TOKEN
- Protected methods:
  - `get$(url, firebaseUid)` - User-specific GET
  - `getRest$(url, backendToken)` - Generic REST GET
  - `post$()`, `patch$()`, `delete$()` - User-specific mutations
- Platform checks with `ensureBrowser()` to prevent SSR errors

**Authentication Flow**:
1. **Firebase UID** → Custom endpoints (`/curso`, `/user`) → Backend validates against `user_account` table
2. **BACKEND_API_TOKEN** → REST generic endpoints (`/rest/*`) → Backend validates against SECRET

**Domain Services** (extend HttpService):

1. **[UserService](src/app/services/user.service.ts)** - User management
   - `registerUser(firebase_uid, email, displayName)` - Register new users (role_id: 2, inactive by default)
   - `getUserByFirebaseUid(uid)` - Fetch user profile from backend
   - `getCurrentUser(uid)` - Alias for getting current user
   - Private helper: `capitalizeName()` - Formats Spanish names correctly

2. **[CursoService](src/app/services/curso.service.ts)** - Course management
   - `getCursos(firebaseUid)` - List courses (auto-filtered by backend: admin sees all, teachers see only theirs)
   - `getCursoById(id, uid)` - Get single course
   - `createCurso(request, uid)` - Create course (teachers auto-assign as docente)
   - `updateCurso(id, request, uid)` - Update course (ownership verified by backend)
   - `deleteCurso(id, uid)` - Delete course (admin only)
   - `getCursosGeneric()` - Test endpoint using `/rest/curso` with BACKEND_API_TOKEN (NO user filtering)

**Pattern for new domain services**:
```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

@Injectable({ providedIn: 'root' })
export class EstudianteService extends HttpService {
  // Custom endpoints with user identification
  getEstudiantes(firebaseUid: string): Observable<any> {
    return this.get$<any>('/estudiante', firebaseUid);
  }
  
  // Generic REST endpoints (all data, no user filter)
  getAllEstudiantesGeneric(): Observable<any> {
    const token = environment.backendApiToken;
    return this.getRest$<any>('/rest/estudiante', token);
  }
}
```

**Legacy**: [ApiService](src/app/services/api.ts) is **deprecated** - delegates to UserService. Use domain-specific services instead.

**AuthService vs UserService**:
- **[AuthService](src/app/services/auth.ts)**: Firebase authentication (signIn, signUp, logout) - KEEP THIS
- **[UserService](src/app/services/user.service.ts)**: Backend user data management - USE THIS for backend data
- Components handle syncing: after Firebase auth, call `UserService.registerUser()` to sync with backend

## Theming System

### CSS Variables

- Theme system in `src/assets/styles/_theme.scss`
- Light/dark modes via `[data-theme]` attribute
- Auto-detection with `prefers-color-scheme`

### Styling Structure

All styles use `@use` imports (never `@import`):

- `_theme.scss` - CSS variables for colors and spacing
- `_typography.scss` - Roboto fonts and text utilities
- `_base.scss` - CSS reset and base styles
- `_utilities.scss` - Utility classes (buttons, cards, colors)
- `_forms.scss` - **Reusable form components** (NEW)

### Form Styles

Use global classes from `_forms.scss`:

- `.form-container` - Centered form layout
- `.form-card` - Card container for forms
- `.form-group` - Input groups with labels
- `.divider` - Divider with centered text
- `.alert` - Alert messages (error, success, warning, info)
- `.form-links` - Link groups at bottom of forms

**Pattern**: Keep component styles minimal, leverage global form classes.

### Theme Service

`ThemeService` provides:

- `getTheme()`, `setTheme(theme)`, `toggleTheme()`
- Persists to localStorage
- SSR-compatible

### Icons & Typography

- **Roboto** from Google Fonts
- **Material Icons** for UI elements

## Critical Notes

- **SSR considerations**: All code runs on server during prerender. Avoid `window`/`document` without platform checks (`isPlatformBrowser`)
- **No Wrangler**: Recently removed - do not add Cloudflare-related dependencies
- **Angular 21 features**: Leverage latest APIs (signals, standalone, event replay) over legacy patterns
- **SCSS imports**: Never use `@import` - always use `@use` (not deprecated)
