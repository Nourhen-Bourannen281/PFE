import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import './css/style.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" richColors closeButton duration={4000} />
  </React.StrictMode>
);