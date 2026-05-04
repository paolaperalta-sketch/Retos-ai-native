import React from 'react';
import { TextareaAutosize } from '@mui/material';
import { FormLabel } from '@mui/material';
import styles from './BiaTextarea.module.scss';

export interface BiaTextareaProps {
  /** Título del campo */
  label?: string;
  /** Si el campo es obligatorio (muestra asterisco rojo) */
  required?: boolean;
  /** Valor del textarea */
  value?: string;
  /** Callback cuando cambia el valor */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Placeholder */
  placeholder?: string;
  /** Si el campo está deshabilitado */
  disabled?: boolean;
  /** Número mínimo de filas visibles */
  minRows?: number;
  /** Número máximo de filas visibles */
  maxRows?: number;
  /** Clase CSS adicional */
  className?: string;
}

const BiaTextarea: React.FC<BiaTextareaProps> = ({
  label,
  required,
  value = '',
  onChange,
  placeholder = 'Ingrese',
  disabled = false,
  minRows = 3,
  maxRows = 8,
  className,
}) => {
  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {label && (
        <FormLabel required={required} className={styles.label}>
          {label}
        </FormLabel>
      )}
      <TextareaAutosize
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        minRows={minRows}
        maxRows={maxRows}
        className={styles.textarea}
      />
    </div>
  );
};

export default BiaTextarea;
