import './global.css';

import { RouterProvider, createHashRouter } from 'react-router';

import Analytics from './screens/dashboard/analytics/page';
import Customers from './screens/dashboard/customers/page';
import Dashboard from './screens/dashboard/page';
import Inventory from './screens/dashboard/inventory/page';
import Layout from './screens/dashboard/layout';
import Login from './screens/page';
import NotFound from './screens/not-found/page';
import Orders from './screens/dashboard/orders/page';
import Products from './screens/dashboard/products/page';
import Settings from './screens/dashboard/settings/page';
import { StrictMode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from './components/ui/sonner';
import { createRoot } from 'react-dom/client';

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
