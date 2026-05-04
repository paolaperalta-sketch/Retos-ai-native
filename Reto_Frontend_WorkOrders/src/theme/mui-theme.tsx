import React, { ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { StyledEngineProvider } from '@mui/material/styles';

/**
 * Tema personalizado de Material-UI
 * 
 * Integra las variables CSS del tema del proyecto con MUI
 */
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#472bef', // --ink-accent
      light: '#9d8ef5', // --chart-purple07
      dark: '#3922bf', // --chart-purple02
      contrastText: '#ffffff',
    },
    text: {
      primary: '#20222e', // --ink-standard
      secondary: '#6d7193', // --ink-weak
      disabled: '#dbdce9', // --ink-disabled
    },
    background: {
      default: '#ffffff', // --background-standard
      paper: '#ffffff',
    },
    divider: '#cecfdb', // --border-standard
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'var(--font-family-global, "Open Sauce One Regular", sans-serif)',
    /* fontSize: 14,
    button: {
      textTransform: 'none',
      fontWeight: 600,
    }, */
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&:hover fieldset': {
              borderColor: '#472bef',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#472bef',
            },
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          /* fontSize: '0.875rem', */
          /* fontWeight: 500, */
          color: '#20222e',
          '&.Mui-required::before': {
            content: '"*"',
            color: '#ff4242',
            marginRight: '0.25rem',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          /* borderRadius: '8px', */
          padding: '0.875rem 1.5rem',
          /* fontSize: '1rem',
          fontWeight: 600, */
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(71, 43, 239, 0.3)',
          },
        },
      },
    },
  },
});

interface MUIThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider del tema de Material-UI
 * 
 * Envuelve la aplicación para aplicar el tema personalizado
 * 
 * IMPORTANTE: StyledEngineProvider con injectFirst asegura que los estilos de MUI
 * se inyecten PRIMERO en el <head>, permitiendo que tus estilos personalizados
 * (SCSS, CSS modules) tengan mayor prioridad y puedan sobrescribir los de MUI
 */
export const MUIThemeProvider: React.FC<MUIThemeProviderProps> = ({ children }) => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </StyledEngineProvider>
  );
};

export default muiTheme;

