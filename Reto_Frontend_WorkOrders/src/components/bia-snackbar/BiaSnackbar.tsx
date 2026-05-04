import React from 'react';
import { Snackbar, SnackbarProps, Alert, AlertColor, AlertTitle, Slide, Portal } from '@mui/material';
import styles from './BiaSnackbar.module.scss';

/**
 * Props del componente BiaSnackbar
 * Extiende las props de Snackbar de Material-UI para mantener compatibilidad completa
 */
export interface BiaSnackbarProps extends Omit<SnackbarProps, 'children'> {
  /**
   * Indica si el snackbar está abierto
   * @default false
   */
  open: boolean;

  /**
   * Callback que se ejecuta al cerrar el snackbar
   */
  onClose?: (event: React.SyntheticEvent | Event, reason?: string) => void;

  /**
   * Título del mensaje (opcional)
   */
  title?: string;

  /**
   * Mensaje a mostrar en el snackbar
   */
  message?: string;

  /**
   * Severidad del mensaje (afecta el color y el ícono)
   * @default 'info'
   */
  severity?: AlertColor;

  /**
   * Duración en milisegundos antes de auto-cerrar
   * @default 6000
   */
  autoHideDuration?: number;

  /**
   * Posición del snackbar en la pantalla
   * @default { vertical: 'bottom', horizontal: 'left' }
   */
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };

  /**
   * Variante del alert dentro del snackbar
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined' | 'standard';

  /**
   * Clase CSS adicional
   */
  className?: string;

  /**
   * Contenido personalizado (si no se usa message)
   */
  children?: React.ReactNode;
}

/**
 * Componente BiaSnackbar
 * 
 * Componente wrapper para Snackbar de Material-UI que proporciona
 * estilos consistentes y configuración por defecto para la aplicación.
 * Incluye integración con Alert para mostrar mensajes con severidad.
 * 
 * @example
 * ```tsx
 * <BiaSnackbar
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Éxito"
 *   message="Operación exitosa"
 *   severity="success"
 *   autoHideDuration={6000}
 * />
 * ```
 * 
 * @example Con contenido personalizado
 * ```tsx
 * <BiaSnackbar
 *   open={isOpen}
 *   onClose={handleClose}
 *   severity="warning"
 * >
 *   <div>Contenido personalizado</div>
 * </BiaSnackbar>
 * ```
 */
const BiaSnackbar: React.FC<BiaSnackbarProps> = ({
  open = false,
  onClose,
  title,
  message,
  severity = 'info',
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'top', horizontal: 'center' },
  variant = 'filled',
  className = '',
  children,
  ...rest
}) => {
  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    // No cerrar si el usuario hace clic fuera del snackbar
    if (reason === 'clickaway') {
      return;
    }
    
    if (onClose) {
      onClose(event, reason);
    }
  };

  return (
    <Portal>
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={anchorOrigin}
        slots={{
          transition: Slide,
        }}
        slotProps={{
          transition: {
            direction: anchorOrigin?.vertical === 'top' ? 'down' : 'up',
          },
        }}
        className={`${styles.biaSnackbar} ${className}`}
        sx={{
          position: 'fixed',
          zIndex: 9999,
        }}
        {...rest}
      >
        <Alert
          onClose={onClose ? (event) => handleClose(event, 'closeButton') : undefined}
          severity={severity}
          variant={variant}
          className={styles.biaSnackbarAlert}
          sx={{ width: '100%' }}
        >
          {title && <AlertTitle className={styles.biaSnackbarTitle}>{title}</AlertTitle>}
          {children || message}
        </Alert>
      </Snackbar>
    </Portal>
  );
};

export default BiaSnackbar;
