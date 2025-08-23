import './global.css';

import { RouterProvider, createHashRouter } from 'react-router';
import { StrictMode, lazy } from 'react';

import Login from './screens/page';
import { ThemeProvider } from '@/components/theme-provider';
import { createRoot } from 'react-dom/client';

const Analytics = lazy(() => import('./screens/dashboard/analytics/page'));
const Billing = lazy(() => import('./screens/dashboard/billing/page'));
const Customers = lazy(() => import('./screens/dashboard/customers/page'));
const Help = lazy(() => import('./screens/dashboard/help/page'));
const Inventory = lazy(() => import('./screens/dashboard/inventory/page'));
const Orders = lazy(() => import('./screens/dashboard/orders/page'));
const Settings = lazy(() => import('./screens/dashboard/settings/page'));
const Dashboard = lazy(() => import('./screens/dashboard/page'));
const Layout = lazy(() => import('./screens/dashboard/layout'));
const NotFound = lazy(() => import('./screens/not-found/page'));

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
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'billing',
        element: <Billing />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'help',
        element: <Help />,
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
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
