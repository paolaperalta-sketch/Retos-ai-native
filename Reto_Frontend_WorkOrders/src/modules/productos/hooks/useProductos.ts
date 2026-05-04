import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriasService, productosService } from '../services/api';
import { CategoriaCreate, ProductoCreate } from '../types';

// ── Query Keys ────────────────────────────────────────────────────────────
export const KEYS = {
  categorias: ['categorias'] as const,
  productos: ['productos'] as const,
};

// ── Categorias ────────────────────────────────────────────────────────────
export const useCategorias = () =>
  useQuery({ queryKey: KEYS.categorias, queryFn: categoriasService.getAll });

export const useCreateCategoria = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoriaCreate) => categoriasService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.categorias }),
  });
};

export const useDeleteCategoria = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriasService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.categorias });
      qc.invalidateQueries({ queryKey: KEYS.productos });
    },
  });
};

// ── Productos ─────────────────────────────────────────────────────────────
export const useProductos = () =>
  useQuery({ queryKey: KEYS.productos, queryFn: productosService.getAll });

export const useCreateProducto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductoCreate) => productosService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.productos }),
  });
};

export const useDeleteProducto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productosService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.productos }),
  });
};
