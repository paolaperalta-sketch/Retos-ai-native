import { BiaLoading } from '@components/bia-loading/Loading';
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const ProductosModule = {
  Productos: lazy(() =>
    import('./modules/productos').then(m => ({ default: m.ProductosPage }))
  ),
};

export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  exact?: boolean;
  name: string;
  description: string;
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: (
      <Suspense fallback={<BiaLoading message="Cargando módulo de Productos..." />}>
        <ProductosModule.Productos />
      </Suspense>
    ),
    name: 'Productos Page',
    description: 'Dashboard de gestión de productos',
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
    name: 'CatchAll',
    description: 'Redirige rutas no encontradas',
  },
];

const AppRouter: React.FC = () => (
  <Routes>
    {routes.map(route => (
      <Route key={route.path} path={route.path} element={route.element} />
    ))}
  </Routes>
);

export default AppRouter;
