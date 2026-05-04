import React, { useState } from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { parse, format, isValid } from 'date-fns';
import { IconButton, InputAdornment } from '@mui/material';
import { BiaIcon } from '@components/bia-icon/bia-icon';
import styles from './BiaTimePicker.module.scss';

export interface BiaTimePickerProps {
  /**
   * Label del campo
   */
  label?: string;
  /**
   * Valor de la hora en formato HH:mm o HH:mm:ss
   */
  value?: string;
  /**
   * Callback cuando cambia la hora
   */
  onTimeChange?: (time: string) => void;
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
  /**
   * Formato de visualización (por defecto 24h)
   */
  ampm?: boolean;
}

const parseTime = (timeString: string | undefined): Date | null => {
  if (!timeString || timeString.trim() === '') {
    return null;
  }
  try {
    const formats = ['HH:mm', 'HH:mm:ss', 'h:mm a', 'h:mm:ss a'];
    for (const fmt of formats) {
      const parsed = parse(timeString, fmt, new Date());
      if (isValid(parsed)) return parsed;
    }
    const parsed = parse(timeString, 'HH:mm', new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const formatTimeOutput = (date: Date | null, useAmPm: boolean): string => {
  if (!date) return '';
  return useAmPm ? format(date, 'hh:mm a') : format(date, 'HH:mm');
};

const BiaTimePicker = React.forwardRef<HTMLDivElement, BiaTimePickerProps>(
  (
    {
      label,
      value,
      onTimeChange,
      required,
      disabled,
      className,
      ampm = false,
    },
    ref
  ) => {
    const dateValue = parseTime(value);
    const [isExiting, setIsExiting] = useState(false);
    const [open, setOpen] = useState(false);
    const hasValue = value !== undefined && value !== null && value !== '';
    const showClear = hasValue && !disabled;
    const showIcon = showClear || isExiting;

    const handleChange = (newDate: Date | null) => {
      if (onTimeChange) {
        onTimeChange(newDate ? formatTimeOutput(newDate, ampm) : '');
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onTimeChange || isExiting) return;
      setIsExiting(true);
      setTimeout(() => {
        onTimeChange('');
        setIsExiting(false);
      }, 150);
    };

    const handleOpen = () => {
      if (!disabled) {
        setOpen(true);
      }
    };

    const handleClose = () => {
      setOpen(false);
    };

    return (
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <div
          className={`${styles.container} ${className ?? ''}`}
          ref={ref}
        >
          {label && (
            <p className={styles.labelText}>
              {`${required ? '* ' : ''}`}
              <span className={styles.label}>{label}</span>
            </p>
          )}
          <TimePicker
            value={dateValue}
            onChange={handleChange}
            disabled={disabled}
            ampm={ampm}
            label={undefined}
            open={open}
            onOpen={handleOpen}
            onClose={handleClose}
            localeText={{
              cancelButtonLabel: 'Cancelar',
              okButtonLabel: 'Aceptar',
            }}
            slots={{
              openPickerIcon: () => null,
            }}
            slotProps={{
              textField: {
                size: 'small',
                required: !!required,
                className: styles.input,
                placeholder: 'Seleccionar hora',
                onClick: handleOpen,
                sx: {
                  '& .MuiOutlinedInput-root': {
                    height: '32px',
                    minHeight: '32px',
                    padding: '8px 14px',
                    border: '1px solid #CECFDB',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 500,
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover:not(.Mui-disabled)': {
                      borderColor: 'var(--background-accent, #472bef)',
                    },
                    '&.Mui-focused': {
                      borderColor: 'var(--background-accent, #472bef)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '0',
                    '&::placeholder': {
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#5D607E',
                      opacity: 1,
                    },
                  },
                },
                InputProps: {
                  endAdornment: showIcon ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClear}
                        edge="end"
                        size="small"
                        className={`${styles['clear-icon-button']} ${isExiting ? styles['clear-icon-button-exiting'] : ''}`}
                        aria-label="Limpiar campo"
                        disabled={isExiting}
                      >
                        <BiaIcon
                          iconName="faCircleXmark"
                          iconType="solid"
                          size="16px"
                          color="#5D607E"
                        />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              },
            }}
          />
        </div>
      </LocalizationProvider>
    );
  }
);

BiaTimePicker.displayName = 'BiaTimePicker';

export default BiaTimePicker;
