import React from 'react';
import { Modal, ModalProps, Fade, Backdrop } from '@mui/material';
import { BiaIcon } from '@components/index';
import styles from './BiaModal.module.scss';

export interface BiaModalProps extends Omit<ModalProps, 'children'> {
  /**
   * Controla si el modal está abierto
   */
  open: boolean;

  /**
   * Callback cuando se cierra el modal
   */
  onClose: () => void;

  /**
   * Título del modal
   */
  title?: string;

  /**
   * Icono a mostrar junto al título
   */
  titleIcon?: React.ReactNode;

  /**
   * Contenido del modal
   */
  children: React.ReactNode;

  /**
   * Ancho del modal
   * @default '600px'
   */
  width?: string;

  /**
   * Altura máxima del modal
   * @default '90vh'
   */
  maxHeight?: string;

  /**
   * Muestra el botón de cerrar (X)
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Permite cerrar el modal al hacer clic en el backdrop
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Clase CSS personalizada para el contenedor del modal
   */
  className?: string;

  /**
   * Clase CSS personalizada para el contenido del modal
   */
  contentClassName?: string;

  /**
   * Botones de acción para el footer del modal
   * Array de elementos React (típicamente BiaButton)
   */
  footerActions?: React.ReactNode[];

  /**
   * Clase CSS personalizada para el footer del modal
   */
  footerClassName?: string;
}

/**
 * Componente BiaModal
 * 
 * Wrapper del componente Modal de Material-UI con estilos personalizados
 * y funcionalidades adicionales como título y botón de cerrar.
 * 
 * @example
 * ```tsx
 * <BiaModal
 *   open={isOpen}
 *   onClose={handleClose}
 *   title="Título del Modal"
 *   width="800px"
 * >
 *   <p>Contenido del modal</p>
 * </BiaModal>
 * ```
 */
const BiaModal: React.FC<BiaModalProps> = ({
  open,
  onClose,
  title,
  titleIcon,
  children,
  width = '600px',
  maxHeight = '90vh',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className,
  contentClassName,
  footerActions,
  footerClassName,
  ...props
}) => {
  /**
   * Maneja el cierre del modal
   * Solo cierra si closeOnBackdropClick es true cuando se hace click en el backdrop
   */
  const handleClose = (_event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    // Si es click en backdrop y closeOnBackdropClick es false, no hacer nada
    if (reason === 'backdropClick' && closeOnBackdropClick === false) {
      return;
    }
    // En cualquier otro caso, cerrar el modal
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          className: styles.backdrop,
        },
      }}
      className={`${styles.modal} ${className || ''}`}
      {...props}
    >
      <Fade in={open}>
        <div
          className={styles.modalBox}
          style={{
            width,
            maxHeight,
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={styles.modalHeader}>
              {title && (
                <div className={styles.modalTitleWrapper}>
                  {titleIcon}
                  <h2 className={styles.modalTitle}>{title}</h2>
                </div>
              )}
              {showCloseButton && (
                <button
                  className={styles.closeButton}
                  onClick={onClose}
                  aria-label="Cerrar modal"
                >
                  <BiaIcon iconName="faXmark" iconType="solid" size="lg" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={`${styles.modalContent} ${contentClassName || ''}`}>
            {children}
          </div>

          {/* Footer */}
          {footerActions && footerActions.length > 0 && (
            <div className={`${styles.modalFooter} ${footerClassName || ''}`}>
              {footerActions.map((action, index) => (
                <React.Fragment key={index}>{action}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      </Fade>
    </Modal>
  );
};

export default BiaModal;
