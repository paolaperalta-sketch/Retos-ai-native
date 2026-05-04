/**
 * Módulo de Componentes
 * 
 * Este archivo centraliza todas las exportaciones de componentes
 * para facilitar su uso en toda la aplicación.
 * 
 * Uso:
 * import { BiaLoading, BiaImage, BiaIcon, RemoteComponent } from './components';
 */

// Componente de carga
export { BiaLoading } from './bia-loading/Loading';

// Componente de imagen con lazy loading
export { default as BiaImage } from './bia-image/BiaImage';

// Componente de iconos
export { BiaIcon } from './bia-icon/bia-icon';
export type { IconProps } from './bia-icon/bia-icon';

// Componente de campo de texto
export { default as BiaTextField } from './bia-text-field/BiaTextField';
export type { BiaTextFieldProps } from './bia-text-field/BiaTextField';

// Componente textarea (autosize)
export { default as BiaTextarea } from './bia-textarea/BiaTextarea';
export type { BiaTextareaProps } from './bia-textarea/BiaTextarea';

// Componente de botón
export { default as BiaButton } from './bia-button/BiaButton';
export type { BiaButtonProps } from './bia-button/BiaButton';

// Componente de alerta
export { default as BiaAlert } from './bia-alert/BiaAlert';
export type { BiaAlertProps } from './bia-alert/BiaAlert';

// Componente visualizador de PDFs
export { default as BiaVisualizer } from './bia-visualizer/BiaVisualizer';
export type { BiaVisualizerProps } from './bia-visualizer/BiaVisualizer';

// componente de snackbar
export { default as BiaSnackbar } from './bia-snackbar/BiaSnackbar';
export type { BiaSnackbarProps } from './bia-snackbar/BiaSnackbar';

// Componente de breadcrumbs
export { default as BiaBreadcrumbs } from './bia-breadcrumbs/BiaBreadcrumbs';
export type { BiaBreadcrumbsProps, BreadcrumbItem } from './bia-breadcrumbs/BiaBreadcrumbs';

// Componente de accordion
export { default as BiaAccordion } from './bia-accordion/BiaAccordion';
export type { BiaAccordionProps } from './bia-accordion/BiaAccordion';

// Componente de dropdown
export { default as BiaDropdown } from './bia-dropdown/BiaDropdown';
export type { BiaDropdownProps, DropdownOption } from './bia-dropdown/BiaDropdown';

// Componente de modal
export { default as BiaModal } from './bia-modal/BiaModal';
export type { BiaModalProps } from './bia-modal/BiaModal';

// Componente de date picker
export { default as BiaDatePickerSimple } from './bia-date-picker/datePickerSimple';
export type { BiaDatePickerSimpleProps } from './bia-date-picker/datePickerSimple';

// Componente de time picker
export { default as BiaTimePicker } from './bia-time-picker/BiaTimePicker';
export type { BiaTimePickerProps } from './bia-time-picker/BiaTimePicker';

// Componente añadir imagen (input file + previsualización)
export { default as BiaAddImage } from './bia-add-image/BiaAddImage';
export type { BiaAddImageProps } from './bia-add-image/BiaAddImage';

// Componente de chip
export { default as BiaChip } from './bia-chip/BiaChip';
export type { BiaChipProps } from './bia-chip/BiaChip';

// Componente de tag
export { default as BiaTag } from './bia-tag/BiaTag';
export type { BiaTagProps } from './bia-tag/BiaTag';