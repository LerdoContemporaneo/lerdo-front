'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from './components/ui/card';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import { 
  userService, studentService, reportService, gradeService, incidentService, attendanceService, homeworkService
} from './services/schoolService';

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({ 
    maestros: 0, alumnos: 0, reportes: 0, grupos: 0, incidencias: 0, asistencias: 0, tareas: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [u, s, r, g, i, a, h] = await Promise.all([
          userService.getAll(),
          studentService.getAll(),
          reportService.getAll(),
          gradeService.getAll(),
          incidentService.getAll(),
          attendanceService.getAll(),
          homeworkService.getAll()
          
        ]);
        setStats({
          maestros: u.filter((x: any) => x.role === 'maestro').length,
          alumnos: s.length,
          reportes: r.length,
          grupos: g.length,
          incidencias: i.length,
          asistencias: a.length,
          tareas: h.length
          
        });
      } catch (e) { console.error("Error cargando stats", e); }
    };
    loadStats();
  }, []);

  const cards = [
    { title: "Alumnos", val: stats.alumnos, path: "/students", color: "text-blue-600" },
    { title: "Docentes", val: stats.maestros, path: "/admin", color: "text-indigo-600" },
    { title: "Grupos", val: stats.grupos, path: "/groups", color: "text-purple-600" },
    { title: "Reportes", val: stats.reportes, path: "/reports", color: "text-orange-600" },
    { title: "Incidencias", val: stats.incidencias, path: "/incidents", color: "text-red-600" },
    { title: "Asistencia Alumnos", val: stats.asistencias, path: "/attendance", color: "text-green-600" },
    { title: "Tareas", val: stats.tareas, path: "/homeworks", color: "text-yellow-600" },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div key={c.title} onClick={() => router.push(c.path)} className="cursor-pointer hover:scale-105 transition-all">
              <Card title={c.title}>
                <div className={`text-4xl font-bold ${c.color}`}>{c.val}</div>
                <p className="text-xs text-gray-400 mt-2">Ver detalles &rarr;</p>
              </Card>
            </div>
          ))}
          {/* Tarjeta extra para asistencia de maestros (solo Admin) */}
          <div onClick={() => router.push('/teacher-attendance')} className="cursor-pointer hover:scale-105 transition-all">
             <Card title="Asistencia Docente">
                <div className="text-4xl font-bold text-gray-600">Ir</div>
                <p className="text-xs text-gray-400 mt-2">Control Administrativo</p>
             </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}