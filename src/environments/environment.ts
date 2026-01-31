// Configuración de Firebase para producción

export const environment = {
  production: true,
  apiUrl: 'https://d1-rest.pedrocarpiom.workers.dev',
  // En producción, el secreto viene de Google Cloud Secret Manager
  // via process.env.BACKEND_API_TOKEN (inyectado por apphosting.yaml)
  backendApiToken:
    typeof process !== 'undefined' && process.env?.['BACKEND_API_TOKEN']
      ? process.env['BACKEND_API_TOKEN']
      : '',
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
