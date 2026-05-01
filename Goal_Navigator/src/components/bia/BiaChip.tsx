import React from 'react';
import { Chip, ChipProps } from '@mui/material';

export interface BiaChipProps extends Omit<ChipProps, 'classes'> {
  className?: string;
}

const BiaChip: React.FC<BiaChipProps> = ({ className, ...props }) => {
  return (
    <Chip
      className={className}
      sx={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: '16px',
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default BiaChip;
