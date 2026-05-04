import React, { useState } from 'react';
import { TextField, TextFieldProps, FormLabel, IconButton, InputAdornment } from '@mui/material';
import { BiaIcon } from '@components/bia-icon/bia-icon';
import styles from './BiaTextField.module.scss';

/**
 * Props del componente BiaTextField
 * Extiende las props de TextField de Material-UI para mantener compatibilidad completa
 */
export interface BiaTextFieldProps extends Omit<TextFieldProps, 'variant' | 'label'> {
  /**
   * Variante del TextField
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined' | 'standard';
  
  /**
   * Clase CSS adicional
   */
  className?: string;
  
  /**
   * Label del campo (se renderiza fuera del input)
   */
  label?: string;
  
  /**
   * Si el campo es requerido
   */
  required?: boolean;
  
  /**
   * Mostrar icono para limpiar el valor
   * @default false
   */
  showClearIcon?: boolean;
  
  /**
   * Callback cuando se limpia el valor
   */
  onClear?: () => void;
}

/**
 * Componente BiaTextField
 * 
 * Componente wrapper para TextField de Material-UI que proporciona
 * estilos consistentes y configuración por defecto para la aplicación.
 * El label se renderiza fuera del campo, arriba del input.
 * 
 * @example
 * ```tsx
 * <BiaTextField
 *   id="email"
 *   name="email"
 *   type="email"
 *   label="Correo electrónico"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   required
 *   fullWidth
 * />
 * ```
 */
const BiaTextField: React.FC<BiaTextFieldProps> = ({
  variant = 'outlined',
  className = '',
  label,
  required,
  slotProps,
  showClearIcon = false,
  onClear,
  value,
  disabled,
  ...rest
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';
  const showClear = showClearIcon && hasValue && !disabled;
  const showIcon = showClear || isExiting;

  const handleClear = () => {
    if (!onClear || isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onClear();
      setIsExiting(false);
    }, 150);
  };

  return (
    <div className={`${styles['bia-text-field-wrapper']} ${className}`}>
      {label && (
        <FormLabel 
          required={required}
          className={styles['bia-text-field-label']}
        >
          {label}
        </FormLabel>
      )}
      <TextField
        variant={variant}
        className={styles['bia-text-field']}
        value={value}
        disabled={disabled}
        InputProps={{
          endAdornment: showIcon ? (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClear}
                edge="end"
                size="small"
                className={`${styles['clear-icon-button']} ${isExiting ? styles['clear-icon-button-exiting'] : ''}`}
                aria-label="Limpiar campo"
                disabled={isExiting}
              >
                <BiaIcon
                  iconName="faCircleXmark"
                  iconType="solid"
                  size="16px"
                  color="#5D607E"
                />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
        slotProps={slotProps}
        {...rest}
      />
    </div>
  );
};

export default BiaTextField;

