import React from 'react';
import { ReactQueryProvider } from '@shared';
import { MUIThemeProvider } from 'theme/mui-theme';
import AppRouter from './router';

/**
 * Componente principal de la aplicación
 * Este es el componente que se expone a través de Module Federation
 * Usa MemoryRouter para no interferir con el router del host
 */
const App: React.FC = () => {
  return (
    <ReactQueryProvider>
      <MUIThemeProvider>
        <AppRouter />
      </MUIThemeProvider>
    </ReactQueryProvider>
  );
};

export default App;

