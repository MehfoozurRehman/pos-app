import './global.css';

import { RouterProvider, createHashRouter } from 'react-router';

import Dashboard from './screens/dashboard/page';
import Layout from './screens/dashboard/layout';
import Login from './screens/page';
import { StrictMode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
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
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
