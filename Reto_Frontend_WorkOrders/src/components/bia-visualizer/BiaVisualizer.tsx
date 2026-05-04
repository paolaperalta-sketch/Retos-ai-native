import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { BiaIcon } from '@components/bia-icon/bia-icon';
import { BiaLoading } from '@components/bia-loading/Loading';
import styles from './BiaVisualizer.module.scss';

// Configurar el worker de PDF.js
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

/**
 * Props del componente BiaVisualizer
 */
export interface BiaVisualizerProps {
  /**
   * URL o archivo del PDF a visualizar
   */
  file: string | File | null;

  /**
   * Ancho del visualizador
   * @default '100%'
   */
  width?: number | string;

  /**
   * Alto del visualizador
   */
  height?: number | string;

  /**
   * Habilitar zoom (botones + y -)
   * @default true
   */
  enableZoom?: boolean;

  /**
   * Callback cuando el documento se carga exitosamente
   */
  onLoadSuccess?: (pdf: pdfjs.PDFDocumentProxy) => void;

  /**
   * Callback cuando hay un error al cargar el documento
   */
  onLoadError?: (error: Error) => void;

  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * Componente BiaVisualizer
 * 
 * Visualizador de PDFs usando react-pdf con controles de navegación
 * 
 * @example
 * ```tsx
 * <BiaVisualizer
 *   file="https://example.com/document.pdf"
 *   width="100%"
 *   height="600px"
 * />
 * ```
 */
const MIN_SCALE = 0.5;
const MAX_SCALE = 100;
const SCALE_STEP = 0.25;

const BiaVisualizer: React.FC<BiaVisualizerProps> = ({
  file,
  width = '100%',
  height, 
  enableZoom = true,
  onLoadSuccess,
  onLoadError,
  className = '',
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const loadingRef = useRef(true);
  
  useEffect(() => {
    if (file) {
      setLoading(true);
      loadingRef.current = true;
    }
  }, [file]);

  const handleDocumentLoadSuccess = (pdf: pdfjs.PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    setError(null);
    if (onLoadSuccess) {
      onLoadSuccess(pdf);
    }
    if (pdf.numPages === 0) {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleFirstPageRenderSuccess = () => {
    if (loadingRef.current) {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleFirstPageRenderError = () => {
    if (loadingRef.current) {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  const handleDocumentLoadError = (error: Error) => {
    setLoading(false);
    setError('Error al cargar el documento PDF');
    console.error('Error loading PDF:', error);
    if (onLoadError) {
      onLoadError(error);
    }
  };

  if (!file) {
    return (
      <div className={`${styles.biaVisualizer} ${className}`}>
        <div className={styles.emptyState}>
          <BiaIcon
            iconName="faFileLines"
            iconType="solid"
            size="48px"
            color="#CECFDB"
          />
          <p className={styles.emptyText}>No hay documento para visualizar</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.biaVisualizer} ${className}`}
      style={{ width, height }}
    >
      {loading && (
        <BiaLoading message="Cargando documento..." variant="section" />
      )}

      {error && (
        <div className={styles.errorState}>
          <BiaIcon
            iconName="faCircleExclamation"
            iconType="solid"
            size="48px"
            color="#FF4242"
          />
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {enableZoom && !loading && !error && (
        <div className={styles.zoomControls}>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))}
            disabled={scale <= MIN_SCALE}
            aria-label="Reducir zoom"
          >
            <BiaIcon iconName="faMinus" iconType="solid" size="14px" color="#5D607E" />
          </button>
          <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className={styles.zoomButton}
            onClick={() => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))}
            disabled={scale >= MAX_SCALE}
            aria-label="Aumentar zoom"
          >
            <BiaIcon iconName="faPlus" iconType="solid" size="14px" color="#5D607E" />
          </button>
        </div>
      )}
      <div className={styles.documentContainer} style={{ display: loading || error ? 'none' : 'block' }}>
        <Document
          file={file}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={<BiaLoading message="Cargando documento..." variant="section" />}
          error=""
          className={styles.document}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className={styles.page}
              onRenderSuccess={index === 0 ? handleFirstPageRenderSuccess : undefined}
              onRenderError={index === 0 ? handleFirstPageRenderError : undefined}
            />
          ))}
        </Document>
      </div>
    </div>
  );
};

export default BiaVisualizer;
