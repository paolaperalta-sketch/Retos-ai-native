import React from 'react';

export interface BiaTagProps {
  label: string;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'purple' | 'disabled';
  className?: string;
  /** When false, renders the label in sentence case (no uppercase / no wide tracking). Defaults to true for backwards compatibility. */
  uppercase?: boolean;
}

const colorStyles: Record<string, string> = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-info-bg text-info-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success-bg text-success-foreground',
  error: 'bg-danger-bg text-danger-foreground',
  warning: 'bg-warning-bg text-warning-foreground',
  info: 'bg-info-bg text-info-foreground',
  purple: 'bg-primary/15 text-primary',
  disabled: 'bg-muted text-muted-foreground',
};

const BiaTag: React.FC<BiaTagProps> = ({ label, color = 'default', className = '', uppercase = true }) => {
  const caseStyles = uppercase ? 'uppercase tracking-wider' : 'tracking-normal';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${caseStyles} ${colorStyles[color] || colorStyles.default} ${className}`}>
      {label}
    </span>
  );
};

export default BiaTag;
