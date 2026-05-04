import React, { useEffect, useState, useRef } from 'react';
import { Chip, ChipProps } from '@mui/material';
import styles from './BiaChip.module.scss';

export interface BiaChipProps extends Omit<ChipProps, 'classes'> {
    /**
     * Clase CSS personalizada adicional
     */
    className?: string;
    /**
     * Habilitar animación cuando cambie el label
     */
    animate?: boolean;
}

/**
 * Componente BiaChip
 * 
 * Wrapper del componente Chip de Material-UI con estilos personalizados
 */
const BiaChip: React.FC<BiaChipProps> = ({ 
    className,
    animate = false,
    label,
    ...props 
}) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const prevLabelRef = useRef(label);

    useEffect(() => {
        // Si está habilitada la animación y el label cambió
        if (animate && prevLabelRef.current !== label && prevLabelRef.current !== undefined) {
            setIsAnimating(true);
            
            // Remover la clase de animación después de que termine
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, 500); // Duración de la animación

            return () => clearTimeout(timer);
        }
        
        prevLabelRef.current = label;
    }, [label, animate]);

    return (
        <Chip
            className={`${styles.biaChip} ${isAnimating ? styles.animate : ''} ${className || ''}`}
            label={label}
            {...props}
        />
    );
};

export default BiaChip;
