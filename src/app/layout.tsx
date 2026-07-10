/* ==========================
   /app/layout.tsx (VERSIÓN CORREGIDA y con PWA iOS)
   ========================== */

import './globals.css';
import React from 'react';
import { AuthProvider } from './context/AuthContext';

// Metadatos centrales del sitio (Next.js los inyectará en el <head> de forma nativa)
export const metadata = {
  title: 'Mapi Portal',
  description: 'Portal CELC',
  manifest: '/manifest.json', // El archivo de identidad de la PWA
  
  // Aquí metemos la magia para Apple/iOS:
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lerdo App',
  },
};

// El RootLayout se queda como un Server Component limpio
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Aquí agregamos manualmente la etiqueta del icono de Apple que Next.js pide poner en el head */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        {/* AuthProvider debe envolver todo el contenido */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
