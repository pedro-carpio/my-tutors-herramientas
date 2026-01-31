// Configuración de Firebase para desarrollo
// Importa el secreto de environment.local.ts (archivo en .gitignore)

import { environment as localEnv } from './environment.local';

export const environment = {
  production: false,
  apiUrl: 'https://d1-rest.pedrocarpiom.workers.dev',
  // El secreto viene de environment.local.ts
  backendApiToken: localEnv.backendApiToken,
  firebase: {
    apiKey: 'AIzaSyCX4VHkF_0I0panYDHPr3mBvOnLlhxiKtA',
    authDomain: 'my-tutors-herramientas.firebaseapp.com',
    projectId: 'my-tutors-herramientas',
    storageBucket: 'my-tutors-herramientas.firebasestorage.app',
    messagingSenderId: '290666670570',
    appId: '1:290666670570:web:1770dfefe509fa5b152a93',
    measurementId: 'G-MJ1FNDJ288',
  },
};
