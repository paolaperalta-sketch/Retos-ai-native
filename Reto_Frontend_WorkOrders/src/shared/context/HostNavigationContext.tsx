import React, { createContext, useContext, ReactNode } from 'react';
import { HostLocation, NavigateFunction } from '../../AppWrapper';

/**
 * Contexto para compartir la información de navegación del host
 * con todos los componentes del micrositio
 */
interface HostNavigationContextType {
  navigate?: NavigateFunction;
  location?: HostLocation;
  basePath?: string;
  subPath?: string;
}

const HostNavigationContext = createContext<HostNavigationContextType | undefined>(undefined);

interface HostNavigationProviderProps {
  children: ReactNode;
  navigate?: NavigateFunction;
  location?: HostLocation;
  basePath?: string;
  subPath?: string;
}

/**
 * Provider que proporciona la información de navegación del host
 * a todos los componentes hijos
 */
export const HostNavigationProvider: React.FC<HostNavigationProviderProps> = ({
  children,
  navigate,
  location,
  basePath,
  subPath,
}) => {
  const value = {
    navigate,
    location,
    basePath,
    subPath,
  };

  return (
    <HostNavigationContext.Provider value={value}>
      {children}
    </HostNavigationContext.Provider>
  );
};

/**
 * Hook para acceder a la información de navegación del host
 * 
 * @example
 * ```tsx
 * const { navigate, location, basePath } = useHostNavigation();
 * 
 * // Navegar a una ruta en el host
 * navigate?.('/otra-ruta');
 * 
 * // Obtener la ubicación actual
 * console.log(location?.pathname);
 * ```
 */
export const useHostNavigation = (): HostNavigationContextType => {
  const context = useContext(HostNavigationContext);
  
  if (context === undefined) {
    // Si no hay contexto, retornar un objeto vacío
    // Esto permite que funcione tanto en modo standalone como en Module Federation
    return {};
  }
  
  return context;
};

