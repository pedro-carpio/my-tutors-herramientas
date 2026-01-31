import { Routes } from '@angular/router';
import { Login } from './components/session/login';
import { Register } from './components/session/register';
import { ForgotPassword } from './components/session/forgot-password';
import { OAuthCallback } from './components/session/oauth-callback';
import { Home } from './components/home/home';
import { Anuncio } from './components/anuncio/anuncio';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';
import { rootGuard } from './guards/root.guard';

export const routes: Routes = [
  { path: '', canActivate: [rootGuard], children: [] },
  { path: 'inicio', component: Home, canActivate: [authGuard] },
  { path: 'anuncio', component: Anuncio },
  { path: 'login', component: Login, canActivate: [publicGuard] },
  { path: 'register', component: Register, canActivate: [publicGuard] },
  { path: 'forgot-password', component: ForgotPassword, canActivate: [publicGuard] },
  { path: 'auth/callback', component: OAuthCallback },
  { path: '**', redirectTo: '/inicio' },
];
