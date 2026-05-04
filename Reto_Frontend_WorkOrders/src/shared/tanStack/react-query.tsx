import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Configuración de React Query
 * 
 * QueryClient configurado con opciones por defecto para manejo de estado del servidor
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

interface ReactQueryProviderProps {
  children: ReactNode;
}

/**
 * Provider de React Query
 * 
 * Envuelve la aplicación para habilitar React Query y sus devtools
 */
export const ReactQueryProvider: React.FC<ReactQueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default queryClient;

