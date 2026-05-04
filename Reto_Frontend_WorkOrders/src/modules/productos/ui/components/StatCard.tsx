import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<Props> = ({ label, value, icon, color }) => (
  <Paper elevation={0} sx={{
    p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'grey.100',
    display: 'flex', alignItems: 'center', gap: 2,
    transition: 'box-shadow .2s', '&:hover': { boxShadow: 3 }
  }}>
    <Box sx={{
      width: 48, height: 48, borderRadius: 2,
      bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, fontSize: 22,
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" fontWeight={700} lineHeight={1}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);

export default StatCard;
