'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth'; 
import Button from './ui/Button';
import Image from 'next/image';
import { usePathname } from 'next/navigation'; // Para saber en qué página estamos

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth(); 
  const pathname = usePathname();
  
  // Estado para el menú hamburguesa en celulares
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 👇 LISTA INTELIGENTE DE RUTAS POR ROLES 👇
  const allNavLinks = [
    { name: 'Dashboard', href: '/', roles: ['administrador', 'maestro', 'alumno'] },
    { name: 'Administración', href: '/admin', roles: ['administrador'] },
    { name: 'Maestros', href: '/teachers', roles: ['administrador'] },
    { name: 'Mi Grupo', href: '/teachers', roles: ['maestro'] },
    { name: 'Alumnos', href: '/alumnos', roles: ['administrador', 'maestro'] },
    { name: 'Tareas', href: '/tareas', roles: ['administrador', 'maestro', 'alumno'] },
    { name: 'Reportes', href: '/reportes', roles: ['administrador', 'maestro'] },
  ];

  // Filtramos los enlaces para mostrar SOLO los que el usuario tiene permiso de ver
  const allowedLinks = allNavLinks.filter(link => 
    user && link.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-900 shadow-lg text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          
          {/* Lado Izquierdo: Logo y Nombre */}
          <div className="flex items-center gap-3">
            <div className="bg-white text-red-900 p-1.5 rounded-full h-8 w-8 flex items-center justify-center font-bold text-xs shrink-0">
              <Image src="/logo.png" alt="Logo CELC" width={24} height={24} className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight truncate">Control CELC</h1>
              <p className="text-xs text-red-200 capitalize">
                Panel {user?.role || 'Cargando...'}
              </p>
            </div>
          </div>

          {/* Menú de Hamburguesa (Solo en Celulares) */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-red-100 hover:text-white focus:outline-none p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Lado Derecho: Navegación y Usuario (Oculto en Celulares) */}
          <nav className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1 bg-red-800/50 rounded-lg p-1">
                {allowedLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      pathname === link.href ? 'bg-red-700 font-bold' : 'hover:bg-red-700'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
            </div>

            <div className="h-6 w-px bg-red-700 mx-1"></div>

            <div className="flex items-center gap-3">
                {user ? (
                    <div className="text-right">
                        <p className="text-sm font-medium">{user.name}</p>
                    </div>
                ) : (
                    <span className="text-sm">...</span>
                )}

                {user && (
                  <Button 
                    onClick={logout} 
                    className="bg-red-800 hover:bg-red-700 text-white border border-red-700 text-sm px-3 py-1 whitespace-nowrap"
                  >
                    Salir
                  </Button> 
                )}
            </div>
          </nav>
        </div>

        {/* MENÚ DESPLEGABLE MÓVIL */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-red-800 border-t border-red-700 shadow-inner">
            <div className="px-4 py-2 space-y-1">
              {allowedLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  onClick={() => setIsMobileMenuOpen(false)} // Cierra el menú al hacer clic
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    pathname === link.href ? 'bg-red-900 text-white' : 'text-red-100 hover:bg-red-700 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-4 pb-2 border-t border-red-700 mt-2">
                <div className="flex items-center justify-between px-3">
                  <div>
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-red-300 capitalize">{user?.role}</p>
                  </div>
                  <Button 
                    onClick={logout} 
                    className="bg-red-900 hover:bg-red-950 text-white text-sm px-4 py-1"
                  >
                    Salir
                  </Button> 
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Contenido Principal con un pequeño banner de bienvenida opcional */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}