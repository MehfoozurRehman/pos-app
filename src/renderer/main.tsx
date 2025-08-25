import './global.css';

import { RouterProvider, createHashRouter } from 'react-router';
import { StrictMode, lazy } from 'react';

import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from './components/ui/sonner';
import { createRoot } from 'react-dom/client';

const Customers = lazy(() => import('./screens/dashboard/customers/page'));
const Dashboard = lazy(() => import('./screens/dashboard/page'));
const Inventory = lazy(() => import('./screens/dashboard/inventory/page'));
const Layout = lazy(() => import('./screens/dashboard/layout'));
const Login = lazy(() => import('./screens/page'));
const NotFound = lazy(() => import('./screens/not-found/page'));
const Orders = lazy(() => import('./screens/dashboard/orders/page'));
const Products = lazy(() => import('./screens/dashboard/products/page'));
const Settings = lazy(() => import('./screens/dashboard/settings/page'));
const Analytics = lazy(() => import('./screens/dashboard/analytics/page'));

const router = createHashRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <Layout />,
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'orders',
        element: <Orders />,
      },
      {
        path: 'inventory',
        element: <Inventory />,
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Toaster />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
