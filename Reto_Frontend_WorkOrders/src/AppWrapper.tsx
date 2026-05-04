import React, { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { MUIThemeProvider } from 'theme/mui-theme';
import { ReactQueryProvider } from '@shared/tanStack/react-query';
import { useAuthStore } from '@shared/store/auth/useAuthStore';
import { AuthStorageKeys, ISession } from '@shared/store/auth/authStore.interface';
import { HostNavigationProvider } from '@shared/context/HostNavigationContext';
import { RefreshTokenProvider } from '@shared/context/RefreshTokenContext';
import 'theme/index.scss';
/**
 * Tipos para la navegación del host
 */
export interface HostLocation {
  pathname: string;
  search: string;
  hash: string;
  state?: any;
}

export type NavigateFunction = (to: string | number, options?: { replace?: boolean; state?: any }) => void;

export type RefreshTokenCallback = () => Promise<{ token: string; refreshToken: string }>;

/**
 * Props que recibe el componente desde el host
 */
export interface AppWrapperProps {
  // Autenticación
  token?: string;
  refreshToken?: string;
  onRefreshToken?: RefreshTokenCallback;

  // Navegación: permite al micrositio actualizar la URL del host
  navigate?: NavigateFunction;

  // Ubicación: permite al micrositio saber en qué ruta está
  location?: HostLocation;

  // Ruta base: contexto en el que está montado el micrositio
  basePath?: string;

  // Ruta relativa dentro del micrositio
  subPath?: string;
}

/**
 * Wrapper para el componente App que incluye MemoryRouter
 * Este es el componente que se expone a través de Module Federation
 * 
 * Usa MemoryRouter para:
 * - Ser completamente independiente del router del host
 * - No interferir con la navegación del host
 * - Funcionar como un micro-frontend aislado
 * 
 * @param token - Token de autenticación del usuario
 * @param refreshToken - Token de refresco para renovar el token
 * @param onRefreshToken - Callback para refrescar el token cuando expire
 * @param navigate - Función de navegación del host
 * @param location - Ubicación actual del host
 * @param basePath - Ruta base donde está montado el micrositio
 * @param subPath - Ruta relativa dentro del micrositio
 */
const AppWrapper: React.FC<AppWrapperProps> = ({
  token,
  refreshToken,
  onRefreshToken,
  navigate,
  location,
  basePath,
  subPath
}) => {
  const { login, setUser } = useAuthStore();

  useEffect(() => {
    // Si el host envía tokens, los guardamos en el store
    if (token && refreshToken) {
      const session = new ISession(token, refreshToken);
      login(session, token, refreshToken);
      console.log('✅ Tokens recibidos desde el host y guardados en el store');
    }
    const sessionString = sessionStorage.getItem(AuthStorageKeys.SESSION);
    if (sessionString) {
      const session = JSON.parse(sessionString);
      setUser(session.user);
    }
  }, [token, refreshToken, login]);

  useEffect(() => {
    // Log de información de navegación recibida del host
    if (navigate || location || basePath || subPath) {
      console.log('📍 Información de navegación del host:', {
        hasNavigate: !!navigate,
        location: location?.pathname,
        basePath,
        subPath
      });
    }
  }, [navigate, location, basePath, subPath]);

  // El log del callback ahora se maneja en RefreshTokenManager

  return (
    <RefreshTokenProvider onRefreshToken={onRefreshToken}>
      <HostNavigationProvider
        navigate={navigate}
        location={location}
        basePath={basePath}
        subPath={subPath}
      >
        <ReactQueryProvider>
          <MUIThemeProvider>
            <MemoryRouter initialEntries={subPath ? [subPath] : undefined}>
              <App />
            </MemoryRouter>
          </MUIThemeProvider>
        </ReactQueryProvider>
      </HostNavigationProvider>
    </RefreshTokenProvider>
  );
};

export default AppWrapper;

