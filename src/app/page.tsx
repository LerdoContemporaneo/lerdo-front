'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from './components/ui/card';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import { userService, studentService, reportService, gradeService } from './services/schoolService';

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({ maestros: 0, alumnos: 0, reportes: 0, grupos: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [u, s, r, g] = await Promise.all([
          userService.getAll(),
          studentService.getAll(),
          reportService.getAll(),
          gradeService.getAll()
        ]);
        setStats({
          maestros: u.filter((x: any) => x.role === 'maestro').length,
          alumnos: s.length,
          reportes: r.length,
          grupos: g.length
        });
      } catch (e) { console.error("Error al cargar stats"); }
    };
    loadStats();
  }, []);

  const statCards = [
    { title: "Docentes", value: stats.maestros, path: "/admin", color: "text-blue-600" },
    { title: "Alumnos", value: stats.alumnos, path: "/students", color: "text-green-600" },
    { title: "Grupos", value: stats.grupos, path: "/groups", color: "text-purple-600" },
    { title: "Reportes", value: stats.reportes, path: "/reports", color: "text-red-600" },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div 
              key={card.title}
              onClick={() => router.push(card.path)} 
              className="cursor-pointer transform hover:scale-105 transition-all"
            >
              <Card title={card.title}>
                <div className={`text-4xl font-bold ${card.color}`}>{card.value}</div>
                <p className="text-xs text-gray-400 mt-1">Click para ver detalle</p>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800">Acceso Rápido</h3>
            <p className="text-sm text-blue-600">Bienvenido al panel de control CELC. Utiliza las tarjetas superiores para navegar.</p>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}