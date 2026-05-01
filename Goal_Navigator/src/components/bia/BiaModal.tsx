import React from 'react';
import { Modal, Fade, Backdrop } from '@mui/material';
import { X } from 'lucide-react';

export interface BiaModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  maxHeight?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
  footerActions?: React.ReactNode[];
}

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
  footerActions,
}) => {
  const handleClose = (_event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick' && !closeOnBackdropClick) return;
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500, sx: { backgroundColor: 'rgba(0,0,0,0.5)' } } }}
      className={className}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Fade in={open}>
        <div
          style={{ width, maxHeight, maxWidth: '95vw' }}
          className="bg-card rounded-xl shadow-xl outline-none flex flex-col overflow-hidden"
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              {title && (
                <div className="flex items-center gap-2.5">
                  {titleIcon}
                  <h2 className="text-sm font-semibold text-foreground m-0">{title}</h2>
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary hover:bg-muted transition-colors border-none cursor-pointer"
                  aria-label="Cerrar modal"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
          <div className="px-5 py-3 overflow-y-auto flex-1">{children}</div>
          {footerActions && footerActions.length > 0 && (
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
              {footerActions.map((action, i) => (
                <React.Fragment key={i}>{action}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      </Fade>
    </Modal>
  );
};

export default BiaModal;
