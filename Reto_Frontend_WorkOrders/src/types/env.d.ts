/**
 * Declaraciones de tipos para variables de entorno
 * 
 * En Create React App, las variables de entorno deben comenzar con REACT_APP_
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // Variables de entorno personalizadas
    REACT_APP_MOCK_URL?: string;
    REACT_APP_PUBLIC_BACKEND_URL?: string;
    REACT_APP_SCOPE?: string;
    
    // Variables estándar de Node.js
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL?: string;
  }
}

