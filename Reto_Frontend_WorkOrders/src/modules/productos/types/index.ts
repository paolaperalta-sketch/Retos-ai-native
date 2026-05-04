export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  stock: number;
  categoria_id: number | null;
  created_at: string;
}

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  precio: string;
  stock: number;
  categoria_id?: number | null;
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string;
}

export interface ApiError {
  detail: string;
}
