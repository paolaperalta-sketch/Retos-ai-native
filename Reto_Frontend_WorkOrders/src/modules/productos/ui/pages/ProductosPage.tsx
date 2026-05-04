import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Chip, IconButton, Tooltip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, MenuItem,
  Skeleton, Alert, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Add, Search, Delete, Inventory2, Category,
  TrendingUp, Warning,
} from '@mui/icons-material';
import {
  useCategorias, useProductos,
  useCreateProducto, useDeleteProducto,
} from '../../hooks/useProductos';
import { ProductoCreate } from '../../types';
import ProductoForm from '../components/ProductoForm';
import StatCard from '../components/StatCard';

const ProductosPage: React.FC = () => {
  const { data: productos = [], isLoading: loadingP, error: errorP } = useProductos();
  const { data: categorias = [], isLoading: loadingC } = useCategorias();
  const createProducto = useCreateProducto();
  const deleteProducto = useDeleteProducto();

  const [openForm, setOpenForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────
  const totalStock = productos.reduce((s, p) => s + p.stock, 0);
  const sinStock = productos.filter(p => p.stock === 0).length;
  const avgPrice = productos.length
    ? (productos.reduce((s, p) => s + parseFloat(p.precio), 0) / productos.length).toFixed(2)
    : '0.00';

  // ── Filtros ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return productos.filter(p => {
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (p.descripcion ?? '').toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === '' || String(p.categoria_id) === filterCat;
      return matchSearch && matchCat;
    });
  }, [productos, search, filterCat]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const getCatName = (id: number | null) =>
    categorias.find(c => c.id === id)?.nombre ?? '—';

  const stockColor = (s: number) =>
    s === 0 ? 'error' : s < 5 ? 'warning' : 'success';

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCreate = async (data: ProductoCreate) => {
    setFormError(null);
    try {
      await createProducto.mutateAsync(data);
      setOpenForm(false);
    } catch (e: any) {
      setFormError(e.message);
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    deleteProducto.mutate(id);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} letterSpacing={-0.5}>
            Gestión de Productos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Microservicio FastAPI conectado en tiempo real
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<Add />}
          onClick={() => { setFormError(null); setOpenForm(true); }}
          sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
        >
          Nuevo Producto
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="Productos" value={productos.length} icon={<Inventory2 fontSize="inherit" />} color="#3C3489" />
        <StatCard label="Categorías" value={categorias.length} icon={<Category fontSize="inherit" />} color="#0F6E56" />
        <StatCard label="Stock total" value={totalStock} icon={<TrendingUp fontSize="inherit" />} color="#185FA5" />
        <StatCard label="Sin stock" value={sinStock} icon={<Warning fontSize="inherit" />} color={sinStock > 0 ? '#993C1D' : '#0F6E56'} />
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar producto…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Categoría</InputLabel>
          <Select value={filterCat} label="Categoría" onChange={e => setFilterCat(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {categorias.map(c => (
              <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {(search || filterCat) && (
          <Button size="small" onClick={() => { setSearch(''); setFilterCat(''); }}>
            Limpiar filtros
          </Button>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Error */}
      {errorP && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo conectar al backend. Verifica que el microservicio esté corriendo en <code>localhost:8000</code>.
        </Alert>
      )}

      {/* Tabla */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.100', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['#', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Creado', ''].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(loadingP || loadingC) ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {search || filterCat ? 'No hay resultados para ese filtro.' : 'No hay productos aún. ¡Crea el primero!'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ color: 'text.disabled', fontSize: 12 }}>#{p.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight={600} fontSize={14}>{p.nombre}</Typography>
                    {p.descripcion && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                        {p.descripcion}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.categoria_id
                      ? <Chip label={getCatName(p.categoria_id)} size="small" sx={{ bgcolor: '#EEEDFE', color: '#3C3489', fontWeight: 600 }} />
                      : <Typography variant="caption" color="text.disabled">—</Typography>
                    }
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="primary.main">
                      ${parseFloat(p.precio).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.stock}
                      size="small"
                      color={stockColor(p.stock)}
                      variant="outlined"
                      sx={{ fontWeight: 700, minWidth: 40 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(p.created_at).toLocaleDateString('es-CO')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(p.id, p.nombre)}
                        disabled={deleteProducto.isPending}
                        sx={{ color: 'error.main' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Precio promedio footer */}
      {productos.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'right' }}>
          Precio promedio: <strong>${parseFloat(avgPrice).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong>
        </Typography>
      )}

      {/* Modal crear */}
      <ProductoForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleCreate}
        categorias={categorias}
        loading={createProducto.isPending}
        error={formError}
      />
    </Box>
  );
};

export default ProductosPage;
