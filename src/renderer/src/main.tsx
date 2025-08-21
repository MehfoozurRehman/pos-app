import './global.css';

import App from './App';
import { StrictMode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
