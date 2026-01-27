import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeToggle } from './components/shared/theme-toggle';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeToggle],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>{{ title() }}</h1>
        <app-theme-toggle />
      </header>

      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .app-container {
        min-height: 100vh;
        background-color: var(--bg-primary);
        color: var(--text-primary);
      }

      .app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
        box-shadow: var(--shadow-sm);
        h1 {
          font-size: 1.5rem;
        }
      }

      .app-main {
        padding: 2rem;
      }
    `,
  ],
})
export class App {
  protected readonly title = signal('Mi Cuaderno');
}
