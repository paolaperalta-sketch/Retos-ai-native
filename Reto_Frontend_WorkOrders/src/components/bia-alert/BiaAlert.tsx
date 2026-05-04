import React, { useState } from 'react';
import { Alert, AlertProps, AlertTitle } from '@mui/material';
import styles from './BiaAlert.module.scss';

/**
 * Props del componente BiaAlert
 * Extiende las props de Alert de Material-UI para mantener compatibilidad completa
 */
export interface BiaAlertProps extends AlertProps {
    /**
     * Severidad del alert
     * @default 'info'
     */
    severity?: 'error' | 'info' | 'success' | 'warning';

    /**
     * Variante del alert
     * @default 'standard'
     */
    variant?: 'filled' | 'outlined' | 'standard';

    /**
     * Tipo de posicionamiento del alert
     * - 'fixed': Alert fijo en el flujo del documento
     * - 'floating': Alert flotante con posición fija en la pantalla
     * @default 'fixed'
     */
    type?: 'fixed' | 'floating';

    /**
     * Posición del alert cuando es flotante
     * - 'top-left': Esquina superior izquierda
     * - 'top-center': Centro superior
     * - 'top-right': Esquina superior derecha (por defecto)
     * - 'bottom-left': Esquina inferior izquierda
     * - 'bottom-center': Centro inferior
     * - 'bottom-right': Esquina inferior derecha
     * @default 'top-right'
     */
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

    /**
     * Título del alert (opcional)
     */
    title?: string;

    /**
     * Descripción o mensaje del alert
     */
    description?: string;

    /**
     * Indica si el alert está en estado de salida (para animación)
     */
    isExiting?: boolean;

    /**
     * Clase CSS adicional
     */
    className?: string;
}

/**
 * Componente BiaAlert
 * 
 * Componente wrapper para Alert de Material-UI que proporciona
 * estilos consistentes y configuración por defecto para la aplicación.
 * 
 * @example
 * ```tsx
 * <BiaAlert
 *   severity="error"
 *   variant="filled"
 *   title="Error"
 *   description="Este es un mensaje de error"
 *   onClose={() => handleClose()}
 * />
 * ```
 */
const BiaAlert: React.FC<BiaAlertProps> = ({
    severity = 'info',
    variant = 'standard',
    type = 'fixed',
    position = 'top-right',
    title,
    description,
    isExiting = false,
    className = '',
    children,
    onClose,
    ...rest
}) => {
    const [isClosing, setIsClosing] = useState(false);
    const typeClass = type === 'floating' ? styles.biaAlertFloating : styles.biaAlertFixed;

    // Convertir posición a nombre de clase CSS (ej: 'top-left' -> 'biaAlertPositionTopLeft')
    const getPositionClass = () => {
        if (type !== 'floating') return '';
        const positionMap: Record<string, string> = {
            'top-left': 'biaAlertPositionTopLeft',
            'top-center': 'biaAlertPositionTopCenter',
            'top-right': 'biaAlertPositionTopRight',
            'bottom-left': 'biaAlertPositionBottomLeft',
            'bottom-center': 'biaAlertPositionBottomCenter',
            'bottom-right': 'biaAlertPositionBottomRight',
        };
        return styles[positionMap[position]] || '';
    };

    const positionClass = getPositionClass();
    const exitingClass = (isExiting || isClosing) ? styles.biaAlertExiting : '';

    // Manejar el cierre con animación
    const handleClose = (event: React.SyntheticEvent) => {
        setIsClosing(true);
        // Esperar a que termine la animación antes de llamar onClose
        setTimeout(() => {
            if (onClose) {
                onClose(event);
            }
        }, 150); // Duración de la animación de salida
    };

    return (
        <Alert
            severity={severity}
            variant={variant}
            className={`${styles.biaAlert} ${typeClass} ${positionClass} ${exitingClass} ${className}`}
            classes={{
                message: styles.biaAlertDescription,
            }}
            onClose={onClose ? handleClose : undefined}
            {...rest}
        >
            {title && <AlertTitle className={styles.biaAlertTitle}>{title}</AlertTitle>}
            {description || children}
        </Alert>
    );
};

export default BiaAlert;

