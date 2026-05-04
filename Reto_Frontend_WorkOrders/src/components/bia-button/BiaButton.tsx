import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import styles from './BiaButton.module.scss';

/**
 * Props del componente BiaButton
 * Extiende las props de Button de Material-UI para mantener compatibilidad completa
 */
export interface BiaButtonProps extends ButtonProps {
  /**
   * Variante del botón
   * @default 'contained'
   */
  variant?: 'contained' | 'outlined' | 'text';
  
  /**
   * Clase CSS adicional
   */
  className?: string;
  
  /**
   * Indica si el botón está en estado de carga
   */
  isLoading?: boolean;
  
  /**
   * Texto a mostrar cuando el botón está cargando
   */
  loadingText?: string;
}

/**
 * Componente BiaButton
 * 
 * Componente wrapper para Button de Material-UI que proporciona
 * estilos consistentes y configuración por defecto para la aplicación.
 * 
 * @example
 * ```tsx
 * <BiaButton
 *   type="submit"
 *   variant="contained"
 *   fullWidth
 *   isLoading={isLoading}
 *   loadingText="Cargando..."
 * >
 *   Enviar
 * </BiaButton>
 * ```
 */
const BiaButton: React.FC<BiaButtonProps> = ({
  variant = 'contained',
  className = '',
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...rest
}) => {
  return (
    <Button
      variant={variant}
      className={styles.biaButton + ' ' + className}
      disabled={disabled || isLoading}
      sx={{
        '&.Mui-disabled': {
          cursor: 'not-allowed',
          pointerEvents: 'auto',
        },
        ...rest.sx,
      }}
      {...rest}
    >
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
};

export default BiaButton;

