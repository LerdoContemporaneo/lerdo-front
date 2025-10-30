'use client'
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth'; // Necesitas el hook de auth para el botón de logout
import Button from './ui/Button';

// Este componente incluye el Navbar y la estructura principal
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth(); // Usamos el hook de auth

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Control CELC</h1>
            <span className="text-sm text-gray-500">
              {user ? `Bienvenido, ${user.username} (${user.role})` : 'Cargando...'}
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm">Dashboard</Link>
            <Link href="/admin" className="text-sm">Administración</Link>
            <Link href="/teachers" className="text-sm">Maestros</Link>
            {user && (
              <Button onClick={logout} variant="ghost">Salir</Button> // Botón de Logout
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}