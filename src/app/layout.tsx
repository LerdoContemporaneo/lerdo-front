/* ==========================
   /app/layout.tsx (CORREGIDO)
   ========================== */

import './globals.css';
import React from 'react';
import Layout from './components/layout';
import { Inter } from 'next/font/google'; // Importar fuente si se desea

// Esto es una metadata opcional y estática para SEO/Head
export const metadata = {
  title: 'Gestión Escolar',
  description: 'Frontend del Sistema de Gestión Escolar',
};

// La fuente es opcional, se puede remover si no la necesitas
const inter = Inter({ subsets: ['latin'] });


// El Root Layout debe retornar <html> y <body>
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Asegúrate de que 'use client' NO esté en este archivo si quieres usar metadata o fuentes
  // Ya que tu Layout.tsx interno usa estado y hooks, lo mantenemos como "Server Component"
  // y envolvemos tu Layout custom.
  return (
    <html lang="es" className={inter.className}>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}