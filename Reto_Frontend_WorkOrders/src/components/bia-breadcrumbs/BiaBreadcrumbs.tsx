import React from 'react';
import { Breadcrumbs, BreadcrumbsProps, Link, Typography } from '@mui/material';
import { BiaIcon } from '../bia-icon/bia-icon';
import styles from './BiaBreadcrumbs.module.scss';

/**
 * Interfaz para cada item del breadcrumb
 */
export interface BreadcrumbItem {
  /**
   * Texto a mostrar en el breadcrumb
   */
  label: string;
  
  /**
   * URL de navegación (opcional para el último item)
   */
  href?: string;
  
  /**
   * Función onClick para navegación personalizada
   */
  onClick?: () => void;
  
  /**
   * Icono a mostrar antes del label (nombre del icono FontAwesome)
   */
  icon?: string;
}

/**
 * Props del componente BiaBreadcrumbs
 * Extiende las props de Breadcrumbs de Material-UI
 */
export interface BiaBreadcrumbsProps extends Omit<BreadcrumbsProps, 'children'> {
  /**
   * Array de items para el breadcrumb
   */
  items: BreadcrumbItem[];
  
  /**
   * Clase CSS adicional
   */
  className?: string;
  
  /**
   * Separador personalizado entre items
   * @default '/'
   */
  separator?: React.ReactNode;
}

/**
 * Componente BiaBreadcrumbs
 * 
 * Componente wrapper para Breadcrumbs de Material-UI que proporciona
 * estilos consistentes y configuración por defecto para la aplicación.
 * 
 * @example
 * ```tsx
 * <BiaBreadcrumbs
 *   items={[
 *     { label: 'Inicio', href: '/', icon: 'faHome' },
 *     { label: 'Módulo', href: '/modulo' },
 *     { label: 'Página actual' }
 *   ]}
 * />
 * ```
 */
const BiaBreadcrumbs: React.FC<BiaBreadcrumbsProps> = ({
  items,
  className = '',
  separator = '/',
  ...rest
}) => {
  return (
    <Breadcrumbs
      separator={separator}
      className={`${styles.biaBreadcrumbs} ${className}`}
      aria-label="breadcrumb"
      {...rest}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        const content = (
          <>
            {item.icon && (
              <BiaIcon 
                iconName={item.icon} 
                iconType="solid" 
                className={styles.icon}
              />
            )}
            <span>{item.label}</span>
          </>
        );
        
        if (isLast) {
          return (
            <Typography 
              key={index} 
              className={styles.currentItem}
            >
              {content}
            </Typography>
          );
        }
        
        return (
          <Link
            key={index}
            href={item.href}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
            }}
            className={styles.linkItem}
            underline="hover"
          >
            {content}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default BiaBreadcrumbs;
