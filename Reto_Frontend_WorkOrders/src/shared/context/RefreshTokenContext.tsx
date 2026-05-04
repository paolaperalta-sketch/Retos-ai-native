import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { RefreshTokenCallback } from '../../AppWrapper';
import { refreshTokenManager } from './RefreshTokenManager';

/**
 * Contexto para compartir el callback de refresh token
 * con todos los componentes del micrositio
 */
interface RefreshTokenContextType {
  onRefreshToken?: RefreshTokenCallback;
}

const RefreshTokenContext = createContext<RefreshTokenContextType | undefined>(undefined);

interface RefreshTokenProviderProps {
  children: ReactNode;
  onRefreshToken?: RefreshTokenCallback;
}

/**
 * Provider que proporciona el callback de refresh token
 * a todos los componentes hijos
 */
export const RefreshTokenProvider: React.FC<RefreshTokenProviderProps> = ({
  children,
  onRefreshToken,
}) => {
  // Registrar el callback globalmente para que el httpClient pueda acceder
  useEffect(() => {
    refreshTokenManager.setCallback(onRefreshToken);
  }, [onRefreshToken]);

  const value = {
    onRefreshToken,
  };

  return (
    <RefreshTokenContext.Provider value={value}>
      {children}
    </RefreshTokenContext.Provider>
  );
};

/**
 * Hook para acceder al callback de refresh token del host
 * 
 * @example
 * ```tsx
 * const { onRefreshToken } = useRefreshToken();
 * 
 * // Refrescar el token cuando expire
 * const handleRefresh = async () => {
 *   if (onRefreshToken) {
 *     const { token, refreshToken } = await onRefreshToken();
 *     // Actualizar tokens en el store
 *   }
 * };
 * ```
 */
export const useRefreshToken = (): RefreshTokenContextType => {
  const context = useContext(RefreshTokenContext);
  
  if (context === undefined) {
    // Si no hay contexto, retornar un objeto vacío
    // Esto permite que funcione tanto en modo standalone como en Module Federation
    return {};
  }
  
  return context;
};

