import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '@mui/material';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { BiaIcon } from '@components';
import 'react-day-picker/dist/style.css';
import styles from './datePickerSimple.module.scss';

export interface BiaDatePickerSimpleProps {
  /**
   * Label del campo
   */
  label?: string;
  /**
   * Valor de la fecha en formato ISO (YYYY-MM-DD)
   */
  value?: string;
  /**
   * Callback cuando cambia la fecha
   */
  onDateChange?: (date: string) => void;
  /**
   * Si el campo es requerido
   */
  required?: boolean;
  /**
   * Si el campo está deshabilitado
   */
  disabled?: boolean;
  /**
   * Clase CSS adicional
   */
  className?: string;
}

const BiaDatePickerSimple = React.forwardRef<
  HTMLDivElement,
  BiaDatePickerSimpleProps
>(({ label, value, onDateChange, required, disabled, className }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [calendarPosition, setCalendarPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    openAbove: boolean;
  }>({ left: 0, openAbove: false });

  const handleClose = useCallback(() => {
    if (!isOpen || isClosing) return;
    setIsClosing(true);
  }, [isOpen, isClosing]);

  useEffect(() => {
    if (!isClosing) return;
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, [isClosing]);

  // Calcular posición del calendario (viewport: fixed no usa scrollY/scrollX)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openAbove = spaceAbove > spaceBelow;
      setCalendarPosition({
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4, top: undefined }
          : { top: rect.bottom + 4, bottom: undefined }),
        left: rect.left,
        openAbove,
      });
    }
  }, [isOpen]);

  // Detectar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isClosing, handleClose]);

  // Cerrar el calendario al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) handleClose();
    };
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, isClosing, handleClose]);

  // Convertir el valor ISO a Date con validación
  const parseDate = (dateString: string | undefined): Date | undefined => {
    if (!dateString || dateString.trim() === '') {
      return undefined;
    }

    try {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      return isValid(parsedDate) ? parsedDate : undefined;
    } catch (error) {
      console.error('Error parsing date:', error);
      return undefined;
    }
  };

  const selectedDate = parseDate(value);

  const handleDaySelect = (date: Date | undefined) => {
    if (date && onDateChange) {
      const isoDate = format(date, 'yyyy-MM-dd');
      onDateChange(isoDate);
    }
    handleClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDateChange) {
      onDateChange('');
    }
  };

  const today = new Date();

  const modifiers = {
    today,
  };

  const modifiersClassNames = {
    today: styles.today,
  };

  // Formatear la fecha para mostrar en el botón
  const displayDate =
    selectedDate && isValid(selectedDate)
      ? format(selectedDate, 'dd-MM-yyyy')
      : 'Seleccionar fecha';
  return (
    <>
      <div
        className={`${styles.container} ${className || ''}`}
        ref={(node) => {
          (
            containerRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
          }
        }}
      >
        {label && (
          <p
            className={styles.labelText}
          >
            {`${required ? '* ' : ''}`}
            <span
              className={styles.label}
            >
              {label}
            </span>
          </p>
        )}
        <div className={styles.buttonWrapper}>
          <button
            ref={buttonRef}
            type='button'
            className={styles.dateButton}
            onClick={() => {
              if (disabled) return;
              if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
              setIsClosing(false);
              setIsOpen((prev) => !prev);
            }}
            disabled={disabled}
          >
            {displayDate}
          </button>
          {selectedDate && !disabled && (
            <IconButton
              type='button'
              size='small'
              className={styles.clearButton}
              onClick={handleClear}
              aria-label='Limpiar fecha'
            >
              <BiaIcon
                iconName='faCircleXmark'
                iconType='solid'
                size='16px'
                color='#5D607E'
              />
            </IconButton>
          )}
        </div>
      </div>
      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={calendarRef}
            className={`${styles.calendarContainer} ${isClosing ? styles.calendarContainerClosing : ''}`}
            style={{
              position: 'fixed',
              ...(calendarPosition.top != null ? { top: `${calendarPosition.top}px` } : {}),
              ...(calendarPosition.bottom != null ? { bottom: `${calendarPosition.bottom}px` } : {}),
              left: `${calendarPosition.left}px`,
            }}
          >
            <DayPicker
              mode='single'
              selected={selectedDate}
              onSelect={handleDaySelect}
              captionLayout='dropdown-buttons'
              fromYear={2000}
              toYear={(new Date().getFullYear() + 20) as number}
              locale={es}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              showOutsideDays
            />
          </div>,
          document.body
        )}
    </>
  );
});

export default BiaDatePickerSimple;