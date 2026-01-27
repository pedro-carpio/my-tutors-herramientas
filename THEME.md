# Sistema de Temas

Sistema completo de temas para la aplicación con soporte para modo claro/oscuro.

## Características

### ✅ Variables CSS Personalizadas

- Colores primarios basados en azul (escala 50-900)
- Temas claro y oscuro
- Detección automática de preferencias del sistema
- Transiciones suaves entre temas

### ✅ Tipografía Roboto

- Google Fonts importado automáticamente
- Pesos: 300, 400, 500, 700
- Escala tipográfica completa (xs a 5xl)
- Clases de utilidad para tamaños y pesos

### ✅ Servicio de Temas

- `ThemeService` con signals para reactividad
- Persistencia en localStorage
- Soporte SSR (verifica plataforma)
- Métodos: `getTheme()`, `setTheme()`, `toggleTheme()`

### ✅ Componente Toggle

- `<app-theme-toggle />` listo para usar
- Iconos visuales (☀️/🌙)
- Accesible (aria-label)

## Uso

### En Componentes

```typescript
import { ThemeService } from './services/theme';

export class MyComponent {
  private themeService = inject(ThemeService);

  cambiarTema() {
    this.themeService.setTheme('dark');
  }
}
```

### Clases de Utilidad

```html
<!-- Texto -->
<p class="text-primary">Texto principal</p>
<p class="text-secondary">Texto secundario</p>

<!-- Fondos -->
<div class="bg-primary">Fondo principal</div>
<div class="card">Card con estilos</div>

<!-- Botones -->
<button class="btn btn-primary">Primario</button>
<button class="btn btn-outline">Outline</button>
```

### Variables CSS Directas

```css
.mi-componente {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}
```

## Estructura de Archivos

```
src/assets/styles/
├── _theme.scss       # Variables de colores y temas
├── _typography.scss  # Roboto y escala tipográfica
├── _base.scss        # Reset y estilos base
└── _utilities.scss   # Clases de utilidad
```

## Temas Disponibles

1. **`light`**: Tema claro forzado
2. **`dark`**: Tema oscuro forzado
3. **`auto`**: Sigue preferencias del sistema (default)

## Personalización

### Cambiar Color Primario

Edita las variables en [\_theme.scss](src/assets/styles/_theme.scss):

```scss
:root {
  --primary-500: #tu-color;
  --primary-600: #tu-color-oscuro;
  // ...
}
```

### Agregar Nuevos Colores

```scss
:root {
  --accent-500: #ff5722;
}

[data-theme='dark'] {
  --accent-500: #ff7043;
}
```
