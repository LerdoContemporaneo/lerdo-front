'use client';
import React from 'react';
import AppLayout from '../../components/AppLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

export default function AdminMePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['administrador']}>
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          
          {/* Tarjeta de Bienvenida del Admin */}
          <div className="bg-gradient-to-r from-red-950 to-red-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
              <span className="text-9xl font-black">CELC</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-white text-red-900 rounded-full flex items-center justify-center font-bold text-2xl shadow-inner">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user?.name || 'Administrador'}</h2>
                  <p className="text-red-200 text-sm font-medium capitalize">Rol: {user?.role}</p>
                </div>
              </div>
              <div className="bg-red-800/50 backdrop-blur-sm px-4 py-2 rounded-xl text-xs border border-red-700 text-red-100">
                Panel de Control Total Activo 🔐
              </div>
            </div>
          </div>

          {/* Información de la Cuenta & Accesos Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Detalles del Perfil */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-1 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Datos de Cuenta</h3>
              <div>
                <label className="text-xs font-bold text-gray-400 block uppercase">Email Institucional</label>
                <p className="text-sm font-medium text-gray-700 break-all">{user?.email || 'No disponible'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block uppercase">Identificador Único (UUID)</label>
                <p className="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 select-all overflow-x-auto">
                  {user?.uuid || 'cargando...'}
                </p>
              </div>
            </div>

            {/* Accesos Rápidos de Administración */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Accesos Directos Globales</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <Link href="/admin" className="p-4 border border-gray-100 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-all flex items-center gap-3 group">
                  <div className="p-2.5 bg-red-50 text-red-900 rounded-lg group-hover:bg-red-900 group-hover:text-white transition-colors">
                    👥
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Gestionar Usuarios</p>
                    <p className="text-xs text-gray-400">Crear maestros y administradores</p>
                  </div>
                </Link>

                <Link href="/alumnos" className="p-4 border border-gray-100 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-all flex items-center gap-3 group">
                  <div className="p-2.5 bg-red-50 text-red-900 rounded-lg group-hover:bg-red-900 group-hover:text-white transition-colors">
                    🎓
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Control de Alumnos</p>
                    <p className="text-xs text-gray-400">Ver matrículas, tutores y grados</p>
                  </div>
                </Link>

                <Link href="/reportes" className="p-4 border border-gray-100 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-all flex items-center gap-3 group">
                  <div className="p-2.5 bg-red-50 text-red-900 rounded-lg group-hover:bg-red-900 group-hover:text-white transition-colors">
                    📝
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Bitácora de Reportes</p>
                    <p className="text-xs text-gray-400">Supervisar incidencias y conductas</p>
                  </div>
                </Link>

                <Link href="/teachers" className="p-4 border border-gray-100 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-all flex items-center gap-3 group">
                  <div className="p-2.5 bg-red-50 text-red-900 rounded-lg group-hover:bg-red-900 group-hover:text-white transition-colors">
                    🍎
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Vista de Maestros</p>
                    <p className="text-xs text-gray-400">Panel de asistencia e impartición</p>
                  </div>
                </Link>

              </div>
            </div>

          </div>

          {/* Tips del Sistema */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 flex gap-2">
            💡 <strong>Nota del sistema:</strong> Como administrador, tienes permisos globales de lectura, escritura y eliminación en todos los módulos de Control CELC. Asegúrate de manejar los datos con cuidado.
          </div>

        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}