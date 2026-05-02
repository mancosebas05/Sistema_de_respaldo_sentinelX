import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ── Modo demo: suprime el overlay rojo de errores de red ──
// El backend no está corriendo; los errores de conexión son
// esperados. Esto evita que interrumpan la presentación.
window.addEventListener('error', (e) => {
  if (e.message?.includes('Error de conexión') ||
      e.message?.includes('Network Error') ||
      e.message?.includes('conexión con el servidor')) {
    e.stopImmediatePropagation();
  }
}, true);
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message || '';
  if (msg.includes('Error de conexión') ||
      msg.includes('Network Error') ||
      msg.includes('conexión con el servidor')) {
    e.preventDefault();
  }
});

// Aplicar tema guardado antes de que React monte (evita flash)
const savedTheme = localStorage.getItem('sentinelx_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);