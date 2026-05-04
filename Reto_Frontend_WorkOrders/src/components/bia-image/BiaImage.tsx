import React from 'react';
import { LazyLoadImage, LazyLoadImageProps } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import './BiaImage.module.scss';

interface BiaImageProps extends Omit<LazyLoadImageProps, 'src' | 'alt'> {
  /**
   * URL de la imagen a cargar
   */
  src: string;
  
  /**
   * Texto alternativo para la imagen (requerido para accesibilidad)
   */
  alt: string;
  
  /**
   * Ancho de la imagen
   */
  width?: string | number;
  
  /**
   * Alto de la imagen
   */
  height?: string | number;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
  
  /**
   * Efecto a aplicar mientras carga la imagen
   * @default 'blur'
   */
  effect?: 'blur' | 'black-and-white' | 'opacity';
  
  /**
   * Placeholder mientras carga la imagen
   */
  placeholderSrc?: string;
  
  /**
   * Mostrar un spinner mientras carga
   * @default false
   */
  showLoading?: boolean;
}

/**
 * Componente BiaImage
 * 
 * Componente wrapper para LazyLoadImage que proporciona carga diferida de imágenes
 * con efectos visuales y mejor rendimiento.
 * 
 * @example
 * ```tsx
 * <BiaImage
 *   src="/path/to/image.jpg"
 *   alt="Descripción de la imagen"
 *   width={300}
 *   height={200}
 *   effect="blur"
 * />
 * ```
 */
const BiaImage: React.FC<BiaImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  effect = 'blur',
  placeholderSrc,
  showLoading = false,
  ...rest
}) => {
  return (
    <div className={`bia-image ${className}`}>
      {showLoading && (
        <div className="bia-image__loading">
          <div className="bia-image__spinner"></div>
        </div>
      )}
      <LazyLoadImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        effect={effect}
        placeholderSrc={placeholderSrc}
        className="bia-image__img"
        {...rest}
      />
    </div>
  );
};

export default BiaImage;

