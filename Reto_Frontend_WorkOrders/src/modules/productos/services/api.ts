import { Categoria, CategoriaCreate, Producto, ProductoCreate } from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

// ── Categorias ────────────────────────────────────────────────────────────
export const categoriasService = {
  getAll: () => request<Categoria[]>('/categorias/'),
  getById: (id: number) => request<Categoria>(`/categorias/${id}`),
  create: (data: CategoriaCreate) =>
    request<Categoria>('/categorias/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<CategoriaCreate>) =>
    request<Categoria>(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ mensaje: string }>(`/categorias/${id}`, { method: 'DELETE' }),
};

// ── Productos ─────────────────────────────────────────────────────────────
export const productosService = {
  getAll: () => request<Producto[]>('/productos/'),
  getById: (id: number) => request<Producto>(`/productos/${id}`),
  create: (data: ProductoCreate) =>
    request<Producto>('/productos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<ProductoCreate>) =>
    request<Producto>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ mensaje: string }>(`/productos/${id}`, { method: 'DELETE' }),
};
