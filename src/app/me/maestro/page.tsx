'use client';
import React from 'react';
import AppLayout from '../../components/AppLayout';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

export default function MaestroDashboard() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['maestro', 'administrador']}>
      <AppLayout>
        <div className="space-y-8">
          <div className="bg-red-900 text-white p-8 rounded-xl shadow-lg text-center md:text-left">
            <h1 className="text-3xl font-bold">Bienvenido, {user?.name} 🍎</h1>
            <p className="mt-2 text-red-200">¿Qué te gustaría gestionar el día de hoy?</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            
            {/* Tarjeta 1: Tareas */}
            <Link href="/tareas" className="group block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-300 transition-all">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📝</div>
              <h2 className="text-xl font-bold text-gray-800">Asignar Tareas</h2>
              <p className="text-sm text-gray-500 mt-2">Crea, edita o elimina las tareas de tus alumnos.</p>
            </Link>

            {/* Tarjeta 2: Reportes */}
            <Link href="/reportes" className="group block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-300 transition-all">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚠️</div>
              <h2 className="text-xl font-bold text-gray-800">Reportes de Conducta</h2>
              <p className="text-sm text-gray-500 mt-2">Levanta reportes y mantén el control de la disciplina.</p>
            </Link>

            {/* Tarjeta 3: Alumnos */}
            <Link href="/alumnos" className="group block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-300 transition-all">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
              <h2 className="text-xl font-bold text-gray-800">Ver Alumnos</h2>
              <p className="text-sm text-gray-500 mt-2">Consulta el listado de alumnos y su información general.</p>
            </Link>

          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}