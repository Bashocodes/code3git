import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthContextProvider } from './context/AuthContext.tsx'; // Import AuthContextProvider

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthContextProvider> {/* Wrap App with AuthContextProvider */}
      <App />
    </AuthContextProvider>
  </StrictMode>
);