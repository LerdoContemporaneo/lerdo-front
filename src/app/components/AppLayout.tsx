'use client'
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth'; 
import Button from './ui/Button';
import Image from 'next/image';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth(); 

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR: Cambiado a bg-red-900 para el color institucional */}
      <header className="bg-red-900 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Lado Izquierdo: Logo y Nombre */}
          <div className="flex items-center gap-3">
            {/* Pequeño logo en el header */}
            <div className="bg-white text-red-900 p-1.5 rounded-full h-8 w-8 flex items-center justify-center font-bold text-xs">
              <Image src="/logo.png" alt="Logo CELC" width={24} height={24} className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Control CELC</h1>
              <p className="text-xs text-red-200">Panel Administrativo</p>
            </div>
          </div>

          {/* Lado Derecho: Navegación y Usuario */}
          <nav className="flex items-center gap-4">
            {/* Links de navegación: Efecto hover suave */}
            <div className="hidden md:flex items-center gap-1 bg-red-800/50 rounded-lg p-1">
                <Link href="/" className="px-3 py-1.5 text-sm rounded-md hover:bg-red-700 transition-colors">
                    Dashboard
                </Link>
                <Link href="/admin" className="px-3 py-1.5 text-sm rounded-md hover:bg-red-700 transition-colors">
                    Administración
                </Link>
                <Link href="/teachers" className="px-3 py-1.5 text-sm rounded-md hover:bg-red-700 transition-colors">
                    Maestros
                </Link>
            </div>

            <div className="h-6 w-px bg-red-700 mx-1 hidden md:block"></div>

            <div className="flex items-center gap-3">
                {user ? (
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-red-200 capitalize">{user.role}</p>
                    </div>
                ) : (
                    <span className="text-sm">Cargando...</span>
                )}

                {user && (
                  <Button 
                    onClick={logout} 
                    // Variante custom para el header rojo
                    className="bg-red-800 hover:bg-red-700 text-white border border-red-700 text-sm px-3 py-1"
                  >
                    Salir
                  </Button> 
                )}
            </div>
          </nav>
        </div>
      </header>

      {/* Contenido Principal con un pequeño banner de bienvenida opcional */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}