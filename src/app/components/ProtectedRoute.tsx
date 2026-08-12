'use client';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '../types/auth';

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: UserRole[] }) {
  // 1. Extrae 'loading' además del usuario
  const { user, loading } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    // 2. Si estamos cargando, NO hacemos nada todavía. Esperamos.
    if (!loading) {
        if (!user) {
            router.push('/login'); // Si cargó y no hay usuario -> Login
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
            router.push('/login'); // Rol incorrecto
        }
    }
  }, [user, loading, router, allowedRoles]);

  // 3. Mientras carga, mostramos una pantalla de espera bonita (Spinner o Logo)
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse text-red-900 font-bold text-xl">
                Cargando Mapi... 🦝
            </div>
        </div>
    );
  }

  // 4. Si ya cargó y no hay usuario, retornamos null para evitar "flicks" antes del redirect
  if (!user) return null; 

  return <>{children}</>;
}
