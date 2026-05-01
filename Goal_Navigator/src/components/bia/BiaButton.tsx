import React from 'react';
import { Button, ButtonProps } from '@mui/material';

export interface BiaButtonProps extends ButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  className?: string;
  isLoading?: boolean;
  loadingText?: string;
}

const BiaButton: React.FC<BiaButtonProps> = ({
  variant = 'contained',
  className = '',
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...rest
}) => {
  return (
    <Button
      variant={variant}
      className={className}
      disabled={disabled || isLoading}
      sx={{
        borderRadius: '16px',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem',
        textTransform: 'none',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        boxShadow: 'none',
        '&.MuiButton-contained': {
          backgroundColor: 'var(--background-accent)',
          color: 'var(--ink-inverse)',
          '&:hover': {
            backgroundColor: 'var(--background-accent)',
            opacity: 0.9,
            boxShadow: '0 4px 12px rgba(71, 43, 239, 0.3)',
          },
        },
        '&.MuiButton-outlined': {
          borderColor: 'var(--border-standard)',
          color: 'var(--ink-standard)',
          '&:hover': {
            borderColor: 'var(--background-accent)',
            backgroundColor: 'rgba(71, 43, 239, 0.04)',
          },
        },
        '&.Mui-disabled': {
          opacity: 0.6,
          cursor: 'not-allowed',
          pointerEvents: 'auto',
        },
        ...rest.sx,
      }}
      {...rest}
    >
      {isLoading && loadingText ? loadingText : children}
    </Button>
  );
};

export default BiaButton;
