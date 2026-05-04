import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { Categoria, ProductoCreate } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductoCreate) => void;
  categorias: Categoria[];
  loading: boolean;
  error?: string | null;
}

const EMPTY: ProductoCreate = { nombre: '', descripcion: '', precio: '', stock: 0, categoria_id: null };

const ProductoForm: React.FC<Props> = ({ open, onClose, onSubmit, categorias, loading, error }) => {
  const [form, setForm] = useState<ProductoCreate>(EMPTY);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'stock' ? Number(value) : value }));
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.precio) return;
    onSubmit(form);
    setForm(EMPTY);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Nuevo Producto</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nombre *" name="nombre" value={form.nombre} onChange={handleChange} fullWidth />
        <TextField label="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} fullWidth multiline rows={2} />
        <TextField label="Precio *" name="precio" value={form.precio} onChange={handleChange} type="number" inputProps={{ step: '0.01' }} fullWidth />
        <TextField label="Stock" name="stock" value={form.stock} onChange={handleChange} type="number" fullWidth />
        <TextField select label="Categoría" name="categoria_id" value={form.categoria_id ?? ''} onChange={handleChange} fullWidth>
          <MenuItem value="">Sin categoría</MenuItem>
          {categorias.map(c => (
            <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !form.nombre || !form.precio}
          startIcon={loading ? <CircularProgress size={16} /> : null}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductoForm;
