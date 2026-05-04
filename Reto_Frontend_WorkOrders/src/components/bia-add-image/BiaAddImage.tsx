import React from 'react';
import { BiaIcon } from '@components';
import styles from './BiaAddImage.module.scss';

export interface BiaAddImageProps {
  /** Título del campo */
  title?: string;
  /** Si el campo es obligatorio (muestra asterisco rojo) */
  required?: boolean;
  /** Si el campo es editable (habilita botón y eliminar) */
  editable?: boolean;
  /** Texto de tipos permitidos (ej. "Tipos permitidos: jpeg, jpg, png, webp.") */
  typeAllowedText?: string;
  /** Texto del botón cuando no hay archivos */
  selectFileText?: string;
  /** Texto del botón cuando ya hay archivos */
  addMoreFilesText?: string;
  /** Ref del input file oculto (RefObject o callback ref) */
  inputRef?: React.Ref<HTMLInputElement | null>;
  /** Al hacer clic en el botón de subir */
  onUploadClick?: () => void;
  /** Al cambiar la selección de archivos */
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** URLs de imágenes existentes (previsualización) */
  existingFiles?: string[];
  /** Archivos recién subidos (para contar; las URLs vienen en filePreviewUrls) */
  uploadedFiles?: File[];
  /** URLs de previsualización de los archivos subidos */
  filePreviewUrls?: string[];
  /** Al eliminar una imagen existente por URL */
  onRemoveExistingFile?: (url: string) => void;
  /** Al eliminar una imagen nueva por índice */
  onRemoveFile?: (index: number) => void;
  /** Clase CSS adicional del contenedor */
  className?: string;
}

const BiaAddImage: React.FC<BiaAddImageProps> = ({
  title,
  required,
  editable = true,
  typeAllowedText,
  selectFileText = 'Seleccionar archivo',
  addMoreFilesText = 'Agregar más archivos',
  inputRef,
  onUploadClick,
  onFileChange,
  existingFiles = [],
  uploadedFiles = [],
  filePreviewUrls = [],
  onRemoveExistingFile,
  onRemoveFile,
  className,
}) => {
  const hasFiles = existingFiles.length > 0 || uploadedFiles.length > 0;

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {title && (
        <p className={styles.label}>
          {required ? <span className={styles.required}>* </span> : null}
          <span className={styles.labelText}>{title}</span>
        </p>
      )}
      {typeAllowedText && (
        <p className={styles.typeAllowed}>{typeAllowedText}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,.jpeg,.jpg,.png,.webp"
        multiple
        className={styles.inputHidden}
        onChange={onFileChange}
      />
      <button
        type="button"
        className={styles.uploadButton}
        onClick={onUploadClick}
        disabled={!editable}
      >
        <BiaIcon iconName="faImage" iconType="solid" size="16px" />
        {hasFiles ? addMoreFilesText : selectFileText}
      </button>
      {existingFiles.length > 0 && (
        <div className={styles.previews}>
          {existingFiles.map((url) => (
            <div key={url} className={styles.previewItem}>
              <img src={url} alt="" className={styles.previewImg} />
              {editable && onRemoveExistingFile && (
                <button
                  type="button"
                  className={styles.previewRemove}
                  onClick={() => onRemoveExistingFile(url)}
                  aria-label="Eliminar"
                >
                  <BiaIcon iconName="faTrash" iconType="solid" size="12px" color="currentColor" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {uploadedFiles.length > 0 && filePreviewUrls.length > 0 && (
        <div className={styles.previews}>
          {filePreviewUrls.map((url, index) => (
            <div key={url} className={styles.previewItem}>
              <img src={url} alt="" className={styles.previewImg} />
              {editable && onRemoveFile && (
                <button
                  type="button"
                  className={styles.previewRemove}
                  onClick={() => onRemoveFile(index)}
                  aria-label="Eliminar"
                >
                  <BiaIcon iconName="faTrash" iconType="solid" size="12px" color="currentColor" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BiaAddImage;
