import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BiaIcon } from '@components';
import styles from './BiaDropdown.module.scss';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface BiaDropdownProps {
  options: DropdownOption[];
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  multiple?: boolean;
  placeholder: string;
  selectAllLabel?: string;
  searchable?: boolean;
  className?: string;
  icon?: string;
  minWidthMenu?: string;
  widthInput?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

const BiaDropdown: React.FC<BiaDropdownProps> = ({
  options,
  value,
  onChange,
  multiple = false,
  placeholder,
  selectAllLabel = 'Todos',
  searchable = false,
  className,
  icon,
  minWidthMenu,
  widthInput,
  label,
  required = false,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const MENU_ANIMATION_DURATION_MS = 200;

  const handleCloseMenu = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
  }, [isClosing]);

  // Al terminar la animación de cierre, ocultar el menú
  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, MENU_ANIMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isClosing]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const MENU_MAX_HEIGHT_PX = 320;
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    menuMaxHeight: number;
    openAbove: boolean;
  }>({
    top: 0,
    left: 0,
    width: 0,
    menuMaxHeight: MENU_MAX_HEIGHT_PX,
    openAbove: false,
  });

  // Solo inicializar "Todos" la primera vez que hay opciones; no cuando el usuario deselecciona Todo
  const hadOptionsRef = useRef(false);

  // Función para normalizar valores eliminando tildes y caracteres especiales
  const normalizeValue = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
      .toLowerCase()
      .trim();
  };

  // Crear un mapa de valores normalizados a valores originales de las opciones
  const normalizedToOriginalMap = new Map<string, string>();
  options.forEach((opt) => {
    const normalized = normalizeValue(opt.value);
    if (!normalizedToOriginalMap.has(normalized)) {
      normalizedToOriginalMap.set(normalized, opt.value);
    }
  });

  // Función helper para encontrar el valor original de una opción basado en un valor normalizado
  const findOriginalValue = (inputValue: string): string | null => {
    const normalized = normalizeValue(inputValue);
    return normalizedToOriginalMap.get(normalized) || null;
  };

  // Función helper para verificar si un valor está en el array de seleccionados (comparación normalizada)
  const isValueSelected = (val: string, selectedArray: string[]): boolean => {
    if (val === '__all__') return selectedArray.includes('__all__');
    const normalizedVal = normalizeValue(val);
    return selectedArray.some((selectedVal) => {
      if (selectedVal === '__all__') return false;
      return normalizeValue(selectedVal) === normalizedVal;
    });
  };

  // Calcular posición del menú (viewport: fixed no usa scrollY/scrollX)
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const openAbove = spaceAbove > spaceBelow;
      const menuMaxHeight = openAbove
        ? Math.min(MENU_MAX_HEIGHT_PX, spaceAbove)
        : Math.min(MENU_MAX_HEIGHT_PX, spaceBelow);
      setMenuPosition({
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4, top: undefined }
          : { top: rect.bottom + 4, bottom: undefined }),
        left: rect.left,
        width: rect.width,
        menuMaxHeight: Math.max(120, menuMaxHeight),
        openAbove,
      });
    }
  }, [open]);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        handleCloseMenu();
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, handleCloseMenu]);

  // Cierra el dropdown al detectar scroll fuera del menú
  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (open && menuRef.current) {
        // No cerrar si el scroll es dentro del menú
        if (menuRef.current.contains(e.target as Node)) {
          return;
        }
        handleCloseMenu();
      }
    };
    if (open) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, handleCloseMenu]);

  // Normaliza el valor a array y convierte valores a sus equivalentes originales de las opciones
  const rawSelected = Array.isArray(value) ? value : value ? [value] : [];
  const selected = rawSelected.map((val) => {
    if (val === '__all__') return '__all__';
    const originalValue = findOriginalValue(val);
    return originalValue || val; // Si no se encuentra, mantener el valor original
  });

  // Agrega la opción "Todos" solo si multiple es true
  const allOption: DropdownOption = { label: selectAllLabel, value: '__all__' };
  const allOptions = multiple ? [allOption, ...options] : options;

  // Filtra opciones por búsqueda
  const filteredOptions = allOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Separa opciones seleccionadas y no seleccionadas usando comparación normalizada
  let selectedOptions = filteredOptions.filter((opt) =>
    isValueSelected(opt.value, selected)
  );
  let unselectedOptions = filteredOptions.filter(
    (opt) => !isValueSelected(opt.value, selected)
  );

  // Ordena para que "Todos" sea primero en su sección
  selectedOptions = selectedOptions.sort((a, b) =>
    a.value === '__all__' ? -1 : b.value === '__all__' ? 1 : 0
  );
  unselectedOptions = unselectedOptions.sort((a, b) =>
    a.value === '__all__' ? -1 : b.value === '__all__' ? 1 : 0
  );

  // Inicializa con todas seleccionadas solo la primera vez que hay opciones (no cuando el usuario deselecciona "Todos")
  useEffect(() => {
    if (multiple && options.length > 0) {
      if (!hadOptionsRef.current && selected.length === 0) {
        hadOptionsRef.current = true;
        onChange(['__all__', ...options.map((opt) => opt.value)]);
      } else if (!hadOptionsRef.current) {
        hadOptionsRef.current = true;
      }
    } else {
      hadOptionsRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange y options como referencia omitidos: solo inicializamos cuando multiple/options.length/selected.length cambian; incluir onChange podría causar bucles si el padre no usa useCallback
  }, [multiple, options.length, selected.length]);

  // Maneja selección
  const handleSelect = (val: string) => {
    if (multiple) {
      const allValues = options.map((opt) => opt.value);
      if (val === '__all__') {
        if (selected.includes('__all__')) {
          // Desmarcar todo
          onChange([]);
        } else {
          // Marcar todo
          onChange(['__all__', ...allValues]);
        }
      } else {
        if (selected.includes('__all__')) {
          // Si "Todas" está seleccionada y deseleccionas una, solo quita esa y '__all__'
          const normalizedVal = normalizeValue(val);
          const newSelected = allValues.filter(
            (v) => normalizeValue(v) !== normalizedVal
          );
          onChange(newSelected);
        } else {
          let newSelected = selected;
          if (isValueSelected(val, selected)) {
            // Desmarcar la opción usando comparación normalizada
            const normalizedVal = normalizeValue(val);
            newSelected = selected.filter((v) => {
              if (v === '__all__') return true;
              return normalizeValue(v) !== normalizedVal;
            });
          } else {
            // Marcar la opción
            newSelected = [...selected, val];
          }
          // Si no queda ninguna seleccionada, limpiar todo
          if (newSelected.length === 0) {
            onChange([]);
            return;
          }
          // Si todas las individuales quedan seleccionadas, agregar '__all__'
          const nowAllSelected = allValues.every((v) =>
            isValueSelected(v, newSelected)
          );
          if (nowAllSelected) {
            onChange(['__all__', ...allValues]);
          } else {
            onChange(newSelected);
          }
        }
      }
    } else {
      onChange(val);
      handleCloseMenu();
    }
  };

  const renderValue = () => {
    if (!selected.length) return placeholder;
    if (
      multiple &&
      selected.includes('__all__') &&
      selected.length === allOptions.length
    ) {
      return allOption.label;
    }
    const first = allOptions.find((o) => isValueSelected(o.value, selected));
    if (!first) return placeholder;
    if (multiple && selected.length > 1) {
      return `${first.label} (+${selected.length - 1})`;
    }
    return first.label;
  };

  const isChecked = (optValue: string) => {
    if (selected.includes('__all__')) {
      // Si "Todos" está seleccionado, todos los checks deben estar activos
      return true;
    }
    return isValueSelected(optValue, selected);
  };

  return (
    <>
      <div
        style={{ width: widthInput || '' }}
        className={`${styles.dropdownContainer} ${className || ''}`}
        ref={ref}
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
        <button
          ref={buttonRef}
          className={`${styles.input} ${open ? styles.inputActive : ''}`}
          onClick={() => !disabled && (open ? handleCloseMenu() : setOpen(true))}
          type='button'
          disabled={disabled}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && (
              <BiaIcon
                iconName={icon}
                iconType='solid'
                size='12px'
                color='#6d7193'
              />
            )}
            <span
              className={
                selected.length ? styles.inputValue : styles.inputPlaceholder
              }
            >
              {renderValue()}
            </span>
          </div>
          <BiaIcon
            iconName='faChevronDown'
            iconType='solid'
            size='12px'
            color='#6d7193'
          />
        </button>
      </div>
      {(open || isClosing) &&
        createPortal(
          <div
            ref={menuRef}
            className={`${styles.dropdownMenu} ${isClosing ? styles.dropdownMenuClosing : ''} ${menuPosition.openAbove ? styles.dropdownMenuAbove : ''}`}
            style={{
              position: 'fixed',
              ...(menuPosition.top != null ? { top: `${menuPosition.top}px` } : { bottom: `${menuPosition.bottom}px` }),
              left: `${menuPosition.left}px`,
              width: minWidthMenu || `${menuPosition.width}px`,
              maxHeight: `${menuPosition.menuMaxHeight}px`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {searchable && (
              <div className={styles.searchBox}>
                <BiaIcon
                  iconName='faSearch'
                  iconType='regular'
                  size='12px'
                  color='#6d7193'
                />
                <input
                  className={styles.searchInput}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Buscar...'
                />
                {search && (
                  <button
                    type='button'
                    className={styles.clearSearchBtn}
                    onClick={() => setSearch('')}
                    aria-label='Limpiar búsqueda'
                  >
                    <BiaIcon
                      iconName='faXmark'
                      iconType='solid'
                      size='10px'
                      color='#ffffff'
                    />
                  </button>
                )}
              </div>
            )}
            <div className={styles.optionsList}>
              {selectedOptions.length > 0 && (
                <div className={styles.selectedSection}>
                  {selectedOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.option} ${!multiple && styles.singleOption} ${isChecked(opt.value) ? styles.activeOption : ''} ${opt.disabled ? styles.disabledOption : ''}`}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      disabled={opt.disabled}
                    >
                      <span className={styles.checkCircle}>
                        {multiple ? (
                          isChecked(opt.value) ? (
                            <BiaIcon
                              iconName='faSquareCheck'
                              iconType='solid'
                              color='#472bef'
                              size='18px'
                            />
                          ) : (
                            <BiaIcon
                              iconName='faSquare'
                              iconType='regular'
                              color='#6d7193'
                              size='18px'
                            />
                          )
                        ) : isChecked(opt.value) ? (
                          <BiaIcon
                            iconName='faCircleDot'
                            iconType='regular'
                            color='#472bef'
                            size='20px'
                          />
                        ) : (
                          <BiaIcon
                            iconName='faCircle'
                            iconType='regular'
                            color='#6d7193'
                            size='20px'
                          />
                        )}
                      </span>
                      <span className={styles.optionLabel}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedOptions.length > 0 && unselectedOptions.length > 0 && (
                <div className={styles.divider} />
              )}
              {unselectedOptions.length > 0 && (
                <div className={styles.unselectedSection}>
                  {unselectedOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.option} ${!multiple && styles.singleOption} ${opt.disabled ? styles.disabledOption : ''}`}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      disabled={opt.disabled}
                    >
                      <span className={styles.checkCircle}>
                        {multiple ? (
                          isChecked(opt.value) ? (
                            <BiaIcon
                              iconName='faSquareCheck'
                              iconType='solid'
                              color='#472bef'
                              size='18px'
                            />
                          ) : (
                            <BiaIcon
                              iconName='faSquare'
                              iconType='regular'
                              color='#6d7193'
                              size='18px'
                            />
                          )
                        ) : isChecked(opt.value) ? (
                          <BiaIcon
                            iconName='faCircleDot'
                            iconType='solid'
                            color='#472bef'
                            size='20px'
                          />
                        ) : (
                          <BiaIcon
                            iconName='faCircle'
                            iconType='regular'
                            color='#6d7193'
                            size='20px'
                          />
                        )}
                      </span>
                      <span className={styles.optionLabel}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {!filteredOptions.length && (
                <div className={styles.noOptions}>Sin opciones</div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default BiaDropdown;