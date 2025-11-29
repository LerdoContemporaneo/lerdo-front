/* ==========================
   /app/layout.tsx (VERSIÓN CORREGIDA y con AuthProvider)
   ========================== */

import './globals.css';
import React from 'react';
import Layout from './components/layout';
import { AuthProvider } from './context/AuthContext';
// Importa metadata si la necesitas.

// Metadata es opcional, pero bueno para el Root Layout
export const metadata = {
  title: 'Gestión Escolar',
  description: 'Sistema de Gestión Escolar',
};

// No uses 'use client' en el RootLayout si quieres metadata o si quieres usar Server Components.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* AuthProvider debe envolver todo el contenido */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}