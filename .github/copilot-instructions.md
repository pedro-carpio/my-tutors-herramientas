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

## Critical Notes

- **SSR considerations**: All code runs on server during prerender. Avoid `window`/`document` without platform checks.
- **No Wrangler**: Recently removed - do not add Cloudflare-related dependencies.
- **Angular 21 features**: Leverage latest APIs (signals, standalone, event replay) over legacy patterns.
