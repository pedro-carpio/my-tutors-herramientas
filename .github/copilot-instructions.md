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

## Firebase Authentication

### Configuration

- **Firebase SDK**: `@angular/fire@20.0.1` + `firebase@12.8.0`
- **Environments**: [environment.ts](src/environments/environment.ts) (prod), [environment.development.ts](src/environments/environment.development.ts) (dev)
- **Browser-only**: Firebase initialized only in browser via [app.config.ts](src/app/app.config.ts), never on server

### Auth Service

[AuthService](src/app/services/auth.ts) provides:

- `getCurrentUser()`, `isAuthenticated()`, `isLoading()` - State management with signals
- `signUp()`, `signIn()`, `signInWithGoogle()` - Authentication methods
- `logout()`, `resetPassword()`, `updateUserProfile()` - User management
- SSR-safe: Uses `isPlatformBrowser()` checks

### Auth Components

- [Login](src/app/login.ts) - Email/password + Google sign-in
- [Register](src/app/register.ts) - Registration with validation
- Error messages translated to Spanish

See [FIREBASE_AUTH.md](FIREBASE_AUTH.md) for complete setup guide.

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
