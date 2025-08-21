import './global.css';

import { RouterProvider, createHashRouter } from 'react-router';

import Home from './screens/page';
import { StrictMode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { createRoot } from 'react-dom/client';

const router = createHashRouter([
  {
    path: '/',
    element: <Home />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
