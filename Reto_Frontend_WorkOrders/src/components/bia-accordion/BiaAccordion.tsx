import React from 'react';
import { 
  Accordion, 
  AccordionProps, 
  AccordionSummary, 
  AccordionDetails,
  AccordionSummaryProps,
  AccordionDetailsProps
} from '@mui/material';
import { BiaIcon } from '../bia-icon/bia-icon';
import styles from './BiaAccordion.module.scss';

/**
 * Props del componente BiaAccordion
 * Extiende las props de Accordion de Material-UI
 */
export interface BiaAccordionProps extends Omit<AccordionProps, 'children' | 'title'> {
  /**
   * Título o contenido del header del accordion
   */
  header: React.ReactNode;
  
  /**
   * Contenido del cuerpo del accordion
   */
  children: React.ReactNode;
  
  /**
   * Clase CSS adicional para el contenedor
   */
  className?: string;
  
  /**
   * Clase CSS para el summary (header)
   */
  summaryClassName?: string;
  
  /**
   * Clase CSS para el details (contenido)
   */
  detailsClassName?: string;
  
  /**
   * Icono personalizado para expandir (por defecto faChevronDown)
   */
  expandIcon?: React.ReactNode;
  
  /**
   * Props adicionales para AccordionSummary
   */
  summaryProps?: Omit<AccordionSummaryProps, 'expandIcon' | 'children'>;
  
  /**
   * Props adicionales para AccordionDetails
   */
  detailsProps?: Omit<AccordionDetailsProps, 'children'>;
}

/**
 * Componente BiaAccordion
 * 
 * Componente wrapper para Accordion de Material-UI que proporciona
 * estilos consistentes y configuración por defecto para la aplicación.
 * 
 * @example
 * ```tsx
 * <BiaAccordion header="Sección 1">
 *   <p>Contenido de la sección</p>
 * </BiaAccordion>
 * ```
 * 
 * @example
 * ```tsx
 * <BiaAccordion 
 *   header="Sección expandida por defecto"
 *   defaultExpanded
 * >
 *   <p>Contenido visible inicialmente</p>
 * </BiaAccordion>
 * ```
 */
const BiaAccordion: React.FC<BiaAccordionProps> = ({
  header,
  children,
  className = '',
  summaryClassName = '',
  detailsClassName = '',
  expandIcon,
  summaryProps,
  detailsProps,
  ...rest
}) => {
  const defaultExpandIcon = expandIcon || (
    <BiaIcon 
      iconName="faChevronDown" 
      iconType="solid" 
      size="14px"
      className={styles.expandIcon}
    />
  );

  return (
    <Accordion
      className={`${styles.biaAccordion} ${className}`}
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0 !important',
        boxShadow: 'none !important',
        margin: '0 !important',
        borderBottom: '1px solid #E5E7EB',
        '&::before': {
          display: 'none',
        },
        '&.Mui-expanded': {
          margin: '0 !important',
          borderBottom: '1px solid #E5E7EB',
        },
        ...rest.sx,
      }}
      {...rest}
    >
      <AccordionSummary
        expandIcon={defaultExpandIcon}
        className={`${styles.summary} ${summaryClassName}`}
        sx={{
          minHeight: '48px !important',
          padding: '0 16px',
          backgroundColor: '#FFFFFF',
          borderBottom: '2px solid transparent',
          '&.Mui-expanded': {
            minHeight: '48px !important',
            borderBottom: '2px solid #5C68E2',
          },
          '& .MuiAccordionSummary-content': {
            margin: '12px 0 !important',
            fontSize: '14px',
            fontWeight: 600,
            color: '#363849',
            letterSpacing: '0.5px',
            '&.Mui-expanded': {
              margin: '12px 0 !important',
            },
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            color: '#6B7280',
            transition: 'transform 0.2s ease',
            '&.Mui-expanded': {
              transform: 'rotate(180deg)',
            },
          },
        }}
        {...summaryProps}
      >
        {header}
      </AccordionSummary>
      <AccordionDetails
        className={`${styles.details} ${detailsClassName}`}
        sx={{
          padding: '16px',
          fontSize: '14px',
          color: '#4B5563',
          borderTop: '1px solid #F3F4F6',
          backgroundColor: '#FFFFFF',
        }}
        {...detailsProps}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

export default BiaAccordion;
