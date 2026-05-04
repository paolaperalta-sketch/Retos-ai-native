import React from 'react';
import styles from './BiaTag.module.scss';

/**
 * Props del componente BiaTag
 */
export interface BiaTagProps {
  /**
   * Texto a mostrar en el tag
   */
  label: string;
  
  /**
   * Color del tag
   * @default 'default'
   */
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'purple' | 'disabled';
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Componente BiaTag
 * 
 * Componente para mostrar etiquetas o tags con diferentes colores.
 * 
 * @example
 * ```tsx
 * <BiaTag label="Instalación" color="disabled" />
 * <BiaTag label="Normalización" color="purple" />
 * ```
 */
const BiaTag: React.FC<BiaTagProps> = ({
  label,
  color = 'default',
  className = '',
}) => {
  return (
    <span className={`${styles.biaTag} ${styles[color]} ${className}`}>
      {label}
    </span>
  );
};

export default BiaTag;
