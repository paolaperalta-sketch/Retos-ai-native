import React from 'react';
import BiaImage from '@components/bia-image/BiaImage';
import styles from './Loading.module.scss';

interface BiaLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  color?: 'inverse' | 'accent';
  variant?: 'fullscreen' | 'section';
}

export const BiaLoading: React.FC<BiaLoaderProps> = ({
  message,
  className,
  variant = 'fullscreen',
}) => {
  const overlayClass = variant === 'fullscreen' ? styles.overlayFullscreen : styles.overlaySection;
  const loaderClass = variant === 'fullscreen' ? styles.loaderPageFullscreen : styles.loaderPageSection;

  return (
    <div className={`${overlayClass} ${className ? className : ''}`}>
      <div className={loaderClass}>
        {message && (
          <div className={styles.textWrapper}>
            <p>{message}</p>
          </div>
        )}
        <BiaImage
          src='/assets/images/git-loader.gif'
          alt='Cargando...'
          className={styles.gifLoader}
          width='48px'
          height='48px'
          effect='opacity'
        />
      </div>
    </div>
  );
};
